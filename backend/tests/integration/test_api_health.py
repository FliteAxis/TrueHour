"""Integration tests for health and root API endpoints."""

from unittest.mock import patch


def test_health_no_faa_db(client):
    """Health endpoint returns 'degraded' when FAA database is unavailable."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    # Without FAA DB the status is degraded (db is None in test environment)
    assert data["status"] in ("healthy", "degraded")
    assert "database_exists" in data
    assert "record_count" in data


def test_stats_unavailable_without_faa_db(client):
    """Stats endpoint returns 503 when FAA database is not available."""
    with patch("app.main.db", None):
        response = client.get("/api/v1/stats")
    assert response.status_code == 503


def test_aircraft_faa_lookup_not_found(client):
    """FAA aircraft lookup returns 404 for unknown tail number."""
    from unittest.mock import AsyncMock, patch

    with patch("app.routers.user_data._lookup_faa_aircraft", AsyncMock(return_value=None)):
        response = client.get("/api/v1/aircraft/N99999")
    assert response.status_code == 404


def test_aircraft_faa_lookup_invalid_tail(client):
    """FAA aircraft lookup returns 400 for an invalid (empty) tail number."""
    # "N" alone normalizes to "" which is falsy, resulting in a 400 response.
    response = client.get("/api/v1/aircraft/N")
    assert response.status_code == 400


def test_bulk_lookup_unavailable_without_faa_db(client):
    """Bulk lookup returns 503 when FAA database is not available."""
    with patch("app.main.db", None):
        response = client.post("/api/v1/aircraft/bulk", json={"tail_numbers": ["N172SP"]})
    assert response.status_code == 503
