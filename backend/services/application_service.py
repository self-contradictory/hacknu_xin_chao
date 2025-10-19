from sqlalchemy.orm import Session
from models import Applications, ApplicationStatus, ChatSessions, ChatMessages, MessageType
from fastapi import HTTPException
from core.scoring import ScoringEngine, CriterionCategory
from core.scoring_db import save_scoring_result
import json
import PyPDF2
import pdfplumber
import io

APPLICATION_NOT_FOUND_MSG = "Application not found"
NO_CHAT_HISTORY_MSG = "No chat history found for this application"
PDF_FILE_EXTENSION = ".pdf"
PDF_EXTRACTION_ERROR_MSG = "Could not extract text from PDF. The PDF might be image-based or corrupted."
PDF_ONLY_ERROR_MSG = "Only PDF files are allowed"

DEFAULT_SCORING_RULES = {
    "location_relocation": "PREFERABLE",
    "years_experience": "YES", 
    "core_title_role": "YES",
    "education": "PREFERABLE",
    "languages": "PREFERABLE",
    "employment_type": "YES",
    "salary_range": "YES",
    "required_skills": "YES"
}

def get_application_by_id(db: Session, application_id: int) -> Applications:
    application = db.query(Applications).filter(Applications.application_id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail=APPLICATION_NOT_FOUND_MSG)
    return application

def get_chat_sessions_for_application(db: Session, application_id: int) -> list[ChatSessions]:
    return db.query(ChatSessions).filter(
        ChatSessions.application_id == application_id
    ).all()

def get_messages_for_session(db: Session, session_id: int) -> list[ChatMessages]:
    return db.query(ChatMessages).filter(
        ChatMessages.session_id == session_id
    ).order_by(ChatMessages.created_at.asc()).all()

def format_chat_message_response(msg: ChatMessages):
    return {
        "message_id": msg.message_id,
        "message_type": msg.message_type.value,
        "content": msg.content,
        "question_id": msg.question_id,
        "created_at": msg.created_at.isoformat()
    }

def extract_pdf_text_content(pdf_content: bytes) -> str:
    extracted_text = ""
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}")
    
    if not extracted_text.strip():
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail=PDF_EXTRACTION_ERROR_MSG)
    
    return extracted_text.strip()

def update_application_status(application: Applications, decision: str):
    if decision == "REJECT":
        application.application_status = ApplicationStatus.rejected
    elif decision == "PASS":
        application.application_status = ApplicationStatus.shortlisted

def auto_score_application(db: Session, application_id: int, job_description: dict, candidate: dict):
    try:
        application = get_application_by_id(db, application_id)
        
        rules_config = {
            key: CriterionCategory(value) 
            for key, value in DEFAULT_SCORING_RULES.items()
        }
        
        engine = ScoringEngine()
        
        report = engine.score_candidate(
            job_description,
            candidate,
            rules_config,
            []
        )
        
        scoring_id = save_scoring_result(
            db, application.application_id, report, DEFAULT_SCORING_RULES, None
        )
        
        application.score = report.final_score
        update_application_status(application, report.decision)
        
        db.commit()
        
        return {
            "scoring_id": scoring_id,
            "final_score": report.final_score,
            "decision": report.decision,
            "summary": report.summary
        }
        
    except Exception as e:
        print(f"Error in auto scoring: {e}")
        return None

def get_application_discrepancies(db: Session, application_id: int) -> list[str]:
    chat_sessions = get_chat_sessions_for_application(db, application_id)
    discrepancies = []
    
    for session in chat_sessions:
        messages = get_messages_for_session(db, session.session_id)
        
        for msg in messages:
            if msg.message_metadata:
                try:
                    metadata = json.loads(msg.message_metadata)
                    if 'discrepancies' in metadata:
                        discrepancies.extend(metadata['discrepancies'])
                except json.JSONDecodeError:
                    pass
            
            if msg.message_type == MessageType.question and msg.content:
                if any(keyword in msg.content.lower() for keyword in [
                    "discrepancy", "mismatch", "gap", "difference", "concern", 
                    "experience", "skills", "qualification", "requirement"
                ]):
                    discrepancies.append(msg.content)
    
    return discrepancies
