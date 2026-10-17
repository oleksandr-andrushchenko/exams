from dataclasses import asdict, dataclass, field, replace
from typing import Any
from hashlib import sha256

from content_ids import make_content_id, resolve_content_id

from query_dtos import ExamStatus, QuestionQueryDTO, QuestionStatus

from shared_utils import (
    Key,
    NotAuthenticatedError,
    check_authorization,
    decode_offset,
    encode_offset,
    Permission,
    User,
    UserStatus,
    UserBannedError,
    add_dynamodb_delete_transact,
    add_dynamodb_put_transact,
    add_dynamodb_update_transact,
    dynamodb_transact_write,
    get_dynamodb_item,
    get_dynamodb_table,
    utc_now,
    to_kebab_case,
    verify_authorization,
)


@dataclass(slots=True)
class Question:
    id: str
    exam_id: str
    owner_id: str
    title: str
    choices: list[dict]
    created_at: int
    updated_at: int | None
    reference_urls: list[str] = field(default_factory=list)
    status: QuestionStatus = QuestionStatus.UNPUBLISHED
    comment: str | None = None
    offset: str | None = None
    exam_title: str | None = None


def question_from_dynamodb(item: dict[str, Any]) -> Question:
    choices = [
        {
            "title": choice["title"],
            "explanation": choice.get("explanation") or choice.get("description", ""),
            "is_correct": bool(choice.get("is_correct", False)),
        }
        for choice in item.get("choices", [])
    ]
    return Question(
        id=item["id"],
        exam_id=item["exam_id"],
        owner_id=item["owner_id"],
        title=item["title"],
        choices=choices,
        reference_urls=item.get("reference_urls") or [],
        created_at=int(item["created_at"]),
        updated_at=item.get("updated_at"),
        status=QuestionStatus(item.get("status", QuestionStatus.UNPUBLISHED)),
        comment=item.get("comment"),
        exam_title=item.get("exam_title"),
    )


def find_question(exam_id: str, question_id: str) -> Question | None:
    exam_id = resolve_content_id("EXAM", exam_id)
    question_id = resolve_content_id("QUESTION", question_id)
    item = get_dynamodb_item(f"EXAM#{exam_id}", f"QUESTION#{question_id}")
    return question_from_dynamodb(item) if item else None


def find_question_by_id(question_id: str) -> Question | None:
    question_id = resolve_content_id("QUESTION", question_id)
    locator = get_dynamodb_item(f"QUESTION#{question_id}", "META")
    if not locator:
        return None
    question_item = get_dynamodb_item(locator["question_pk"], locator["question_sk"])
    return question_from_dynamodb(question_item) if question_item else None


def find_question_by_slug(exam_id: str, slug: str) -> Question | None:
    exam_id = resolve_content_id("EXAM", exam_id)
    alias = get_dynamodb_item(f"EXAM#{exam_id}", "QUESTION_SLUG#" + sha256(slug.encode()).hexdigest())
    if alias:
        return find_question_by_id(alias["question_id"])
    direct = find_question(exam_id, slug)
    if direct:
        return direct
    params = {"KeyConditionExpression": Key("pk").eq(f"EXAM#{exam_id}") & Key("sk").begins_with("QUESTION#")}
    while True:
        response = get_dynamodb_table().query(**params)
        for item in response.get("Items", []):
            if (item.get("slug") or to_kebab_case(item["title"])) == slug:
                return question_from_dynamodb(item)
        if not response.get("LastEvaluatedKey"):
            return None
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def get_question_by_id(question_id: str) -> Question:
    question = find_question_by_id(question_id)
    if question is None:
        raise LookupError(f"Question '{question_id}' not found")
    return question


def get_question(exam_id: str, question_id: str) -> Question:
    question = find_question(exam_id, question_id)
    if question is None:
        raise LookupError(f"Question '{question_id}' not found")
    return question


def get_questions(exam_id: str) -> list[Question]:
    exam_id = resolve_content_id("EXAM", exam_id)
    table = get_dynamodb_table()
    params = {
        "KeyConditionExpression": Key("pk").eq(f"EXAM#{exam_id}") & Key("sk").begins_with("QUESTION#"),
        "ConsistentRead": True,
    }
    questions = []
    while True:
        response = table.query(**params)
        questions.extend(question_from_dynamodb(item) for item in response.get("Items", []))
        if not response.get("LastEvaluatedKey"):
            return questions
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def get_question_listing(query: QuestionQueryDTO, user: User | None = None) -> list[Question]:
    if query.status != QuestionStatus.PUBLISHED:
        if user is None:
            raise NotAuthenticatedError()
        verify_authorization(user, Permission.READ_NON_PUBLISHED_QUESTION)
    params = {
        "KeyConditionExpression": Key("pk").eq(f"QUESTIONS#{query.status}"),
        "Limit": query.limit,
        "ScanIndexForward": False,
        "ConsistentRead": True,
    }
    if query.offset:
        params["ExclusiveStartKey"] = decode_offset(query.offset)
    response = get_dynamodb_table().query(**params)
    questions = [question_from_dynamodb(item) for item in response.get("Items", [])]
    if questions and response.get("LastEvaluatedKey"):
        questions[-1].offset = encode_offset(response["LastEvaluatedKey"])
    return questions


