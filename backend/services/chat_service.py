from typing import Optional
from sqlalchemy.orm import Session
from fastapi import WebSocket, HTTPException
from models import ChatSessions, ChatMessages, MessageType, Applications, Jobs, Users
from api.schemas import ChatMessageResponse
import json

def save_message(db: Session, session_id: int, message_type: MessageType, content: str, question_id: Optional[str] = None, metadata: Optional[dict] = None):
    message = ChatMessages(
        session_id=session_id,
        message_type=message_type,
        content=content,
        question_id=question_id,
        metadata=json.dumps(metadata) if metadata else None
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def create_message_response(msg: ChatMessages) -> ChatMessageResponse:
    return ChatMessageResponse(
        message_id=msg.message_id,
        message_type=msg.message_type.value,
        content=msg.content,
        question_id=msg.question_id,
        created_at=msg.created_at.isoformat()
    )

def get_session_messages(db: Session, session_id: int) -> list[ChatMessages]:
    return db.query(ChatMessages).filter(
        ChatMessages.session_id == session_id
    ).order_by(ChatMessages.created_at.asc()).all()

def get_session_with_messages(db: Session, session_id: int) -> Optional[ChatSessions]:
    session = db.query(ChatSessions).filter(ChatSessions.session_id == session_id).first()
    return session

def get_application_by_id(db: Session, application_id: int) -> Applications:
    application = db.query(Applications).filter(Applications.application_id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

def get_job_by_id(db: Session, job_id: int) -> Jobs:
    job = db.query(Jobs).filter(Jobs.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

def get_user_by_id(db: Session, user_id: int) -> Users:
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_job_description_text(job: Jobs) -> str:
    return f"""
    Job Title: {job.title}
    Company: {job.company}
    Description: {job.description or 'No description provided'}
    Location: {job.desired_location or 'Not specified'}
    Employment Type: {job.employment_type.value if job.employment_type else 'Not specified'}
    Work Format: {job.work_format.value if job.work_format else 'Not specified'}
    Required Skills: {', '.join(job.desired_skills) if job.desired_skills else 'Not specified'}
    Salary Range: {job.min_salary or 0} - {job.max_salary or 0} EUR
    """

def create_user_info_text(user: Users, application: Applications) -> str:
    return f"""
    Candidate Name: {user.full_name}
    Email: {user.email}
    Location: {user.location or 'Not provided'}
    Bio: {user.bio or 'Not provided'}
    CV Content: {application.cv or 'Not provided'}
    Cover Letter: {application.cover_letter or 'Not provided'}
    """

async def send_websocket_message(websocket: WebSocket, db: Session, session_id: int, 
                                message_type: str, content: str, question_id: Optional[str] = None):
    await websocket.send_json({
        "type": message_type,
        "text": content,
        **({"question_id": question_id} if question_id else {})
    })
    
    db_message_type = {
        "system_message": MessageType.system,
        "question": MessageType.question,
        "user_message": MessageType.user
    }.get(message_type, MessageType.system)
    
    save_message(db, session_id, db_message_type, content, question_id)

def get_chat_sessions_for_user(db: Session, user_id: int, application_id: Optional[int] = None, limit: int = 50, offset: int = 0):
    query = db.query(ChatSessions).filter(ChatSessions.user_id == user_id)
    
    if application_id:
        query = query.filter(ChatSessions.application_id == application_id)
    
    return query.order_by(ChatSessions.created_at.desc()).offset(offset).limit(limit).all()

def get_chat_sessions_for_application(db: Session, application_id: int):
    return db.query(ChatSessions).filter(
        ChatSessions.application_id == application_id
    ).order_by(ChatSessions.created_at.desc()).all()

def delete_chat_session(db: Session, session_id: int):
    session = db.query(ChatSessions).filter(ChatSessions.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    db.query(ChatMessages).filter(ChatMessages.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    
    return {"message": "Chat session deleted successfully"}
