"""Budget Cards management endpoints."""

from datetime import date as date_type
from decimal import Decimal
from typing import List, Optional

from app.models import (
    AnnualBudgetSummary,
    BudgetCardCreate,
    BudgetCardResponse,
    BudgetCardUpdate,
    CategoryBudgetSummary,
    ExpenseBudgetLinkResponse,
    MonthlyBudgetSummary,
)
from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/budget-cards", tags=["Budget Cards"])


@router.get("/", response_model=List[BudgetCardResponse])
async def list_budget_cards(
    status: Optional[str] = Query(None, description="Filter by status (active, completed, cancelled)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    month: Optional[date_type] = Query(None, description="Filter by month (YYYY-MM-DD)"),
):
    """List all budget cards with optional filtering."""
    try:
        cards = await postgres_db.get_budget_cards(status=status, category=category, month=month)
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{card_id}", response_model=BudgetCardResponse)
async def get_budget_card(card_id: int):
    """Get a single budget card by ID."""
    try:
        card = await postgres_db.get_budget_card(card_id)
        if not card:
            raise HTTPException(status_code=404, detail="Budget card not found")
        return card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=BudgetCardResponse, status_code=201)
async def create_budget_card(card: BudgetCardCreate):
    """Create a new budget card."""
    try:
        card_id = await postgres_db.create_budget_card(card.model_dump())
        created_card = await postgres_db.get_budget_card(card_id)
        return created_card
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{card_id}", response_model=BudgetCardResponse)
async def update_budget_card(card_id: int, card: BudgetCardUpdate):
    """Update an existing budget card."""
    try:
        # Check if exists
        existing = await postgres_db.get_budget_card(card_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Budget card not found")

        # Update
        await postgres_db.update_budget_card(card_id, card.model_dump(exclude_unset=True))
        updated_card = await postgres_db.get_budget_card(card_id)
        return updated_card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{card_id}", status_code=204)
async def delete_budget_card(card_id: int):
    """Delete a budget card."""
    try:
        # Check if exists
        existing = await postgres_db.get_budget_card(card_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Budget card not found")

        await postgres_db.delete_budget_card(card_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{card_id}/duplicate", response_model=BudgetCardResponse, status_code=201)
async def duplicate_budget_card(card_id: int):
    """Duplicate an existing budget card."""
    try:
        # Get the original card
        original = await postgres_db.get_budget_card(card_id)
        if not original:
            raise HTTPException(status_code=404, detail="Budget card not found")

        # Create a new card with the same data but different name
        duplicate_data = {
            "name": f"{original['name']} (Copy)",
            "category": original["category"],
            "frequency": original["frequency"],
            "when_date": original["when_date"],
            "budgeted_amount": original["budgeted_amount"],
            "notes": original.get("notes"),
            "associated_hours": original.get("associated_hours"),
            "aircraft_id": original.get("aircraft_id"),
            "hourly_rate_type": original.get("hourly_rate_type", "wet"),
            "status": "active",  # Always set duplicates as active
        }

        # Create the duplicate
        new_card_id = await postgres_db.create_budget_card(duplicate_data)
        duplicated_card = await postgres_db.get_budget_card(new_card_id)
        return duplicated_card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/monthly", response_model=List[MonthlyBudgetSummary])
async def get_monthly_summary(
    year: Optional[int] = Query(None, description="Year to filter (default: current year)"),
):
    """Get monthly budget summary."""
    try:
        summary = await postgres_db.get_monthly_budget_summary(year)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/category", response_model=List[CategoryBudgetSummary])
async def get_category_summary(
    year: Optional[int] = Query(None, description="Year to filter (default: all time)"),
):
    """Get budget summary by category."""
    try:
        summary = await postgres_db.get_category_budget_summary(year)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/annual", response_model=AnnualBudgetSummary)
async def get_annual_summary(year: int = Query(..., description="Year to summarize")):
    """Get complete annual budget summary."""
    try:
        summary = await postgres_db.get_annual_budget_summary(year)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Expense-Budget Card Links


@router.post("/{card_id}/link-expense", response_model=ExpenseBudgetLinkResponse, status_code=201)
async def link_expense_to_card(card_id: int, expense_id: int, amount: Decimal):
    """Link an expense to a budget card."""
    try:
        # Check if card exists
        card = await postgres_db.get_budget_card(card_id)
        if not card:
            raise HTTPException(status_code=404, detail="Budget card not found")

        # Create link
        link_data = {"expense_id": expense_id, "budget_card_id": card_id, "amount": amount}
        link_id = await postgres_db.create_expense_budget_link(link_data)

        # Return link
        link = await postgres_db.get_expense_budget_link(link_id)
        return link
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{card_id}/unlink-expense/{expense_id}", status_code=204)
async def unlink_expense_from_card(card_id: int, expense_id: int):
    """Unlink an expense from a budget card."""
    try:
        await postgres_db.delete_expense_budget_link(expense_id, card_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-cost")
async def calculate_training_cost(
    aircraft_id: int,
    hours: float,
    rate_type: str = "wet",
    include_instructor: bool = True,
):
    """Calculate training cost based on aircraft, hours, rate type, and instructor rate."""
    try:
        # Get aircraft details
        aircraft = await postgres_db.get_aircraft_by_id(aircraft_id)
        if not aircraft:
            raise HTTPException(status_code=404, detail="Aircraft not found")

        # Get instructor rate from user settings
        instructor_rate = Decimal("0")
        if include_instructor:
            settings = await postgres_db.get_user_settings()
            if settings and settings.get("ground_instruction_rate"):
                instructor_rate = Decimal(str(settings["ground_instruction_rate"]))

        # Calculate cost based on rate type
        if rate_type == "wet":
            if not aircraft.get("hourly_rate_wet"):
                raise HTTPException(status_code=400, detail="Aircraft does not have a wet hourly rate")

            aircraft_hourly_rate = aircraft["hourly_rate_wet"]
            total_hourly_rate = aircraft_hourly_rate + instructor_rate
            cost = Decimal(str(hours)) * total_hourly_rate

            breakdown = {
                "hours": hours,
                "rate_type": "wet",
                "aircraft_hourly_rate": float(aircraft_hourly_rate),
                "instructor_rate": float(instructor_rate),
                "total_hourly_rate": float(total_hourly_rate),
                "total_cost": float(cost),
                "calculation": (
                    f"{hours} hrs × (${aircraft_hourly_rate}/hr (wet) + "
                    f"${instructor_rate}/hr (instructor)) = ${cost:.2f}"
                    if instructor_rate > 0
                    else f"{hours} hrs × ${aircraft_hourly_rate}/hr (wet)"
                ),
            }
        else:  # dry
            if not aircraft.get("hourly_rate_dry"):
                raise HTTPException(status_code=400, detail="Aircraft does not have a dry hourly rate")

            dry_rate = aircraft["hourly_rate_dry"]
            fuel_cost_per_hour = Decimal("0")

            # Add fuel costs if available
            if aircraft.get("fuel_burn_rate") and aircraft.get("fuel_price_per_gallon"):
                fuel_cost_per_hour = aircraft["fuel_burn_rate"] * aircraft["fuel_price_per_gallon"]

            aircraft_total_rate = dry_rate + fuel_cost_per_hour
            total_hourly_rate = aircraft_total_rate + instructor_rate
            cost = Decimal(str(hours)) * total_hourly_rate

            breakdown = {
                "hours": hours,
                "rate_type": "dry",
                "hourly_rate_dry": float(dry_rate),
                "fuel_burn_rate": float(aircraft.get("fuel_burn_rate", 0)),
                "fuel_price_per_gallon": float(aircraft.get("fuel_price_per_gallon", 0)),
                "fuel_cost_per_hour": float(fuel_cost_per_hour),
                "aircraft_total_rate": float(aircraft_total_rate),
                "instructor_rate": float(instructor_rate),
                "total_hourly_rate": float(total_hourly_rate),
                "total_cost": float(cost),
                "calculation": (
                    f"{hours} hrs × (${dry_rate}/hr (dry) + "
                    f"{aircraft.get('fuel_burn_rate', 0)} gal/hr × "
                    f"${aircraft.get('fuel_price_per_gallon', 0)}/gal + ${instructor_rate}/hr (instructor))"
                    if instructor_rate > 0
                    else (
                        f"{hours} hrs × (${dry_rate}/hr (dry) + "
                        f"{aircraft.get('fuel_burn_rate', 0)} gal/hr × "
                        f"${aircraft.get('fuel_price_per_gallon', 0)}/gal) = ${cost:.2f}"
                        if fuel_cost_per_hour > 0
                        else f"{hours} hrs × ${dry_rate}/hr (dry) = ${cost:.2f}"
                    )
                ),
            }

        return breakdown

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
