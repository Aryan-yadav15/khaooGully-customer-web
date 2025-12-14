"""
Review-related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ReviewTargetType(str, Enum):
    """Review target type enumeration."""
    
    RESTAURANT = "restaurant"
    DISH = "dish"


class ReviewBase(BaseModel):
    """Base review model."""
    
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

    class Config:
        populate_by_name = True


class ReviewCreate(ReviewBase):
    """Model for creating a review."""
    
    targetId: str = Field(validation_alias="target_id")
    targetType: ReviewTargetType = Field(validation_alias="target_type")
    customerName: str = Field(validation_alias="customer_name")
    customerAvatar: Optional[str] = Field(None, validation_alias="customer_avatar")


class ReviewUpdate(BaseModel):
    """Model for updating a review."""
    
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

    class Config:
        populate_by_name = True


class ReviewResponse(ReviewBase):
    """Model for review response."""
    
    id: str
    customerId: str = Field(validation_alias="customer_id")
    customerName: str = Field(validation_alias="customer_name")
    customerAvatar: Optional[str] = Field(None, validation_alias="customer_avatar")
    targetId: str = Field(validation_alias="target_id")
    targetType: str = Field(validation_alias="target_type")
    createdAt: datetime = Field(validation_alias="created_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True
