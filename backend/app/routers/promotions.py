"""
Promotional Banners API routes for managing restaurant promotions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from supabase import Client

from ..dependencies import GetSupabaseAdmin, RequireAdmin
from ..utils.exceptions import NotFoundException

router = APIRouter(prefix="/promotions", tags=["Promotions"])


# ============================================
# Pydantic Schemas
# ============================================

class BannerStyleConfig(BaseModel):
    backgroundColor: Optional[str] = "#84CC16"
    textColor: Optional[str] = "#FFFFFF"
    accentColor: Optional[str] = "#FFFFFF"
    gradient: Optional[Dict[str, str]] = None
    iconColor: Optional[str] = None
    badgeStyle: Optional[str] = "rounded"
    glowEffect: Optional[bool] = False


class PromotionalBannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    banner_type: str
    category: Optional[str] = None
    display_order: int = 0
    style_config: Dict[str, Any] = Field(default_factory=dict)
    banner_image: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    campus_id: Optional[str] = None
    max_restaurants: Optional[int] = None
    display_layout: str = "horizontal_scroll"


class PromotionalBannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    banner_type: Optional[str] = None
    category: Optional[str] = None
    display_order: Optional[int] = None
    style_config: Optional[Dict[str, Any]] = None
    banner_image: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    campus_id: Optional[str] = None
    max_restaurants: Optional[int] = None
    display_layout: Optional[str] = None


class RestaurantPromotionCreate(BaseModel):
    restaurant_id: str
    banner_id: str
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    promo_text: Optional[str] = None
    discount_badge: Optional[str] = None


class RestaurantPromotionUpdate(BaseModel):
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    promo_text: Optional[str] = None
    discount_badge: Optional[str] = None


# ============================================
# PUBLIC ENDPOINTS
# ============================================

@router.get("/banners/active")
async def get_active_promotional_banners(
    campus_id: Optional[str] = None,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Get all active promotional banners with restaurant counts.
    Optionally filter by campus.
    """
    try:
        # Use the view created in migration
        query = Db.rpc("get_active_promotional_banners_view", {
            "p_campus_id": campus_id
        })
        
        result = query.execute()
        return result.data or []
    except Exception as e:
        # Fallback: query the table directly
        query_builder = Db.table("promotional_banners").select("*")
        query_builder = query_builder.eq("is_active", True)
        
        if campus_id:
            query_builder = query_builder.or_(f"campus_id.eq.{campus_id},campus_id.is.null")
        
        response = query_builder.order("display_order").execute()
        return response.data or []


