from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List, Dict
from models import Applications, ApplicationStatus, Jobs, Users
from core.scoring import ScoringEngine, ScoringConfig, CriterionCategory
from core.scoring_db import save_scoring_result, get_scoring_result, get_scoring_summary_for_recruiter, get_applications_with_scores
from api.schemas import ScoringRequest, CriterionResultResponse, AnswerJudgmentResponse, ScoringResponse

APPLICATION_NOT_FOUND_MSG = "Application not found"
JOB_NOT_FOUND_MSG = "Job not found"
USER_NOT_FOUND_MSG = "User not found"

def get_application_by_id(db: Session, application_id: int) -> Applications:
    application = db.query(Applications).filter(Applications.application_id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail=APPLICATION_NOT_FOUND_MSG)
    return application

def get_job_by_id(db: Session, job_id: int) -> Jobs:
    job = db.query(Jobs).filter(Jobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND_MSG)
    return job

def get_user_by_id(db: Session, user_id: int) -> Users:
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
    return user

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
        "education": "Bachelor's"
    }

def create_candidate_data(user: Users, application: Applications) -> dict:
    return {
        "name": user.full_name,
        "email": user.email,
        "location": user.location or "",
        "bio": user.bio or "",
        "cv": application.cv or "",
        "cover_letter": application.cover_letter or "",
        "years_experience": 3,
        "skills": [],
        "employment_type": "full_time",
        "salary_expectation": 0,
        "education": "Bachelor's"
    }

def convert_rules_config(rules_config: Dict[str, str]) -> Dict[str, CriterionCategory]:
    return {
        key: CriterionCategory(value) 
        for key, value in rules_config.items()
    }

def update_application_status(application: Applications, decision: str):
    if decision == "REJECT":
        application.application_status = ApplicationStatus.rejected
    elif decision == "PASS":
        application.application_status = ApplicationStatus.shortlisted

def create_scoring_response(report) -> ScoringResponse:
    return ScoringResponse(
        primary_score=report.primary_score,
        secondary_score=report.secondary_score,
        final_score=report.final_score,
        decision=report.decision,
        fail_reason=report.fail_reason,
        primary_breakdown=[
            CriterionResultResponse(
                name=r.name,
                category=r.category.value,
                weight=r.weight,
                passed=r.passed,
                points_awarded=r.points_awarded,
                notes=r.notes
            )
            for r in report.primary_breakdown
        ],
        secondary_judgments=[
            AnswerJudgmentResponse(
                question_id=j.question_id,
                category=j.category.value,
                rationale=j.rationale
            )
            for j in report.secondary_judgments
        ],
        summary=report.summary
    )

def score_application_with_data(db: Session, application_id: int, job_description: dict, candidate: dict, rules_config: Dict[str, str], chat_answers: List[Dict]) -> ScoringResponse:
    application = get_application_by_id(db, application_id)
    
    rules_config_enum = convert_rules_config(rules_config)
    engine = ScoringEngine()
    
    report = engine.score_candidate(
        job_description,
        candidate,
        rules_config_enum,
        chat_answers
    )
    
    scoring_id = save_scoring_result(
        db, application.application_id, report, rules_config, None
    )
    
    application.score = report.final_score
    update_application_status(application, report.decision)
    
    db.commit()
    
    return create_scoring_response(report)

def score_application_custom(job_description: Dict, candidate: Dict, rules_config: Dict[str, str], chat_answers: List[Dict] = [], config: Optional[Dict] = None) -> dict:
    rules_config_enum = convert_rules_config(rules_config)
    
    scoring_config = None
    if config:
        scoring_config = ScoringConfig(
            weights=config.get("weights"),
            experience_tolerance=config.get("experience_tolerance", 1.0),
            salary_soft_overage=config.get("salary_soft_overage", 0.1),
            pass_threshold=config.get("pass_threshold", 70.0)
        )
    
    engine = ScoringEngine(scoring_config)
    
    report = engine.score_candidate(
        job_description,
        candidate,
        rules_config_enum,
        chat_answers
    )
    
    return {
        "primary_score": report.primary_score,
        "secondary_score": report.secondary_score,
        "final_score": report.final_score,
        "decision": report.decision,
        "fail_reason": report.fail_reason,
        "primary_breakdown": [
            {
                "name": r.name,
                "category": r.category.value,
                "weight": r.weight,
                "passed": r.passed,
                "points_awarded": r.points_awarded,
                "notes": r.notes
            }
            for r in report.primary_breakdown
        ],
        "secondary_judgments": [
            {
                "question_id": j.question_id,
                "category": j.category.value,
                "rationale": j.rationale
            }
            for j in report.secondary_judgments
        ],
        "summary": report.summary
    }

