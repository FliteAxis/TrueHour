"""Import history endpoints for tracking ForeFlight CSV imports."""

import json
from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/user/import-history", tags=["Import History"])


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


def _parse_decimal(value):
    """Parse a value to Decimal, returning 0 if None or empty."""
    if value is None or value == "":
        return Decimal("0")
    return Decimal(str(value))


def _count_route_segments(route):
    """Count number of airports in route (including duplicates for round trips)."""
    if not route:
        return 0
    airports = [seg for seg in route.split() if seg.startswith("K") and len(seg) == 4]
    return len(airports)  # Count all segments, not unique


def _is_towered_airport(airport_code):
    """Check if airport is towered (simplified list)."""
    towered = {
        "KAMW",
        "KALO",
        "KATL",
        "KORD",
        "KDFW",
        "KDEN",
        "KLAX",
        "KJFK",
        "KSFO",
        "KLAS",
        "KMCO",
        "KSEA",
        "KPHX",
        "KIAH",
        "KEWR",
        "KBOS",
        "KMIA",
        "KDCA",
        "KLGA",
        "KMDW",
        "KBWI",
        "KDAL",
        "KSAN",
        "KSLC",
        "KPDX",
        "KOAK",
        "KSMF",
        "KSNA",
        "KAUS",
        "KRDU",
        "KCVG",
        "KPIT",
        "KCLE",
        "KSTL",
        "KBNA",
        "KMSY",
    }
    return airport_code in towered


