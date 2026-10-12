import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

from exam_dtos import ExamDTO, UpdateExamDTO


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


def test_exam_dto_accepts_other_difficulty():
    assert exam_dto(difficulty="other").difficulty == "other"


@pytest.mark.parametrize(("field", "value"), [("difficulty", "professional"), ("language", "xx")])
def test_exam_dto_rejects_unlisted_form_option(field, value):
    with pytest.raises(ValueError, match=f"invalid {field}"):
        exam_dto(**{field: value})


@pytest.mark.parametrize(("value", "expected"), [
    (None, None), ("", None), ("  ", None), (" saa-c03 ", "SAA-C03"),
    ("az-104", "AZ-104"), ("1z0-082", "1Z0-082"),
])
def test_exam_code_normalization(value, expected):
    assert exam_dto(exam_code=value).exam_code == expected
    assert UpdateExamDTO(exam_code=value).exam_code == expected


@pytest.mark.parametrize("value", ["X" * 51, "<script>", "SAA C03", "SAA\nC03", 123, False])
def test_exam_code_rejects_invalid_values(value):
    with pytest.raises(ValueError, match="exam_code"):
        exam_dto(exam_code=value)
    with pytest.raises(ValueError, match="exam_code"):
        UpdateExamDTO(exam_code=value)


def test_exam_code_is_optional_and_patch_omission_preserves_it():
    assert exam_dto().exam_code is None
    assert "exam_code" not in UpdateExamDTO(title="Updated title").get_changes()
    assert UpdateExamDTO(exam_code="").get_changes() == {"exam_code": None}
