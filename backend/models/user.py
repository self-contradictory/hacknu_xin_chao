import bcrypt
from sqlalchemy import Column, Integer, String, Text, Enum as SAEnum
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin
from .enums import UserRole


class Users(Base, TimestampMixin):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    location = Column(String(255))
    bio = Column(Text)

    user_role = Column(SAEnum(UserRole, name="userrole_enum"), nullable=False, default=UserRole.candidate)

    applications = relationship(
        "Applications", 
        back_populates="applicant", 
        cascade="all, delete-orphan",
        foreign_keys="[Applications.user_id]" 
    )
    
    reviewed_applications = relationship(
        "Applications",
        back_populates="reviewed_by",
        foreign_keys="[Applications.reviewed_by_id]"  
    )
    
    jobs_posted = relationship("Jobs", back_populates="poster", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(user_id={self.user_id}, email={self.email}, role={self.user_role})>"

    def set_password(self, hashed_password: str):
        self.password_hash = hashed_password

    def check_password(self, plain_password: str) -> bool:
       return bcrypt.checkpw(
           plain_password.encode('utf-8'), 
           self.password_hash.encode('utf-8')
       )
