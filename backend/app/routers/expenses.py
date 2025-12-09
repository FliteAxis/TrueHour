"""Expense management endpoints."""

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, condecimal

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


class ExpenseCreate(BaseModel):
    """Create expense."""

    aircraft_id: Optional[int] = Field(None, description="Associated aircraft ID (null for general expenses)")
    category: str = Field(..., description="Expense category (fuel, insurance, maintenance, etc.)")
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount: condecimal(max_digits=10, decimal_places=2) = Field(..., gt=0)
    date: date_type
    is_recurring: bool = False
    recurrence_interval: Optional[str] = Field(None, description="monthly, quarterly, or annual")
    recurrence_end_date: Optional[date_type] = None
    vendor: Optional[str] = None
    is_tax_deductible: bool = False
    tax_category: Optional[str] = None


class ExpenseUpdate(BaseModel):
    """Update expense (all fields optional)."""

    aircraft_id: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[condecimal(max_digits=10, decimal_places=2)] = Field(None, gt=0)
    date: Optional[date_type] = None
    is_recurring: Optional[bool] = None
    recurrence_interval: Optional[str] = None
    recurrence_end_date: Optional[date_type] = None
    vendor: Optional[str] = None
    is_tax_deductible: Optional[bool] = None
    tax_category: Optional[str] = None


class ExpenseResponse(BaseModel):
    """Expense response."""

    id: int
    aircraft_id: Optional[int] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount: Decimal
    date: date_type
    is_recurring: bool
    recurrence_interval: Optional[str] = None
    recurrence_end_date: Optional[date_type] = None
    vendor: Optional[str] = None
    is_tax_deductible: bool
    tax_category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummaryResponse(BaseModel):
    """Expense summary grouped by category."""

    group_name: str
    count: int
    total_amount: Decimal
    avg_amount: Decimal
    min_amount: Decimal
    max_amount: Decimal

    model_config = {"from_attributes": True}


@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    aircraft_id: Optional[int] = Query(None, description="Filter by aircraft ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date_type] = Query(None, description="Filter by start date"),
    end_date: Optional[date_type] = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """List expenses with optional filters."""
    expenses = await postgres_db.get_expenses(
        aircraft_id=aircraft_id, category=category, start_date=start_date, end_date=end_date, limit=limit, offset=offset
    )
    return expenses


@router.get("/summary", response_model=List[ExpenseSummaryResponse])
async def get_expense_summary(
    start_date: Optional[date_type] = Query(None, description="Summary start date"),
    end_date: Optional[date_type] = Query(None, description="Summary end date"),
    group_by: str = Query("category", description="Group by category or subcategory"),
):
    """Get expense summary grouped by category or subcategory."""
    if group_by not in ["category", "subcategory"]:
        raise HTTPException(status_code=400, detail="group_by must be 'category' or 'subcategory'")

    summary = await postgres_db.get_expense_summary(start_date=start_date, end_date=end_date, group_by=group_by)
    return summary


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int):
    """Get single expense by ID."""
    expense = await postgres_db.get_expense_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(expense: ExpenseCreate):
    """Create new expense."""
    # If aircraft_id is provided, verify it exists
    if expense.aircraft_id:
        aircraft = await postgres_db.get_aircraft_by_id(expense.aircraft_id)
        if not aircraft:
            raise HTTPException(status_code=404, detail=f"Aircraft with ID {expense.aircraft_id} not found")

    try:
        created = await postgres_db.create_expense(expense.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: int, expense: ExpenseUpdate):
    """Update expense."""
    # Check if expense exists
    existing = await postgres_db.get_expense_by_id(expense_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")

    # If updating aircraft_id, verify it exists
    if expense.aircraft_id:
        aircraft = await postgres_db.get_aircraft_by_id(expense.aircraft_id)
        if not aircraft:
            raise HTTPException(status_code=404, detail=f"Aircraft with ID {expense.aircraft_id} not found")

    try:
        # Filter out None values
        update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
        updated = await postgres_db.update_expense(expense_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Expense not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(expense_id: int):
    """Delete expense."""
    success = await postgres_db.delete_expense(expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None
