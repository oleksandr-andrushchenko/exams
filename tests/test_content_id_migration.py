"""Key rewriting and crash recovery for content ID migrations."""

from copy import deepcopy
from decimal import Decimal
import os
from pathlib import Path
import sys

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
for directory in ("shared", "scripts"):
    sys.path.insert(0, str(project_root / directory))

import content_id_migration as migration


def test_exam_rewrite_preserves_content_and_updates_keys_and_references():
    old = "11111111-1111-4111-8111-111111111111"
    source = {"pk": f"EXAM#{old}", "sk": "QUESTION#question", "exam_id": old,
              "owner_id": old, "title": "A title containing " + old, "choices": [{"title": old}],
              "updated_at": Decimal(1)}
    updated = migration.transform_record(source, "EXAM", old, "readable-exam-abcdef1234567890")
    assert updated["pk"] == "EXAM#readable-exam-abcdef1234567890"
    assert updated["exam_id"] == "readable-exam-abcdef1234567890"
    for field in ("sk", "owner_id", "title", "choices", "updated_at"):
        assert updated[field] == source[field]
    membership = {"pk": "EXAM_TAG_COMBO#aws", "sk": f"EXAM#123#{old}", "exam_id": old}
    updated = migration.transform_record(membership, "EXAM", old, "readable")
    assert updated["sk"] == "EXAM#123#readable"


def test_question_rewrite_updates_session_answers_and_snapshot_ids():
    source = {"pk": "EXAM_SESSION#session", "sk": "QUESTION#old", "question_id": "old",
              "choice_indices": [0, 2], "question_ids": ["other", "old"]}
    updated = migration.transform_record(source, "QUESTION", "old", "readable")
    assert updated == {**source, "sk": "QUESTION#readable", "question_id": "readable",
                       "question_ids": ["other", "readable"]}


def test_migration_resumes_when_database_commit_precedes_checkpoint_write(monkeypatch, tmp_path):
    original = {"pk": "EXAM#old", "sk": "META", "id": "old", "created_at": Decimal(1), "checksum": b"binary-checkpoint"}
    copied = {**original, "pk": "EXAM#new", "id": "new"}
    alias = {"pk": "EXAM#old", "sk": "META", "content_redirect_id": "new"}
    records = {migration.record_key(original): deepcopy(original)}

    class Table:
        name = "test-table"

        def get_item(self, Key, **params):
            item = records.get((Key["pk"], Key["sk"]))
            return {"Item": deepcopy(item)} if item else {}

    state = {"kind": "EXAM", "old_id": "old", "new_id": "new", "next_group": 0, "complete": False,
             "groups": [[migration.operation(None, copied)], [migration.operation(original, alias)]]}
    path = tmp_path / "checkpoint.json"
    migration.save_state(path, state)
    writes = []

    def write(transacts):
        writes.append(transacts)
        for transaction in transacts:
            item = transaction["Put"]["Item"]
            records[migration.record_key(item)] = deepcopy(item)
        if len(writes) == 1:
            raise RuntimeError("Process stopped after database commit")

    monkeypatch.setattr(migration, "dynamodb_transact_write", write)
    monkeypatch.setattr(migration, "read_current_records", lambda table, steps: deepcopy(records))
    with pytest.raises(RuntimeError, match="Process stopped"):
        migration.apply_plan(Table(), state, path)
    resumed = migration.load_state(path)
    assert resumed["next_group"] == 0
    migration.apply_plan(Table(), resumed, path)
    assert migration.load_state(path)["complete"] is True
    assert records[("EXAM#new", "META")] == copied
    assert records[("EXAM#old", "META")] == alias
    assert len(writes) == 1


def test_migration_refuses_to_overwrite_a_changed_source(monkeypatch, tmp_path):
    original = {"pk": "EXAM#old", "sk": "META", "id": "old", "title": "Before"}
    alias = {"pk": "EXAM#old", "sk": "META", "content_redirect_id": "new"}
    table = type("Table", (), {"name": "test-table", "get_item": lambda self, **params: {
        "Item": {**original, "title": "Edited meanwhile"},
    }})()
    state = {"kind": "EXAM", "old_id": "old", "new_id": "new", "next_group": 0,
             "groups": [[migration.operation(original, alias)]]}
    monkeypatch.setattr(migration, "dynamodb_transact_write", lambda transacts: pytest.fail("Unexpected write"))
    with pytest.raises(ValueError, match="Record changed"):
        migration.apply_plan(table, state, tmp_path / "checkpoint.json")


def test_migration_planning_refuses_an_existing_destination():
    original = {"pk": "EXAM#old", "sk": "META", "id": "old", "title": "Original"}
    destination = {"pk": "EXAM#new", "sk": "META", "id": "new", "title": "Another exam"}
    with pytest.raises(ValueError, match="Target key already exists"):
        migration.build_plan(original, [original, destination], "EXAM", "new")


def test_activity_identity_and_url_are_rewritten_without_touching_actor():
    source = {"pk": "USER_ACTIVITY#actor", "sk": "ACTIVITY#1", "entity_type": "exam",
              "entity_id": "old", "entity_url": "/exams/old?review=1", "actor_user_id": "old"}
    updated = migration.transform_record(source, "EXAM", "old", "new-readable-id")
    assert updated["entity_id"] == "new-readable-id"
    assert updated["entity_url"] == "/exams/new-readable-id?review=1"
    assert updated["actor_user_id"] == "old"


def test_migration_batches_respect_limits_and_keep_cutover_groups_atomic():
    groups = [[migration.operation(None, {"pk": f"ITEM#{index}", "sk": "META"})] for index in range(79)]
    cutover = [migration.operation(None, {"pk": "NEW", "sk": "META"}),
               migration.operation(None, {"pk": "OLD", "sk": "META"})]
    groups.append(cutover)
    groups.append([migration.operation({"pk": "NEW", "sk": "META"},
                                       {"pk": "NEW", "sk": "META", "active": True})])
    batches = list(migration.operation_batches(groups, 0))
    assert [end for end, steps in batches] == [79, 80, 81]
    assert [len(steps) for end, steps in batches] == [79, 2, 1]
    assert batches[1][1] == cutover
    assert list(migration.operation_batches(groups, 80)) == [batches[-1]]


def test_migration_batch_reads_retry_unprocessed_keys_without_treating_them_as_missing(monkeypatch):
    first = {"pk": "FIRST", "sk": "META"}
    second = {"pk": "SECOND", "sk": "META"}
    requests = []

    def batch_get_item(RequestItems):
        requests.append(RequestItems)
        if len(requests) == 1:
            return {"Responses": {"table": [first]},
                    "UnprocessedKeys": {"table": {"Keys": [second], "ConsistentRead": True}}}
        return {"Responses": {"table": [second]}}

    client = type("Client", (), {"batch_get_item": staticmethod(batch_get_item)})()
    table = type("Table", (), {"name": "table", "meta": type("Meta", (), {"client": client})()})()
    monkeypatch.setattr(migration.time, "sleep", lambda delay: None)
    steps = [migration.operation(None, first), migration.operation(None, second)]
    assert migration.read_current_records(table, steps) == {migration.record_key(first): first,
                                                          migration.record_key(second): second}
    assert requests[1]["table"]["Keys"] == [second]
