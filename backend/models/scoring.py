from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class ScoringResults(Base, TimestampMixin):
    __tablename__ = "scoring_results"

    scoring_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=False)
    
    primary_score = Column(Float, nullable=False)
    secondary_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    decision = Column(String(20), nullable=False)  
    fail_reason = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    rules_config = Column(Text, nullable=True) 
    scoring_config = Column(Text, nullable=True)
    
    application = relationship("Applications", backref="scoring_results")

    def __repr__(self):
        return f"<ScoringResult(scoring_id={self.scoring_id}, application_id={self.application_id}, final_score={self.final_score}, decision={self.decision})>"


class ScoringBreakdown(Base, TimestampMixin):
    __tablename__ = "scoring_breakdown"

    breakdown_id = Column(Integer, primary_key=True, autoincrement=True)
    scoring_id = Column(Integer, ForeignKey("scoring_results.scoring_id", ondelete="CASCADE"), nullable=False)
    
    criterion_name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)
    weight = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    points_awarded = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    
    scoring_result = relationship("ScoringResults", backref="breakdown")

    def __repr__(self):
        return f"<ScoringBreakdown(breakdown_id={self.breakdown_id}, criterion_name={self.criterion_name}, points_awarded={self.points_awarded})>"


class ScoringJudgments(Base, TimestampMixin):
    __tablename__ = "scoring_judgments"

    judgment_id = Column(Integer, primary_key=True, autoincrement=True)
    scoring_id = Column(Integer, ForeignKey("scoring_results.scoring_id", ondelete="CASCADE"), nullable=False)
    
    question_id = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)
    rationale = Column(Text, nullable=False)
    
    scoring_result = relationship("ScoringResults", backref="judgments")

    def __repr__(self):
        return f"<ScoringJudgment(judgment_id={self.judgment_id}, question_id={self.question_id}, category={self.category})>"
