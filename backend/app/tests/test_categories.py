from starlette import status


def test_create_category(client, auth_headers):
    headers = auth_headers()

    response = client.post(
        "/categories/",
        json={
            "name": "Food",
            "type": "expense",
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["name"] == "Food"
    assert data["type"] == "expense"
    assert "id" in data
    assert "user_id" in data


def test_get_categories(client, auth_headers):
    headers = auth_headers()

    client.post(
        "/categories/",
        json={
            "name": "Food",
            "type": "expense",
        },
        headers=headers,
    )

    response = client.get(
        "/categories/",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Food"
    assert data[0]["type"] == "expense"


def test_duplicate_category_returns_400(client, auth_headers):
    headers = auth_headers()

    category_payload = {
        "name": "Food",
        "type": "expense",
    }

    client.post(
        "/categories/",
        json=category_payload,
        headers=headers,
    )

    response = client.post(
        "/categories/",
        json=category_payload,
        headers=headers,
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_invalid_category_type_returns_422(client, auth_headers):
    headers = auth_headers()

    response = client.post(
        "/categories/",
        json={
            "name": "Food",
            "type": "banana",
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_user_cannot_see_other_users_categories(client, auth_headers):
    user_one_headers = auth_headers(
        username="userone",
        email="userone@example.com",
    )

    user_two_headers = auth_headers(
        username="usertwo",
        email="usertwo@example.com",
    )

    client.post(
        "/categories/",
        json={
            "name": "Food",
            "type": "expense",
        },
        headers=user_one_headers,
    )

    response = client.get(
        "/categories/",
        headers=user_two_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []