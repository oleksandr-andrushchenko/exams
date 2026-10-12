"""Cursor/index contracts, filter links, and crawlable pagination metadata."""
import os
import sys
from html.parser import HTMLParser
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock
from urllib.parse import parse_qs, urlsplit

import pytest
from jinja2 import FileSystemLoader

project_root = Path(os.environ.get('PROJECT_ROOT', Path(__file__).resolve().parents[1]))
for directory in ('shared', 'web-lambda'):
    sys.path.insert(0, str(project_root / directory))

from api_route_metadata import API_URL_ROUTES
from query_dtos import (ExamListingQueryDTO, ExamQueryDTO, TagQueryDTO, UserQueryDTO)
from shared_utils import (encode_offset, get_jinja2_env, get_exams_url, exam_from_dynamodb,
                          user_from_dynamodb)
from web import Application, Request, RequestValidationError, parse_dto
from web_route_metadata import WEB_URL_ROUTES


def cursor_for(params):
    query = ExamQueryDTO(**params)
    sort_key = 'rating_sk' if query.type == 'popular' else 'created_at'
    cursor = {'pk': 'EXAM#example', 'sk': 'META', sort_key: 123}
    if query.category:
        cursor['exam_category_status_pk'] = f'EXAM#{query.category}#{query.status}'
    elif query.tags and query.type == 'latest' and query.status == 'published':
        cursor = {'pk': 'EXAM_TAG_COMBO#' + '#'.join(query.tags), 'sk': 'EXAM#123#example'}
    else:
        cursor['exam_status_pk'] = f'EXAM#{query.status}'
    return cursor


SCOPES = [{}, {'tags': ['python', 'aws']}, {'category': 'other'},
          {'category': 'other', 'tags': ['aws']}]


@pytest.mark.parametrize('scope', SCOPES)
@pytest.mark.parametrize('order', ['latest', 'popular'])
@pytest.mark.parametrize('status', ['published', 'unpublished', 'rejected'])
def test_listing_cursor_matches_index_sort_and_status(scope, order, status):
    params = dict(scope, type=order, status=status)
    offset = encode_offset(cursor_for(params))
    assert parse_dto(ExamListingQueryDTO, dict(params, offset=offset)).offset == offset
    for change in ({'type': 'popular' if order == 'latest' else 'latest'},
                   {'status': 'unpublished' if status == 'published' else 'published'}):
        with pytest.raises(RequestValidationError, match='offset'):
            parse_dto(ExamListingQueryDTO, dict(params, offset=offset) | change)


@pytest.mark.parametrize('scope,change', [
    ({'tags': ['aws', 'python']}, {'tags': ['aws']}),
    ({'category': 'other'}, {'category': 'video'}),
    ({'category': 'other'}, {'category': None}),
])
def test_cursor_rejects_other_partition(scope, change):
    with pytest.raises(RequestValidationError, match='offset'):
        parse_dto(ExamListingQueryDTO, dict(scope, offset=encode_offset(cursor_for(scope))) | change)


@pytest.mark.parametrize('offset', ['', 'invalid', '!!!!', 'bnVsbA==', 'W10=',
    encode_offset({'pk': 'EXAM#1'}),
    encode_offset(dict(cursor_for({}), created_at=True)),
    encode_offset(dict(cursor_for({}), created_at='123')),
    encode_offset(dict(cursor_for({}), created_at=float('nan'))),
    encode_offset(dict(cursor_for({}), created_at=float('inf'))),
    encode_offset(dict(cursor_for({}), created_at=10 ** 50)),
    encode_offset(dict(cursor_for({}), created_at=1e-200)),
    encode_offset(dict(cursor_for({}), pk='EXAM#' + 'x' * 2048)),
    encode_offset(dict(cursor_for({}), pk='EXAM#\ud800')),
    encode_offset(dict(cursor_for({}), extra='unexpected')),
    encode_offset(dict(cursor_for({}), pk='USER#1')),
    encode_offset(dict(cursor_for({}), sk='COMMENT#1')),
])
def test_malformed_cursor_is_a_validation_error(offset):
    with pytest.raises(RequestValidationError, match='offset'):
        parse_dto(ExamListingQueryDTO, {'offset': offset})


def test_profile_cursor_keeps_its_own_query_contract():
    offset = encode_offset({'pk': 'EXAM#example', 'sk': 'META',
                            'exam_user_status_pk': 'EXAM#author#published', 'created_at': 123})
    assert parse_dto(ExamQueryDTO, {'offset': offset}).offset == offset
    with pytest.raises(RequestValidationError, match='offset'):
        parse_dto(ExamListingQueryDTO, {'offset': offset})


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.setdefault(tag, []).append(dict(attrs))


