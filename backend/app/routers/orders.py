"""
Order API routes for creating and managing customer orders.
"""

from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional
from supabase import Client
from app.dependencies import GetSupabase, GetCurrentUserId
from app.models.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    CustomerOrderHistoryResponse,
    OrderStatusUpdate
)
from app.services.pricing import PricingService
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException
)


Router = APIRouter(prefix="/orders", tags=["Orders"])


def _has_valid_phone(value: Optional[str]) -> bool:
    if not value:
        return False
    digits = "".join(ch for ch in value if ch.isdigit())
    return len(digits) >= 10


@Router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def CreateOrder(
    OrderData: OrderCreate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Creates an order from cart items.
    
    Args:
        OrderData: Order creation data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        OrderResponse: Created order
        
    Raises:
        BadRequestException: If cart is empty or validation fails
        NotFoundException: If cart not found
    """
    # Get cart summary
    CartResponse = Db.table("cart_summary").select("*").eq("customer_id", UserId).eq("pool_id", OrderData.poolId).execute()
    
    if not CartResponse.data:
        raise NotFoundException(Detail="Cart not found for this pool")
    
    Cart = CartResponse.data[0]
    
    if Cart.get("item_count", 0) == 0:
        raise BadRequestException(Detail="Cart is empty")
    
    Subtotal = Cart.get("cart_subtotal", 0)
    
    # Validate minimum cart value
    if not PricingService.ValidateCartMinimum(Subtotal):
        MinValue = PricingService.settings.MinCartValue / 100
        raise BadRequestException(Detail=f"Minimum cart value is ₹{MinValue}")
    
    DeliveryFee = Cart.get("delivery_fee_per_order", 0)

    # Require phone number for delivery
    CustomerResponse = Db.table("customers").select("phone").eq("id", UserId).execute()
    CustomerPhone = None
    if CustomerResponse.data:
        CustomerPhone = CustomerResponse.data[0].get("phone")
    if not _has_valid_phone(CustomerPhone):
        raise BadRequestException(Detail="Please add your phone number in Profile before placing an order.")
    
    # Get pool details including campus hotspot for delivery address
    PoolResponse = Db.table("order_pools").select("*, campuses(name, hotspot_location)").eq("id", OrderData.poolId).execute()
    
    if not PoolResponse.data:
        raise NotFoundException(Detail="Pool not found")
    
    Pool = PoolResponse.data[0]
    
    # Validate pool collection time - reject if pool has closed
    from datetime import datetime, timezone
    CollectionEndStr = Pool.get("collection_end")
    if CollectionEndStr:
        try:
            CollectionEnd = datetime.fromisoformat(CollectionEndStr.replace("Z", "+00:00"))
            if CollectionEnd.tzinfo is None:
                CollectionEnd = CollectionEnd.replace(tzinfo=timezone.utc)
            
            Now = datetime.now(timezone.utc)
            if Now > CollectionEnd:
                raise BadRequestException(Detail="This pool has closed. Orders are no longer being accepted.")
        except (ValueError, TypeError):
            pass  # If date parsing fails, allow order to proceed
    
    CampusInfo = Pool.get("campuses", {})
    
    # Build delivery address from campus hotspot
    DeliveryAddressData = {
        "campus_name": CampusInfo.get("name", ""),
        "hotspot_location": CampusInfo.get("hotspot_location", ""),
        "campus_id": Pool.get("campus_id", ""),
        "phone": CustomerPhone
    }
    
    # Calculate pricing
    Pricing = PricingService.CalculateOrderPricing(
        Subtotal=Subtotal,
        DeliveryFee=DeliveryFee,
        PromoCode=OrderData.promoCode
    )
    
    # Get cart items to create order items array
    CartItems = Db.table("cart_items").select(
        "dish_id, restaurant_id, quantity, price, special_instructions"
    ).eq("cart_id", Cart["cart_id"]).execute()

    DishIds = list({Item["dish_id"] for Item in CartItems.data})
    DishesById = {}
    if DishIds:
        DishResponse = Db.table("dishes").select("id, name, veg").in_("id", DishIds).execute()
        DishesById = {d["id"]: d for d in (DishResponse.data or [])}
    
    # Group items by restaurant (for multi-restaurant orders)
    RestaurantGroups = {}
    for Item in CartItems.data:
        RestId = Item["restaurant_id"]
        if RestId not in RestaurantGroups:
            RestaurantGroups[RestId] = []

        Dish = DishesById.get(Item["dish_id"], {})
        
        DishName = Dish.get("name", "Unknown")
        UnitPrice = Item["price"]
        Quantity = Item["quantity"]
        RestaurantGroups[RestId].append({
            # Existing keys used by the customer app
            "dish_id": Item["dish_id"],
            "dish_name": DishName,
            "quantity": Quantity,
            "price": UnitPrice,
            "veg": Dish.get("veg", True),
            "special_instructions": Item.get("special_instructions"),

            # Contract-friendly keys (admin sync consumers)
            "menu_item_id": Item["dish_id"],
            "name": DishName,
            "unit_price": UnitPrice,
            "subtotal": UnitPrice * Quantity,
            "customizations": Item.get("special_instructions"),
        })
    
    # Create orders (one per restaurant)
    # Generate a single order_group_id for all orders from this checkout
    import uuid
    OrderGroupId = str(uuid.uuid4())
    
    CreatedOrders = []
    
    for RestaurantId, Items in RestaurantGroups.items():
        # Calculate subtotal for this restaurant's items
        RestaurantSubtotal = sum(item["price"] * item["quantity"] for item in Items)
        
        # For simplicity, split fees proportionally
        # In reality, you might want different logic
        ProportionalDeliveryFee = int((RestaurantSubtotal / Subtotal) * DeliveryFee)
        ProportionalDiscount = int((RestaurantSubtotal / Subtotal) * Pricing["Discount"])
        
        RestaurantTotal = RestaurantSubtotal + ProportionalDeliveryFee - ProportionalDiscount
        
        OrderInsert = {
            "pool_id": OrderData.poolId,
            "customer_id": UserId,
            "restaurant_id": RestaurantId,
            "order_group_id": OrderGroupId,
            "items": Items,
            "subtotal": RestaurantSubtotal,
            "delivery_fee": ProportionalDeliveryFee,
            "platform_fee": 0,
            "taxes": 0,
            "discount": ProportionalDiscount,
            "total": RestaurantTotal,
            "promo_code": OrderData.promoCode,
            "delivery_address": DeliveryAddressData,
            "special_instructions": OrderData.specialInstructions,
            "payment_status": "pending",
            "status": "pooling"
        }
        
        OrderResult = Db.table("customer_orders").insert(OrderInsert).execute()
        CreatedOrders.append(OrderResult.data[0])
    
    # Clear cart after successful order creation
    Db.table("cart_items").delete().eq("cart_id", Cart["cart_id"]).execute()
    
    # Return first order (or you could return all orders)
    Order = CreatedOrders[0]
    
    return OrderResponse(**Order)


@Router.get("/group/{order_group_id}", response_model=List[OrderDetailResponse])
async def GetOrderGroup(
    order_group_id: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Get all orders in the same order group.
    
    Args:
        order_group_id: The order group ID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[OrderDetailResponse]: All orders in the group
        
    Raises:
        NotFoundException: If order group not found or user doesn't own orders
    """
    Response = Db.table("order_details").select("*").eq("order_group_id", order_group_id).eq("customer_id", UserId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Order group not found")
    
    return [OrderDetailResponse(**order) for order in Response.data]


@Router.get("/", response_model=List[CustomerOrderHistoryResponse])
async def GetCustomerOrders(
    Limit: int = Query(20, ge=1, le=100, alias="limit"),
    Offset: int = Query(0, ge=0, alias="offset"),
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves customer's order history.
    
    Args:
        Limit: Maximum number of results
        Offset: Pagination offset
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[CustomerOrderHistoryResponse]: List of customer orders
    """
    Response = Db.table("customer_order_history").select("*").eq("customer_id", UserId).range(Offset, Offset + Limit - 1).execute()
    
    return [CustomerOrderHistoryResponse(**Item) for Item in Response.data]


@Router.get("/{OrderId}", response_model=OrderDetailResponse)
async def GetOrderDetails(
    OrderId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves detailed information about a specific order.
    
    Args:
        OrderId: Order UUID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        OrderDetailResponse: Detailed order information
        
    Raises:
        NotFoundException: If order not found or doesn't belong to user
    """
    Response = Db.table("order_details").select("*").eq("order_id", OrderId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Order not found")
    
    Item = Response.data[0]
    
    # Verify order belongs to user
    if Item["customer_id"] != UserId:
        raise NotFoundException(Detail="Order not found")
    
    return OrderDetailResponse(**Item)


@Router.patch("/{OrderId}/status", response_model=OrderResponse)
async def UpdateOrderStatus(
    OrderId: str,
    StatusUpdate: OrderStatusUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Updates order status (for cancellation by customer).
    
    Args:
        OrderId: Order UUID
        StatusUpdate: Status update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        OrderResponse: Updated order
        
    Raises:
        NotFoundException: If order not found
        BadRequestException: If status transition not allowed
    """
    # Get order
    OrderResponse = Db.table("customer_orders").select("*").eq("id", OrderId).eq("customer_id", UserId).execute()
    
    if not OrderResponse.data:
        raise NotFoundException(Detail="Order not found")
    
    Order = OrderResponse.data[0]
    CurrentStatus = Order["status"]
    
    # Only allow cancellation for now
    if StatusUpdate.status.value != "cancelled":
        raise BadRequestException(Detail="Only cancellation is allowed via this endpoint")
    
    # Check if cancellation is allowed
    if CurrentStatus not in ["pooling", "pending"]:
        raise BadRequestException(Detail="Order cannot be cancelled at this stage")
    
    # Update order
    UpdateData = {
        "status": StatusUpdate.status.value,
        "cancelled_at": "now()",
        "cancellation_reason": StatusUpdate.cancellationReason
    }
    
    Updated = Db.table("customer_orders").update(UpdateData).eq("id", OrderId).execute()
    UpdatedOrder = Updated.data[0]
    
    return OrderResponse(**UpdatedOrder)

