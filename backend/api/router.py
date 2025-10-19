from fastapi import APIRouter
from api.routers.llm import router as llm_router
from api.routers.chat import router as chat_router
from api.routers.applications import router as applications_router
from api.routers.users import router as users_router
from api.routers.jobs import router as jobs_router
from api.routers.scoring import router as scoring_router

router = APIRouter()

router.include_router(llm_router)
router.include_router(chat_router)
router.include_router(applications_router)
router.include_router(users_router)
router.include_router(jobs_router)
router.include_router(scoring_router)


