"""
Integration test fixtures.
Each test module can further mock postgres_db methods for specific endpoints.

These tests require the full backend dependencies (fastapi, asyncpg, pydantic).
In CI they are installed via `pip install -r backend/requirements.txt`.
Locally, activate the project venv that has the full deps.
"""

import pytest

# Skip the entire integration suite if backend deps are not installed
pytest.importorskip("asyncpg", reason="asyncpg required; install backend/requirements.txt")
pytest.importorskip("fastapi", reason="fastapi required; install backend/requirements.txt")


@pytest.fixture
def mock_db():
    """
    Returns the live postgres_db singleton with a helper to set method return values.
    Patch individual methods per-test with AsyncMock.
    """
    from app.postgres_database import postgres_db

    return postgres_db