@router.post("/recalculate", response_model=ImportHistoryResponse, status_code=200)
async def recalculate_hours_from_flights():
    """
    Recalculate hours from all flights in database and update import history.

    This calculates comprehensive hours including:
    - dual_xc (dual cross-country time)
    - private_long_xc (150nm+ solo XC with 3+ stops)
    - private_towered_ops (towered airport operations while solo)
    - _qualifying_flights metadata for long XC requirements
    """
    try:
        async with postgres_db.acquire() as conn:
            # Get all flights
            flights = await conn.fetch("SELECT * FROM flights ORDER BY date")

            if not flights:
                raise HTTPException(status_code=404, detail="No flights found")

            totals = defaultdict(Decimal)
            long_xc_completed = 0
            towered_ops_count = 0
            recent_instrument_time = Decimal("0")
            checkride_prep_time = Decimal("0")

            # Calculate date 2 calendar months ago for recent instrument tracking
            # "Within 2 calendar months" = 60 days back from today
            # If today is Dec 25, 2025: Oct 26, 2025 onwards
            from datetime import datetime, timedelta

            today = datetime.now().date()
            two_months_ago = today - timedelta(days=60)

            # Track qualifying flights
            private_long_xc_flights = []
            ir_250nm_xc_flights = []
            cpl_2hr_day_xc_flights = []
            cpl_2hr_night_xc_flights = []
            cpl_300nm_xc_flights = []

            for flight in flights:
                # Get flight date for recent calculations
                flight_date = flight.get("date")
                if isinstance(flight_date, str):
                    flight_date = datetime.fromisoformat(flight_date.replace("Z", "+00:00")).date()
                elif isinstance(flight_date, datetime):
                    flight_date = flight_date.date()
                # Basic totals
                total_time = _parse_decimal(flight["total_time"])
                pic = _parse_decimal(flight["pic_time"])
                cross_country = _parse_decimal(flight["cross_country_time"])
                night = _parse_decimal(flight["night_time"])
                solo = _parse_decimal(flight["solo_time"])
                dual_received = _parse_decimal(flight["dual_received_time"])
                dual_given = _parse_decimal(flight["dual_given_time"])
                simulated_flight = _parse_decimal(flight["simulated_flight_time"])
                actual_instrument = _parse_decimal(flight["actual_instrument_time"])
                simulated_instrument = _parse_decimal(flight["simulated_instrument_time"])
                complex_time = _parse_decimal(flight["complex_time"])

                # Accumulate
                totals["total"] += total_time
                totals["pic"] += pic
                totals["cross_country"] += cross_country
                totals["night"] += night
                totals["solo"] += solo
                totals["dual_received"] += dual_received
                totals["dual_given"] += dual_given
                totals["simulator_time"] += simulated_flight
                totals["actual_instrument"] += actual_instrument
                totals["simulated_instrument"] += simulated_instrument
                totals["complex"] += complex_time

                # Complex/turbine/TAA dual (training time in complex aircraft)
                # 14 CFR 61.129(a)(3)(ii): "10 hours of training"
                # Training means dual received, not total time
                if dual_received > 0 and complex_time > 0:
                    # Count the minimum of dual received or complex time
                    complex_dual = min(dual_received, complex_time)
                    totals["complex_dual"] += complex_dual

                # PIC XC
                if pic > 0 and cross_country > 0:
                    totals["pic_xc"] += min(pic, cross_country)

                # Dual XC
                if dual_received > 0 and cross_country > 0:
                    totals["dual_xc"] += min(dual_received, cross_country)

                # Instrument dual airplane (not simulator - only actual airplanes)
                # 14 CFR 61.129(a)(3)(i): "instrument training using a view-limiting device"
                # This means ONLY simulated instrument (hood/foggles), NOT actual instrument (IMC)
                # ForeFlight only counts flights where student is acting as PIC under instruction (pic > 0)
                if dual_received > 0 and pic > 0 and simulated_instrument > 0 and simulated_flight == 0:
                    instrument_dual = min(dual_received, simulated_instrument)
                    totals["instrument_dual_airplane"] += instrument_dual

                # Instrument dual simulator (only simulator sessions with dual instruction)
                if dual_received > 0 and simulated_flight > 0 and simulated_instrument > 0:
                    instrument_dual_sim = min(dual_received, simulated_instrument)
                    totals["instrument_dual_simulator"] += instrument_dual_sim

                # Track recent instrument training (last 2 months) - AIRPLANE ONLY (not simulators)
                # 14 CFR 61.65(d)(2): "in an airplane...appropriate to the instrument-airplane rating"
                # ForeFlight interpretation: Only counts actual airplane flights, NOT simulator sessions
                if dual_received > 0 and (actual_instrument > 0 or simulated_instrument > 0) and simulated_flight == 0:
                    # Airplane session only - add actual + simulated instrument
                    instrument_time = actual_instrument + simulated_instrument
                    instrument_dual_total = min(dual_received, instrument_time)
                    if flight_date and flight_date >= two_months_ago:
                        recent_instrument_time += instrument_dual_total

                # Track checkride prep (CPL): Dual received in AIRPLANE in last 2 calendar months
                # 14 CFR 61.129(a)(3): "3 hours of flight training within 2 calendar months"
                # ForeFlight: Only counts airplane flights, not simulators
                if dual_received > 0 and flight_date and flight_date >= two_months_ago and simulated_flight == 0:
                    checkride_prep_time += dual_received

                # Total instrument (actual + simulated, no double counting)
                totals["instrument_total"] += actual_instrument + simulated_instrument

                # Private long XC check (150nm, 3+ stops, solo)
                distance = _parse_decimal(flight.get("distance") or 0)
                route = flight.get("route") or ""
                segments = _count_route_segments(route)
                qualifies = distance >= 150 and solo > 0 and segments >= 3
                if qualifies:
                    long_xc_completed = 1
                    # Store qualifying flight details
                    if not private_long_xc_flights:  # Only store first qualifying flight
                        tail = flight.get("tail_number") or str(flight.get("aircraft_id") or "")
                        private_long_xc_flights.append(
                            {
                                "date": flight["date"].isoformat() if flight.get("date") else "",
                                "aircraft_id": tail,
                                "route": route,
                                "distance": float(distance),
                                "type": "Solo",
                            }
                        )

                # Towered operations (solo only)
                if solo > 0:
                    from_airport = flight.get("departure_airport") or ""
                    to_airport = flight.get("arrival_airport") or ""
                    day_takeoffs = int(_parse_decimal(flight.get("day_takeoffs") or 0))
                    day_landings = int(_parse_decimal(flight.get("day_landings_full_stop") or 0))

                    if _is_towered_airport(from_airport) and day_takeoffs > 0:
                        towered_ops_count += day_takeoffs
                    if _is_towered_airport(to_airport) and day_landings > 0:
                        towered_ops_count += day_landings

            # Set special fields
            totals["private_long_xc"] = Decimal(long_xc_completed)
            totals["private_towered_ops"] = Decimal(min(towered_ops_count, 3))

            # Recent instrument (last 2 calendar months, actual airplane training only)
            totals["recent_instrument"] = recent_instrument_time

            # IR 250nm XC: Check per-flight below
            totals["ir_250nm_xc"] = Decimal("0")

            # === Commercial Pilot Requirements ===
            # CPL Req 9: 10 hours simulated instrument training (airplane + simulator instrument dual)
            # 14 CFR 61.129(a)(3)(i): Max 5.0 hours in FTD/simulator, or 2.5 hours in ATD
            # Assume FTD/simulator, so cap at 5.0 hours
            simulator_dual = totals.get("instrument_dual_simulator", Decimal("0"))
            simulator_capped = min(simulator_dual, Decimal("5.0"))
            totals["cpl_sim_instrument_training"] = totals["instrument_dual_airplane"] + simulator_capped

            # CPL Req 10: 5 hours simulated instrument in single-engine airplane
            # ForeFlight shows 11.7 - this is airplane instrument dual only (not simulator)
            totals["cpl_sim_instrument_airplane"] = totals["instrument_dual_airplane"]

            # CPL Req 11: 10 hours complex/turbine/TAA training
            # 14 CFR 61.129(a)(3)(ii):
            # "10 hours of training in a complex, turbine, or TAA"
            # Training means dual received, not total time
            totals["cpl_complex_turbine_taa"] = totals.get("complex_dual", Decimal("0"))

            # CPL Req 12 & 13: 2-hour XC flights (checked per-flight below)
            totals["cpl_2hr_day_xc"] = Decimal("0")
            totals["cpl_2hr_night_xc"] = Decimal("0")

            # CPL Req 14: 3 hours checkride prep in last 2 months
            totals["cpl_checkride_prep_recent"] = checkride_prep_time

            # CPL Req 15: 10 hours solo in single-engine
            # For now, count all solo time (TODO: filter by single-engine only)
            totals["cpl_solo_se"] = totals.get("solo", Decimal("0"))

            # CPL Req 16: 300nm XC (checked per-flight below)
            totals["cpl_300nm_xc"] = Decimal("0")

            # CPL Req 17: 5 hours night VFR solo or with instructor only
            # Approximation: any night time with solo or dual_received
            night_vfr_count = Decimal("0")
            for flight in flights:
                night = _parse_decimal(flight["night_time"])
                solo = _parse_decimal(flight["solo_time"])
                dual_received = _parse_decimal(flight["dual_received_time"])
                if night > 0 and (solo > 0 or dual_received > 0):
                    night_vfr_count += night
            totals["cpl_night_vfr"] = night_vfr_count

            # CPL Req 18: 10 night takeoffs/landings at towered airports
            cpl_night_takeoffs_towered = 0
            cpl_night_landings_towered = 0
            for flight in flights:
                night = _parse_decimal(flight["night_time"])
                if night > 0:
                    from_airport = flight.get("departure_airport") or ""
                    to_airport = flight.get("arrival_airport") or ""
                    night_takeoffs = int(_parse_decimal(flight.get("night_takeoffs") or 0))
                    night_landings = int(_parse_decimal(flight.get("night_landings_full_stop") or 0))

                    if _is_towered_airport(from_airport) and night_takeoffs > 0:
                        cpl_night_takeoffs_towered += night_takeoffs
                    if _is_towered_airport(to_airport) and night_landings > 0:
                        cpl_night_landings_towered += night_landings

            totals["cpl_night_takeoffs_towered"] = Decimal(min(cpl_night_takeoffs_towered, 10))
            totals["cpl_night_landings_towered"] = Decimal(min(cpl_night_landings_towered, 10))

            # Check for qualifying IR and CPL XC flights
            for flight in flights:
                distance = _parse_decimal(flight.get("distance") or 0)
                route = flight.get("route") or ""
                total_time = _parse_decimal(flight["total_time"])
                night = _parse_decimal(flight["night_time"])
                solo = _parse_decimal(flight["solo_time"])
                dual_received = _parse_decimal(flight["dual_received_time"])
                pic = _parse_decimal(flight["pic_time"])
                actual_instrument = _parse_decimal(flight["actual_instrument_time"])
                simulated_instrument = _parse_decimal(flight["simulated_instrument_time"])

                # Parse approaches (stored as JSON array)
                approaches_json = flight.get("approaches")
                approach_count = 0
                if approaches_json:
                    try:
                        approaches = (
                            json.loads(approaches_json) if isinstance(approaches_json, str) else approaches_json
                        )
                        approach_count = len(approaches) if isinstance(approaches, list) else 0
                    except (json.JSONDecodeError, TypeError, ValueError):
                        approach_count = 0

                # IR 250nm XC: ≥250nm, 3+ approaches, instrument time
                segments = _count_route_segments(route)
                has_instrument_time = actual_instrument > 0 or simulated_instrument > 0
                if distance >= 250 and approach_count >= 3 and segments >= 3 and has_instrument_time:
                    if totals["ir_250nm_xc"] == 0:  # Only need one
                        totals["ir_250nm_xc"] = Decimal("1")
                        tail = flight.get("tail_number") or str(flight.get("aircraft_id") or "")
                        ir_250nm_xc_flights.append(
                            {
                                "date": flight["date"].isoformat() if flight.get("date") else "",
                                "aircraft_id": tail,
                                "route": route,
                                "distance": float(distance),
                                "approach_count": approach_count,
                            }
                        )

                # CPL Req 12: 2-hour day XC >100nm in single-engine
                is_day = night == 0 or total_time > night
                if is_day and total_time >= 2 and distance >= 100 and dual_received > 0:
                    if totals["cpl_2hr_day_xc"] == 0:  # Only need one
                        totals["cpl_2hr_day_xc"] = Decimal("1")
                        tail = flight.get("tail_number") or str(flight.get("aircraft_id") or "")
                        cpl_2hr_day_xc_flights.append(
                            {
                                "date": flight["date"].isoformat() if flight.get("date") else "",
                                "aircraft_id": tail,
                                "route": route,
                                "distance": float(distance),
                                "duration": float(total_time),
                            }
                        )

                # CPL Req 13: 2-hour night XC >100nm in single-engine
                if night >= 2 and distance >= 100 and dual_received > 0:
                    if totals["cpl_2hr_night_xc"] == 0:  # Only need one
                        totals["cpl_2hr_night_xc"] = Decimal("1")
                        tail = flight.get("tail_number") or str(flight.get("aircraft_id") or "")
                        cpl_2hr_night_xc_flights.append(
                            {
                                "date": flight["date"].isoformat() if flight.get("date") else "",
                                "aircraft_id": tail,
                                "route": route,
                                "distance": float(distance),
                                "duration": float(night),
                            }
                        )

                # CPL Req 16: 300nm XC, 3 points, one 250nm+ from departure
                # Solo or PIC with instructor only
                segments = _count_route_segments(route)
                if distance >= 300 and segments >= 3 and (solo > 0 or (pic > 0 and dual_received > 0)):
                    if totals["cpl_300nm_xc"] == 0:  # Only need one
                        totals["cpl_300nm_xc"] = Decimal("1")
                        tail = flight.get("tail_number") or str(flight.get("aircraft_id") or "")
                        cpl_300nm_xc_flights.append(
                            {
                                "date": flight["date"].isoformat() if flight.get("date") else "",
                                "aircraft_id": tail,
                                "route": route,
                                "distance": float(distance),
                            }
                        )

            # Convert to floats for JSON
            hours_dict = {k: float(v) for k, v in totals.items()}

            # Add qualifying flights metadata
            hours_dict["_qualifying_flights"] = {
                "private_long_xc": private_long_xc_flights,
                "ir_250nm_xc": ir_250nm_xc_flights,
                "cpl_2hr_day_xc": cpl_2hr_day_xc_flights,
                "cpl_2hr_night_xc": cpl_2hr_night_xc_flights,
                "cpl_300nm_xc": cpl_300nm_xc_flights,
            }

            # Save as new import history record
            hours_json = json.dumps(hours_dict)
            row = await conn.fetchrow(
                """
                INSERT INTO import_history (
                    import_type, file_name, flights_imported, hours_imported, notes
                )
                VALUES ($1, $2, $3, $4::jsonb, $5)
                RETURNING id, import_type, file_name, flights_imported,
                          hours_imported, import_date, notes
                """,
                "recalculation",
                None,
                len(flights),
                hours_json,
                "Recalculated from database flights",
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recalculate hours: {str(e)}") from e
