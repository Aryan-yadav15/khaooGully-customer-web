"""
Notification related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    """Base notification model."""
    
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    type: Optional[str] = Field(None, pattern="^(order|payment|delivery|promotion|system)$")
    actionUrl: Optional[str] = Field(None, validation_alias="action_url")

    class Config:
        populate_by_name = True


class NotificationCreate(NotificationBase):
    """Model for creating a notification (admin only)."""
    
    customerId: str = Field(validation_alias="customer_id")
    orderId: Optional[str] = Field(None, validation_alias="order_id")


class NotificationUpdate(BaseModel):
    """Model for updating notification read status."""
    
    isRead: bool = Field(validation_alias="is_read")

    class Config:
        populate_by_name = True


class NotificationResponse(NotificationBase):
    """Model for notification response."""
    
    id: str
    customerId: str = Field(validation_alias="customer_id")
    orderId: Optional[str] = Field(None, validation_alias="order_id")
    isRead: bool = Field(validation_alias="is_read")
    createdAt: datetime = Field(validation_alias="created_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True
