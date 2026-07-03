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


def test_monthly_dashboard(client, auth_headers):
    headers = auth_headers()

    food_category = create_category(client, headers, name="Food", category_type="expense")
    salary_category = create_category(client, headers, name="Salary", category_type="income")

    client.post(
        "/budgets/",
        json={
            "amount": 500,
            "month": 7,
            "year": 2026,
            "category_id": food_category["id"],
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
            "category_id": food_category["id"],
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
            "category_id": salary_category["id"],
        },
        headers=headers,
    )

    response = client.get(
        "/dashboard/monthly?year=2026&month=7",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["year"] == 2026
    assert data["month"] == 7
    assert data["total_income"] == 3000
    assert data["total_expense"] == 150
    assert data["balance"] == 2850
    assert data["budget_total"] == 500
    assert data["budget_remaining"] == 350
    assert data["is_over_budget"] is False

    assert len(data["top_expense_categories"]) == 1
    assert data["top_expense_categories"][0]["category_name"] == "Food"
    assert data["top_expense_categories"][0]["total"] == 150

    assert len(data["recent_transactions"]) == 2