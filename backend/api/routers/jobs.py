from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Users
from typing import Optional, List
from core.db import get_db
from core.auth import get_current_user, get_current_user_optional
from api.schemas import JobCreate, JobResponse
from services import get_job_by_id, get_jobs_by_poster, get_active_jobs, create_job


router = APIRouter(prefix="/jobs")


@router.post("/create", response_model=JobResponse)
async def create_job_endpoint(job_data: JobCreate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    new_job = create_job(db, job_data, current_user.user_id)
    return new_job.to_dict()

@router.get("/fetch_by_id/{job_id}", response_model=JobResponse)
async def fetch_job(job_id: int, db: Session = Depends(get_db)):
    job = get_job_by_id(db, job_id)
    return job.to_dict()

@router.get("/fetch_all", response_model=List[JobResponse])
async def fetch_jobs(db: Session = Depends(get_db), current_user: Optional[Users] = Depends(get_current_user_optional)):
    if current_user and current_user.user_role.value == "recruiter":
        # Recruiters see only their own jobs
        jobs = get_jobs_by_poster(db, current_user.user_id)
    else:
        # Candidates and non-authenticated users see all active jobs
        jobs = get_active_jobs(db)
    
    return [job.to_dict() for job in jobs]

@router.get("/fetch_by_recruiter/{recruiter_id}", response_model=List[JobResponse])
async def fetch_jobs_by_recruiter(recruiter_id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    if current_user.user_id != recruiter_id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. You can only view your own jobs."
        )
    
    jobs = get_jobs_by_poster(db, recruiter_id)
    return [job.to_dict() for job in jobs]
