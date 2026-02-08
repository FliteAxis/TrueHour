"""Budget comparison and analysis service."""

from datetime import date
from decimal import Decimal
from typing import Optional

from app.postgres_database import postgres_db


async def get_budget_status(budget_id: int, month: date) -> Optional[dict]:
    """
    Calculate budget vs actual for a specific month.

    Args:
        budget_id: Budget ID
        month: First day of month to check (e.g., date(2025, 1, 1))

    Returns:
        Dict with budget status or None if budget/entry not found
    """
    # Get budget
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        return None

    # Get budget entry for this month
    entry = await postgres_db.get_budget_entry(budget_id, month)
    if not entry:
        return None

    allocated = Decimal(str(entry["allocated_amount"]))

    # Calculate month range: first day to last day of month
    month_start = month
    if month.month == 12:
        month_end = date(month.year + 1, 1, 1)
    else:
        month_end = date(month.year, month.month + 1, 1)

    # Get actual expenses for this month
    expenses = await postgres_db.get_expenses(start_date=month_start, end_date=month_end, limit=10000)

    # Filter by categories if specified
    if budget.get("categories"):
        expenses = [e for e in expenses if e["category"] in budget["categories"]]

    actual_expenses = sum(Decimal(str(e["amount"])) for e in expenses)

    # Get actual flight costs for this month
    flights = await postgres_db.get_flights(start_date=month_start, end_date=month_end, limit=10000)

    actual_flight_costs = Decimal("0")
    for flight in flights:
        actual_flight_costs += Decimal(str(flight.get("fuel_cost") or 0))
        actual_flight_costs += Decimal(str(flight.get("landing_fees") or 0))
        actual_flight_costs += Decimal(str(flight.get("instructor_cost") or 0))
        actual_flight_costs += Decimal(str(flight.get("rental_cost") or 0))
        actual_flight_costs += Decimal(str(flight.get("other_costs") or 0))

    # Calculate totals
    total_actual = actual_expenses + actual_flight_costs
    difference = allocated - total_actual
    percentage_used = float(total_actual / allocated * 100) if allocated > 0 else 0.0
    is_over_budget = total_actual > allocated

    return {
        "budget_id": budget_id,
        "budget_name": budget["name"],
        "month": month,
        "allocated": allocated,
        "actual_expenses": actual_expenses,
        "actual_flight_costs": actual_flight_costs,
        "total_actual": total_actual,
        "difference": difference,
        "percentage_used": percentage_used,
        "is_over_budget": is_over_budget,
    }


async def get_budget_summary(budget_id: int, start_date: date, end_date: date) -> Optional[dict]:
    """
    Get budget summary for a date range.

    Args:
        budget_id: Budget ID
        start_date: Range start date
        end_date: Range end date

    Returns:
        Dict with summary data or None if budget not found
    """
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        return None

    # Get all months in range
    months = []
    current = date(start_date.year, start_date.month, 1)
    end = date(end_date.year, end_date.month, 1)

    total_allocated = Decimal("0")
    total_actual = Decimal("0")

    while current <= end:
        status = await get_budget_status(budget_id, current)
        if status:
            months.append(status)
            total_allocated += status["allocated"]
            total_actual += status["total_actual"]

        # Move to next month
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    return {
        "budget_id": budget_id,
        "budget_name": budget["name"],
        "start_date": start_date,
        "end_date": end_date,
        "total_allocated": total_allocated,
        "total_actual": total_actual,
        "difference": total_allocated - total_actual,
        "months": months,
    }
