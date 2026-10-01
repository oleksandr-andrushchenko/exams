from typing import Annotated, Optional

from shared_utils import (
    User,
    ExamQueryDTO,
    Exam,
    TagQueryDTO,
    UserQueryDTO,
    InvalidTokenError,
    ExamNotFoundError,
    UserNotFoundError,
    get_user_by_auth_token,
    get_exam,
    get_user,
    Tag,
    TagNotFoundError,
    get_tag,
    Category,
    CategoryNotFoundError,
    get_category,
)
from web import (
    Depends,
    HTTPException,
    Query,
    Request,
    parse_dto,
)


def _resolve_user(request: Request) -> User | None:
    token = request.cookies.get("token")
    if not token:
        return None

    try:
        return get_user_by_auth_token(token)
    except InvalidTokenError:
        return None


def get_cur_user(request: Request) -> User:
    user = _resolve_user(request)
    request.state.cur_user = user

    if not user:
        raise HTTPException(status_code=401)

    return user


def get_opt_cur_user(request: Request) -> User | None:
    user = _resolve_user(request)
    request.state.cur_user = user
    return user


CurUserDep = Annotated[User, Depends(get_cur_user)]
OptCurUserDep = Annotated[Optional[User], Depends(get_opt_cur_user)]


def get_exam_by_id(exam_id: str, cur_user: OptCurUserDep = None) -> Exam:
    try:
        return get_exam(exam_id, cur_user)
    except ExamNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


def get_tag_by_slug(slug: str, cur_user: CurUserDep) -> Tag:
    try:
        return get_tag(slug, cur_user)
    except TagNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


def get_category_by_slug(slug: str) -> Category:
    try:
        return get_category(slug)
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


def get_user_by_id(user_id: str, cur_user: OptCurUserDep = None) -> User:
    try:
        return get_user(user_id, cur_user)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


def get_exam_query(request: Request, tags: list[str] = Query([])) -> ExamQueryDTO:
    data = dict(request.query_params)
    data.update({"tags": tags})
    return parse_dto(ExamQueryDTO, data)


UserDep = Annotated[User, Depends(get_user_by_id)]
UserQueryDep = Annotated[UserQueryDTO, Depends()]
ExamDep = Annotated[Exam, Depends(get_exam_by_id)]
ExamQueryDep = Annotated[ExamQueryDTO, Depends(get_exam_query)]
TagQueryDep = Annotated[TagQueryDTO, Depends()]
TagDep = Annotated[Tag, Depends(get_tag_by_slug)]
CategoryDep = Annotated[Category, Depends(get_category_by_slug)]
