import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

from question_dtos import QuestionDTO
from question_utils import question_from_dynamodb
from web import RequestValidationError, parse_dto


def test_question_from_dynamodb_requires_title():
    item = {
        "id": "question-id",
        "exam_id": "exam-id",
        "owner_id": "owner-id",
        "prompt": "Legacy question prompt",
        "description": "Question description",
        "choices": [],
        "created_at": 1,
    }

    with pytest.raises(KeyError, match="title"):
        question_from_dynamodb(item)


def test_question_dto_does_not_accept_legacy_prompt():
    data = {
        "prompt": "Legacy question prompt",
        "description": "Question description",
        "choices": [
            {"title": "Correct", "description": "", "is_correct": True},
            {"title": "Incorrect", "description": "", "is_correct": False},
        ],
    }

    with pytest.raises(RequestValidationError):
        parse_dto(QuestionDTO, data)
