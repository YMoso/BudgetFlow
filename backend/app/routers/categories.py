from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.models import Category
from backend.app.routers.auth import get_current_user
from enum import Enum


router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class CategoryType(str, Enum):
    income = "income"
    expense = "expense"

class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    type: CategoryType


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    type: CategoryType

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    user_id: int

    class Config:
        from_attributes = True

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, current_user: user_dependency, db: db_dependency):
    existing_category = db.query(Category).filter( Category.name == category.name, Category.type == category.type,
                                                   Category.user_id == current_user.get("id")).first()

    if existing_category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists")

    db_category = Category(
        name=category.name,
        type=category.type,
        user_id=current_user.get("id"))

    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=list[CategoryResponse], status_code=status.HTTP_200_OK)
async def read_categories(current_user: user_dependency, db: db_dependency):
    return db.query(Category).filter(Category.user_id == current_user.get("id")).all()

@router.get("/{category_id}", response_model=CategoryResponse, status_code=status.HTTP_200_OK)
async def read_category(current_user: user_dependency, db: db_dependency,category_id: int = Path(gt=0)):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.get("id"),).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Category not found",)
    return category

@router.put("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_category(category: CategoryUpdate, current_user: user_dependency, db: db_dependency, category_id: int = Path(gt=0)):
    category_model = db.query(Category).filter(Category.id == category_id,Category.user_id == current_user.get("id"),).first()
    if category_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category_model.name = category.name
    category_model.type = category.type
    db.add(category_model)
    db.commit()

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(current_user: user_dependency,db: db_dependency, category_id: int = Path(gt=0)):
    category_model = db.query(Category).filter(Category.id == category_id,
                                               Category.user_id == current_user.get("id")).first()

    if category_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Category not found")

    db.delete(category_model)
    db.commit()