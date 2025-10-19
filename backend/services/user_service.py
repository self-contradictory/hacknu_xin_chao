from sqlalchemy.orm import Session
from models import Users
from fastapi import HTTPException
from api.schemas import UserCreate, UserLogin, UserResponse
from core.auth import create_access_token
import bcrypt

USER_NOT_FOUND_MSG = "User not found"
INVALID_CREDENTIALS_MSG = "Invalid email or password"

def get_user_by_id(db: Session, user_id: int) -> Users:
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
    return user

def get_user_by_email(db: Session, email: str) -> Users:
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=USER_NOT_FOUND_MSG)
    return user

def create_user(db: Session, user_data: UserCreate) -> Users:
    hashed_password = bcrypt.hashpw(
        user_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')
    
    new_user = Users(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hashed_password,
        location=user_data.location,
        bio=user_data.bio,
        user_role=user_data.user_role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def authenticate_user(db: Session, login_data: UserLogin) -> Users:
    user = db.query(Users).filter(Users.email == login_data.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail=INVALID_CREDENTIALS_MSG)
    
    if not user.check_password(login_data.password):
        raise HTTPException(status_code=401, detail=INVALID_CREDENTIALS_MSG)
    
    return user

def create_user_response(user: Users) -> UserResponse:
    access_token = create_access_token(user.user_id, user.user_role.value)
    
    return UserResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        location=user.location,
        bio=user.bio,
        user_role=user.user_role.value,
        access_token=access_token
    )

def create_candidate_data(user: Users, application_cv: str = "", application_cover_letter: str = "") -> dict:
    return {
        "name": user.full_name,
        "email": user.email,
        "location": user.location or "",
        "bio": user.bio or "",
        "cv": application_cv or "",
        "cover_letter": application_cover_letter or "",
        "years_experience": 3,
        "skills": [],
        "employment_type": "full_time",
        "salary_expectation": 0,
        "education": "Bachelor's"
    }
