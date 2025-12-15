"""
Campus API routes for listing and retrieving campus information.
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, List, Optional
from supabase import Client
from app.dependencies import GetSupabaseAdmin
from app.models.campus import CampusResponse
from app.models.campus_restaurants import CampusRestaurantPoolMapping
from app.models.restaurant import RestaurantResponse
from app.utils.exceptions import NotFoundException


Router = APIRouter(prefix="/campuses", tags=["Campuses"])


@Router.get("/", response_model=List[CampusResponse])
async def GetCampuses(
    isActive: Optional[bool] = Query(True, description="Filter by active status", alias="isActive"),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves list of campuses.
    
    Args:
        isActive: Filter by active status (default: True)
        Db: Supabase client instance
        
    Returns:
        List[CampusResponse]: List of campuses
    """
    QueryBuilder = Db.table("campuses").select("*")
    
    if isActive is not None:
        QueryBuilder = QueryBuilder.eq("is_active", isActive)
    
    Response = QueryBuilder.order("name").execute()
    
    return [CampusResponse(**Item) for Item in Response.data]


@Router.get("/{campusId}", response_model=CampusResponse)
async def GetCampusById(
    campusId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific campus by ID.
    
    Args:
        campusId: Campus UUID
        Db: Supabase client instance
        
    Returns:
        CampusResponse: Campus details
        
    Raises:
        NotFoundException: If campus not found
    """
    Response = Db.table("campuses").select("*").eq("id", campusId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Campus with ID {campusId} not found")
    
    return CampusResponse(**Response.data[0])


@Router.get("/{campusId}/restaurants", response_model=List[CampusRestaurantPoolMapping], response_model_by_alias=False)
async def GetCampusRestaurants(
    campusId: str,
    includeInactiveRestaurants: bool = Query(False, description="Include inactive restaurants", alias="includeInactiveRestaurants"),
    includeInactivePools: bool = Query(False, description="Include closed/inactive pools", alias="includeInactivePools"),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """Returns all restaurants that can deliver to the given campus, along with their pool mapping.

    This powers the customer UX: Campus → Restaurants (across pools).
    """

    # Validate campus exists (keep error semantics consistent)
    CampusResp = Db.table("campuses").select("id").eq("id", campusId).execute()
    if not CampusResp.data:
        raise NotFoundException(Detail=f"Campus with ID {campusId} not found")

    # Pull campus-scoped pool↔restaurant mappings from view
    qb = Db.table("pool_restaurant_list").select(
        "pool_id, pool_name, pool_status, campus_id, restaurant_id, restaurant_active, active_in_pool"
    ).eq("campus_id", campusId)

    if not includeInactiveRestaurants:
        qb = qb.eq("restaurant_active", True)

    # Only show active-in-pool associations by default
    qb = qb.eq("active_in_pool", True)

    if not includeInactivePools:
        # pool_status is a view field; keep only pools that are usable for browsing
        qb = qb.in_("pool_status", ["open", "scheduled"])

    mappings = qb.execute().data or []
    if not mappings:
        return []

    restaurant_ids = list({m["restaurant_id"] for m in mappings if m.get("restaurant_id")})
    restaurants_by_id: Dict[str, dict] = {}
    if restaurant_ids:
        rest_resp = Db.table("restaurants").select("*").in_("id", restaurant_ids).execute()
        restaurants_by_id = {r["id"]: r for r in (rest_resp.data or [])}

    results: List[CampusRestaurantPoolMapping] = []
    for m in mappings:
        rid = m.get("restaurant_id")
        rest = restaurants_by_id.get(rid)
        if not rest:
            # Skip dangling mappings
            continue

        results.append(
            CampusRestaurantPoolMapping(
                campus_id=m.get("campus_id"),
                pool_id=m.get("pool_id"),
                pool_name=m.get("pool_name"),
                pool_status=m.get("pool_status"),
                restaurant=RestaurantResponse(**rest),
            )
        )

    return results
