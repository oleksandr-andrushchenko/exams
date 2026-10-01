import asyncio

from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import PlainTextResponse

from api_deps import (
    get_error_response,
)
from api_utils import (
    to_thread,
    ContactMessageDTO,
    ExamDTO,
    ExamCommentDTO,
    Tag,
    SlugDuplicationError,
    NotAuthorizedError,
    ExamByOldSlugRequestedError,
    TagByOldSlugRequestedError,
    UserByOldSlugRequestedError,
    UserNotFoundError,
    logger,
    get_html_content,
    get_url,
    create_exam,
    create_contact_message,
    update_exam_status,
    get_users,
    get_latest_exams_by_user,
    get_exams,
    get_all_exams,
    get_all_exam_hrefs,
    find_user,
    jinja2_env,
    update_user,
    update_exam,
    find_exam_impression,
    update_exam_impression,
    update_user_impression,
    find_user_impression,
    get_user_url,
    NotAuthenticatedError,
    update_user_status,
    UserBannedError,
    get_allowed_origins,
    find_exam,
    create_exam_comment,
    get_exam_comments,
    update_exam_comment,
    get_exam_comment_url,
    get_tag_url,
    update_tag,
    get_user_tag_subscriptions,
    create_tag_subscription,
    delete_tag_subscription,
    update_category,
)
from deps import (
    ImageFileDTODep,
    ExamCommentQueryDep,
    UpdateUserDTODep,
    UpdateExamDTODep,
    UpdateExamStatusDTODep,
    UpdateExamImpressionDTODep,
    UpdateUserImpressionDTODep,
    UpdateUserStatusDTODep,
    ExamCommentDep,
    UpdateExamCommentDTODep,
    UpdateTagDTODep,
    TagSubscriptionDTODep,
    DropCDNCacheDTODep,
    UpdateCategoryDTODep,
)
from notifications import get_access_log
from shared_deps import (
    OptCurUserDep,
    CurUserDep,
    ExamQueryDep,
    ExamDep,
    TagQueryDep,
    UserQueryDep,
    UserDep,
    TagDep,
    CategoryDep,
)
from shared_utils import (
    find_tag,
    get_exam_url,
    get_tags,
    get_categories,
)
from web import Application, Request, HTTPException, HTMLResponse, JSONResponse, RedirectResponse, \
    RequestValidationError, CORSMiddleware
from web import TrailingSlashMiddleware

from question_dtos import QuestionDTO, UpdateQuestionDTO
from certification_dtos import CertificationDTO
from certification_utils import create_certification, get_certifications
from question_utils import Question, create_question, delete_question, get_question, get_questions, update_question
from session_dtos import AnswerDTO
from session_utils import answer_question, complete_session, create_session, get_session, get_sessions

app = Application()
app.add_middleware(TrailingSlashMiddleware)


@app.get("/robots.txt", name="api-robots")
async def robots_txt():
    return PlainTextResponse("User-agent: *\nDisallow: /\n")


from api_route_metadata import API_URL_ROUTES


def route(method, name, **kwargs):
    return getattr(app, method)(API_URL_ROUTES[name], name=name, **kwargs)


@route("get", "certifications", response_class=JSONResponse)
async def _get_certifications():
    return get_certifications()


@route("post", "create-certification", response_class=JSONResponse)
async def _create_certification(certification: CertificationDTO, cur_user: CurUserDep):
    return create_certification(certification, cur_user)


from web_route_metadata import WEB_URL_ROUTES

