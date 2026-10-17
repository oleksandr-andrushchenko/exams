"""Validate and import a reviewed exam bundle; writes require --apply."""

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path

from api_utils import create_exam, update_exam_status
from certification_dtos import CertificationDTO
from certification_utils import create_certification, find_certification, get_certification
from exam_dtos import ExamDTO, UpdateExamStatusDTO
from content_ids import make_content_id
from question_dtos import QuestionDTO
from question_utils import create_question, get_questions
from shared_utils import (
    ExamStatus, Permission, UserStatus, add_dynamodb_update_transact, dynamodb_transact_write, get_category,
    get_dynamodb_item, get_user, get_web_base_url, to_kebab_case, verify_authorization,
)
from exam_utils import find_exam


def read_bundle(path):
    bundle = json.loads(Path(path).read_text())
    if bundle.get("format") != "examme-practice-exam-review" or bundle.get("format_version") != 1:
        raise ValueError("Unsupported exam bundle format")
    settings = bundle.get("exam_settings", {})
    exam_data = dict(bundle["exam"])
    exam_data.setdefault("duration_minutes", settings.get("suggested_duration_minutes"))
    exam_dto = ExamDTO(**exam_data)
    certification_dto = CertificationDTO(**bundle["certification"])
    questions = []
    for number, item in enumerate(bundle["questions"], 1):
        dto = QuestionDTO(title=item["title"], choices=item["choices"], reference_urls=item.get("reference_urls", []))
        correct = [index for index, choice in enumerate(dto.choices) if choice["is_correct"]]
        if "correct_choice_indices" in item and item["correct_choice_indices"] != correct:
            raise ValueError(f"Question {number}: answer key does not match choices")
        if "select_count" in item and item["select_count"] != len(correct):
            raise ValueError(f"Question {number}: selection count does not match choices")
        questions.append(dto)
    if not questions or len({q.title for q in questions}) != len(questions):
        raise ValueError("The bundle must have questions with unique titles")
    if settings.get("total_questions", len(questions)) != len(questions):
        raise ValueError("Question count does not match exam settings")
    payload = {"exam": asdict(exam_dto), "certification": asdict(certification_dto),
               "questions": [asdict(question) for question in questions]}
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    return exam_dto, certification_dto, questions, fingerprint


def require_user(user_id, permission):
    user = get_user(user_id)
    if user.status == UserStatus.BANNED:
        raise ValueError(f"User {user_id} is banned")
    verify_authorization(user, permission)
    return user


def pending_questions(exam, questions):
    existing = get_questions(exam.id) if exam else []
    expected = {question.title: question for question in questions}
    seen = set()
    for question in existing:
        dto = expected.get(question.title)
        if dto is None or question.title in seen:
            raise ValueError("Existing exam has unexpected or duplicate questions; import stopped")
        if question.choices != dto.choices or question.reference_urls != dto.reference_urls:
            raise ValueError(f"Existing question differs from the bundle: {question.title}")
        seen.add(question.title)
    return [question for question in questions if question.title not in seen]


def set_import_metadata(exam_id, changes):
    transacts = []
    add_dynamodb_update_transact(transacts, (f"EXAM#{exam_id}", "META"), changes=changes)
    dynamodb_transact_write(transacts)


