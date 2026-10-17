"""Resumable key migrations for legacy exams/questions. Run during a quiet write window."""

import base64
import hashlib
import json
import random
import re
import time
from pathlib import Path
from urllib.parse import quote

from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

from content_ids import is_legacy_content_id, make_content_id
from shared_utils import (
    Permission, UserBannedError, UserStatus, dynamodb_transact_write, get_config,
    get_dynamodb_table, get_dynamodb_table_name, get_user, to_kebab_case, verify_authorization,
)


_SERIALIZER = TypeSerializer()
_DESERIALIZER = TypeDeserializer()
_REFERENCE_FIELDS = {"exam_id", "question_id", "question_pk", "question_sk", "href", "url", "entity_url"}
_FATAL_CODES = {"AccessDeniedException", "UnrecognizedClientException", "ExpiredTokenException",
                "ResourceNotFoundException", "ThrottlingException", "ProvisionedThroughputExceededException"}


class MigrationReadLimitError(RuntimeError):
    pass


def all_records(table):
    params = {"ConsistentRead": True}
    while True:
        response = table.scan(**params)
        yield from response.get("Items", [])
        if not response.get("LastEvaluatedKey"):
            return
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def record_key(record):
    return record["pk"], record["sk"]


def replace_reference(value, kind, old, new):
    if value == old:
        return new
    if value == f"{kind}#{old}":
        return f"{kind}#{new}"
    route = "exams" if kind == "EXAM" else "questions"
    if isinstance(value, str):
        return re.sub(rf"/{route}/{re.escape(old)}(?=/|[?#]|$)",
                      lambda match: f"/{route}/{quote(new, safe='')}", value)
    return value


def transform_record(record, kind, old, new):
    updated = dict(record)
    pk, sk = record_key(record)
    if kind == "EXAM":
        if pk == f"EXAM#{old}":
            updated["pk"] = f"EXAM#{new}"
            if sk == "META":
                updated["id"] = new
                updated.pop("exam_slug", None)
        if pk.startswith("EXAM_TAG_COMBO#") and sk.endswith("#" + old):
            updated["sk"] = sk[:-len(old)] + new
    else:
        if pk == f"QUESTION#{old}":
            updated["pk"] = f"QUESTION#{new}"
        if sk == f"QUESTION#{old}" and pk.startswith(("EXAM#", "EXAM_SESSION#")):
            updated["sk"] = f"QUESTION#{new}"
        if pk.startswith("QUESTIONS#") and sk.endswith("#" + old):
            updated["sk"] = sk[:-len(old)] + new
        if record.get("id") == old and (pk.startswith("EXAM#") or pk.startswith("QUESTIONS#")):
            updated["id"] = new
            updated.pop("slug", None)
        if "question_ids" in record:
            updated["question_ids"] = [new if value == old else value for value in record["question_ids"]]
    for field in _REFERENCE_FIELDS:
        if field in record and (field not in {"exam_id", "question_id"} or field == kind.lower() + "_id"):
            updated[field] = replace_reference(record[field], kind, old, new)
    if record.get("entity_type") == kind.lower() and record.get("entity_id") == old:
        updated["entity_id"] = new
    return updated


def expectation(record):
    if record is None:
        return {"ConditionExpression": "attribute_not_exists(pk)"}
    names = {}
    values = {}
    parts = ["attribute_exists(pk)"]
    for index, (name, value) in enumerate(record.items()):
        if name in {"pk", "sk"}:
            continue
        alias = f"#v{index}"
        token = f":v{index}"
        names[alias] = name
        values[token] = value
        parts.append(f"{alias} = {token}")
    result = {"ConditionExpression": " AND ".join(parts)}
    if names:
        result["ExpressionAttributeNames"] = names
        result["ExpressionAttributeValues"] = values
    return result


def operation(before, after):
    key = record_key(after or before)
    return {"key": {"pk": key[0], "sk": key[1]}, "before": before, "after": after}


def new_copy(record, by_key):
    if record_key(record) in by_key:
        raise ValueError(f"Target key already exists: {record_key(record)}")
    return operation(None, record)


