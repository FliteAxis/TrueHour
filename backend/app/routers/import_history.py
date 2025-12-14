"""Import history endpoints for tracking ForeFlight CSV imports."""

import json
from datetime import datetime
from typing import Any, Dict, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/import-history", tags=["Import History"])


class ImportHistoryCreate(BaseModel):
    """Create import history record."""

    import_type: str  # 'foreflight_csv', 'manual_entry'
    file_name: Optional[str] = None
    flights_imported: int = 0
    hours_imported: Dict[str, Any]  # {total: 120.5, pic: 100.0, instrument: 8.5, ...}
    notes: Optional[str] = None


class ImportHistoryResponse(BaseModel):
    """Import history response."""

    id: int
    import_type: str
    file_name: Optional[str]
    flights_imported: int
    hours_imported: Dict[str, Any]
    import_date: datetime
    notes: Optional[str]


@router.post("/", response_model=ImportHistoryResponse, status_code=201)
async def create_import_history(data: ImportHistoryCreate):
    """
    Save import history record.

    Tracks ForeFlight CSV imports for hour reconciliation and progress tracking.
    """
    try:
        async with postgres_db.acquire() as conn:
            # Convert hours_imported dict to JSON
            hours_json = json.dumps(data.hours_imported)

            row = await conn.fetchrow(
                """
                INSERT INTO import_history (
                    import_type, file_name, flights_imported, hours_imported, notes
                )
                VALUES ($1, $2, $3, $4::jsonb, $5)
                RETURNING id, import_type, file_name, flights_imported,
                          hours_imported, import_date, notes
                """,
                data.import_type,
                data.file_name,
                data.flights_imported,
                hours_json,
                data.notes,
            )

            return ImportHistoryResponse(
                id=row["id"],
                import_type=row["import_type"],
                file_name=row["file_name"],
                flights_imported=row["flights_imported"],
                hours_imported=(
                    json.loads(row["hours_imported"])
                    if isinstance(row["hours_imported"], str)
                    else row["hours_imported"]
                ),
                import_date=row["import_date"],
                notes=row["notes"],
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save import history: {str(e)}") from e


@router.get("/latest", response_model=Optional[ImportHistoryResponse])
async def get_latest_import():
    """Get the most recent import history record."""
    try:
        async with postgres_db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, import_type, file_name, flights_imported,
                       hours_imported, import_date, notes
                FROM import_history
                ORDER BY import_date DESC
                LIMIT 1
                """
            )

            if not row:
                return None

            return ImportHistoryResponse(
                id=row["id"],
                import_type=row["import_type"],
                file_name=row["file_name"],
                flights_imported=row["flights_imported"],
                hours_imported=(
                    json.loads(row["hours_imported"])
                    if isinstance(row["hours_imported"], str)
                    else row["hours_imported"]
                ),
                import_date=row["import_date"],
                notes=row["notes"],
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get latest import: {str(e)}") from e


@router.get("/", response_model=list[ImportHistoryResponse])
async def list_import_history(limit: int = 10, offset: int = 0):
    """List import history records."""
    try:
        async with postgres_db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, import_type, file_name, flights_imported,
                       hours_imported, import_date, notes
                FROM import_history
                ORDER BY import_date DESC
                LIMIT $1 OFFSET $2
                """,
                limit,
                offset,
            )

            return [
                ImportHistoryResponse(
                    id=row["id"],
                    import_type=row["import_type"],
                    file_name=row["file_name"],
                    flights_imported=row["flights_imported"],
                    hours_imported=(
                        json.loads(row["hours_imported"])
                        if isinstance(row["hours_imported"], str)
                        else row["hours_imported"]
                    ),
                    import_date=row["import_date"],
                    notes=row["notes"],
                )
                for row in rows
            ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list import history: {str(e)}") from e
