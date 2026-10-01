#!/usr/bin/env python3

import json
import os
import time
import uuid
from email import policy
from email.parser import BytesParser
from pathlib import Path
from urllib.parse import quote

import pytest
from pyquery import PyQuery as pq

from test_utils import (
    WEB_TEST_BASE_URL,
    recreate_dynamodb_table,
    get_guest_client,
    get_logged_in_client,
    get,
    post,
    patch,
    delete,
    regular_user,
    regular_2_user,
    root_user,
    set_dynamodb_user_permissions,
    get_dynamodb_user,
    get_dynamodb_user_by_email,
    get_dynamodb_exam,
    dynamodb_table,
)

pytestmark = pytest.mark.functional


def get_client(request, user):
    client_name = f"{user}_user_client"
    client = request.getfixturevalue(client_name)
    return client


def get_user(client, user_alias) -> pq:
    user = get_dynamodb_user(user_ids[user_alias])
    resp = get(client, f"/users/{user['id']}")
    assert resp.status_code == 200
    doc = pq(resp.text)
    assert user["name"] in doc("head title").text()
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "Person"
    assert schema["url"].startswith("http")
    assert schema["breadcrumb"]["itemListElement"][-1]["name"] == user["name"]
    assert all(value is not None for value in schema.values())
    assert doc('meta[property="og:type"]').attr("content") == "profile"
    assert doc('meta[name="description"]').attr("content").startswith(user["name"])
    main_el = doc("main")
    assert user["name"] in main_el("h1").text()
    return doc


def get_logged_in_user_id(user_data: dict) -> str:
    return get_dynamodb_user_by_email(user_data["email"])["id"]


def get_index(client):
    resp = get(client, "/")
    assert resp.status_code == 200
    doc = pq(resp.text)
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "WebSite"
    assert schema["url"].startswith("http")
    assert doc('meta[name="robots"]').attr("content") == "index, follow"
    assert doc('link[rel="canonical"]').attr("href").startswith("http")
    return doc


def get_users(client):
    resp = get(client, "/users")
    assert resp.status_code == 200
    doc = pq(resp.text)
    assert "users" in doc("head title").text().lower()
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "CollectionPage"
    assert schema["mainEntity"]["@type"] == "ItemList"
    assert schema["breadcrumb"]["itemListElement"][-1]["name"] == "Users"
    assert doc('link[rel="canonical"]').attr("href").endswith("/users")
    main_el = doc("main")
    assert "users" in main_el("h1").text().lower()
    return doc


def get_user_by_id(client, user):
    resp = get(client, f"/users/{user['id']}")
    assert resp.status_code == 200
    return pq(resp.text)


def get_user_by_slug(client, user):
    resp = get(client, f"/@{user['username']}")
    assert resp.status_code == 200
    return pq(resp.text)


def get_exams(client):
    resp = get(client, "/exams")
    assert resp.status_code == 200
    doc = pq(resp.text)
    assert "exams" in doc("head title").text().lower()
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "CollectionPage"
    assert schema["mainEntity"]["@type"] == "ItemList"
    assert schema["breadcrumb"]["itemListElement"][-1]["name"] == "Exams"
    assert doc('link[rel="canonical"]').attr("href").endswith("/exams")
    main_el = doc("main")
    assert "exams" in main_el("h1").text().lower()
    return doc


def get_exam_by_id(client, exam):
    resp = get(client, f"/exams/{exam['id']}")
    assert resp.status_code == 200
    return pq(resp.text)


def get_exam_by_slug(client, exam):
    resp = get(client, f"/@{exam['user_slug']}/{exam['slug']}")
    assert resp.status_code == 200
    return pq(resp.text)


def get_contacts(client):
    resp = get(client, "/contacts")
    assert resp.status_code == 200
    doc = pq(resp.text)
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "ContactPage"
    assert schema["breadcrumb"]["itemListElement"][-1]["name"] == "Contacts"
    assert doc('meta[name="description"]').attr("content").startswith("Contact ExamMe")
    return doc


def get_user_href(user: dict) -> str:
    if username := user.get("username"):
        return f"/@{username}"
    return f"/users/{user['id']}"


def get_exam_href(exam: dict, user: dict | None = None) -> str:
    if username := user.get("username"):
        return f"/@{username}"
    return f"/users/{user['id']}"


def check_header(doc, user_alias: str | None):
    header_el = doc("header")
    assert header_el('a[href$="/"]')
    assert header_el('a[href$="/exams"]')
    assert header_el('a[href$="/contacts"]')
    if user_alias:
        assert header_el('a[href$="/exams/new"]')
        assert header_el('a[href$="/logout"][rel~="nofollow"]')
        user = get_dynamodb_user(user_ids[user_alias])
        assert header_el('a[href$="' + get_user_href(user) + '"]')
    else:
        assert header_el('a[href$="/login"][rel~="nofollow"]')
        assert not header_el('a[href*="/login"]:not([rel~="nofollow"])')
        assert not header_el('a[href*="/users"]')


def check_auth_links_are_nofollow(doc):
    auth_links = doc('a[href*="/login"], a[href*="/logout"]')
    assert auth_links
    for link in auth_links.items():
        assert "nofollow" in (link.attr("rel") or "").split()


def check_user_impressions(doc, followers_count: int, following_count: int, follow_control: bool, block_control: bool):
    main_el = doc("main")
    user_impressions_el = main_el(".user-impressions")
    assert user_impressions_el
    assert int(user_impressions_el(".followers-count").text()) == followers_count
    assert int(user_impressions_el(".following-count").text()) == following_count
    has_user_follow = user_impressions_el(".btn-user-follow")
    if follow_control:
        assert has_user_follow
    else:
        assert not has_user_follow
    has_user_block = user_impressions_el(".btn-user-block")
    if block_control:
        assert has_user_block
    else:
        assert not has_user_block


def check_user_edit(doc, user_alias: str | None):
    main_el = doc("main")
    if user_alias:
        user = get_dynamodb_user(user_ids[user_alias])
        user_edit_el = main_el('a[href$="/users/' + user['id'] + '/edit"]')
        assert user_edit_el
    else:
        # todo:
        user_edit_el = main_el('a[href="/users/*/edit"]')
        assert not user_edit_el


def check_user_status(doc, activate_control: bool, ban_control: bool):
    main_el = doc("main")
    activate_el = main_el(".btn-user-activate")
    if activate_control:
        assert activate_el
    else:
        assert not activate_el
    ban_el = main_el(".btn-user-ban")
    if ban_control:
        assert ban_el
    else:
        assert not ban_el


