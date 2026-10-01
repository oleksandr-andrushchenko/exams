from typing import Annotated

from http import HTTPStatus

from starlette.responses import HTMLResponse

from shared_deps import OptCurUserDep
from query_dtos import ExamQueryDTO, UserQueryDTO
from shared_utils import Exam, User, ExamNotFoundError, UserNotFoundError, get_html_content
from web import Depends, HTTPException, Request, parse_dto
from web_utils import get_exam_by_slugs, get_user_by_slug, parse_exams_url_slugs_path


def get_error_response(status_code: int, details: dict | str = None):
    status_enum = HTTPStatus(status_code)
    public_data = {
        "code": status_code,
        "title": status_enum.phrase,
        "message": status_enum.description,
        "details": details,
    }

    content = get_html_content("error.html", {
        **public_data,
    })

    return HTMLResponse(
        status_code=status_code,
        content=content
    )


def get_user_query_by_slugs(request: Request, type: str) -> UserQueryDTO:
    data = dict(request.query_params)
    data.update({"type": type})
    return parse_dto(UserQueryDTO, data)



def get_exam_query_by_slugs(request: Request, slugs_path: str) -> ExamQueryDTO:
    data = dict(request.query_params)
    data.update(parse_exams_url_slugs_path(slugs_path))
    return parse_dto(ExamQueryDTO, data)



def _get_user_by_slug(slug: str, cur_user: OptCurUserDep = None) -> User:
    try:
        return get_user_by_slug(slug, cur_user)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))



def _get_exam_by_slugs(user_slug: str, exam_slug: str, cur_user: OptCurUserDep = None) -> Exam:
    try:
        return get_exam_by_slugs(user_slug, exam_slug, cur_user)
    except ExamNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))



UserBySlugDep = Annotated[User, Depends(_get_user_by_slug)]
UserQueryBySlugsDep = Annotated[UserQueryDTO, Depends(get_user_query_by_slugs)]
ExamBySlugsDep = Annotated[Exam, Depends(_get_exam_by_slugs)]
ExamQueryBySlugsDep = Annotated[ExamQueryDTO, Depends(get_exam_query_by_slugs)]
