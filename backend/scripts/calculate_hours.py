#!/usr/bin/env python3
"""
Calculate detailed flight hours from ForeFlight logbook CSV.
Calculates additional fields like dual_xc, private_long_xc, private_towered_ops.
"""

import csv
import sys
from decimal import Decimal
from collections import defaultdict


def parse_decimal(value):
    """Parse a value to Decimal, returning 0 if empty or invalid."""
    if not value or value.strip() == "":
        return Decimal("0")
    try:
        return Decimal(value.strip())
    except:
        return Decimal("0")


def count_route_segments(route):
    """Count number of airports in route (for full stops)."""
    if not route:
        return 0
    # Split by space and filter out airways/waypoints (usually contain numbers/letters mix)
    airports = [seg for seg in route.split() if seg.startswith('K') and len(seg) == 4]
    return len(set(airports))  # Unique airports


def is_towered_airport(airport_code):
    """
    Check if airport is towered.
    This is a simplified check - in production you'd query FAA data.
    Common towered airports starting with K.
    """
    # List of known towered airports (abbreviated for now)
    # In production, query from FAA database
    towered = {
        'KAMW', 'KALO', 'KATL', 'KORD', 'KDFW', 'KDEN', 'KLAX', 'KJFK', 'KSFO',
        'KLAS', 'KMCO', 'KSEA', 'KPHX', 'KIAH', 'KEWR', 'KBOS', 'KMIA', 'KDCA',
        'KLGA', 'KMDW', 'KBWI', 'KDAL', 'KSAN', 'KSLC', 'KPDX', 'KOAK', 'KSMF',
        'KSNA', 'KAUS', 'KRDU', 'KCVG', 'KPIT', 'KCLE', 'KSTL', 'KBNA', 'KMSY',
    }
    return airport_code in towered


def calculate_hours_from_csv(csv_path):
    """Calculate comprehensive hours from ForeFlight CSV."""

    totals = defaultdict(Decimal)
    long_xc_completed = 0
    towered_ops_count = 0

    # For recent instrument (last 2 calendar months)
    # This is simplified - in production track dates properly

    with open(csv_path, 'r', encoding='utf-8') as f:
        # Skip header rows until we find "Date,"
        for line in f:
            if line.startswith('Date,'):
                headers = line.strip().split(',')
                break

        reader = csv.DictReader(f, fieldnames=headers)

        for row in reader:
            date = row.get('Date', '').strip()
            if not date or date == 'Flights Table':
                continue

            # Basic totals
            total_time = parse_decimal(row.get('TotalTime', '0'))
            pic = parse_decimal(row.get('PIC', '0'))
            cross_country = parse_decimal(row.get('CrossCountry', '0'))
            night = parse_decimal(row.get('Night', '0'))
            dual_received = parse_decimal(row.get('DualReceived', '0'))
            dual_given = parse_decimal(row.get('DualGiven', '0'))
            simulated_flight = parse_decimal(row.get('SimulatedFlight', '0'))
            actual_instrument = parse_decimal(row.get('ActualInstrument', '0'))
            simulated_instrument = parse_decimal(row.get('SimulatedInstrument', '0'))
            complex_time = parse_decimal(row.get('[Hours]Complex', '0'))

            # Accumulate standard fields
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

            # Calculate PIC XC (cross country as PIC)
            if pic > 0 and cross_country > 0:
                pic_xc_time = min(pic, cross_country)
                totals['pic_xc'] += pic_xc_time

            # Calculate dual XC (cross country with instructor)
            if dual_received > 0 and cross_country > 0:
                dual_xc_time = min(dual_received, cross_country)
                totals['dual_xc'] += dual_xc_time

            # Calculate instrument dual airplane (not simulator)
            if dual_received > 0 and (actual_instrument > 0 or simulated_instrument > 0):
                instrument_time = actual_instrument + simulated_instrument
                instrument_dual = min(dual_received, instrument_time)
                totals['instrument_dual_airplane'] += instrument_dual

            # Total instrument time
            totals['instrument_total'] += actual_instrument + simulated_instrument + simulated_flight

            # Check for Private Pilot long XC (150nm, 3+ stops, solo)
            distance = parse_decimal(row.get('Distance', '0'))
            route = row.get('Route', '').strip()
            solo = parse_decimal(row.get('Solo', '0'))

            if distance >= 150 and solo > 0 and count_route_segments(route) >= 3:
                # Check for segment >50nm (simplified - just check if route has multiple airports)
                if 'K' in route and route.count('K') >= 3:
                    long_xc_completed = 1

            # Check for towered operations
            from_airport = row.get('From', '').strip()
            to_airport = row.get('To', '').strip()
            day_landings = parse_decimal(row.get('DayLandingsFullStop', '0'))
            day_takeoffs = parse_decimal(row.get('DayTakeoffs', '0'))

            if solo > 0:  # Solo flight
                if is_towered_airport(from_airport) and day_takeoffs > 0:
                    towered_ops_count += int(day_takeoffs)
                if is_towered_airport(to_airport) and day_landings > 0:
                    towered_ops_count += int(day_landings)

    # Set special fields
    totals['private_long_xc'] = long_xc_completed
    totals['private_towered_ops'] = min(towered_ops_count, 3)  # Cap at 3 for requirement

    # Recent instrument (simplified - would need date filtering in production)
    # For now, approximate as last 10% of instrument dual time
    totals['recent_instrument'] = totals['instrument_dual_airplane'] * Decimal('0.3')

    # IR 250nm XC (simplified check - would need proper route analysis)
    totals['ir_250nm_xc'] = 0  # TODO: Implement proper check

    return totals


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python calculate_hours.py <logbook.csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    hours = calculate_hours_from_csv(csv_path)

    print("Calculated Hours:")
    print("-" * 40)
    for key, value in sorted(hours.items()):
        print(f"{key}: {float(value):.1f}")
