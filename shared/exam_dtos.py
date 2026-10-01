import re
from dataclasses import dataclass
from enum import StrEnum

from basic_dtos import BaseDTO, UNSET
from query_dtos import ExamStatus


def _validate_tags(values):
    from shared_utils import to_kebab_case
    result = list(dict.fromkeys(to_kebab_case(value) for value in (values or [])))
    if not 1 <= len(result) <= 3:
        raise ValueError("tags must contain between 1 and 3 items")
    if any(not 2 <= len(value) <= 40 for value in result):
        raise ValueError("each tag must contain between 2 and 40 characters")
    return result


def _validate_title(value):
    if not 2 <= len(value) <= 500:
        raise ValueError("title must contain between 10 and 500 characters")


def _validate_description(value):
    value = value.strip()
    if not 10 <= len(value) <= 500:
        raise ValueError("description must contain between 10 and 500 characters")
    if re.search(r"<[^>]+>", value):
        raise ValueError("description must be plain text")


def _validate_comment_text(value):
    if not 1 <= len(value) <= 5_000:
        raise ValueError("text must contain between 1 and 5000 characters")


@dataclass(slots=True)
class ExamDTO(BaseDTO):
    title: str
    description: str
    tags: list[str]
    category: str = "other"
    certification_id: str | None = None
    image_filename: str | None = None
    difficulty: str = "medium"
    language: str = "en"

    def __post_init__(self):
        _validate_title(self.title)
        self.description = self.description.strip()
        _validate_description(self.description)
        self.tags = _validate_tags(self.tags)
        self.difficulty = self.difficulty.strip().lower()
        self.language = self.language.strip().lower()
        if self.difficulty not in {"beginner", "intermediate", "advanced", "professional", "medium"}:
            raise ValueError("invalid difficulty")
        if not self.language or len(self.language) > 10:
            raise ValueError("invalid language")


@dataclass(slots=True)
class UpdateExamDTO(BaseDTO):
    title: str | None | object = UNSET
    description: str | None | object = UNSET
    tags: list[str] | None | object = UNSET
    category: str | None | object = UNSET
    certification_id: str | None | object = UNSET
    difficulty: str | object = UNSET
    language: str | object = UNSET
    image_filename: str | None | object = UNSET

    def __post_init__(self):
        if self.title is not UNSET:
            if self.title is None:
                raise ValueError("title must contain between 10 and 500 characters")
            _validate_title(self.title)
        if self.description is not UNSET:
            if self.description is None:
                raise ValueError("description must contain between 10 and 500 characters")
            self.description = self.description.strip()
            _validate_description(self.description)
        if self.tags is not UNSET:
            self.tags = _validate_tags(self.tags)
        if self.category is not UNSET:
            if self.category is None:
                raise ValueError("category is required")
            from validation import validate_category_slug
            self.category = validate_category_slug(self.category)
        if self.difficulty is not UNSET:
            if self.difficulty not in {"beginner", "intermediate", "advanced", "professional", "medium"}:
                raise ValueError("invalid difficulty")
        if self.language is not UNSET:
            if not isinstance(self.language, str) or not 2 <= len(self.language) <= 10:
                raise ValueError("invalid language")


@dataclass(slots=True)
class UpdateCategoryDTO(BaseDTO):
    name: str | object = UNSET
    slug: str | object = UNSET
    description: str | object = UNSET
    image_action: str | object = UNSET
    image_filename: str | None | object = UNSET

    def __post_init__(self):
        if self.name is not UNSET:
            if self.name is None:
                raise ValueError("name must contain between 2 and 80 characters")
            self.name = self.name.strip()
            if not 2 <= len(self.name) <= 80:
                raise ValueError("name must contain between 2 and 80 characters")
        if self.slug is not UNSET:
            raise ValueError("category slug is immutable")
        if self.description is not UNSET:
            self.description = self.description.strip()
            if not 10 <= len(self.description) <= 500:
                raise ValueError("description must contain between 10 and 500 characters")
        if self.image_action is not UNSET and self.image_action not in {"delete", "replace", "keep"}:
            raise ValueError("invalid image action")


@dataclass(slots=True)
class UpdateTagDTO(BaseDTO):
    name: str | None | object = UNSET
    image_action: str | None | object = UNSET
    image_filename: str | None | object = UNSET

    def __post_init__(self):
        if self.name is not UNSET:
            if self.name is None or not 2 <= len(self.name) <= 40:
                raise ValueError("name must contain between 2 and 40 characters")
        if self.image_action is not UNSET and self.image_action not in (None, "delete", "replace", "keep"):
            raise ValueError("invalid image action")


@dataclass(slots=True)
class UpdateExamStatusDTO(BaseDTO):
    status: ExamStatus
    comment: str | None = None

    def __post_init__(self):
        self.status = ExamStatus(self.status)
        if self.status == ExamStatus.REJECTED and not self.comment:
            raise ValueError("Comment is required when rejecting an exam")


class ExamImpressionAction(StrEnum):
    LIKE = "like"
    DISLIKE = "dislike"


@dataclass(slots=True)
class UpdateExamImpressionDTO(BaseDTO):
    action: ExamImpressionAction

    def __post_init__(self):
        self.action = ExamImpressionAction(self.action)


@dataclass(slots=True)
class ExamCommentDTO(BaseDTO):
    text: str

    def __post_init__(self):
        _validate_comment_text(self.text)


@dataclass(slots=True)
class UpdateExamCommentDTO(BaseDTO):
    text: str | None | object = UNSET

    def __post_init__(self):
        if self.text is not UNSET:
            if self.text is None:
                raise ValueError("text must contain between 1 and 5000 characters")
            _validate_comment_text(self.text)


class ExamCommentImpressionAction(StrEnum):
    LIKE = "like"
    DISLIKE = "dislike"


@dataclass(slots=True)
class UpdateExamCommentImpressionDTO(BaseDTO):
    action: ExamCommentImpressionAction

    def __post_init__(self):
        self.action = ExamCommentImpressionAction(self.action)
