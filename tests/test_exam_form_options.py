import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

from exam_dtos import ExamDTO


def exam_dto(**changes):
    values = {
        "title": "Cloud architecture practice",
        "description": "Practice questions for cloud architecture concepts.",
        "tags": ["cloud"],
    }
    values.update(changes)
    return ExamDTO(**values)


def test_exam_dto_uses_standard_curated_defaults():
    dto = exam_dto()

    assert dto.difficulty == "intermediate"
    assert dto.language == "en"


@pytest.mark.parametrize(("field", "value"), [("difficulty", "professional"), ("language", "xx")])
def test_exam_dto_rejects_unlisted_form_option(field, value):
    with pytest.raises(ValueError, match=f"invalid {field}"):
        exam_dto(**{field: value})
