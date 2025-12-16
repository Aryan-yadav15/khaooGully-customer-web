"""
Campus-related Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CampusBase(BaseModel):
    """Base campus model with common fields."""
    
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    hotspotLocation: str = Field(..., min_length=1, max_length=500, validation_alias="hotspot_location")
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)


class CampusCreate(CampusBase):
    """Model for creating a new campus."""
    
    isActive: bool = Field(True, validation_alias="is_active")


class CampusUpdate(BaseModel):
    """Model for updating campus details."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    hotspotLocation: Optional[str] = Field(None, min_length=1, max_length=500, validation_alias="hotspot_location")
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    isActive: Optional[bool] = Field(None, validation_alias="is_active")


class CampusResponse(CampusBase):
    """Model for campus response data."""
    
    id: str
    isActive: bool = Field(validation_alias="is_active")
    activePoolCount: int = Field(default=0, description="Number of active pools for this campus")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True
