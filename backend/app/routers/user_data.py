"""User data management endpoints (save/load/delete)."""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/user", tags=["User Data"])


class UserSettings(BaseModel):
    """User settings model."""

    auto_save_enabled: bool = True
    auto_save_interval: int = Field(default=3000, ge=1000, le=10000)
    default_aircraft_id: Optional[int] = None
    timezone: str = "America/New_York"
    budget_state: Optional[Dict[str, Any]] = None  # Phase 3: certification, hours, settings


class UserDataResponse(BaseModel):
    """Complete user data response."""

    aircraft: List[Dict[str, Any]]
    expenses: List[Dict[str, Any]]
    flights: List[Dict[str, Any]]
    settings: UserSettings
    last_saved_at: Optional[datetime] = None


class DeleteConfirmation(BaseModel):
    """Delete confirmation payload."""

    confirm_text: str = Field(..., description="Must be 'DELETE' to confirm")


class SaveDataRequest(BaseModel):
    """Save data request payload."""

    aircraft: List[Dict[str, Any]] = []
    expenses: List[Dict[str, Any]] = []
    flights: List[Dict[str, Any]] = []
    budget_state: Optional[Dict[str, Any]] = None  # Phase 3: certification, hours, settings


def _safe_int(value: Any) -> Optional[int]:
    """Safely convert value to int."""
    if not value:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _safe_float(value: Any) -> Optional[float]:
    """Safely convert value to float."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


async def _save_aircraft(conn: Any, aircraft_data: List[Dict[str, Any]]) -> int:
    """Save aircraft data to database."""
    count = 0
    for ac in aircraft_data:
        await conn.execute(
            """
            INSERT INTO aircraft (
                tail_number, make, model, year, category,
                hourly_rate_wet, hourly_rate_dry, notes, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            ON CONFLICT (tail_number)
            DO UPDATE SET
                make = EXCLUDED.make,
                model = EXCLUDED.model,
                year = EXCLUDED.year,
                category = EXCLUDED.category,
                hourly_rate_wet = EXCLUDED.hourly_rate_wet,
                hourly_rate_dry = EXCLUDED.hourly_rate_dry,
                notes = EXCLUDED.notes,
                updated_at = NOW()
        """,
            ac.get("registration"),
            ac.get("make"),
            ac.get("model"),
            _safe_int(ac.get("year")),
            ac.get("type", "owned"),
            _safe_float(ac.get("wetRate")),
            _safe_float(ac.get("dryRate")),
            ac.get("notes"),
        )
        count += 1
    return count


async def _save_budget_state(conn: Any, budget_state: Dict[str, Any]) -> None:
    """Save budget state to user settings."""
    settings_row = await conn.fetchrow("SELECT id FROM user_settings ORDER BY id LIMIT 1")
    budget_json = json.dumps(budget_state)

    if settings_row:
        await conn.execute(
            "UPDATE user_settings SET budget_state = $1::jsonb, updated_at = NOW() WHERE id = $2",
            budget_json,
            settings_row["id"],
        )
    else:
        await conn.execute(
            """
            INSERT INTO user_settings (auto_save_enabled, auto_save_interval, timezone, budget_state, updated_at)
            VALUES (true, 3000, 'America/New_York', $1::jsonb, NOW())
            """,
            budget_json,
        )


@router.post("/save", status_code=200)
async def save_user_data(
    data: Optional[SaveDataRequest] = None, session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """Save current user state to database."""
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        async with postgres_db.acquire() as conn:
            aircraft_count = 0
            if data and data.aircraft:
                aircraft_count = await _save_aircraft(conn, data.aircraft)

            if data and data.budget_state:
                await _save_budget_state(conn, data.budget_state)

            await conn.execute(
                """
                INSERT INTO user_sessions (session_id, last_saved_at)
                VALUES ($1, NOW())
                ON CONFLICT (session_id)
                DO UPDATE SET last_saved_at = NOW()
                """,
                session_id,
            )

        return {
            "status": "success",
            "message": f"Saved {aircraft_count} aircraft",
            "session_id": session_id,
            "saved_at": datetime.now().isoformat(),
            "aircraft_saved": aircraft_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}") from e


@router.get("/load", response_model=UserDataResponse)
async def load_user_data(session_id: Optional[str] = Header(None, alias="X-Session-ID")):
    """
    Load complete user data from database.

    Returns all aircraft, expenses, and user settings.
    """

    try:
        # Get all aircraft from database
        aircraft_rows = await postgres_db.get_user_aircraft(is_active=True)

        # Transform to frontend format (database snake_case -> frontend camelCase)
        aircraft_list = []
        for ac in aircraft_rows:
            aircraft_list.append(
                {
                    "id": f"aircraft-{ac['id']}",  # Convert DB id to frontend format
                    "registration": ac["tail_number"],
                    "make": ac["make"] or "",
                    "model": ac["model"] or "",
                    "year": ac["year"] or "",
                    "type": ac["category"] or "owned",
                    "wetRate": float(ac["hourly_rate_wet"]) if ac["hourly_rate_wet"] else 0,
                    "dryRate": float(ac["hourly_rate_dry"]) if ac["hourly_rate_dry"] else 0,
                    "notes": ac["notes"] or "",
                    "source": "database",
                    "createdAt": ac["created_at"].isoformat() if ac["created_at"] else None,
                    "updatedAt": ac["updated_at"].isoformat() if ac["updated_at"] else None,
                }
            )

        # Get all expenses (last 1000)
        expenses_list = await postgres_db.get_expenses(limit=1000, offset=0)

        # Get all flights (last 1000)
        flights_list = await postgres_db.get_flights(limit=1000, offset=0)

        # Get user settings
        async with postgres_db.acquire() as conn:
            settings_row = await conn.fetchrow("SELECT * FROM user_settings ORDER BY id DESC LIMIT 1")

            if settings_row:
                budget_state = None
                if settings_row.get("budget_state"):
                    budget_state = (
                        json.loads(settings_row["budget_state"])
                        if isinstance(settings_row["budget_state"], str)
                        else settings_row["budget_state"]
                    )

                settings = UserSettings(
                    auto_save_enabled=settings_row["auto_save_enabled"],
                    auto_save_interval=settings_row["auto_save_interval"],
                    default_aircraft_id=settings_row["default_aircraft_id"],
                    timezone=settings_row["timezone"],
                    budget_state=budget_state,
                )
            else:
                # Create default settings if none exist
                await conn.execute(
                    """
                    INSERT INTO user_settings (auto_save_enabled, auto_save_interval, timezone)
                    VALUES (true, 3000, 'America/New_York')
                """
                )
                settings = UserSettings()

            # Get last saved timestamp
            last_saved_at = None
            if session_id:
                session_row = await conn.fetchrow(
                    "SELECT last_saved_at FROM user_sessions WHERE session_id = $1", session_id
                )
                if session_row:
                    last_saved_at = session_row["last_saved_at"]

        return UserDataResponse(
            aircraft=aircraft_list,
            expenses=expenses_list,
            flights=flights_list,
            settings=settings,
            last_saved_at=last_saved_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Load failed: {str(e)}") from e


@router.put("/settings", response_model=UserSettings)
async def update_user_settings(settings: UserSettings):
    """Update user settings (auto-save preferences, default aircraft, etc.)."""
    try:
        async with postgres_db.acquire() as conn:
            # Update or insert settings
            await conn.execute(
                """
                INSERT INTO user_settings (
                    auto_save_enabled,
                    auto_save_interval,
                    default_aircraft_id,
                    timezone,
                    budget_state,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (id)
                DO UPDATE SET
                    auto_save_enabled = EXCLUDED.auto_save_enabled,
                    auto_save_interval = EXCLUDED.auto_save_interval,
                    default_aircraft_id = EXCLUDED.default_aircraft_id,
                    timezone = EXCLUDED.timezone,
                    budget_state = EXCLUDED.budget_state,
                    updated_at = NOW()
            """,
                settings.auto_save_enabled,
                settings.auto_save_interval,
                settings.default_aircraft_id,
                settings.timezone,
                json.dumps(settings.budget_state) if settings.budget_state else None,
            )

        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Settings update failed: {str(e)}") from e


@router.delete("/data", status_code=200)
async def delete_all_user_data(
    confirmation: DeleteConfirmation, session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    Delete ALL user data from database (development/testing only).

    Requires confirmation text "DELETE" to proceed.
    This is a destructive operation that cannot be undone.
    """

    # Verify confirmation text
    if confirmation.confirm_text != "DELETE":
        raise HTTPException(status_code=400, detail="Confirmation text must be exactly 'DELETE'")

    try:
        async with postgres_db.acquire() as conn:
            # Delete all user data (cascading deletes will handle related records)
            await conn.execute("DELETE FROM chat_history")
            await conn.execute("DELETE FROM budget_entries")
            await conn.execute("DELETE FROM budgets")
            await conn.execute("DELETE FROM reminders")
            await conn.execute("DELETE FROM flights")
            await conn.execute("DELETE FROM expenses")
            await conn.execute("DELETE FROM aircraft")
            await conn.execute("DELETE FROM user_sessions")
            await conn.execute("DELETE FROM user_settings")

            # Log deletion event (timestamp only)
            print(f"[DELETE_ALL_DATA] All user data deleted at {datetime.now().isoformat()}")

        return {
            "status": "success",
            "message": "All user data deleted successfully",
            "deleted_at": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}") from e


@router.get("/settings", response_model=UserSettings)
async def get_user_settings():
    """Get current user settings."""
    try:
        async with postgres_db.acquire() as conn:
            settings_row = await conn.fetchrow("SELECT * FROM user_settings ORDER BY id DESC LIMIT 1")

            if settings_row:
                budget_state = None
                if settings_row.get("budget_state"):
                    budget_state = (
                        json.loads(settings_row["budget_state"])
                        if isinstance(settings_row["budget_state"], str)
                        else settings_row["budget_state"]
                    )

                return UserSettings(
                    auto_save_enabled=settings_row["auto_save_enabled"],
                    auto_save_interval=settings_row["auto_save_interval"],
                    default_aircraft_id=settings_row["default_aircraft_id"],
                    timezone=settings_row["timezone"],
                    budget_state=budget_state,
                )
            # Return defaults if no settings exist
            return UserSettings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}") from e
