"""Paged, shared-tag exam recommendations for page renders and lazy loads."""

from query_dtos import RelatedExamQueryDTO
from shared_utils import ExamStatus, Key, decode_offset, encode_offset, get_dynamodb_table, query_dynamodb_table
from exam_utils import exam_from_dynamodb


def _get_exams_by_ids(exam_ids):
    if not exam_ids:
        return []
    table = get_dynamodb_table()
    keys = [{"pk": f"EXAM#{exam_id}", "sk": "META"} for exam_id in exam_ids]
    items = []
    for start in range(0, len(keys), 100):
        pending = keys[start:start + 100]
        for _ in range(3):
            response = table.meta.client.batch_get_item(RequestItems={table.name: {"Keys": pending}})
            items.extend(response.get("Responses", {}).get(table.name, []))
            pending = response.get("UnprocessedKeys", {}).get(table.name, {}).get("Keys", [])
            if not pending:
                break
        if pending:
            # Do not advance past unread records and silently omit recommendations.
            raise RuntimeError("Unable to load all related exam candidates; retry this page")
    return [exam_from_dynamodb(item) for item in items]


def _get_tag_records(tag, before, limit):
    condition = Key("pk").eq(f"EXAM_TAG_COMBO#{tag}")
    if before:
        condition &= Key("sk").lt(before)
    response = query_dynamodb_table(key_condition_expr=condition, scan_index_forward=False, limit=limit)
    return response.get("Items", [])


def get_related_exams(exam, query=None):
    query = query or RelatedExamQueryDTO()
    before = None
    if query.offset:
        cursor = decode_offset(query.offset)
        if cursor["pk"] != f"RELATED_EXAMS#{exam.id}":
            raise ValueError("offset belongs to a different exam")
        before = cursor["sk"]
    if not exam.tags:
        return []
    found = []
    positions = {}
    while len(found) <= query.limit:
        # Fetch enough from each tag to choose the next global page without
        # skipping records from a tag with a longer history. Each exam has the
        # same timestamp/ID sort key in every one of its tag partitions.
        records = {}
        for tag in sorted(set(exam.tags)):
            for item in _get_tag_records(tag, before, query.limit + 1):
                records[item["sk"]] = item["exam_id"]
        if not records:
            break
        window = sorted(records, reverse=True)[:query.limit + 1]
        candidates = {item.id: item for item in _get_exams_by_ids(
            [records[key] for key in window if records[key] != exam.id]
        )}
        for key in window:
            candidate = candidates.get(records[key])
            if (candidate and candidate.id != exam.id and candidate.status == ExamStatus.PUBLISHED
                    and set(exam.tags).intersection(candidate.tags)):
                candidate.offset = None
                found.append(candidate)
                positions[candidate.id] = key
                if len(found) > query.limit:
                    break
        before = window[-1]
    results = found[:query.limit]
    if len(found) > query.limit:
        results[-1].offset = encode_offset({"pk": f"RELATED_EXAMS#{exam.id}", "sk": positions[results[-1].id]})
    return results