def run(path, owner_id, approve_by=None, apply=False):
    exam_dto, certification_dto, questions, fingerprint = read_bundle(path)
    owner = require_user(owner_id, Permission.CREATE_EXAM)
    approver = require_user(approve_by, Permission.UPDATE_EXAM_STATUS) if approve_by else None
    certification = (get_certification(exam_dto.certification_id) if exam_dto.certification_id
                     else find_certification(to_kebab_case(certification_dto.name)))
    if certification:
        if (to_kebab_case(certification.name) != to_kebab_case(certification_dto.name)
                or certification.provider != certification_dto.provider):
            raise ValueError("Existing certification does not match the bundle")
        get_category(certification.category)
    else:
        verify_authorization(owner, Permission.CREATE_CERTIFICATION)
        get_category(certification_dto.category)

    # Use the unique slug locator, not an eventually consistent catalog index.
    locator = get_dynamodb_item(f"EXAM_SLUG#{to_kebab_case(exam_dto.title)}", "META")
    stable_exam_id = make_content_id(exam_dto.title, unique_suffix=hashlib.sha256(
        (owner.id + fingerprint).encode()
    ).hexdigest()[:16])
    exam = find_exam(stable_exam_id)
    if exam is None and locator:
        legacy = find_exam(locator["exam_id"])
        if legacy and legacy.owner_id == owner.id:
            record = get_dynamodb_item(f"EXAM#{legacy.id}", "META")
            if record.get("import_bundle_sha256") == fingerprint:
                exam = legacy
    if locator and not exam:
        raise ValueError("Exam slug locator points to a missing exam")
    if exam:
        record = get_dynamodb_item(f"EXAM#{exam.id}", "META")
        if exam.owner_id != owner.id or record.get("import_bundle_sha256") != fingerprint:
            raise ValueError("Exam title already exists outside this import; refusing to overwrite it")
        expected_certification_id = certification.id if certification else None
        if (exam.title != exam_dto.title or exam.description != exam_dto.description
                or exam.exam_code != exam_dto.exam_code or exam.duration_minutes != exam_dto.duration_minutes
                or exam.tags != exam_dto.tags or exam.certification_id != expected_certification_id):
            raise ValueError("Imported exam metadata has changed; refusing to overwrite it")
    missing = pending_questions(exam, questions)
    if exam and exam.status == ExamStatus.PUBLISHED and missing:
        raise ValueError("Published exam is incomplete; refusing to modify published content")
    plan = {
        "mode": "apply" if apply else "dry_run", "owner_id": owner.id,
        "approver_id": approver.id if approver else None, "title": exam_dto.title,
        "certification": certification.name if certification else certification_dto.name,
        "create_certification": certification is None, "existing_exam_id": exam.id if exam else None,
        "total_questions": len(questions), "questions_to_create": len(missing),
        "bundle_sha256": fingerprint,
    }
    print(json.dumps(plan, indent=4), flush=True)
    if not apply:
        return plan
    if not certification:
        certification = create_certification(certification_dto, owner)
    exam_dto.certification_id = certification.id
    if not exam:
        exam = create_exam(exam_dto, owner, exam_id=stable_exam_id)
        print(json.dumps({"created_exam_id": exam.id}), flush=True)
        set_import_metadata(exam.id, {"import_bundle_sha256": fingerprint})
    for index, question_dto in enumerate(missing, 1):
        question = create_question(exam, question_dto, owner)
        print(json.dumps({"created_question_id": question.id, "progress": f"{index}/{len(missing)}"}), flush=True)
    exam = find_exam(exam.id)
    if pending_questions(exam, questions) or exam.questions_count != len(questions):
        raise ValueError("Post-import verification failed; exam has not been approved")
    if approver and exam.status != ExamStatus.PUBLISHED:
        set_import_metadata(exam.id, {"import_approver_id": approver.id})
        update_exam_status(exam, UpdateExamStatusDTO(status=ExamStatus.PUBLISHED), approver)
    exam = find_exam(exam.id)
    if approver and exam.status != ExamStatus.PUBLISHED:
        raise ValueError("Publication verification failed")
    result = {"exam_id": exam.id, "status": exam.status, "owner_id": exam.owner_id,
              "approver_id": approver.id if approver else None, "questions_count": exam.questions_count,
              "url": f"{get_web_base_url().rstrip('/')}/exams/{exam.id}"}
    print(json.dumps(result, indent=4), flush=True)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--owner-id", required=True)
    parser.add_argument("--approve-by", help="Publish after verifying all questions, using this authorized user")
    parser.add_argument("--apply", action="store_true", help="Write records; without this flag the command is read-only")
    args = parser.parse_args()
    run(args.bundle, args.owner_id, args.approve_by, args.apply)


if __name__ == "__main__":
    main()
