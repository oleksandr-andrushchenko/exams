import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))
sys.path.insert(0, str(project_root / "web-lambda"))

previous_cwd = os.getcwd()
os.chdir(project_root / "shared")
import shared_utils
import exam_utils
import web_utils
import related_exam_utils
from query_dtos import ExamQueryDTO, RelatedExamQueryDTO
os.chdir(previous_cwd)


def exam(exam_id, tags, rating, offset=None):
    return SimpleNamespace(
        id=exam_id,
        tags=tags,
        rating=rating,
        status="published",
        offset=offset,
    )


def homepage_certification_item(value):
    return {"id": value, "name": value, "provider": "AWS",
            "description": "Credential", "created_at": 1}


@pytest.mark.parametrize("configured_ids", [None, []])
def test_homepage_certifications_default_is_one_limited_query(monkeypatch, configured_ids):
    calls = []

    def query(**params):
        calls.append(params)
        return {"Items": [homepage_certification_item(str(i)) for i in range(4)],
                "LastEvaluatedKey": {"pk": "CERTIFICATION", "sk": "3"}}

    monkeypatch.setattr(web_utils, "get_config", lambda: {"index_page_certification_ids": configured_ids})
    monkeypatch.setattr(web_utils, "get_dynamodb_table", lambda: SimpleNamespace(query=query))
    assert [item.id for item in web_utils.get_homepage_certifications()] == ["0", "1", "2", "3"]
    assert len(calls) == 1
    assert calls[0]["Limit"] == 4
    assert "FilterExpression" not in calls[0]


@pytest.mark.parametrize("production", [False, True])
def test_homepage_certifications_override_uses_one_batch_and_configured_order(monkeypatch, production):
    monkeypatch.setattr(web_utils, "is_prod", lambda: production)
    calls = []
    ids = ["5", "missing", "3", "1", "2", "4", "3"]

    def batch_get_item(**params):
        calls.append(params)
        items = [homepage_certification_item(str(i)) for i in range(1, 6)]
        return {"Responses": {"catalog": items}}

    monkeypatch.setattr(web_utils, "get_config", lambda: {"index_page_certification_ids": ids})
    table = SimpleNamespace(name="catalog", meta=SimpleNamespace(client=SimpleNamespace(batch_get_item=batch_get_item)))
    monkeypatch.setattr(web_utils, "get_dynamodb_table", lambda: table)
    assert [item.id for item in web_utils.get_homepage_certifications()] == ["5", "3", "1", "2", "4"]
    assert calls == [{"RequestItems": {"catalog": {"Keys": [
        {"pk": "CERTIFICATION", "sk": certification_id} for certification_id in dict.fromkeys(ids)
    ]}}}]


def test_homepage_certifications_override_does_not_return_partial_batch(monkeypatch):
    monkeypatch.setattr(web_utils, "get_config", lambda: {"index_page_certification_ids": ["selected"]})
    client = SimpleNamespace(batch_get_item=lambda **params: {
        "Responses": {"catalog": []},
        "UnprocessedKeys": {"catalog": {"Keys": [{"pk": "CERTIFICATION", "sk": "selected"}]}},
    })
    monkeypatch.setattr(web_utils, "get_dynamodb_table", lambda: SimpleNamespace(
        name="catalog", meta=SimpleNamespace(client=client),
    ))
    with pytest.raises(RuntimeError, match="Unable to load all selected"):
        web_utils.get_homepage_certifications()


@pytest.mark.parametrize("ids", ["id", [1], [" "], [str(i) for i in range(101)]])
def test_homepage_certifications_rejects_invalid_configuration(monkeypatch, ids):
    monkeypatch.setattr(web_utils, "get_config", lambda: {"index_page_certification_ids": ids})
    with pytest.raises(ValueError, match="index_page_certification_ids"):
        web_utils.get_homepage_certifications()


def test_popular_exams_by_tags_continues_past_page_without_matches(monkeypatch):
    pages = {
        None: [exam("global-1", ["databases"], 30, "next-page")],
        "next-page": [exam("aws-1", ["aws"], 20)],
    }
    offsets = []

    def get_popular_exams(query, cur_user):
        offsets.append(query.offset)
        return pages[query.offset]

    monkeypatch.setattr(exam_utils, "get_popular_exams", get_popular_exams)

    result = exam_utils.get_popular_exams_by_tags(ExamQueryDTO(tags=["aws"], limit=10))

    assert [item.id for item in result] == ["aws-1"]
    assert offsets == [None, "next-page"]


