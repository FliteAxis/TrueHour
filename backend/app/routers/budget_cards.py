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
