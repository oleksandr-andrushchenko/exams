import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

from question_dtos import QuestionDTO
from session_dtos import AnswerDTO
import question_utils
from question_utils import question_from_dynamodb, question_without_answers
from web import RequestValidationError, parse_dto


def test_question_from_dynamodb_requires_title():
    item = {
        "id": "question-id",
        "exam_id": "exam-id",
        "owner_id": "owner-id",
        "prompt": "Legacy question prompt",
        "choices": [],
        "created_at": 1,
    }

    with pytest.raises(KeyError, match="title"):
        question_from_dynamodb(item)


def test_learner_question_projection_omits_answer_keys_and_explanations():
    question = question_from_dynamodb({
        "id": "question-id",
        "exam_id": "exam-id",
        "owner_id": "owner-id",
        "title": "Choose an answer",
        "reference_urls": ["https://example.com/answer-guide"],
        "choices": [{
            "title": "First",
            "explanation": "This is correct.",
            "is_correct": True,
        }],
        "created_at": 1,
    })

    result = question_without_answers(question)

    assert result["choices"] == [{"title": "First"}]
    assert "reference_urls" not in result


def test_question_dto_does_not_accept_legacy_prompt():
    data = {
        "prompt": "Legacy question prompt",
        "choices": [
            {"title": "Correct", "explanation": "This is correct.", "is_correct": True},
            {"title": "Incorrect", "explanation": "This is incorrect.", "is_correct": False},
        ],
    }

    with pytest.raises(RequestValidationError):
        parse_dto(QuestionDTO, data)


def test_question_dto_accepts_multiple_correct_choices():
    dto = QuestionDTO(
        title="Select two answers",
        choices=[
            {"title": "First", "explanation": "First is correct.", "is_correct": True},
            {"title": "Second", "explanation": "Second is correct.", "is_correct": True},
            {"title": "Third", "explanation": "Third is incorrect.", "is_correct": False},
        ],
    )

    assert [choice["is_correct"] for choice in dto.choices] == [True, True, False]


def test_question_dto_accepts_two_to_ten_choices():
    def choices(count):
        return [
            {
                "title": f"Choice {index}",
                "explanation": f"Explanation {index}.",
                "is_correct": index == 0,
            }
            for index in range(count)
        ]

    assert len(QuestionDTO("Choose one", choices(2)).choices) == 2
    assert len(QuestionDTO("Choose one", choices(10)).choices) == 10
    with pytest.raises(ValueError, match="between 2 and 10"):
        QuestionDTO("Choose one", choices(1))
    with pytest.raises(ValueError, match="between 2 and 10"):
        QuestionDTO("Choose one", choices(11))


def test_question_dto_requires_an_explanation_for_every_choice():
    with pytest.raises(ValueError, match="choice explanation"):
        QuestionDTO(
            title="Choose an answer",
            choices=[
                {"title": "First", "is_correct": True},
                {"title": "Second", "explanation": "Second is incorrect.", "is_correct": False},
            ],
        )


def test_answer_dto_supports_multiple_choices_and_skips():
    assert AnswerDTO("question-id", [0, 2]).choice_indices == [0, 2]
    assert AnswerDTO("question-id", []).choice_indices == []


def test_answer_dto_keeps_single_choice_compatibility():
    assert AnswerDTO("question-id", choice_index=1).choice_indices == [1]


def test_exam_question_query_uses_sort_key_and_reads_all_pages(monkeypatch):
    from boto3.dynamodb.conditions import ConditionExpressionBuilder

    calls = []
    cursor = {"pk": "EXAM#exam-id", "sk": "QUESTION#first"}

    class QuestionTable:
        def query(self, **params):
            calls.append(params)
            item = {
                "id": "second" if "ExclusiveStartKey" in params else "first",
                "exam_id": "exam-id",
                "owner_id": "owner-id",
                "title": "Choose an answer",
        "reference_urls": ["https://example.com/answer-guide"],
                "choices": [],
                "created_at": 1,
            }
            if "ExclusiveStartKey" in params:
                assert params["ExclusiveStartKey"] == cursor
                return {"Items": [item]}
            return {"Items": [item], "LastEvaluatedKey": cursor}

    monkeypatch.setattr(question_utils, "get_dynamodb_table", QuestionTable)

    questions = question_utils.get_questions("exam-id")

    assert [question.id for question in questions] == ["first", "second"]
    assert len(calls) == 2
    for call in calls:
        assert "FilterExpression" not in call
        assert "IndexName" not in call
        expression = ConditionExpressionBuilder().build_expression(call["KeyConditionExpression"])
        assert set(expression.attribute_name_placeholders.values()) == {"pk", "sk"}
        assert set(expression.attribute_value_placeholders.values()) == {"EXAM#exam-id", "QUESTION#"}
        assert "begins_with" in expression.condition_expression


@pytest.mark.parametrize("urls", [
    ["javascript:alert(1)"], ["not-a-url"], [""], "https://example.com", ["https://example.com"] * 11,
])
def test_question_references_reject_invalid_urls(urls):
    from question_dtos import UpdateQuestionDTO

    with pytest.raises(ValueError):
        UpdateQuestionDTO(reference_urls=urls)
