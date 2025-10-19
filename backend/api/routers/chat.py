from typing import Optional
from fastapi import APIRouter, WebSocket, Depends, HTTPException
from sqlalchemy.orm import Session
from api.schemas import FirstResponse, AnalysisResponse, WSMessage, ChatSessionResponse, ChatMessageResponse
from models import ChatSessions, ChatMessages, MessageType
from core.db import get_db
from services import (
    save_message, create_message_response, get_session_messages,
    get_session_with_messages, create_job_description_text, create_user_info_text,
    send_websocket_message, get_chat_sessions_for_user, get_chat_sessions_for_application,
    delete_chat_session, get_application_by_id, get_job_by_id, get_user_by_id
)
import json  

router = APIRouter()


@router.websocket("/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()

    query_params = websocket.query_params
    print(f"Raw query params: {dict(query_params)}")
    
    application_id = query_params.get("applicationId")
    user_id = query_params.get("userId")
    
    print(f"Extracted applicationId: {application_id}, userId: {user_id}")
    
    if application_id:
        application_id = int(application_id)
    if user_id:
        user_id = int(user_id)
    
    if not application_id or not user_id:
        print(f"WebSocket connection rejected: applicationId={application_id}, userId={user_id}")
        await websocket.close(code=1008, reason="Missing required parameters: applicationId and userId")
        return
    
    print(f"WebSocket connection accepted: applicationId={application_id}, userId={user_id}")

    llm = websocket.app.state.llm
    questions_map: dict[str, str] = {}
    last_question: Optional[str] = None
    chat_session = None
    db = None
    current_question_index = 0 

    db = websocket.app.state.db.get_session()
        
    chat_session = ChatSessions(
        user_id=user_id,
        application_id=application_id,
        session_title="AI Interview Session"
    )
    db.add(chat_session)
    db.commit()
    db.refresh(chat_session)

    
    application = get_application_by_id(db, application_id)
    job = get_job_by_id(db, application.job_id)
    user = get_user_by_id(db, application.user_id)
    
    job_description = create_job_description_text(job)
    user_info = create_user_info_text(user, application)
        
    first_evaluation = llm.compare_applicant_to_job(job_description, user_info, FirstResponse)
        
    questions = llm.generate_questions(first_evaluation.discrepancies)

    system_msg = f"Hello {user.full_name}! Thank you for applying to the {job.title} position at {job.company}. I've analyzed your application and have some personalized questions to better understand your qualifications."
    await send_websocket_message(websocket, db, chat_session.session_id, "system_message", system_msg)

    if questions:
        for idx, question in enumerate(questions, start=1):
            qid = str(idx)
            questions_map[qid] = question
        
        first_question = questions[0]
        first_qid = "1"
        last_question = first_question
        await send_websocket_message(websocket, db, chat_session.session_id, "question", first_question, first_qid)
    else:
        end_msg = "Based on my analysis, I don't have any additional questions. Your application looks great!"
        await send_websocket_message(websocket, db, chat_session.session_id, "system_message", end_msg)
        
        final_msg = "Your application has been submitted to the recruiter. Good luck!"
        await send_websocket_message(websocket, db, chat_session.session_id, "system_message", final_msg)
        
        await websocket.close()
        return

    while True:
        data = await websocket.receive_text()
        msg = WSMessage.model_validate_json(data)

        if msg.type == "user_message" and msg.message:
            if chat_session and db:
                question_id = getattr(msg, "question_id", None) or getattr(msg, "in_reply_to", None)
                save_message(db, chat_session.session_id, MessageType.user, msg.message, question_id=str(question_id) if question_id else None)
            
            original_question = None

            if getattr(msg, "question_id", None):
                original_question = questions_map.get(str(msg.question_id))
            elif getattr(msg, "in_reply_to", None):
                original_question = questions_map.get(str(msg.in_reply_to))

            if original_question is None:
                original_question = last_question

            result = llm.analyze_answer(original_question, msg.message, AnalysisResponse)

            if result.followup_needed and result.question:
                await send_websocket_message(websocket, db, chat_session.session_id, "question", result.question)
                last_question = result.question
            else:
                current_question_index += 1
                total_questions = len(questions_map)
                
                if current_question_index < total_questions:
                    next_qid = str(current_question_index + 1)
                    next_question = questions_map.get(next_qid)
                    if next_question:
                        await send_websocket_message(websocket, db, chat_session.session_id, "question", next_question, next_qid)
                        last_question = next_question
                else:
                    end_msg = "Thank you for your detailed answers! I have all the information I need."
                    await send_websocket_message(websocket, db, chat_session.session_id, "system_message", end_msg)
                    
                    final_msg = "Your application has been submitted to the recruiter. Good luck with your application!"
                    await send_websocket_message(websocket, db, chat_session.session_id, "system_message", final_msg)
                    
                    await websocket.close()
                    break


@router.get("/chat/history/{user_id}", response_model=list[ChatSessionResponse])
async def get_chat_history(
    user_id: int,
    application_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    sessions = get_chat_sessions_for_user(db, user_id, application_id, limit, offset)
    
    result = []
    for session in sessions:
        messages = get_session_messages(db, session.session_id)
        message_responses = [create_message_response(msg) for msg in messages]
        
        result.append(ChatSessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            application_id=session.application_id,
            session_title=session.session_title,
            created_at=session.created_at.isoformat(),
            messages=message_responses
        ))
    
    return result


@router.get("/chat/session/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: int, db: Session = Depends(get_db)):
    session = get_session_with_messages(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = get_session_messages(db, session_id)
    message_responses = [create_message_response(msg) for msg in messages]
    
    return ChatSessionResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        application_id=session.application_id,
        session_title=session.session_title,
        created_at=session.created_at.isoformat(),
        messages=message_responses
    )


@router.get("/chat/application/{application_id}/history")
async def get_application_chat_history(application_id: int, db: Session = Depends(get_db)):
    application = get_application_by_id(db, application_id)
    chat_sessions = get_chat_sessions_for_application(db, application_id)
    
    if not chat_sessions:
        return {
            "application_id": application_id,
            "message": "No chat history found for this application",
            "chat_sessions": [],
            "total_messages": 0
        }
    
    all_messages = []
    session_summaries = []
    
    for session in chat_sessions:
        messages = get_session_messages(db, session.session_id)
        
        session_messages = []
        for msg in messages:
            message_data = {
                "message_id": msg.message_id,
                "message_type": msg.message_type.value,
                "content": msg.content,
                "question_id": msg.question_id,
                "created_at": msg.created_at.isoformat(),
                "metadata": json.loads(msg.message_metadata) if msg.message_metadata else None
            }
            session_messages.append(message_data)
            all_messages.append(message_data)
        
        session_summaries.append({
            "session_id": session.session_id,
            "session_title": session.session_title,
            "created_at": session.created_at.isoformat(),
            "is_active": session.is_active,
            "message_count": len(session_messages),
            "messages": session_messages
        })
    
    return {
        "application_id": application_id,
        "total_sessions": len(chat_sessions),
        "total_messages": len(all_messages),
        "chat_sessions": session_summaries,
        "all_messages": all_messages
    }
    
@router.delete("/chat/session/{session_id}")
async def delete_chat_session_endpoint(session_id: int, db: Session = Depends(get_db)):
    return delete_chat_session(db, session_id)

