import asyncio
import os
import sys
from pathlib import Path
from types import SimpleNamespace

project_root = Path(os.getenv("PROJECT_ROOT", Path(__file__).parents[1]))
sys.path.insert(0, str(project_root / "shared"))
sys.path.insert(0, str(project_root / "web-lambda"))

previous_cwd = os.getcwd()
os.chdir(project_root / "shared")
import shared_utils
import web_utils
from query_dtos import ExamQueryDTO
os.chdir(previous_cwd)


def exam(exam_id, tags, rating, offset=None):
    return SimpleNamespace(
        id=exam_id,
        tags=tags,
        rating=rating,
        status="published",
        offset=offset,
    )


def test_popular_exams_by_tags_continues_past_page_without_matches(monkeypatch):
    pages = {
        None: [exam("global-1", ["databases"], 30, "next-page")],
        "next-page": [exam("aws-1", ["aws"], 20)],
    }
    offsets = []

    def get_popular_exams(query, cur_user):
        offsets.append(query.offset)
        return pages[query.offset]

    monkeypatch.setattr(shared_utils, "get_popular_exams", get_popular_exams)

    result = shared_utils.get_popular_exams_by_tags(ExamQueryDTO(tags=["aws"], limit=10))

    assert [item.id for item in result] == ["aws-1"]
    assert offsets == [None, "next-page"]


def test_popular_exams_by_tags_uses_last_match_as_pagination_cursor(monkeypatch):
    page = [
        exam("global-1", ["databases"], 30),
        exam("aws-1", ["aws"], 20),
        exam("aws-2", ["aws"], 10),
        exam("aws-3", ["aws"], 5, "end-of-query-page"),
    ]
    monkeypatch.setattr(shared_utils, "get_popular_exams", lambda query, cur_user: page)

    result = shared_utils.get_popular_exams_by_tags(ExamQueryDTO(tags=["aws"], limit=2))

    assert [item.id for item in result] == ["aws-1", "aws-2"]
    assert shared_utils.decode_offset(result[-1].offset) == {
        "pk": "EXAM#aws-2",
        "sk": "META",
        "exam_status_pk": "EXAM#published",
        "rating_sk": 10,
    }


def test_related_exams_query_each_tag_and_batch_load_candidates(monkeypatch):
    current = exam("current", ["aws", "python"], 40)
    candidates = [
        exam("related-1", ["aws"], 30),
        exam("related-2", ["aws", "python"], 20),
    ]
    captured_queries = []
    captured_batch_ids = []

    def get_exam_ids_by_tag(tag, limit):
        captured_queries.append((tag, limit))
        return {
            "aws": ["current", "related-1", "related-2"],
            "python": ["current", "related-2"],
        }[tag]

    def get_exams_by_ids(exam_ids):
        captured_batch_ids.extend(exam_ids)
        return candidates

    monkeypatch.setattr(web_utils, "_get_exam_ids_by_tag", get_exam_ids_by_tag)
    monkeypatch.setattr(web_utils, "_get_exams_by_ids", get_exams_by_ids)

    result = asyncio.run(web_utils.get_exam_related_exams(current, limit=2))

    assert [item.id for item in result] == ["related-2", "related-1"]
    assert sorted(captured_queries) == [("aws", 3), ("python", 3)]
    assert captured_batch_ids == ["related-1", "related-2"]


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
    monkeypatch.setattr(web_utils, "get_dynamodb_table", lambda: table)
    monkeypatch.setattr(web_utils, "exam_from_dynamodb", lambda item: item["id"])

    result = web_utils._get_exams_by_ids(["related-1", "related-2"])

    assert result == ["related-1", "related-2"]
    assert client.requests[1] == {"exams": {"Keys": [unprocessed_key]}}
