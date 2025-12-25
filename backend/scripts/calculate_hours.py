#!/usr/bin/env python3
"""
Calculate detailed flight hours from ForeFlight logbook CSV.
Calculates additional fields like dual_xc, private_long_xc, private_towered_ops.
"""

import csv
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal


def parse_decimal(value):
    """Parse a value to Decimal, returning 0 if empty or invalid."""
    if not value or value.strip() == "":
        return Decimal("0")
    try:
        return Decimal(value.strip())
    except (ValueError, TypeError, ArithmeticError):
        return Decimal("0")


def count_route_segments(route):
    """
    Count number of airports in route (for full stops).
    For Private Pilot long XC, we need 3 points total (including returning to origin).
    Returns total count, not unique count.
    """
    if not route:
        return 0
    # Split by space and filter out airways/waypoints (usually contain numbers/letters mix)
    airports = [seg for seg in route.split() if seg.startswith("K") and len(seg) == 4]
    return len(airports)  # Total airports (including duplicates for round trips)


def is_towered_airport(airport_code):
    """
    Check if airport is towered.
    This is a simplified check - in production you'd query FAA data.
    Common towered airports starting with K.
    """
    # List of known towered airports (abbreviated for now)
    # In production, query from FAA database
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
        "KDSM",
        "KSDA",
    }
    return airport_code in towered


def is_solo_or_instructor_only(pic, solo, dual_received):
    """
    Check if flight qualifies as solo or PIC with instructor only (no dual received).
    For Commercial requirements 16, 17, 18.
    """
    # Solo time logged
    if solo > 0:
        return True
    # PIC time with no dual received (instructor only, not receiving instruction)
    if pic > 0 and dual_received == 0:
        return True
    return False


def get_route_airports(route):
    """Extract list of airports from route string."""
    if not route:
        return []
    # Split by space and filter for airport codes (K followed by 3 letters)
    return [seg for seg in route.split() if seg.startswith("K") and len(seg) == 4]


def check_300nm_xc_requirement(distance, route, departure_airport):
    """
    Check if flight meets Commercial 300nm XC requirement:
    - 3 points of landing
    - One point 250nm+ from departure
    """
    if distance < 300:
        return False

    airports = get_route_airports(route)
    if len(set(airports)) < 3:  # Need at least 3 unique airports
        return False

    # Check if any airport is 250nm+ from departure
    # Since we don't have coordinates, use distance heuristic:
    # If total distance >= 300nm with 3+ stops, likely one point is 250nm+ from departure
    # This is a simplification - production would calculate actual distances
    return True


