import asyncio

from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import PlainTextResponse
from starlette.routing import Match

from certification_utils import get_certification, get_certifications
from notifications import get_access_log
from query_dtos import (
    TagQueryDTO,
)
from question_utils import get_all_questions, get_question_by_id, get_questions
from session_utils import get_session, get_sessions
from shared_deps import (
    OptCurUserDep,
    CurUserDep,
    ExamQueryDep,
    ExamDep,
    UserQueryDep,
    UserDep,
    TagDep,
    TagQueryDep,
    CategoryDep,
)
from shared_utils import ExamNotFoundError, get_exam
from shared_utils import (find_category, find_exam_by_slug_follow_redirects, find_user_by_username_follow_redirects,
                          get_categories, get_category, get_static_base_url, get_tags, get_web_base_url)
from web import (
    Application,
    Request,
    HTTPException,
    HTMLResponse,
    JSONResponse,
    RedirectResponse,
    RequestValidationError,
    CORSMiddleware,
    FileResponse,
)
from web import TrailingSlashMiddleware
from web_deps import (
    UserBySlugDep,
    UserQueryBySlugsDep,
    ExamBySlugsDep,
    ExamQueryBySlugsDep,
    get_error_response,
)
from web_utils import (
    set_token_cookie,
    drop_token_cookie,
    to_thread,
    ExamQueryDTO,
    ExamCommentQueryDTO,
    is_prod,
    InvalidTokenError,
    InvalidCodeError,
    CodeExchangeFailedError,
    NotAuthorizedError,
    ExamByOldSlugRequestedError,
    TagByOldSlugRequestedError,
    UserByOldSlugRequestedError,
    logger,
    get_html_content,
    get_url,
    get_exam_url,
    get_users,
    get_latest_exams_by_user,
    get_exams,
    get_latest_published_exams,
    get_popular_tags,
    get_popular_published_exams,
    find_user,
    jinja2_env,
    get_popular_active_users,
    Permission,
    verify_authorization,
    find_exam_impression,
    find_user_impression,
    get_user_url,
    NotAuthenticatedError,
    get_static_files_dir,
    UserStatus,
    UserBannedError,
    get_allowed_origins,
    get_redirect_url,
    should_show_popular_exams,
    get_exam_related_exams,
    get_exam_comments,
    get_latest_exam_comments,
    get_user_by_auth_token,
    get_tag_url,
    find_tag,
    get_user_activities,
    get_user_tag_subscription_for_tags,
    get_user_tag_subscriptions,
)

app = Application()
app.add_middleware(TrailingSlashMiddleware)


@app.get("/robots.txt", name="web-robots")
async def robots_txt():
    sitemap_base_url = get_static_base_url() or get_web_base_url()
    return PlainTextResponse(
        "User-agent: *\n"
        "Content-Signal: search=yes, ai-input=yes, ai-train=no\n"
        "Allow: /\n"
        "Disallow: /login\n"
        "Disallow: /logout\n"
        f"Sitemap: {sitemap_base_url.rstrip('/')}/sitemap.xml\n"
    )


from api_route_metadata import API_URL_ROUTES
from web_route_metadata import WEB_AUTH_URL_ROUTES, WEB_URL_ROUTES

app.add_url_route(WEB_URL_ROUTES["static-file"], "static-file")


def route(method, name, **kwargs):
    return getattr(app, method)(WEB_URL_ROUTES[name], name=name, **kwargs)


# Templates link to API endpoints, but this Lambda does not import or
# register API handlers. Keep only their URL shape/name as metadata.
for _name, _path in API_URL_ROUTES.items():
    app.add_url_route(_path, _name)

