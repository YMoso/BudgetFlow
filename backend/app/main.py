from fastapi import FastAPI
from backend.app import models
from backend.app.database import engine
from backend.app.routers import auth, users, admin, categories, transactions, budgets, dashboard

app = FastAPI(title="BudgetFlow API")

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(dashboard.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