@pytest.fixture
def render():
    app = Application()
    for name, path in (WEB_URL_ROUTES | API_URL_ROUTES).items():
        app.add_url_route(path, name)
    request = Request({'type': 'http', 'method': 'GET', 'path': '/', 'root_path': '',
                       'query_string': b'', 'scheme': 'https', 'server': ('example.com', 443),
                       'headers': [], 'app': app})
    env = get_jinja2_env()
    env.loader = FileSystemLoader([str(project_root / 'web-lambda/templates'),
                                  str(project_root / 'shared/templates')])
    env.globals['check_auth'] = lambda *args: True
    user = user_from_dynamodb({'id': 'author', 'name': 'Author', 'username': 'author', 'created_at': 1})
    exam = exam_from_dynamodb({'id': 'example', 'user_id': 'author', 'user_name': 'Author',
        'user_slug': 'author', 'exam_slug': 'example', 'title': 'Example', 'description': 'Example',
        'status': 'published', 'created_at': 1, 'rating_sk': 1,
        'certification_id': None})
    exam.offset = 'next-cursor'

    def render_template(template, metadata_only=False, **data):
        page = env.from_string('{% extends "' + template + '" %}{% block content %}{% endblock %}') \
            if metadata_only else env.get_template(template)
        defaults = dict(request=request, cur_user=user, user=user, exams=[exam], users=[], tags=[],
                        category=None, categories=[], tag=None, exam_query_tag_names=[],
                        exam_query_tag_items=[], activities={'current_year': 2026}, tag_subscriptions=[])
        return page.render(**(defaults | data))
    render_template.request = request
    render_template.exam = exam
    return render_template


@pytest.mark.parametrize('change', [{'type': 'popular'}, {'status': 'unpublished'}, {'tags': ['other']},
                                   {'category': 'writing'}])
def test_exam_url_filter_changes_clear_cursor(render, change):
    query = ExamQueryDTO(offset='old-cursor', tags=['aws'], category='other')
    url = get_exams_url(render.request, query=query, **change)
    assert 'offset' not in parse_qs(urlsplit(url).query)
    assert 'offset=next' in get_exams_url(render.request, query=query, offset='next')
    assert 'offset=old-cursor' in get_exams_url(render.request, query=query)


@pytest.mark.parametrize('template,query_name,query_type', [
    ('exams.html', 'exam_query', ExamQueryDTO), ('users.html', 'user_query', UserQueryDTO),
    ('tags.html', 'tags_query', TagQueryDTO), ('user.html', 'exam_query', ExamQueryDTO),
])
def test_sort_and_status_links_restart_pagination(render, template, query_name, query_type):
    query = query_type(offset='old-cursor', type='popular', limit=10)
    html = render(template, **{query_name: query})
    links = [a for a in Elements(html).tags['a'] if 'btn' in a.get('class', '')
             and ('first' not in a.get('href', '')) and a.get('rel') != 'next']
    for link in links:
        assert 'old-cursor' not in link.get('href', '')
    if template != 'user.html':
        assert any('bi-clock' in a.get('class', '') for a in links)
    else:
        assert any('status=unpublished' in a.get('href', '') for a in links)
    # Forms change filters without carrying over the old cursor.
    assert not any(i.get('name') == 'offset' for i in Elements(html).tags.get('input', []))


@pytest.mark.parametrize('template,query_name,query_type', [
    ('exams.html', 'exam_query', ExamQueryDTO), ('users.html', 'user_query', UserQueryDTO),
    ('tags.html', 'tags_query', TagQueryDTO), ('user.html', 'exam_query', ExamQueryDTO),
])
def test_first_and_cursor_page_robots(render, template, query_name, query_type):
    for offset, expected in ((None, 'index, follow'), ('continuation', 'noindex, follow')):
        html = render(template, metadata_only=True, **{query_name: query_type(offset=offset)})
        assert [m['content'] for m in Elements(html).tags['meta'] if m.get('name') == 'robots'] == [expected]


@pytest.mark.parametrize('status', ['unpublished', 'rejected'])
def test_private_profile_keeps_strict_robots(render, status):
    for offset in (None, 'continuation'):
        html = render('user.html', metadata_only=True, exam_query=ExamQueryDTO(status=status, offset=offset))
        assert 'content="noindex, nofollow"' in html


def test_banned_profile_keeps_strict_robots(render):
    user = user_from_dynamodb({'id': 'banned', 'name': 'Banned', 'status': 'banned', 'created_at': 1})
    for offset in (None, 'continuation'):
        html = render('user.html', metadata_only=True, user=user, exam_query=ExamQueryDTO(offset=offset))
        assert 'content="noindex, nofollow"' in html


