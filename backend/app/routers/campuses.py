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
    Retrieves list of campuses with active pool counts.
    
    Args:
        isActive: Filter by active status (default: True)
        Db: Supabase client instance
        
    Returns:
        List[CampusResponse]: List of campuses with activePoolCount
    """
    QueryBuilder = Db.table("campuses").select("*")
    
    if isActive is not None:
        QueryBuilder = QueryBuilder.eq("is_active", isActive)
    
    Response = QueryBuilder.order("name").execute()
    
    # Get all active pools and compute their status
    PoolCountResponse = Db.table("order_pools").select("campus_id, manual_status, collection_start, collection_end").eq("is_active", True).execute()
    
    # Count only pools that are currently open or scheduled (not closed)
    from datetime import datetime, timezone
    
    pool_counts = {}
    now = datetime.now(timezone.utc)
    
    for pool in (PoolCountResponse.data or []):
        campus_id = pool.get("campus_id")
        if not campus_id:
            continue
            
        # Check manual status first
        manual_status = pool.get("manual_status", "open")
        if manual_status in ["closed", "synced"]:
            continue
            
        # Check time-based status
        try:
            collection_start_str = pool.get("collection_start", "")
            collection_end_str = pool.get("collection_end", "")
            
            if not collection_start_str or not collection_end_str:
                continue
                
            collection_start = datetime.fromisoformat(collection_start_str.replace("Z", "+00:00"))
            collection_end = datetime.fromisoformat(collection_end_str.replace("Z", "+00:00"))
            
            if collection_start.tzinfo is None:
                collection_start = collection_start.replace(tzinfo=timezone.utc)
            if collection_end.tzinfo is None:
                collection_end = collection_end.replace(tzinfo=timezone.utc)
            
            # Only count if pool is currently open or scheduled (not ended)
            if collection_end >= now:
                pool_counts[campus_id] = pool_counts.get(campus_id, 0) + 1
        except (ValueError, TypeError):
            continue
    
    # Add pool counts to campus data
    campuses_with_counts = []
    for item in Response.data:
        campus_data = dict(item)
        campus_data["activePoolCount"] = pool_counts.get(item["id"], 0)
        campuses_with_counts.append(CampusResponse(**campus_data))
    
    return campuses_with_counts


@Router.get("/{campusId}", response_model=CampusResponse)
async def GetCampusById(
    campusId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific campus by ID with active pool count.
    
    Args:
        campusId: Campus UUID
        Db: Supabase client instance
        
    Returns:
        CampusResponse: Campus details with activePoolCount
        
    Raises:
        NotFoundException: If campus not found
    """
    Response = Db.table("campuses").select("*").eq("id", campusId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Campus with ID {campusId} not found")
    
    # Get active pools for this campus and compute their status
    PoolCountResponse = Db.table("order_pools").select("manual_status, collection_start, collection_end").eq("campus_id", campusId).eq("is_active", True).execute()
    
    from datetime import datetime, timezone
    
    active_count = 0
    now = datetime.now(timezone.utc)
    
    for pool in (PoolCountResponse.data or []):
        # Check manual status first
        manual_status = pool.get("manual_status", "open")
        if manual_status in ["closed", "synced"]:
            continue
            
        # Check time-based status
        try:
            collection_start_str = pool.get("collection_start", "")
            collection_end_str = pool.get("collection_end", "")
            
            if not collection_start_str or not collection_end_str:
                continue
                
            collection_start = datetime.fromisoformat(collection_start_str.replace("Z", "+00:00"))
            collection_end = datetime.fromisoformat(collection_end_str.replace("Z", "+00:00"))
            
            if collection_start.tzinfo is None:
                collection_start = collection_start.replace(tzinfo=timezone.utc)
            if collection_end.tzinfo is None:
                collection_end = collection_end.replace(tzinfo=timezone.utc)
            
            # Only count if pool is currently open or scheduled (not ended)
            if collection_end >= now:
                active_count += 1
        except (ValueError, TypeError):
            continue
    
    campus_data = dict(Response.data[0])
    campus_data["activePoolCount"] = active_count
    
    return CampusResponse(**campus_data)


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