def check_user(doc, followers_count: int, following_count: int, follow_control: bool, block_control: bool,
               user_alias: str | None, activate_control: bool, ban_control: bool):
    check_user_impressions(doc, followers_count=followers_count, following_count=following_count,
                           follow_control=follow_control, block_control=block_control)
    check_user_edit(doc, user_alias=user_alias)
    check_user_status(doc, activate_control=activate_control, ban_control=ban_control)


def check_exams(doc, exams_count: int, unpublished_control: bool, rejected_control: bool, tags_control: bool,
                   popular_control: bool, exam_aliases: list[str], css_id="exams"):
    main_el = doc("main")
    exams_el = main_el("#" + css_id)
    if exams_count:
        assert len(exams_el(".exam")) == exams_count
        for exam_alias in exam_aliases:
            exam = get_dynamodb_exam(exam_ids[exam_alias])
            user = get_dynamodb_user(exam["user_id"])
            exam_el = main_el('a[href$="' + get_exam_href(exam, user) + '"]')
            assert exam_el
            assert exam["title"] in exam_el.text()
    else:
        assert not exams_el
    form_el = main_el("form")
    status_controls_el = form_el if form_el else main_el
    unpublished_el = status_controls_el('a[href*="status=unpublished"]')
    if unpublished_control:
        assert unpublished_el
    else:
        assert not unpublished_el
    rejected_el = status_controls_el('a[href*="status=rejected"]')
    if rejected_control:
        assert rejected_el
    else:
        assert not rejected_el
    tags_el = form_el('#tags-input')
    if tags_control:
        assert tags_el
    else:
        assert not tags_el
    popular_el = form_el('a[href*="popular"].bi-star')
    if popular_control:
        assert popular_el
    else:
        assert not popular_el


def check_users(doc, users_count: int, banned_control: bool, popular_control: bool, user_aliases: list[str],
                css_id="users"):
    main_el = doc("main")
    users_el = main_el("#" + css_id)
    if users_count:
        assert len(users_el(".user")) == users_count
        for user_alias in user_aliases:
            user = get_dynamodb_user(user_ids[user_alias])
            user_el = main_el('a[href$="' + get_user_href(user) + '"]')
            assert user_el
            assert user["name"] in user_el.text()
    else:
        assert not users_el
    form_el = main_el("form")
    banned_el = form_el('a[href*="status=banned"]')
    if banned_control:
        assert banned_el
    else:
        assert not banned_el
    popular_el = form_el('a[href*="popular"].bi-heart')
    if popular_control:
        assert popular_el
    else:
        assert not popular_el


def check_latest_exam_comments(doc, comments_count: int, comment_texts: list[str]):
    main_el = doc("main")
    comments_el = main_el("#latest-exam-comments")
    if comments_count:
        assert len(comments_el(".exam-comment")) == comments_count
        rendered_text = comments_el.text()
        for comment_text in comment_texts:
            assert comment_text in rendered_text
    else:
        assert not comments_el


def check_index(doc):
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=False,
                   popular_control=False, exam_aliases=list(exam_ids.keys()), css_id="exams")
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=False,
                   popular_control=False, exam_aliases=list(exam_ids.keys()), css_id="popular-exams")
    check_latest_exam_comments(doc, comments_count=0, comment_texts=[])
    check_users(doc, users_count=0, banned_control=False, popular_control=False, user_aliases=[], css_id="users")
    check_users(doc, users_count=3, banned_control=False, popular_control=False, user_aliases=list(user_ids.keys()),
                css_id="popular-users")


@pytest.fixture(scope="session", autouse=True)
def setup_dynamodb():
    recreate_dynamodb_table()


@pytest.fixture(scope="session")
def guest_client():
    return get_guest_client()


@pytest.fixture(scope="session")
def regular_user_client():
    return get_logged_in_client(regular_user)


@pytest.fixture(scope="session")
def regular_2_user_client():
    return get_logged_in_client(regular_2_user)


@pytest.fixture(scope="session")
def root_user_client():
    return get_logged_in_client(root_user)


user_ids = {}
exam_ids = {}


def test_root_user_first_login(root_user_client):
    user_ids["root"] = get_logged_in_user_id(root_user)
    set_dynamodb_user_permissions(user_ids["root"], ["root"])


@pytest.mark.parametrize("user_alias", ["regular", "regular_2"])
def test_regular_user_first_login(request, user_alias):
    get_client(request, user_alias)
    user_data = regular_user if user_alias == "regular" else regular_2_user
    user_ids[user_alias] = get_logged_in_user_id(user_data)


def test_guest_user_get_index(guest_client):
    doc = get_index(guest_client)
    check_header(doc, user_alias=None)
    check_index(doc)


@pytest.mark.parametrize("user_alias", ["regular", "root"])
def test_non_guest_user_get_index(request, user_alias):
    client = get_client(request, user_alias)
    doc = get_index(client)
    check_header(doc, user_alias=user_alias)
    check_index(doc)


@pytest.mark.parametrize("user_alias", ["regular", "root"])
def test_guest_user_get_user(guest_client, user_alias):
    doc = get_user(guest_client, user_alias)
    check_header(doc, user_alias=None)
    check_user(doc, followers_count=0, following_count=0, follow_control=False, block_control=False, user_alias=None,
               activate_control=False, ban_control=False)
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=False,
                   popular_control=False, exam_aliases=list(exam_ids.keys()), css_id="exams")


@pytest.mark.parametrize("user_alias", ["regular_2", "root"])
def test_regular_user_get_other_user(regular_user_client, user_alias):
    doc = get_user(regular_user_client, user_alias)
    check_header(doc, user_alias="regular")
    check_user(doc, followers_count=0, following_count=0, follow_control=True, block_control=True, user_alias=None,
               activate_control=False, ban_control=False)
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=False,
                   popular_control=False, exam_aliases=list(exam_ids.keys()), css_id="exams")


def test_regular_user_get_self_user(regular_user_client):
    user_alias = "regular"
    doc = get_user(regular_user_client, user_alias)
    check_header(doc, user_alias=user_alias)
    check_user(doc, followers_count=0, following_count=0, follow_control=False, block_control=False,
               user_alias=user_alias, activate_control=False, ban_control=False)
    check_exams(doc, exams_count=0, unpublished_control=True, rejected_control=True, popular_control=False,
                   tags_control=False, exam_aliases=list(exam_ids.keys()), css_id="exams")


