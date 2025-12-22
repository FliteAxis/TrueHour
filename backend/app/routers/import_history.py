"""Import history endpoints for tracking ForeFlight CSV imports."""

import json
from datetime import datetime
from typing import Any, Dict, Optional
from decimal import Decimal
from collections import defaultdict

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


def _parse_decimal(value):
    """Parse a value to Decimal, returning 0 if None or empty."""
    if value is None or value == "":
        return Decimal("0")
    return Decimal(str(value))


def _count_route_segments(route):
    """Count number of unique airports in route."""
    if not route:
        return 0
    airports = [seg for seg in route.split() if seg.startswith('K') and len(seg) == 4]
    return len(set(airports))


def _is_towered_airport(airport_code):
    """Check if airport is towered (simplified list)."""
    towered = {
        'KAMW', 'KALO', 'KATL', 'KORD', 'KDFW', 'KDEN', 'KLAX', 'KJFK', 'KSFO',
        'KLAS', 'KMCO', 'KSEA', 'KPHX', 'KIAH', 'KEWR', 'KBOS', 'KMIA', 'KDCA',
        'KLGA', 'KMDW', 'KBWI', 'KDAL', 'KSAN', 'KSLC', 'KPDX', 'KOAK', 'KSMF',
        'KSNA', 'KAUS', 'KRDU', 'KCVG', 'KPIT', 'KCLE', 'KSTL', 'KBNA', 'KMSY',
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

            for flight in flights:
                # Basic totals
                total_time = _parse_decimal(flight['total_time'])
                pic = _parse_decimal(flight['pic_time'])
                cross_country = _parse_decimal(flight['cross_country_time'])
                night = _parse_decimal(flight['night_time'])
                solo = _parse_decimal(flight['solo_time'])
                dual_received = _parse_decimal(flight['dual_received_time'])
                dual_given = _parse_decimal(flight['dual_given_time'])
                simulated_flight = _parse_decimal(flight['simulated_flight_time'])
                actual_instrument = _parse_decimal(flight['actual_instrument_time'])
                simulated_instrument = _parse_decimal(flight['simulated_instrument_time'])
                complex_time = _parse_decimal(flight['complex_time'])

                # Accumulate
                totals['total'] += total_time
                totals['pic'] += pic
                totals['cross_country'] += cross_country
                totals['night'] += night
                totals['dual_received'] += dual_received
                totals['dual_given'] += dual_given
                totals['simulator_time'] += simulated_flight
                totals['actual_instrument'] += actual_instrument
                totals['simulated_instrument'] += simulated_instrument
                totals['complex'] += complex_time

                # PIC XC
                if pic > 0 and cross_country > 0:
                    totals['pic_xc'] += min(pic, cross_country)

                # Dual XC
                if dual_received > 0 and cross_country > 0:
                    totals['dual_xc'] += min(dual_received, cross_country)

                # Instrument dual airplane
                if dual_received > 0 and (actual_instrument > 0 or simulated_instrument > 0):
                    instrument_time = actual_instrument + simulated_instrument
                    totals['instrument_dual_airplane'] += min(dual_received, instrument_time)

                # Total instrument
                totals['instrument_total'] += actual_instrument + simulated_instrument + simulated_flight

                # Private long XC check (150nm, 3+ stops, solo)
                distance = _parse_decimal(flight.get('distance') or 0)
                route = flight.get('route') or ''
                if distance >= 150 and solo > 0 and _count_route_segments(route) >= 3:
                    long_xc_completed = 1

                # Towered operations (solo only)
                if solo > 0:
                    from_airport = flight.get('departure_airport') or ''
                    to_airport = flight.get('arrival_airport') or ''
                    day_takeoffs = int(_parse_decimal(flight.get('day_takeoffs') or 0))
                    day_landings = int(_parse_decimal(flight.get('day_landings_full_stop') or 0))

                    if _is_towered_airport(from_airport) and day_takeoffs > 0:
                        towered_ops_count += day_takeoffs
                    if _is_towered_airport(to_airport) and day_landings > 0:
                        towered_ops_count += day_landings

            # Set special fields
            totals['private_long_xc'] = Decimal(long_xc_completed)
            totals['private_towered_ops'] = Decimal(min(towered_ops_count, 3))

            # Recent instrument (approximate as 30% of instrument dual)
            totals['recent_instrument'] = totals['instrument_dual_airplane'] * Decimal('0.3')

            # IR 250nm XC (TODO: implement proper check)
            totals['ir_250nm_xc'] = Decimal('0')

            # Convert to floats for JSON
            hours_dict = {k: float(v) for k, v in totals.items()}

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
                'recalculation',
                None,
                len(flights),
                hours_json,
                'Recalculated from database flights'
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
