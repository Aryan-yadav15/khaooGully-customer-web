"""
Restaurant and Dish-related Pydantic models.
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class RestaurantBase(BaseModel):
    """Base restaurant model."""
    
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=500)
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    location: Optional[str] = Field(None, max_length=200)
    deliveryTime: int = Field(default=30, ge=0, le=180, validation_alias="delivery_time", serialization_alias="delivery_time")
    costForTwo: int = Field(default=40000, ge=0, validation_alias="cost_for_two", serialization_alias="cost_for_two")
    cuisine: List[str] = Field(default_factory=list)
    image: Optional[str] = None


class RestaurantCreate(RestaurantBase):
    """Model for creating a restaurant."""
    
    isActive: bool = Field(True, validation_alias="is_active", serialization_alias="is_active")
    rating: Decimal = Field(default=0.0, ge=0, le=5)


class RestaurantUpdate(BaseModel):
    """Model for updating restaurant."""
    
    model_config = {"populate_by_name": True, "extra": "ignore"}

    @field_validator("name", "address", "phone", "location", "image", mode="before")
    @classmethod
    def _blank_str_to_none(cls, value):
        if isinstance(value, str) and value.strip() == "":
            return None
        return value
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    location: Optional[str] = Field(None, max_length=200)
    deliveryTime: Optional[int] = Field(None, ge=0, le=180, validation_alias="delivery_time", serialization_alias="delivery_time")
    costForTwo: Optional[int] = Field(None, ge=0, validation_alias="cost_for_two", serialization_alias="cost_for_two")
    cuisine: Optional[List[str]] = None
    image: Optional[str] = None
    rating: Optional[Decimal] = Field(None, ge=0, le=5)
    isActive: Optional[bool] = Field(None, validation_alias="is_active", serialization_alias="is_active")


class RestaurantResponse(RestaurantBase):
    """Model for restaurant response."""
    
    id: str
    rating: Decimal
    isActive: bool = Field(validation_alias="is_active")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class DishBase(BaseModel):
    """Base dish model."""
    
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: int = Field(..., ge=0)
    veg: bool = True
    tags: List[str] = Field(default_factory=list)
    image: Optional[str] = None


class DishCreate(DishBase):
    """Model for creating a dish."""
    
    restaurantId: str = Field(validation_alias="restaurant_id")
    isAvailable: bool = Field(True, validation_alias="is_available")
    rating: Decimal = Field(default=0.0, ge=0, le=5)


class DishUpdate(BaseModel):
    """Model for updating dish."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[int] = Field(None, ge=0)
    veg: Optional[bool] = None
    tags: Optional[List[str]] = None
    image: Optional[str] = None
    isAvailable: Optional[bool] = Field(None, validation_alias="is_available")


class DishResponse(DishBase):
    """Model for dish response."""
    
    id: str
    restaurantId: str = Field(validation_alias="restaurant_id")
    rating: Decimal
    isAvailable: bool = Field(validation_alias="is_available")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class RestaurantMenuResponse(BaseModel):
    """Model for restaurant with menu."""
    
    restaurant: RestaurantResponse
    dishes: List[DishResponse]
