import base64
import json
import math
import re
from dataclasses import asdict, dataclass, field
from decimal import Decimal
from enum import StrEnum

from validation import validate_category_slug


@dataclass(slots=True)
class BaseQueryDTO:
    DEFAULT_OFFSET = None
    DEFAULT_LIMIT = 40

    offset: str | None = DEFAULT_OFFSET
    limit: int = DEFAULT_LIMIT

    def __post_init__(self):
        self.limit = _limit(self.limit)

    def get_dict(self, rewrite=None):
        result = asdict(self)
        result.update(rewrite or {})
        return {k: v.value if isinstance(v, StrEnum) else v for k, v in result.items()}

    def has_params(self):
        return self.offset is not None or self.limit != self.DEFAULT_LIMIT


def _limit(value) -> int:
    try:
        value = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("limit must be an integer") from exc
    if not 1 <= value <= BaseQueryDTO.DEFAULT_LIMIT and value != 1000:
        raise ValueError("limit must be between 1 and " + str(BaseQueryDTO.DEFAULT_LIMIT))
    return value


class UserQueryType(StrEnum):
    LATEST = "latest"
    POPULAR = "popular"


class UserStatus(StrEnum):
    ACTIVE = "active"
    BANNED = "banned"


@dataclass(slots=True)
class UserQueryDTO(BaseQueryDTO):
    DEFAULT_TYPE = UserQueryType.LATEST
    DEFAULT_STATUS = UserStatus.ACTIVE

    type: UserQueryType = UserQueryType.LATEST
    status: UserStatus = UserStatus.ACTIVE

    def __post_init__(self):
        BaseQueryDTO.__post_init__(self)
        self.type = UserQueryType(self.type)
        self.status = UserStatus(self.status)

    def has_params(self):
        return BaseQueryDTO.has_params(self) or self.type != self.DEFAULT_TYPE or self.status != self.DEFAULT_STATUS


class TagQueryType(StrEnum):
    LATEST = "latest"
    POPULAR = "popular"


@dataclass(slots=True)
class TagQueryDTO(BaseQueryDTO):
    DEFAULT_TYPE = TagQueryType.LATEST

    type: TagQueryType = DEFAULT_TYPE
    prefix: str | None = None

    def __post_init__(self):
        BaseQueryDTO.__post_init__(self)
        self.type = TagQueryType(self.type)
        if self.prefix is not None and not 1 <= len(self.prefix) <= 40:
            raise ValueError("prefix must contain between 1 and 40 characters")

    def has_params(self):
        return BaseQueryDTO.has_params(self) or self.type != self.DEFAULT_TYPE or self.prefix is not None


@dataclass(slots=True)
class RelatedExamQueryDTO(BaseQueryDTO):
    limit: int = 6

    def __post_init__(self):
        BaseQueryDTO.__post_init__(self)
        if self.offset is None:
            return
        try:
            cursor = json.loads(base64.b64decode(self.offset, altchars=b'-_', validate=True).decode())
        except (ValueError, UnicodeError, TypeError, RecursionError) as exc:
            raise ValueError("offset must be a valid related-exam cursor") from exc
        if (not isinstance(cursor, dict) or set(cursor) != {"pk", "sk"}
                or not isinstance(cursor["pk"], str) or not isinstance(cursor["sk"], str)
                or not re.fullmatch(r"RELATED_EXAMS#[^#]+", cursor["pk"])
                or not re.fullmatch(r"EXAM#[0-9]+#[^#]+", cursor["sk"])
                or len(cursor["pk"]) > 2048 or len(cursor["sk"]) > 1024):
            raise ValueError("offset must be a valid related-exam cursor")


class ExamQueryType(StrEnum):
    LATEST = "latest"
    POPULAR = "popular"


class ExamStatus(StrEnum):
    UNPUBLISHED = "unpublished"
    PUBLISHED = "published"
    REJECTED = "rejected"


@dataclass(slots=True)
class ExamQueryDTO(BaseQueryDTO):
    DEFAULT_TYPE = ExamQueryType.LATEST
    DEFAULT_STATUS = ExamStatus.PUBLISHED

    tags: list[str] = field(default_factory=list)
    type: ExamQueryType = ExamQueryType.LATEST
    status: ExamStatus = ExamStatus.PUBLISHED
    category: str | None = None

    def __post_init__(self):
        BaseQueryDTO.__post_init__(self)
        self.type = ExamQueryType(self.type)
        self.status = ExamStatus(self.status)
        self.tags = sorted({tag for tag in self.tags if tag})
        if self.category == "":
            self.category = None
        if self.category is not None:
            self.category = validate_category_slug(self.category)

    def has_params(self):
        return BaseQueryDTO.has_params(self) or bool(
            self.tags) or self.category is not None or self.type != self.DEFAULT_TYPE or self.status != self.DEFAULT_STATUS


@dataclass(slots=True)
class ExamCommentQueryDTO(BaseQueryDTO):
    pass


@dataclass(slots=True)
class ExamListingQueryDTO(ExamQueryDTO):
    """Feed cursors match the selected index; profile cursors use ExamQueryDTO."""

    def __post_init__(self):
        ExamQueryDTO.__post_init__(self)
        if self.offset is None:
            return
        try:
            cursor = json.loads(base64.b64decode(self.offset, altchars=b'-_', validate=True).decode())
        except (ValueError, UnicodeError, TypeError, RecursionError) as exc:
            raise ValueError('offset must be a valid pagination cursor') from exc

        sort_key = 'rating_sk' if self.type == ExamQueryType.POPULAR else 'created_at'
        partition_key = 'exam_status_pk'
        partition = f'EXAM#{self.status}'
        relation = False
        if self.category:
            partition_key = 'exam_category_status_pk'
            partition = f'EXAM#{self.category}#{self.status}'
        elif self.tags and self.type == ExamQueryType.LATEST and self.status == ExamStatus.PUBLISHED:
            partition_key = 'pk'
            partition = 'EXAM_TAG_COMBO#' + '#'.join(self.tags)
            relation = True

        expected_keys = {'pk', 'sk'} if partition_key == 'pk' else {'pk', 'sk', partition_key, sort_key}
        valid = isinstance(cursor, dict) and set(cursor) == expected_keys
        if valid:
            valid = cursor[partition_key] == partition
            valid = valid and all(isinstance(cursor[key], str) and not re.search(r'[\ud800-\udfff]', cursor[key]) and
                                  0 < len(cursor[key].encode('utf-8')) <= size
                                  for key, size in (('pk', 2048), ('sk', 1024)))
            if relation:
                valid = valid and isinstance(cursor['sk'], str) and bool(
                    re.fullmatch(r'EXAM#[0-9]+#[^#]+', cursor['sk']))
            else:
                valid = valid and isinstance(cursor['pk'], str) and bool(
                    re.fullmatch(r'EXAM#[^#]+', cursor['pk'])) and cursor['sk'] == 'META'
            if partition_key != 'pk':
                number = cursor[sort_key]
                try:
                    valid = valid and not isinstance(number, bool) and isinstance(number, (int, float)) \
                        and math.isfinite(number)
                    if valid:
                        # DynamoDB numbers have bounded precision and exponent range.
                        decimal = Decimal(str(number))
                        valid = len(decimal.as_tuple().digits) <= 38 and (
                            decimal.is_zero() or -130 <= decimal.adjusted() <= 125)
                except OverflowError:
                    valid = False
                if relation:
                    valid = valid and cursor['pk'] == partition
        if not valid:
            raise ValueError('offset does not match this exam listing, status, or sort order')
