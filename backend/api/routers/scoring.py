from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from core.db import get_db
from api.schemas import ScoringRequest, CriterionResultResponse, AnswerJudgmentResponse, ScoringResponse
from services import (
    get_application_by_id, get_job_by_id, get_user_by_id,
    create_job_description_data, create_candidate_data,
    score_application_with_data, score_application_custom,
    get_scoring_config_data, get_recruiter_dashboard_data,
    get_application_scoring_details_data, get_application_scoring_summary_data,
    get_scoring_insights_data
)

router = APIRouter(prefix="/scoring")




@router.post("/score", response_model=ScoringResponse)
async def score_application(request: ScoringRequest, db: Session = Depends(get_db)):
    application = get_application_by_id(db, request.application_id)
    job = get_job_by_id(db, application.job_id)
    user = get_user_by_id(db, application.user_id)
    
    job_description = create_job_description_data(job)
    candidate = create_candidate_data(user, application)
    
    return score_application_with_data(
        db, request.application_id, job_description, candidate, 
        request.rules_config, request.chat_answers
    )


@router.get("/config")
async def get_scoring_config():
    return get_scoring_config_data()



@router.post("/custom-score")
async def custom_score(
    job_description: Dict,
    candidate: Dict, 
    rules_config: Dict[str, str],
    chat_answers: List[Dict] = [],
    config: Optional[Dict] = None
):
    return score_application_custom(job_description, candidate, rules_config, chat_answers, config)



@router.get("/recruiter/dashboard")
async def get_recruiter_dashboard(
    job_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return get_recruiter_dashboard_data(db, job_id, limit)


@router.get("/recruiter/application/{application_id}")
async def get_application_scoring_details(
    application_id: int,
    db: Session = Depends(get_db)
):
    return get_application_scoring_details_data(db, application_id)


@router.get("/recruiter/application/{application_id}/summary")
async def get_application_scoring_summary(
    application_id: int,
    db: Session = Depends(get_db)
):
    return get_application_scoring_summary_data(db, application_id)


@router.get("/recruiter/insights")
async def get_scoring_insights(
    job_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return get_scoring_insights_data(db, job_id)