def test_popular_exams_by_tags_uses_last_match_as_pagination_cursor(monkeypatch):
    page = [
        exam("global-1", ["databases"], 30),
        exam("aws-1", ["aws"], 20),
        exam("aws-2", ["aws"], 10),
        exam("aws-3", ["aws"], 5, "end-of-query-page"),
    ]
    monkeypatch.setattr(exam_utils, "get_popular_exams", lambda query, cur_user: page)

    result = exam_utils.get_popular_exams_by_tags(ExamQueryDTO(tags=["aws"], limit=2))

    assert [item.id for item in result] == ["aws-1", "aws-2"]
    assert shared_utils.decode_offset(result[-1].offset) == {
        "pk": "EXAM#aws-2",
        "sk": "META",
        "exam_status_pk": "EXAM#published",
        "rating_sk": 10,
    }


def test_related_exams_paginate_shared_tags_without_duplicates_or_current_exam(monkeypatch):
    current = exam("current", ["aws", "python"], 40)
    candidates = {item.id: item for item in [
        exam("current", ["aws", "python"], 40),
        exam("related-1", ["aws"], 30),
        exam("related-2", ["aws", "python"], 20),
        exam("related-3", ["python"], 10),
    ]}
    records = {
        "aws": [("EXAM#40#current", "current"), ("EXAM#30#related-1", "related-1"),
                ("EXAM#20#related-2", "related-2")],
        "python": [("EXAM#40#current", "current"), ("EXAM#20#related-2", "related-2"),
                   ("EXAM#10#related-3", "related-3")],
    }

    def tag_records(tag, before, limit):
        return [{"sk": key, "exam_id": exam_id} for key, exam_id in records[tag]
                if before is None or key < before][:limit]

    monkeypatch.setattr(related_exam_utils, "_get_tag_records", tag_records)
    monkeypatch.setattr(related_exam_utils, "_get_exams_by_ids", lambda ids: [candidates[item] for item in ids])
    first = related_exam_utils.get_related_exams(current, RelatedExamQueryDTO(limit=2))
    assert [item.id for item in first] == ["related-1", "related-2"]
    assert first[-1].offset
    second = related_exam_utils.get_related_exams(current, RelatedExamQueryDTO(limit=2, offset=first[-1].offset))
    assert [item.id for item in second] == ["related-3"]
    assert second[-1].offset is None


def test_related_exam_batch_read_retries_unprocessed_keys(monkeypatch):
    unprocessed_key = {"pk": "EXAM#related-2", "sk": "META"}

    class Client:
        def __init__(self):
            self.requests = []

        def batch_get_item(self, RequestItems):
            self.requests.append(RequestItems)
            if len(self.requests) == 1:
                return {
                    "Responses": {"exams": [{"id": "related-1"}]},
                    "UnprocessedKeys": {"exams": {"Keys": [unprocessed_key]}},
                }
            return {
                "Responses": {"exams": [{"id": "related-2"}]},
                "UnprocessedKeys": {},
            }

    client = Client()
    table = SimpleNamespace(name="exams", meta=SimpleNamespace(client=client))
    monkeypatch.setattr(related_exam_utils, "get_dynamodb_table", lambda: table)
    monkeypatch.setattr(related_exam_utils, "exam_from_dynamodb", lambda item: item["id"])

    result = related_exam_utils._get_exams_by_ids(["related-1", "related-2"])

    assert result == ["related-1", "related-2"]
    assert client.requests[1] == {"exams": {"Keys": [unprocessed_key]}}


@pytest.mark.parametrize("title", ["AWS Certified Solutions Architect Practice Exam", "a" * 500,
                                    "界" * 500, "é" * 500, "𐐀" * 500, "!!!"])
def test_readable_content_ids_preserve_titles_with_safe_key_and_url_lengths(title):
    from urllib.parse import quote
    from content_ids import MAX_CONTENT_ID_BYTES, MAX_ENCODED_CONTENT_ID_LENGTH, make_content_id

    content_id = make_content_id(title, unique_suffix="1234567890abcdef")
    assert content_id.endswith("-1234567890abcdef")
    assert len(content_id.encode("utf-8")) <= MAX_CONTENT_ID_BYTES
    assert len(quote(content_id, safe="")) <= MAX_ENCODED_CONTENT_ID_LENGTH
    assert len(("QUESTION#" + content_id).encode("utf-8")) <= 1024
    assert len(("EXAM#1792200000000#" + content_id).encode("utf-8")) <= 1024
    if title == "a" * 500:
        assert content_id.startswith(title + "-")
    if title == "!!!":
        assert content_id.startswith("item-")


def test_identical_titles_receive_distinct_readable_ids():
    from content_ids import make_content_id

    first = make_content_id("The same exam title")
    second = make_content_id("The same exam title")
    assert first.startswith("the-same-exam-title-")
    assert second.startswith("the-same-exam-title-")
    assert first != second
