"""Bounded and retryable propagation of certification card snapshots."""

from dataclasses import asdict
import os
from pathlib import Path
import sys
from types import SimpleNamespace

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
for directory in ("shared", "api-lambda"):
    sys.path.insert(0, str(project_root / directory))

import certification_mutations as mutations
from certification_dtos import CertificationDTO
from certification_utils import certification_from_dynamodb
from shared_utils import DynamoDBTransactionError, Permission, UserStatus


def credential():
    return certification_from_dynamodb({
        "id": "credential", "slug": "credential", "name": "Original Credential", "provider": "Microsoft",
        "description": "A credential used to verify snapshot synchronization.", "category": "other",
        "level": "associate", "official_url": None, "image_filename": "original.png", "created_at": 1,
    })


def test_snapshot_sync_batches_and_paginates_all_statuses(monkeypatch):
    calls = []
    transactions = []

    class Table:
        def query(self, **params):
            calls.append(dict(params))
            status = params["KeyConditionExpression"].get_expression()["values"][1]
            cursor = params.get("ExclusiveStartKey", {}).get("sk")
            if status == "EXAM#published" and cursor is None:
                return {"Items": [{"id": f"exam-{index}"} for index in range(200)],
                        "LastEvaluatedKey": {"pk": "cursor", "sk": "page-2"}}
            if status == "EXAM#published" and cursor == "page-2":
                return {"Items": [], "LastEvaluatedKey": {"pk": "cursor", "sk": "page-3"}}
            return {"Items": [{"id": status}]}

    monkeypatch.setattr(mutations, "get_dynamodb_table", Table)
    monkeypatch.setattr(mutations, "dynamodb_transact_write", transactions.append)
    mutations._synchronize_exam_snapshots(credential(), "revision")
    assert len(calls) == 5
    published_calls = [call for call in calls
                       if call["KeyConditionExpression"].get_expression()["values"][1] == "EXAM#published"]
    assert published_calls[2]["ExclusiveStartKey"]["sk"] == "page-3"
    assert all(len(batch) <= 100 for batch in transactions)
    exam_updates = [action["Update"] for batch in transactions for action in batch
                    if "Update" in action and action["Update"]["Key"]["pk"].startswith("EXAM#")]
    assert len(exam_updates) == 203
    assert all(update["ConditionExpression"] == "#linked_certification = :linked_certification"
               for update in exam_updates)
    assert all("status" not in update["ExpressionAttributeNames"].values() for update in exam_updates)
    assert all("updated_at" not in update["ExpressionAttributeNames"].values() for update in exam_updates)
    assert transactions[-1][0]["Update"]["ExpressionAttributeValues"][":token"] == "revision"


def test_relinked_exam_is_skipped_after_conditional_failure(monkeypatch):
    calls = []

    class Table:
        def get_item(self, **params):
            return {"Item": {"certification_id": "different-credential"}}

    def write(transacts):
        calls.append(transacts)
        if len(calls) == 1:
            raise DynamoDBTransactionError("ConditionalCheckFailed")

    monkeypatch.setattr(mutations, "get_dynamodb_table", Table)
    monkeypatch.setattr(mutations, "dynamodb_transact_write", write)
    monkeypatch.setattr(mutations, "_certification_record", lambda slug: {"exam_snapshot_sync_token": "revision"})
    mutations._sync_batch(credential(), "revision", ["relinked-exam"])
    assert len(calls[0]) == 2
    assert len(calls[1]) == 1
    assert "ConditionCheck" in calls[1][0]


def test_older_sync_does_not_retry_over_a_new_certification_revision(monkeypatch):
    def cancelled(transacts):
        raise DynamoDBTransactionError("ConditionalCheckFailed")

    monkeypatch.setattr(mutations, "dynamodb_transact_write", cancelled)
    monkeypatch.setattr(mutations, "_certification_record", lambda slug: {"exam_snapshot_sync_token": "newer"})
    with pytest.raises(DynamoDBTransactionError):
        mutations._sync_batch(credential(), "older", ["exam"])


def test_identical_save_resumes_failed_sync_without_exam_edit_permission(monkeypatch):
    cert = credential()
    stored = {"pk": "CERTIFICATION", "sk": cert.id, **asdict(cert)}
    sync_tokens = []
    actor = SimpleNamespace(id="editor", permissions=[Permission.UPDATE_CERTIFICATION], status=UserStatus.ACTIVE)
    monkeypatch.setattr(mutations, "_certification_record", lambda slug: dict(stored))
    monkeypatch.setattr(mutations, "get_category", lambda category: None)

    def persist(transacts):
        update = transacts[0]["Update"]
        for alias, name in update["ExpressionAttributeNames"].items():
            value_alias = alias.replace("#new_", ":new_")
            if value_alias in update["ExpressionAttributeValues"]:
                stored[name] = update["ExpressionAttributeValues"][value_alias]
            else:
                stored.pop(name, None)

    def sync(current, token):
        sync_tokens.append(token)
        if len(sync_tokens) == 1:
            raise RuntimeError("Temporary write failure")
        stored["exam_snapshot_sync_pending"] = False

    monkeypatch.setattr(mutations, "dynamodb_transact_write", persist)
    monkeypatch.setattr(mutations, "_synchronize_exam_snapshots", sync)
    dto = CertificationDTO(name="Updated Credential", provider=cert.provider, description=cert.description,
                           category=cert.category, level=cert.level, image_filename=None)
    with pytest.raises(RuntimeError, match="Temporary write failure"):
        mutations.update_certification(cert, dto, actor)
    assert stored["exam_snapshot_sync_pending"] is True
    assert stored["name"] == "Updated Credential"
    mutations.update_certification(cert, dto, actor)
    assert stored["exam_snapshot_sync_pending"] is False
    assert len(sync_tokens) == 2 and sync_tokens[0] != sync_tokens[1]
    # Editing metadata unrelated to cards must not initiate another synchronization.
    dto.description = "An updated description that does not affect the compact exam card."
    mutations.update_certification(cert, dto, actor)
    assert len(sync_tokens) == 2
