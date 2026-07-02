from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from starlette import status
from backend.app.database import get_db
from backend.app.models import Budget, Category, Transaction
from backend.app.routers.auth import get_current_user

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class BudgetCreate(BaseModel):
    amount: float = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(gt=2000)
    category_id: int = Field(gt=0)

class BudgetUpdate(BaseModel):
    amount: float = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(gt=2000)
    category_id: int = Field(gt=0)

class BudgetResponse(BaseModel):
    id: int
    amount: float
    month: int
    year: int
    user_id: int
    category_id: int

    class Config:
        from_attributes = True

class BudgetSummaryResponse(BaseModel):
    category_id: int
    category_name: str
    budget_amount: float
    spent_amount: float
    remaining: float
    is_over_budget: bool

def get_user_category(db: Session, category_id: int, user_id: int):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(budget: BudgetCreate, current_user: user_dependency, db: db_dependency):
    user_id = current_user.get("id")
    category = get_user_category(db=db, category_id=budget.category_id, user_id=user_id)

    if category.type != "expense":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budgets can only be created for expense categories")

    existing_budget = db.query(Budget).filter(Budget.user_id == user_id, Budget.category_id == budget.category_id,
                                              Budget.month == budget.month, Budget.year == budget.year).first()
    if existing_budget:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budget already exists for this category and month")

    db_budget = Budget(
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        user_id=user_id,
        category_id=budget.category_id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=list[BudgetResponse], status_code=status.HTTP_200_OK)
async def read_budgets(current_user: user_dependency, db: db_dependency,
                       year: int | None = Query(default=None, gt=2000),
                       month: int | None = Query(default=None, ge=1, le=12)):
    user_id = current_user.get("id")
    query = db.query(Budget).filter(Budget.user_id == user_id)
    if year is not None:
        query = query.filter(Budget.year == year)
    if month is not None:
        query = query.filter(Budget.month == month)
    return query.all()

@router.get("/summary/monthly", response_model=list[BudgetSummaryResponse])
async def monthly_budget_summary(current_user: user_dependency, db: db_dependency, year: int = Query(gt=2000),
                                 month: int = Query(ge=1, le=12)):
    user_id = current_user.get("id")
    budgets = db.query(Budget, Category).join(Category, Budget.category_id == Category.id,).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month).all()

    summary = []
    for budget, category in budgets:
        spent_amount = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            func.strftime("%Y", Transaction.transaction_date) == str(year),
            func.strftime("%m", Transaction.transaction_date) == f"{month:02d}").scalar() or 0

        remaining = budget.amount -spent_amount
        summary.append({
            "category_id": category.id,
            "category_name": category.name,
            "budget_amount": budget.amount,
            "spent_amount": spent_amount,
            "remaining": remaining,
            "is_over_budget": spent_amount>budget.amount})
    return summary

@router.get("/{budget_id}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
async def read_budget(current_user: user_dependency, db: db_dependency, budget_id: int = Path(gt=0)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.get("id")).first()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.put("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_budget(budget: BudgetUpdate, current_user: user_dependency, db: db_dependency, budget_id: int = Path(gt=0)):
    user_id = current_user.get("id")
    budget_model = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if budget_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    category = get_user_category(db=db, category_id=budget.category_id, user_id=user_id)

    if category.type != "expense":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budgets can only be created for expense categories")

    duplicate_budget = db.query(Budget).filter(Budget.id != budget_id, Budget.user_id == user_id,
                                               Budget.category_id == budget.category_id,
                                               Budget.month == budget.month,
                                               Budget.year == budget.year).first()
    if duplicate_budget:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budget already exists for this category and month",)
    budget_model.amount = budget.amount
    budget_model.month = budget.month
    budget_model.year = budget.year
    budget_model.category_id = budget.category_id
    db.add(budget_model)
    db.commit()

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(current_user: user_dependency,db: db_dependency, budget_id: int = Path(gt=0)):
    budget_model = db.query(Budget).filter(Budget.id == budget_id,
                                           Budget.user_id == current_user.get("id")).first()
    if budget_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    db.delete(budget_model)
    db.commit()