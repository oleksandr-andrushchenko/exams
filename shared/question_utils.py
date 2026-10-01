from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4

from shared_utils import (Key, Permission, User, UserStatus, get_dynamodb_item, get_dynamodb_table,
                          to_kebab_case, utc_now, verify_authorization)


@dataclass(slots=True)
class Question:
    id: str
    exam_id: str
    owner_id: str
    slug: str
    title: str
    description: str
    choices: list[dict]
    created_at: int
    updated_at: int | None


def question_from_dynamodb(item: dict[str, Any]) -> Question:
    return Question(
        id=item["id"],
        exam_id=item["exam_id"],
        owner_id=item["owner_id"],
        title=item["title"],
        slug=item.get("slug") or to_kebab_case(item["title"]),
        description=item.get("description", item.get("explanation", "")),
        choices=item.get("choices", []),
        created_at=int(item["created_at"]),
        updated_at=item.get("updated_at"),
    )


def find_question(exam_id: str, question_id: str) -> Question | None:
    item = get_dynamodb_item(f"EXAM#{exam_id}", f"QUESTION#{question_id}")
    return question_from_dynamodb(item) if item else None


def find_question_by_id(question_id: str) -> Question | None:
    response = get_dynamodb_table().scan(FilterExpression="id = :question_id",
                                         ExpressionAttributeValues={":question_id": question_id})
    item = next(iter(response.get("Items", [])), None)
    return question_from_dynamodb(item) if item else None


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
    response = get_dynamodb_table().query(KeyConditionExpression=Key("pk").eq(f"EXAM#{exam_id}"))
    return [question_from_dynamodb(item) for item in response.get("Items", [])
            if str(item.get("sk", "")).startswith("QUESTION#")]


def get_all_questions(limit: int = 100) -> list[Question]:
    response = get_dynamodb_table().scan(Limit=limit)
    return [question_from_dynamodb(item) for item in response.get("Items", []) if item.get("question")]


def create_question(exam, dto, user: User) -> Question:
    verify_authorization(user, Permission.CREATE_QUESTION, exam)
    if user.status == UserStatus.BANNED:
        raise PermissionError("BANNED")
    now = utc_now()
    question = Question(str(uuid4()), exam.id, user.id, to_kebab_case(dto.title), dto.title, dto.description,
                        dto.choices, now, None)
    item = {"pk": f"EXAM#{exam.id}", "sk": f"QUESTION#{question.id}", **asdict(question), "question": True}
    get_dynamodb_table().put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")
    return question


def update_question(question: Question, dto, user: User) -> Question:
    verify_authorization(user, Permission.UPDATE_QUESTION, question)
    changes = dto.get_changes(question)
    if not changes:
        return question
    if "title" in changes:
        changes["slug"] = to_kebab_case(changes["title"])
    changes["updated_at"] = utc_now()
    get_dynamodb_table().update_item(
        Key={"pk": f"EXAM#{question.exam_id}", "sk": f"QUESTION#{question.id}"},
        UpdateExpression="SET " + ", ".join(f"#{key} = :{key}" for key in changes),
        ExpressionAttributeNames={f"#{key}": key for key in changes},
        ExpressionAttributeValues={f":{key}": value for key, value in changes.items()},
    )
    for key, value in changes.items():
        setattr(question, key, value)
    return question


def delete_question(question: Question, user: User) -> None:
    verify_authorization(user, Permission.UPDATE_QUESTION, question)
    if len(get_questions(question.exam_id)) <= 1:
        raise ValueError("An exam must have at least one question")
    get_dynamodb_table().delete_item(Key={"pk": f"EXAM#{question.exam_id}", "sk": f"QUESTION#{question.id}"})
