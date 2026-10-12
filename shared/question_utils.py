from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4

from shared_utils import (
    Key,
    Permission,
    User,
    UserStatus,
    add_dynamodb_delete_transact,
    add_dynamodb_put_transact,
    add_dynamodb_update_transact,
    dynamodb_transact_write,
    get_dynamodb_item,
    get_dynamodb_table,
    to_kebab_case,
    utc_now,
    verify_authorization,
)


@dataclass(slots=True)
class Question:
    id: str
    exam_id: str
    owner_id: str
    slug: str
    title: str
    choices: list[dict]
    created_at: int
    updated_at: int | None


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
        slug=item.get("slug") or to_kebab_case(item["title"]),
        choices=choices,
        created_at=int(item["created_at"]),
        updated_at=item.get("updated_at"),
    )


def find_question(exam_id: str, question_id: str) -> Question | None:
    item = get_dynamodb_item(f"EXAM#{exam_id}", f"QUESTION#{question_id}")
    return question_from_dynamodb(item) if item else None


def find_question_by_id(question_id: str) -> Question | None:
    locator = get_dynamodb_item(f"QUESTION#{question_id}", "META")
    if not locator:
        return None
    question_item = get_dynamodb_item(locator["question_pk"], locator["question_sk"])
    return question_from_dynamodb(question_item) if question_item else None


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
    table = get_dynamodb_table()
    params = {
        "KeyConditionExpression": Key("pk").eq(f"EXAM#{exam_id}") & Key("sk").begins_with("QUESTION#"),
    }
    questions = []
    while True:
        response = table.query(**params)
        questions.extend(question_from_dynamodb(item) for item in response.get("Items", []))
        if not response.get("LastEvaluatedKey"):
            return questions
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def get_all_questions(limit: int = 100) -> list[Question]:
    response = get_dynamodb_table().query(
        KeyConditionExpression=Key("pk").eq("QUESTIONS"),
        Limit=limit,
        ScanIndexForward=False,
    )
    return [question_from_dynamodb(item) for item in response.get("Items", [])]


def question_without_answers(question: Question) -> dict[str, Any]:
    result = asdict(question)
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
    question = Question(str(uuid4()), exam.id, user.id, to_kebab_case(dto.title), dto.title,
                        dto.choices, now, None)
    item = {
        **asdict(question),
        "question": True,
    }
    list_item = {key: value for key, value in asdict(question).items() if key != "choices"}
    transacts = []
    add_dynamodb_put_transact(transacts, (f"EXAM#{exam.id}", f"QUESTION#{question.id}"), item, new_pk_only=True)
    add_dynamodb_put_transact(transacts, (f"QUESTION#{question.id}", "META"), {
        "question_pk": f"EXAM#{exam.id}",
        "question_sk": f"QUESTION#{question.id}",
    }, new_pk_only=True)
    add_dynamodb_put_transact(
        transacts,
        ("QUESTIONS", f"{now}#{question.id}"),
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
    if "title" in changes:
        changes["slug"] = to_kebab_case(changes["title"])
    changes["updated_at"] = utc_now()
    transacts = []
    add_dynamodb_update_transact(
        transacts,
        (f"EXAM#{question.exam_id}", f"QUESTION#{question.id}"),
        changes=changes,
        add_updated_at=False,
    )
    list_changes = {
        key: value
        for key, value in changes.items()
        if key in {"title", "slug", "updated_at"}
    }
    add_dynamodb_update_transact(
        transacts,
        ("QUESTIONS", f"{question.created_at}#{question.id}"),
        changes=list_changes,
        add_updated_at=False,
    )
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
    add_dynamodb_delete_transact(transacts, ("QUESTIONS", f"{question.created_at}#{question.id}"))
    add_dynamodb_update_transact(
        transacts,
        (f"EXAM#{question.exam_id}", "META"),
        deltas={"questions_count": -1},
    )
    dynamodb_transact_write(transacts)
