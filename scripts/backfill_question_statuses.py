"""Build status-specific question discovery records; defaults to read-only dry run."""
import argparse
from dataclasses import asdict, replace
import json

from question_utils import add_question_status_transacts, get_questions, question_listing_item
from query_dtos import ExamQueryDTO, ExamStatus, QuestionStatus
from shared_utils import (
    Permission, UserStatus, add_dynamodb_delete_transact, dynamodb_transact_write, get_dynamodb_item,
    get_dynamodb_table_name, get_user, verify_authorization,
)
from exam_utils import get_latest_exams


def run(user_id, apply=False, remove_legacy=False):
    actor = get_user(user_id)
    verify_authorization(actor, Permission.UPDATE_QUESTION_STATUS)
    if actor.status == UserStatus.BANNED:
        raise ValueError("Maintenance actor is banned")
    totals = {"updated": 0, "planned": 0, "skipped": 0, "errors": 0}
    for status in ExamStatus:
        offset = None
        while True:
            exams = get_latest_exams(ExamQueryDTO(status=status, limit=1000, offset=offset), actor)
            for exam in exams:
                for question in get_questions(exam.id):
                    try:
                        record = get_dynamodb_item(f"EXAM#{exam.id}", f"QUESTION#{question.id}")
                        target_status = (QuestionStatus(record["status"]) if "status" in record
                                         else QuestionStatus(exam.status))
                        if exam.status != ExamStatus.PUBLISHED:
                            target_status = QuestionStatus(exam.status)
                        updated = replace(question, status=target_status, exam_title=exam.title)
                        target_key = (f"QUESTIONS#{target_status}", f"{question.created_at}#{question.id}")
                        listing = get_dynamodb_item(*target_key)
                        legacy_key = ("QUESTIONS", target_key[1])
                        legacy = get_dynamodb_item(*legacy_key)
                        expected = question_listing_item(updated)
                        matches = listing and all(listing.get(key) == value for key, value in expected.items())
                        changes = record.get("status") != target_status or not matches or (legacy and remove_legacy)
                        print(json.dumps({"input": asdict(question), "output": {
                            "action": "update" if changes else "unchanged", "status": target_status,
                            "listing": expected, "remove_legacy": bool(legacy and remove_legacy), "apply": apply,
                        }}, default=str), flush=True)
                        if not changes:
                            totals["skipped"] += 1
                            continue
                        if apply:
                            transacts = []
                            add_question_status_transacts(transacts, replace(question, exam_title=exam.title),
                                                          target_status, question.comment)
                            if legacy and remove_legacy:
                                add_dynamodb_delete_transact(transacts, legacy_key)
                            transacts.append({"ConditionCheck": {
                                "TableName": get_dynamodb_table_name(),
                                "Key": {"pk": f"EXAM#{exam.id}", "sk": "META"},
                                "ConditionExpression": "#status = :status AND (attribute_not_exists(#pending) OR #pending = :false)",
                                "ExpressionAttributeNames": {"#status": "status", "#pending": "question_status_sync_pending"},
                                "ExpressionAttributeValues": {":status": exam.status, ":false": False},
                            }})
                            dynamodb_transact_write(transacts)
                            saved = get_dynamodb_item(f"EXAM#{exam.id}", f"QUESTION#{question.id}")
                            if saved.get("status") != target_status or not get_dynamodb_item(*target_key):
                                raise ValueError("Post-backfill verification failed")
                            print(json.dumps({"updated_question_id": question.id, "status": target_status}), flush=True)
                            totals["updated"] += 1
                        else:
                            totals["planned"] += 1
                    except (ValueError, LookupError) as exc:
                        totals["errors"] += 1
                        print(json.dumps({"source": question.id, "error_type": type(exc).__name__, "reason": str(exc)}), flush=True)
            if not exams or not exams[-1].offset:
                break
            offset = exams[-1].offset
    print(json.dumps({"totals": totals}), flush=True)
    if totals["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--remove-legacy", action="store_true",
                        help="Also remove old QUESTIONS records after the old application version is retired")
    args = parser.parse_args()
    run(args.user_id, args.apply, args.remove_legacy)
