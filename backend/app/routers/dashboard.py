from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.models import Budget, Category, Transaction
from backend.app.routers.auth import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class TopExpenseCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    total: float

class RecentTransactionResponse(BaseModel):
    id: int
    amount: float
    description: str | None
    type: str
    transaction_date: date
    category_id: int
    category_name: str

class MonthlyDashboardResponse(BaseModel):
    year: int
    month: int
    total_income: float
    total_expense: float
    balance: float
    budget_total: float
    budget_remaining: float
    is_over_budget: bool
    top_expense_categories: list[TopExpenseCategoryResponse]
    recent_transactions: list[RecentTransactionResponse]

@router.get("/monthly", response_model=MonthlyDashboardResponse, status_code=status.HTTP_200_OK)
async def monthly_dashboard(current_user: user_dependency, db: db_dependency, year: int = Query(gt=2000), month: int = Query(ge=1, le=12)):
    user_id = current_user.get("id")
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id,
                                                                 Transaction.type == "income",
                                                                 func.strftime("%Y", Transaction.transaction_date) == str(year),
                                                                 func.strftime("%m", Transaction.transaction_date) == f"{month:02d}",
                                                                 ).scalar() or 0

    total_expense = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id,
                                                                  Transaction.type == "expense",
                                                                  func.strftime("%Y", Transaction.transaction_date) == str(year),
                                                                  func.strftime("%m", Transaction.transaction_date) == f"{month:02d}",
                                                                  ).scalar() or 0
    budget_total = db.query(func.sum(Budget.amount)).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month).scalar() or 0
    budget_remaining = budget_total - total_expense

    top_expense_categories = db.query(Category.id.label("category_id"), Category.name.label("category_name"),
                                      func.sum(Transaction.amount).label("total")).join(Category,
    Transaction.category_id == Category.id).filter(Transaction.user_id == user_id,
                                                   Transaction.type == "expense",
                                                   func.strftime("%Y", Transaction.transaction_date) == str(year),
                                                   func.strftime("%m", Transaction.transaction_date) == f"{month:02d}"
                                                   ).group_by(Category.id,Category.name).order_by(
        func.sum(Transaction.amount).desc()).limit(5).all()

    recent_transactions = db.query(
        Transaction.id.label("id"),
        Transaction.amount.label("amount"),
        Transaction.description.label("description"),
        Transaction.type.label("type"),
        Transaction.transaction_date.label("transaction_date"),
        Category.id.label("category_id"),
        Category.name.label("category_name")).join(Category, Transaction.category_id == Category.id).filter(
        Transaction.user_id == user_id,
        func.strftime("%Y", Transaction.transaction_date) == str(year),
        func.strftime("%m", Transaction.transaction_date) == f"{month:02d}").order_by(
        Transaction.transaction_date.desc(),Transaction.id.desc()).limit(5).all()
    return {
        "year": year,
        "month": month,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "budget_total": budget_total,
        "budget_remaining": budget_remaining,
        "is_over_budget": total_expense > budget_total if budget_total > 0 else False,
        "top_expense_categories": top_expense_categories,
        "recent_transactions": recent_transactions}