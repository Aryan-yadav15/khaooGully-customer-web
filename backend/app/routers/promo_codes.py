"""
Promo code API routes for validating and managing promo codes.
"""

from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional
from datetime import datetime
from supabase import Client
from app.dependencies import GetSupabase, GetSupabaseAdmin, GetCurrentUserId, RequireAdmin
from app.models.promo_code import (
    PromoCodeCreate,
    PromoCodeUpdate,
    PromoCodeResponse,
    PromoCodeValidationRequest,
    PromoCodeValidationResponse,
    PromoCodeUsageResponse,
    PromoCodeAnalyticsResponse
)
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException
)


Router = APIRouter(prefix="/promo-codes", tags=["Promo Codes"])


@Router.post("/validate", response_model=PromoCodeValidationResponse)
async def ValidatePromoCode(
    Request: PromoCodeValidationRequest,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Validates a promo code for the current customer's order.
    
    Args:
        Request: Promo code validation request
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        PromoCodeValidationResponse: Validation result with discount amount
    """
    # Get promo code details
    CodeResponse = Db.table("promo_codes").select("*").eq("code", Request.code.upper()).eq("is_active", True).execute()
    
    if not CodeResponse.data:
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message="Invalid or inactive promo code"
        )
    
    PromoCode = CodeResponse.data[0]
    Now = datetime.utcnow()
    
    # Check validity period
    if PromoCode.get("valid_from") and datetime.fromisoformat(PromoCode["valid_from"].replace("Z", "+00:00")) > Now:
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message="Promo code not yet valid"
        )
    
    if PromoCode.get("valid_until") and datetime.fromisoformat(PromoCode["valid_until"].replace("Z", "+00:00")) < Now:
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message="Promo code has expired"
        )
    
    # Check minimum order value
    if Request.orderTotal < PromoCode.get("min_order_value", 0):
        MinValue = PromoCode.get("min_order_value", 0) / 100
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message=f"Minimum order value is ₹{MinValue}"
        )
    
    # Check usage limit
    if PromoCode.get("usage_limit") and PromoCode.get("usage_count", 0) >= PromoCode["usage_limit"]:
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message="Promo code usage limit reached"
        )
    
    # Check per-user limit
    UsageResponse = Db.table("promo_code_usage").select("id").eq("promo_code_id", PromoCode["id"]).eq("customer_id", UserId).execute()
    
    if len(UsageResponse.data) >= PromoCode.get("per_user_limit", 1):
        return PromoCodeValidationResponse(
            valid=False,
            code=Request.code,
            discountAmount=0,
            message="You have already used this promo code"
        )
    
    # Check applicability
    ApplicableTo = PromoCode.get("applicable_to")
    if ApplicableTo == "specific_restaurants" and Request.restaurantId:
        RestaurantIds = PromoCode.get("restaurant_ids", [])
        if Request.restaurantId not in RestaurantIds:
            return PromoCodeValidationResponse(
                valid=False,
                code=Request.code,
                discountAmount=0,
                message="Promo code not applicable to this restaurant"
            )
    
    if ApplicableTo == "specific_pools" and Request.poolId:
        PoolIds = PromoCode.get("pool_ids", [])
        if Request.poolId not in PoolIds:
            return PromoCodeValidationResponse(
                valid=False,
                code=Request.code,
                discountAmount=0,
                message="Promo code not applicable to this pool"
            )
    
    # Calculate discount
    if PromoCode["discount_type"] == "percentage":
        DiscountAmount = int((Request.orderTotal * PromoCode["discount_value"]) / 100)
        if PromoCode.get("max_discount"):
            DiscountAmount = min(DiscountAmount, PromoCode["max_discount"])
    else:  # fixed
        DiscountAmount = min(PromoCode["discount_value"], Request.orderTotal)
    
    return PromoCodeValidationResponse(
        valid=True,
        code=Request.code,
        discountAmount=DiscountAmount,
        message="Promo code applied successfully",
        promoCodeId=PromoCode["id"]
    )


@Router.get("/my-usage", response_model=List[PromoCodeUsageResponse])
async def GetMyPromoCodeUsage(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves promo code usage history for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[PromoCodeUsageResponse]: List of promo code usage records
    """
    Response = Db.table("promo_code_usage").select("*").eq("customer_id", UserId).order("used_at", desc=True).execute()
    
    return [PromoCodeUsageResponse(**Item) for Item in Response.data]


# Admin endpoints
@Router.post("/", response_model=PromoCodeResponse, status_code=status.HTTP_201_CREATED)
async def CreatePromoCode(
    PromoData: PromoCodeCreate,
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Creates a new promo code (admin only).
    
    Args:
        PromoData: Promo code creation data
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        PromoCodeResponse: Created promo code
    """
    InsertData = {
        "code": PromoData.code.upper(),
        "description": PromoData.description,
        "code_type": PromoData.codeType,
        "discount_type": PromoData.discountType,
        "discount_value": PromoData.discountValue,
        "min_order_value": PromoData.minOrderValue,
        "max_discount": PromoData.maxDiscount,
        "usage_limit": PromoData.usageLimit,
        "per_user_limit": PromoData.perUserLimit,
        "valid_from": PromoData.validFrom,
        "valid_until": PromoData.validUntil,
        "applicable_to": PromoData.applicableTo,
        "restaurant_ids": PromoData.restaurantIds,
        "pool_ids": PromoData.poolIds,
        "affiliate_id": PromoData.affiliateId,
        "affiliate_name": PromoData.affiliateName,
        "affiliate_commission_type": PromoData.affiliateCommissionType,
        "affiliate_commission_value": PromoData.affiliateCommissionValue,
        "created_by": CurrentUser["id"]
    }
    
    Response = Db.table("promo_codes").insert(InsertData).execute()
    Code = Response.data[0]
    
    return PromoCodeResponse(**Code)


@Router.get("/analytics", response_model=List[PromoCodeAnalyticsResponse])
async def GetPromoCodeAnalytics(
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves analytics for all promo codes (admin only).
    
    Args:
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        List[PromoCodeAnalyticsResponse]: List of promo code analytics
    """
    Response = Db.table("promo_code_analytics").select("*").execute()
    
    return [PromoCodeAnalyticsResponse(**Item) for Item in Response.data]
