"""Shared exam model, DynamoDB mapping, access checks, and discovery queries."""

import copy
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from certification_utils import Certification, certification_from_dynamodb
from content_ids import resolve_content_id
from query_dtos import ExamQueryDTO, ExamQueryType, ExamStatus
from shared_utils import (
    ExamNotFoundError, Key, NotAuthenticatedError, Permission, User,
    check_authorization, decode_offset, encode_offset, get_dynamodb_item, get_dynamodb_table,
    html_to_text, query_dynamodb_items, query_dynamodb_table, user_from_dynamodb, verify_authorization,
)


@dataclass(slots=True)
class Exam:
    id: str
    owner_id: str
    title: str
    user_id: str
    user_slug: str | None
    user_name: str | None
    certification_id: str | None
    certification_name: str | None
    difficulty: str
    language: str

    def get_user(self) -> User | None:
        if self.user_name:
            return user_from_dynamodb({
                "id": self.user_id,
                "name": self.user_name,
                "username": self.user_slug,
                "created_at": 0,
            })
        return None

    def get_certification(self) -> "Certification | None":
        if self.certification_id and self.certification_name:
            return certification_from_dynamodb({
                "id": self.certification_id,
                "name": self.certification_name,
                "image_filename": self.certification_image_filename,
                "provider": "",
                "description": "",
                "category": self.category,
                "level": "other",
                "created_at": 0,
            })
        return None

    description: str
    category: str
    preview: str | None
    tags: list[str]
    status: ExamStatus
    comment: str | None
    rating: int
    likes_count: int
    dislikes_count: int
    image_filename: str | None
    redirect_to: str | None
    comments_count: int
    created_at: int
    updated_at: int | None
    published_at: int | None
    questions_count: int
    offset: str | None
    exam_code: str | None = None
    duration_minutes: int | None = None
    certification_image_filename: str | None = None


def exam_from_dynamodb(d_item: dict[str, Any]) -> Exam:
    owner_id = d_item["user_id"]
    certification_id = d_item.get("certification_id")
    if d_item.get("certification_slug"):
        try:
            UUID(certification_id or "")
        except ValueError:
            pass
        else:
            certification_id = d_item["certification_slug"]
    description = html_to_text(d_item.get("description", d_item.get("content", "")))[:500]
    return Exam(
        id=d_item["id"],
        owner_id=owner_id,
        title=d_item["title"],
        user_id=owner_id,
        user_slug=d_item.get("user_slug"),
        user_name=d_item.get("user_name"),
        certification_id=certification_id,
        exam_code=d_item.get("exam_code"),
        duration_minutes=int(d_item["duration_minutes"]) if d_item.get("duration_minutes") is not None else None,
        certification_name=d_item.get("certification_name"),
        certification_image_filename=d_item.get("certification_image_filename"),
        difficulty=d_item.get("difficulty", "intermediate"),
        language=d_item.get("language", "en"),
        description=description,
        category=d_item.get("category", "other"),
        preview=d_item.get("preview"),
        tags=d_item.get("tags", []),
        status=d_item["status"],
        comment=d_item.get("comment"),
        rating=d_item["rating_sk"],
        likes_count=d_item.get("likes_count", 0),
        dislikes_count=d_item.get("dislikes_count", 0),
        image_filename=d_item.get("image_filename"),
        redirect_to=d_item.get("redirect_to"),
        comments_count=d_item.get("comments_count", 0),
        created_at=d_item["created_at"],
        updated_at=d_item.get("updated_at"),
        published_at=d_item.get("published_at"),
        questions_count=int(d_item.get("questions_count", 0)),
        offset=None,
    )


def find_exam(exam_id: str) -> Exam | None:
    item = get_dynamodb_item(f"EXAM#{exam_id}", "META")
    if item and item.get("content_redirect_id"):
        exam_id = resolve_content_id("EXAM", exam_id)
        item = get_dynamodb_item(f"EXAM#{exam_id}", "META")
    if item and item.get("content_id_migration_pending"):
        return None
    return exam_from_dynamodb(item) if item else None


