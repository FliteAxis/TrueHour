"""Integration tests for flight log CRUD endpoints."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

SAMPLE_FLIGHT = {
    "id": 1,
    "aircraft_id": 1,
    "date": "2025-01-15",
    "departure_airport": "KPWK",
    "arrival_airport": "KORD",
    "route": "KPWK KORD",
    "total_time": "1.2",
    "pic_time": "1.2",
    "sic_time": None,
    "night_time": "0.0",
    "solo_time": None,
    "cross_country_time": "1.2",
    "actual_instrument_time": "0.0",
    "simulated_instrument_time": "0.3",
    "simulated_flight_time": None,
    "dual_given_time": None,
    "dual_received_time": "1.2",
    "ground_training_time": None,
    "complex_time": None,
    "high_performance_time": None,
    "hobbs_start": None,
    "hobbs_end": None,
    "tach_start": None,
    "tach_end": None,
    "day_takeoffs": 1,
    "day_landings_full_stop": 1,
    "night_takeoffs": 0,
    "night_landings_full_stop": 0,
    "all_landings": 1,
    "holds": 0,
    "approaches": None,
    "instructor_name": "John Smith",
    "instructor_comments": None,
    "pilot_comments": None,
    "is_flight_review": False,
    "is_ipc": False,
    "is_checkride": False,
    "is_simulator_session": False,
    "fuel_gallons": None,
    "fuel_cost": None,
    "landing_fees": None,
    "instructor_cost": None,
    "rental_cost": None,
    "other_costs": None,
    "distance": None,
    "import_hash": None,
    "tail_number": None,
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat(),
}


def test_list_flights_empty(client):
    """GET /api/user/flights returns empty list when no flights exist."""
    with patch("app.postgres_database.postgres_db.get_flights", AsyncMock(return_value=[])):
        response = client.get("/api/user/flights")
    assert response.status_code == 200
    assert response.json() == []


def test_list_flights_returns_data(client):
    """GET /api/user/flights returns flight list."""
    with patch("app.postgres_database.postgres_db.get_flights", AsyncMock(return_value=[SAMPLE_FLIGHT])):
        response = client.get("/api/user/flights")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["departure_airport"] == "KPWK"


def test_list_flights_filter_by_aircraft(client):
    """GET /api/user/flights?aircraft_id=1 passes filter to DB."""
    mock_get = AsyncMock(return_value=[SAMPLE_FLIGHT])
    with patch("app.postgres_database.postgres_db.get_flights", mock_get):
        response = client.get("/api/user/flights?aircraft_id=1")
    assert response.status_code == 200
    mock_get.assert_called_once()
    call_kwargs = mock_get.call_args.kwargs
    assert call_kwargs.get("aircraft_id") == 1


def test_get_flight_by_id_found(client):
    """GET /api/user/flights/{id} returns flight when it exists."""
    with patch("app.postgres_database.postgres_db.get_flight_by_id", AsyncMock(return_value=SAMPLE_FLIGHT)):
        response = client.get("/api/user/flights/1")
    assert response.status_code == 200
    assert response.json()["id"] == 1


def test_get_flight_by_id_not_found(client):
    """GET /api/user/flights/{id} returns 404 when flight doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_flight_by_id", AsyncMock(return_value=None)):
        response = client.get("/api/user/flights/999")
    assert response.status_code == 404


def test_create_flight_minimal(client):
    """POST /api/user/flights creates a flight with minimal required fields."""
    with (
        patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=None)),
        patch("app.postgres_database.postgres_db.create_flight", AsyncMock(return_value=SAMPLE_FLIGHT)),
    ):
        response = client.post(
            "/api/user/flights",
            json={
                "date": "2025-01-15",
                "departure_airport": "KPWK",
                "arrival_airport": "KORD",
                "total_time": "1.2",
            },
        )
    assert response.status_code == 201
    assert response.json()["departure_airport"] == "KPWK"


def test_create_flight_with_invalid_aircraft(client):
    """POST /api/user/flights returns 404 if aircraft_id doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_aircraft_by_id", AsyncMock(return_value=None)):
        response = client.post(
            "/api/user/flights",
            json={
                "date": "2025-01-15",
                "aircraft_id": 999,
            },
        )
    assert response.status_code == 404


def test_create_flight_missing_date(client):
    """POST /api/user/flights returns 422 when date is missing."""
    response = client.post(
        "/api/user/flights",
        json={"departure_airport": "KPWK"},
    )
    assert response.status_code == 422


def test_update_flight_not_found(client):
    """PUT /api/user/flights/{id} returns 404 when flight doesn't exist."""
    with patch("app.postgres_database.postgres_db.get_flight_by_id", AsyncMock(return_value=None)):
        response = client.put("/api/user/flights/999", json={"pilot_comments": "great flight"})
    assert response.status_code == 404


def test_delete_flight_success(client):
    """DELETE /api/user/flights/{id} returns 204 on success."""
    with (
        patch("app.postgres_database.postgres_db.get_flight_by_id", AsyncMock(return_value=SAMPLE_FLIGHT)),
        patch("app.postgres_database.postgres_db.delete_flight", AsyncMock(return_value=True)),
    ):
        response = client.delete("/api/user/flights/1")
    assert response.status_code == 204


def test_delete_flight_not_found(client):
    """DELETE /api/user/flights/{id} returns 404 when flight doesn't exist."""
    with patch("app.postgres_database.postgres_db.delete_flight", AsyncMock(return_value=False)):
        response = client.delete("/api/user/flights/999")
    assert response.status_code == 404


def test_get_flight_summary(client):
    """GET /api/user/flights/summary returns summary data."""
    mock_summary = {
        "total_flights": 10,
        "total_hours": "42.5",
        "pic_hours": "20.0",
        "sic_hours": "0.0",
        "night_hours": "3.0",
        "cross_country_hours": "15.0",
        "actual_instrument_hours": "2.0",
        "simulated_instrument_hours": "3.0",
        "simulator_hours": "0.0",
        "dual_received_hours": "22.5",
        "dual_given_hours": "0.0",
        "complex_hours": "0.0",
        "high_performance_hours": "0.0",
        "total_landings": 15,
        "night_landings": 2,
    }
    with patch("app.postgres_database.postgres_db.get_flight_summary", AsyncMock(return_value=mock_summary)):
        response = client.get("/api/user/flights/summary")
    assert response.status_code == 200
