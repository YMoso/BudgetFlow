from datetime import date
from enum import Enum
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.models import Category, Transaction
from backend.app.routers.auth import get_current_user
from sqlalchemy import func

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=200)
    type: TransactionType
    transaction_date: date
    category_id: int = Field(gt=0)
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "amount": 45.50,
                "description": "Grocery shopping",
                "type": "expense",
                "transaction_date": "2026-07-02",
                "category_id": 1,
            }
        }
    )

class TransactionUpdate(BaseModel):
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=200)
    type: TransactionType
    transaction_date: date
    category_id: int = Field(gt=0)


class TransactionResponse(BaseModel):
    id: int
    amount: float
    description: Optional[str]
    type: str
    transaction_date: date
    user_id: int
    category_id: int

    class Config:
        from_attributes = True

class MonthlySummaryResponse(BaseModel):
    year: int
    month: int
    total_income: float
    total_expense: float
    balance: float

class CategorySummaryResponse(BaseModel):
    category_id: int
    category_name: str
    type: str
    total: float

def get_user_category(db: Session, category_id: int, user_id: int):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate, current_user: user_dependency, db: db_dependency):
    user_id = current_user.get("id")
    category = get_user_category(db=db, category_id=transaction.category_id, user_id=user_id)

    if category.type != transaction.type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction type must match category type")

    db_transaction = Transaction(
        amount=transaction.amount,
        description=transaction.description,
        type=transaction.type,
        transaction_date=transaction.transaction_date,
        user_id=user_id,
        category_id=transaction.category_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return db_transaction

@router.get("/", response_model=list[TransactionResponse], status_code=status.HTTP_200_OK)
async def read_transactions(current_user: user_dependency, db: db_dependency, transaction_type: Optional[TransactionType] = Query(default=None),
                            category_id: Optional[int] = Query(default=None, gt=0)):
    user_id = current_user.get("id")
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if transaction_type is not None:
        query = query.filter(Transaction.type == transaction_type)

    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)

    return query.all()

@router.get("/summary/monthly", response_model=MonthlySummaryResponse)
async def monthly_summary(current_user: user_dependency, db: db_dependency, year: int = Query(gt=2000),
                          month: int = Query(ge=1, le=12)):
    user_id = current_user.get("id")
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id,
        Transaction.type == "income",
        func.strftime("%Y", Transaction.transaction_date) == str(year),
        func.strftime("%m", Transaction.transaction_date) == f"{month:02d}").scalar() or 0

    total_expense = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id,
        Transaction.type == "expense",
        func.strftime("%Y", Transaction.transaction_date) == str(year),
        func.strftime("%m", Transaction.transaction_date) == f"{month:02d}").scalar() or 0
    return {"year": year, "month": month, "total_income": total_income, "total_expense": total_expense,
            "balance": total_income - total_expense}

@router.get("/summary/by-category", response_model=list[CategorySummaryResponse])
async def summary_by_category(current_user: user_dependency, db: db_dependency, year: int = Query(gt=2000),
                              month: int = Query(ge=1, le=12)):
    user_id = current_user.get("id")
    results = db.query(
        Category.id.label("category_id"),
        Category.name.label("category_name"),
        Transaction.type.label("type"),
        func.sum(Transaction.amount).label("total")).join(Category, Transaction.category_id == Category.id).filter(
        Transaction.user_id == user_id,
        func.strftime("%Y", Transaction.transaction_date) == str(year),
        func.strftime("%m", Transaction.transaction_date) == f"{month:02d}",
    ).group_by(Category.id, Category.name, Transaction.type).all()

    return results

@router.get("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def read_transaction(current_user: user_dependency, db: db_dependency, transaction_id: int = Path(gt=0)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id,
                                               Transaction.user_id == current_user.get("id")).first()
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_transaction(transaction: TransactionUpdate, current_user: user_dependency, db: db_dependency,
                             transaction_id: int = Path(gt=0)):
    user_id = current_user.get("id")
    transaction_model = db.query(Transaction).filter(Transaction.id == transaction_id,
                                                     Transaction.user_id == user_id).first()
    if transaction_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    category = get_user_category(db=db, category_id=transaction.category_id, user_id=user_id)

    if category.type != transaction.type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction type must match category type")

    transaction_model.amount = transaction.amount
    transaction_model.description = transaction.description
    transaction_model.type = transaction.type
    transaction_model.transaction_date = transaction.transaction_date
    transaction_model.category_id = transaction.category_id
    db.add(transaction_model)
    db.commit()

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(current_user: user_dependency, db: db_dependency, transaction_id: int = Path(gt=0)):
    transaction_model = db.query(Transaction).filter(Transaction.id == transaction_id,
                                                     Transaction.user_id == current_user.get("id")).first()
    if transaction_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    db.delete(transaction_model)
    db.commit()