def get_exam(exam_id: str, cur_user: User = None) -> Exam:
    exam = find_exam(exam_id)
    if exam is None:
        raise ExamNotFoundError(f"Post '{exam_id}' not found")
    if exam.status != ExamStatus.PUBLISHED and (
            not cur_user or not check_authorization(cur_user, Permission.READ_NON_PUBLISHED_EXAM, exam)):
        raise ExamNotFoundError(f"Post '{exam_id}' not found")
    return exam


def find_exam_slug_item(slug: str) -> dict[str, Any] | None:
    direct = find_exam(slug)
    if direct:
        return get_dynamodb_item(f"EXAM#{direct.id}", "META")
    resp = query_dynamodb_table(
        index_name="EXAMS_BY_SLUG",
        key_condition_expr=Key("exam_slug").eq(slug),
    )
    for item in resp.get("Items", []):
        if item.get("sk") == "META":
            return item
    return None


def find_exam_by_slug(slug: str) -> Exam | None:
    item = find_exam_slug_item(slug)
    # logger.debug(f"Post by slug: {item}")
    return exam_from_dynamodb(item) if item else None


def find_exam_by_slug_follow_redirects(slug: str) -> Exam | None:
    visited = set()
    current_slug = slug

    while True:
        if current_slug in visited:
            raise RuntimeError("Redirect loop detected")

        visited.add(current_slug)

        item = find_exam_slug_item(current_slug)
        if not item:
            return None

        if item.get("content_redirect_id"):
            return find_exam(item["content_redirect_id"])
        redirect_to = item.get("redirect_to")
        if redirect_to:
            current_slug = redirect_to
            continue

        return exam_from_dynamodb(item)


def get_exams(query_dto: ExamQueryDTO = None, cur_user: User = None) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()
    if query_dto.category and query_dto.tags:
        fetch_page = get_popular_exams if query_dto.type == ExamQueryType.POPULAR else get_latest_exams
        return _get_filtered_exams_by_tags(query_dto, cur_user, fetch_page,
                                           'rating_sk' if query_dto.type == ExamQueryType.POPULAR else 'created_at')
    if query_dto.type == ExamQueryType.POPULAR:
        if query_dto.tags:
            return get_popular_exams_by_tags(query_dto, cur_user)
        return get_popular_exams(query_dto, cur_user)
    if query_dto.tags:
        return get_latest_exams_by_tags(query_dto, cur_user)
    return get_latest_exams(query_dto, cur_user)


def get_latest_exams(query_dto: ExamQueryDTO = None, cur_user: User = None) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()

    if query_dto.status != ExamStatus.PUBLISHED:
        if not cur_user:
            raise NotAuthenticatedError()
        verify_authorization(cur_user, Permission.READ_NON_PUBLISHED_EXAM)

    category_key = (f"EXAM#{query_dto.category}#{query_dto.status}"
                    if query_dto.category else None)
    return query_dynamodb_items(
        query_dto=query_dto,
        index_name=("EXAMS_BY_CATEGORY_STATUS_CREATED_AT" if category_key
                    else "EXAMS_BY_STATUS_CREATED_AT_2"),
        key_condition_expr=(Key("exam_category_status_pk").eq(category_key) if category_key
                            else Key("exam_status_pk").eq(f"EXAM#{query_dto.status}")),
        map_fn=exam_from_dynamodb,
    )


def get_popular_exams(query_dto: ExamQueryDTO = None, cur_user: User = None) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()

    if query_dto.status != ExamStatus.PUBLISHED:
        if not cur_user:
            raise NotAuthenticatedError()
        verify_authorization(cur_user, Permission.READ_NON_PUBLISHED_EXAM)

    category_key = (f"EXAM#{query_dto.category}#{query_dto.status}"
                    if query_dto.category else None)
    return query_dynamodb_items(
        query_dto=query_dto,
        index_name=("EXAMS_BY_CATEGORY_STATUS_RATING" if category_key
                    else "EXAMS_BY_STATUS_RATING"),
        key_condition_expr=(Key("exam_category_status_pk").eq(category_key) if category_key
                            else Key("exam_status_pk").eq(f"EXAM#{query_dto.status}")),
        map_fn=exam_from_dynamodb,
    )


