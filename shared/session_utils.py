from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4

from shared_utils import (
    DynamoDBTransactionError,
    Key,
    User,
    add_dynamodb_put_transact,
    add_dynamodb_update_transact,
    build_dynamodb_delete_item_params,
    dynamodb_transact_write,
    get_dynamodb_item,
    get_dynamodb_table,
    get_exam,
    utc_now,
)
from question_utils import get_questions


@dataclass(slots=True)
class ExamSession:
    id: str
    exam_id: str
    user_id: str
    status: str
    total_questions: int
    answered_questions: int
    correct_answers: int
    score: int | None
    started_at: int
    completed_at: int | None
    question_ids: list[str]
    viewed_questions: int


class ActiveExamSessionError(ValueError):
    pass


def session_from_item(item: dict[str, Any]) -> ExamSession:
    return ExamSession(
        id=item.get("session_id") or item["id"],
        exam_id=item["exam_id"],
        user_id=item["user_id"],
        status=item["status"],
        total_questions=int(item["total_questions"]),
        answered_questions=int(item.get("answered_questions", 0)),
        correct_answers=int(item.get("correct_answers", 0)),
        score=item.get("score"),
        started_at=int(item["started_at"]),
        completed_at=item.get("completed_at"),
        question_ids=item.get("question_ids", []),
        viewed_questions=int(item.get("viewed_questions", item.get("answered_questions", 0))),
    )


def _find_session_item(user_id: str, session_id: str) -> dict[str, Any] | None:
    locator = get_dynamodb_item(f"USER#{user_id}", f"EXAM_SESSION_ID#{session_id}")
    if not locator:
        return None
    return get_dynamodb_item(locator["session_pk"], locator["session_sk"])


def get_session(user_id: str, session_id: str) -> ExamSession:
    item = _find_session_item(user_id, session_id)
    if not item:
        raise LookupError(f"Exam session '{session_id}' not found")
    return session_from_item(item)


def get_active_session(user_id: str) -> ExamSession | None:
    pointer = get_dynamodb_item(f"USER#{user_id}", "ACTIVE_EXAM_SESSION")
    if not pointer:
        return None
    item = get_dynamodb_item(pointer["session_pk"], pointer["session_sk"])
    if not item or item.get("status") != "in_progress":
        return None
    return session_from_item(item)


def get_sessions(user_id: str) -> list[ExamSession]:
    response = get_dynamodb_table().query(
        KeyConditionExpression=Key("pk").eq(f"USER#{user_id}") & Key("sk").begins_with("EXAM_SESSION#"),
        ScanIndexForward=False,
    )
    return [session_from_item(item) for item in response.get("Items", [])]


def create_session(exam_id: str, user: User) -> ExamSession:
    if get_active_session(user.id):
        raise ActiveExamSessionError("Complete your active exam before starting another exam")
    get_exam(exam_id, user)
    questions = get_questions(exam_id)
    if not questions:
        raise ValueError("An exam must have at least one question")
    session_id = str(uuid4())
    started_at = utc_now()
    question_ids = [question.id for question in questions]
    session = ExamSession(session_id, exam_id, user.id, "in_progress", len(questions), 0, 0, None, started_at, None,
                          question_ids, 0)
    item = asdict(session)
    item.update({
        "session_id": session.id,
        "pk": f"USER#{user.id}",
        "sk": f"EXAM_SESSION#{started_at}#{session_id}",
        "exam_session": True,
    })
    transacts = []
    add_dynamodb_put_transact(
        transacts,
        (item.pop("pk"), item.pop("sk")),
        item,
        new_pk_only=True,
    )
    add_dynamodb_put_transact(
        transacts,
        (f"USER#{user.id}", f"EXAM_SESSION_ID#{session_id}"),
        {
            "session_pk": f"USER#{user.id}",
            "session_sk": f"EXAM_SESSION#{started_at}#{session_id}",
        },
        new_pk_only=True,
    )
    add_dynamodb_put_transact(
        transacts,
        (f"USER#{user.id}", "ACTIVE_EXAM_SESSION"),
        {
            "session_id": session_id,
            "exam_id": exam_id,
            "session_pk": f"USER#{user.id}",
            "session_sk": f"EXAM_SESSION#{started_at}#{session_id}",
            "started_at": started_at,
        },
        new_pk_only=True,
    )
    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as exc:
        if exc.is_conditional():
            raise ActiveExamSessionError("Complete your active exam before starting another exam") from exc
        raise
    return session


