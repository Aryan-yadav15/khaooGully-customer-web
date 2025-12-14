"""
Admin API routes for managing platform resources.
"""

from fastapi import APIRouter, Depends, status
from supabase import Client
from app.dependencies import GetSupabaseAdmin, RequireAdmin
from app.models.campus import CampusCreate, CampusUpdate, CampusResponse
from app.models.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse, DishCreate, DishUpdate, DishResponse
from app.models.pool import OrderPoolCreate, OrderPoolUpdate, OrderPoolResponse
from app.models.order import AdminPoolOrderSummary
from app.utils.exceptions import NotFoundException


Router = APIRouter(prefix="/admin", tags=["Admin"])


# Campus Management
@Router.post("/campuses", response_model=CampusResponse, status_code=status.HTTP_201_CREATED)
async def CreateCampus(
    campusData: CampusCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Creates a new campus."""
    
    InsertData = campusData.model_dump(by_alias=True)
    
    Response = Db.table("campuses").insert(InsertData).execute()
    Campus = Response.data[0]
    
    return CampusResponse(**Campus)


@Router.put("/campuses/{campusId}", response_model=CampusResponse)
async def UpdateCampus(
    campusId: str,
    campusUpdate: CampusUpdate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Updates campus details."""
    
    UpdateData = campusUpdate.model_dump(by_alias=True, exclude_unset=True)
    
    if not UpdateData:
        Response = Db.table("campuses").select("*").eq("id", campusId).execute()
    else:
        Response = Db.table("campuses").update(UpdateData).eq("id", campusId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Campus not found")
    
    return CampusResponse(**Response.data[0])


# Restaurant Management
@Router.post("/restaurants", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def CreateRestaurant(
    restaurantData: RestaurantCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Creates a new restaurant."""
    
    InsertData = restaurantData.model_dump(by_alias=True)
    
    Response = Db.table("restaurants").insert(InsertData).execute()
    
    return RestaurantResponse(**Response.data[0])


@Router.delete("/restaurants/{restaurantId}", status_code=status.HTTP_204_NO_CONTENT)
async def DeleteRestaurant(
    restaurantId: str,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Deletes a restaurant."""
    
    Response = Db.table("restaurants").delete().eq("id", restaurantId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Restaurant not found")
    
    return None


# Dish Management
@Router.post("/dishes", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
async def CreateDish(
    dishData: DishCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Creates a new dish."""
    
    InsertData = dishData.model_dump(by_alias=True)
    
    Response = Db.table("dishes").insert(InsertData).execute()
    
    return DishResponse(**Response.data[0])


@Router.put("/dishes/{dishId}", response_model=DishResponse)
async def UpdateDish(
    dishId: str,
    dishUpdate: DishUpdate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Updates dish details."""
    
    UpdateData = dishUpdate.model_dump(by_alias=True, exclude_unset=True)
    
    if not UpdateData:
        Response = Db.table("dishes").select("*").eq("id", dishId).execute()
    else:
        Response = Db.table("dishes").update(UpdateData).eq("id", dishId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Dish not found")
    
    return DishResponse(**Response.data[0])


# Pool Management
@Router.post("/pools", response_model=OrderPoolResponse, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
async def CreatePool(
    poolData: OrderPoolCreate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Creates a new order pool."""
    
    # Use mode="json" to serialize datetime objects to ISO strings
    # Also persist participating_restaurants to order_pools (jsonb) for downstream consumers.
    InsertData = poolData.model_dump(mode="json")
    
    Response = Db.table("order_pools").insert(InsertData).execute()
    Pool = Response.data[0]
    
    # Add restaurants to pool_restaurants junction table
    if poolData.participating_restaurants:
        PoolRestaurants = [{"pool_id": Pool["id"], "restaurant_id": RestId} for RestId in poolData.participating_restaurants]
        Db.table("pool_restaurants").insert(PoolRestaurants).execute()
    
    Pool["computed_status"] = None
    Pool["participating_restaurants"] = poolData.participating_restaurants or []
    return OrderPoolResponse(**Pool)


@Router.put("/pools/{poolId}", response_model=OrderPoolResponse, response_model_by_alias=False)
async def UpdatePool(
    poolId: str,
    poolUpdate: OrderPoolUpdate,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Updates pool details."""
    
    # Extract participating_restaurants before excluding it from the update data
    ParticipatingRestaurants = poolUpdate.participating_restaurants
    
    # Keep participating_restaurants in the order_pools table (jsonb) for downstream consumers.
    # We still maintain pool_restaurants as the source of truth for internal joins.
    UpdateData = poolUpdate.model_dump(mode="json", exclude_unset=True, exclude={"participating_restaurants"})
    if ParticipatingRestaurants is not None:
        UpdateData["participating_restaurants"] = ParticipatingRestaurants
    
    if not UpdateData:
        Response = Db.table("order_pools").select("*").eq("id", poolId).execute()
    else:
        Response = Db.table("order_pools").update(UpdateData).eq("id", poolId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Pool not found")
    
    Pool = Response.data[0]
    
    # Update participating restaurants in junction table if provided
    if ParticipatingRestaurants is not None:
        # Delete existing pool-restaurant associations
        Db.table("pool_restaurants").delete().eq("pool_id", poolId).execute()
        
        # Insert new associations
        if ParticipatingRestaurants:
            PoolRestaurants = [{"pool_id": poolId, "restaurant_id": RestId} for RestId in ParticipatingRestaurants]
            Db.table("pool_restaurants").insert(PoolRestaurants).execute()
    
    # Fetch the current participating restaurants from the junction table
    RestaurantResponse = Db.table("pool_restaurants").select("restaurant_id").eq("pool_id", poolId).execute()
    CurrentRestaurants = [r["restaurant_id"] for r in RestaurantResponse.data] if RestaurantResponse.data else []
    
    Pool["computed_status"] = None
    Pool["participating_restaurants"] = CurrentRestaurants
    
    return OrderPoolResponse(**Pool)


@Router.delete("/pools/{poolId}", status_code=status.HTTP_204_NO_CONTENT)
async def DeletePool(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Deletes a pool."""
    
    Response = Db.table("order_pools").delete().eq("id", poolId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Pool not found")
    
    return None


@Router.post("/pools/{poolId}/close", response_model=OrderPoolResponse, response_model_by_alias=False)
async def ClosePool(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Marks a pool as closed by setting manual_status='closed'."""

    Updated = Db.table("order_pools").update({"manual_status": "closed"}).eq("id", poolId).execute()
    if not Updated.data:
        raise NotFoundException(Detail="Pool not found")

    Pool = Updated.data[0]

    # Keep participating_restaurants consistent with junction table
    RestaurantResponse = Db.table("pool_restaurants").select("restaurant_id").eq("pool_id", poolId).execute()
    CurrentRestaurants = [r["restaurant_id"] for r in RestaurantResponse.data] if RestaurantResponse.data else []

    Pool["computed_status"] = None
    Pool["participating_restaurants"] = CurrentRestaurants

    return OrderPoolResponse(**Pool)


@Router.get("/pools/{poolId}/orders", response_model=list[AdminPoolOrderSummary], response_model_by_alias=False)
async def GetPoolOrders(
    poolId: str,
    Db: Client = Depends(GetSupabaseAdmin),
    Admin: dict = Depends(RequireAdmin)
):
    """Lists all orders belonging to a pool (admin only)."""

    Response = Db.table("order_details").select("*").eq("pool_id", poolId).execute()
    return [AdminPoolOrderSummary(**Item) for Item in (Response.data or [])]