if not is_prod():
    import os


    @app.middleware("http")
    async def serve_static(request: Request, call_next):
        path = request.url.path.lstrip("/")
        if "." in path:  # file-like (e.g. robots.txt, sitemap.xml)
            static_dir = get_static_files_dir()
            file_path = os.path.join(static_dir, path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
        return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_no_robots_to_auth_endpoints(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.rstrip("/") in WEB_AUTH_URL_ROUTES.values():
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


@app.middleware("http")
async def inject_template_global_vars(request: Request, call_next):
    jinja2_env().globals["request"] = request
    return await call_next(request)


@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    finally:
        logger.log(*get_access_log(request, status))


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return get_error_response(exc.status_code, exc.detail)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.error("Unhandled request exception", exc_info=exc)
    return get_error_response(500)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    details = {}
    for error in exc.errors():
        field = error["loc"][-1] if len(error["loc"]) > 1 else error["loc"][0]
        details[field] = error["msg"]
    return get_error_response(422, details)


@app.exception_handler(NotAuthenticatedError)
async def not_authenticated_error_handler(_request: Request, _exc: NotAuthenticatedError):
    return get_error_response(401)


@app.exception_handler(UserBannedError)
async def user_banned_error_handler(_request: Request, _exc: UserBannedError):
    raise NotAuthorizedError("BANNED")


@app.exception_handler(NotAuthorizedError)
async def not_authorized_error_handler(_request: Request, exc: NotAuthorizedError):
    return get_error_response(403, {"permission": exc.permission})


@app.exception_handler(ExamByOldSlugRequestedError)
async def exam_redirect_exception_handler(request: Request, exc: ExamByOldSlugRequestedError):
    url = get_exam_url(request, exc.exam)
    return RedirectResponse(url=url, status_code=308)


@app.exception_handler(UserByOldSlugRequestedError)
async def exam_redirect_exception_handler(request: Request, exc: UserByOldSlugRequestedError):
    url = get_user_url(request, exc.user)
    return RedirectResponse(url=url, status_code=308)


@app.exception_handler(TagByOldSlugRequestedError)
async def tag_redirect_exception_handler(request: Request, exc: TagByOldSlugRequestedError):
    if request.url.path.startswith("/tags/"):
        url = get_url(request, "edit-tag", slug=exc.tag.slug)
    else:
        url = get_tag_url(request, exc.tag)
    return RedirectResponse(url=url, status_code=308)


@route("get", "index", response_class=HTMLResponse)
async def index(cur_user: OptCurUserDep) -> str:
    latest_exams_query = ExamQueryDTO()
    latest_exam_comments_query = ExamCommentQueryDTO(limit=3)
    should_show_become_an_author = (cur_user and cur_user.published_exams_count == 0) or not cur_user
    (
        popular_tags,
        latest_exams,
        popular_exams,
        latest_exam_comments,
        popular_users,
    ) = await asyncio.gather(
        to_thread(get_popular_tags, TagQueryDTO(limit=40)),
        to_thread(get_latest_published_exams, limit=latest_exams_query.limit),
        to_thread(get_popular_published_exams, limit=8),
        to_thread(get_latest_exam_comments, latest_exam_comments_query),
        to_thread(get_popular_active_users, limit=8),
    )
    return get_html_content("index.html", {
        "cur_user": cur_user,
        "popular_tags": popular_tags,
        "latest_exams_query": latest_exams_query,
        "latest_exams": latest_exams,
        "popular_exams": popular_exams,
        "show_popular_exams": should_show_popular_exams(latest_exams, popular_exams),
        "latest_exam_comments": latest_exam_comments,
        "popular_users": popular_users,
        "should_show_become_an_author": should_show_become_an_author
    })


async def _exam_page(exam: ExamDep, cur_user: OptCurUserDep) -> HTMLResponse:
    (
        author,
        exam_impression,
        related_exams,
        comments,
        category,
        questions,
    ) = await asyncio.gather(
        to_thread(find_user, exam.user_id),
        to_thread(find_exam_impression, exam, cur_user) if cur_user else asyncio.sleep(0, result=None),
        get_exam_related_exams(exam),
        to_thread(get_exam_comments, exam),
        to_thread(find_category, exam.category),
        to_thread(get_questions, exam.id),
    )

    html_content = get_html_content("exam.html", {
        "cur_user": cur_user,
        "exam": exam,
        "author": author,
        "exam_impression": exam_impression,
        "related_exams": related_exams,
        "comments": comments,
        "comments_query": ExamCommentQueryDTO(),
        "category": category,
        "questions": questions,
    })
    return HTMLResponse(html_content)


async def _exams_page(query_dto: ExamQueryDep, cur_user: OptCurUserDep) -> HTMLResponse:
    tag_slug = query_dto.tags[0] if query_dto.tags and len(query_dto.tags) == 1 else None
    (
        exams,
        tag,
        category,
        exam_query_tags,
    ) = await asyncio.gather(
        to_thread(get_exams, query_dto, cur_user),
        to_thread(find_tag, tag_slug) if tag_slug else asyncio.sleep(0, result=None),
        to_thread(get_category, query_dto.category) if query_dto.category else asyncio.sleep(0, result=None),
        asyncio.gather(*(to_thread(find_tag, tag) for tag in query_dto.tags)),
    )
    if tag and tag_slug and tag.slug != tag_slug:
        raise TagByOldSlugRequestedError(tag_slug, tag)

    exam_query_tag_names = [tag.name if tag else slug for tag, slug in zip(exam_query_tags, query_dto.tags)]
    exam_query_tag_items = [
        {"value": slug, "name": name}
        for slug, name in zip(query_dto.tags, exam_query_tag_names)
    ]
    return get_html_content("exams.html", {
        "cur_user": cur_user,
        "exam_query": query_dto,
        "exam_query_tag_names": exam_query_tag_names,
        "exam_query_tag_items": exam_query_tag_items,
        "exams": exams,
        "tag": tag,
        "category": category,
        "tag_subscription": get_user_tag_subscription_for_tags(cur_user,
                                                               query_dto.tags) if cur_user and query_dto.tags else None,
    })


@route("get", "new-exam", response_class=HTMLResponse)
async def new_exam(cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.CREATE_EXAM)
    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError
    return get_html_content("new-exam.html", {
        "cur_user": cur_user,
        "categories": get_categories(),
        "certifications": get_certifications(),
    })


@route("get", "exams", response_class=HTMLResponse)
async def exams_page(query_dto: ExamQueryDep, cur_user: OptCurUserDep):
    return await _exams_page(query_dto, cur_user)


@route("get", "tags", response_class=HTMLResponse)
async def tags_page(query_dto: TagQueryDep, cur_user: OptCurUserDep) -> str:
    tags = get_tags(query_dto)
    return get_html_content("tags.html", {
        "cur_user": cur_user,
        "tags": tags,
        "tags_query": query_dto,
    })


@route("get", "categories", response_class=HTMLResponse)
async def categories_page(cur_user: OptCurUserDep) -> str:
    return get_html_content("categories.html", {
        "cur_user": cur_user,
        "categories": get_categories(),
    })


@route("get", "certifications", response_class=HTMLResponse)
async def certifications_page(cur_user: OptCurUserDep) -> str:
    return get_html_content("certifications.html", {
        "cur_user": cur_user,
        "certifications": get_certifications(),
    })


@route("get", "new-certification", response_class=HTMLResponse)
async def new_certification_page(cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.ROOT)
    return get_html_content("new-certification.html", {
        "cur_user": cur_user,
    })


@route("get", "certification", response_class=HTMLResponse)
async def certification_page(slug: str, cur_user: OptCurUserDep) -> str:
    try:
        certification = get_certification(slug)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    exams = await to_thread(get_exams, ExamQueryDTO(limit=1000), cur_user)
    related_exams = [exam for exam in exams if exam.certification_id == certification.id]
    return get_html_content("certification.html", {
        "cur_user": cur_user,
        "certification": certification,
        "related_exams": related_exams,
    })


@route("get", "exam")
async def exam_page(exam: ExamDep, cur_user: OptCurUserDep):
    return await _exam_page(exam, cur_user)


@route("get", "edit-exam", response_class=HTMLResponse)
async def edit_exam(exam: ExamDep, cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.UPDATE_USER, exam)
    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError
    return get_html_content("edit-exam.html", {
        "cur_user": cur_user,
        "exam": exam,
        "categories": get_categories(),
        "certifications": get_certifications(),
    })


@route("get", "user-by-slug", response_class=HTMLResponse)
async def user_page_by_slug(user: UserBySlugDep, exams_query_dto: ExamQueryDep,
                            cur_user: OptCurUserDep, request: Request) -> HTMLResponse:
    return await _user_page(user, exams_query_dto, cur_user, request)


@route("get", "exam-by-slugs", response_class=HTMLResponse)
async def exam_page_by_slugs(exam: ExamBySlugsDep, cur_user: OptCurUserDep) -> HTMLResponse:
    return await _exam_page(exam, cur_user)


@route("get", "exams-by-slugs", response_class=HTMLResponse)
async def exams_page_by_slugs(query_dto: ExamQueryBySlugsDep, cur_user: OptCurUserDep) -> HTMLResponse:
    return await _exams_page(query_dto, cur_user)


@route("get", "contacts", response_class=HTMLResponse)
async def contacts(cur_user: OptCurUserDep) -> str:
    return get_html_content("contacts.html", {
        "cur_user": cur_user
    })


@route("get", "edit-tag", response_class=HTMLResponse)
async def edit_tag(tag: TagDep, cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.UPDATE_TAG, tag)
    return get_html_content("edit-tag.html", {
        "cur_user": cur_user,
        "tag": tag,
    })


@route("get", "edit-category", response_class=HTMLResponse)
async def edit_category(category: CategoryDep, cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.UPDATE_CATEGORY)
    return get_html_content("edit-category.html", {
        "cur_user": cur_user,
        "category": category,
    })


def _users_page(query_dto: UserQueryDep, cur_user: OptCurUserDep) -> HTMLResponse:
    return get_html_content("users.html", {
        "cur_user": cur_user,
        "user_query": query_dto,
        "users": get_users(query_dto, cur_user)
    })


@route("get", "users", response_class=HTMLResponse)
async def users_page(query_dto: UserQueryDep, cur_user: OptCurUserDep) -> str:
    return _users_page(query_dto, cur_user)


@route("get", "users-by-slugs", response_class=HTMLResponse)
async def users_page_by_slugs(query_dto: UserQueryBySlugsDep, cur_user: OptCurUserDep) -> HTMLResponse:
    return _users_page(query_dto, cur_user)


async def _user_page(user: UserDep, exams_query_dto: ExamQueryDep, cur_user: OptCurUserDep,
                     request: Request) -> HTMLResponse:
    activities_year = request.query_params.get("activities_year")
    activities_year = int(activities_year) if activities_year else None

    (
        exams,
        user_impression,
        activities,
        tag_subscriptions,
    ) = await asyncio.gather(
        to_thread(get_latest_exams_by_user, user, exams_query_dto, cur_user),
        to_thread(find_user_impression, user, cur_user) if cur_user else asyncio.sleep(0, result=None),
        to_thread(get_user_activities, user, activities_year),
        to_thread(get_user_tag_subscriptions, user),
    )

    html_content = get_html_content("user.html", {
        "cur_user": cur_user,
        "user": user,
        "exam_query": exams_query_dto,
        "exams": exams,
        "user_impression": user_impression,
        "activities": activities,
        "activities_year": activities_year,
        "tag_subscriptions": tag_subscriptions,
    })
    return HTMLResponse(html_content)


@route("get", "user")
async def user_page(user: UserDep, exams_query_dto: ExamQueryDep, cur_user: OptCurUserDep, request: Request):
    return await _user_page(user, exams_query_dto, cur_user, request)


@route("get", "edit-user", response_class=HTMLResponse)
async def edit_user(user: UserDep, cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.UPDATE_USER, user)
    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError
    return get_html_content("edit-user.html", {
        "cur_user": cur_user,
        "user": user
    })


@route("get", "login", response_class=RedirectResponse)
async def login(request: Request) -> RedirectResponse:
    from web_utils import get_login_redirect_url

    redirect_url = get_redirect_url(request)
    callback_url = get_url(request, 'login-callback', absolute=True)
    provider_redirect_url = get_login_redirect_url(callback_url)
    response = RedirectResponse(provider_redirect_url)
    response.set_cookie("redirect_url", redirect_url, httponly=True, secure=True)
    return response


@route("get", "login-callback", response_class=RedirectResponse)
async def login_callback(request: Request) -> RedirectResponse:
    from web_utils import create_auth_jwt_token, get_user_token_by_code

    try:
        redirect_url = request.cookies.get("redirect_url") or get_url(request, "index")
        callback_url = get_url(request, 'login-callback', absolute=True)

        cognito_user_token = get_user_token_by_code(
            code=request.query_params.get("code"),
            callback_url=callback_url
        )
        response = RedirectResponse(redirect_url, 302)
        token = create_auth_jwt_token(cognito_user_token)
        set_token_cookie(token, response)
        user = get_user_by_auth_token(token)
        return response
    except (InvalidCodeError, CodeExchangeFailedError, InvalidTokenError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@route("get", "logout", response_class=RedirectResponse)
async def logout(request: Request) -> RedirectResponse:
    from web_utils import get_logout_redirect_url

    redirect_url = get_redirect_url(request)
    callback_url = get_url(request, 'logout-callback', absolute=True)
    provider_redirect_url = get_logout_redirect_url(callback_url)
    response = RedirectResponse(provider_redirect_url)
    response.set_cookie("redirect_url", redirect_url, httponly=True, secure=True)
    drop_token_cookie(response)
    request.state.cur_user = None
    return response


@route("get", "logout-callback", response_class=RedirectResponse)
async def logout_callback(request: Request):
    response = RedirectResponse(request.cookies.get("redirect_url") or get_url(request, "index"))
    drop_token_cookie(response)
    return response


@route("get", "policy", response_class=HTMLResponse)
async def policy(cur_user: OptCurUserDep) -> str:
    return get_html_content("policy.html", {
        "cur_user": cur_user,
    })


@route("get", "rules", response_class=HTMLResponse)
async def rules(cur_user: OptCurUserDep) -> str:
    return get_html_content("rules.html", {
        "cur_user": cur_user,
    })


@route("get", "terms", response_class=HTMLResponse)
async def terms(cur_user: OptCurUserDep) -> str:
    return get_html_content("terms.html", {
        "cur_user": cur_user,
    })


@route("get", "earn", response_class=HTMLResponse)
async def contribute(cur_user: OptCurUserDep) -> str:
    return get_html_content("earn.html", {
        "cur_user": cur_user,
    })


@route("get", "utils", response_class=HTMLResponse)
async def utils(cur_user: CurUserDep) -> str:
    verify_authorization(cur_user, Permission.UTILS)
    return get_html_content("utils.html", {
        "cur_user": cur_user,
    })


@route("get", "new-question", response_class=HTMLResponse)
async def new_question_page(exam_id: str, cur_user: CurUserDep) -> str:
    try:
        exam = get_exam(exam_id, cur_user)
    except ExamNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    verify_authorization(cur_user, Permission.CREATE_QUESTION, exam)
    return get_html_content("question-form.html", {
        "cur_user": cur_user,
        "exam": exam,
        "question": None,
        "is_new": True,
    })


@route("get", "questions-all", response_class=HTMLResponse)
async def all_questions_page(cur_user: OptCurUserDep) -> str:
    questions = get_all_questions()
    return get_html_content("all-questions.html", {
        "cur_user": cur_user,
        "questions": questions,
        "exams": {question.exam_id: get_exam(question.exam_id, cur_user) for question in questions},
    })


@route("get", "exam-sessions", response_class=HTMLResponse)
async def exam_sessions_page(cur_user: CurUserDep) -> str:
    return get_html_content("exam-sessions.html", {
        "cur_user": cur_user,
        "sessions": get_sessions(cur_user.id),
    })


@route("get", "exam-session", response_class=HTMLResponse)
async def exam_session_page(session_id: str, cur_user: CurUserDep) -> str:
    try:
        session = get_session(cur_user.id, session_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    exam = get_exam(session.exam_id, cur_user)
    return get_html_content("exam-session.html", {
        "cur_user": cur_user,
        "exam": exam,
        "session": session,
        "questions": get_questions(session.exam_id),
    })


async def _render_question_page(question, cur_user: OptCurUserDep) -> str:
    exam = get_exam(question.exam_id, cur_user)
    return get_html_content("question.html", {
        "cur_user": cur_user,
        "exam": exam,
        "question": question,
    })


@route("get", "question-by-id", response_class=HTMLResponse)
async def question_page_by_id(question_id: str, cur_user: OptCurUserDep) -> str:
    try:
        question = get_question_by_id(question_id)
    except (ExamNotFoundError, LookupError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return await _render_question_page(question, cur_user)


@route("get", "question-by-slugs", response_class=HTMLResponse)
async def question_page_by_slugs(user_slug: str, exam_slug: str, question_slug: str,
                                 cur_user: OptCurUserDep) -> str:
    user = find_user_by_username_follow_redirects(user_slug)
    exam = find_exam_by_slug_follow_redirects(exam_slug)
    question = None
    if user and exam and exam.owner_id == user.id:
        question = next((item for item in get_questions(exam.id) if item.slug == question_slug), None)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return await _render_question_page(question, cur_user)


@route("get", "edit-question", response_class=HTMLResponse)
async def edit_question_page(question_id: str, cur_user: CurUserDep) -> str:
    try:
        question = get_question_by_id(question_id)
        exam = get_exam(question.exam_id, cur_user)
    except (ExamNotFoundError, LookupError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    verify_authorization(cur_user, Permission.UPDATE_QUESTION, question)
    return get_html_content("question-form.html", {
        "cur_user": cur_user,
        "exam": exam,
        "question": question,
        "is_new": False,
    })
