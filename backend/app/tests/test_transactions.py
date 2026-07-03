from starlette import status


def create_category(client, headers, name="Food", category_type="expense"):
    response = client.post(
        "/categories/",
        json={
            "name": name,
            "type": category_type,
        },
        headers=headers,
    )

    return response.json()


def test_create_transaction(client, auth_headers):
    headers = auth_headers()

    category = create_category(client, headers)

    response = client.post(
        "/transactions/",
        json={
            "amount": 45.5,
            "description": "Grocery shopping",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": category["id"],
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["amount"] == 45.5
    assert data["description"] == "Grocery shopping"
    assert data["type"] == "expense"
    assert data["category_id"] == category["id"]


def test_get_transactions(client, auth_headers):
    headers = auth_headers()

    category = create_category(client, headers)

    client.post(
        "/transactions/",
        json={
            "amount": 45.5,
            "description": "Grocery shopping",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": category["id"],
        },
        headers=headers,
    )

    response = client.get(
        "/transactions/",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["description"] == "Grocery shopping"


def test_transaction_type_must_match_category_type(client, auth_headers):
    headers = auth_headers()

    category = create_category(
        client,
        headers,
        name="Salary",
        category_type="income",
    )

    response = client.post(
        "/transactions/",
        json={
            "amount": 45.5,
            "description": "Wrong transaction",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": category["id"],
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_user_cannot_use_other_users_category_for_transaction(client, auth_headers):
    user_one_headers = auth_headers(
        username="userone",
        email="userone@example.com",
    )

    user_two_headers = auth_headers(
        username="usertwo",
        email="usertwo@example.com",
    )

    category = create_category(client, user_one_headers)

    response = client.post(
        "/transactions/",
        json={
            "amount": 45.5,
            "description": "Illegal transaction",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": category["id"],
        },
        headers=user_two_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_filter_transactions_by_type(client, auth_headers):
    headers = auth_headers()

    expense_category = create_category(client, headers, name="Food", category_type="expense")
    income_category = create_category(client, headers, name="Salary", category_type="income")

    client.post(
        "/transactions/",
        json={
            "amount": 50,
            "description": "Food shopping",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": expense_category["id"],
        },
        headers=headers,
    )

    client.post(
        "/transactions/",
        json={
            "amount": 3000,
            "description": "Monthly salary",
            "type": "income",
            "transaction_date": "2026-07-01",
            "category_id": income_category["id"],
        },
        headers=headers,
    )

    response = client.get(
        "/transactions/?transaction_type=expense",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["type"] == "expense"