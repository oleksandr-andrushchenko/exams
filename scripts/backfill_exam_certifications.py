"""Refresh stored certification card fields on existing exams; defaults to dry run."""

import argparse
from dataclasses import asdict
import json

from api_utils import update_exam
from certification_mutations import exam_certification_fields
from certification_utils import get_certifications
from exam_dtos import UpdateExamDTO
from query_dtos import ExamQueryDTO, ExamStatus
from shared_utils import Permission, UserStatus, get_user, verify_authorization
from exam_utils import find_exam, get_latest_exams


def run(user_id, apply=False):
    actor = get_user(user_id)
    verify_authorization(actor, Permission.UPDATE_EXAM)
    verify_authorization(actor, Permission.READ_NON_PUBLISHED_EXAM)
    if actor.status == UserStatus.BANNED:
        raise ValueError("Maintenance actor is banned")
    certifications = {item.id: item for item in get_certifications()}
    totals = {"updated": 0, "planned": 0, "skipped": 0, "errors": 0}
    for status in ExamStatus:
        offset = None
        while True:
            exams = get_latest_exams(ExamQueryDTO(status=status, limit=1000, offset=offset), actor)
            for listed_exam in exams:
                try:
                    exam = find_exam(listed_exam.id)
                    if exam is None:
                        raise LookupError("Exam no longer exists")
                    certification = certifications.get(exam.certification_id)
                    if exam.certification_id and certification is None:
                        raise LookupError(f"Certification '{exam.certification_id}' not found")
                    fields = exam_certification_fields(certification)
                    changes = {key: value for key, value in fields.items() if getattr(exam, key) != value}
                    print(json.dumps({"input": asdict(exam), "output": {
                        "action": "refresh" if changes else "unchanged", "exam_id": exam.id,
                        "certification_fields": fields, "changes": changes,
                        "service": "update_exam", "dto": {}, "actor_id": actor.id, "apply": apply,
                        "status": exam.status,
                    }}, default=str), flush=True)
                    if not changes:
                        totals["skipped"] += 1
                    elif not apply:
                        totals["planned"] += 1
                    else:
                        update_exam(exam, UpdateExamDTO(), actor)
                        saved = find_exam(exam.id)
                        if saved is None or any(getattr(saved, key) != value for key, value in fields.items()):
                            raise ValueError("Post-backfill verification failed")
                        totals["updated"] += 1
                except (ValueError, LookupError) as exc:
                    totals["errors"] += 1
                    print(json.dumps({"source": listed_exam.id, "error_type": type(exc).__name__,
                                      "reason": str(exc)}), flush=True)
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
    args = parser.parse_args()
    run(args.user_id, args.apply)