@pytest.mark.parametrize('template,query_name,query_type', [
    ('tags.html', 'tags_query', TagQueryDTO),
])
def test_prefix_search_pages_are_not_indexable(render, template, query_name, query_type):
    html = render(template, metadata_only=True, **{query_name: query_type(prefix='example')})
    assert 'content="noindex, follow"' in html


def test_exam_pagination_links_remain_discoverable(render):
    html = render('exams.html', exam_query=ExamQueryDTO(offset='old-cursor', tags=['aws']))
    next_link = next(a for a in Elements(html).tags['a'] if a.get('rel') == 'next')
    assert 'offset=next-cursor' in next_link['href']
    assert 'nofollow' not in next_link['rel']
    assert any(a.get('href') == '/aws/exams' for a in Elements(html).tags['a'])


def test_avif_rendering_has_dimensions_and_responsive_sources(render):
    html = render('fragments/image.html', filename='sample_1280x800.avif', loading='lazy', decoding='async')
    elements = Elements(html)
    image = elements.tags['img'][0]
    assert (image['width'], image['height']) == ('1280', '800')
    assert image['loading'] == 'lazy'
    assert image['decoding'] == 'async'
    assert 'sample_640x400.webp' in elements.tags['source'][0]['srcset']


def test_external_images_keep_their_original_url(render):
    url = 'https://images.example.com/sample_1280x800.avif'
    elements = Elements(render('fragments/image.html', filename=url))
    assert elements.tags['img'][0]['src'] == url
    assert 'source' not in elements.tags


def test_initial_exam_images_can_be_eager_while_fragments_remain_lazy(render):
    render.exam.image_filename = 'sample_1280x800.jpg'
    initial = Elements(render('fragments/exams.html', eager_exam_images=1)).tags['img']
    fragment = Elements(render('fragments/exams.html')).tags['img']
    assert initial[0]['loading'] == 'eager'
    assert fragment[0]['loading'] == 'lazy'
    html = render('exams.html', exam_query=ExamQueryDTO())
    assert 'data-masonry-options=' in html
    assert 'data-masonry=' not in html


def test_category_images_and_conditional_tagify_assets_render(render):
    categories = [SimpleNamespace(name=f'Category {i}', slug=f'category-{i}', description='Description',
                                 published_exams_count=1, image_filename=f'category-{i}_1200x800.jpg')
                  for i in range(3)]
    images = Elements(render('categories.html', categories=categories)).tags['img']
    assert [image['loading'] for image in images] == ['eager', 'eager', 'lazy']
    assert all(image['decoding'] == 'async' for image in images)
    head = render('layout.html', layout_assets={'tagify': True}).split('</head>')[0]
    assert 'tagify.css' in head
    assert 'tagify.css' not in render('layout.html', layout_assets={})


def test_tag_filtered_exam_query_preserves_order_and_continuation(monkeypatch):
    import shared_utils

    cursor = {'pk': 'EXAM_TAG_COMBO#aws', 'sk': 'EXAM#123#second'}
    table = Mock(name='table')
    table.name = 'app_test'
    table.query.return_value = {'Items': [{'exam_id': 'second'}, {'exam_id': 'first'}],
                                'LastEvaluatedKey': cursor}
    table.meta.client.batch_get_item.return_value = {'Responses': {'app_test': [
        {'id': 'first'}, {'id': 'second'},
    ]}}
    monkeypatch.setattr(shared_utils, 'get_dynamodb_table', lambda: table)
    monkeypatch.setattr(shared_utils, 'exam_from_dynamodb', lambda item: SimpleNamespace(id=item['id'], offset=None))
    exams = shared_utils.get_latest_exams_by_tags(ExamQueryDTO(tags=['aws'], limit=2))
    assert [exam.id for exam in exams] == ['second', 'first']
    assert exams[-1].offset == encode_offset(cursor)


def test_category_and_tag_filter_follows_sparse_pages(monkeypatch):
    import shared_utils

    cursor = encode_offset({'pk': 'EXAM#next', 'sk': 'META',
                            'exam_category_status_pk': 'EXAM#other#published', 'created_at': 123})
    fetch = Mock(side_effect=[
        [SimpleNamespace(tags=['unrelated'], offset=cursor)],
        [SimpleNamespace(id='matching', tags=['aws'], offset=None)],
    ])
    monkeypatch.setattr(shared_utils, 'get_latest_exams', fetch)
    exams = shared_utils.get_exams(ExamQueryDTO(category='other', tags=['aws'], limit=2))
    assert [exam.id for exam in exams] == ['matching']
    assert fetch.call_count == 2