@router.get("/banners/{banner_id}/restaurants")
async def get_banner_restaurants(
    banner_id: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Get all restaurants in a specific promotional banner.
    Returns restaurants ordered by their display priority.
    """
    try:
        # Try using the view
        result = Db.table("promoted_restaurants_detail") \
            .select("*") \
            .eq("banner_id", banner_id) \
            .order("restaurant_order") \
            .execute()
        
        return result.data or []
    except Exception as e:
        print(f"Error fetching banner restaurants: {e}")
        return []


@router.get("/restaurants/{restaurant_id}/promotions")
async def get_restaurant_promotions(
    restaurant_id: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Get all active promotions for a specific restaurant.
    """
    try:
        result = Db.table("promoted_restaurants_detail") \
            .select("*") \
            .eq("restaurant_id", restaurant_id) \
            .order("banner_order") \
            .execute()
        
        return result.data or []
    except Exception as e:
        print(f"Error fetching restaurant promotions: {e}")
        return []


# ============================================
# ADMIN ENDPOINTS - Banners Management
# ============================================

@router.get("/admin/banners")
async def list_all_banners(
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    List all promotional banners (Admin only).
    """
    result = Db.table("promotional_banners") \
        .select("*") \
        .order("display_order") \
        .execute()
    
    return result.data or []


@router.get("/admin/banners/{banner_id}")
async def get_banner_by_id(
    banner_id: str,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Get a specific promotional banner by ID (Admin only).
    """
    result = Db.table("promotional_banners") \
        .select("*") \
        .eq("id", banner_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    return result.data[0]


@router.post("/admin/banners", status_code=status.HTTP_201_CREATED)
async def create_promotional_banner(
    banner: PromotionalBannerCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Create a new promotional banner (Admin only).
    """
    banner_data = banner.model_dump(exclude_none=True)
    banner_data["created_by"] = str(current_user["id"])
    
    result = Db.table("promotional_banners") \
        .insert(banner_data) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create banner"
        )
    
    return result.data[0]


@router.put("/admin/banners/{banner_id}")
async def update_promotional_banner(
    banner_id: str,
    banner: PromotionalBannerUpdate,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Update a promotional banner (Admin only).
    """
    update_data = banner.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = Db.table("promotional_banners") \
        .update(update_data) \
        .eq("id", banner_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    return result.data[0]


@router.delete("/admin/banners/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotional_banner(
    banner_id: str,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Delete a promotional banner (Admin only).
    This will also delete all associated restaurant promotions due to CASCADE.
    """
    result = Db.table("promotional_banners") \
        .delete() \
        .eq("id", banner_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    return None


# ============================================
# ADMIN ENDPOINTS - Restaurant Promotions Management
# ============================================

@router.get("/admin/restaurants/promotions")
async def list_all_restaurant_promotions(
    banner_id: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    List all restaurant promotions with optional filters (Admin only).
    """
    query_builder = Db.table("restaurant_promotions").select("*")
    
    if banner_id:
        query_builder = query_builder.eq("banner_id", banner_id)
    if restaurant_id:
        query_builder = query_builder.eq("restaurant_id", restaurant_id)
    
    result = query_builder.order("display_order").execute()
    return result.data or []


@router.post("/admin/restaurants/promotions", status_code=status.HTTP_201_CREATED)
async def add_restaurant_to_promotion(
    promotion: RestaurantPromotionCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Add a restaurant to a promotional banner (Admin only).
    """
    # Check if promotion already exists
    existing = Db.table("restaurant_promotions") \
        .select("id") \
        .eq("restaurant_id", promotion.restaurant_id) \
        .eq("banner_id", promotion.banner_id) \
        .execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant is already in this promotional banner"
        )
    
    promotion_data = promotion.model_dump(exclude_none=True)
    promotion_data["added_by"] = str(current_user["id"])
    
    result = Db.table("restaurant_promotions") \
        .insert(promotion_data) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create promotion"
        )
    
    return result.data[0]


@router.put("/admin/restaurants/promotions/{promotion_id}")
async def update_restaurant_promotion(
    promotion_id: str,
    promotion: RestaurantPromotionUpdate,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Update a restaurant promotion (Admin only).
    """
    update_data = promotion.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = Db.table("restaurant_promotions") \
        .update(update_data) \
        .eq("id", promotion_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    return result.data[0]


@router.delete("/admin/restaurants/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_restaurant_from_promotion(
    promotion_id: str,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Remove a restaurant from a promotional banner (Admin only).
    """
    result = Db.table("restaurant_promotions") \
        .delete() \
        .eq("id", promotion_id) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    return None


@router.post("/admin/restaurants/{restaurant_id}/promote/{banner_id}", status_code=status.HTTP_201_CREATED)
async def quick_promote_restaurant(
    restaurant_id: str,
    banner_id: str,
    Db: Client = Depends(GetSupabaseAdmin),
    current_user: dict = Depends(RequireAdmin)
):
    """
    Quick endpoint to promote a restaurant to a banner (Admin only).
    Uses default settings.
    """
    # Check if promotion already exists
    existing = Db.table("restaurant_promotions") \
        .select("id") \
        .eq("restaurant_id", restaurant_id) \
        .eq("banner_id", banner_id) \
        .execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant is already in this promotional banner"
        )
    
    promotion_data = {
        "restaurant_id": restaurant_id,
        "banner_id": banner_id,
        "added_by": str(current_user["id"])
    }
    
    result = Db.table("restaurant_promotions") \
        .insert(promotion_data) \
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create promotion"
        )
    
    return result.data[0]
