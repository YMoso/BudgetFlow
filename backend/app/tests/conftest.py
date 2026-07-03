import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"

from backend.app.database import Base, get_db
from backend.app.main import app


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_budgetflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture()
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture()
def auth_headers(client):
    def _auth_headers(
        username: str = "JohnPaul",
        email: str = "john@example.com",
        role: str = "user",
    ):
        client.post(
            "/auth/register",
            json={
                "name": "John",
                "surname": "Paul",
                "username": username,
                "email": email,
                "password": "password123",
                "role": role,
            },
        )

        login_response = client.post(
            "/auth/token",
            data={
                "username": username,
                "password": "password123",
            },
        )

        token = login_response.json()["access_token"]

        return {
            "Authorization": f"Bearer {token}",
        }

    return _auth_headers