from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models import Applications, ApplicationStatus, Jobs, ChatSessions, ChatMessages, MessageType, Users
from typing import Optional, List
from pydantic import BaseModel
from core.db import get_db
from core.scoring_db import get_scoring_summary_for_recruiter, get_scoring_result
from api.schemas import ApplicationCreate, ApplicationWithText, ApplicationResponse, ApplicationDetailsResponse, ChatMessageResponse
from services import (
    get_job_by_id, get_user_by_id, get_application_by_id,
    get_chat_sessions_for_application, get_messages_for_session,
    format_chat_message_response, extract_pdf_text_content,
    auto_score_application, get_application_discrepancies,
    create_job_description_data, create_candidate_data
)
import json
from functools import wraps

router = APIRouter(prefix="/applications")

PDF_FILE_EXTENSION = ".pdf"
PDF_ONLY_ERROR_MSG = "Only PDF files are allowed"
NO_CHAT_HISTORY_MSG = "No chat history found for this application"
NO_SCORING_DATA_MSG = "No scoring data available for this application"
NO_DETAILED_SCORING_MSG = "No detailed scoring data available for this application"
SCORING_FAILED_MSG = "Failed to score application"

def handle_http_exceptions(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error in {func.__name__}: {str(e)}")
    return wrapper



@router.post("/create", response_model=ApplicationResponse)
async def create_application(
    application_data: ApplicationCreate, 
    db: Session = Depends(get_db)
):
    new_application = Applications(
        job_id=application_data.job_id,
        user_id=application_data.user_id,
        cv=application_data.cv,
        cover_letter=application_data.cover_letter,
        application_status=ApplicationStatus.submitted
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    job = get_job_by_id(db, application_data.job_id)
    user = get_user_by_id(db, application_data.user_id)
    
    job_description = create_job_description_data(job)
    candidate = create_candidate_data(user, new_application)
    
    scoring_result = auto_score_application(db, new_application.application_id, job_description, candidate)
    if scoring_result:
        print(f"Application auto-scored: {scoring_result['final_score']} - {scoring_result['decision']}")
    
    # Refresh the application to get the updated score
    db.refresh(new_application)
    
    return new_application

@router.get("/fetch_all", response_model=List[ApplicationResponse])
async def fetch_applications(db: Session = Depends(get_db)):
    applications = db.query(Applications).order_by(Applications.created_at.desc()).all()
    return applications

@router.get("/by_job/{job_id}", response_model=List[ApplicationResponse])
async def fetch_applications_by_job(job_id: int, db: Session = Depends(get_db)):
    print(f"Fetching applications for job_id: {job_id}")
    applications = db.query(Applications).filter(Applications.job_id == job_id).order_by(Applications.created_at.desc()).all()
    print(f"Found {len(applications)} applications for job {job_id}")
    return applications

@router.get("/by_job/{job_id}/filtered", response_model=List[ApplicationResponse])
async def fetch_applications_by_job_filtered(
    job_id: int,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    recommended_only: bool = False,
    db: Session = Depends(get_db)
):
    print(f"Fetching filtered applications for job_id: {job_id}")
    query = db.query(Applications).filter(Applications.job_id == job_id)
    
    if recommended_only:
        query = query.filter(Applications.score >= 80.0)
    elif min_score is not None:
        query = query.filter(Applications.score >= min_score)
    
    if max_score is not None:
        query = query.filter(Applications.score <= max_score)
    
    query = query.order_by(Applications.score.desc().nulls_last())
    
    applications = query.all()
    print(f"Found {len(applications)} filtered applications for job {job_id}")
    return applications

@router.get("/by_recruiter/{recruiter_id}", response_model=List[ApplicationResponse])
async def fetch_applications_by_recruiter(recruiter_id: int, db: Session = Depends(get_db)):
    applications = db.query(Applications).join(Jobs).filter(Jobs.poster_id == recruiter_id).order_by(Applications.created_at.desc()).all()
    return applications

@router.get("/by_recruiter/{recruiter_id}/filtered", response_model=List[ApplicationResponse])
async def fetch_applications_by_recruiter_filtered(
    recruiter_id: int, 
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    recommended_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Applications).join(Jobs).filter(Jobs.poster_id == recruiter_id)
    
    if recommended_only:
        query = query.filter(Applications.score >= 80.0)
    elif min_score is not None:
        query = query.filter(Applications.score >= min_score)
    
    if max_score is not None:
        query = query.filter(Applications.score <= max_score)
    
    query = query.order_by(Applications.score.desc().nulls_last())
    
    applications = query.all()
    return applications

@router.post("/apply_with_text")
async def apply_with_text(
    application_data: ApplicationWithText, 
    db: Session = Depends(get_db)
):
    print(f"Creating application for job_id: {application_data.job_id}, user_id: {application_data.user_id}")
    
    job = get_job_by_id(db, application_data.job_id)
    print(f"Found job: {job.title} by recruiter {job.poster_id}")
    
    new_application = Applications(
        job_id=application_data.job_id,
        user_id=application_data.user_id or 1,
        cv=application_data.cv,
        cover_letter=application_data.cover_letter,
        application_status=ApplicationStatus.submitted
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    print(f"Created application with ID: {new_application.application_id}")
    
    job_description = create_job_description_data(job)
    candidate = create_candidate_data(
        get_user_by_id(db, application_data.user_id or 1), 
        new_application
    )
    
    scoring_result = auto_score_application(db, new_application.application_id, job_description, candidate)
    if scoring_result:
        print(f"Application auto-scored: {scoring_result['final_score']} - {scoring_result['decision']}")
    
    return {
        "application_id": new_application.application_id,
        "message": "Application submitted successfully. AI interview will start automatically.",
        "interview_ready": True,
        "scoring_completed": scoring_result is not None,
        "websocket_url": f"ws://localhost:8000/api/chat?applicationId={new_application.application_id}&userId={new_application.user_id}"
    }

@router.post("/{application_id}/start_interview")
@handle_http_exceptions
async def start_ai_interview(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    job = get_job_by_id(db, application.job_id)
    user = get_user_by_id(db, application.user_id)
    
    return {
        "application_id": application_id,
        "user_id": application.user_id,
        "job_title": job.title,
        "company": job.company,
        "interview_ready": True,
        "websocket_url": f"ws://localhost:8000/api/chat?applicationId={application_id}&userId={application.user_id}"
    }

@router.get("/{application_id}/details", response_model=ApplicationDetailsResponse)
@handle_http_exceptions
async def get_application_details(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    
    print(f"Found application: {application.application_id} for job {application.job_id}")
    
    print(f"Looking for chat sessions for application_id: {application_id}")
    
    all_sessions = db.query(ChatSessions).all()
    print(f"Total chat sessions in database: {len(all_sessions)}")
    for session in all_sessions:
        print(f"Session {session.session_id}: user_id={session.user_id}, application_id={session.application_id}")
    
    chat_sessions = get_chat_sessions_for_application(db, application_id)
    print(f"Found {len(chat_sessions)} chat sessions for application {application_id}")
    
    chat_messages = []
    for session in chat_sessions:
        messages = get_messages_for_session(db, session.session_id)
        
        print(f"Found {len(messages)} messages for session {session.session_id}")
        
        for msg in messages:
            chat_messages.append(ChatMessageResponse(
                message_id=msg.message_id,
                message_type=msg.message_type.value,
                content=msg.content,
                question_id=msg.question_id,
                created_at=msg.created_at.isoformat()
            ))
    
    print(f"Total chat messages for application {application_id}: {len(chat_messages)}")
    
    discrepancies = get_application_discrepancies(db, application_id)
    
    return ApplicationDetailsResponse(
        application=ApplicationResponse.from_orm(application),
        chat_history=chat_messages,
        discrepancies=discrepancies if discrepancies else None
    )


@router.get("/{application_id}/chat-history")
@handle_http_exceptions
async def get_application_chat_history(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    
    chat_sessions = db.query(ChatSessions).filter(
        ChatSessions.application_id == application_id
    ).order_by(ChatSessions.created_at.desc()).all()
    
    if not chat_sessions:
        return {
            "application_id": application_id,
            "message": NO_CHAT_HISTORY_MSG,
            "chat_sessions": [],
            "total_messages": 0
        }
    
    all_messages = []
    for session in chat_sessions:
        messages = get_messages_for_session(db, session.session_id)
        
        session_messages = []
        for msg in messages:
            session_messages.append({
                "message_id": msg.message_id,
                "message_type": msg.message_type.value,
                "content": msg.content,
                "question_id": msg.question_id,
                "created_at": msg.created_at.isoformat(),
                "metadata": json.loads(msg.message_metadata) if msg.message_metadata else None
            })
            all_messages.append(session_messages[-1])
        
        session_data = {
            "session_id": session.session_id,
            "session_title": session.session_title,
            "created_at": session.created_at.isoformat(),
            "is_active": session.is_active,
            "message_count": len(session_messages),
            "messages": session_messages
        }
    
    return {
        "application_id": application_id,
        "total_sessions": len(chat_sessions),
        "total_messages": len(all_messages),
        "chat_sessions": [{
            "session_id": session.session_id,
            "session_title": session.session_title,
            "created_at": session.created_at.isoformat(),
            "is_active": session.is_active,
            "message_count": len([m for m in all_messages if m.get("session_id") == session.session_id])
        } for session in chat_sessions],
        "all_messages": all_messages
    }


@router.get("/recruiter/{recruiter_id}/applications-with-chat")
@handle_http_exceptions
async def get_recruiter_applications_with_chat(recruiter_id: int, db: Session = Depends(get_db)):
    applications = db.query(Applications).join(Jobs).filter(
        Jobs.poster_id == recruiter_id
    ).all()
    
    applications_with_chat = []
    for app in applications:
        chat_sessions = get_chat_sessions_for_application(db, app.application_id)
        
        total_messages = 0
        for session in chat_sessions:
            message_count = db.query(ChatMessages).filter(
                ChatMessages.session_id == session.session_id
            ).count()
            total_messages += message_count
        
        latest_chat_activity = None
        if chat_sessions:
            latest_session = max(chat_sessions, key=lambda s: s.created_at)
            latest_message = db.query(ChatMessages).filter(
                ChatMessages.session_id == latest_session.session_id
            ).order_by(ChatMessages.created_at.desc()).first()
            
            if latest_message:
                latest_chat_activity = {
                    "last_message_at": latest_message.created_at.isoformat(),
                    "last_message_type": latest_message.message_type.value,
                    "last_message_preview": latest_message.content[:100] + "..." if len(latest_message.content) > 100 else latest_message.content
                }
        
        applications_with_chat.append({
            "application_id": app.application_id,
            "job_id": app.job_id,
            "user_id": app.user_id,
            "application_status": app.application_status.value,
            "score": app.score,
            "created_at": app.created_at.isoformat(),
            "chat_summary": {
                "total_sessions": len(chat_sessions),
                "total_messages": total_messages,
                "has_chat_history": total_messages > 0,
                "latest_activity": latest_chat_activity
            }
        })
    
    return {
        "recruiter_id": recruiter_id,
        "total_applications": len(applications),
        "applications_with_chat": applications_with_chat
    }

@router.post("/upload_cv")
@handle_http_exceptions
async def upload_cv(
    application_id: int = Form(...),
    cv: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not cv.filename.lower().endswith(PDF_FILE_EXTENSION):
        raise HTTPException(status_code=400, detail=PDF_ONLY_ERROR_MSG)
    
    application = get_application_by_id(db, application_id)
    
    pdf_content = await cv.read()
    
    extracted_text = extract_pdf_text_content(pdf_content)
    
    application.cv = extracted_text
    db.commit()
    
    return {
        "ok": True,
        "extracted_text": extracted_text,
        "message": "PDF processed successfully"
    }

@router.post("/extract_pdf_text")
@handle_http_exceptions
async def extract_pdf_text(cv: UploadFile = File(...)):
    if not cv.filename.lower().endswith(PDF_FILE_EXTENSION):
        raise HTTPException(status_code=400, detail=PDF_ONLY_ERROR_MSG)
    
    pdf_content = await cv.read()
    
    extracted_text = extract_pdf_text_content(pdf_content)
    
    return {
        "ok": True,
        "extracted_text": extracted_text,
        "message": "PDF processed successfully"
    }

@router.get("/{application_id}/scoring")
@handle_http_exceptions
async def get_application_scoring(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    
    scoring_summary = get_scoring_summary_for_recruiter(db, application_id)
    
    if not scoring_summary:
        return {
            "application_id": application_id,
            "message": NO_SCORING_DATA_MSG,
            "scoring": None
        }
    
    return {
        "application_id": application_id,
        "scoring": scoring_summary
    }

@router.get("/{application_id}/scoring/detailed")
@handle_http_exceptions
async def get_detailed_scoring(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    
    scoring_result = get_scoring_result(db, application_id)
    
    if not scoring_result:
        return {
            "application_id": application_id,
            "message": NO_DETAILED_SCORING_MSG,
            "scoring": None
        }
    
    return {
        "application_id": application_id,
        "scoring": scoring_result
    }

@router.post("/{application_id}/score")
@handle_http_exceptions
async def manual_score_application(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    
    # Get job and user data for scoring
    job = get_job_by_id(db, application.job_id)
    user = get_user_by_id(db, application.user_id)
    
    # Create job description and candidate data
    job_description = create_job_description_data(job)
    candidate = create_candidate_data(user, application)
    
    scoring_result = auto_score_application(db, application_id, job_description, candidate)
    
    if not scoring_result:
        raise HTTPException(status_code=500, detail=SCORING_FAILED_MSG)
    
    return {
        "application_id": application_id,
        "message": "Application scored successfully",
        "scoring_result": scoring_result
    }