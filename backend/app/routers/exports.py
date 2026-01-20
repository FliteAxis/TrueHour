"""Export endpoints for CSV downloads."""

import csv
import io
from datetime import date as date_type
from typing import Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/user/exports", tags=["Exports"])


@router.get("/flights/csv")
async def export_flights_csv(
    start_date: Optional[date_type] = Query(None, description="Filter by start date"),
    end_date: Optional[date_type] = Query(None, description="Filter by end date"),
):
    """Export flights to CSV format."""
    try:
        async with postgres_db.acquire() as conn:
            # Build query with optional date filters
            query = "SELECT * FROM flights WHERE 1=1"
            params = []

            if start_date:
                query += " AND date >= $" + str(len(params) + 1)
                params.append(start_date)

            if end_date:
                query += " AND date <= $" + str(len(params) + 1)
                params.append(end_date)

            query += " ORDER BY date DESC"

            flights = await conn.fetch(query, *params)

            if not flights:
                raise HTTPException(status_code=404, detail="No flights found")

            # Create CSV in memory
            output = io.StringIO()
            writer = csv.writer(output)

            # Write header
            headers = [
                "Date",
                "Aircraft ID",
                "Tail Number",
                "From",
                "To",
                "Route",
                "Total Time",
                "PIC",
                "SIC",
                "Night",
                "Solo",
                "Cross Country",
                "Actual Instrument",
                "Simulated Instrument",
                "Simulator",
                "Dual Given",
                "Dual Received",
                "Complex",
                "High Performance",
                "Day Takeoffs",
                "Day Landings",
                "Night Takeoffs",
                "Night Landings",
                "All Landings",
                "Holds",
                "Approaches",
                "Distance",
                "Instructor",
                "Comments",
            ]
            writer.writerow(headers)

            # Initialize totals
            totals = {
                "total_time": 0,
                "pic_time": 0,
                "sic_time": 0,
                "night_time": 0,
                "solo_time": 0,
                "cross_country_time": 0,
                "actual_instrument_time": 0,
                "simulated_instrument_time": 0,
                "simulated_flight_time": 0,
                "dual_given_time": 0,
                "dual_received_time": 0,
                "complex_time": 0,
                "high_performance_time": 0,
                "day_takeoffs": 0,
                "day_landings_full_stop": 0,
                "night_takeoffs": 0,
                "night_landings_full_stop": 0,
                "all_landings": 0,
                "holds": 0,
                "distance": 0,
            }

            # Write data rows and accumulate totals
            for flight in flights:
                row = [
                    flight.get("date"),
                    flight.get("aircraft_id") or "",
                    flight.get("tail_number") or "",
                    flight.get("departure_airport") or "",
                    flight.get("arrival_airport") or "",
                    flight.get("route") or "",
                    flight.get("total_time") or 0,
                    flight.get("pic_time") or 0,
                    flight.get("sic_time") or 0,
                    flight.get("night_time") or 0,
                    flight.get("solo_time") or 0,
                    flight.get("cross_country_time") or 0,
                    flight.get("actual_instrument_time") or 0,
                    flight.get("simulated_instrument_time") or 0,
                    flight.get("simulated_flight_time") or 0,
                    flight.get("dual_given_time") or 0,
                    flight.get("dual_received_time") or 0,
                    flight.get("complex_time") or 0,
                    flight.get("high_performance_time") or 0,
                    flight.get("day_takeoffs") or 0,
                    flight.get("day_landings_full_stop") or 0,
                    flight.get("night_takeoffs") or 0,
                    flight.get("night_landings_full_stop") or 0,
                    flight.get("all_landings") or 0,
                    flight.get("holds") or 0,
                    flight.get("approaches") or "",
                    flight.get("distance") or 0,
                    flight.get("instructor_name") or "",
                    flight.get("pilot_comments") or "",
                ]
                writer.writerow(row)

                # Accumulate totals (skip non-numeric fields)
                for key in totals.keys():
                    val = flight.get(key)
                    if val is not None and isinstance(val, (int, float)):
                        totals[key] += val

            # Write totals row
            writer.writerow(
                [
                    "",  # Date
                    "",  # Aircraft ID
                    "",  # Tail Number
                    "",  # From
                    "",  # To
                    "TOTALS:",  # Route
                    totals["total_time"],
                    totals["pic_time"],
                    totals["sic_time"],
                    totals["night_time"],
                    totals["solo_time"],
                    totals["cross_country_time"],
                    totals["actual_instrument_time"],
                    totals["simulated_instrument_time"],
                    totals["simulated_flight_time"],
                    totals["dual_given_time"],
                    totals["dual_received_time"],
                    totals["complex_time"],
                    totals["high_performance_time"],
                    totals["day_takeoffs"],
                    totals["day_landings_full_stop"],
                    totals["night_takeoffs"],
                    totals["night_landings_full_stop"],
                    totals["all_landings"],
                    totals["holds"],
                    "",  # Approaches (text field)
                    totals["distance"],
                    "",  # Instructor
                    "",  # Comments
                ]
            )

            # Prepare response
            output.seek(0)
            filename = f"truehour_flights_{date_type.today().isoformat()}.csv"

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export flights: {str(e)}") from e


