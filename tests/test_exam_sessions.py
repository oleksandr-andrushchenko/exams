import os
import sys
from pathlib import Path
from types import SimpleNamespace

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

import session_utils
from session_utils import (
    ActiveExamSessionError,
    ExamSession,
    answer_question,
    complete_session,
    create_session,
    get_question_result,
)


class SessionTable:
    def __init__(self):
        self.answers = {}
        self.session_item = None

    def put_item(self, Item, **_kwargs):
        if Item.get("exam_session"):
            self.session_item = Item
        else:
            self.answers[Item["question_id"]] = Item

    def query(self, **_kwargs):
        return {"Items": list(self.answers.values())}

    def update_item(self, **_kwargs):
        return None


def question(question_id, correct_indices):
    return SimpleNamespace(
        id=question_id,
        status="published",
        choices=[{
            "is_correct": index in correct_indices,
            "explanation": f"Choice {index} rationale.",
        } for index in range(3)],
    )


def test_session_scores_multiple_answers_and_skips(monkeypatch):
    table = SessionTable()
    questions = [question("multiple", {0, 2}), question("skipped", {1})]
    monkeypatch.setattr(session_utils, "get_dynamodb_table", lambda: table)
    monkeypatch.setattr(session_utils, "dynamodb_transact_write", lambda _transacts: None)
    monkeypatch.setattr(
        session_utils,
        "get_questions",
        lambda _exam_id: questions,
    )
    session = ExamSession("session", "exam", "user", "in_progress", 2, 0, 0, None, 1, None,
                          [item.id for item in questions], 0)

    answer_question(session, "multiple", [0, 2])
    answer_question(session, "skipped", [])
    complete_session(session)

    assert session.answered_questions == 1
    assert session.viewed_questions == 2
    assert session.correct_answers == 1
    assert session.score == 50
    assert session.status == "failed"


def test_question_result_explains_correct_and_incorrect_choices():
    result = get_question_result(question("question", {0, 2}), [1])

    assert result["is_answered"] is True
    assert result["is_correct"] is False
    assert [choice["is_correct"] for choice in result["choices"]] == [True, False, True]
    assert [choice["is_selected"] for choice in result["choices"]] == [False, True, False]
    assert result["choices"][1]["explanation"] == "Choice 1 rationale."


def test_session_includes_every_exam_question(monkeypatch):
    table = SessionTable()
    questions = [question("first", {0}), question("second", {1})]
    monkeypatch.setattr(session_utils, "get_dynamodb_table", lambda: table)
    monkeypatch.setattr(
        session_utils,
        "get_questions",
        lambda _exam_id: questions,
    )
    monkeypatch.setattr(session_utils, "get_exam", lambda _exam_id, _user: SimpleNamespace())
    monkeypatch.setattr(session_utils, "get_active_session", lambda _user_id: None)
    monkeypatch.setattr(
        session_utils,
        "dynamodb_transact_write",
        lambda transacts: setattr(
            table,
            "session_item",
            next(item["Put"]["Item"] for item in transacts if item["Put"]["Item"].get("exam_session")),
        ),
    )

    session = create_session("exam", SimpleNamespace(id="user"))

    assert session.question_ids == ["first", "second"]
    assert session.total_questions == 2
    assert table.session_item["question_ids"] == ["first", "second"]


def test_create_session_rejects_a_second_active_session(monkeypatch):
    active = ExamSession("active", "exam", "user", "in_progress", 1, 0, 0, None, 1, None, ["question"], 0)
    monkeypatch.setattr(session_utils, "get_active_session", lambda _user_id: active)

    try:
        create_session("another-exam", SimpleNamespace(id="user"))
    except ActiveExamSessionError as exc:
        assert "Complete your active exam" in str(exc)
    else:
        raise AssertionError("Expected the active session to prevent a second session")
