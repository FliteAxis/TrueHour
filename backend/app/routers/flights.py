"""Flight management endpoints."""

import csv
import io
import json
from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Annotated, List, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field, condecimal

router = APIRouter(prefix="/api/flights", tags=["Flights"])


class FlightCreate(BaseModel):
    """Create flight."""

    aircraft_id: Optional[int] = Field(None, description="Associated aircraft ID")
    date: date_type
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    route: Optional[str] = None
    time_out: Optional[str] = None
    time_off: Optional[str] = None
    time_on: Optional[str] = None
    time_in: Optional[str] = None
    total_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    pic_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    sic_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    night_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    solo_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    cross_country_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    actual_instrument_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    simulated_instrument_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    simulated_flight_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    dual_given_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    dual_received_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    ground_training_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    complex_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    high_performance_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    hobbs_start: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    hobbs_end: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    tach_start: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    tach_end: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    day_takeoffs: int = 0
    day_landings_full_stop: int = 0
    night_takeoffs: int = 0
    night_landings_full_stop: int = 0
    all_landings: int = 0
    holds: int = 0
    approaches: Optional[dict] = None
    instructor_name: Optional[str] = None
    instructor_comments: Optional[str] = None
    pilot_comments: Optional[str] = None
    is_flight_review: bool = False
    is_ipc: bool = False
    is_checkride: bool = False
    is_simulator_session: bool = False
    fuel_gallons: Optional[Annotated[Decimal, condecimal(max_digits=6, decimal_places=2)]] = None
    fuel_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    landing_fees: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    instructor_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    rental_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    other_costs: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None


class FlightUpdate(BaseModel):
    """Update flight (all fields optional)."""

    aircraft_id: Optional[int] = None
    date: Optional[date_type] = None
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    route: Optional[str] = None
    time_out: Optional[str] = None
    time_off: Optional[str] = None
    time_on: Optional[str] = None
    time_in: Optional[str] = None
    total_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    pic_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    sic_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    night_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    solo_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    cross_country_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    actual_instrument_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    simulated_instrument_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    simulated_flight_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    dual_given_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    dual_received_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    ground_training_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    complex_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    high_performance_time: Optional[Annotated[Decimal, condecimal(max_digits=5, decimal_places=2)]] = None
    hobbs_start: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    hobbs_end: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    tach_start: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    tach_end: Optional[Annotated[Decimal, condecimal(max_digits=8, decimal_places=2)]] = None
    day_takeoffs: Optional[int] = None
    day_landings_full_stop: Optional[int] = None
    night_takeoffs: Optional[int] = None
    night_landings_full_stop: Optional[int] = None
    all_landings: Optional[int] = None
    holds: Optional[int] = None
    approaches: Optional[dict] = None
    instructor_name: Optional[str] = None
    instructor_comments: Optional[str] = None
    pilot_comments: Optional[str] = None
    is_flight_review: Optional[bool] = None
    is_ipc: Optional[bool] = None
    is_checkride: Optional[bool] = None
    is_simulator_session: Optional[bool] = None
    fuel_gallons: Optional[Annotated[Decimal, condecimal(max_digits=6, decimal_places=2)]] = None
    fuel_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    landing_fees: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    instructor_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    rental_cost: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    other_costs: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None


class FlightResponse(BaseModel):
    """Flight response."""

    id: int
    aircraft_id: Optional[int] = None
    tail_number: Optional[str] = None
    date: date_type
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    route: Optional[str] = None
    time_out: Optional[str] = None
    time_off: Optional[str] = None
    time_on: Optional[str] = None
    time_in: Optional[str] = None
    total_time: Optional[Decimal] = None
    pic_time: Optional[Decimal] = None
    sic_time: Optional[Decimal] = None
    night_time: Optional[Decimal] = None
    solo_time: Optional[Decimal] = None
    cross_country_time: Optional[Decimal] = None
    actual_instrument_time: Optional[Decimal] = None
    simulated_instrument_time: Optional[Decimal] = None
    simulated_flight_time: Optional[Decimal] = None
    dual_given_time: Optional[Decimal] = None
    dual_received_time: Optional[Decimal] = None
    ground_training_time: Optional[Decimal] = None
    complex_time: Optional[Decimal] = None
    high_performance_time: Optional[Decimal] = None
    hobbs_start: Optional[Decimal] = None
    hobbs_end: Optional[Decimal] = None
    tach_start: Optional[Decimal] = None
    tach_end: Optional[Decimal] = None
    day_takeoffs: int = 0
    day_landings_full_stop: int = 0
    night_takeoffs: int = 0
    night_landings_full_stop: int = 0
    all_landings: int = 0
    holds: int = 0
    approaches: Optional[dict] = None
    instructor_name: Optional[str] = None
    instructor_comments: Optional[str] = None
    pilot_comments: Optional[str] = None
    is_flight_review: bool = False
    is_ipc: bool = False
    is_checkride: bool = False
    is_simulator_session: bool = False
    fuel_gallons: Optional[Decimal] = None
    fuel_cost: Optional[Decimal] = None
    landing_fees: Optional[Decimal] = None
    instructor_cost: Optional[Decimal] = None
    rental_cost: Optional[Decimal] = None
    other_costs: Optional[Decimal] = None
    import_hash: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "json_schema_extra": {"exclude_none": False}}


