"""Integration tests for user aircraft CRUD endpoints."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

SAMPLE_AIRCRAFT = {
    "id": 1,
    "tail_number": "N172SP",
    "type_code": "C172",
    "year": 2005,
    "make": "Cessna",
    "model": "172S",
    "gear_type": "Fixed",
    "engine_type": "Reciprocating",
    "aircraft_class": "Single Engine Land",
    "is_complex": False,
    "is_taa": False,
    "is_high_performance": False,
    "is_simulator": False,
    "category": "rental",
    "hourly_rate_wet": "150.00",
    "hourly_rate_dry": None,
    "fuel_burn_rate": None,
    "fuel_price_per_gallon": None,
    "notes": None,
    "is_active": True,
    "data_source": "manual",
    "faa_last_checked": None,
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat(),
    "total_time": "25.00",
}


def test_list_aircraft_empty(client):
    """GET /api/user/aircraft returns empty list when no aircraft exist."""
    with patch("app.postgres_database.postgres_db.get_user_aircraft", AsyncMock(return_value=[])):
        response = client.get("/api/user/aircraft")
    assert response.status_code == 200
    assert response.json() == []


def test_list_aircraft_returns_data(client):
    """GET /api/user/aircraft returns aircraft list."""
    with patch("app.postgres_database.postgres_db.get_user_aircraft", AsyncMock(return_value=[SAMPLE_AIRCRAFT])):
        response = client.get("/api/user/aircraft")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tail_number"] == "N172SP"


def test_get_aircraft_by_id_found(client):
    """GET /api/user/aircraft/{id} returns aircraft when it exists."""
    with patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=SAMPLE_AIRCRAFT)):
        response = client.get("/api/user/aircraft/1")
    assert response.status_code == 200
    assert response.json()["id"] == 1


def test_get_aircraft_by_id_not_found(client):
    """GET /api/user/aircraft/{id} returns 404 when aircraft doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=None)):
        response = client.get("/api/user/aircraft/999")
    assert response.status_code == 404


def test_create_aircraft(client):
    """POST /api/user/aircraft creates and returns new aircraft."""
    with (
        patch("app.postgres_database.postgres_db.get_aircraft_by_tail", AsyncMock(return_value=None)),
        patch("app.postgres_database.postgres_db.create_aircraft", AsyncMock(return_value=SAMPLE_AIRCRAFT)),
    ):
        response = client.post(
            "/api/user/aircraft",
            json={
                "tail_number": "N172SP",
                "make": "Cessna",
                "model": "172S",
                "year": 2005,
                "is_complex": False,
                "is_taa": False,
                "is_high_performance": False,
                "is_simulator": False,
                "is_active": True,
            },
        )
    assert response.status_code == 201
    assert response.json()["tail_number"] == "N172SP"


def test_create_aircraft_validation_error(client):
    """POST /api/user/aircraft returns 422 for invalid year."""
    response = client.post(
        "/api/user/aircraft",
        json={
            "tail_number": "N172SP",
            "year": 1800,  # below minimum of 1900
        },
    )
    assert response.status_code == 422


def test_update_aircraft_not_found(client):
    """PUT /api/user/aircraft/{id} returns 404 when aircraft doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=None)):
        response = client.put("/api/user/aircraft/999", json={"notes": "updated"})
    assert response.status_code == 404


def test_delete_aircraft_not_found(client):
    """DELETE /api/user/aircraft/{id} returns 404 when aircraft doesn't exist."""
    with patch("app.postgres_database.postgres_db.delete_aircraft", AsyncMock(return_value=False)):
        response = client.delete("/api/user/aircraft/999")
    assert response.status_code == 404


def test_delete_aircraft_success(client):
    """DELETE /api/user/aircraft/{id} returns 204 on success."""
    with (
        patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=SAMPLE_AIRCRAFT)),
        patch("app.postgres_database.postgres_db.delete_aircraft", AsyncMock(return_value=True)),
    ):
        response = client.delete("/api/user/aircraft/1")
    assert response.status_code == 204
