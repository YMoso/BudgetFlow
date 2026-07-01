from fastapi import APIRouter, Depends, HTTPException, Path
from backend.app.models import User
from backend.app.database import get_db
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/users",
    tags=["users"],
)

db_dependency = Annotated[Session, Depends(get_db)]

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    surname: str = Field(min_length=2, max_length=50)
    username: str = Field(min_length=3, max_length=30)
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=6, max_length=100)
    is_active: bool

class UserUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    surname: str = Field(min_length=2, max_length=50)
    username: str = Field(min_length=3, max_length=30)
    email: str = Field(min_length=5, max_length=100)
    is_active: bool = True

@router.get("/read_all_users", status_code=status.HTTP_200_OK)
async def read_all(db: db_dependency):
    return db.query(User).all()

@router.post("/create_user", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: db_dependency):
    db_user = User(
        name=user.name,
        surname=user.surname,
        username=user.username,
        email=user.email,
        hashed_password=user.password,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def read_user(db: db_dependency, user_id: int = Path(gt=0)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_user(db: db_dependency, user: UserUpdate, user_id: int = Path(gt=0)):
    user_ = db.query(User).filter(User.id == user_id).first()
    if not user_:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_.name = user.name
    user_.surname = user.surname
    user_.username = user.username
    user_.email = user.email
    user_.is_active = user.is_active
    db.add(user_)
    db.commit()

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(db: db_dependency, user_id: int = Path(gt=0)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
