"""Integration tests for expense management endpoints."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

SAMPLE_EXPENSE = {
    "id": 1,
    "aircraft_id": None,
    "budget_card_id": None,
    "category": "fuel",
    "subcategory": None,
    "description": "Avgas at KPWK",
    "amount": "85.50",
    "date": "2025-01-15",
    "is_recurring": False,
    "recurrence_interval": None,
    "recurrence_end_date": None,
    "vendor": "Shell",
    "is_tax_deductible": False,
    "tax_category": None,
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat(),
}


def test_list_expenses_empty(client):
    """GET /api/user/expenses returns empty list."""
    with patch("app.postgres_database.postgres_db.get_expenses", AsyncMock(return_value=[])):
        response = client.get("/api/user/expenses")
    assert response.status_code == 200
    assert response.json() == []


def test_list_expenses_returns_data(client):
    """GET /api/user/expenses returns expense list."""
    with patch("app.postgres_database.postgres_db.get_expenses", AsyncMock(return_value=[SAMPLE_EXPENSE])):
        response = client.get("/api/user/expenses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "fuel"


def test_get_expense_by_id_found(client):
    """GET /api/user/expenses/{id} returns expense when it exists."""
    with patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=SAMPLE_EXPENSE)):
        response = client.get("/api/user/expenses/1")
    assert response.status_code == 200
    assert response.json()["id"] == 1


def test_get_expense_by_id_not_found(client):
    """GET /api/user/expenses/{id} returns 404 when not found."""
    with patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=None)):
        response = client.get("/api/user/expenses/999")
    assert response.status_code == 404


def test_create_expense_success(client):
    """POST /api/user/expenses creates and returns a new expense."""
    with patch("app.postgres_database.postgres_db.create_expense", AsyncMock(return_value=SAMPLE_EXPENSE)):
        response = client.post(
            "/api/user/expenses",
            json={
                "category": "fuel",
                "description": "Avgas at KPWK",
                "amount": "85.50",
                "date": "2025-01-15",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "fuel"
    assert data["amount"] == "85.50"


def test_create_expense_missing_required_fields(client):
    """POST /api/user/expenses returns 422 when required fields are missing."""
    response = client.post(
        "/api/user/expenses",
        json={"description": "Missing category and amount and date"},
    )
    assert response.status_code == 422


def test_create_expense_invalid_amount(client):
    """POST /api/user/expenses returns 422 for zero or negative amount."""
    response = client.post(
        "/api/user/expenses",
        json={
            "category": "fuel",
            "amount": "0.00",  # must be > 0
            "date": "2025-01-15",
        },
    )
    assert response.status_code == 422


def test_update_expense_not_found(client):
    """PUT /api/user/expenses/{id} returns 404 when expense doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=None)):
        response = client.put("/api/user/expenses/999", json={"description": "updated"})
    assert response.status_code == 404


def test_update_expense_success(client):
    """PUT /api/user/expenses/{id} returns updated expense."""
    updated = {**SAMPLE_EXPENSE, "description": "Updated description"}
    with (
        patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=SAMPLE_EXPENSE)),
        patch("app.postgres_database.postgres_db.update_expense", AsyncMock(return_value=updated)),
    ):
        response = client.put(
            "/api/user/expenses/1",
            json={"description": "Updated description"},
        )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"


def test_delete_expense_success(client):
    """DELETE /api/user/expenses/{id} returns 204 on success."""
    with (
        patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=SAMPLE_EXPENSE)),
        patch("app.postgres_database.postgres_db.delete_expense", AsyncMock(return_value=True)),
    ):
        response = client.delete("/api/user/expenses/1")
    assert response.status_code == 204


def test_delete_expense_not_found(client):
    """DELETE /api/user/expenses/{id} returns 404 when not found."""
    with patch("app.postgres_database.postgres_db.get_expense_by_id", AsyncMock(return_value=None)):
        response = client.delete("/api/user/expenses/999")
    assert response.status_code == 404


def test_get_expense_summary(client):
    """GET /api/user/expenses/summary returns aggregated summary."""
    mock_summary = [{"category": "fuel", "total": "500.00", "count": 5}]
    with patch("app.postgres_database.postgres_db.get_expense_summary", AsyncMock(return_value=mock_summary)):
        response = client.get("/api/user/expenses/summary")
    assert response.status_code == 200
