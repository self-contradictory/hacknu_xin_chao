from core.db import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Users
from api.schemas import UserResponse, UserCreate, UserLogin
from services import get_user_by_id, create_user, authenticate_user, create_user_response

router = APIRouter(prefix="/users")


@router.get("/fetch_by_id/{user_id}", response_model=UserResponse)
async def fetch_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    return create_user_response(user)


@router.post("/create", response_model=UserResponse)
async def create_user_endpoint(user_data: UserCreate, db: Session = Depends(get_db)):
    new_user = create_user(db, user_data)
    return create_user_response(new_user)

@router.post("/login", response_model=UserResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data)
    return create_user_response(user)

