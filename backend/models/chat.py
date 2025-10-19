from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin
from .enums import MessageType


class ChatSessions(Base, TimestampMixin):
    __tablename__ = "chat_sessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=True)
    
    session_title = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    user = relationship("Users")
    application = relationship("Applications")
    messages = relationship("ChatMessages", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatSession(session_id={self.session_id}, user_id={self.user_id}, application_id={self.application_id})>"


class ChatMessages(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    
    message_type = Column(SAEnum(MessageType, name="message_type_enum"), nullable=False)
    content = Column(Text, nullable=False)
    
    question_id = Column(String(50), nullable=True)
    message_metadata = Column(Text, nullable=True)
    
    session = relationship("ChatSessions", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(message_id={self.message_id}, session_id={self.session_id}, type={self.message_type})>"
