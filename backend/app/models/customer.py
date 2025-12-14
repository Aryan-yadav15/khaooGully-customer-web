"""
Customer-related Pydantic models.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer model."""
    
    fullName: str = Field(..., min_length=1, max_length=200, validation_alias="full_name")
    phone: str = Field(..., min_length=10, max_length=20)
    email: EmailStr

    class Config:
        populate_by_name = True


class CustomerCreate(CustomerBase):
    """Model for creating a customer."""
    
    defaultCampusId: Optional[str] = Field(None, validation_alias="default_campus_id")
    hostelBlock: Optional[str] = Field(None, validation_alias="hostel_block")
    roomNumber: Optional[str] = Field(None, validation_alias="room_number")
    deliveryInstructions: Optional[str] = Field(None, validation_alias="delivery_instructions")
    avatarUrl: Optional[str] = Field(None, validation_alias="avatar_url")


class CustomerUpdate(BaseModel):
    """Model for updating customer profile."""
    
    fullName: Optional[str] = Field(None, min_length=1, max_length=200, validation_alias="full_name")
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    defaultCampusId: Optional[str] = Field(None, validation_alias="default_campus_id")
    hostelBlock: Optional[str] = Field(None, validation_alias="hostel_block")
    roomNumber: Optional[str] = Field(None, validation_alias="room_number")
    deliveryInstructions: Optional[str] = Field(None, validation_alias="delivery_instructions")
    avatarUrl: Optional[str] = Field(None, validation_alias="avatar_url")

    class Config:
        populate_by_name = True


class CustomerResponse(CustomerBase):
    """Model for customer response."""
    
    id: str
    defaultCampusId: Optional[str] = Field(None, validation_alias="default_campus_id")
    hostelBlock: Optional[str] = Field(None, validation_alias="hostel_block")
    roomNumber: Optional[str] = Field(None, validation_alias="room_number")
    deliveryInstructions: Optional[str] = Field(None, validation_alias="delivery_instructions")
    avatarUrl: Optional[str] = Field(None, validation_alias="avatar_url")
    referralCode: Optional[str] = Field(None, validation_alias="referral_code")
    referredBy: Optional[str] = Field(None, validation_alias="referred_by")
    totalOrders: int = Field(validation_alias="total_orders")
    totalSpent: int = Field(validation_alias="total_spent")
    lastOrderAt: Optional[datetime] = Field(None, validation_alias="last_order_at")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CustomerProfileSummaryResponse(BaseModel):
    """Model for customer profile summary."""
    
    id: str
    fullName: str = Field(validation_alias="full_name")
    email: str
    phone: str
    avatarUrl: Optional[str] = Field(None, validation_alias="avatar_url")
    referralCode: Optional[str] = Field(None, validation_alias="referral_code")
    totalOrders: int = Field(validation_alias="total_orders")
    totalSpent: int = Field(validation_alias="total_spent")
    lastOrderAt: Optional[datetime] = Field(None, validation_alias="last_order_at")
    memberSince: datetime = Field(validation_alias="member_since")
    walletBalance: int = Field(validation_alias="wallet_balance")
    favoriteRestaurantsCount: int = Field(validation_alias="favorite_restaurants_count")
    favoriteDishesCount: int = Field(validation_alias="favorite_dishes_count")
    savedAddressesCount: int = Field(validation_alias="saved_addresses_count")

    class Config:
        from_attributes = True
        populate_by_name = True


class CustomerAddressBase(BaseModel):
    """Base customer address model."""
    
    campusId: str = Field(validation_alias="campus_id")
    label: str = Field(default="Default", max_length=100)
    hostelBlock: str = Field(..., min_length=1, max_length=100, validation_alias="hostel_block")
    roomNumber: str = Field(..., min_length=1, max_length=50, validation_alias="room_number")
    floor: Optional[str] = Field(None, max_length=50)
    landmark: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    deliveryInstructions: Optional[str] = Field(None, max_length=500, validation_alias="delivery_instructions")

    class Config:
        populate_by_name = True


class CustomerAddressCreate(CustomerAddressBase):
    """Model for creating a customer address."""
    
    isDefault: bool = Field(False, validation_alias="is_default")


class CustomerAddressUpdate(BaseModel):
    """Model for updating customer address."""
    
    label: Optional[str] = Field(None, max_length=100)
    hostelBlock: Optional[str] = Field(None, min_length=1, max_length=100, validation_alias="hostel_block")
    roomNumber: Optional[str] = Field(None, min_length=1, max_length=50, validation_alias="room_number")
    floor: Optional[str] = Field(None, max_length=50)
    landmark: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    deliveryInstructions: Optional[str] = Field(None, max_length=500, validation_alias="delivery_instructions")
    isDefault: Optional[bool] = Field(None, validation_alias="is_default")

    class Config:
        populate_by_name = True


class CustomerAddressResponse(CustomerAddressBase):
    """Model for customer address response."""
    
    id: str
    customerId: str = Field(validation_alias="customer_id")
    isDefault: bool = Field(validation_alias="is_default")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True
