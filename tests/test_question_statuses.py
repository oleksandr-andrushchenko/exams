"""Status discovery is a single key query; full-exam cascades remain bounded."""
import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from boto3.dynamodb.conditions import ConditionExpressionBuilder

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "shared"))

import question_utils
from query_dtos import QuestionQueryDTO, QuestionStatus
from shared_utils import encode_offset


def test_question_status_listing_uses_one_query_without_filters_or_exam_reads(monkeypatch):
    calls = []
    cursor = {"pk": "QUESTIONS#published", "sk": "123#question-1"}

    class Table:
        def query(self, **params):
            calls.append(params)
            return {"Items": [{"id": "question-1", "exam_id": "exam-1", "owner_id": "owner-1",
                               "title": "A published question", "status": "published", "created_at": 123}],
                    "LastEvaluatedKey": cursor}

        def get_item(self, **params):
            raise AssertionError("A listing must not read exam or question metadata separately")

    monkeypatch.setattr(question_utils, "get_dynamodb_table", Table)
    query = QuestionQueryDTO(limit=2)
    questions = question_utils.get_question_listing(query)
    assert len(calls) == 1
    assert "FilterExpression" not in calls[0]
    assert calls[0]["Limit"] == 2
    expression = ConditionExpressionBuilder().build_expression(calls[0]["KeyConditionExpression"])
    assert set(expression.attribute_value_placeholders.values()) == {"QUESTIONS#published"}
    assert questions[-1].offset == encode_offset(cursor)
    next_query = QuestionQueryDTO(limit=2, offset=questions[-1].offset)
    question_utils.get_question_listing(next_query)
    assert calls[1]["ExclusiveStartKey"] == cursor


@pytest.mark.parametrize("status, offset", [
    ("invalid", None),
    ("published", "broken"),
    ("unpublished", encode_offset({"pk": "QUESTIONS#published", "sk": "123#question-1"})),
    ("published", encode_offset({"pk": "QUESTIONS#published", "sk": "not-a-question-key"})),
])
def test_question_query_rejects_invalid_statuses_and_cross_status_cursors(status, offset):
    with pytest.raises(ValueError):
        QuestionQueryDTO(status=status, offset=offset)


def test_full_exam_question_publication_batches_stay_under_transaction_limit(monkeypatch):
    questions = [question_utils.Question(str(i), "exam-1", "owner", f"Question {i}", [], i, None)
                 for i in range(65)]
    batches = []
    monkeypatch.setattr(question_utils, "get_questions", lambda exam_id: questions)
    monkeypatch.setattr(question_utils, "dynamodb_transact_write", lambda transacts: batches.append(transacts.copy()))
    # Persistence builders resolve their table name in shared_utils.
    import shared_utils
    monkeypatch.setattr(shared_utils, "get_dynamodb_table_name", lambda: "test-table")
    question_utils.synchronize_exam_questions(SimpleNamespace(id="exam-1", title="Full exam"), QuestionStatus.PUBLISHED)
    assert all(len(batch) <= 100 for batch in batches)
    writes = [entry for batch in batches for entry in batch if "Put" in entry]
    assert len(writes) == 65
    assert all(entry["Put"]["Item"]["pk"] == "QUESTIONS#published" for entry in writes)
    assert all("choices" not in entry["Put"]["Item"] for entry in writes)