def calculate_hours_from_csv(csv_path):
    """Calculate comprehensive hours from ForeFlight CSV."""

    totals = defaultdict(Decimal)
    long_xc_completed = 0
    towered_ops_count = 0

    # For recent instrument calculation (last 2 calendar months)
    two_months_ago = datetime.now() - timedelta(days=60)
    recent_instrument_time = Decimal("0")

    # Initialize Commercial field defaults
    totals["cpl_sim_instrument_training"] = Decimal("0")
    totals["cpl_sim_instrument_airplane"] = Decimal("0")
    totals["cpl_solo_se"] = Decimal("0")
    totals["cpl_complex_turbine_taa"] = Decimal("0")
    totals["cpl_checkride_prep_recent"] = Decimal("0")
    totals["cpl_night_vfr"] = Decimal("0")

    # Track qualifying flights for Commercial requirements
    cpl_2hr_day_xc_flights = []
    cpl_2hr_night_xc_flights = []
    cpl_300nm_xc_flights = []

    # Track Commercial night operations at towered airports
    cpl_night_takeoffs_towered = 0
    cpl_night_landings_towered = 0

    # Track qualifying flights for Private and Instrument requirements
    private_long_xc_flights = []
    ir_250nm_xc_flights = []

    with open(csv_path, "r", encoding="utf-8") as f:
        # Skip header rows until we find "Date,"
        for line in f:
            if line.startswith("Date,"):
                headers = line.strip().split(",")
                break

        reader = csv.DictReader(f, fieldnames=headers)

        for row in reader:
            date_str = row.get("Date", "").strip()
            if not date_str or date_str == "Flights Table":
                continue

            # Parse date for recent instrument calculation
            try:
                flight_date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                try:
                    flight_date = datetime.strptime(date_str, "%m/%d/%Y")
                except ValueError:
                    flight_date = None

            # Basic totals
            total_time = parse_decimal(row.get("TotalTime", "0"))
            pic = parse_decimal(row.get("PIC", "0"))
            cross_country = parse_decimal(row.get("CrossCountry", "0"))
            night = parse_decimal(row.get("Night", "0"))
            dual_received = parse_decimal(row.get("DualReceived", "0"))
            dual_given = parse_decimal(row.get("DualGiven", "0"))
            simulated_flight = parse_decimal(row.get("SimulatedFlight", "0"))
            actual_instrument = parse_decimal(row.get("ActualInstrument", "0"))
            simulated_instrument = parse_decimal(row.get("SimulatedInstrument", "0"))
            complex_time = parse_decimal(row.get("[Hours]Complex", "0"))
            solo = parse_decimal(row.get("Solo", "0"))
            distance = parse_decimal(row.get("Distance", "0"))
            route = row.get("Route", "").strip()
            aircraft_cat = row.get("AircraftCategory", "").strip().lower()
            aircraft_class = row.get("AircraftClass", "").strip().lower()

            # Helper for single-engine airplane detection
            # ForeFlight doesn't export category/class in Flights Table, so assume single-engine if not simulator
            is_single_engine_airplane = ("airplane" in aircraft_cat and "single" in aircraft_class) or (
                simulated_flight == 0 and aircraft_cat == "" and aircraft_class == ""
            )

            # Accumulate standard fields
            totals["total"] += total_time
            totals["pic"] += pic
            totals["cross_country"] += cross_country
            totals["night"] += night
            totals["dual_received"] += dual_received
            totals["dual_given"] += dual_given
            totals["simulator_time"] += simulated_flight
            totals["actual_instrument"] += actual_instrument
            totals["simulated_instrument"] += simulated_instrument
            totals["complex"] += complex_time

            # Calculate PIC XC (cross country as PIC)
            if pic > 0 and cross_country > 0:
                pic_xc_time = min(pic, cross_country)
                totals["pic_xc"] += pic_xc_time

            # Calculate dual XC (cross country with instructor)
            if dual_received > 0 and cross_country > 0:
                dual_xc_time = min(dual_received, cross_country)
                totals["dual_xc"] += dual_xc_time

            # Calculate instrument dual airplane (not simulator)
            # Only count if simulated_flight is 0 (i.e., not in a simulator device)
            if dual_received > 0 and (actual_instrument > 0 or simulated_instrument > 0) and simulated_flight == 0:
                instrument_time = actual_instrument + simulated_instrument
                instrument_dual = min(dual_received, instrument_time)
                totals["instrument_dual_airplane"] += instrument_dual

                # Track recent instrument (last 2 calendar months in actual airplanes only)
                if flight_date and flight_date >= two_months_ago:
                    recent_instrument_time += instrument_dual

            # Total instrument time (actual + simulated instrument conditions, not simulator device time)
            totals["instrument_total"] += actual_instrument + simulated_instrument

            # Commercial: Track simulated instrument training (includes approved simulator time)
            if dual_received > 0 and (actual_instrument > 0 or simulated_instrument > 0):
                # For CPL requirement 9: includes airplane AND approved simulator instrument time
                if simulated_flight == 0:  # Actual airplane
                    instrument_dual_time = min(dual_received, actual_instrument + simulated_instrument)
                    totals["cpl_sim_instrument_airplane"] += instrument_dual_time
                    totals["cpl_sim_instrument_training"] += instrument_dual_time
                elif simulated_flight > 0:  # Approved simulator
                    # Instrument time in simulator counts toward CPL total instrument training
                    sim_instrument_time = min(dual_received, actual_instrument + simulated_instrument)
                    totals["cpl_sim_instrument_training"] += sim_instrument_time

            # Commercial: Track solo in single-engine (requirement 15)
            if solo > 0 and is_single_engine_airplane:
                totals["cpl_solo_se"] += solo

            # Commercial: Track complex/turbine/TAA training time (requirement 11)
            turbine_time = parse_decimal(row.get("[Hours]Turbine", "0"))
            taa_time = parse_decimal(row.get("[Hours]TAA", "0"))
            if dual_received > 0 and (complex_time > 0 or turbine_time > 0 or taa_time > 0):
                # Use the maximum of complex, turbine, or TAA time for this flight
                training_time = max(complex_time, turbine_time, taa_time)
                totals["cpl_complex_turbine_taa"] += min(dual_received, training_time)

            # Commercial: Track checkride prep in last 2 calendar months (requirement 14)
            # Checkride prep is dual received in single-engine airplane
            if flight_date and flight_date >= two_months_ago:
                if dual_received > 0 and is_single_engine_airplane:
                    totals["cpl_checkride_prep_recent"] += dual_received

            # Check for Private Pilot long XC (150nm, 3+ stops, solo)
            if distance >= 150 and solo > 0 and count_route_segments(route) >= 3:
                # Check for segment >50nm (simplified - just check if route has multiple airports)
                if "K" in route and route.count("K") >= 3:
                    long_xc_completed = 1
                    private_long_xc_flights.append(
                        {
                            "date": date_str,
                            "aircraft": row.get("AircraftID", ""),
                            "distance": float(distance),
                            "route": route,
                        }
                    )

            # Check for Instrument Rating 250nm XC
            # Must be 250nm+ XC with instructor, instrument approaches at each airport
            approaches_str = row.get("Approach1", "").strip()
            has_approaches = approaches_str != ""

            if (
                distance >= 250
                and cross_country > 0
                and dual_received > 0
                and (actual_instrument > 0 or simulated_instrument > 0)
                and has_approaches
                and simulated_flight == 0  # Must be in airplane
            ):
                # Count unique approach types
                approach_types = set()
                for i in range(1, 7):  # ForeFlight has Approach1 through Approach6
                    approach = row.get(f"Approach{i}", "").strip()
                    if approach:
                        # Extract approach type (ILS, VOR, RNAV, etc.)
                        approach_type = (
                            approach.split("-")[0] if "-" in approach else approach.split()[0] if approach else ""
                        )
                        if approach_type:
                            approach_types.add(approach_type.upper())

                ir_250nm_xc_flights.append(
                    {
                        "date": date_str,
                        "aircraft": row.get("AircraftID", ""),
                        "distance": float(distance),
                        "route": route,
                        "approach_types": list(approach_types),
                        "approach_count": len(approach_types),
                    }
                )

            # Check for towered operations
            from_airport = row.get("From", "").strip()
            to_airport = row.get("To", "").strip()
            day_landings = parse_decimal(row.get("DayLandingsFullStop", "0"))
            day_takeoffs = parse_decimal(row.get("DayTakeoffs", "0"))

            if solo > 0:  # Solo flight
                if is_towered_airport(from_airport) and day_takeoffs > 0:
                    towered_ops_count += int(day_takeoffs)
                if is_towered_airport(to_airport) and day_landings > 0:
                    towered_ops_count += int(day_landings)

            # Commercial: Track 2-hour day XC >100nm in single-engine (requirement 12)
            # Day flight means primarily day (allow small night portion if <0.5 hours)
            if (
                dual_received > 0
                and cross_country > 0
                and total_time >= 2.0
                and distance >= 100
                and is_single_engine_airplane
                and (total_time - night) >= 2.0  # At least 2 hours of day flight
            ):
                cpl_2hr_day_xc_flights.append(
                    {
                        "date": date_str,
                        "aircraft": row.get("AircraftID", ""),
                        "distance": float(distance),
                        "route": route,
                        "total_time": float(total_time),
                    }
                )

            # Commercial: Track 2-hour night XC >100nm in single-engine (requirement 13)
            if (
                dual_received > 0
                and cross_country > 0
                and total_time >= 2.0
                and distance >= 100
                and night >= 2.0
                and is_single_engine_airplane
            ):
                cpl_2hr_night_xc_flights.append(
                    {
                        "date": date_str,
                        "aircraft": row.get("AircraftID", ""),
                        "distance": float(distance),
                        "route": route,
                        "total_time": float(total_time),
                        "night_time": float(night),
                    }
                )

            # Commercial: Track 300nm XC (requirement 16)
            if (
                distance >= 300
                and cross_country > 0
                and is_solo_or_instructor_only(pic, solo, dual_received)
                and check_300nm_xc_requirement(distance, route, from_airport)
                and simulated_flight == 0
            ):
                cpl_300nm_xc_flights.append(
                    {
                        "date": date_str,
                        "aircraft": row.get("AircraftID", ""),
                        "distance": float(distance),
                        "route": route,
                        "is_solo": solo > 0,
                    }
                )

            # Commercial: Track night VFR in single-engine (requirement 17)
            # Must be solo or PIC with instructor only (no dual received)
            if (
                night > 0
                and is_solo_or_instructor_only(pic, solo, dual_received)
                and is_single_engine_airplane
                and actual_instrument == 0  # VFR only
            ):
                totals["cpl_night_vfr"] += night

            # Commercial: Track night takeoffs/landings at towered airports (requirement 18)
            night_takeoffs = parse_decimal(row.get("NightTakeoffs", "0"))
            night_landings = parse_decimal(row.get("NightLandingsFullStop", "0"))
            if is_solo_or_instructor_only(pic, solo, dual_received):
                if is_towered_airport(from_airport) and night_takeoffs > 0:
                    cpl_night_takeoffs_towered += int(night_takeoffs)
                if is_towered_airport(to_airport) and night_landings > 0:
                    cpl_night_landings_towered += int(night_landings)

    # Set special fields
    totals["private_long_xc"] = long_xc_completed
    totals["private_towered_ops"] = min(towered_ops_count, 3)  # Cap at 3 for requirement

    # Recent instrument (actual calculation from last 2 calendar months)
    totals["recent_instrument"] = recent_instrument_time

    # IR 250nm XC - check if we have qualifying flights with 3+ different approach types
    ir_250nm_qualified = any(flight["approach_count"] >= 3 for flight in ir_250nm_xc_flights)
    totals["ir_250nm_xc"] = 1 if ir_250nm_qualified else 0

    # Commercial: Set qualifying flight completion flags
    totals["cpl_2hr_day_xc"] = 1 if len(cpl_2hr_day_xc_flights) > 0 else 0
    totals["cpl_2hr_night_xc"] = 1 if len(cpl_2hr_night_xc_flights) > 0 else 0
    totals["cpl_300nm_xc"] = 1 if len(cpl_300nm_xc_flights) > 0 else 0

    # Commercial: Set night towered operations
    totals["cpl_night_takeoffs_towered"] = cpl_night_takeoffs_towered
    totals["cpl_night_landings_towered"] = cpl_night_landings_towered

    # Store qualifying flights as metadata (for display purposes)
    # Sort by date (earliest first) so the first entry is the first qualifying flight
    private_long_xc_flights.sort(key=lambda x: x["date"])
    ir_250nm_xc_flights.sort(key=lambda x: x["date"])
    cpl_2hr_day_xc_flights.sort(key=lambda x: x["date"])
    cpl_2hr_night_xc_flights.sort(key=lambda x: x["date"])
    cpl_300nm_xc_flights.sort(key=lambda x: x["date"])

    totals["_qualifying_flights"] = {
        "private_long_xc": private_long_xc_flights,
        "ir_250nm_xc": ir_250nm_xc_flights,
        "cpl_2hr_day_xc": cpl_2hr_day_xc_flights,
        "cpl_2hr_night_xc": cpl_2hr_night_xc_flights,
        "cpl_300nm_xc": cpl_300nm_xc_flights,
    }

    return totals


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python calculate_hours.py <logbook.csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    hours = calculate_hours_from_csv(csv_path)

    print("Calculated Hours:")
    print("-" * 40)
    for key, value in sorted(hours.items()):
        if key.startswith("_"):  # Skip metadata fields
            continue
        print(f"{key}: {float(value):.1f}")
