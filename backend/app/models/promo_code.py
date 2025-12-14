"""
Promo code related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PromoCodeBase(BaseModel):
    """Base promo code model."""
    
    code: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    discountType: str = Field(..., pattern="^(percentage|fixed)$", validation_alias="discount_type")
    discountValue: int = Field(..., gt=0, validation_alias="discount_value")
    minOrderValue: int = Field(default=0, ge=0, validation_alias="min_order_value")
    maxDiscount: Optional[int] = Field(None, ge=0, validation_alias="max_discount")
    usageLimit: Optional[int] = Field(None, gt=0, validation_alias="usage_limit")
    perUserLimit: int = Field(default=1, gt=0, validation_alias="per_user_limit")
    validFrom: Optional[datetime] = Field(None, validation_alias="valid_from")
    validUntil: Optional[datetime] = Field(None, validation_alias="valid_until")
    applicableTo: Optional[str] = Field(None, pattern="^(all|specific_restaurants|specific_pools)$", validation_alias="applicable_to")
    restaurantIds: Optional[List[str]] = Field(None, validation_alias="restaurant_ids")
    poolIds: Optional[List[str]] = Field(None, validation_alias="pool_ids")

    class Config:
        populate_by_name = True


class PromoCodeCreate(PromoCodeBase):
    """Model for creating a promo code (admin only)."""
    
    codeType: str = Field(default="platform", pattern="^(platform|affiliate|referral)$", validation_alias="code_type")
    affiliateId: Optional[str] = Field(None, validation_alias="affiliate_id")
    affiliateName: Optional[str] = Field(None, validation_alias="affiliate_name")
    affiliateCommissionType: Optional[str] = Field(None, pattern="^(percentage|fixed)$", validation_alias="affiliate_commission_type")
    affiliateCommissionValue: int = Field(default=0, ge=0, validation_alias="affiliate_commission_value")


class PromoCodeUpdate(BaseModel):
    """Model for updating a promo code (admin only)."""
    
    description: Optional[str] = None
    isActive: Optional[bool] = Field(None, validation_alias="is_active")
    validUntil: Optional[datetime] = Field(None, validation_alias="valid_until")
    usageLimit: Optional[int] = Field(None, gt=0, validation_alias="usage_limit")

    class Config:
        populate_by_name = True


class PromoCodeResponse(PromoCodeBase):
    """Model for promo code response."""
    
    id: str
    codeType: str = Field(validation_alias="code_type")
    usageCount: int = Field(validation_alias="usage_count")
    isActive: bool = Field(validation_alias="is_active")
    affiliateId: Optional[str] = Field(None, validation_alias="affiliate_id")
    affiliateName: Optional[str] = Field(None, validation_alias="affiliate_name")
    affiliateCommissionType: Optional[str] = Field(None, validation_alias="affiliate_commission_type")
    affiliateCommissionValue: int = Field(validation_alias="affiliate_commission_value")
    createdBy: Optional[str] = Field(None, validation_alias="created_by")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PromoCodeValidationRequest(BaseModel):
    """Model for validating a promo code."""
    
    code: str = Field(..., min_length=3, max_length=50)
    orderTotal: int = Field(..., gt=0)
    restaurantId: Optional[str] = None
    poolId: Optional[str] = None

    class Config:
        populate_by_name = True


class PromoCodeValidationResponse(BaseModel):
    """Model for promo code validation result."""
    
    valid: bool
    code: str
    discountAmount: int
    message: Optional[str] = None
    promoCodeId: Optional[str] = None

    class Config:
        populate_by_name = True


class PromoCodeUsageResponse(BaseModel):
    """Model for promo code usage record."""
    
    id: str
    promoCodeId: str = Field(validation_alias="promo_code_id")
    customerId: str = Field(validation_alias="customer_id")
    orderId: Optional[str] = Field(None, validation_alias="order_id")
    discountAmount: int = Field(validation_alias="discount_amount")
    orderTotal: Optional[int] = Field(None, validation_alias="order_total")
    affiliateCommissionEarned: int = Field(validation_alias="affiliate_commission_earned")
    usedAt: datetime = Field(validation_alias="used_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class PromoCodeAnalyticsResponse(BaseModel):
    """Model for promo code analytics."""
    
    promoCodeId: str = Field(validation_alias="promo_code_id")
    code: str
    codeType: str = Field(validation_alias="code_type")
    description: Optional[str] = None
    discountType: str = Field(validation_alias="discount_type")
    discountValue: int = Field(validation_alias="discount_value")
    affiliateId: Optional[str] = Field(None, validation_alias="affiliate_id")
    affiliateName: Optional[str] = Field(None, validation_alias="affiliate_name")
    affiliateCommissionType: Optional[str] = Field(None, validation_alias="affiliate_commission_type")
    affiliateCommissionValue: int = Field(validation_alias="affiliate_commission_value")
    isActive: bool = Field(validation_alias="is_active")
    validFrom: Optional[datetime] = Field(None, validation_alias="valid_from")
    validUntil: Optional[datetime] = Field(None, validation_alias="valid_until")
    usageLimit: Optional[int] = Field(None, validation_alias="usage_limit")
    totalUses: int = Field(validation_alias="total_uses")
    uniqueCustomers: int = Field(validation_alias="unique_customers")
    totalOrderValue: int = Field(validation_alias="total_order_value")
    totalDiscountGiven: int = Field(validation_alias="total_discount_given")
    totalCommissionOwed: int = Field(validation_alias="total_commission_owed")
    avgOrderValue: float = Field(validation_alias="avg_order_value")
    firstUsedAt: Optional[datetime] = Field(None, validation_alias="first_used_at")
    lastUsedAt: Optional[datetime] = Field(None, validation_alias="last_used_at")

    class Config:
        from_attributes = True
        populate_by_name = True
