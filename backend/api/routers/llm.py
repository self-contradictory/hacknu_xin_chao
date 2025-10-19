from fastapi import APIRouter, Request
import uuid

from ..schemas import (
    ApplyRequest,
    ApplyResponse
)

router = APIRouter()


@router.post("/apply", response_model=ApplyResponse)
async def apply(request: Request, data: ApplyRequest):

    application_id = str(uuid.uuid4())
    request.app.state.applications[application_id] = data.dict()

    return ApplyResponse(
        application_id=application_id,
        message="Отклик получен, сейчас подберём уточняющие вопросы."
    )
