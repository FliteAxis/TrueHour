"""User data management endpoints (save/load/delete)."""

import json
import uuid
from datetime import date, datetime
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
    onboarding_completed: bool = False  # Track whether user completed onboarding
    target_certification: Optional[str] = None  # Current target certification (private, ir, cpl, cfi)
    enable_faa_lookup: bool = True  # Enable/disable FAA aircraft lookup during imports
    # Training configuration
    training_pace_mode: Optional[str] = "manual"  # 'auto' or 'manual'
    training_hours_per_week: Optional[float] = 2.0  # Expected training hours per week
    default_training_aircraft_id: Optional[int] = None  # Default aircraft for training
    ground_instruction_rate: Optional[float] = None  # Hourly rate for ground instruction
    budget_buffer_percentage: Optional[int] = 10  # Buffer % for budget calculations
    budget_categories: Optional[List[str]] = None  # Custom budget categories


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


def _safe_date(value: Any) -> Optional[date]:
    """Safely convert value to date."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            # Try parsing ISO format (YYYY-MM-DD)
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            try:
                # Try parsing M/D/YYYY format (common in CSV)
                return datetime.strptime(value, "%m/%d/%Y").date()
            except ValueError:
                return None
    return None


def _is_simulator(tail_number: str) -> bool:
    """Check if aircraft ID is a simulator."""
    if not tail_number:
        return False
    lower = tail_number.lower()
    return lower.startswith(("sim", "fsx", "x-plane", "aatd", "batd", "pfcmfd", "ftd"))


def _is_us_aircraft(tail_number: str) -> bool:
    """Check if aircraft is US registered (N-number)."""
    if not tail_number:
        return False
    return tail_number.upper().startswith("N") and len(tail_number) >= 2


def _extract_foreflight_aircraft_data(flights_data: List[Dict], tail_number: str) -> Dict:
    """Extract aircraft data from ForeFlight flights."""
    # Find first flight with this tail that has make/model
    for flight in flights_data:
        if flight.get("AircraftID") == tail_number:
            make = flight.get("Make", "")
            model = flight.get("Model", "")
            year = flight.get("Year")

            if make or model:
                return {
                    "make": make if make else None,
                    "model": model if model else None,
                    "year": int(year) if year and str(year).isdigit() else None,
                    "type_code": None,
                    "gear_type": None,
                    "engine_type": None,
                    "aircraft_class": None,
                }

    return {
        "make": None,
        "model": None,
        "year": None,
        "type_code": None,
        "gear_type": None,
        "engine_type": None,
        "aircraft_class": None,
    }


async def _lookup_faa_aircraft(tail_number: str, enable_faa_lookup: bool = True) -> Optional[Dict]:
    """Lookup aircraft from FAA database."""
    # Check if FAA lookup is disabled via settings or environment variable
    import os

    if not enable_faa_lookup:
        print("[FAA Lookup] Disabled via user settings")
        return None

    if os.getenv("DISABLE_FAA_LOOKUP", "false").lower() == "true":
        print("[FAA Lookup] Disabled via DISABLE_FAA_LOOKUP env var")
        return None

    try:
        # Import db and normalize_tail from main
        from app.main import db, normalize_tail
        from app.utils.gear_inference import infer_gear_type, should_be_complex, should_be_high_performance

        if db is None:
            return None

        normalized = normalize_tail(tail_number)
        if not normalized:
            return None

        aircraft = db.lookup(normalized)
        if aircraft:
            make = aircraft.manufacturer
            model = aircraft.model

            # Infer gear type and characteristics from make/model
            gear_type = infer_gear_type(make, model)

            return {
                "make": make,
                "model": model,
                "year": int(aircraft.year_mfr) if aircraft.year_mfr and str(aircraft.year_mfr).isdigit() else None,
                "type_code": aircraft.series,
                "engine_type": aircraft.engine_type,
                "aircraft_class": aircraft.aircraft_type,
                "gear_type": gear_type,
                "is_complex": should_be_complex(make, model, gear_type),
                "is_high_performance": should_be_high_performance(make, model),
            }
    except Exception as e:
        print(f"[FAA Lookup] Error looking up {tail_number}: {e}")

    return None


async def _create_user_aircraft(conn: Any, tail_number: str, aircraft_data: Dict, data_source: str) -> int:
    """Create aircraft record and return ID."""
    result = await conn.fetchrow(
        """
        INSERT INTO aircraft (
            tail_number, make, model, year, type_code,
            gear_type, engine_type, aircraft_class,
            is_complex, is_taa, is_high_performance, is_simulator,
            category, data_source, faa_last_checked, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
        """,
        tail_number,
        aircraft_data.get("make"),
        aircraft_data.get("model"),
        aircraft_data.get("year"),
        aircraft_data.get("type_code"),
        aircraft_data.get("gear_type"),
        aircraft_data.get("engine_type"),
        aircraft_data.get("aircraft_class"),
        aircraft_data.get("is_complex", False),
        aircraft_data.get("is_taa", False),
        aircraft_data.get("is_high_performance", False),
        _is_simulator(tail_number),
        "rental",  # default category
        data_source,  # "faa" or "foreflight"
        datetime.now() if data_source == "faa" else None,  # faa_last_checked
        True,  # is_active
    )

    return result["id"]


async def _extract_and_import_aircraft(
    conn: Any,
    flights_data: List[Dict[str, Any]],
    enable_faa_lookup: bool = True,
    aircraft_table_data: Optional[Dict[str, Dict]] = None,
) -> Dict[str, int]:
    """
    Extract unique aircraft from flights and create aircraft records.

    Args:
        conn: Database connection
        flights_data: List of flight records
        enable_faa_lookup: Whether to enable FAA registry lookups
        aircraft_table_data: Optional dict mapping tail_number -> ForeFlight aircraft data

    Returns mapping of tail_number -> aircraft_id.
    """
    aircraft_map = {}
    unique_tails = set()
    unique_simulators = set()

    # Phase 1: Extract unique tail numbers (separate aircraft from simulators)
    for flight in flights_data:
        tail = flight.get("AircraftID")
        if tail:
            if _is_simulator(tail):
                unique_simulators.add(tail)
            else:
                unique_tails.add(tail)

    print(f"[Aircraft Import] Found {len(unique_tails)} aircraft and {len(unique_simulators)} simulators in flights")

    # Phase 2: Process each aircraft
    for tail_number in unique_tails:
        # Check if already exists
        existing = await conn.fetchrow("SELECT id FROM aircraft WHERE UPPER(tail_number) = UPPER($1)", tail_number)

        if existing:
            aircraft_map[tail_number] = existing["id"]
            print(f"[Aircraft Import] {tail_number} already exists (ID: {existing['id']})")
            continue

        # Gather ForeFlight data from Aircraft Table or flights
        if aircraft_table_data and tail_number in aircraft_table_data:
            # Use data from Aircraft Table (preferred)
            ac_row = aircraft_table_data[tail_number]
            ff_data = {
                "make": ac_row.get("Make") or None,
                "model": ac_row.get("Model") or None,
                "year": int(ac_row.get("Year")) if ac_row.get("Year") and str(ac_row.get("Year")).isdigit() else None,
                "type_code": ac_row.get("TypeCode") or None,
                "gear_type": ac_row.get("GearType") or None,
                "engine_type": ac_row.get("EngineType") or None,
                "aircraft_class": ac_row.get("aircraftClass (FAA)") or None,
            }
        else:
            # Fallback to extracting from flights
            ff_data = _extract_foreflight_aircraft_data(flights_data, tail_number)

        # Try FAA lookup first (if US aircraft and FAA lookup enabled)
        aircraft_data = None
        data_source = "foreflight"

        if _is_us_aircraft(tail_number) and enable_faa_lookup:
            aircraft_data = await _lookup_faa_aircraft(tail_number, enable_faa_lookup)
            if aircraft_data:
                data_source = "faa"
                print(f"[Aircraft Import] {tail_number}: Found FAA data")
            else:
                print(f"[Aircraft Import] {tail_number}: FAA lookup failed, using ForeFlight data")

        # Fallback to ForeFlight data
        if not aircraft_data:
            aircraft_data = ff_data
            data_source = "foreflight"

        # Only create if we have at least tail number
        if tail_number:
            try:
                aircraft_id = await _create_user_aircraft(conn, tail_number, aircraft_data, data_source)
                aircraft_map[tail_number] = aircraft_id
                print(f"[Aircraft Import] Created {tail_number} (ID: {aircraft_id}, Source: {data_source})")
            except Exception as e:
                print(f"[Aircraft Import] Failed to create {tail_number}: {e}")

    # Phase 3: Process simulator devices
    for sim_id in unique_simulators:
        # Check if already exists
        existing = await conn.fetchrow("SELECT id FROM aircraft WHERE UPPER(tail_number) = UPPER($1)", sim_id)

        if existing:
            aircraft_map[sim_id] = existing["id"]
            print(f"[Aircraft Import] Simulator {sim_id} already exists (ID: {existing['id']})")
            continue

        # Get ForeFlight data if available
        sim_data = {}
        if aircraft_table_data and sim_id in aircraft_table_data:
            ac_row = aircraft_table_data[sim_id]
            sim_data = {
                "make": ac_row.get("Make") or None,
                "model": ac_row.get("Model") or "Simulator",
                "type_code": ac_row.get("TypeCode") or "SIM",
                "is_simulator": True,
            }
        else:
            # Default simulator data
            sim_data = {
                "make": None,
                "model": "Simulator",
                "type_code": "SIM",
                "is_simulator": True,
            }

        try:
            aircraft_id = await _create_user_aircraft(conn, sim_id, sim_data, "manual")
            aircraft_map[sim_id] = aircraft_id
            print(f"[Aircraft Import] Created simulator {sim_id} (ID: {aircraft_id})")
        except Exception as e:
            print(f"[Aircraft Import] Failed to create simulator {sim_id}: {e}")

    return aircraft_map


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


async def _save_flights(conn: Any, flights_data: List[Dict[str, Any]]) -> int:
    """Save flight records to database."""
    count = 0
    print(f"[SAVE_FLIGHTS] Processing {len(flights_data)} flights")
    for flight in flights_data:
        print(f"[SAVE_FLIGHTS] Flight data: {flight}")

        # Look up aircraft by tail number
        aircraft_id = None
        tail_number = flight.get("AircraftID")
        if tail_number and not tail_number.lower().startswith(("sim", "fsx", "x-plane", "aatd", "batd", "pfcmfd")):
            aircraft_row = await conn.fetchrow(
                "SELECT id FROM aircraft WHERE UPPER(tail_number) = UPPER($1)", tail_number
            )
            if aircraft_row:
                aircraft_id = aircraft_row["id"]

        # Map ForeFlight CSV fields to database schema
        # ForeFlight uses capitalized field names like TotalTime, PIC, etc.
        # Custom fields use [Hours]Complex and [Hours]High Performance format
        await conn.execute(
            """
            INSERT INTO flights (
                aircraft_id, date, departure_airport, arrival_airport, route,
                total_time, pic_time, sic_time, night_time, solo_time,
                cross_country_time, actual_instrument_time, simulated_instrument_time,
                simulated_flight_time, dual_given_time, dual_received_time,
                complex_time, high_performance_time,
                day_takeoffs, day_landings_full_stop,
                night_takeoffs, night_landings_full_stop, all_landings,
                holds, approaches, instructor_name, pilot_comments,
                is_simulator_session, import_hash
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
            )
            """,
            aircraft_id,
            _safe_date(flight.get("Date")),
            flight.get("From"),
            flight.get("To"),
            flight.get("Route"),
            _safe_float(flight.get("TotalTime")),
            _safe_float(flight.get("PIC")),
            _safe_float(flight.get("SIC")),
            _safe_float(flight.get("Night")),
            _safe_float(flight.get("Solo")),
            _safe_float(flight.get("CrossCountry")),
            _safe_float(flight.get("ActualInstrument")),
            _safe_float(flight.get("SimulatedInstrument")),
            _safe_float(flight.get("SimulatedFlight")),
            _safe_float(flight.get("DualGiven")),
            _safe_float(flight.get("DualReceived")),
            _safe_float(flight.get("[Hours]Complex")),
            _safe_float(flight.get("[Hours]High Performance")),
            _safe_int(flight.get("DayTakeoffs")),
            _safe_int(flight.get("DayLandingsFullStop")),
            _safe_int(flight.get("NightTakeoffs")),
            _safe_int(flight.get("NightLandingsFullStop")),
            _safe_int(flight.get("AllLandings")),
            _safe_int(flight.get("Holds")),
            json.dumps(flight.get("Approaches")) if flight.get("Approaches") else None,
            flight.get("InstructorName"),
            flight.get("PilotComments"),
            flight.get("AircraftID", "").lower().startswith(("sim", "fsx", "x-plane", "aatd", "batd")),
            # Create unique hash from date + airports + time to prevent duplicates
            f"{flight.get('Date')}_{flight.get('From')}_{flight.get('To')}_{flight.get('TotalTime')}",
        )
        count += 1
    return count


@router.post("/save", status_code=200)
async def save_user_data(
    data: Optional[SaveDataRequest] = None, session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """Save current user state to database."""
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        async with postgres_db.acquire() as conn:
            # Fetch user settings to get enable_faa_lookup preference
            settings_row = await conn.fetchrow("SELECT enable_faa_lookup FROM user_settings ORDER BY id LIMIT 1")
            enable_faa_lookup = settings_row["enable_faa_lookup"] if settings_row else True

            # Extract and import aircraft from flights FIRST (before saving flights)
            # This ensures aircraft records exist when flights reference them
            imported_aircraft_count = 0
            if data and data.flights:
                aircraft_map = await _extract_and_import_aircraft(conn, data.flights, enable_faa_lookup)
                imported_aircraft_count = len(aircraft_map)

            aircraft_count = 0
            if data and data.aircraft:
                aircraft_count = await _save_aircraft(conn, data.aircraft)

            flights_count = 0
            if data and data.flights:
                flights_count = await _save_flights(conn, data.flights)

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
            "message": (
                f"Imported {imported_aircraft_count} aircraft from flights, "
                f"saved {aircraft_count} aircraft and {flights_count} flights"
            ),
            "session_id": session_id,
            "saved_at": datetime.now().isoformat(),
            "aircraft_imported": imported_aircraft_count,
            "aircraft_saved": aircraft_count,
            "flights_saved": flights_count,
        }
    except Exception as e:
        import traceback

        error_detail = f"Save failed: {str(e)}"
        print(f"[SAVE_ERROR] {error_detail}")
        print(f"[SAVE_ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail) from e


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
                    onboarding_completed=settings_row.get("onboarding_completed", False),
                    target_certification=settings_row.get("target_certification"),
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
                    onboarding_completed,
                    target_certification,
                    enable_faa_lookup,
                    training_pace_mode,
                    training_hours_per_week,
                    default_training_aircraft_id,
                    ground_instruction_rate,
                    budget_buffer_percentage,
                    budget_categories,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
                ON CONFLICT (id)
                DO UPDATE SET
                    auto_save_enabled = EXCLUDED.auto_save_enabled,
                    auto_save_interval = EXCLUDED.auto_save_interval,
                    default_aircraft_id = EXCLUDED.default_aircraft_id,
                    timezone = EXCLUDED.timezone,
                    budget_state = EXCLUDED.budget_state,
                    onboarding_completed = EXCLUDED.onboarding_completed,
                    target_certification = EXCLUDED.target_certification,
                    enable_faa_lookup = EXCLUDED.enable_faa_lookup,
                    training_pace_mode = EXCLUDED.training_pace_mode,
                    training_hours_per_week = EXCLUDED.training_hours_per_week,
                    default_training_aircraft_id = EXCLUDED.default_training_aircraft_id,
                    ground_instruction_rate = EXCLUDED.ground_instruction_rate,
                    budget_buffer_percentage = EXCLUDED.budget_buffer_percentage,
                    budget_categories = EXCLUDED.budget_categories,
                    updated_at = NOW()
            """,
                settings.auto_save_enabled,
                settings.auto_save_interval,
                settings.default_aircraft_id,
                settings.timezone,
                json.dumps(settings.budget_state) if settings.budget_state else None,
                settings.onboarding_completed,
                settings.target_certification,
                settings.enable_faa_lookup,
                settings.training_pace_mode,
                settings.training_hours_per_week,
                settings.default_training_aircraft_id,
                settings.ground_instruction_rate,
                settings.budget_buffer_percentage,
                json.dumps(settings.budget_categories) if settings.budget_categories else None,
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
            # Order matters: delete child tables before parent tables due to foreign keys
            await conn.execute("DELETE FROM chat_history")
            await conn.execute("DELETE FROM expense_budget_links")  # Links first (has FKs to both)
            await conn.execute("DELETE FROM budget_entries")
            await conn.execute("DELETE FROM budgets")
            await conn.execute("DELETE FROM budget_cards")  # Budget cards
            await conn.execute("DELETE FROM reminders")
            await conn.execute("DELETE FROM flights")
            await conn.execute("DELETE FROM expenses")
            await conn.execute("DELETE FROM aircraft")
            await conn.execute("DELETE FROM import_history")  # ForeFlight import tracking
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

                # Parse budget_categories if it exists
                budget_categories = None
                if settings_row.get("budget_categories"):
                    budget_categories = (
                        json.loads(settings_row["budget_categories"])
                        if isinstance(settings_row["budget_categories"], str)
                        else settings_row["budget_categories"]
                    )

                return UserSettings(
                    auto_save_enabled=settings_row["auto_save_enabled"],
                    auto_save_interval=settings_row["auto_save_interval"],
                    default_aircraft_id=settings_row["default_aircraft_id"],
                    timezone=settings_row["timezone"],
                    budget_state=budget_state,
                    onboarding_completed=settings_row.get("onboarding_completed", False),
                    target_certification=settings_row.get("target_certification"),
                    enable_faa_lookup=settings_row.get("enable_faa_lookup", True),
                    training_pace_mode=settings_row.get("training_pace_mode", "manual"),
                    training_hours_per_week=settings_row.get("training_hours_per_week", 2.0),
                    default_training_aircraft_id=settings_row.get("default_training_aircraft_id"),
                    ground_instruction_rate=settings_row.get("ground_instruction_rate"),
                    budget_buffer_percentage=settings_row.get("budget_buffer_percentage", 10),
                    budget_categories=budget_categories,
                )
            # Return defaults if no settings exist
            return UserSettings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}") from e