for _name, _path in WEB_URL_ROUTES.items():
    app.add_url_route(_path, _name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def redirect_legacy_api_endpoints(request: Request, call_next):
    path = request.url.path
    replacements = (
        ("/posts", "/exams"),
        ("/post-tags", "/tags"),
    )
    for old, new in replacements:
        # In the combined local test app, GET /posts belongs to the web
        # Lambda; API legacy writes still use the redirect below.
        if old == "/posts" and request.method == "GET":
            continue
        if old in path:
            path = path.replace(old, new, 1)
            url = path + (f"?{request.url.query}" if request.url.query else "")
            return RedirectResponse(url=url, status_code=308)
    return await call_next(request)


@app.middleware("http")
async def add_no_robots_to_api(request: Request, call_next):
    response = await call_next(request)

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


@route("post", "upload-public-file", response_class=JSONResponse)
async def upload_public_file(image_file_dto: ImageFileDTODep) -> str:
    from api_utils import resize_public_image, save_public_file

    return save_public_file(resize_public_image(image_file_dto))


@route("post", "create-exam", response_class=JSONResponse)
async def _create_exam(exam_dto: ExamDTO, cur_user: CurUserDep, request: Request) -> str:
    try:
        exam = create_exam(exam_dto, cur_user)
        return get_exam_url(request, exam)
    except SlugDuplicationError as e:
        raise HTTPException(status_code=409, detail=e.to_dict())


@route("get", "exams-fragment", response_class=HTMLResponse)
async def exams_fragment(query_dto: ExamQueryDep, cur_user: OptCurUserDep) -> str:
    return get_html_content("fragments/exams.html", {
        "exams": get_exams(query_dto, cur_user)
    })


@route("get", "exams", response_class=JSONResponse)
async def _exams(cur_user: OptCurUserDep, request: Request) -> dict[str, str]:
    exams = await asyncio.to_thread(get_all_exams, cur_user)
    return {get_exam_url(request, exam): exam.title for exam in exams}


@route("get", "exam-hrefs", response_class=JSONResponse)
async def _exam_hrefs(cur_user: OptCurUserDep) -> dict[str, list[str]]:
    return await asyncio.to_thread(get_all_exam_hrefs, cur_user)


@route("get", "exam-comments-fragment", response_class=HTMLResponse)
async def exam_comments_fragment(exam: ExamDep, query_dto: ExamCommentQueryDep) -> str:
    return get_html_content("fragments/exam-comments.html", {
        "comments": get_exam_comments(exam, query_dto)
    })


@route("patch", "update-exam", response_class=JSONResponse)
async def _update_exam(exam: ExamDep, update_exam_dto: UpdateExamDTODep, cur_user: CurUserDep,
                          request: Request) -> str:
    try:
        update_exam(exam, update_exam_dto, cur_user, request)
        return get_exam_url(request, exam)
    except SlugDuplicationError as e:
        raise HTTPException(status_code=409, detail=e.to_dict())


@route("post", "update-exam-status", response_class=JSONResponse)
async def _update_exam_status(exam: ExamDep, update_exam_status_dto: UpdateExamStatusDTODep,
                                 cur_user: CurUserDep, request: Request) -> str:
    update_exam_status(exam, update_exam_status_dto, cur_user, request)
    return get_exam_url(request, exam)


@route("post", "update-exam-impression", response_class=HTMLResponse)
async def _update_exam_impression(exam: ExamDep, update_exam_impression_dto: UpdateExamImpressionDTODep,
                                     cur_user: CurUserDep, request: Request) -> str:
    update_exam_impression(exam, update_exam_impression_dto, cur_user, request)
    (
        exam,
        exam_impression,
    ) = await asyncio.gather(
        to_thread(find_exam, exam.id),
        to_thread(find_exam_impression, exam, cur_user),
    )
    return get_html_content("fragments/exam-impressions.html", {
        "exam": exam,
        "exam_impression": exam_impression,
        "cur_user": cur_user,
    })


@route("post", "create-exam-comment", response_class=JSONResponse)
async def _create_exam_comment(exam: ExamDep, exam_comment_dto: ExamCommentDTO, cur_user: CurUserDep,
                                  request: Request) -> str:
    exam_comment = create_exam_comment(exam, exam_comment_dto, cur_user, request)
    return get_exam_comment_url(request, exam, exam_comment)


@route("patch", "update-exam-comment",
       response_class=JSONResponse)
async def _update_exam_comment(exam: ExamDep, exam_comment: ExamCommentDep,
                                  update_exam_comment_dto: UpdateExamCommentDTODep, cur_user: CurUserDep,
                                  request: Request) -> str:
    update_exam_comment(exam, exam_comment, update_exam_comment_dto, cur_user, request)
    return get_exam_comment_url(request, exam, exam_comment)


@route("post", "create-contact-message", status_code=204)
async def _create_contact_message(message_dto: ContactMessageDTO, cur_user: OptCurUserDep) -> None:
    create_contact_message(message_dto, cur_user)


@route("get", "tag-subscriptions", response_class=JSONResponse)
async def _get_tag_subscriptions(cur_user: CurUserDep):
    return get_user_tag_subscriptions(cur_user)


@route("post", "create-tag-subscription", response_class=HTMLResponse)
async def _create_tag_subscription(dto: TagSubscriptionDTODep, cur_user: CurUserDep):
    try:
        async def get_tag():
            if len(dto.tags) == 1:
                return await to_thread(find_tag, dto.tags[0])
            return None

        (
            tag,
            tag_subscription,
        ) = await asyncio.gather(
            get_tag(),
            to_thread(create_tag_subscription, dto, cur_user),
        )
        return get_html_content("fragments/tag-subscription.html", {
            "cur_user": cur_user,
            "tag": tag,
            "tags": tag_subscription.tags,
            "tag_subscription": tag_subscription,
        })
    except SlugDuplicationError as exc:
        raise HTTPException(status_code=409, detail=exc.to_dict())


@route("delete", "delete-tag-subscription",
       response_class=HTMLResponse)
async def _delete_tag_subscription(tag_subscription_id: str, cur_user: CurUserDep):
    try:
        tag_subscription = delete_tag_subscription(tag_subscription_id, cur_user)
        tag = find_tag(tag_subscription.tags[0]) if len(tag_subscription.tags) == 1 else None
        return get_html_content("fragments/tag-subscription.html", {
            "cur_user": cur_user,
            "tag": tag,
            "tags": tag_subscription.tags,
            "tag_subscription": None,
        })
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@route("patch", "update-tag", response_class=JSONResponse)
async def _update_tag(update_tag_dto: UpdateTagDTODep, tag: TagDep,
                      cur_user: CurUserDep,
                      request: Request) -> str:
    update_tag(tag, update_tag_dto, cur_user, request)
    return get_tag_url(request, tag)


@route("get", "tags", response_class=JSONResponse)
async def _get_tags(query_dto: TagQueryDep) -> list[Tag]:
    return get_tags(query_dto)


@route("get", "get-categories", response_class=JSONResponse)
async def _get_categories() -> list:
    return get_categories()


@route("patch", "update-category", response_class=JSONResponse)
async def _update_category(update_category_dto: UpdateCategoryDTODep,
                           category: CategoryDep, cur_user: CurUserDep,
                           request: Request) -> str:
    update_category(category, update_category_dto, cur_user)
    return get_url(request, "categories", True)


@route("get", "tags-fragment", response_class=HTMLResponse)
async def tags_fragment(query_dto: TagQueryDep) -> str:
    return get_html_content("fragments/tags.html", {
        "tags": get_tags(query_dto),
    })


@route("get", "users-fragment", response_class=HTMLResponse)
async def users_fragment(query_dto: UserQueryDep, cur_user: OptCurUserDep) -> str:
    return get_html_content("fragments/users.html", {
        "users": get_users(query_dto, cur_user),
        "cur_user": cur_user,
    })


@route("post", "update-user-status", response_class=JSONResponse)
async def _update_user_status(user: UserDep, update_user_status_dto: UpdateUserStatusDTODep,
                              cur_user: CurUserDep, request: Request) -> str:
    update_user_status(user, update_user_status_dto, cur_user, request)
    return get_user_url(request, user)


@route("post", "update-user-impression", response_class=HTMLResponse)
async def _update_user_impression(user: UserDep, update_user_impression_dto: UpdateUserImpressionDTODep,
                                  cur_user: CurUserDep, request: Request) -> str:
    update_user_impression(user, update_user_impression_dto, cur_user, request)
    (
        user,
        user_impression,
    ) = await asyncio.gather(
        to_thread(find_user, user.id),
        to_thread(find_user_impression, user, cur_user),
    )
    return get_html_content("fragments/user-impressions.html", {
        "user": user,
        "user_impression": user_impression,
        "cur_user": cur_user,
    })


@route("patch", "update-user", response_class=JSONResponse)
async def _update_user(update_user_dto: UpdateUserDTODep, user: UserDep, cur_user: CurUserDep, request: Request) -> str:
    update_user(user, update_user_dto, cur_user, request)
    return get_user_url(request, user)


@route("get", "user-exams-fragment", response_class=HTMLResponse)
async def user_exams_fragment(user: UserDep, query_dto: ExamQueryDep, cur_user: OptCurUserDep) -> str:
    return get_html_content("fragments/exams.html", {
        "query": query_dto,
        "exams": get_latest_exams_by_user(user, query_dto, cur_user),
        "cur_user": cur_user,
    })


@route("post", "generate-sitemap")
async def _generate_sitemap(cur_user: CurUserDep, request: Request) -> dict:
    from api_utils import generate_sitemap

    urls_count, sitemap_url = generate_sitemap(cur_user, request)
    return {"urls_count": urls_count, "sitemap_url": sitemap_url}


@route("post", "drop-cdn-cache")
async def _drop_cdn_cache(cur_user: CurUserDep, drop_cache_dto: DropCDNCacheDTODep) -> dict:
    from api_utils import drop_cdn_cache

    success, items_count = drop_cdn_cache(cur_user, drop_cache_dto.paths)
    return {"success": success, "items_count": items_count}


@route("post", "create-question", response_class=JSONResponse)
async def _create_question(exam: ExamDep, question_dto: QuestionDTO, cur_user: CurUserDep) -> Question:
    return create_question(exam, question_dto, cur_user)

@route("get", "get-questions", response_class=JSONResponse)
async def _get_questions(exam_id: str) -> list[Question]:
    return get_questions(exam_id)

@route("get", "get-question", response_class=JSONResponse)
async def _get_question(exam_id: str, question_id: str) -> Question:
    try:
        return get_question(exam_id, question_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@route("patch", "update-question", response_class=JSONResponse)
async def _update_question(exam_id: str, question_id: str, question_dto: UpdateQuestionDTO,
                           cur_user: CurUserDep) -> Question:
    try:
        return update_question(get_question(exam_id, question_id), question_dto, cur_user)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@route("delete", "delete-question", status_code=204)
async def _delete_question(exam_id: str, question_id: str, cur_user: CurUserDep) -> None:
    try:
        delete_question(get_question(exam_id, question_id), cur_user)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@route("post", "create-exam-session", response_class=JSONResponse)
async def _create_exam_session(exam_id: str, cur_user: CurUserDep):
    return create_session(exam_id, cur_user)


@route("get", "get-exam-sessions", response_class=JSONResponse)
async def _get_exam_sessions(cur_user: CurUserDep):
    return get_sessions(cur_user.id)


@route("get", "get-exam-session", response_class=JSONResponse)
async def _get_exam_session(session_id: str, cur_user: CurUserDep):
    try:
        return get_session(cur_user.id, session_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@route("post", "answer-exam-session", response_class=JSONResponse)
async def _answer_exam_session(session_id: str, answer: AnswerDTO, cur_user: CurUserDep):
    try:
        return answer_question(get_session(cur_user.id, session_id), answer.question_id, answer.choice_index)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@route("post", "complete-exam-session", response_class=JSONResponse)
async def _complete_exam_session(session_id: str, cur_user: CurUserDep):
    try:
        return complete_session(get_session(cur_user.id, session_id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
