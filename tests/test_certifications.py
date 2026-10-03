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


def test_certification_dto_rejects_unlisted_level():
    with pytest.raises(ValueError, match="invalid certification level"):
        certification_dto(level="guru")
