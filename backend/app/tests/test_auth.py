from starlette import status


def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "John",
            "surname": "Paul",
            "username": "JohnPaul",
            "email": "john@example.com",
            "password": "password123",
            "role": "user",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["username"] == "JohnPaul"
    assert data["email"] == "john@example.com"
    assert "hashed_password" not in data


def test_login_user(client):
    client.post(
        "/auth/register",
        json={
            "name": "John",
            "surname": "Paul",
            "username": "JohnPaul",
            "email": "john@example.com",
            "password": "password123",
            "role": "user",
        },
    )

    response = client.post(
        "/auth/token",
        data={
            "username": "JohnPaul",
            "password": "password123",
        },
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_current_user_requires_token(client):
    response = client.get("/user/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_with_token(client):
    client.post(
        "/auth/register",
        json={
            "name": "John",
            "surname": "Paul",
            "username": "JohnPaul",
            "email": "john@example.com",
            "password": "password123",
            "role": "user",
        },
    )

    login_response = client.post(
        "/auth/token",
        data={
            "username": "JohnPaul",
            "password": "password123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/user/",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["username"] == "JohnPaul"
    assert data["email"] == "john@example.com"