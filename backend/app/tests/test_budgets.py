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


def test_create_budget(client, auth_headers):
    headers = auth_headers()

    category = create_category(client, headers)

    response = client.post(
        "/budgets/",
        json={
            "amount": 500,
            "month": 7,
            "year": 2026,
            "category_id": category["id"],
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["amount"] == 500
    assert data["month"] == 7
    assert data["year"] == 2026
    assert data["category_id"] == category["id"]


def test_budget_only_for_expense_category(client, auth_headers):
    headers = auth_headers()

    category = create_category(
        client,
        headers,
        name="Salary",
        category_type="income",
    )

    response = client.post(
        "/budgets/",
        json={
            "amount": 500,
            "month": 7,
            "year": 2026,
            "category_id": category["id"],
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_duplicate_budget_returns_400(client, auth_headers):
    headers = auth_headers()

    category = create_category(client, headers)

    budget_payload = {
        "amount": 500,
        "month": 7,
        "year": 2026,
        "category_id": category["id"],
    }

    client.post(
        "/budgets/",
        json=budget_payload,
        headers=headers,
    )

    response = client.post(
        "/budgets/",
        json=budget_payload,
        headers=headers,
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_monthly_budget_summary(client, auth_headers):
    headers = auth_headers()

    category = create_category(client, headers)

    client.post(
        "/budgets/",
        json={
            "amount": 500,
            "month": 7,
            "year": 2026,
            "category_id": category["id"],
        },
        headers=headers,
    )

    client.post(
        "/transactions/",
        json={
            "amount": 150,
            "description": "Grocery shopping",
            "type": "expense",
            "transaction_date": "2026-07-02",
            "category_id": category["id"],
        },
        headers=headers,
    )

    response = client.get(
        "/budgets/summary/monthly?year=2026&month=7",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["category_name"] == "Food"
    assert data[0]["budget_amount"] == 500
    assert data[0]["spent_amount"] == 150
    assert data[0]["remaining"] == 350
    assert data[0]["is_over_budget"] is False