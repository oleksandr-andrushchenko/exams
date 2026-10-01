"""API-only request dependencies.

The web lambda keeps the shared read/query dependencies in ``shared``;
upload and mutation request parsing belongs to the API lambda.
"""

from typing import Annotated

from exam_dtos import UpdateCategoryDTO, UpdateExamCommentDTO, UpdateExamCommentImpressionDTO, UpdateExamDTO, \
    UpdateExamImpressionDTO, UpdateExamStatusDTO, UpdateTagDTO
from basic_dtos import ImageFileDTO
from cdn_cache_dtos import DropCDNCacheDTO
from query_dtos import ExamCommentQueryDTO
from shared_utils import ExamComment, ExamCommentNotFoundError, get_exam_comment
from tag_subscription_dtos import TagSubscriptionDTO
from user_dtos import UpdateUserDTO, UpdateUserImpressionDTO, UpdateUserStatusDTO
from web import Depends, Body, HTTPException, Request, RequestValidationError


async def get_image_file(request: Request):
    form = await request.form()
    file = form.get("file")
    if file is None or not hasattr(file, "read"):
        raise HTTPException(status_code=422, detail="Missing file")
    try:
        return ImageFileDTO(content=await file.read(), filename=file.filename)
    except ValueError as exc:
        raise RequestValidationError({"file": str(exc)}) from exc


def get_update_user_dto(value: UpdateUserDTO = Body(...)) -> UpdateUserDTO:
    return value


def get_tag_subscription_dto(value: TagSubscriptionDTO = Body(...)) -> TagSubscriptionDTO:
    return value


def get_drop_cdn_cache_dto(value: DropCDNCacheDTO = Body(...)) -> DropCDNCacheDTO:
    return value


def get_update_user_status_dto(value: UpdateUserStatusDTO = Body(...)) -> UpdateUserStatusDTO:
    return value


def get_update_exam_dto(value: UpdateExamDTO = Body(...)) -> UpdateExamDTO:
    return value


def get_update_exam_status_dto(value: UpdateExamStatusDTO = Body(...)) -> UpdateExamStatusDTO:
    return value


def get_update_exam_impression_dto(value: UpdateExamImpressionDTO = Body(...)) -> UpdateExamImpressionDTO:
    return value


def get_exam_comment_by_id(exam_id: str, comment_id: str) -> ExamComment:
    try:
        return get_exam_comment(exam_id, comment_id)
    except ExamCommentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


def get_update_exam_comment_dto(value: UpdateExamCommentDTO = Body(...)) -> UpdateExamCommentDTO:
    return value


def get_update_exam_comment_impression_dto(
        value: UpdateExamCommentImpressionDTO = Body(...)) -> UpdateExamCommentImpressionDTO:
    return value


def get_update_user_impression_dto(value: UpdateUserImpressionDTO = Body(...)) -> UpdateUserImpressionDTO:
    return value


def get_update_tag_dto(value: UpdateTagDTO = Body(...)) -> UpdateTagDTO:
    return value


def get_update_category_dto(value: UpdateCategoryDTO = Body(...)) -> UpdateCategoryDTO:
    return value


UpdateUserDTODep = Annotated[UpdateUserDTO, Depends(get_update_user_dto)]
UpdateUserStatusDTODep = Annotated[UpdateUserStatusDTO, Depends(get_update_user_status_dto)]
UpdateExamDTODep = Annotated[UpdateExamDTO, Depends(get_update_exam_dto)]
UpdateExamStatusDTODep = Annotated[UpdateExamStatusDTO, Depends(get_update_exam_status_dto)]
UpdateExamImpressionDTODep = Annotated[UpdateExamImpressionDTO, Depends(get_update_exam_impression_dto)]
ExamCommentDep = Annotated[ExamComment, Depends(get_exam_comment_by_id)]
UpdateExamCommentDTODep = Annotated[UpdateExamCommentDTO, Depends(get_update_exam_comment_dto)]
UpdateExamCommentImpressionDTODep = Annotated[
    UpdateExamCommentImpressionDTO, Depends(get_update_exam_comment_impression_dto)]
UpdateTagDTODep = Annotated[UpdateTagDTO, Depends(get_update_tag_dto)]
UpdateCategoryDTODep = Annotated[UpdateCategoryDTO, Depends(get_update_category_dto)]
TagSubscriptionDTODep = Annotated[TagSubscriptionDTO, Depends(get_tag_subscription_dto)]
DropCDNCacheDTODep = Annotated[DropCDNCacheDTO, Depends(get_drop_cdn_cache_dto)]
ImageFileDTODep = Annotated[ImageFileDTO, Depends(get_image_file)]
UpdateUserImpressionDTODep = Annotated[UpdateUserImpressionDTO, Depends(get_update_user_impression_dto)]

ExamCommentQueryDep = Annotated[ExamCommentQueryDTO, Depends()]