def build_plan(source, records, kind, new):
    old = source["id"]
    by_key = {record_key(record): record for record in records}
    copies = []
    updates = []
    deletes = []
    original_main_key = record_key(source)
    new_main = transform_record(source, kind, old, new)
    for record in records:
        updated = transform_record(record, kind, old, new)
        if updated == record:
            continue
        old_key = record_key(record)
        new_key = record_key(updated)
        if old_key != new_key:
            if old_key != original_main_key:
                copies.append([new_copy(updated, by_key)])
            deletes.append([operation(record, None)])
        else:
            updates.append([operation(record, updated)])
    alias = {"pk": f"{kind}#{old}", "sk": "META", "content_redirect_id": new}
    if kind == "EXAM" and source.get("exam_slug"):
        alias["exam_slug"] = source["exam_slug"]
    if kind == "EXAM":
        staged = {key: value for key, value in new_main.items()
                  if key not in {"exam_status_pk", "exam_user_status_pk", "exam_category_status_pk"}}
        staged["content_id_migration_pending"] = True
        copies.insert(0, [new_copy(staged, by_key)])
        cutover = [operation(staged, new_main), operation(source, alias)]
        deletes = [group for group in deletes if record_key(group[0]["before"]) != original_main_key]
    else:
        copies.insert(0, [new_copy(new_main, by_key)])
        old_locator = by_key.get((f"QUESTION#{old}", "META"))
        if old_locator is None:
            raise ValueError("Question locator is missing")
        # The new locator is copied before the old one becomes a redirect.
        cutover = [operation(old_locator, alias)]
        deletes = [group for group in deletes
                   if record_key(group[0]["before"]) != (f"QUESTION#{old}", "META")]
        old_slug = source.get("slug") or to_kebab_case(source["title"])
        legacy_alias = {"pk": source["pk"], "sk": "QUESTION_SLUG#" + hashlib.sha256(old_slug.encode()).hexdigest(),
                        "question_id": new}
        previous = by_key.get(record_key(legacy_alias))
        if previous is None or previous == legacy_alias:
            copies.append([operation(previous, legacy_alias)])
    return {"input": source, "kind": kind, "old_id": old, "new_id": new, "next_group": 0,
            "groups": copies + updates + [cutover] + deletes, "complete": False}


def binary_wire_values(value, encode):
    if isinstance(value, list):
        return [binary_wire_values(item, encode) for item in value]
    if not isinstance(value, dict):
        return value
    if set(value) == {"B"} and isinstance(value["B"], (bytes, str)):
        return {"B": (base64.b64encode(value["B"]).decode() if encode else base64.b64decode(value["B"]))}
    if set(value) == {"BS"} and isinstance(value["BS"], (list, set)):
        return {"BS": [(base64.b64encode(item).decode() if encode else base64.b64decode(item)) for item in value["BS"]]}
    return {key: binary_wire_values(item, encode) for key, item in value.items()}


def load_state(path):
    envelope = binary_wire_values(json.loads(path.read_text()), encode=False)
    return _DESERIALIZER.deserialize(envelope)


