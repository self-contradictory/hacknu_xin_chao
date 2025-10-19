from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from models import ScoringResults, ScoringBreakdown, ScoringJudgments, Applications, Jobs, Users
from core.scoring import ScoreReport, ScoringConfig
import json


def save_scoring_result(
    db: Session,
    application_id: int,
    report: ScoreReport,
    rules_config: Dict[str, str],
    scoring_config: Optional[ScoringConfig] = None
) -> int:
    
    scoring_result = ScoringResults(
        application_id=application_id,
        primary_score=report.primary_score,
        secondary_score=report.secondary_score,
        final_score=report.final_score,
        decision=report.decision,
        fail_reason=report.fail_reason,
        summary=report.summary,
        rules_config=json.dumps(rules_config),
        scoring_config=json.dumps(scoring_config.__dict__) if scoring_config else None
    )
    
    db.add(scoring_result)
    db.flush()  
    
    for criterion in report.primary_breakdown:
        breakdown = ScoringBreakdown(
            scoring_id=scoring_result.scoring_id,
            criterion_name=criterion.name,
            category=criterion.category.value,
            weight=criterion.weight,
            passed=criterion.passed,
            points_awarded=criterion.points_awarded,
            notes=criterion.notes
        )
        db.add(breakdown)
    
    # Save secondary judgments
    for judgment in report.secondary_judgments:
        judgment_record = ScoringJudgments(
            scoring_id=scoring_result.scoring_id,
            question_id=judgment.question_id,
            category=judgment.category.value,
            rationale=judgment.rationale
        )
        db.add(judgment_record)
    
    db.commit()
    return scoring_result.scoring_id


def get_scoring_result(db: Session, application_id: int) -> Optional[Dict[str, Any]]:
 
    scoring_result = db.query(ScoringResults).filter(
        ScoringResults.application_id == application_id
    ).order_by(ScoringResults.created_at.desc()).first()
    
    if not scoring_result:
        return None
    
    breakdown_records = db.query(ScoringBreakdown).filter(
        ScoringBreakdown.scoring_id == scoring_result.scoring_id
    ).all()
    
    judgment_records = db.query(ScoringJudgments).filter(
        ScoringJudgments.scoring_id == scoring_result.scoring_id
    ).all()
    
    result = {
        "scoring_id": scoring_result.scoring_id,
        "application_id": scoring_result.application_id,
        "scores": {
            "primary_score": scoring_result.primary_score,
            "secondary_score": scoring_result.secondary_score,
            "final_score": scoring_result.final_score
        },
        "decision": {
            "outcome": scoring_result.decision,
            "fail_reason": scoring_result.fail_reason,
            "summary": scoring_result.summary
        },
        "primary_breakdown": [
            {
                "criterion_name": b.criterion_name,
                "category": b.category,
                "weight": b.weight,
                "passed": b.passed,
                "points_awarded": b.points_awarded,
                "points_missed": b.weight - b.points_awarded,
                "notes": b.notes,
                "score_percentage": (b.points_awarded / b.weight * 100) if b.weight > 0 else 0
            }
            for b in breakdown_records
        ],
        "secondary_judgments": [
            {
                "question_id": j.question_id,
                "category": j.category,
                "rationale": j.rationale
            }
            for j in judgment_records
        ],
        "configuration": {
            "rules_config": json.loads(scoring_result.rules_config) if scoring_result.rules_config else {},
            "scoring_config": json.loads(scoring_result.scoring_config) if scoring_result.scoring_config else {}
        },
        "created_at": scoring_result.created_at.isoformat() if scoring_result.created_at else None
    }
    
    return result