def get_latest_exams_by_tags(query_dto: ExamQueryDTO = None, cur_user: User = None) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()
    if not query_dto.tags:
        return get_latest_exams(query_dto, cur_user)

    if query_dto.status != ExamStatus.PUBLISHED:
        return _get_filtered_exams_by_tags(query_dto, cur_user, get_latest_exams, 'created_at')

    table = get_dynamodb_table()
    query_args = {
        "KeyConditionExpression": Key("pk").eq("EXAM_TAG_COMBO#" + "#".join(sorted(query_dto.tags))),
        "ScanIndexForward": False,
        "Limit": query_dto.limit,
    }
    if query_dto.offset:
        query_args["ExclusiveStartKey"] = decode_offset(query_dto.offset)
    resp = table.query(**query_args)
    combo_items = resp.get("Items", [])
    # logger.debug(combo_items)
    if not combo_items:
        return []

    next_offset = encode_offset(resp.get("LastEvaluatedKey"))

    # Preserve the query order when loading exam metadata.
    exam_ids = list(dict.fromkeys(item["exam_id"] for item in combo_items))
    keys = [{"pk": f"EXAM#{exam_id}", "sk": "META"} for exam_id in exam_ids]
    resp = table.meta.client.batch_get_item(RequestItems={table.name: {"Keys": keys}})
    exam_items = resp["Responses"].get(table.name, [])

    # Maintain original order
    exam_items_map = {item["id"]: item for item in exam_items}
    ordered_exams = [exam_items_map[pid] for pid in exam_ids if pid in exam_items_map]

    exams = [exam_from_dynamodb(item) for item in ordered_exams]
    if exams and next_offset:
        exams[-1].offset = next_offset
    return exams


def get_popular_exams_by_tags(
        query_dto: ExamQueryDTO = None,
        cur_user: User = None,
        or_mode: bool = False
) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()

    if not query_dto.tags:
        return get_popular_exams(query_dto, cur_user)

    return _get_filtered_exams_by_tags(query_dto, cur_user, get_popular_exams, 'rating_sk', or_mode)


def _get_filtered_exams_by_tags(query_dto, cur_user, fetch_page, sort_key, or_mode=False):
    partition_key = "exam_category_status_pk" if query_dto.category else "exam_status_pk"
    partition = f"EXAM#{query_dto.category}#{query_dto.status}" if query_dto.category else f"EXAM#{query_dto.status}"
    # These exams are ordered by a status index, so tag filtering has to
    # happen after each query. Keep following DynamoDB's continuation cursor:
    # a response can stop at the 1 MB page-size limit before any matching
    # exam is encountered.
    page_query = copy.copy(query_dto)
    page_query.limit = max(query_dto.limit * 5, 100)
    page_query.offset = query_dto.offset
    wanted_tags = set(query_dto.tags)
    filtered_exams = []

    while len(filtered_exams) < query_dto.limit:
        exams = fetch_page(page_query, cur_user)
        if not exams:
            break

        for exam in exams:
            exam_tags = set(exam.tags)
            matches = bool(wanted_tags.intersection(exam_tags)) if or_mode \
                else wanted_tags.issubset(exam_tags)
            if not matches:
                continue

            filtered_exams.append(exam)
            if len(filtered_exams) == query_dto.limit:
                exam.offset = encode_offset({
                    "pk": f"EXAM#{exam.id}",
                    "sk": "META",
                    partition_key: partition,
                    sort_key: exam.rating if sort_key == "rating_sk" else exam.created_at,
                })
                return filtered_exams

        page_query.offset = exams[-1].offset
        if not page_query.offset:
            break

    return filtered_exams


def get_latest_exams_by_user(user: User, query_dto: ExamQueryDTO = None, cur_user: User = None) -> list[Exam]:
    if query_dto is None:
        query_dto = ExamQueryDTO()

    if query_dto.status != ExamStatus.PUBLISHED:
        if not cur_user:
            raise NotAuthenticatedError()
        verify_authorization(cur_user, Permission.READ_NON_PUBLISHED_EXAM, user)

    if getattr(user, f"{query_dto.status}_exams_count") == 0:
        return []

    return query_dynamodb_items(
        query_dto=query_dto,
        index_name="EXAMS_BY_USER_STATUS_CREATED_AT_2",
        key_condition_expr=Key("exam_user_status_pk").eq(f"EXAM#{user.id}#{query_dto.status}"),
        map_fn=exam_from_dynamodb,
    )
