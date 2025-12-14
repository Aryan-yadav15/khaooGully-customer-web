"""
Order Pool API routes.
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from supabase import Client
from app.dependencies import GetSupabaseAdmin
from app.models.pool import (
    OrderPoolResponse,
    PoolStatsResponse,
    PoolRestaurantResponse
)
from app.utils.exceptions import NotFoundException


Router = APIRouter(prefix="/pools", tags=["Order Pools"])


def ComputePoolStatus(Pool: dict) -> str:
    """
    Computes the current status of a pool based on time and manual status.
    
    Args:
        Pool: Pool data dictionary
        
    Returns:
        str: Computed pool status
    """
    ManualStatus = Pool.get("manual_status", "open")
    
    if ManualStatus in ["closed", "synced"]:
        return ManualStatus
    
    Now = datetime.now(timezone.utc)
    
    # Parse timestamps - handle various formats
    CollectionStartStr = Pool.get("collection_start", "")
    CollectionEndStr = Pool.get("collection_end", "")
    
    try:
        # Handle ISO format with timezone
        if CollectionStartStr:
            CollectionStart = datetime.fromisoformat(CollectionStartStr.replace("Z", "+00:00"))
            # Make timezone-aware if naive
            if CollectionStart.tzinfo is None:
                CollectionStart = CollectionStart.replace(tzinfo=timezone.utc)
        else:
            return "scheduled"
            
        if CollectionEndStr:
            CollectionEnd = datetime.fromisoformat(CollectionEndStr.replace("Z", "+00:00"))
            # Make timezone-aware if naive
            if CollectionEnd.tzinfo is None:
                CollectionEnd = CollectionEnd.replace(tzinfo=timezone.utc)
        else:
            return "scheduled"
        
        if CollectionEnd < Now:
            return "closed"
        elif CollectionStart > Now:
            return "scheduled"
        else:
            return "open"
    except (ValueError, TypeError):
        return "scheduled"


@Router.get("/", response_model=List[OrderPoolResponse], response_model_by_alias=False)
async def GetPools(
    campusId: Optional[str] = Query(None, description="Filter by campus", alias="campusId"),
    status: Optional[str] = Query(None, description="Filter by status (open, closed, scheduled, synced)"),
    isActive: Optional[bool] = Query(True, description="Filter by active status", alias="isActive"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves list of order pools.
    
    Args:
        campusId: Filter by campus ID
        status: Filter by pool status
        isActive: Filter by active status
        limit: Maximum number of results
        offset: Pagination offset
        Db: Supabase client instance
        
    Returns:
        List[OrderPoolResponse]: List of order pools
    """
    QueryBuilder = Db.table("order_pools").select("*")
    
    if campusId:
        QueryBuilder = QueryBuilder.eq("campus_id", campusId)
    
    if isActive is not None:
        QueryBuilder = QueryBuilder.eq("is_active", isActive)
    
    Response = QueryBuilder.order("collection_start", desc=True).range(offset, offset + limit - 1).execute()
    
    # Get all pool IDs to fetch participating restaurants in bulk
    PoolIds = [Item["id"] for Item in Response.data]
    
    # Fetch all pool-restaurant associations for these pools
    PoolRestaurantsMap = {}
    if PoolIds:
        RestaurantResponse = Db.table("pool_restaurants").select("pool_id, restaurant_id").in_("pool_id", PoolIds).execute()
        for Assoc in RestaurantResponse.data:
            PoolId = Assoc["pool_id"]
            if PoolId not in PoolRestaurantsMap:
                PoolRestaurantsMap[PoolId] = []
            PoolRestaurantsMap[PoolId].append(Assoc["restaurant_id"])
    
    Pools = []
    for Item in Response.data:
        ComputedStatus = ComputePoolStatus(Item)
        
        # Filter by computed status if requested
        if status and ComputedStatus != status:
            continue
        
        # Add computed_status to the item for Pydantic model
        Item["computed_status"] = ComputedStatus
        # Add participating_restaurants from the junction table
        Item["participating_restaurants"] = PoolRestaurantsMap.get(Item["id"], [])
        Pools.append(OrderPoolResponse(**Item))
    
    return Pools


@Router.get("/{poolId}", response_model=OrderPoolResponse, response_model_by_alias=False)
async def GetPoolById(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific pool by ID.
    
    Args:
        poolId: Pool UUID
        Db: Supabase client instance
        
    Returns:
        OrderPoolResponse: Pool details
        
    Raises:
        NotFoundException: If pool not found
    """
    Response = Db.table("order_pools").select("*").eq("id", poolId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Pool with ID {poolId} not found")
    
    Item = Response.data[0]
    Item["computed_status"] = ComputePoolStatus(Item)
    
    # Fetch participating restaurants from junction table
    RestaurantResponse = Db.table("pool_restaurants").select("restaurant_id").eq("pool_id", poolId).execute()
    Item["participating_restaurants"] = [r["restaurant_id"] for r in RestaurantResponse.data] if RestaurantResponse.data else []
    
    return OrderPoolResponse(**Item)


@Router.get("/{poolId}/stats", response_model=PoolStatsResponse, response_model_by_alias=False)
async def GetPoolStats(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves statistics for a specific pool.
    
    Args:
        poolId: Pool UUID
        Db: Supabase client instance
        
    Returns:
        PoolStatsResponse: Pool statistics
        
    Raises:
        NotFoundException: If pool not found
    """
    Response = Db.table("pool_stats").select("*").eq("pool_id", poolId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Pool stats for ID {poolId} not found")
    
    Item = Response.data[0]
    
    return PoolStatsResponse(**Item)


@Router.get("/{poolId}/restaurants", response_model=List[PoolRestaurantResponse], response_model_by_alias=False)
async def GetPoolRestaurants(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves list of restaurants participating in a pool.
    
    Args:
        poolId: Pool UUID
        Db: Supabase client instance
        
    Returns:
        List[PoolRestaurantResponse]: List of restaurants in pool
    """
    Response = Db.table("pool_restaurant_list").select("*").eq("pool_id", poolId).execute()
    
    return [PoolRestaurantResponse(**Item) for Item in Response.data]
