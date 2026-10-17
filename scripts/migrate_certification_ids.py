"""Replace certification UUIDs with their existing URL identifiers; defaults to dry run."""

import argparse
import json

from query_dtos import ExamStatus
from shared_utils import (
    Key, Permission, UserBannedError, UserStatus, add_dynamodb_update_transact,
    dynamodb_transact_write, get_dynamodb_table, get_user, verify_authorization,
)


FATAL_CODES = {
    "AccessDeniedException", "UnrecognizedClientException", "ExpiredTokenException",
    "InvalidSignatureException", "ProvisionedThroughputExceededException", "ThrottlingException",
    "RequestLimitExceeded", "ResourceNotFoundException",
}


def query_all(table, **params):
    while True:
        response = table.query(**params)
        yield from response.get("Items", [])
        if not response.get("LastEvaluatedKey"):
            return
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def update_identity(key, changes, field, original):
    transacts = []
    add_dynamodb_update_transact(transacts, key, changes, add_updated_at=False)
    update = transacts[0]["Update"]
    update["ExpressionAttributeNames"]["#original_id"] = field
    if original is None:
        update["ExpressionAttributeValues"][":null_type"] = "NULL"
        update["ConditionExpression"] = (
            "attribute_exists(pk) AND (attribute_not_exists(#original_id) OR attribute_type(#original_id, :null_type))"
        )
    else:
        update["ExpressionAttributeValues"][":original_id"] = original
        update["ConditionExpression"] = "attribute_exists(pk) AND #original_id = :original_id"
    dynamodb_transact_write(transacts)


def report_error(source, exc, totals):
    code = getattr(exc, "response", {}).get("Error", {}).get("Code")
    if code in FATAL_CODES:
        raise exc
    totals["errors"] += 1
    print(json.dumps({"source": source, "error_type": type(exc).__name__, "reason": str(exc)}), flush=True)


def run(user_id, apply=False):
    actor = get_user(user_id)
    for permission in (Permission.UPDATE_CERTIFICATION, Permission.UPDATE_EXAM, Permission.READ_NON_PUBLISHED_EXAM):
        verify_authorization(actor, permission)
    if actor.status == UserStatus.BANNED:
        raise UserBannedError()
    table = get_dynamodb_table()
    totals = {"updated_certifications": 0, "updated_exams": 0, "planned": 0, "skipped": 0, "errors": 0}
    records = list(query_all(table, KeyConditionExpression=Key("pk").eq("CERTIFICATION"), ConsistentRead=True))
    by_id = {}
    for record in records:
        for value in (record["id"], record["sk"]):
            if value in by_id and by_id[value] != record["sk"]:
                raise ValueError(f"Ambiguous certification identifier: {value}")
            by_id[value] = record["sk"]
    linked = {record["sk"]: [] for record in records}
    # Existing status indexes enumerate exams without scanning unrelated table records.
    for status in ExamStatus:
        for record in query_all(table, IndexName="EXAMS_BY_STATUS_CREATED_AT_2",
                                KeyConditionExpression=Key("exam_status_pk").eq(f"EXAM#{status}")):
            reference = record.get("certification_id")
            if not reference and not record.get("certification_slug"):
                continue
            target = by_id.get(reference) or by_id.get(record.get("certification_slug"))
            if target is None:
                report_error(record["id"], LookupError(f"Unknown certification reference: {reference}"), totals)
            else:
                linked[target].append(record["id"])
    for listed in records:
        certification_id = listed["sk"]
        try:
            current = table.get_item(Key={"pk": "CERTIFICATION", "sk": certification_id},
                                     ConsistentRead=True).get("Item")
            if not current:
                raise LookupError("Certification was removed during migration")
            if current.get("slug", certification_id) != certification_id:
                raise ValueError("Certification slug does not match its database key")
            if current.get("exam_snapshot_sync_pending"):
                raise ValueError("Finish pending certification snapshot synchronization before migrating")
            failed = False
            for exam_id in linked[certification_id]:
                try:
                    key = {"pk": f"EXAM#{exam_id}", "sk": "META"}
                    exam = table.get_item(Key=key, ConsistentRead=True).get("Item")
                    if not exam:
                        raise LookupError("Exam was removed during migration")
                    reference = exam.get("certification_id")
                    target = by_id.get(reference) or by_id.get(exam.get("certification_slug"))
                    if target != certification_id:
                        raise ValueError("Exam was relinked during migration; rerun to refresh the plan")
                    changes = {}
                    if reference != certification_id:
                        changes["certification_id"] = certification_id
                    if "certification_slug" in exam:
                        changes["certification_slug"] = None
                    print(json.dumps({"input": exam, "output": {
                        "action": "migrate" if changes else "unchanged", "key": key,
                        "changes": changes, "apply": apply, "publication": "preserve",
                    }}, default=str), flush=True)
                    if not changes:
                        totals["skipped"] += 1
                    elif apply:
                        update_identity((key["pk"], key["sk"]), changes, "certification_id", reference)
                        totals["updated_exams"] += 1
                    else:
                        totals["planned"] += 1
                except Exception as exc:
                    failed = True
                    report_error(exam_id, exc, totals)
            if failed:
                raise RuntimeError("Linked exam migration failed; certification identity remains retryable")
            changes = {}
            if current["id"] != certification_id:
                changes["id"] = certification_id
            if "slug" in current:
                changes["slug"] = None
            print(json.dumps({"input": current, "output": {
                "action": "migrate" if changes else "unchanged",
                "key": {"pk": "CERTIFICATION", "sk": certification_id}, "changes": changes,
                "apply": apply, "url": f"/certifications/{certification_id}",
            }}, default=str), flush=True)
            if not changes:
                totals["skipped"] += 1
            elif apply:
                update_identity(("CERTIFICATION", certification_id), changes, "id", current["id"])
                totals["updated_certifications"] += 1
            else:
                totals["planned"] += 1
        except Exception as exc:
            report_error(certification_id, exc, totals)
    print(json.dumps({"totals": totals}), flush=True)
    if totals["errors"]:
        raise SystemExit(1)
    return totals


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--apply", action="store_true", help="Write the migration; otherwise only report the plan")
    args = parser.parse_args()
    run(args.user_id, args.apply)
