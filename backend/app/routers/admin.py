from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.routers.auth import get_current_admin, UserResponse
from backend.app.models import User, Category
from pydantic import BaseModel
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

db_dependency = Annotated[Session, Depends(get_db)]
admin_dependency = Annotated[dict, Depends(get_current_admin)]

class AdminCategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    user_id: int

    class Config:
        from_attributes = True

@router.get("/users", response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def read_all_users(admin: admin_dependency, db: db_dependency):
    return db.query(User).all()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(admin: admin_dependency,db: db_dependency,user_id: int = Path(gt=0)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")

    db.delete(user)
    db.commit()

@router.get("/categories", response_model=list[AdminCategoryResponse], status_code=status.HTTP_200_OK)
async def read_all_categories(admin: admin_dependency, db: db_dependency):
    return db.query(Category).all()

@router.get("/users/{user_id}/categories",response_model=list[AdminCategoryResponse],
    status_code=status.HTTP_200_OK)
async def read_categories_by_user(admin: admin_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db.query(Category).filter(Category.user_id == user_id).all()

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_any_category(admin: admin_dependency, db: db_dependency, category_id: int = Path(gt=0)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(category)
    db.commit()