"""
Restaurant and Dish API routes.
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from supabase import Client
from app.dependencies import GetSupabaseAdmin
from app.models.restaurant import (
    RestaurantResponse,
    DishResponse,
    RestaurantMenuResponse
)
from app.utils.exceptions import NotFoundException


Router = APIRouter(tags=["Restaurants & Menu"])


@Router.get("/restaurants", response_model=List[RestaurantResponse])
async def GetRestaurants(
    isActive: Optional[bool] = Query(True, description="Filter by active status", alias="isActive"),
    campusId: Optional[str] = Query(None, description="Filter by campus (future use)", alias="campusId"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine type"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves list of restaurants.
    
    Args:
        isActive: Filter by active status
        campusId: Filter by campus (optional)
        cuisine: Filter by cuisine type (optional)
        limit: Maximum number of results
        offset: Pagination offset
        Db: Supabase client instance
        
    Returns:
        List[RestaurantResponse]: List of restaurants
    """
    QueryBuilder = Db.table("restaurants").select("*")
    
    if isActive is not None:
        QueryBuilder = QueryBuilder.eq("is_active", isActive)
    
    if cuisine:
        QueryBuilder = QueryBuilder.contains("cuisine", [cuisine])
    
    Response = QueryBuilder.order("name").range(offset, offset + limit - 1).execute()
    
    return [RestaurantResponse(**Item) for Item in Response.data]


@Router.get("/restaurants/{restaurantId}", response_model=RestaurantResponse)
async def GetRestaurantById(
    restaurantId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific restaurant by ID.
    
    Args:
        restaurantId: Restaurant UUID
        Db: Supabase client instance
        
    Returns:
        RestaurantResponse: Restaurant details
        
    Raises:
        NotFoundException: If restaurant not found
    """
    Response = Db.table("restaurants").select("*").eq("id", restaurantId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Restaurant with ID {restaurantId} not found")
    
    return RestaurantResponse(**Response.data[0])


@Router.get("/restaurants/{restaurantId}/menu", response_model=List[DishResponse])
async def GetRestaurantMenu(
    restaurantId: str,
    isAvailable: Optional[bool] = Query(True, description="Filter by availability", alias="isAvailable"),
    veg: Optional[bool] = Query(None, description="Filter vegetarian dishes"),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves menu (dishes) for a specific restaurant.
    
    Args:
        restaurantId: Restaurant UUID
        isAvailable: Filter by dish availability
        veg: Filter vegetarian dishes only
        Db: Supabase client instance
        
    Returns:
        List[DishResponse]: List of dishes
    """
    QueryBuilder = Db.table("dishes").select("*").eq("restaurant_id", restaurantId)
    
    if isAvailable is not None:
        QueryBuilder = QueryBuilder.eq("is_available", isAvailable)
    
    if veg is not None:
        QueryBuilder = QueryBuilder.eq("veg", veg)
    
    Response = QueryBuilder.order("name").execute()
    
    return [DishResponse(**Item) for Item in Response.data]


@Router.get("/dishes/{dishId}", response_model=DishResponse)
async def GetDishById(
    dishId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific dish by ID.
    
    Args:
        dishId: Dish UUID
        Db: Supabase client instance
        
    Returns:
        DishResponse: Dish details
        
    Raises:
        NotFoundException: If dish not found
    """
    Response = Db.table("dishes").select("*").eq("id", dishId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Dish with ID {dishId} not found")
    
    return DishResponse(**Response.data[0])
