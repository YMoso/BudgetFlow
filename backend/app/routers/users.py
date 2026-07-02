from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.models import User
from backend.app.routers.auth import get_current_user, bcrypt_context, UserResponse

router = APIRouter(
    prefix="/user",
    tags=["user"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class UserVerification(BaseModel):
    password: str
    new_password: str = Field(min_length=6)


@router.get("/", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def read_current_user(current_user: user_dependency, db: db_dependency):
    user = db.query(User).filter(User.id == current_user.get("id")).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
    return user


@router.put("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(current_user: user_dependency,db: db_dependency,
                          user_verification: UserVerification,):
    user_model = db.query(User).filter(User.id == current_user.get("id")).first()
    if user_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found",)

    if not bcrypt_context.verify(
        user_verification.password,
        user_model.hashed_password,
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid password")

    user_model.hashed_password = bcrypt_context.hash(user_verification.new_password)

    db.add(user_model)
    db.commit()