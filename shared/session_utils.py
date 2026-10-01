from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4

from shared_utils import Key, User, get_dynamodb_table, utc_now
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


def session_from_item(item: dict[str, Any]) -> ExamSession:
    return ExamSession(
        id=item.get("session_id", item["id"]),
        exam_id=item["exam_id"],
        user_id=item["user_id"],
        status=item["status"],
        total_questions=int(item["total_questions"]),
        answered_questions=int(item.get("answered_questions", 0)),
        correct_answers=int(item.get("correct_answers", 0)),
        score=item.get("score"),
        started_at=int(item["started_at"]),
        completed_at=item.get("completed_at"),
    )


def _find_session_item(user_id: str, session_id: str) -> dict[str, Any] | None:
    table = get_dynamodb_table()
    response = table.query(KeyConditionExpression=Key("pk").eq(f"USER#{user_id}") & Key("sk").begins_with("EXAM_SESSION#"))
    return next((item for item in response.get("Items", [])
                 if item.get("session_id", item.get("id")) == session_id), None)


def get_session(user_id: str, session_id: str) -> ExamSession:
    item = _find_session_item(user_id, session_id)
    if not item:
        raise LookupError(f"Exam session '{session_id}' not found")
    return session_from_item(item)


def get_sessions(user_id: str) -> list[ExamSession]:
    response = get_dynamodb_table().query(
        KeyConditionExpression=Key("pk").eq(f"USER#{user_id}") & Key("sk").begins_with("EXAM_SESSION#"),
        ScanIndexForward=False,
    )
    return [session_from_item(item) for item in response.get("Items", [])]


def create_session(exam_id: str, user: User) -> ExamSession:
    questions = get_questions(exam_id)
    if not questions:
        raise ValueError("An exam must have at least one question")
    session_id = str(uuid4())
    started_at = utc_now()
    session = ExamSession(session_id, exam_id, user.id, "in_progress", len(questions), 0, 0, None, started_at, None)
    item = asdict(session)
    item.update({
        "session_id": session.id,
        "pk": f"USER#{user.id}",
        "sk": f"EXAM_SESSION#{started_at}#{session_id}",
        "exam_session": True,
    })
    get_dynamodb_table().put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")
    return session


def answer_question(session: ExamSession, question_id: str, choice_index: int) -> ExamSession:
    if session.status != "in_progress":
        raise ValueError("exam session is already complete")
    questions = {question.id: question for question in get_questions(session.exam_id)}
    question = questions.get(question_id)
    if question is None:
        raise LookupError(f"Question '{question_id}' not found")
    if not 0 <= choice_index < len(question.choices):
        raise ValueError("choice_index is out of range")
    table = get_dynamodb_table()
    table.put_item(Item={"pk": f"EXAM_SESSION#{session.id}", "sk": f"QUESTION#{question_id}",
                         "question_id": question_id, "choice_index": choice_index})
    answers = table.query(KeyConditionExpression=Key("pk").eq(f"EXAM_SESSION#{session.id}")).get("Items", [])
    session.answered_questions = len(answers)
    session.correct_answers = sum(
        bool(question.choices[int(answer["choice_index"])].get("is_correct"))
        for answer in answers
        if (question := questions.get(answer.get("question_id"))) is not None
    )
    table.update_item(Key={"pk": f"USER#{session.user_id}", "sk": f"EXAM_SESSION#{session.started_at}#{session.id}"},
                      UpdateExpression="SET answered_questions = :answered, correct_answers = :correct",
                      ExpressionAttributeValues={":answered": session.answered_questions, ":correct": session.correct_answers})
    return session


def complete_session(session: ExamSession) -> ExamSession:
    if session.status != "in_progress":
        return session
    if session.answered_questions != session.total_questions:
        raise ValueError("Answer every question before completing the exam")
    session.completed_at = utc_now()
    session.score = round(session.correct_answers * 100 / session.total_questions)
    session.status = "passed" if session.score >= 70 else "failed"
    table = get_dynamodb_table()
    table.update_item(Key={"pk": f"USER#{session.user_id}", "sk": f"EXAM_SESSION#{session.started_at}#{session.id}"},
                      UpdateExpression="SET #status = :status, completed_at = :completed, score = :score",
                      ExpressionAttributeNames={"#status": "status"},
                      ExpressionAttributeValues={":status": session.status, ":completed": session.completed_at, ":score": session.score})
    return session