def test_root_user_get_user(root_user_client):
    user_alias = "regular"
    doc = get_user(root_user_client, user_alias)
    check_header(doc, user_alias="root")
    check_user(doc, followers_count=0, following_count=0, follow_control=True, block_control=True,
               user_alias=user_alias, activate_control=False, ban_control=True)
    check_exams(doc, exams_count=0, unpublished_control=True, rejected_control=True, popular_control=False,
                   tags_control=False, exam_aliases=list(exam_ids.keys()), css_id="exams")


def test_guest_user_get_users(guest_client):
    doc = get_users(guest_client)
    check_users(doc, users_count=3, banned_control=False, popular_control=True, user_aliases=list(user_ids.keys()),
                css_id="users")


def test_regular_user_get_users(regular_user_client):
    doc = get_users(regular_user_client)
    check_users(doc, users_count=3, banned_control=False, popular_control=True, user_aliases=list(user_ids.keys()),
                css_id="users")


def test_root_user_get_users(root_user_client):
    doc = get_users(root_user_client)
    check_users(doc, users_count=3, banned_control=True, popular_control=True, user_aliases=list(user_ids.keys()),
                css_id="users")


def test_guest_user_get_exams(guest_client):
    doc = get_exams(guest_client)
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=True,
                   popular_control=True, exam_aliases=list(exam_ids.keys()), css_id="exams")


def test_regular_user_get_exams(regular_user_client):
    doc = get_exams(regular_user_client)
    check_exams(doc, exams_count=0, unpublished_control=False, rejected_control=False, tags_control=True,
                   popular_control=True, exam_aliases=list(exam_ids.keys()), css_id="exams")


def test_root_user_get_exams(root_user_client):
    doc = get_exams(root_user_client)
    check_exams(doc, exams_count=0, unpublished_control=True, rejected_control=True, tags_control=True,
                   popular_control=True, exam_aliases=list(exam_ids.keys()), css_id="exams")


@pytest.mark.parametrize("user_alias", ["regular", "root"])
def test_get_contacts(request, user_alias):
    client = get_client(request, user_alias)
    doc = get_contacts(client)
    check_header(doc, user_alias=user_alias)


@pytest.mark.parametrize("path", ["/any", "/any/any", "/missing", "/foo/bar"])
def test_not_found(guest_client, path):
    resp = get(guest_client, path)
    assert resp.status_code == 404


@pytest.mark.parametrize("user_alias", ["regular", "root"])
def test_logout(request, user_alias):
    client = get_client(request, user_alias)
    resp = get(client, "/logout", allow_redirects=False)
    assert resp.status_code in (302, 307)
    assert resp.headers["location"].endswith("/logout-callback")
    assert resp.headers["X-Robots-Tag"] == "noindex, nofollow"


def test_regular_user_can_create_exam_comment():
    comment_user_client = get_logged_in_client({
        "sub": "commenter-sub",
        "iss": "commenter-iss",
        "email": "commenter@example.com",
    })
    exam_id = str(uuid.uuid4())
    owner_id = user_ids["root"]
    now = int(time.time() * 1000)

    dynamodb_table.put_item(Item={
        "pk": f"EXAM#{exam_id}",
        "sk": "META",
        "id": exam_id,
        "title": "Regular comment permission test exam",
        "exam_slug": "regular-comment-permission-test-exam",
        "user_id": owner_id,
        "content": "Long form exam content for integration testing. " * 120,
        "tags": ["testing"],
        "rating_sk": now,
        "status": "published",
        "created_at": now,
        "published_at": now,
        "exam_status_pk": "EXAM#published",
        "exam_user_status_pk": f"EXAM#{owner_id}#published",
        "comments_count": 0,
    })

    resp = post(comment_user_client, f"/exams/{exam_id}/comment", json={
        "text": "Regular users should be allowed to comment."
    })

    assert resp.status_code == 200
    assert resp.json().endswith(f"/exams/{exam_id}")


def test_index_shows_latest_exam_comments(guest_client):
    exam_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now = int(time.time() * 1000)
    exam_title = "Latest comments test exam"
    exam_ids["latest_comments"] = exam_id

    dynamodb_table.put_item(Item={
        "pk": f"EXAM#{exam_id}",
        "sk": "META",
        "id": exam_id,
        "title": exam_title,
        "exam_slug": "latest-comments-test-exam",
        "user_id": user_id,
        "content": "Long form exam content for integration testing. " * 120,
        "tags": ["testing"],
        "rating_sk": now,
        "status": "published",
        "created_at": now,
        "published_at": now,
        "exam_status_pk": "EXAM#published",
        "exam_user_status_pk": f"EXAM#{user_id}#published",
        "comments_count": 6,
    })

    comment_texts = []
    for i in range(6):
        comment_id = f"{now + i}#{uuid.uuid4()}"
        comment_text = f"Latest comment integration text {i}"
        dynamodb_table.put_item(Item={
            "pk": f"EXAM#{exam_id}",
            "sk": f"COMMENT#{comment_id}",
            "id": comment_id,
            "exam_id": exam_id,
            "exam_comment_pk": "EXAM_COMMENT",
            "exam_title": exam_title,
            "comment_exam_slug": "latest-comments-test-exam",
            "user_id": user_id,
            "user_name": "Comment Author",
            "text": comment_text,
            "created_at": now + i,
        })
        comment_texts.append(comment_text)

    doc = get_index(guest_client)
    check_latest_exam_comments(doc, comments_count=3, comment_texts=list(reversed(comment_texts[-3:])))

    comments = [pq(el).text() for el in doc("#latest-exam-comments .exam-comment").items()]
    assert comment_texts[5] in comments[0]
    assert comment_texts[3] in comments[-1]
    assert comment_texts[0] not in doc("#latest-exam-comments").text()
    assert exam_title in doc("#latest-exam-comments").text()


