from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin
from .enums import EmploymentType, WorkFormat


class Jobs(Base, TimestampMixin):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    description = Column(Text)

    min_salary = Column(Float)
    max_salary = Column(Float)

    desired_location = Column(String(255))
    desired_skills = Column(JSON, nullable=True, default=list)

    employment_type = Column(SAEnum(EmploymentType, name="employment_type_enum"))
    work_format = Column(SAEnum(WorkFormat, name="work_format_enum"))

    poster_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    poster = relationship("Users", back_populates="jobs_posted")

    applications = relationship("Applications", back_populates="job", cascade="all, delete-orphan")

    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Job(job_id={self.job_id}, title={self.title}, company={self.company})>"
    
    def to_dict(self):
        return {
            "job_id": self.job_id,
            "title": self.title,
            "company": self.company,
            "description": self.description,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "desired_location": self.desired_location,
            "employment_type": self.employment_type.value if self.employment_type else None,
            "work_format": self.work_format.value if self.work_format else None,
            "poster_id": self.poster_id,
            "is_active": self.is_active,
            "desired_skills": self.desired_skills or []
        }