class FlightSummary(BaseModel):
    """Flight summary statistics."""

    total_flights: int
    total_hours: Decimal
    pic_hours: Decimal
    sic_hours: Decimal
    night_hours: Decimal
    cross_country_hours: Decimal
    actual_instrument_hours: Decimal
    simulated_instrument_hours: Decimal
    simulator_hours: Decimal
    dual_received_hours: Decimal
    dual_given_hours: Decimal
    complex_hours: Decimal
    high_performance_hours: Decimal
    total_landings: int
    night_landings: int


@router.get("", response_model=List[FlightResponse], response_model_exclude_none=False)
async def list_flights(
    aircraft_id: Optional[int] = Query(None, description="Filter by aircraft ID"),
    start_date: Optional[date_type] = Query(None, description="Filter by start date"),
    end_date: Optional[date_type] = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """List flights with optional filters."""
    flights = await postgres_db.get_flights(
        aircraft_id=aircraft_id, start_date=start_date, end_date=end_date, limit=limit, offset=offset
    )
    return flights


@router.get("/summary", response_model=FlightSummary)
async def get_flight_summary(
    start_date: Optional[date_type] = Query(None, description="Summary start date"),
    end_date: Optional[date_type] = Query(None, description="Summary end date"),
):
    """Get flight summary statistics."""
    summary = await postgres_db.get_flight_summary(start_date=start_date, end_date=end_date)
    return summary


@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(flight_id: int):
    """Get single flight by ID."""
    flight = await postgres_db.get_flight_by_id(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@router.post("", response_model=FlightResponse, status_code=201)
async def create_flight(flight: FlightCreate):
    """Create new flight."""
    # If aircraft_id is provided, verify it exists
    if flight.aircraft_id:
        aircraft = await postgres_db.get_aircraft_by_id(flight.aircraft_id)
        if not aircraft:
            raise HTTPException(status_code=404, detail=f"Aircraft with ID {flight.aircraft_id} not found")

    try:
        created = await postgres_db.create_flight(flight.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{flight_id}", response_model=FlightResponse)
async def update_flight(flight_id: int, flight: FlightUpdate):
    """Update flight."""
    # Check if flight exists
    existing = await postgres_db.get_flight_by_id(flight_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Flight not found")

    # If updating aircraft_id, verify it exists
    if flight.aircraft_id:
        aircraft = await postgres_db.get_aircraft_by_id(flight.aircraft_id)
        if not aircraft:
            raise HTTPException(status_code=404, detail=f"Aircraft with ID {flight.aircraft_id} not found")

    try:
        # Filter out None values
        update_data = {k: v for k, v in flight.model_dump().items() if v is not None}
        updated = await postgres_db.update_flight(flight_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Flight not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{flight_id}", status_code=204)
async def delete_flight(flight_id: int):
    """Delete flight."""
    success = await postgres_db.delete_flight(flight_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flight not found")
    return None


class AircraftCreated(BaseModel):
    """Aircraft created during import."""

    id: int
    tail_number: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    data_source: Optional[str] = None


class ImportResult(BaseModel):
    """Result of CSV import."""

    imported: int
    skipped: int
    errors: List[str]
    aircraft_created: Optional[List[AircraftCreated]] = None


def _safe_float(value) -> Optional[float]:
    """Convert value to float, return None if invalid."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_int(value) -> int:
    """Convert value to int, return 0 if invalid."""
    if value is None or value == "":
        return 0
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 0


def _safe_date(value) -> Optional[date_type]:
    """Convert value to date object, return None if invalid."""
    if value is None or value == "":
        return None
    try:
        # Try parsing as datetime first
        dt = datetime.strptime(value.strip(), "%Y-%m-%d")
        return dt.date()
    except ValueError:
        return None


@router.post("/import", response_model=ImportResult, status_code=200)
async def import_flights(file: UploadFile = File(...)):
    """
    Import flights from ForeFlight CSV export.

    Expected ForeFlight CSV columns (using actual ForeFlight export format):
    - Date (required)
    - AircraftID (tail number)
    - From, To, Route
    - TotalTime (required)
    - PIC, SIC, Solo, Night
    - CrossCountry
    - ActualInstrument, SimulatedInstrument, SimulatedFlight
    - DualGiven, DualReceived
    - [Hours]Complex, [Hours]High Performance (custom fields with brackets!)
    - DayTakeoffs, DayLandingsFullStop, NightTakeoffs, NightLandingsFullStop
    - AllLandings, Holds
    - Approaches (JSON)
    - InstructorName, PilotComments

    Duplicate detection: Uses hash of date+airports+total_time
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read CSV file
        contents = await file.read()
        csv_data = contents.decode("utf-8")

        # ForeFlight CSV has metadata rows before the actual flight data
        # Find the "Aircraft Table" and "Flights Table" header rows
        lines = csv_data.split("\n")

        aircraft_table_start = -1
        flights_table_start = -1

        for i, line in enumerate(lines):
            if line.startswith("Aircraft Table"):
                aircraft_table_start = i + 1  # Next line has the headers
            elif line.startswith("Flights Table"):
                flights_table_start = i + 1  # Next line has the headers
                break

        if flights_table_start == -1:
            raise HTTPException(
                status_code=400, detail="Invalid ForeFlight CSV format: 'Flights Table' header not found"
            )

        # Parse Aircraft Table if available
        aircraft_data_dict = {}
        if aircraft_table_start != -1 and flights_table_start > aircraft_table_start:
            aircraft_csv = "\n".join(lines[aircraft_table_start : flights_table_start - 1])
            aircraft_reader = csv.DictReader(io.StringIO(aircraft_csv))
            for row in aircraft_reader:
                tail = row.get("AircraftID")
                if tail:
                    aircraft_data_dict[tail] = row

        # Skip to the flights section
        flights_csv = "\n".join(lines[flights_table_start:])
        reader = csv.DictReader(io.StringIO(flights_csv))

        imported = 0
        skipped = 0
        errors = []

        # Track import hashes to detect duplicates within this import
        import_hashes = set()

        async with postgres_db.acquire() as conn:
            # First, extract and import aircraft from the Aircraft Table data
            from app.routers.user_data import _extract_and_import_aircraft

            # Get user settings to check enable_faa_lookup
            settings_row = await conn.fetchrow("SELECT enable_faa_lookup FROM user_settings ORDER BY id LIMIT 1")
            enable_faa_lookup = settings_row["enable_faa_lookup"] if settings_row else True

            # Convert CSV rows to list of dicts for aircraft extraction (pass aircraft table data)
            flights_csv_copy = "\n".join(lines[flights_table_start:])
            reader_for_aircraft = csv.DictReader(io.StringIO(flights_csv_copy))
            flights_list = list(reader_for_aircraft)

            # Extract and create aircraft (now passing aircraft_data_dict with ForeFlight data)
            aircraft_map = await _extract_and_import_aircraft(conn, flights_list, enable_faa_lookup, aircraft_data_dict)
            print(f"[Flight Import] Created {len(aircraft_map)} aircraft from import")

            # Get existing import hashes from database
            existing_hashes = await conn.fetch("SELECT DISTINCT import_hash FROM flights WHERE import_hash IS NOT NULL")
            existing_hash_set = {row["import_hash"] for row in existing_hashes}

            for row_num, row in enumerate(
                reader, start=flights_table_start + 2
            ):  # Adjust row numbers for error messages
                try:
                    # Validate required fields - Date is always required
                    # For simulator sessions, time may be in SimulatedFlight instead of TotalTime
                    if not row.get("Date"):
                        errors.append(f"Row {row_num}: Missing required field (Date)")
                        skipped += 1
                        continue

                    # Must have either TotalTime or SimulatedFlight
                    if not row.get("TotalTime") and not row.get("SimulatedFlight"):
                        errors.append(f"Row {row_num}: Missing both TotalTime and SimulatedFlight")
                        skipped += 1
                        continue

                    # Create import hash for duplicate detection
                    import_hash = f"{row.get('Date')}_{row.get('From')}_{row.get('To')}_{row.get('TotalTime')}"

                    # Check if already imported (in DB or in this batch)
                    if import_hash in existing_hash_set or import_hash in import_hashes:
                        errors.append(f"Row {row_num}: Duplicate flight (already imported)")
                        skipped += 1
                        continue

                    import_hashes.add(import_hash)

                    # Parse date
                    flight_date = _safe_date(row.get("Date"))
                    if not flight_date:
                        errors.append(f"Row {row_num}: Invalid date format")
                        skipped += 1
                        continue

                    # Determine if simulator session based on SimulatedFlight column
                    simulated_flight_time = _safe_float(row.get("SimulatedFlight"))
                    is_sim = simulated_flight_time is not None and simulated_flight_time > 0

                    # Look up aircraft by tail number (now includes simulators)
                    aircraft_id = None
                    tail_number = row.get("AircraftID")
                    if tail_number:
                        # Look up in user_aircraft table (created by aircraft extraction above)
                        aircraft_row = await conn.fetchrow(
                            "SELECT id FROM aircraft WHERE UPPER(tail_number) = UPPER($1)", tail_number
                        )
                        if aircraft_row:
                            aircraft_id = aircraft_row["id"]

                    # Insert flight
                    await conn.execute(
                        """
                        INSERT INTO flights (
                            aircraft_id, tail_number, date, departure_airport, arrival_airport, route,
                            total_time, pic_time, sic_time, night_time, solo_time,
                            cross_country_time, actual_instrument_time, simulated_instrument_time,
                            simulated_flight_time, dual_given_time, dual_received_time,
                            complex_time, high_performance_time,
                            day_takeoffs, day_landings_full_stop,
                            night_takeoffs, night_landings_full_stop,
                            all_landings, holds, approaches,
                            instructor_name, pilot_comments,
                            is_simulator_session, import_hash
                        )
                        VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
                        )
                        """,
                        aircraft_id,
                        tail_number,
                        flight_date,
                        row.get("From"),
                        row.get("To"),
                        row.get("Route"),
                        _safe_float(row.get("TotalTime")),
                        _safe_float(row.get("PIC")),
                        _safe_float(row.get("SIC")),
                        _safe_float(row.get("Night")),
                        _safe_float(row.get("Solo")),
                        _safe_float(row.get("CrossCountry")),
                        _safe_float(row.get("ActualInstrument")),
                        _safe_float(row.get("SimulatedInstrument")),
                        _safe_float(row.get("SimulatedFlight")),
                        _safe_float(row.get("DualGiven")),
                        _safe_float(row.get("DualReceived")),
                        _safe_float(row.get("[Hours]Complex")),  # ForeFlight custom field!
                        _safe_float(row.get("[Hours]High Performance")),  # ForeFlight custom field!
                        _safe_int(row.get("DayTakeoffs")),
                        _safe_int(row.get("DayLandingsFullStop")),
                        _safe_int(row.get("NightTakeoffs")),
                        _safe_int(row.get("NightLandingsFullStop")),
                        _safe_int(row.get("AllLandings")),
                        _safe_int(row.get("Holds")),
                        json.dumps(row.get("Approaches")) if row.get("Approaches") else None,
                        row.get("InstructorName"),
                        row.get("PilotComments"),
                        is_sim,
                        import_hash,
                    )
                    imported += 1

                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    skipped += 1

        # After successful import, trigger hours recalculation
        if imported > 0:
            try:
                from app.routers import import_history

                await import_history.recalculate_hours_from_flights()
            except Exception as e:
                errors.append(f"Warning: Failed to recalculate hours: {str(e)}")

        # Fetch created aircraft details to return in response
        aircraft_created = []
        async with postgres_db.acquire() as conn:
            for tail, aircraft_id in aircraft_map.items():
                aircraft_row = await conn.fetchrow(
                    "SELECT id, tail_number, make, model, year, data_source FROM aircraft WHERE id = $1", aircraft_id
                )
                if aircraft_row:
                    aircraft_created.append(
                        AircraftCreated(
                            id=aircraft_row["id"],
                            tail_number=aircraft_row["tail_number"],
                            make=aircraft_row["make"],
                            model=aircraft_row["model"],
                            year=aircraft_row["year"],
                            data_source=aircraft_row["data_source"],
                        )
                    )

        return ImportResult(imported=imported, skipped=skipped, errors=errors, aircraft_created=aircraft_created)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import flights: {str(e)}") from e
