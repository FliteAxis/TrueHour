"""Budget management endpoints."""

from datetime import date as date_type
from typing import List, Optional

from app.models import (
    BudgetCreate,
    BudgetEntryCreate,
    BudgetEntryResponse,
    BudgetResponse,
    BudgetStatusResponse,
    BudgetUpdate,
)
from app.postgres_database import postgres_db
from app.services import budget_service
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List all budgets."""
    budgets = await postgres_db.get_budgets(is_active=is_active)
    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int):
    """Get single budget by ID."""
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate):
    """Create new budget."""
    # Validate budget_type
    if budget.budget_type not in ["monthly", "annual", "goal"]:
        raise HTTPException(status_code=400, detail="budget_type must be 'monthly', 'annual', or 'goal'")

    # Validate date range if provided
    if budget.start_date and budget.end_date and budget.start_date > budget.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    try:
        created = await postgres_db.create_budget(budget.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, budget: BudgetUpdate):
    """Update budget."""
    # Check if budget exists
    existing = await postgres_db.get_budget_by_id(budget_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Validate budget_type if provided
    if budget.budget_type and budget.budget_type not in ["monthly", "annual", "goal"]:
        raise HTTPException(status_code=400, detail="budget_type must be 'monthly', 'annual', or 'goal'")

    # Validate date range if both provided
    if budget.start_date and budget.end_date and budget.start_date > budget.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    try:
        # Filter out None values
        update_data = {k: v for k, v in budget.model_dump().items() if v is not None}
        updated = await postgres_db.update_budget(budget_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Budget not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: int):
    """Delete budget (cascade deletes entries)."""
    success = await postgres_db.delete_budget(budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return None


# Budget Entry Endpoints


@router.get("/{budget_id}/entries", response_model=List[BudgetEntryResponse])
async def list_budget_entries(budget_id: int):
    """Get all entries for a budget."""
    # Verify budget exists
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    entries = await postgres_db.get_budget_entries(budget_id)
    return entries


@router.post("/{budget_id}/entries", response_model=BudgetEntryResponse, status_code=201)
async def create_or_update_budget_entry(budget_id: int, entry: BudgetEntryCreate):
    """Create or update budget entry for a month (upsert)."""
    # Verify budget exists
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Validate month is first day of month
    if entry.month.day != 1:
        raise HTTPException(status_code=400, detail="month must be first day of month (e.g., 2025-01-01)")

    try:
        created = await postgres_db.create_or_update_budget_entry(budget_id, entry.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{budget_id}/entries/{entry_id}", status_code=204)
async def delete_budget_entry(budget_id: int, entry_id: int):
    """Delete budget entry."""
    # Verify budget exists
    budget = await postgres_db.get_budget_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    success = await postgres_db.delete_budget_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget entry not found")
    return None


# Budget Analysis Endpoints


@router.get("/{budget_id}/status", response_model=BudgetStatusResponse)
async def get_budget_status(
    budget_id: int,
    month: Optional[str] = Query(None, description="Month in YYYY-MM-DD format (defaults to current month)"),
):
    """Get budget vs actual status for a month."""
    if month:
        try:
            check_month = date_type.fromisoformat(month)
            # Ensure it's the first of the month
            check_month = date_type(check_month.year, check_month.month, 1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        today = date_type.today()
        check_month = date_type(today.year, today.month, 1)

    status = await budget_service.get_budget_status(budget_id, check_month)

    if not status:
        raise HTTPException(status_code=404, detail="Budget or entry not found for this month")

    return status


@router.get("/{budget_id}/summary")
async def get_budget_summary(
    budget_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
):
    """Get budget summary for a date range."""
    try:
        start = date_type.fromisoformat(start_date)
        end = date_type.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if start > end:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    summary = await budget_service.get_budget_summary(budget_id, start, end)

    if not summary:
        raise HTTPException(status_code=404, detail="Budget not found")

    return summary