@pytest.mark.parametrize(("legacy_path", "exam_path"), [
    ("/posts", "/exams"),
    ("/post", "/exams"),
    ("/posts/new", "/exams/new"),
    ("/post/new", "/exams/new"),
    ("/posts/example-id", "/exams/example-id"),
    ("/post/example-id", "/exams/example-id"),
    ("/posts/example-id/edit", "/exams/example-id/edit"),
    ("/post/example-id/edit", "/exams/example-id/edit"),
    ("/latest/python/posts", "/latest/python/exams"),
])
def test_legacy_exam_page_urls_redirect_to_exams(guest_client, legacy_path, exam_path):
    response = get(guest_client, f"{legacy_path}?limit=5", allow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == f"{exam_path}?limit=5"


@pytest.mark.parametrize(("method", "legacy_path", "exam_path"), [
    ("get", "/posts-fragment", "/exams-fragment"),
    ("get", "/users/example-id/posts-fragment", "/users/example-id/exams-fragment"),
    ("post", "/posts", "/exams"),
    ("patch", "/posts/example-id", "/exams/example-id"),
    ("post", "/posts/example-id/status", "/exams/example-id/status"),
    ("post", "/posts/example-id/impression", "/exams/example-id/impression"),
    ("post", "/posts/example-id/comment", "/exams/example-id/comment"),
    ("patch", "/posts/example-id/comments/example-comment-id",
     "/exams/example-id/comments/example-comment-id"),
    ("get", "/post-tags/example-tag/edit", "/tags/example-tag/edit"),
    ("get", "/post-tags", "/tags"),
    ("patch", "/post-tags/example-tag", "/tags/example-tag"),
])
def test_legacy_exam_endpoint_urls_preserve_method_and_redirect(
        guest_client, method, legacy_path, exam_path):
    request = {"get": get, "post": post, "patch": patch}[method]
    kwargs = {"allow_redirects": False}
    if method != "get":
        kwargs["json"] = {}
    response = request(guest_client, f"{legacy_path}?limit=5", **kwargs)
    assert response.status_code == 308
    assert response.headers["location"] == f"{exam_path}?limit=5"


@pytest.mark.parametrize("path", [
    "/",
    "/exams",
    "/contacts",
    "/users",
    "/latest/users",
    "/exams-fragment",
    "/users-fragment",
    "/tags",
    "/tags",
    "/privacy-policy",
    "/rules",
    "/terms-of-service",
    "/earn-with-us",
])
def test_public_read_endpoints_success_and_wrong_method_failure(guest_client, path):
    success = get(guest_client, path)
    assert success.status_code == 200, (path, success.status_code, success.text)

    failure = post(guest_client, path, json={})
    expected_status = 422 if path == "/exams" else 405
    assert failure.status_code == expected_status, (path, failure.status_code, failure.text)


@pytest.mark.parametrize("path, schema_type", [
    ("/", "WebSite"),
    ("/exams", "CollectionPage"),
    ("/users", "CollectionPage"),
    ("/latest/users", "CollectionPage"),
    ("/contacts", "ContactPage"),
    ("/privacy-policy", "WebPage"),
    ("/rules", "WebPage"),
    ("/terms-of-service", "WebPage"),
    ("/earn-with-us", "WebPage"),
])
def test_public_page_seo_schema_and_metadata(guest_client, path, schema_type):
    response = get(guest_client, path)
    assert response.status_code == 200, (path, response.status_code, response.text)
    doc = pq(response.text)
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == schema_type
    assert schema.get("url", "").startswith("http")
    assert doc('link[rel="canonical"]').attr("href").startswith("http")
    assert doc('meta[name="description"]').attr("content")
    assert doc('meta[name="robots"]').attr("content") in {"index, follow", "noindex, follow", "noindex, nofollow"}
    assert all(value is not None for value in schema.values())
    check_auth_links_are_nofollow(doc)
    if schema_type in {"CollectionPage", "ContactPage", "WebPage"}:
        assert schema.get("breadcrumb", {}).get("itemListElement")


@pytest.mark.parametrize(("path", "heading", "selector"), [
    ("/", "ExamMe", "h1"),
    ("/exams", "Exams", "h1"),
    ("/users", "Users", "h1"),
    ("/latest/users", "Users", "h1"),
    ("/contacts", "Contacts", "#contact-form"),
    ("/privacy-policy", "Privacy", "h1"),
    ("/rules", "Rules", "h1"),
    ("/terms-of-service", "Terms", "h1"),
    ("/earn-with-us", "Earn", "h1"),
])
def test_public_pages_render_main_content(guest_client, path, heading, selector):
    response = get(guest_client, path)
    assert response.status_code == 200, (path, response.status_code, response.text)

    doc = pq(response.text)
    main = doc("main")
    assert main
    assert heading.lower() in main("h1").text().lower()
    assert main(selector)


@pytest.mark.parametrize("path", [
    "/exams?limit=invalid",
    "/exams-fragment?limit=0",
    "/users?type=invalid",
    "/invalid/users",
    "/users-fragment?status=invalid",
    "/tags?prefix=",
])
def test_public_query_endpoints_reject_invalid_parameters(guest_client, path):
    response = get(guest_client, path)
    assert response.status_code == 422, (path, response.status_code, response.text)


def test_tags_fragment_endpoint_success(guest_client):
    response = get(guest_client, "/tags-fragment?type=latest&limit=6")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")


@pytest.mark.parametrize(("tag_type", "expected_title", "canonical_suffix"), [
    ("latest", "Latest Tags", "/tags"),
    ("popular", "Popular Tags", "/tags?type=popular"),
])
def test_tags_page_type_is_in_metadata_and_heading(guest_client, tag_type, expected_title, canonical_suffix):
    response = guest_client.get(f"{WEB_TEST_BASE_URL}/tags?type={tag_type}", timeout=30)

    assert response.status_code == 200
    doc = pq(response.text)
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert expected_title in doc("head title").text()
    assert doc("main h1").text() == expected_title
    assert expected_title in doc('meta[name="description"]').attr("content")
    assert schema["name"] == expected_title
    assert schema["url"].endswith(canonical_suffix)
    assert doc('link[rel="canonical"]').attr("href").endswith(canonical_suffix)


@pytest.mark.parametrize("tag_type", ["latest", "popular"])
def test_tags_endpoint_supports_tag_types(guest_client, tag_type):
    response = get(guest_client, f"/tags?type={tag_type}&limit=6")

    assert response.status_code == 200
    assert response.headers["X-Robots-Tag"] == "noindex, nofollow"
    assert isinstance(response.json(), list)


def test_login_endpoint_success_and_wrong_method_failure(guest_client):
    success = get(guest_client, "/login", allow_redirects=False)
    assert success.status_code in (302, 307)
    assert "location" in success.headers
    assert success.headers["X-Robots-Tag"] == "noindex, nofollow"

    failure = post(guest_client, "/login", json={})
    assert failure.status_code == 405
    assert failure.headers["X-Robots-Tag"] == "noindex, nofollow"


def test_login_callback_success_and_invalid_code_failure():
    success_client = get_logged_in_client({
        "sub": "callback-success-sub",
        "iss": "callback-success-iss",
        "email": "callback-success@example.com",
    })
    assert success_client.cookies.get("token")

    failure = get(get_guest_client(), "/login-callback?code=invalid", allow_redirects=False)
    assert failure.status_code == 400
    assert failure.headers["X-Robots-Tag"] == "noindex, nofollow"


def test_logout_callback_success_and_wrong_method_failure(guest_client):
    success = get(guest_client, "/logout-callback", allow_redirects=False)
    assert success.status_code in (302, 307)
    assert success.headers["X-Robots-Tag"] == "noindex, nofollow"

    failure = post(guest_client, "/logout-callback", json={})
    assert failure.status_code == 405
    assert failure.headers["X-Robots-Tag"] == "noindex, nofollow"


functional_state = {}


def test_user_edit_update_and_fragment_endpoints_success_and_failure(root_user_client, guest_client):
    root_user_client = get_logged_in_client(root_user)
    root_id = get_dynamodb_user_by_email(root_user["email"])["id"]
    functional_state["root_id"] = root_id

    edit_success = get(root_user_client, f"/users/{root_id}/edit")
    assert edit_success.status_code == 200
    edit_failure = get(guest_client, f"/users/{root_id}/edit")
    assert edit_failure.status_code == 401

    update_success = patch(root_user_client, f"/users/{root_id}", json={
        "name": "Root Functional User",
        "username": "root-functional",
    })
    assert update_success.status_code == 200, update_success.text
    update_failure = patch(root_user_client, f"/users/{root_id}", json={"name": ""})
    assert update_failure.status_code == 422

    fragment_success = get(guest_client, f"/users/{root_id}/exams-fragment")
    assert fragment_success.status_code == 200
    user_read_failure = get(guest_client, "/users/missing-user")
    assert user_read_failure.status_code == 404

    fragment_failure = get(guest_client, "/users/missing-user/exams-fragment")
    assert fragment_failure.status_code == 404

    slug_success = get(guest_client, "/@root-functional")
    assert slug_success.status_code == 200
    slug_failure = get(guest_client, "/@missing-functional-user")
    assert slug_failure.status_code == 404


def test_user_impression_endpoint_success_and_validation_failure(regular_user_client):
    regular_user_client = get_logged_in_client(regular_user)
    target_id = get_dynamodb_user_by_email(regular_2_user["email"])["id"]
    success = post(regular_user_client, f"/users/{target_id}/impression", json={"action": "follow"})
    assert success.status_code == 200, success.text
    failure = post(regular_user_client, f"/users/{target_id}/impression", json={"action": "invalid"})
    assert failure.status_code == 422


def test_user_status_endpoint_success_and_validation_failure(root_user_client):
    root_user_client = get_logged_in_client(root_user)
    target = get_dynamodb_user_by_email("callback-success@example.com")
    success = post(root_user_client, f"/users/{target["id"]}/status", json={
        "status": "banned",
        "comment": "Functional test ban",
    })
    assert success.status_code == 200, success.text
    failure = post(root_user_client, f"/users/{target["id"]}/status", json={"status": "invalid"})
    assert failure.status_code == 422


EXAM_IMAGE_FILENAME = "9ba8f5cf-b0a4-430c-99ec-4a78f3c4245f_1080x784.png"
EXAM_IMAGE_ALT = "Functional exam image"
EXAM_CONTENT = "Functional endpoint coverage description for integration testing."


def test_exam_create_and_new_page_endpoints_success_and_failure(guest_client):
    root_client = get_logged_in_client(root_user)

    new_success = get(root_client, "/exams/new")
    assert new_success.status_code == 200
    new_failure = get(guest_client, "/exams/new")
    assert new_failure.status_code == 401
    check_auth_links_are_nofollow(pq(new_failure.text))

    create_success = post(root_client, "/exams", json={
        "title": "Functional endpoint coverage exam",
        "description": EXAM_CONTENT,
        "image_filename": EXAM_IMAGE_FILENAME,
        "tags": ["functional-tag", "coverage-tag"],
    })
    assert create_success.status_code == 200, create_success.text
    exam_item = next(
        item for item in dynamodb_table.scan()["Items"]
        if item.get("title") == "Functional endpoint coverage exam"
    )
    functional_state["exam_id"] = exam_item["id"]
    functional_state["exam_slug"] = exam_item["exam_slug"]
    assert exam_item["description"] == EXAM_CONTENT
    assert exam_item["image_filename"] == EXAM_IMAGE_FILENAME

    invalid_description = post(root_client, "/exams", json={
        "title": "Exam with invalid links",
        "description": "<p>HTML is not allowed in exam descriptions.</p>",
        "tags": ["functional-tag"],
    })
    assert invalid_description.status_code == 422
    assert "description" in invalid_description.json()["details"]

    create_failure = post(root_client, "/exams", json={
        "title": "a",
        "description": EXAM_CONTENT,
        "tags": ["functional-tag"],
    })
    assert create_failure.status_code == 422


def test_earn_page_seo(guest_client):
    response = get(guest_client, "/earn-with-us")
    assert response.status_code == 200
    doc = pq(response.text)
    schema = json.loads(doc('script[type="application/ld+json"]').text())
    assert schema["@type"] == "WebPage"
    assert schema["breadcrumb"]["itemListElement"][-1]["name"] == "Earn with us"
    assert doc('meta[name="description"]').attr("content").startswith("Learn how to publish")
    assert doc('link[rel="canonical"]').attr("href").endswith("/earn-with-us")


def test_exam_read_edit_update_status_endpoints_success_and_failure(guest_client):
    root_client = get_logged_in_client(root_user)
    regular_client = get_logged_in_client(regular_user)
    exam_id = functional_state["exam_id"]

    read_success = get(root_client, f"/exams/{exam_id}")
    assert read_success.status_code == 200, read_success.text
    read_doc = pq(read_success.text)
    exam_schema = json.loads(read_doc('script[type="application/ld+json"]').text())
    assert exam_schema["@type"] == "Exam"
    assert exam_schema["inLanguage"] == "en"
    assert exam_schema["author"]["url"].endswith("/@root-functional")
    assert read_doc('meta[property="og:type"]').attr("content") == "exam"
    assert read_doc('meta[property="og:url"]').attr("content").endswith(
        f"/@root-functional/{functional_state['exam_slug']}")
    assert not read_doc('meta[name="keywords"]')
    assert "aggregateRating" not in exam_schema
    assert exam_schema["commentCount"] == 0
    assert exam_schema["image"][0].endswith(f"/{EXAM_IMAGE_FILENAME}")
    assert exam_schema["thumbnailUrl"].endswith(f"/{EXAM_IMAGE_FILENAME}")
    assert read_doc('meta[name="robots"]').attr("content") == "index, follow"
    rendered_img = read_doc("article img")
    assert len(rendered_img) == 1
    assert rendered_img.attr("alt") == "Functional endpoint coverage exam"
    assert rendered_img.attr("src").endswith(f"/{EXAM_IMAGE_FILENAME}")

    dynamodb_table.update_item(
        Key={"pk": f"EXAM#{exam_id}", "sk": "META"},
        UpdateExpression="SET image_filename = :filename",
        ExpressionAttributeValues={":filename": "examme_1161x515.png"},
    )
    image_doc = pq(get(root_client, f"/exams/{exam_id}").text)
    image_schema = json.loads(image_doc('script[type="application/ld+json"]').text())
    assert image_schema["image"][0].endswith("/examme_1161x515.png")
    assert image_schema["thumbnailUrl"].endswith("/examme_1161x515.png")
    assert image_doc('meta[property="og:image"]').attr("content").endswith("/examme_1161x515.png")
    dynamodb_table.update_item(
        Key={"pk": f"EXAM#{exam_id}", "sk": "META"},
        UpdateExpression="REMOVE image_filename",
    )

    read_failure = get(guest_client, "/exams/missing-exam")
    assert read_failure.status_code == 404

    edit_success = get(root_client, f"/exams/{exam_id}/edit")
    assert edit_success.status_code == 200
    edit_doc = pq(edit_success.text)
    assert edit_doc("textarea[name='description']").text() == EXAM_CONTENT
    edit_failure = get(regular_client, f"/exams/{exam_id}/edit")
    assert edit_failure.status_code == 403

    invalid_description = patch(root_client, f"/exams/{exam_id}", json={
        "description": "<p>HTML is not allowed in exam descriptions.</p>",
    })
    assert invalid_description.status_code == 422
    assert "description" in invalid_description.json()["details"]

    update_success = patch(root_client, f"/exams/{exam_id}", json={
        "title": "Updated functional endpoint coverage exam",
        "description": EXAM_CONTENT,
        "tags": ["functional-tag", "coverage-tag"],
    })
    assert update_success.status_code == 200, update_success.text
    functional_state["exam_slug"] = "updated-functional-endpoint-coverage-exam"
    update_failure = patch(root_client, f"/exams/{exam_id}", json={
        "title": "a",
        "description": EXAM_CONTENT,
        "tags": ["functional-tag"],
    })
    assert update_failure.status_code == 422

    status_success = post(root_client, f"/exams/{exam_id}/status", json={"status": "published"})
    assert status_success.status_code == 200, status_success.text

    published_tag_page = get(guest_client, "/exams?type=latest&status=published&tags=functional-tag")
    assert published_tag_page.status_code == 200
    assert "Updated functional endpoint coverage exam" in pq(published_tag_page.text)("#exams").text()

    remove_tag_success = patch(root_client, f"/exams/{exam_id}", json={
        "tags": ["coverage-tag"],
    })
    assert remove_tag_success.status_code == 200, remove_tag_success.text
    removed_tag_page = get(guest_client, "/exams?type=latest&status=published&tags=functional-tag")
    assert removed_tag_page.status_code == 200
    assert "Updated functional endpoint coverage exam" not in pq(removed_tag_page.text)("#exams").text()

    republish_success = post(root_client, f"/exams/{exam_id}/status", json={"status": "published"})
    assert republish_success.status_code == 200, republish_success.text
    current_tag_page = get(guest_client, "/exams?type=latest&status=published&tags=coverage-tag")
    assert current_tag_page.status_code == 200
    assert "Updated functional endpoint coverage exam" in pq(current_tag_page.text)("#exams").text()
    stale_tag_page = get(guest_client, "/exams?type=latest&status=published&tags=functional-tag")
    assert stale_tag_page.status_code == 200
    assert "Updated functional endpoint coverage exam" not in pq(stale_tag_page.text)("#exams").text()

    restore_tags_success = patch(root_client, f"/exams/{exam_id}", json={
        "tags": ["functional-tag", "coverage-tag"],
    })
    assert restore_tags_success.status_code == 200, restore_tags_success.text
    restore_publish_success = post(root_client, f"/exams/{exam_id}/status", json={"status": "published"})
    assert restore_publish_success.status_code == 200, restore_publish_success.text

    rename_tag_success = patch(root_client, "/tags/coverage-tag", json={
        "name": "Coverage Tag Updated",
        "image_action": "keep",
        "image_file": None,
    })
    assert rename_tag_success.status_code == 200, rename_tag_success.text
    renamed_old_tag_page = get(
        guest_client,
        "/exams?type=latest&status=published&tags=coverage-tag",
        allow_redirects=False,
    )
    assert renamed_old_tag_page.status_code == 308
    assert "coverage-tag-updated" in renamed_old_tag_page.headers["location"]
    renamed_current_tag_page = get(guest_client, "/exams?type=latest&status=published&tags=coverage-tag-updated")
    assert renamed_current_tag_page.status_code == 200
    assert "Updated functional endpoint coverage exam" in pq(renamed_current_tag_page.text)("#exams").text()

    status_failure = post(root_client, f"/exams/{exam_id}/status", json={"status": "invalid"})
    assert status_failure.status_code == 422

    slug_success = get(guest_client, f"/@root-functional/{functional_state["exam_slug"]}")
    assert slug_success.status_code == 200, slug_success.text
    slug_failure = get(guest_client, "/@root-functional/missing-exam")
    assert slug_failure.status_code == 404

    exams_by_slug_success = get(guest_client, "/root-functional/exams")
    assert exams_by_slug_success.status_code == 200
    exams_by_slug_failure = get(guest_client, "/invalid/latest/exams?limit=0")
    assert exams_by_slug_failure.status_code == 422


def test_exam_impression_comment_and_comment_update_endpoints_success_and_failure(guest_client):
    root_client = get_logged_in_client(root_user)
    regular_client = root_client
    exam_id = functional_state["exam_id"]

    impression_success = post(regular_client, f"/exams/{exam_id}/impression", json={"action": "like"})
    assert impression_success.status_code == 200, impression_success.text
    rated_doc = pq(get(regular_client, f"/exams/{exam_id}").text)
    rated_schema = json.loads(rated_doc('script[type="application/ld+json"]').text())
    assert "aggregateRating" not in rated_schema
    assert not rated_doc('meta[name="ratingValue"]')
    assert not rated_doc('meta[name="ratingCount"]')
    impression_failure = post(guest_client, f"/exams/{exam_id}/impression", json={"action": "like"})
    assert impression_failure.status_code == 401

    comment_text = "Functional endpoint comment"
    comment_success = post(regular_client, f"/exams/{exam_id}/comment", json={"text": comment_text})
    assert comment_success.status_code == 200, comment_success.text
    comment_item = next(
        item for item in dynamodb_table.scan()["Items"]
        if item.get("exam_id") == exam_id and item.get("text") == comment_text
    )
    comment_id = comment_item["id"]
    encoded_comment_id = quote(comment_id, safe="")
    functional_state["comment_id"] = comment_id
    comment_failure = post(regular_client, f"/exams/{exam_id}/comment", json={"text": ""})
    assert comment_failure.status_code == 422

    update_success = patch(regular_client, f"/exams/{exam_id}/comments/{encoded_comment_id}", json={
        "text": "Updated functional endpoint comment",
    })
    assert update_success.status_code == 200, update_success.text
    update_failure = patch(regular_client, f"/exams/{exam_id}/comments/missing-comment", json={
        "text": "Still valid text",
    })
    assert update_failure.status_code == 404

    comments_doc = pq(get(regular_client, f"/exams/{exam_id}").text)
    comments_schema = json.loads(comments_doc('script[type="application/ld+json"]').text())
    assert comments_schema["commentCount"] == 1
    assert len(comments_schema["comment"]) == 1
    assert comments_schema["comment"][0]["text"] == "Updated functional endpoint comment"
    comment_id_fragment = comments_schema["comment"][0]["@id"].rsplit("#", 1)[-1]
    assert comments_doc(f"article#{comment_id_fragment}")
    assert comments_doc(f'time[datetime="{comments_schema["comment"][0]["datePublished"]}"]')

    comments_fragment = get(regular_client, f"/exams/{exam_id}/comments-fragment?limit=1")
    assert comments_fragment.status_code == 200, comments_fragment.text
    assert "Updated functional endpoint comment" in comments_fragment.text
    assert "exam-comment" in comments_fragment.text
    missing_fragment = get(guest_client, "/exams/missing-exam/comments-fragment")
    assert missing_fragment.status_code == 404


def test_public_file_upload_endpoint_success_and_failure(guest_client):
    png_content = b"\x89PNG\r\n\x1a\n" + (b"\x00" * 1100)
    success = post(guest_client, "/public-file", files={
        "file": ("functional.png", png_content, "image/png"),
    })
    assert success.status_code == 200, success.text
    uploaded_path = os.path.join("/app/static", success.json())
    os.remove(uploaded_path)

    failure = post(guest_client, "/public-file", files={
        "file": ("invalid.txt", b"not an image" * 100, "text/plain"),
    })
    assert failure.status_code == 422
    assert failure.headers["content-type"].startswith("application/json")
    assert failure.json()["details"]["file"] == "Invalid image type: None"


def test_public_file_upload_adds_jpeg_dimensions_to_filename(guest_client):
    jpeg_content = (
        b"\xff\xd8"
        b"\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xc0\x00\x11\x08\x00\x13\x00\x25\x03"
        b"\x01\x11\x00\x02\x11\x00\x03\x11\x00"
        b"\xff\xd9"
    )
    response = post(guest_client, "/public-file", files={
        "file": ("functional.jpg", jpeg_content, "image/jpeg"),
    })

    assert response.status_code == 200, response.text
    assert response.json().endswith("_37x19.jpg")
    os.remove(os.path.join("/app/static", response.json()))


def test_public_file_upload_resizes_wide_image_proportionally(guest_client):
    from io import BytesIO

    from PIL import Image

    original = BytesIO()
    Image.new("RGB", (1600, 800), "red").save(original, format="PNG")

    response = post(guest_client, "/public-file", files={
        "file": ("wide.png", original.getvalue(), "image/png"),
    })

    assert response.status_code == 200, response.text
    assert response.json().endswith("_1200x600.png")
    uploaded_path = os.path.join("/app/static", response.json())
    with Image.open(uploaded_path) as uploaded:
        assert uploaded.size == (1200, 600)
    os.remove(uploaded_path)


def test_public_file_upload_keeps_smaller_image_unchanged(guest_client):
    from io import BytesIO

    from PIL import Image

    original = BytesIO()
    Image.new("RGB", (800, 400), "blue").save(original, format="PNG")
    original_content = original.getvalue()

    response = post(guest_client, "/public-file", files={
        "file": ("small.png", original_content, "image/png"),
    })

    assert response.status_code == 200, response.text
    assert response.json().endswith("_800x400.png")
    uploaded_path = os.path.join("/app/static", response.json())
    with open(uploaded_path, "rb") as uploaded:
        assert uploaded.read() == original_content
    os.remove(uploaded_path)


def test_contact_message_endpoint_success_and_validation_failure(guest_client):
    success = post(guest_client, "/contacts/message", json={
        "name": "Functional Contact",
        "email": "functional-contact@example.com",
        "message": "Functional contact message",
    })
    assert success.status_code == 204, success.text

    failure = post(guest_client, "/contacts/message", json={
        "name": "X",
        "email": "invalid",
        "message": "bad",
    })
    assert failure.status_code == 422


def test_admin_page_sitemap_and_cache_endpoints_success_and_failure(guest_client):
    root_client = get_logged_in_client(root_user)
    regular_client = get_logged_in_client(regular_user)

    utils_success = get(root_client, "/utils")
    assert utils_success.status_code == 200
    utils_failure = get(guest_client, "/utils")
    assert utils_failure.status_code == 401

    sitemap_success = post(root_client, "/generate-sitemap", json={})
    assert sitemap_success.status_code == 200, sitemap_success.text
    assert sitemap_success.json()["urls_count"] > 0
    assert sitemap_success.json()["sitemap_url"] == f"{os.getenv('WEB_TEST_BASE_URL')}/sitemap.xml"
    sitemap = get(guest_client, "/sitemap.xml")
    assert sitemap.status_code == 200
    assert "/tags" in sitemap.text
    sitemap_failure = post(regular_client, "/generate-sitemap", json={})
    assert sitemap_failure.status_code == 403

    cache_success = post(root_client, "/drop-cdn-cache", json={})
    assert cache_success.status_code == 200, cache_success.text
    assert cache_success.json()["success"] is True
    assert cache_success.json()["items_count"] == 1
    cache_paths = post(root_client, "/drop-cdn-cache", json={"paths": ["/exams", "/tags/*"]})
    assert cache_paths.status_code == 200, cache_paths.text
    assert cache_paths.json()["items_count"] == 2
    cache_failure = post(regular_client, "/drop-cdn-cache", json={})
    assert cache_failure.status_code == 403


def test_tag_subscription_create_and_delete():
    root_user_client = get_logged_in_client(root_user)
    tags = ["lifecycle-tag", "lifecycle-combination"]
    response = post(root_user_client, "/tag-subscriptions", json={"tags": tags})
    assert response.status_code == 200, response.text

    fragment = pq(response.text)
    subscription_id = fragment(".tag-subscription-block").attr("data-tag-subscription-id")
    assert subscription_id
    assert "Subscribed" in response.text

    subscriptions = get(root_user_client, "/tag-subscriptions")
    assert subscriptions.status_code == 200
    assert any(item["id"] == subscription_id and item["tags"] == sorted(tags)
               for item in subscriptions.json())

    delete_response = delete(root_user_client, f"/tag-subscriptions/{subscription_id}")
    assert delete_response.status_code == 200, delete_response.text
    assert pq(delete_response.text)(".tag-subscription-block").attr("data-tag-subscription-id") == ""
    assert "Subscribed" not in delete_response.text

    subscriptions = get(root_user_client, "/tag-subscriptions")
    assert all(item["id"] != subscription_id for item in subscriptions.json())


def test_exam_published_dispatch_matches_combinations_excludes_author_and_renders_eml():
    root_client = get_logged_in_client(root_user)
    set_dynamodb_user_permissions(get_logged_in_user_id(root_user), ["root"])
    author_client = get_logged_in_client(regular_user)
    combination_client = get_logged_in_client(regular_2_user)
    email_dir = Path("/app/.emails")
    existing_emails = set(email_dir.glob("*.eml"))

    root_subscription = post(root_client, "/tag-subscriptions", json={
        "tags": ["notification-tag3"],
    })
    assert root_subscription.status_code == 200, root_subscription.text
    author_subscription = post(author_client, "/tag-subscriptions", json={
        "tags": ["notification-tag1"],
    })
    assert author_subscription.status_code == 200, author_subscription.text
    combination_subscription = post(combination_client, "/tag-subscriptions", json={
        "tags": ["notification-tag2", "notification-tag3"],
    })
    assert combination_subscription.status_code == 200, combination_subscription.text

    create_response = post(author_client, "/exams", json={
        "title": "Combination notification integration exam",
        "description": EXAM_CONTENT,
        "tags": ["notification-tag1", "notification-tag2", "notification-tag3"],
    })
    assert create_response.status_code == 200, create_response.text
    exam_id = create_response.json().rstrip("/").split("/")[-1]

    publish_response = post(root_client, f"/exams/{exam_id}/status", json={
        "status": "published",
    })
    assert publish_response.status_code == 200, publish_response.text

    new_emails = sorted(set(email_dir.glob("*.eml")) - existing_emails)
    assert len(new_emails) == 2
    messages = {}
    for email_file in new_emails:
        with email_file.open("rb") as stream:
            message = BytesParser(policy=policy.default).parse(stream)
        messages[message["To"]] = message

    assert set(messages) == {"root@example.com", "regular2@example.com"}
    assert "regular@example.com" not in messages

    root_html = messages["root@example.com"].get_body("html").get_content()
    assert f"Hello {get_dynamodb_user_by_email('root@example.com')['name']}" in root_html
    assert "notification-tag3" in root_html
    assert "tags=notification-tag3" in root_html
    assert "notification-tag2 + notification-tag3" not in root_html
    assert "Best regards" in root_html

    combination_html = messages["regular2@example.com"].get_body("html").get_content()
    assert "notification-tag2 + notification-tag3" in combination_html
    assert "tags=notification-tag2&amp;tags=notification-tag3" in combination_html
    assert "Read exam" in combination_html


def test_logout_endpoint_wrong_method_failure(guest_client):
    failure = post(guest_client, "/logout", json={})
    assert failure.status_code == 405


def test_legacy_slug_urls_redirect_only_for_existing_entities(guest_client):
    exam_id = functional_state["exam_id"]
    exam_slug = functional_state["exam_slug"]
    for legacy_path, canonical_path in [
        ("/root-functional", "/@root-functional"),
        (f"/root-functional/{exam_slug}", f"/@root-functional/{exam_slug}"),
        (f"/root-functional/posts/{exam_id}", f"/@root-functional/{exam_slug}"),
        (f"/root-functional/root-functional/{exam_slug}",
         f"/@root-functional/{exam_slug}"),
    ]:
        response = get(guest_client, f"{legacy_path}?limit=5&offset=2", allow_redirects=False)
        assert response.status_code == 308
        assert response.headers["Location"].endswith(f"{canonical_path}?limit=5&offset=2")

    for path in [
        "/missing-functional-user",
        "/root-functional/missing-functional-exam",
        f"/missing-functional-user/{exam_slug}",
        "/root-functional/posts/missing-functional-exam",
        f"/missing-functional-user/posts/{exam_id}",
        f"/root-functional/different-user/{exam_slug}",
    ]:
        response = get(guest_client, path, allow_redirects=False)
        assert response.status_code == 404
        assert "Location" not in response.headers


@pytest.mark.parametrize("path", [
    "/exams", "/exams-fragment", "/latest/exams",
    "/users", "/latest/users", "/users-fragment", "/tags",
    "/@root-functional",
])
def test_query_endpoints_ignore_undeclared_parameters(guest_client, path):
    response = get(guest_client, f"{path}?asdasd=13sd&limit=5")
    assert response.status_code == 200, (path, response.status_code, response.text)


@pytest.mark.parametrize("path", [
    "/exams", "/exams-fragment", "/latest/exams",
    "/users", "/latest/users", "/users-fragment", "/tags",
    "/@root-functional",
])
def test_query_endpoints_validate_declared_parameters_with_unknown_parameters(guest_client, path):
    response = get(guest_client, f"{path}?asdasd=13sd&limit=invalid")
    assert response.status_code == 422, (path, response.status_code, response.text)
