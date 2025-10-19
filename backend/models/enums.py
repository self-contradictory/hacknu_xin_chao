import enum


class UserRole(enum.Enum):
    candidate = "candidate"
    recruiter = "recruiter"
    admin = "admin"


class ApplicationStatus(enum.Enum):
    submitted = "submitted"
    viewed = "viewed"
    shortlisted = "shortlisted"
    rejected = "rejected"
    offered = "offered"
    hired = "hired"


class EmploymentType(enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"
    temporary = "temporary"


class WorkFormat(enum.Enum): 
    hybrid = "hybrid"
    remote = "remote"
    onsite = "onsite"


class MessageType(enum.Enum):
    system = "system"
    user = "user"
    ai = "ai"
    question = "question"
