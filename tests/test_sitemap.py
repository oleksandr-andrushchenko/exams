"""Sitemap coverage, XML encoding, and protocol limits without persistence writes."""
import os
import sys
from pathlib import Path
from types import SimpleNamespace
from xml.etree import ElementTree

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "shared"))
sys.path.insert(0, str(project_root / "api-lambda"))

import api_utils
from shared_utils import config
from web import Application, Request
from web_route_metadata import WEB_URL_ROUTES

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


@pytest.fixture
def sitemap_context(monkeypatch):
    app = Application()
    for name, path in WEB_URL_ROUTES.items():
        app.add_url_route(path, name)
    request = Request({
        "type": "http", "method": "GET", "path": "/", "root_path": "", "query_string": b"",
        "scheme": "https", "server": ("example.com", 443), "headers": [], "app": app,
    })
    monkeypatch.setitem(config, "web_base_url", "https://example.com")
    monkeypatch.setitem(config, "static_base_url", "https://static.example.com")
    files = {}

    def save(dto, filename):
        files[filename] = dto.content
        return filename

    monkeypatch.setattr(api_utils, "save_public_file", save)
    return request, files


def test_small_sitemap_escapes_urls_and_omits_unknown_dates(sitemap_context):
    request, files = sitemap_context
    loc = 'https://example.com/exams?category=writing&model=a<b&name="é"'
    count, url = api_utils._save_sitemap([(loc, None), ("https://example.com/@creator", "2026-01-02")], request)
    root = ElementTree.fromstring(files["sitemap.xml"])
    assert count == 2
    assert url == "https://static.example.com/sitemap.xml"
    assert root.find("s:url/s:loc", NS).text == loc
    assert root.find("s:url", NS).find("s:lastmod", NS) is None
    assert root.findall("s:url/s:lastmod", NS)[0].text == "2026-01-02"
    assert list(files) == ["sitemap.xml"]


@pytest.mark.parametrize("limit_kind", ["urls", "bytes"])
def test_large_sitemap_splits_into_bounded_files(sitemap_context, monkeypatch, limit_kind):
    request, files = sitemap_context
    if limit_kind == "urls":
        monkeypatch.setattr(api_utils, "SITEMAP_MAX_URLS", 2)
    else:
        monkeypatch.setattr(api_utils, "SITEMAP_MAX_BYTES", 500)
    entries = [("https://example.com/" + str(i) + "x" * 140, None) for i in range(5)]
    count, _ = api_utils._save_sitemap(iter(entries), request)
    index = ElementTree.fromstring(files["sitemap.xml"])
    assert index.tag.endswith("sitemapindex")
    links = [node.text for node in index.findall("s:sitemap/s:loc", NS)]
    found = []
    for link in links:
        content = files[link.rsplit("/", 1)[-1]]
        root = ElementTree.fromstring(content)
        urls = root.findall("s:url/s:loc", NS)
        assert len(urls) <= api_utils.SITEMAP_MAX_URLS
        assert len(content) <= api_utils.SITEMAP_MAX_BYTES
        found.extend(node.text for node in urls)
    assert count == 5
    assert found == [entry[0] for entry in entries]


def test_sitemap_covers_all_pages_and_uses_record_dates(sitemap_context, monkeypatch):
    request, files = sitemap_context
    calls, submissions = {}, []
    monkeypatch.setattr(api_utils, "verify_authorization", lambda *_: None)
    monkeypatch.setattr(api_utils, "is_prod", lambda: False)
    monkeypatch.setattr(api_utils, "submit_sitemap_to_search_engines", submissions.append)
    monkeypatch.setattr(api_utils, "get_certifications", lambda: [SimpleNamespace(slug="credential")])
    monkeypatch.setattr(api_utils, "get_categories", lambda: [
        SimpleNamespace(slug="writing", published_exams_count=2),
        SimpleNamespace(slug="empty", published_exams_count=0),
    ])
    pages = {
        "get_tags": {
            None: [SimpleNamespace(slug="first", exams_count=1, offset="tags-2")],
            "tags-2": [SimpleNamespace(slug="second", exams_count=1, offset=None)],
        },
        "get_latest_exams": {
            None: [SimpleNamespace(id="p1", slug="one", user_slug="creator", updated_at=None,
                                   published_at=1_704_153_600_000, created_at=1, offset="exams-2")],
            "exams-2": [SimpleNamespace(id="p2", slug="two", user_slug="creator", updated_at=1_704_240_000_000,
                                          published_at=1_704_153_600_000, created_at=1, offset=None)],
        },
        "get_latest_users": {
            None: [SimpleNamespace(id="u1", username="creator", updated_at=None,
                                   created_at=1_704_067_200_000, offset="users-2")],
            "users-2": [SimpleNamespace(id="u2", username=None, updated_at=None, created_at=None, offset=None)],
        },
    }
    for name, data in pages.items():
        calls[name] = []

        def query(dto, data=data, name=name):
            calls[name].append(dto.offset)
            assert dto.limit == 1000
            return data[dto.offset]

        monkeypatch.setattr(api_utils, name, query)

    count, sitemap_url = api_utils.generate_sitemap(None, request)
    root = ElementTree.fromstring(files["sitemap.xml"])
    urls = {node.find("s:loc", NS).text: node.findtext("s:lastmod", namespaces=NS)
            for node in root.findall("s:url", NS)}
    assert count == len(urls)
    for name, data in pages.items():
        assert calls[name] == list(data)
    assert "https://example.com/certifications/credential" in urls
    assert "https://example.com/privacy-policy" in urls
    assert "https://example.com/second/exams" in urls
    assert "https://example.com/popular/second/exams" in urls
    assert "https://example.com/exams?category=writing" in urls
    assert not any("category=empty" in url for url in urls)
    assert urls["https://example.com/@creator/one"] == "2024-01-02"
    assert urls["https://example.com/@creator/two"] == "2024-01-03"
    assert urls["https://example.com/@creator"] == "2024-01-01"
    assert urls["https://example.com/users/u2"] is None
    assert urls["https://example.com/privacy-policy"] is None
    assert submissions == [sitemap_url]
