from sqlalchemy.orm import Session
from models import Jobs, EmploymentType, WorkFormat
from fastapi import HTTPException
from typing import Optional, List
from api.schemas import JobCreate

JOB_NOT_FOUND_MSG = "Job not found"

def get_job_by_id(db: Session, job_id: int) -> Jobs:
    job = db.query(Jobs).filter(Jobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND_MSG)
    return job

def get_jobs_by_poster(db: Session, poster_id: int):
    return db.query(Jobs).filter(Jobs.poster_id == poster_id).order_by(Jobs.created_at.desc()).all()

def get_active_jobs(db: Session):
    return db.query(Jobs).filter(Jobs.is_active == True).order_by(Jobs.created_at.desc()).all()

def create_job(db: Session, job_data: JobCreate, poster_id: int) -> Jobs:
    employment_type_enum = None
    if job_data.employment_type:
        employment_type_enum = EmploymentType(job_data.employment_type)
    
    work_format_enum = None
    if job_data.work_format:
        work_format_enum = WorkFormat(job_data.work_format)
    
    new_job = Jobs(
        title=job_data.title,
        company=job_data.company,
        description=job_data.description,
        min_salary=job_data.min_salary,
        max_salary=job_data.max_salary,
        desired_location=job_data.desired_location,
        desired_skills=job_data.desired_skills or [],
        employment_type=employment_type_enum,
        work_format=work_format_enum,
        poster_id=poster_id, 
        is_active=job_data.is_active
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job

def create_job_description_data(job: Jobs) -> dict:
    return {
        "title": job.title,
        "company": job.company,
        "description": job.description or "",
        "years_experience": 5,
        "required_skills": job.desired_skills or [],
        "employment_type": job.employment_type.value if job.employment_type else "full_time",
        "salary_range": {"max": job.max_salary} if job.max_salary else {"max": 0},
        "location": job.desired_location or "",
    }
