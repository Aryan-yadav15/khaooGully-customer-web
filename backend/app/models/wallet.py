"""
Wallet related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WalletResponse(BaseModel):
    """Model for customer wallet response."""
    
    id: str = Field(validation_alias="id")
    customerId: str = Field(validation_alias="customer_id")
    balance: int = Field(validation_alias="balance")
    totalEarned: int = Field(validation_alias="total_earned")
    totalSpent: int = Field(validation_alias="total_spent")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class WalletTransactionResponse(BaseModel):
    """Model for wallet transaction response."""
    
    id: str = Field(validation_alias="id")
    walletId: str = Field(validation_alias="wallet_id")
    transactionType: str = Field(validation_alias="transaction_type")
    amount: int = Field(validation_alias="amount")
    source: Optional[str] = Field(None, validation_alias="source")
    description: Optional[str] = Field(None, validation_alias="description")
    orderId: Optional[str] = Field(None, validation_alias="order_id")
    balanceAfter: int = Field(validation_alias="balance_after")
    createdAt: datetime = Field(validation_alias="created_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class WalletTransactionCreate(BaseModel):
    """Model for creating a wallet transaction (admin only)."""
    
    customerId: str = Field(validation_alias="customer_id")
    transactionType: str = Field(..., pattern="^(credit|debit)$", validation_alias="transaction_type")
    amount: int = Field(..., gt=0, validation_alias="amount")
    source: Optional[str] = Field(None, validation_alias="source")
    description: Optional[str] = Field(None, validation_alias="description")
    orderId: Optional[str] = Field(None, validation_alias="order_id")

    class Config:
        populate_by_name = True
