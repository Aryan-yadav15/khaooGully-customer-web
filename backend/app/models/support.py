"""
Support ticket related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SupportTicketBase(BaseModel):
    """Base support ticket model."""
    
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: Optional[str] = Field(None, pattern="^(order|payment|delivery|account|other)$")

    class Config:
        populate_by_name = True


class SupportTicketCreate(SupportTicketBase):
    """Model for creating a support ticket."""
    
    orderId: Optional[str] = Field(None, validation_alias="order_id")


class SupportTicketUpdate(BaseModel):
    """Model for updating a support ticket (admin only)."""
    
    status: Optional[str] = Field(None, pattern="^(open|in_progress|resolved|closed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assignedTo: Optional[str] = Field(None, validation_alias="assigned_to")
    resolutionNotes: Optional[str] = Field(None, validation_alias="resolution_notes")

    class Config:
        populate_by_name = True


class SupportTicketResponse(SupportTicketBase):
    """Model for support ticket response."""
    
    id: str
    customerId: str = Field(validation_alias="customer_id")
    orderId: Optional[str] = Field(None, validation_alias="order_id")
    status: str
    priority: str
    assignedTo: Optional[str] = Field(None, validation_alias="assigned_to")
    resolutionNotes: Optional[str] = Field(None, validation_alias="resolution_notes")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    resolvedAt: Optional[datetime] = Field(None, validation_alias="resolved_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class SupportMessageBase(BaseModel):
    """Base support message model."""
    
    message: str = Field(..., min_length=1, max_length=2000)

    class Config:
        populate_by_name = True


class SupportMessageCreate(SupportMessageBase):
    """Model for creating a support message."""
    
    attachments: Optional[List[str]] = None


class SupportMessageResponse(SupportMessageBase):
    """Model for support message response."""
    
    id: str
    ticketId: str = Field(validation_alias="ticket_id")
    senderId: str = Field(validation_alias="sender_id")
    senderType: str = Field(validation_alias="sender_type")
    attachments: Optional[List[str]] = None
    createdAt: datetime = Field(validation_alias="created_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True