def can_read_question(question: Question, user: User | None = None, exam=None) -> bool:
    return (question.status == QuestionStatus.PUBLISHED or bool(user and (
        (exam and user.id == exam.owner_id)
        or check_authorization(user, Permission.READ_NON_PUBLISHED_QUESTION, question)
    )))


def verify_question_access(question: Question, user: User | None = None, exam=None) -> None:
    if not can_read_question(question, user, exam):
        raise LookupError(f"Question '{question.id}' not found")


def question_listing_item(question: Question) -> dict[str, Any]:
    return {key: value for key, value in asdict(question).items()
            if key not in {"choices", "reference_urls", "offset", "slug"}}


def add_question_status_transacts(transacts, question, status, comment=None):
    status = QuestionStatus(status)
    updated = replace(question, status=status, comment=comment, updated_at=utc_now(), offset=None)
    add_dynamodb_update_transact(transacts, (f"EXAM#{question.exam_id}", f"QUESTION#{question.id}"),
                                {"status": status, "comment": comment, "updated_at": updated.updated_at,
                                 "exam_title": question.exam_title},
                                add_updated_at=False)
    update = transacts[-1]["Update"]
    update["ConditionExpression"] = (
        "attribute_exists(pk) AND (attribute_not_exists(#old_status) OR #old_status = :old_status) "
        "AND (attribute_not_exists(#old_updated) OR #old_updated = :old_updated)"
    )
    update["ExpressionAttributeNames"].update({"#old_status": "status", "#old_updated": "updated_at"})
    update["ExpressionAttributeValues"].update({":old_status": question.status, ":old_updated": question.updated_at})
    if question.status != status:
        add_dynamodb_delete_transact(transacts, (f"QUESTIONS#{question.status}", f"{question.created_at}#{question.id}"))
    add_dynamodb_put_transact(transacts, (f"QUESTIONS#{status}", f"{question.created_at}#{question.id}"),
                             question_listing_item(updated))
    return updated


def synchronize_exam_questions(exam, status):
    """Move questions and their discovery records in bounded, retryable transactions."""
    lock = []
    started_at = utc_now()
    add_dynamodb_update_transact(lock, (f"EXAM#{exam.id}", "META"),
                                {"question_status_sync_pending": True, "question_status_sync_started_at": started_at},
                                add_updated_at=False)
    claim = lock[-1]["Update"]
    claim["ConditionExpression"] = (
        "attribute_not_exists(#pending) OR #pending = :false OR #started < :expired"
    )
    claim["ExpressionAttributeNames"].update({"#pending": "question_status_sync_pending",
                                            "#started": "question_status_sync_started_at"})
    claim["ExpressionAttributeValues"].update({":false": False, ":expired": started_at - 120_000})
    dynamodb_transact_write(lock)
    transacts = []
    for question in get_questions(exam.id):
        if len(transacts) > 96:
            dynamodb_transact_write(transacts)
            transacts = []
        add_question_status_transacts(transacts, replace(question, exam_title=exam.title), QuestionStatus(status))
    if transacts:
        dynamodb_transact_write(transacts)


def complete_question_status_sync(exam):
    transacts = []
    add_dynamodb_update_transact(transacts, (f"EXAM#{exam.id}", "META"),
                                {"question_status_sync_pending": False}, add_updated_at=False)
    dynamodb_transact_write(transacts)


def update_question_status(exam, question, dto, user):
    verify_authorization(user, Permission.UPDATE_QUESTION_STATUS)
    if user.status == UserStatus.BANNED:
        raise UserBannedError()
    if dto.status == QuestionStatus.PUBLISHED and exam.status != ExamStatus.PUBLISHED:
        raise ValueError("Publish the parent exam before publishing an individual question")
    transacts = []
    updated = add_question_status_transacts(transacts, question, dto.status, dto.comment)
    if dto.status == QuestionStatus.PUBLISHED:
        transacts.append({"ConditionCheck": {
            "TableName": get_dynamodb_table().name,
            "Key": {"pk": f"EXAM#{exam.id}", "sk": "META"},
            "ConditionExpression": "#status = :published AND (attribute_not_exists(#pending) OR #pending = :false)",
            "ExpressionAttributeNames": {"#status": "status", "#pending": "question_status_sync_pending"},
            "ExpressionAttributeValues": {":published": ExamStatus.PUBLISHED, ":false": False},
        }})
    dynamodb_transact_write(transacts)
    return updated


