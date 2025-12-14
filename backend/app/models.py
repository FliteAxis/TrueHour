"""Pydantic models for TrueHour FAA lookup API responses."""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class AircraftResponse(BaseModel):
    """Aircraft registration lookup response."""

    tail_number: str
    manufacturer: str
    model: str
    series: Optional[str] = None
    aircraft_type: str
    engine_type: str
    num_engines: Optional[int] = None
    num_seats: Optional[int] = None
    year_mfr: Optional[int] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "tail_number": "N172SP",
                "manufacturer": "CESSNA",
                "model": "172S",
                "series": "SKYHAWK SP",
                "aircraft_type": "Fixed Wing Single-Engine",
                "engine_type": "Reciprocating",
                "num_engines": 1,
                "num_seats": 4,
                "year_mfr": 2001,
            }
        }
    }


class BulkRequest(BaseModel):
    """Bulk lookup request."""

    tail_numbers: List[str] = Field(..., max_length=50)

    model_config = {"json_schema_extra": {"example": {"tail_numbers": ["N172SP", "N12345", "N67890"]}}}


class BulkResult(BaseModel):
    """Single result within bulk response."""

    tail_number: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    series: Optional[str] = None
    aircraft_type: Optional[str] = None
    engine_type: Optional[str] = None
    num_engines: Optional[int] = None
    num_seats: Optional[int] = None
    year_mfr: Optional[int] = None
    error: Optional[str] = None


class BulkResponse(BaseModel):
    """Bulk lookup response."""

    total: int
    found: int
    results: List[BulkResult]

    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 3,
                "found": 2,
                "results": [
                    {
                        "tail_number": "N172SP",
                        "manufacturer": "CESSNA",
                        "model": "172S",
                        "aircraft_type": "Fixed Wing Single-Engine",
                        "engine_type": "Reciprocating",
                    },
                    {"tail_number": "N99999", "error": "Not found"},
                ],
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    database_exists: bool
    record_count: int
    last_updated: Optional[str] = None


class StatsResponse(BaseModel):
    """Database statistics response."""

    record_count: int
    last_updated: Optional[str] = None


# Budget Models


class BudgetBase(BaseModel):
    """Base budget fields."""

    name: str = Field(..., description="Budget name (e.g., '2025 Annual Flying Budget')")
    budget_type: str = Field(..., description="Budget type: monthly, annual, or goal")
    amount: Decimal = Field(..., gt=0, description="Total budget amount")
    start_date: Optional[date] = Field(None, description="Budget period start date")
    end_date: Optional[date] = Field(None, description="Budget period end date")
    categories: Optional[List[str]] = Field(None, description="Expense categories to track (empty = all)")
    notes: Optional[str] = None
    is_active: bool = True


class BudgetCreate(BudgetBase):
    """Create budget request."""

    pass


class BudgetUpdate(BaseModel):
    """Update budget request (all fields optional)."""

    name: Optional[str] = None
    budget_type: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    categories: Optional[List[str]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class BudgetResponse(BudgetBase):
    """Budget response."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetEntryBase(BaseModel):
    """Base budget entry fields."""

    month: date = Field(..., description="First day of month (e.g., 2025-01-01)")
    allocated_amount: Decimal = Field(..., gt=0, description="Allocated amount for this month")
    notes: Optional[str] = None


class BudgetEntryCreate(BudgetEntryBase):
    """Create budget entry request."""

    pass


class BudgetEntryResponse(BudgetEntryBase):
    """Budget entry response."""

    id: int
    budget_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetStatusResponse(BaseModel):
    """Budget vs actual status for a specific month."""

    budget_id: int
    budget_name: str
    month: date
    allocated: Decimal
    actual_expenses: Decimal
    actual_flight_costs: Decimal
    total_actual: Decimal
    difference: Decimal
    percentage_used: float
    is_over_budget: bool

    model_config = {"from_attributes": True}
