"""Integration tests for the uncounted-spend budget endpoint.

Budget card actuals sum expense_budget_links.amount, so an expense with no
link counts against no budget, and flight cost columns are never read at all.
This endpoint reports both so the budget view can stop implying its totals are
complete.
"""

from unittest.mock import AsyncMock, patch

EMPTY = {
    "unlinked_expense_count": 0,
    "unlinked_expense_total": "0.00",
    "unlinked_expenses": [],
    "partially_linked_expense_count": 0,
    "partially_linked_shortfall": "0.00",
    "flight_cost_count": 0,
    "flight_cost_total": "0.00",
    "flight_cost_breakdown": {
        "fuel_cost": "0.00",
        "landing_fees": "0.00",
        "instructor_cost": "0.00",
        "rental_cost": "0.00",
        "other_costs": "0.00",
    },
}

WITH_GAPS = {
    **EMPTY,
    "unlinked_expense_count": 2,
    "unlinked_expense_total": "412.75",
    "unlinked_expenses": [
        {
            "id": 7,
            "date": "2026-08-01",
            "category": "Fuel",
            "subcategory": None,
            "description": "Avgas",
            "vendor": "Signature KPWK",
            "amount": "312.75",
            "aircraft_id": 3,
        },
        {
            "id": 9,
            "date": "2026-08-14",
            "category": "Maintenance",
            "subcategory": None,
            "description": None,
            "vendor": None,
            "amount": "100.00",
            "aircraft_id": None,
        },
    ],
    "partially_linked_expense_count": 1,
    "partially_linked_shortfall": "40.00",
    "flight_cost_count": 5,
    "flight_cost_total": "980.00",
    "flight_cost_breakdown": {
        "fuel_cost": "600.00",
        "landing_fees": "30.00",
        "instructor_cost": "300.00",
        "rental_cost": "0.00",
        "other_costs": "50.00",
    },
}

ENDPOINT = "/api/user/budget-cards/summary/uncounted"
TARGET = "app.postgres_database.postgres_db.get_uncounted_spend"


def test_uncounted_spend_reports_zero_when_everything_is_linked(client):
    """A clean ledger reports explicit zeros rather than omitting the figures."""
    with patch(TARGET, AsyncMock(return_value=EMPTY)):
        response = client.get(ENDPOINT)
    assert response.status_code == 200
    body = response.json()
    assert body["unlinked_expense_count"] == 0
    assert float(body["unlinked_expense_total"]) == 0
    assert body["unlinked_expenses"] == []
    assert float(body["flight_cost_total"]) == 0


def test_uncounted_spend_reports_unlinked_expenses(client):
    """Unlinked expenses are returned with the rows, not just a total."""
    with patch(TARGET, AsyncMock(return_value=WITH_GAPS)):
        response = client.get(ENDPOINT)
    assert response.status_code == 200
    body = response.json()
    assert body["unlinked_expense_count"] == 2
    assert float(body["unlinked_expense_total"]) == 412.75
    assert len(body["unlinked_expenses"]) == 2
    assert body["unlinked_expenses"][0]["vendor"] == "Signature KPWK"


def test_flight_costs_reported_separately_from_unlinked_expenses(client):
    """The two gaps must not be blended - they have different remedies.

    An unlinked expense is fixed by linking it. Flight cost columns are a
    modelling question, so the figures stay distinct and the breakdown is
    itemised.
    """
    with patch(TARGET, AsyncMock(return_value=WITH_GAPS)):
        response = client.get(ENDPOINT)
    body = response.json()
    assert float(body["flight_cost_total"]) == 980.00
    assert float(body["unlinked_expense_total"]) == 412.75
    assert float(body["flight_cost_total"]) != float(body["unlinked_expense_total"])
    breakdown = body["flight_cost_breakdown"]
    assert float(breakdown["fuel_cost"]) == 600.00
    assert float(breakdown["instructor_cost"]) == 300.00
    # The breakdown must account for the whole total, or the number is a lie.
    assert sum(float(v) for v in breakdown.values()) == float(body["flight_cost_total"])


def test_partially_linked_shortfall_is_reported(client):
    """An expense whose links do not cover its full amount leaves a shortfall."""
    with patch(TARGET, AsyncMock(return_value=WITH_GAPS)):
        response = client.get(ENDPOINT)
    body = response.json()
    assert body["partially_linked_expense_count"] == 1
    assert float(body["partially_linked_shortfall"]) == 40.00