def question_without_answers(question: Question) -> dict[str, Any]:
    result = asdict(question)
    result.pop("reference_urls", None)
    result["choices"] = [
        {"title": choice["title"]}
        for choice in question.choices
    ]
    return result


def create_question(exam, dto, user: User) -> Question:
    verify_authorization(user, Permission.CREATE_QUESTION, exam)
    if user.status == UserStatus.BANNED:
        raise PermissionError("BANNED")
    now = utc_now()
    question_id = make_content_id(dto.title, fallback="question")
    question = Question(question_id, exam.id, user.id, dto.title,
                        dto.choices, now, None, dto.reference_urls, exam_title=exam.title)
    item = {
        **asdict(question),
        "question": True,
    }
    item.pop("slug", None)
    list_item = question_listing_item(question)
    transacts = []
    add_dynamodb_put_transact(transacts, (f"EXAM#{exam.id}", f"QUESTION#{question.id}"), item, new_pk_only=True)
    add_dynamodb_put_transact(transacts, (f"QUESTION#{question.id}", "META"), {
        "question_pk": f"EXAM#{exam.id}",
        "question_sk": f"QUESTION#{question.id}",
    }, new_pk_only=True)
    add_dynamodb_put_transact(
        transacts,
        (f"QUESTIONS#{question.status}", f"{now}#{question.id}"),
        list_item,
        new_pk_only=True,
    )
    add_dynamodb_update_transact(
        transacts,
        (f"EXAM#{exam.id}", "META"),
        deltas={"questions_count": 1},
    )
    dynamodb_transact_write(transacts)
    return question


def update_question(question: Question, dto, user: User) -> Question:
    verify_authorization(user, Permission.UPDATE_QUESTION, question)
    changes = dto.get_changes(question)
    if not changes:
        return question
    changes["updated_at"] = utc_now()
    changes["status"] = QuestionStatus.UNPUBLISHED
    changes["comment"] = None
    transacts = []
    add_dynamodb_update_transact(
        transacts,
        (f"EXAM#{question.exam_id}", f"QUESTION#{question.id}"),
        changes=changes,
        add_updated_at=False,
    )
    updated = replace(question, **changes)
    update = transacts[0]["Update"]
    update["ConditionExpression"] = (
        "attribute_exists(pk) AND (attribute_not_exists(#old_status) OR #old_status = :old_status) "
        "AND (attribute_not_exists(#old_updated) OR #old_updated = :old_updated)"
    )
    update["ExpressionAttributeNames"].update({"#old_status": "status", "#old_updated": "updated_at"})
    update["ExpressionAttributeValues"].update({":old_status": question.status, ":old_updated": question.updated_at})
    if question.status != QuestionStatus.UNPUBLISHED:
        add_dynamodb_delete_transact(transacts, (f"QUESTIONS#{question.status}", f"{question.created_at}#{question.id}"))
    updated.status = QuestionStatus.UNPUBLISHED
    updated.comment = None
    add_dynamodb_put_transact(transacts, (f"QUESTIONS#{updated.status}", f"{question.created_at}#{question.id}"),
                             question_listing_item(updated))
    dynamodb_transact_write(transacts)
    for key, value in changes.items():
        if hasattr(question, key):
            setattr(question, key, value)
    return question


def delete_question(question: Question, user: User) -> None:
    verify_authorization(user, Permission.UPDATE_QUESTION, question)
    exam_item = get_dynamodb_item(f"EXAM#{question.exam_id}", "META") or {}
    if int(exam_item.get("questions_count", 0)) <= 1:
        raise ValueError("An exam must have at least one question")
    transacts = []
    add_dynamodb_delete_transact(transacts, (f"EXAM#{question.exam_id}", f"QUESTION#{question.id}"))
    add_dynamodb_delete_transact(transacts, (f"QUESTION#{question.id}", "META"))
    add_dynamodb_delete_transact(transacts, (f"QUESTIONS#{question.status}", f"{question.created_at}#{question.id}"))
    add_dynamodb_delete_transact(transacts, ("QUESTIONS", f"{question.created_at}#{question.id}"))
    add_dynamodb_update_transact(
        transacts,
        (f"EXAM#{question.exam_id}", "META"),
        deltas={"questions_count": -1},
    )
    dynamodb_transact_write(transacts)
