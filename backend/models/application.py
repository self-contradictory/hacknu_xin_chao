from sqlalchemy import Column, Integer, Text, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin
from .enums import ApplicationStatus


class Applications(Base, TimestampMixin):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, autoincrement=True)

    job_id = Column(Integer, ForeignKey("jobs.job_id", ondelete="CASCADE"), nullable=False)
    job = relationship("Jobs", back_populates="applications")

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    applicant = relationship("Users", back_populates="applications", foreign_keys=[user_id])

    cv = Column(Text, nullable=True)       
    cover_letter = Column(Text, nullable=True)

    application_status = Column(
        SAEnum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
        default=ApplicationStatus.submitted,
    )

    reviewed_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reviewed_by = relationship("Users", back_populates="reviewed_applications", foreign_keys=[reviewed_by_id])

    score = Column(Float, nullable=True) 

    def __repr__(self):
        return f"<Application(id={self.application_id}, job_id={self.job_id}, user_id={self.user_id}, status={self.application_status})>"
