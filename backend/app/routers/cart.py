"""
Cart API routes for managing shopping cart operations.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import List
from supabase import Client
from app.dependencies import GetSupabase, GetCurrentUserId
from app.models.cart import (
    AddToCartRequest,
    CartResponse,
    CartSummaryResponse,
    CartItemResponse,
    CartItemUpdate
)
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException,
    ConflictException
)


Router = APIRouter(prefix="/cart", tags=["Cart"])


@Router.post("/items", response_model=CartItemResponse, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
async def AddItemToCart(
    Request: AddToCartRequest,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Adds an item to the cart. Creates cart if it doesn't exist.
    
    Args:
        Request: Add to cart request data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CartItemResponse: Created cart item
        
    Raises:
        BadRequestException: If pool is not open or dish is unavailable
    """
    # Validate pool exists and is open
    PoolResponse = Db.table("order_pools").select("*").eq("id", Request.poolId).execute()
    if not PoolResponse.data:
        raise NotFoundException(Detail="Pool not found")
    
    Pool = PoolResponse.data[0]
    PoolStatus = Pool.get("manual_status", "open")
    
    if PoolStatus not in ["open", "scheduled"]:
        raise BadRequestException(Detail=f"This pool is currently {PoolStatus}. You cannot add items to closed pools.")
    
    # Validate dish exists and get its details
    DishResponse = Db.table("dishes").select("*").eq("id", Request.dishId).execute()
    if not DishResponse.data:
        raise NotFoundException(Detail="Dish not found")
    
    Dish = DishResponse.data[0]
    
    if not Dish.get("is_available", True):
        raise BadRequestException(Detail="Dish is not available")
    
    if Dish["restaurant_id"] != Request.restaurantId:
        raise BadRequestException(Detail="Dish does not belong to specified restaurant")
    
    # Check if cart exists for this user and pool
    CartResponse = Db.table("cart").select("*").eq("customer_id", UserId).eq("pool_id", Request.poolId).execute()
    
    if CartResponse.data:
        CartId = CartResponse.data[0]["id"]
    else:
        # Check if user has a cart for a different pool
        ExistingCartResponse = Db.table("cart").select("*").eq("customer_id", UserId).execute()
        
        if ExistingCartResponse.data:
            # Update existing cart to new pool and clear items
            ExistingCartId = ExistingCartResponse.data[0]["id"]
            # Delete old cart items
            Db.table("cart_items").delete().eq("cart_id", ExistingCartId).execute()
            # Update cart pool
            Db.table("cart").update({"pool_id": Request.poolId}).eq("id", ExistingCartId).execute()
            CartId = ExistingCartId
        else:
            # Create new cart
            NewCart = Db.table("cart").insert({
                "customer_id": UserId,
                "pool_id": Request.poolId
            }).execute()
            CartId = NewCart.data[0]["id"]
    
    # Check if item already exists in cart
    ExistingItem = Db.table("cart_items").select("*").eq("cart_id", CartId).eq("dish_id", Request.dishId).execute()
    
    if ExistingItem.data:
        # Update quantity
        Item = ExistingItem.data[0]
        NewQuantity = Item["quantity"] + Request.quantity
        
        if NewQuantity > 99:
            raise BadRequestException(Detail="Maximum quantity per item is 99")
        
        Updated = Db.table("cart_items").update({
            "quantity": NewQuantity
        }).eq("id", Item["id"]).execute()
        
        UpdatedItem = Updated.data[0]
    else:
        # Add new item
        NewItem = Db.table("cart_items").insert({
            "cart_id": CartId,
            "restaurant_id": Request.restaurantId,
            "dish_id": Request.dishId,
            "quantity": Request.quantity,
            "price": Dish["price"],
            "special_instructions": Request.specialInstructions
        }).execute()
        
        UpdatedItem = NewItem.data[0]
    
    return {
        "id": UpdatedItem["id"],
        "cartId": UpdatedItem["cart_id"],
        "restaurantId": UpdatedItem["restaurant_id"],
        "dishId": UpdatedItem["dish_id"],
        "quantity": UpdatedItem["quantity"],
        "price": UpdatedItem["price"],
        "specialInstructions": UpdatedItem.get("special_instructions"),
        "createdAt": UpdatedItem["created_at"],
        "updatedAt": UpdatedItem["updated_at"]
    }


