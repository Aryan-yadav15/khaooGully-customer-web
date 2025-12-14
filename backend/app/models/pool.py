"""
Order Pool-related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PoolStatus(str, Enum):
    """Pool status enumeration."""
    
    SCHEDULED = "scheduled"
    OPEN = "open"
    CLOSED = "closed"
    SYNCED = "synced"


class OrderPoolBase(BaseModel):
    """Base order pool model."""
    
    name: str = Field(..., min_length=1, max_length=200)
    campus_id: str
    collection_start: datetime
    collection_end: datetime
    delivery_window: str = Field(..., min_length=1, max_length=100)
    expected_delivery_time: Optional[datetime] = None
    max_orders: Optional[int] = Field(None, ge=1)
    delivery_fee_per_order: int = Field(default=0, ge=0)
    description: Optional[str] = Field(None, max_length=500)


class OrderPoolCreate(OrderPoolBase):
    """Model for creating an order pool."""
    
    participating_restaurants: List[str] = Field(default_factory=list)
    is_active: bool = True
    manual_status: str = "open"


class OrderPoolUpdate(BaseModel):
    """Model for updating an order pool."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    campus_id: Optional[str] = None
    collection_start: Optional[datetime] = None
    collection_end: Optional[datetime] = None
    delivery_window: Optional[str] = Field(None, min_length=1, max_length=100)
    expected_delivery_time: Optional[datetime] = None
    max_orders: Optional[int] = Field(None, ge=1)
    delivery_fee_per_order: Optional[int] = Field(None, ge=0)
    description: Optional[str] = Field(None, max_length=500)
    participating_restaurants: Optional[List[str]] = None
    manual_status: Optional[str] = None
    is_active: Optional[bool] = None


class OrderPoolResponse(OrderPoolBase):
    """Model for order pool response."""
    
    id: str
    manual_status: str
    computed_status: Optional[str] = None
    fleetbase_pool_id: Optional[str] = None
    participating_restaurants: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PoolStatsResponse(BaseModel):
    """Model for pool statistics."""
    
    pool_id: str
    name: str
    status: str
    campus_id: str
    campus_name: str
    hotspot_location: str
    collection_start: datetime
    collection_end: datetime
    delivery_window: str
    max_orders: Optional[int]
    delivery_fee_per_order: int
    current_order_count: int
    unique_customers: int
    total_revenue: int
    is_accepting_orders: bool
    is_collection_window_open: bool
    is_active: bool
    fleetbase_pool_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PoolRestaurantResponse(BaseModel):
    """Model for restaurants in a pool."""
    
    pool_id: str
    pool_name: str
    restaurant_id: str
    restaurant_name: str
    restaurant_active: bool
    active_in_pool: bool
    added_at: datetime
    
    class Config:
        from_attributes = True