@router.get("/budget-cards/csv")
async def export_budget_cards_csv():
    """Export budget cards to CSV format."""
    try:
        async with postgres_db.acquire() as conn:
            cards = await conn.fetch(
                """
                SELECT
                    bc.*,
                    a.tail_number as aircraft_tail,
                    a.make as aircraft_make,
                    a.model as aircraft_model
                FROM budget_cards bc
                LEFT JOIN aircraft a ON bc.aircraft_id = a.id
                ORDER BY bc.when_date DESC, bc.category
            """
            )

            if not cards:
                raise HTTPException(status_code=404, detail="No budget cards found")

            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)

            # Header
            writer.writerow(
                [
                    "Category",
                    "Name",
                    "Date",
                    "Amount",
                    "Status",
                    "Aircraft",
                    "Hours",
                    "Rate Type",
                    "Notes",
                    "Created",
                    "Updated",
                ]
            )

            # Data
            for card in cards:
                aircraft_info = ""
                if card.get("aircraft_tail"):
                    aircraft_info = f"{card['aircraft_tail']} ({card['aircraft_make']} {card['aircraft_model']})"

                writer.writerow(
                    [
                        card.get("category") or "",
                        card.get("name") or "",
                        card.get("when_date"),
                        card.get("amount") or 0,
                        card.get("status") or "active",
                        aircraft_info,
                        card.get("associated_hours") or "",
                        card.get("hourly_rate_type") or "",
                        card.get("notes") or "",
                        card.get("created_at"),
                        card.get("updated_at"),
                    ]
                )

            output.seek(0)
            filename = f"truehour_budget_cards_{date_type.today().isoformat()}.csv"

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export budget cards: {str(e)}") from e


@router.get("/expenses/csv")
async def export_expenses_csv(
    start_date: Optional[date_type] = Query(None),
    end_date: Optional[date_type] = Query(None),
):
    """Export expenses to CSV format."""
    try:
        async with postgres_db.acquire() as conn:
            query = "SELECT * FROM expenses WHERE 1=1"
            params = []

            if start_date:
                query += " AND date >= $" + str(len(params) + 1)
                params.append(start_date)

            if end_date:
                query += " AND date <= $" + str(len(params) + 1)
                params.append(end_date)

            query += " ORDER BY date DESC"

            expenses = await conn.fetch(query, *params)

            if not expenses:
                raise HTTPException(status_code=404, detail="No expenses found")

            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow(
                ["Date", "Category", "Description", "Amount", "Payment Method", "Vendor", "Notes", "Created"]
            )

            for expense in expenses:
                writer.writerow(
                    [
                        expense.get("date"),
                        expense.get("category") or "",
                        expense.get("description") or "",
                        expense.get("amount") or 0,
                        expense.get("payment_method") or "",
                        expense.get("vendor") or "",
                        expense.get("notes") or "",
                        expense.get("created_at"),
                    ]
                )

            output.seek(0)
            filename = f"truehour_expenses_{date_type.today().isoformat()}.csv"

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export expenses: {str(e)}") from e


@router.get("/aircraft/csv")
async def export_aircraft_csv():
    """Export aircraft to CSV format."""
    try:
        async with postgres_db.acquire() as conn:
            aircraft = await conn.fetch(
                """
                SELECT * FROM aircraft
                ORDER BY is_active DESC, tail_number
            """
            )

            if not aircraft:
                raise HTTPException(status_code=404, detail="No aircraft found")

            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow(
                [
                    "Tail Number",
                    "Make",
                    "Model",
                    "Year",
                    "Category",
                    "Gear Type",
                    "Engine Type",
                    "Complex",
                    "High Performance",
                    "TAA",
                    "Simulator",
                    "Wet Rate",
                    "Dry Rate",
                    "Fuel Price",
                    "Fuel Burn",
                    "Active",
                    "Data Source",
                    "Notes",
                ]
            )

            for ac in aircraft:
                writer.writerow(
                    [
                        ac.get("tail_number") or "",
                        ac.get("make") or "",
                        ac.get("model") or "",
                        ac.get("year") or "",
                        ac.get("category_class") or "",
                        ac.get("gear_type") or "",
                        ac.get("engine_type") or "",
                        ac.get("is_complex") or False,
                        ac.get("is_high_performance") or False,
                        ac.get("is_taa") or False,
                        ac.get("is_simulator") or False,
                        ac.get("wet_rate") or 0,
                        ac.get("dry_rate") or 0,
                        ac.get("fuel_price_per_gallon") or 0,
                        ac.get("fuel_burn_rate") or 0,
                        ac.get("is_active") or True,
                        ac.get("data_source") or "manual",
                        ac.get("notes") or "",
                    ]
                )

            output.seek(0)
            filename = f"truehour_aircraft_{date_type.today().isoformat()}.csv"

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export aircraft: {str(e)}") from e