@Router.get("/", response_model=CartSummaryResponse, response_model_by_alias=False)
async def GetCart(
    PoolId: str = Query(..., alias="poolId"),
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves current cart with items and summary.
    
    Args:
        PoolId: Pool ID to get cart for
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CartSummaryResponse: Cart summary with items
        
    Raises:
        NotFoundException: If cart not found
    """
    # Get cart summary from view
    SummaryResponse = Db.table("cart_summary").select("*").eq("customer_id", UserId).eq("pool_id", PoolId).execute()
    
    if not SummaryResponse.data:
        # Return empty cart response instead of 404
        # Get pool info for the response
        PoolResponse = Db.table("order_pools").select("id, name, campus_id, delivery_fee_per_order").eq("id", PoolId).execute()
        if not PoolResponse.data:
            raise NotFoundException(Detail="Pool not found")
        
        Pool = PoolResponse.data[0]
        from datetime import datetime
        Now = datetime.utcnow().isoformat()
        
        return {
            "cartId": None,
            "customerId": UserId,
            "poolId": PoolId,
            "poolName": Pool["name"],
            "campusId": Pool["campus_id"],
            "restaurantCount": 0,
            "itemCount": 0,
            "totalQuantity": 0,
            "cartSubtotal": 0,
            "deliveryFeePerOrder": Pool.get("delivery_fee_per_order", 0),
            "createdAt": Now,
            "updatedAt": Now,
            "items": []
        }
    
    Summary = SummaryResponse.data[0]
    
    # Coalesce NULL aggregates to 0 (happens when cart exists but has no items)
    Summary["restaurant_count"] = Summary.get("restaurant_count") or 0
    Summary["item_count"] = Summary.get("item_count") or 0
    Summary["total_quantity"] = Summary.get("total_quantity") or 0
    Summary["cart_subtotal"] = Summary.get("cart_subtotal") or 0
    
    # Get cart items (raw) and fetch related details explicitly to avoid ambiguous PostgREST embeddings
    ItemsResponse = Db.table("cart_items").select(
        "id, cart_id, restaurant_id, dish_id, quantity, price, special_instructions, created_at, updated_at"
    ).eq("cart_id", Summary["cart_id"]).execute()

    DishIds = list({Item["dish_id"] for Item in ItemsResponse.data})
    RestaurantIds = list({Item["restaurant_id"] for Item in ItemsResponse.data})

    DishesById = {}
    if DishIds:
        DishResponse = Db.table("dishes").select("id, name, image, veg").in_("id", DishIds).execute()
        DishesById = {d["id"]: d for d in (DishResponse.data or [])}

    RestaurantsById = {}
    if RestaurantIds:
        RestaurantResponse = Db.table("restaurants").select("id, name").in_("id", RestaurantIds).execute()
        RestaurantsById = {r["id"]: r for r in (RestaurantResponse.data or [])}

    Items = []
    for Item in ItemsResponse.data:
        Dish = DishesById.get(Item["dish_id"], {})
        Restaurant = RestaurantsById.get(Item["restaurant_id"], {})
        Items.append({
            "id": Item["id"],
            "cartId": Item["cart_id"],
            "restaurantId": Item["restaurant_id"],
            "dishId": Item["dish_id"],
            "quantity": Item["quantity"],
            "price": Item["price"],
            "specialInstructions": Item.get("special_instructions"),
            "createdAt": Item["created_at"],
            "updatedAt": Item["updated_at"],
            "dishName": Dish.get("name", "Unknown"),
            "dishImage": Dish.get("image"),
            "veg": Dish.get("veg", True),
            "restaurantName": Restaurant.get("name", "Unknown")
        })
    
    return {
        "cartId": Summary["cart_id"],
        "customerId": Summary["customer_id"],
        "poolId": Summary["pool_id"],
        "poolName": Summary["pool_name"],
        "campusId": Summary["campus_id"],
        "restaurantCount": Summary.get("restaurant_count", 0),
        "itemCount": Summary.get("item_count", 0),
        "totalQuantity": Summary.get("total_quantity", 0),
        "cartSubtotal": Summary.get("cart_subtotal", 0),
        "deliveryFeePerOrder": Summary.get("delivery_fee_per_order", 0),
        "createdAt": Summary["created_at"],
        "updatedAt": Summary["updated_at"],
        "items": Items
    }


@Router.put("/items/{ItemId}", response_model=CartItemResponse, response_model_by_alias=False)
async def UpdateCartItem(
    ItemId: str,
    Update: CartItemUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Updates cart item quantity or special instructions.
    
    Args:
        ItemId: Cart item ID
        Update: Update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CartItemResponse: Updated cart item
        
    Raises:
        NotFoundException: If item not found
        BadRequestException: If quantity exceeds limit
    """
    # Verify item belongs to user's cart
    ItemResponse = Db.table("cart_items").select("*, cart!inner(customer_id)").eq("id", ItemId).execute()
    
    if not ItemResponse.data:
        raise NotFoundException(Detail="Cart item not found")
    
    if ItemResponse.data[0]["cart"]["customer_id"] != UserId:
        raise NotFoundException(Detail="Cart item not found")
    
    UpdateData = {}
    if Update.quantity is not None:
        if Update.quantity < 1 or Update.quantity > 99:
            raise BadRequestException(Detail="Quantity must be between 1 and 99")
        UpdateData["quantity"] = Update.quantity
    
    if Update.specialInstructions is not None:
        UpdateData["special_instructions"] = Update.specialInstructions
    
    if not UpdateData:
        # Nothing to update, return current item
        Item = ItemResponse.data[0]
    else:
        Updated = Db.table("cart_items").update(UpdateData).eq("id", ItemId).execute()
        Item = Updated.data[0]
    
    return {
        "id": Item["id"],
        "cartId": Item["cart_id"],
        "restaurantId": Item["restaurant_id"],
        "dishId": Item["dish_id"],
        "quantity": Item["quantity"],
        "price": Item["price"],
        "specialInstructions": Item.get("special_instructions"),
        "createdAt": Item["created_at"],
        "updatedAt": Item["updated_at"]
    }


@Router.delete("/items/{ItemId}", status_code=status.HTTP_204_NO_CONTENT)
async def RemoveCartItem(
    ItemId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Removes an item from cart.
    
    Args:
        ItemId: Cart item ID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Raises:
        NotFoundException: If item not found
    """
    # Verify item belongs to user's cart
    ItemResponse = Db.table("cart_items").select("*, cart!inner(customer_id)").eq("id", ItemId).execute()
    
    if not ItemResponse.data:
        raise NotFoundException(Detail="Cart item not found")
    
    if ItemResponse.data[0]["cart"]["customer_id"] != UserId:
        raise NotFoundException(Detail="Cart item not found")
    
    Db.table("cart_items").delete().eq("id", ItemId).execute()


@Router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def ClearCart(
    PoolId: str = Query(..., alias="poolId"),
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Clears all items from cart.
    
    Args:
        PoolId: Pool ID
        UserId: Authenticated user ID
        Db: Supabase client instance
    """
    # Get cart
    CartResponse = Db.table("cart").select("id").eq("customer_id", UserId).eq("pool_id", PoolId).execute()
    
    if CartResponse.data:
        CartId = CartResponse.data[0]["id"]
        # Delete all items
        Db.table("cart_items").delete().eq("cart_id", CartId).execute()

