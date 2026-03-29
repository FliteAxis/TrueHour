"""
Shared pytest fixtures for TrueHour backend tests.

Mocks PostgreSQL so tests run without a real database.
"""

import os
import sys
from unittest.mock import AsyncMock, patch

import pytest

# Ensure backend/ is on sys.path so `import app.*` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(scope="session")
def patch_pg_lifecycle():
    """
    Prevent real PostgreSQL connections during the test session.
    Imports the modules lazily then patches connect/close so the
    FastAPI lifespan completes cleanly.
    """
    import app.db_migrations  # noqa: F401
    import app.postgres_database  # noqa: F401 - force import before patching

    with (
        patch("app.postgres_database.postgres_db.connect", new=AsyncMock()),
        patch("app.postgres_database.postgres_db.close", new=AsyncMock()),
        patch("app.db_migrations.verify_and_migrate_schema", new=AsyncMock(return_value=[])),
    ):
        yield


@pytest.fixture
def client(patch_pg_lifecycle):
    """TestClient with mocked PostgreSQL lifecycle."""
    from app.main import app
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c
