"""Certification writes and synchronization of linked exam card snapshots."""

from dataclasses import fields
from uuid import uuid4

from boto3.dynamodb.conditions import Attr

from certification_dtos import CertificationDTO
from certification_utils import Certification, certification_from_dynamodb
from query_dtos import ExamStatus
from shared_utils import (
    DynamoDBTransactionError, Key, Permission, User, UserBannedError, UserStatus,
    add_dynamodb_update_transact, dynamodb_transact_write, get_category,
    get_dynamodb_table, get_dynamodb_table_name, utc_now, verify_authorization,
)


def exam_certification_fields(certification: Certification | None) -> dict[str, str | None]:
    return {
        "certification_name": certification.name if certification else None,
        "certification_image_filename": certification.image_filename if certification else None,
    }


def _certification_record(certification_id):
    record = get_dynamodb_table().get_item(
        Key={"pk": "CERTIFICATION", "sk": certification_id}, ConsistentRead=True,
    ).get("Item")
    if not record:
        raise LookupError(f"Certification '{certification_id}' not found")
    return record


def _sync_batch(certification, token, exam_ids):
    fields = exam_certification_fields(certification)
    for attempt in range(3):
        transacts = [{"ConditionCheck": {
            "TableName": get_dynamodb_table_name(),
            "Key": {"pk": "CERTIFICATION", "sk": certification.id},
            "ConditionExpression": "#token = :token",
            "ExpressionAttributeNames": {"#token": "exam_snapshot_sync_token"},
            "ExpressionAttributeValues": {":token": token},
        }}]
        for exam_id in exam_ids:
            # On conditional failure, discard deleted/relinked or already refreshed exams before retrying.
            if attempt:
                current = get_dynamodb_table().get_item(
                    Key={"pk": f"EXAM#{exam_id}", "sk": "META"}, ConsistentRead=True,
                ).get("Item")
                if (not current or current.get("certification_id") != certification.id
                        or all(current.get(key) == value for key, value in fields.items())):
                    continue
            add_dynamodb_update_transact(transacts, (f"EXAM#{exam_id}", "META"),
                                        dict(fields), add_updated_at=False)
            update = transacts[-1]["Update"]
            update["ConditionExpression"] = "#linked_certification = :linked_certification"
            update["ExpressionAttributeNames"]["#linked_certification"] = "certification_id"
            update["ExpressionAttributeValues"][":linked_certification"] = certification.id
        try:
            dynamodb_transact_write(transacts)
            return
        except DynamoDBTransactionError as exc:
            if (not exc.is_conditional() or attempt == 2
                    or _certification_record(certification.id).get("exam_snapshot_sync_token") != token):
                raise


def _synchronize_exam_snapshots(certification, token):
    table = get_dynamodb_table()
    for status in ExamStatus:
        params = {
            "IndexName": "EXAMS_BY_STATUS_CREATED_AT_2",
            "KeyConditionExpression": Key("exam_status_pk").eq(f"EXAM#{status}"),
            "FilterExpression": Attr("certification_id").eq(certification.id),
            "ProjectionExpression": "#id",
            "ExpressionAttributeNames": {"#id": "id"},
        }
        while True:
            response = table.query(**params)
            ids = [item["id"] for item in response.get("Items", [])]
            # DynamoDB permits 100 transaction actions, including the certification revision check.
            for start in range(0, len(ids), 99):
                _sync_batch(certification, token, ids[start:start + 99])
            if not response.get("LastEvaluatedKey"):
                break
            params["ExclusiveStartKey"] = response["LastEvaluatedKey"]
    transacts = []
    add_dynamodb_update_transact(transacts, ("CERTIFICATION", certification.id),
                                {"exam_snapshot_sync_pending": False}, add_updated_at=False)
    update = transacts[-1]["Update"]
    update["ConditionExpression"] = "#token = :token"
    update["ExpressionAttributeNames"]["#token"] = "exam_snapshot_sync_token"
    update["ExpressionAttributeValues"][":token"] = token
    dynamodb_transact_write(transacts)


def update_certification(certification: Certification, dto: CertificationDTO, user: User) -> None:
    verify_authorization(user, Permission.UPDATE_CERTIFICATION)
    if user.status == UserStatus.BANNED:
        raise UserBannedError()
    get_category(dto.category)
    record = _certification_record(certification.id)
    current = certification_from_dynamodb(record)
    changes = dto.get_changes(current)
    sync_needed = bool(record.get("exam_snapshot_sync_pending") or {"name", "image_filename"} & changes.keys())
    if not changes and not sync_needed:
        return
    if changes:
        changes["updated_at"] = utc_now()
    persisted = dict(changes)
    token = str(uuid4()) if sync_needed else None
    if sync_needed:
        persisted.update(exam_snapshot_sync_pending=True, exam_snapshot_sync_token=token)
    transacts = []
    add_dynamodb_update_transact(transacts, ("CERTIFICATION", current.id), persisted, add_updated_at=False)
    transacts[-1]["Update"]["ConditionExpression"] = "attribute_exists(pk)"
    dynamodb_transact_write(transacts)
    for key, value in changes.items():
        setattr(current, key, value)
    for field in fields(dto):
        setattr(certification, field.name, getattr(current, field.name))
    certification.updated_at = current.updated_at
    if sync_needed:
        _synchronize_exam_snapshots(current, token)
