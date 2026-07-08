from fastapi import FastAPI
from backend.app.routers import auth, users, admin, categories, transactions, budgets, dashboard
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="BudgetFlow API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(CORSMiddleware, allow_origins=[frontend_url, "http://localhost:5173"], allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])

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