"""User aircraft management endpoints."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, List, Optional

from app.postgres_database import postgres_db
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, condecimal

router = APIRouter(prefix="/api/user/aircraft", tags=["User Aircraft"])


class UserAircraftCreate(BaseModel):
    """Create user aircraft."""

    tail_number: str = Field(..., description="Tail number (e.g., N172SP)")
    type_code: Optional[str] = None
    year: Optional[int] = Field(None, ge=1900, le=2100)
    make: Optional[str] = None
    model: Optional[str] = None
    gear_type: Optional[str] = Field(None, description="Fixed, Retractable, etc.")
    engine_type: Optional[str] = None
    aircraft_class: Optional[str] = None
    is_complex: bool = False
    is_taa: bool = False
    is_high_performance: bool = False
    is_simulator: bool = False
    category: Optional[str] = Field(None, description="owned, club, or rental")
    hourly_rate_wet: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    hourly_rate_dry: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    notes: Optional[str] = None
    is_active: bool = True


class UserAircraftUpdate(BaseModel):
    """Update user aircraft (all fields optional)."""

    tail_number: Optional[str] = None
    type_code: Optional[str] = None
    year: Optional[int] = Field(None, ge=1900, le=2100)
    make: Optional[str] = None
    model: Optional[str] = None
    gear_type: Optional[str] = None
    engine_type: Optional[str] = None
    aircraft_class: Optional[str] = None
    is_complex: Optional[bool] = None
    is_taa: Optional[bool] = None
    is_high_performance: Optional[bool] = None
    is_simulator: Optional[bool] = None
    category: Optional[str] = None
    hourly_rate_wet: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    hourly_rate_dry: Optional[Annotated[Decimal, condecimal(max_digits=10, decimal_places=2)]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class UserAircraftResponse(BaseModel):
    """User aircraft response."""

    id: int
    tail_number: str
    type_code: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    gear_type: Optional[str] = None
    engine_type: Optional[str] = None
    aircraft_class: Optional[str] = None
    is_complex: bool
    is_taa: bool
    is_high_performance: bool
    is_simulator: bool
    category: Optional[str] = None
    hourly_rate_wet: Optional[Decimal] = None
    hourly_rate_dry: Optional[Decimal] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=List[UserAircraftResponse])
async def list_aircraft(is_active: Optional[bool] = Query(None, description="Filter by active status")):
    """List all user aircraft."""
    aircraft_list = await postgres_db.get_user_aircraft(is_active=is_active)
    return aircraft_list


@router.get("/{aircraft_id}", response_model=UserAircraftResponse)
async def get_aircraft(aircraft_id: int):
    """Get single aircraft by ID."""
    aircraft = await postgres_db.get_aircraft_by_id(aircraft_id)
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return aircraft


@router.post("", response_model=UserAircraftResponse, status_code=201)
async def create_aircraft(aircraft: UserAircraftCreate):
    """Add aircraft to user's list."""
    # Check if tail number already exists
    existing = await postgres_db.get_aircraft_by_tail(aircraft.tail_number)
    if existing:
        raise HTTPException(status_code=409, detail=f"Aircraft {aircraft.tail_number} already exists")

    try:
        created = await postgres_db.create_aircraft(aircraft.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{aircraft_id}", response_model=UserAircraftResponse)
async def update_aircraft(aircraft_id: int, aircraft: UserAircraftUpdate):
    """Update aircraft details."""
    # Check if aircraft exists
    existing = await postgres_db.get_aircraft_by_id(aircraft_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Aircraft not found")

    # If updating tail number, check for conflicts
    if aircraft.tail_number:
        conflict = await postgres_db.get_aircraft_by_tail(aircraft.tail_number)
        if conflict and conflict["id"] != aircraft_id:
            raise HTTPException(status_code=409, detail=f"Aircraft {aircraft.tail_number} already exists")

    try:
        # Filter out None values
        update_data = {k: v for k, v in aircraft.model_dump().items() if v is not None}
        updated = await postgres_db.update_aircraft(aircraft_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Aircraft not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{aircraft_id}", status_code=204)
async def delete_aircraft(aircraft_id: int):
    """Remove aircraft from user's list."""
    success = await postgres_db.delete_aircraft(aircraft_id)
    if not success:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return None