def get_scoring_config_data() -> dict:
    config = ScoringConfig()
    
    return {
        "default_weights": config.weights,
        "experience_tolerance": config.experience_tolerance,
        "salary_soft_overage": config.salary_soft_overage,
        "pass_threshold": config.pass_threshold,
        "primary_weight": config.primary_weight,
        "secondary_weight": config.secondary_weight,
        "available_categories": [cat.value for cat in CriterionCategory],
        "example_rules_config": {
            "years_experience": "YES",
            "required_skills": "YES", 
            "employment_type": "YES",
            "location_relocation": "PREFERABLE",
            "education": "PREFERABLE",
            "salary_range": "PREFERABLE",
            "criminal_background": "HARD_NO"
        }
    }

def get_recruiter_dashboard_data(db: Session, job_id: Optional[int] = None, limit: int = 50) -> dict:
    applications = get_applications_with_scores(db, job_id, limit)
    
    return {
        "applications": applications,
        "total_count": len(applications),
        "summary": {
            "passed": len([app for app in applications if app.get("scoring", {}).get("overview", {}).get("decision") == "PASS"]),
            "rejected": len([app for app in applications if app.get("scoring", {}).get("overview", {}).get("decision") == "REJECT"]),
            "average_score": sum([app.get("scoring", {}).get("overview", {}).get("final_score", 0) for app in applications]) / len(applications) if applications else 0
        }
    }

def get_application_scoring_details_data(db: Session, application_id: int) -> dict:
    application = get_application_by_id(db, application_id)
    job = get_job_by_id(db, application.job_id)
    candidate = get_user_by_id(db, application.user_id)
    
    scoring_details = get_scoring_result(db, application_id)
    
    if not scoring_details:
        raise HTTPException(status_code=404, detail="No scoring results found for this application")
    
    return {
        "application": {
            "application_id": application.application_id,
            "status": application.application_status.value,
            "applied_at": application.created_at.isoformat() if application.created_at else None
        },
        "job": {
            "job_id": job.job_id,
            "title": job.title,
            "company": job.company,
            "description": job.description
        },
        "candidate": {
            "user_id": candidate.user_id,
            "name": candidate.full_name,
            "email": candidate.email,
            "location": candidate.location,
            "bio": candidate.bio
        },
        "scoring": scoring_details
    }

def get_application_scoring_summary_data(db: Session, application_id: int) -> dict:
    application = get_application_by_id(db, application_id)
    summary = get_scoring_summary_for_recruiter(db, application_id)
    
    if not summary:
        raise HTTPException(status_code=404, detail="No scoring results found for this application")
    
    return summary

def get_scoring_insights_data(db: Session, job_id: Optional[int] = None) -> dict:
    applications = get_applications_with_scores(db, job_id, 100)
    
    if not applications:
        return {"message": "No applications found"}
    
    all_scores = [app.get("scoring", {}).get("overview", {}).get("final_score", 0) for app in applications if app.get("scoring")]
    passed_applications = [app for app in applications if app.get("scoring", {}).get("overview", {}).get("decision") == "PASS"]
    rejected_applications = [app for app in applications if app.get("scoring", {}).get("overview", {}).get("decision") == "REJECT"]
    
    all_breakdowns = []
    for app in applications:
        if app.get("scoring", {}).get("detailed_breakdown"):
            all_breakdowns.extend(app["scoring"]["detailed_breakdown"])
    
    deduction_patterns = {}
    for breakdown in all_breakdowns:
        if breakdown.get("points_missed", 0) > 0:
            criterion = breakdown["criterion_name"]
            if criterion not in deduction_patterns:
                deduction_patterns[criterion] = {"count": 0, "total_missed": 0}
            deduction_patterns[criterion]["count"] += 1
            deduction_patterns[criterion]["total_missed"] += breakdown["points_missed"]
    
    common_deductions = sorted(
        deduction_patterns.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )[:5]
    
    return {
        "overview": {
            "total_applications": len(applications),
            "passed": len(passed_applications),
            "rejected": len(rejected_applications),
            "pass_rate": len(passed_applications) / len(applications) * 100 if applications else 0,
            "average_score": sum(all_scores) / len(all_scores) if all_scores else 0,
            "score_distribution": {
                "excellent": len([s for s in all_scores if s >= 90]),
                "good": len([s for s in all_scores if 80 <= s < 90]),
                "fair": len([s for s in all_scores if 70 <= s < 80]),
                "poor": len([s for s in all_scores if s < 70])
            }
        },
        "common_issues": [
            {
                "criterion": criterion,
                "frequency": data["count"],
                "average_points_missed": data["total_missed"] / data["count"]
            }
            for criterion, data in common_deductions
        ],
        "recommendations": [
            "Consider adjusting job requirements if certain skills are consistently missing",
            "Review scoring criteria if pass rate is too low",
            "Focus on training programs for common skill gaps"
        ]
    }