def save_state(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    wire = binary_wire_values(_SERIALIZER.serialize(state), encode=True)
    temporary.write_text(json.dumps(wire))
    temporary.replace(path)


def operation_batches(groups, start):
    """Keep atomic groups together, with unique keys and conservative request limits."""
    steps = []
    keys = set()
    size = 0
    for index in range(start, len(groups)):
        group = groups[index]
        group_keys = {record_key(step["key"]) for step in group}
        group_size = len(json.dumps(_SERIALIZER.serialize(group), default=str).encode())
        if steps and (keys & group_keys or len(steps) + len(group) > 80 or size + group_size > 2_000_000):
            yield index, steps
            steps = []
            keys = set()
            size = 0
        steps.extend(group)
        keys.update(group_keys)
        size += group_size
    if steps:
        yield len(groups), steps


def read_current_records(table, steps):
    if len(steps) == 1:
        key = steps[0]["key"]
        item = table.get_item(Key=key, ConsistentRead=True).get("Item")
        return {record_key(key): item} if item else {}
    pending = {"Keys": [step["key"] for step in steps], "ConsistentRead": True}
    records = {}
    for attempt in range(6):
        response = table.meta.client.batch_get_item(RequestItems={table.name: pending})
        records.update((record_key(record), record) for record in response.get("Responses", {}).get(table.name, []))
        pending = response.get("UnprocessedKeys", {}).get(table.name)
        if not pending:
            return records
        if attempt < 5:
            time.sleep(random.uniform(0, min(3, 0.2 * 2 ** attempt)))
    raise MigrationReadLimitError("DynamoDB left migration reads unprocessed after bounded retries")


def apply_plan(table, state, path):
    for next_group, steps in operation_batches(state["groups"], int(state["next_group"])):
        current_records = read_current_records(table, steps)
        transactions = []
        for step in steps:
            current = current_records.get(record_key(step["key"]))
            if current == step["after"]:
                continue
            if current != step["before"]:
                before, after = step["before"], step["after"]
                changed = ({key for key in set(before) | set(after) if before.get(key) != after.get(key)}
                           if before and after else set())
                if current and changed and changed <= (_REFERENCE_FIELDS | {"question_ids", "entity_id"}):
                    # Independent migrations may update different IDs in the same session snapshot.
                    step = dict(step, before=current, after=transform_record(
                        current, state["kind"], state["old_id"], state["new_id"],
                    ))
                    if step["after"] == current:
                        continue
                else:
                    raise ValueError(f"Record changed since migration planning: {step['key']}; no overwrite performed")
            if step["after"] is None:
                transactions.append({"Delete": {"TableName": table.name, "Key": step["key"],
                                                 **expectation(current)}})
            else:
                transactions.append({"Put": {"TableName": table.name, "Item": step["after"],
                                              **expectation(current)}})
        if transactions:
            dynamodb_transact_write(transactions)
        state["next_group"] = next_group
        save_state(path, state)
    state["complete"] = True
    save_state(path, state)


def is_source(record, kind):
    content_id = record.get("id")
    if not is_legacy_content_id(content_id):
        return False
    if kind == "EXAM":
        return record.get("pk") == f"EXAM#{content_id}" and record.get("sk") == "META" and "title" in record
    return (record.get("pk", "").startswith("EXAM#") and record.get("sk") == f"QUESTION#{content_id}"
            and "choices" in record)


def run(kind, user_id, apply=False, content_ids=None, checkpoint_root=None):
    if kind not in {"EXAM", "QUESTION"}:
        raise ValueError("Migration kind must be EXAM or QUESTION")
    actor = get_user(user_id)
    for permission in (Permission.READ_NON_PUBLISHED_EXAM, Permission.READ_NON_PUBLISHED_QUESTION,
                       Permission.UPDATE_EXAM, Permission.UPDATE_QUESTION):
        verify_authorization(actor, permission)
    if actor.status == UserStatus.BANNED:
        raise UserBannedError()
    table = get_dynamodb_table()
    config = get_config()
    context = json.dumps([get_dynamodb_table_name(), config.get("dynamodb_endpoint"),
                          config.get("app_stage"), config.get("aws_region")])
    checkpoint_root = (Path(checkpoint_root) if checkpoint_root else
                       Path(__file__).resolve().parents[1] / ".tmp" / "content-id-migrations")
    checkpoint_dir = checkpoint_root / hashlib.sha256(context.encode()).hexdigest()[:16] / kind.lower()
    records = list(all_records(table))
    selected = set(content_ids) if content_ids else None
    plans = {state["old_id"]: state for state in (
        load_state(path) for path in checkpoint_dir.glob("*.json")
    ) if not state["complete"] and (selected is None or state["old_id"] in selected)}
    for source in records:
        if (is_source(source, kind) and source["id"] not in plans
                and (selected is None or source["id"] in selected)):
            new = make_content_id(source["title"], unique_suffix=source["id"].replace("-", "")[:16],
                                  fallback=kind.lower())
            plans[source["id"]] = {"input": source, "kind": kind, "old_id": source["id"],
                                   "new_id": new, "groups": None, "next_group": 0, "complete": False}
    totals = {"updated": 0, "planned": 0, "errors": 0}
    for old, state in plans.items():
        try:
            if state["groups"] is None:
                state = build_plan(state["input"], records, kind, state["new_id"])
            parent = (state["input"] if kind == "EXAM" else next((
                record for record in records if record.get("pk") == state["input"]["pk"]
                and record.get("sk") == "META"
            ), {}))
            if parent.get("question_status_sync_pending"):
                raise ValueError("Finish pending question publication synchronization before migrating")
            active = [record for record in records if record.get("exam_session")
                      and record.get("status") == "in_progress"
                      and (record.get("exam_id") in {old, state["new_id"]} if kind == "EXAM"
                           else record.get("exam_id") == state["input"]["exam_id"])]
            if active:
                raise ValueError("Finish active exam sessions before migrating this content")
            print(json.dumps({"input": state["input"], "output": {
                "action": "resume" if state["next_group"] else "migrate", "id": state["new_id"],
                "apply": apply, "record_operations": state["groups"],
                "publication": "preserve", "counters": "preserve",
            }}, default=str), flush=True)
            if apply:
                path = checkpoint_dir / f"{old}.json"
                save_state(path, state)
                apply_plan(table, state, path)
                totals["updated"] += 1
                # Keep the planning snapshot current for subsequent independent source items.
                by_key = {record_key(record): record for record in records}
                for group in state["groups"]:
                    for step in group:
                        key = step["key"]["pk"], step["key"]["sk"]
                        if step["after"] is None:
                            by_key.pop(key, None)
                        else:
                            by_key[key] = step["after"]
                records = list(by_key.values())
            else:
                totals["planned"] += 1
        except Exception as exc:
            code = getattr(exc, "response", {}).get("Error", {}).get("Code")
            if code in _FATAL_CODES or isinstance(exc, MigrationReadLimitError):
                raise
            totals["errors"] += 1
            print(json.dumps({"source": old, "error_type": type(exc).__name__, "reason": str(exc)}), flush=True)
    print(json.dumps({"kind": kind, "totals": totals}), flush=True)
    if totals["errors"]:
        raise SystemExit(1)
    return totals
