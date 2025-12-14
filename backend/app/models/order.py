"""
Order-related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class OrderStatus(str, Enum):
    """Order status enumeration."""
    
    POOLING = "pooling"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItemInput(BaseModel):
    """Model for order item in request."""
    
    dishId: str
    dishName: str
    quantity: int = Field(..., ge=1)
    price: int = Field(..., ge=0)
    veg: bool
    specialInstructions: Optional[str] = None

    class Config:
        populate_by_name = True


class DeliveryAddress(BaseModel):
    """Model for delivery address."""
    
    hostelBlock: str = Field(..., min_length=1)
    roomNumber: str = Field(..., min_length=1)
    floor: Optional[str] = None
    landmark: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        populate_by_name = True


class OrderCreate(BaseModel):
    """Model for creating an order from cart."""
    
    poolId: str
    specialInstructions: Optional[str] = Field(None, max_length=1000)
    promoCode: Optional[str] = None

    class Config:
        populate_by_name = True


class OrderPricingBreakdown(BaseModel):
    """Model for order pricing breakdown."""
    
    subtotal: int
    deliveryFee: int
    platformFee: int
    taxes: int
    discount: int
    total: int

    class Config:
        populate_by_name = True


class OrderResponse(BaseModel):
    """Model for order response."""
    
    id: str = Field(validation_alias="id")
    poolId: str = Field(validation_alias="pool_id")
    customerId: str = Field(validation_alias="customer_id")
    restaurantId: Optional[str] = Field(None, validation_alias="restaurant_id")
    items: List[Dict[str, Any]] = Field(validation_alias="items")
    subtotal: int = Field(validation_alias="subtotal")
    deliveryFee: int = Field(validation_alias="delivery_fee")
    platformFee: int = Field(validation_alias="platform_fee")
    taxes: int = Field(validation_alias="taxes")
    discount: int = Field(validation_alias="discount")
    total: int = Field(validation_alias="total")
    promoCode: Optional[str] = Field(None, validation_alias="promo_code")
    deliveryAddress: Dict[str, Any] = Field(validation_alias="delivery_address")
    specialInstructions: Optional[str] = Field(None, validation_alias="special_instructions")
    paymentStatus: str = Field(validation_alias="payment_status")
    paymentId: Optional[str] = Field(None, validation_alias="payment_id")
    status: str = Field(validation_alias="status")
    syncedToFleetbase: bool = Field(validation_alias="synced_to_fleetbase")
    cancelledAt: Optional[datetime] = Field(None, validation_alias="cancelled_at")
    cancellationReason: Optional[str] = Field(None, validation_alias="cancellation_reason")
    deliveredAt: Optional[datetime] = Field(None, validation_alias="delivered_at")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class OrderDetailResponse(BaseModel):
    """Model for detailed order response with related data."""
    
    orderId: str = Field(validation_alias="order_id")
    poolId: str = Field(validation_alias="pool_id")
    poolName: str = Field(validation_alias="pool_name")
    campusId: str = Field(validation_alias="campus_id")
    campusName: str = Field(validation_alias="campus_name")
    deliveryHotspot: str = Field(validation_alias="delivery_hotspot")
    customerId: str = Field(validation_alias="customer_id")
    customerName: str = Field(validation_alias="customer_name")
    customerPhone: str = Field(validation_alias="customer_phone")
    customerEmail: str = Field(validation_alias="customer_email")
    deliveryAddress: Dict[str, Any] = Field(validation_alias="delivery_address")
    restaurantId: Optional[str] = Field(None, validation_alias="restaurant_id")
    restaurantName: Optional[str] = Field(None, validation_alias="restaurant_name")
    restaurantAddress: Optional[str] = Field(None, validation_alias="restaurant_address")
    restaurantPhone: Optional[str] = Field(None, validation_alias="restaurant_phone")
    items: List[Dict[str, Any]] = Field(validation_alias="items")
    subtotal: int = Field(validation_alias="subtotal")
    deliveryFee: int = Field(validation_alias="delivery_fee")
    platformFee: int = Field(validation_alias="platform_fee")
    taxes: int = Field(validation_alias="taxes")
    discount: int = Field(validation_alias="discount")
    total: int = Field(validation_alias="total")
    promoCode: Optional[str] = Field(None, validation_alias="promo_code")
    specialInstructions: Optional[str] = Field(None, validation_alias="special_instructions")
    paymentStatus: str = Field(validation_alias="payment_status")
    paymentId: Optional[str] = Field(None, validation_alias="payment_id")
    orderStatus: str = Field(validation_alias="order_status")
    syncedToFleetbase: bool = Field(validation_alias="synced_to_fleetbase")
    cancelledAt: Optional[datetime] = Field(None, validation_alias="cancelled_at")
    cancellationReason: Optional[str] = Field(None, validation_alias="cancellation_reason")
    deliveredAt: Optional[datetime] = Field(None, validation_alias="delivered_at")
    deliveryWindow: str = Field(validation_alias="delivery_window")
    fleetbasePoolId: Optional[str] = Field(None, validation_alias="fleetbase_pool_id")
    orderedAt: datetime = Field(validation_alias="ordered_at")
    updatedAt: datetime = Field(validation_alias="updated_at")

    class Config:
        populate_by_name = True


class CustomerOrderHistoryResponse(BaseModel):
    """Model for customer order history item."""
    
    customerId: str = Field(validation_alias="customer_id")
    orderId: str = Field(validation_alias="order_id")
    poolId: str = Field(validation_alias="pool_id")
    poolName: str = Field(validation_alias="pool_name")
    restaurantId: Optional[str] = Field(None, validation_alias="restaurant_id")
    restaurantName: Optional[str] = Field(None, validation_alias="restaurant_name")
    restaurantImage: Optional[str] = Field(None, validation_alias="restaurant_image")
    items: List[Dict[str, Any]] = Field(validation_alias="items")
    total: int = Field(validation_alias="total")
    status: str = Field(validation_alias="status")
    paymentStatus: str = Field(validation_alias="payment_status")
    orderedAt: datetime = Field(validation_alias="ordered_at")
    deliveredAt: Optional[datetime] = Field(None, validation_alias="delivered_at")
    itemCount: int = Field(validation_alias="item_count")

    class Config:
        populate_by_name = True


class OrderStatusUpdate(BaseModel):
    """Model for updating order status."""
    
    status: OrderStatus = Field(validation_alias="status")
    cancellationReason: Optional[str] = Field(None, validation_alias="cancellation_reason")

    class Config:
        populate_by_name = True


class AdminPoolOrderSummary(BaseModel):
    """Admin-friendly order summary for a specific pool."""

    orderId: str = Field(validation_alias="order_id")
    poolId: str = Field(validation_alias="pool_id")
    poolName: Optional[str] = Field(None, validation_alias="pool_name")
    customerId: str = Field(validation_alias="customer_id")
    customerName: Optional[str] = Field(None, validation_alias="customer_name")
    restaurantId: Optional[str] = Field(None, validation_alias="restaurant_id")
    restaurantName: Optional[str] = Field(None, validation_alias="restaurant_name")
    total: Optional[int] = None
    status: Optional[str] = None
    paymentStatus: Optional[str] = Field(None, validation_alias="payment_status")
    orderedAt: Optional[datetime] = Field(None, validation_alias="ordered_at")

    class Config:
        populate_by_name = True
        extra = "ignore"