def get_scoring_summary_for_recruiter(db: Session, application_id: int) -> Optional[Dict[str, Any]]:

    result = get_scoring_result(db, application_id)
    if not result:
        return None
    
    total_possible_points = sum(criterion["weight"] for criterion in result["primary_breakdown"])
    total_awarded_points = sum(criterion["points_awarded"] for criterion in result["primary_breakdown"])
    total_missed_points = total_possible_points - total_awarded_points
    
    major_deductions = [
        criterion for criterion in result["primary_breakdown"] 
        if criterion["points_missed"] > 0 and criterion["category"] == "YES"
    ]
    
    concerns = [
        criterion for criterion in result["primary_breakdown"] 
        if criterion["points_missed"] > 0
    ]
    
    strengths = [
        criterion for criterion in result["primary_breakdown"] 
        if criterion["points_awarded"] == criterion["weight"] and criterion["weight"] > 0
    ]
    
    secondary_yes = len([j for j in result["secondary_judgments"] if j["category"] == "YES"])
    secondary_preferable = len([j for j in result["secondary_judgments"] if j["category"] == "PREFERABLE"])
    secondary_hard_no = len([j for j in result["secondary_judgments"] if j["category"] == "HARD_NO"])
    
    summary = {
        "overview": {
            "final_score": result["scores"]["final_score"],
            "decision": result["decision"]["outcome"],
            "primary_score": result["scores"]["primary_score"],
            "secondary_score": result["scores"]["secondary_score"]
        },
        "score_breakdown": {
            "total_possible": total_possible_points,
            "total_awarded": total_awarded_points,
            "total_missed": total_missed_points,
            "score_percentage": (total_awarded_points / total_possible_points * 100) if total_possible_points > 0 else 0
        },
        "key_insights": {
            "major_deductions": [
                {
                    "criterion": d["criterion_name"],
                    "points_missed": d["points_missed"],
                    "reason": d["notes"]
                }
                for d in major_deductions
            ],
            "areas_of_concern": [
                {
                    "criterion": c["criterion_name"],
                    "category": c["category"],
                    "points_missed": c["points_missed"],
                    "reason": c["notes"]
                }
                for c in concerns
            ],
            "strengths": [
                {
                    "criterion": s["criterion_name"],
                    "category": s["category"],
                    "points_awarded": s["points_awarded"]
                }
                for s in strengths
            ]
        },
        "secondary_assessment": {
            "total_questions": len(result["secondary_judgments"]),
            "yes_responses": secondary_yes,
            "preferable_responses": secondary_preferable,
            "hard_no_responses": secondary_hard_no,
            "response_quality": "Strong" if secondary_yes > secondary_preferable else "Mixed" if secondary_preferable > 0 else "Concerning"
        },
        "recommendations": _generate_recommendations(result, major_deductions, concerns),
        "detailed_breakdown": result["primary_breakdown"],
        "secondary_details": result["secondary_judgments"]
    }
    
    return summary


def _generate_recommendations(result: Dict, major_deductions: List, concerns: List) -> List[str]:
    
    recommendations = []
    
    if result["decision"]["outcome"] == "REJECT":
        if result["scores"]["final_score"] < 50:
            recommendations.append("Strong rejection - candidate significantly below requirements")
        elif result["scores"]["final_score"] < 70:
            recommendations.append("Borderline candidate - consider if specific skills can be developed")
    
    for deduction in major_deductions:
        if deduction["criterion_name"] == "years_experience":
            recommendations.append("Consider if candidate's potential can compensate for experience gap")
        elif deduction["criterion_name"] == "required_skills":
            recommendations.append("Evaluate if missing skills can be learned on the job")
        elif deduction["criterion_name"] == "employment_type":
            recommendations.append("Verify candidate's availability and commitment to role type")
    
    secondary_hard_no = len([j for j in result["secondary_judgments"] if j["category"] == "HARD_NO"])
    if secondary_hard_no > 0:
        recommendations.append("Review secondary assessment - some concerning responses noted")
    
    if result["scores"]["primary_score"] > 80 and result["scores"]["secondary_score"] < 60:
        recommendations.append("Strong technical fit but communication concerns - consider interview")
    elif result["scores"]["primary_score"] < 60 and result["scores"]["secondary_score"] > 80:
        recommendations.append("Good communication but technical gaps - consider training plan")
    
    return recommendations


def get_applications_with_scores(db: Session, job_id: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:

    
    query = db.query(Applications).join(Users).join(Jobs)
    
    if job_id:
        query = query.filter(Applications.job_id == job_id)
    
    applications = query.order_by(Applications.created_at.desc()).limit(limit).all()
    
    results = []
    for app in applications:
        scoring_summary = get_scoring_summary_for_recruiter(db, app.application_id)
        
        results.append({
            "application_id": app.application_id,
            "job_title": app.job.title,
            "company": app.job.company,
            "candidate_name": app.applicant.full_name,
            "candidate_email": app.applicant.email,
            "application_status": app.application_status.value,
            "applied_at": app.created_at.isoformat() if app.created_at else None,
            "scoring": scoring_summary
        })
    
    return results
