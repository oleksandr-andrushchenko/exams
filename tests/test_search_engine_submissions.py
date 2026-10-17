import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "shared"))
sys.path.insert(0, str(project_root / "api-lambda"))

import shared_utils as app_config
import api_utils
import search_engine_submissions


@pytest.mark.parametrize("user_slug, expected_path", [
    ("exam-author", "/exams/exam-id"),
    (None, "/exams/exam-id"),
])
def test_published_exam_notification_builds_public_url(monkeypatch, user_slug, expected_path):
    notifications = []
    monkeypatch.setattr(api_utils, "is_prod", lambda: True)
    monkeypatch.setattr(api_utils, "get_web_base_url", lambda: "https://example.com/")
    monkeypatch.setattr(api_utils, "notify_search_engines", notifications.append)
    exam = SimpleNamespace(id="exam-id", slug="practice-exam", user_slug=user_slug)

    api_utils._notify_exam_search_engines(exam)

    assert notifications == [f"https://example.com{expected_path}"]


def test_published_exam_notification_skips_non_production(monkeypatch):
    notifications = []
    monkeypatch.setattr(api_utils, "is_prod", lambda: False)
    monkeypatch.setattr(api_utils, "notify_search_engines", notifications.append)

    api_utils._notify_exam_search_engines(SimpleNamespace())

    assert notifications == []


def test_notify_search_engines_submits_urls_to_indexnow(monkeypatch):
    requests = []

    class Client:
        def __init__(self, timeout):
            assert timeout == 5.0

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, json):
            requests.append((url, json))
            return SimpleNamespace(raise_for_status=lambda: None)

    monkeypatch.setattr(search_engine_submissions, "is_prod", lambda: True)
    monkeypatch.setattr(search_engine_submissions, "get_indexnow_key", lambda: "test-indexnow-key")
    monkeypatch.setattr(search_engine_submissions, "get_web_base_url", lambda: "https://example.com")
    monkeypatch.setattr(search_engine_submissions.httpx, "Client", Client)

    assert search_engine_submissions.notify_search_engines([
        "https://example.com/exam-one",
        "https://example.com/exam-one",
        "https://example.com/exam-two",
    ])
    assert requests == [("https://api.indexnow.org/indexnow", {
        "host": "example.com",
        "key": "test-indexnow-key",
        "keyLocation": "https://example.com/test-indexnow-key.txt",
        "urlList": [
            "https://example.com/exam-one",
            "https://example.com/exam-two",
        ],
    })]


def test_notify_search_engines_skips_non_production(monkeypatch):
    monkeypatch.setattr(search_engine_submissions, "is_prod", lambda: False)

    assert not search_engine_submissions.notify_search_engines("https://example.com/exam")


def test_notify_search_engines_rejects_foreign_urls(monkeypatch):
    monkeypatch.setattr(search_engine_submissions, "is_prod", lambda: True)
    monkeypatch.setattr(search_engine_submissions, "get_indexnow_key", lambda: "test-indexnow-key")
    monkeypatch.setattr(search_engine_submissions, "get_web_base_url", lambda: "https://example.com")

    with pytest.raises(ValueError, match="must belong to example.com"):
        search_engine_submissions.notify_search_engines("https://other.example/exam")


def test_get_indexnow_key_rejects_invalid_configuration(monkeypatch):
    monkeypatch.setattr(app_config, "config", {"indexnow_key": "too short"})

    with pytest.raises(ValueError, match="INDEXNOW_KEY"):
        app_config.get_indexnow_key()


def test_sitemap_submission_uses_configured_engine_apis(monkeypatch):
    requests = []

    class Response:
        status_code = 200

        def raise_for_status(self):
            pass

    class Client:
        def __init__(self, timeout):
            assert timeout == 10.0

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def put(self, url, **kwargs):
            requests.append(("PUT", url, kwargs))
            return Response()

        def post(self, url, **kwargs):
            requests.append(("POST", url, kwargs))
            return Response()

    monkeypatch.setattr(search_engine_submissions, "is_prod", lambda: True)
    monkeypatch.setattr(search_engine_submissions.httpx, "Client", Client)
    monkeypatch.setattr(
        search_engine_submissions,
        "get_google_search_console_credentials_secret_arn",
        lambda: "credentials-secret-arn",
    )
    monkeypatch.setattr(search_engine_submissions, "get_google_search_console_site_url", lambda: "sc-domain:example.com")
    monkeypatch.setattr(search_engine_submissions, "_get_google_access_token", lambda value: "google-token")
    monkeypatch.setattr(search_engine_submissions, "get_bing_webmaster_api_key", lambda: "bing-key")
    monkeypatch.setattr(search_engine_submissions, "get_web_base_url", lambda: "https://example.com")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_oauth_token", lambda: "yandex-token")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_user_id", lambda: "42")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_host_id", lambda: "https:example.com:443")

    result = search_engine_submissions.submit_sitemap_to_search_engines(
        "https://static.example.com/sitemap.xml"
    )

    assert result == {"Google": True, "Bing": True, "Yandex": True}
    assert requests == [
        (
            "PUT",
            "https://www.googleapis.com/webmasters/v3/sites/"
            "sc-domain%3Aexample.com/sitemaps/https%3A%2F%2Fstatic.example.com%2Fsitemap.xml",
            {"headers": {"Authorization": "Bearer google-token"}},
        ),
        (
            "POST",
            "https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed",
            {
                "params": {"apikey": "bing-key"},
                "json": {
                    "siteUrl": "https://example.com",
                    "feedUrl": "https://static.example.com/sitemap.xml",
                },
            },
        ),
        (
            "POST",
            "https://api.webmaster.yandex.net/v4/user/42/hosts/"
            "https%3Aexample.com%3A443/user-added-sitemaps",
            {
                "headers": {"Authorization": "OAuth yandex-token"},
                "json": {"url": "https://static.example.com/sitemap.xml"},
            },
        ),
    ]


def test_sitemap_submission_skips_unconfigured_engines(monkeypatch):
    monkeypatch.setattr(search_engine_submissions, "is_prod", lambda: True)
    monkeypatch.setattr(search_engine_submissions, "get_google_search_console_credentials_secret_arn", lambda: "")
    monkeypatch.setattr(search_engine_submissions, "get_bing_webmaster_api_key", lambda: "")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_oauth_token", lambda: "")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_user_id", lambda: "")
    monkeypatch.setattr(search_engine_submissions, "get_yandex_webmaster_host_id", lambda: "")

    assert search_engine_submissions.submit_sitemap_to_search_engines(
        "https://static.example.com/sitemap.xml"
    ) == {}
