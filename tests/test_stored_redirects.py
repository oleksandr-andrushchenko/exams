"""Validation for administrator-managed missing-page redirects."""
import os
import sys
from pathlib import Path

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "api-lambda"))

from redirect_dtos import UpsertRedirectDTO


def test_redirect_paths_are_trimmed_and_target_keeps_query_and_fragment():
    dto = UpsertRedirectDTO(path=" /legacy-page ", redirect_to=" /exams?source=legacy#current ")
    assert dto.path == "/legacy-page"
    assert dto.redirect_to == "/exams?source=legacy#current"


@pytest.mark.parametrize("path, redirect_to", [
    ("/legacy.html", "/exams"),
    ("/legacy?source=old", "/exams"),
    ("/legacy#old", "/exams"),
    ("//example.com/legacy", "/exams"),
    ("legacy", "/exams"),
    (None, "/exams"),
    ("/legacy", "https://example.com/exams"),
    ("/legacy", "//example.com/exams"),
    ("/legacy", "/\\example.com/exams"),
    ("/legacy", "/exam\npage"),
    ("/legacy", "/legacy?source=old"),
    ("/legacy", ""),
    ("/legacy", "/" + "a" * 2048),
])
def test_redirect_rejects_invalid_paths_and_destinations(path, redirect_to):
    with pytest.raises(ValueError):
        UpsertRedirectDTO(path=path, redirect_to=redirect_to)
