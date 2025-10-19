from pydantic import BaseModel, Field
from typing import List, Optional, Dict


# ===== USER SCHEMAS =====
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    location: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    user_role: str = Field(..., pattern=r'^(recruiter|candidate)$')

class UserLogin(BaseModel):
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    location: Optional[str]
    bio: Optional[str]
    user_role: str
    access_token: str

    class Config:
        from_attributes = True


# ===== JOB SCHEMAS =====
class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    min_salary: Optional[float] = Field(None, ge=0)
    max_salary: Optional[float] = Field(None, ge=0)
    desired_location: Optional[str] = Field(None, max_length=255)
    desired_skills: List[str] = [] 
    employment_type: Optional[str] = None
    work_format: Optional[str] = None
    poster_id: Optional[int] = None
    is_active: bool = True

class JobResponse(BaseModel):
    job_id: int
    title: str
    company: str
    description: Optional[str]
    min_salary: Optional[float]
    max_salary: Optional[float]
    desired_location: Optional[str]
    employment_type: Optional[str]
    work_format: Optional[str]
    poster_id: Optional[int]
    is_active: bool
    desired_skills: List[str] = []

    class Config:
        from_attributes = True


# ===== APPLICATION SCHEMAS =====
class ApplicationCreate(BaseModel):
    job_id: int
    user_id: int
    cv: Optional[str] = None
    cover_letter: Optional[str] = None

class ApplicationWithText(BaseModel):
    job_id: int
    cv: str
    cover_letter: Optional[str] = None
    candidate: dict
    user_id: Optional[int] = None

class ApplicationResponse(BaseModel):
    application_id: int
    job_id: int
    user_id: int
    cv: Optional[str]
    cover_letter: Optional[str]
    application_status: str
    reviewed_by_id: Optional[int]
    score: Optional[float]

    class Config:
        from_attributes = True

class ChatMessageResponse(BaseModel):
    message_id: int
    message_type: str
    content: str
    question_id: Optional[str]
    created_at: str

class ApplicationDetailsResponse(BaseModel):
    application: ApplicationResponse
    chat_history: List[ChatMessageResponse]
    discrepancies: Optional[List[str]] = None

class CandidateInfo(BaseModel):
    name: str
    email: str
    city: str
    experience: float
    position: str
    education: str
    languages: list[str]
    salary_expectation: int
    work_format: str

class FirstResponse(BaseModel):
    rating_score: int
    discrepancies: List[str] = []

class QuestionsResponse(BaseModel):
    rating_score: int
    discrepancies: List[str]
    questions: List[str]

class AnalysisResponse(BaseModel):
    rating_score: int
    followup_needed: bool
    question: Optional[str] = None

class ApplyRequest(BaseModel):
    job_id: str
    job_description: str
    candidate: CandidateInfo

class ApplyResponse(BaseModel):
    application_id: str
    message: str


# ===== CHAT SCHEMAS =====
class WSMessage(BaseModel):
    type: str
    message: str | dict | None = None

class ChatHistoryRequest(BaseModel):
    user_id: int
    application_id: Optional[int] = None
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class ChatSessionResponse(BaseModel):
    session_id: int
    user_id: int
    application_id: Optional[int]
    session_title: Optional[str]
    created_at: str
    messages: list

# ===== SCORING SCHEMAS =====
class ScoringRequest(BaseModel):
    application_id: int
    rules_config: Dict[str, str]  # Maps rule names to category strings
    chat_answers: List[Dict] = []

class CriterionResultResponse(BaseModel):
    name: str
    category: str
    weight: float
    passed: bool
    points_awarded: float
    notes: Optional[str] = None

class AnswerJudgmentResponse(BaseModel):
    question_id: str
    category: str
    rationale: str

class ScoringResponse(BaseModel):
    primary_score: float
    secondary_score: float
    final_score: float
    decision: str
    fail_reason: Optional[str] = None
    primary_breakdown: List[CriterionResultResponse]
    secondary_judgments: List[AnswerJudgmentResponse]
    summary: str