def get_session_answers(session_id: str) -> dict[str, list[int]]:
    response = get_dynamodb_table().query(KeyConditionExpression=Key("pk").eq(f"EXAM_SESSION#{session_id}"))
    return {
        item["question_id"]: [int(index) for index in item.get("choice_indices", [item["choice_index"]]
                                                         if "choice_index" in item else [])]
        for item in response.get("Items", [])
    }


def get_question_result(question, choice_indices: list[int]) -> dict[str, Any]:
    selected = set(choice_indices)
    correct = {index for index, choice in enumerate(question.choices) if choice.get("is_correct")}
    return {
        "is_answered": bool(selected),
        "is_correct": bool(selected) and selected == correct,
        "choices": [
            {
                "choice_index": index,
                "is_correct": bool(choice.get("is_correct")),
                "is_selected": index in selected,
                "explanation": choice.get("explanation") or choice.get("description")
                or ("This is the correct answer." if choice.get("is_correct") else "This is not a correct answer."),
            }
            for index, choice in enumerate(question.choices)
        ],
    }


def answer_question(session: ExamSession, question_id: str, choice_indices: list[int]) -> ExamSession:
    if session.status != "in_progress":
        raise ValueError("exam session is already complete")
    questions = {question.id: question for question in get_questions(session.exam_id)
                 if not session.question_ids or question.id in session.question_ids}
    question = questions.get(question_id)
    if question is None:
        raise LookupError(f"Question '{question_id}' not found")
    if any(not 0 <= choice_index < len(question.choices) for choice_index in choice_indices):
        raise ValueError("choice_indices contains an out-of-range choice")
    correct_choice_indices = {index for index, choice in enumerate(question.choices) if choice.get("is_correct")}
    if len(correct_choice_indices) == 1 and len(choice_indices) > 1:
        raise ValueError("only one choice may be selected for this question")
    table = get_dynamodb_table()
    table.put_item(Item={"pk": f"EXAM_SESSION#{session.id}", "sk": f"QUESTION#{question_id}",
                         "question_id": question_id, "choice_indices": choice_indices})
    answers = get_session_answers(session.id)
    session.viewed_questions = len(answers)
    session.answered_questions = sum(bool(indices) for indices in answers.values())
    session.correct_answers = sum(
        set(indices) == {index for index, choice in enumerate(question.choices) if choice.get("is_correct")}
        for question_id, indices in answers.items()
        if (question := questions.get(question_id)) is not None and indices
    )
    table.update_item(Key={"pk": f"USER#{session.user_id}", "sk": f"EXAM_SESSION#{session.started_at}#{session.id}"},
                      UpdateExpression="SET answered_questions = :answered, viewed_questions = :viewed, "
                                       "correct_answers = :correct",
                      ExpressionAttributeValues={":answered": session.answered_questions,
                                                 ":viewed": session.viewed_questions,
                                                 ":correct": session.correct_answers})
    return session


def complete_session(session: ExamSession) -> ExamSession:
    if session.status != "in_progress":
        return session
    if session.viewed_questions != session.total_questions:
        raise ValueError("View or skip every question before completing the exam")
    session.completed_at = utc_now()
    session.score = round(session.correct_answers * 100 / session.total_questions)
    session.status = "passed" if session.score >= 70 else "failed"
    transacts = []
    add_dynamodb_update_transact(
        transacts,
        (f"USER#{session.user_id}", f"EXAM_SESSION#{session.started_at}#{session.id}"),
        changes={
            "status": session.status,
            "completed_at": session.completed_at,
            "score": session.score,
        },
    )
    active_pointer_delete = build_dynamodb_delete_item_params(
        (f"USER#{session.user_id}", "ACTIVE_EXAM_SESSION")
    )
    active_pointer_delete["Delete"].update({
        "ConditionExpression": "attribute_not_exists(pk) OR session_id = :session_id",
        "ExpressionAttributeValues": {":session_id": session.id},
    })
    transacts.append(active_pointer_delete)
    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as exc:
        if exc.is_conditional():
            persisted_session = get_session(session.user_id, session.id)
            if persisted_session.status != "in_progress":
                return persisted_session
        raise
    return session
