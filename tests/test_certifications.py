import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))

from certification_dtos import CertificationDTO


def certification_dto(**changes):
    values = {
        "name": "AWS Certified Developer",
        "provider": "AWS",
        "description": "An official certification for cloud developers.",
        "category": "cloud-computing",
        "level": "associate",
    }
    values.update(changes)
    return CertificationDTO(**values)


def test_certification_dto_accepts_curated_level():
    assert certification_dto().level == "associate"
    assert certification_dto(level="business").level == "business"
    assert certification_dto(level="other").level == "other"


def test_certification_dto_rejects_unlisted_level():
    with pytest.raises(ValueError, match="invalid certification level"):
        certification_dto(level="guru")


def test_certification_dto_accepts_only_curated_providers():
    assert certification_dto(provider="Google Cloud").provider == "Google Cloud"
    assert certification_dto(provider="Other").provider == "Other"

    with pytest.raises(ValueError, match="invalid certification provider"):
        certification_dto(provider="Unknown Provider")


@pytest.mark.parametrize("value", [0, -1, 1.5, True, "1.5", "abc", 1441])
def test_duration_rejects_invalid_values(value):
    from exam_dtos import UpdateExamDTO

    with pytest.raises(ValueError, match="duration_minutes"):
        certification_dto(duration_minutes=value)
    with pytest.raises(ValueError, match="duration_minutes"):
        UpdateExamDTO(duration_minutes=value)


def test_official_question_count_rejects_invalid_value():
    with pytest.raises(ValueError, match="question_count"):
        certification_dto(question_count=0)


def test_certification_catalog_follows_pagination(monkeypatch):
    import certification_utils

    class Table:
        def __init__(self):
            self.calls = []

        def query(self, **params):
            self.calls.append(params)
            if "ExclusiveStartKey" not in params:
                return {"Items": [], "LastEvaluatedKey": {"pk": "CERTIFICATION", "sk": "cursor"}}
            return {"Items": [{
                "id": "second-page", "slug": "second-page", "name": "Second page credential",
                "provider": "Microsoft", "description": "A credential returned after a page boundary.",
                "category": "other", "level": "associate", "official_url": None, "created_at": 1,
            }]}

    table = Table()
    monkeypatch.setattr(certification_utils, "get_dynamodb_table", lambda: table)
    assert [item.id for item in certification_utils.get_certifications()] == ["second-page"]
    assert table.calls[1]["ExclusiveStartKey"] == {"pk": "CERTIFICATION", "sk": "cursor"}


def test_certification_id_lookup_reads_one_exact_key(monkeypatch):
    import certification_utils

    calls = []

    def get_item(pk, sk):
        calls.append((pk, sk))
        return {"id": sk, "name": "An official credential", "provider": "AWS",
                "description": "Credential metadata", "created_at": 1}

    monkeypatch.setattr(certification_utils, "get_dynamodb_item", get_item)
    certification = certification_utils.get_certification("official-credential")
    assert certification.id == "official-credential"
    assert not hasattr(certification, "slug")
    assert calls == [("CERTIFICATION", "official-credential")]


def test_legacy_certification_reads_use_existing_url_as_id():
    from certification_utils import certification_from_dynamodb

    certification = certification_from_dynamodb({
        "id": "legacy-uuid", "slug": "existing-url", "name": "Renamed credential",
        "provider": "AWS", "description": "Credential metadata", "created_at": 1,
    })
    assert certification.id == "existing-url"
