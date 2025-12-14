"""
Cart-related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CartItemBase(BaseModel):
    """Base cart item model."""
    
    dishId: str = Field(..., validation_alias="dish_id")
    quantity: int = Field(..., ge=1, le=99, validation_alias="quantity")
    specialInstructions: Optional[str] = Field(None, max_length=500, validation_alias="special_instructions")
    
    class Config:
        populate_by_name = True


class CartItemCreate(CartItemBase):
    """Model for adding item to cart."""
    
    restaurantId: str = Field(..., validation_alias="restaurant_id")
    price: int = Field(..., ge=0, validation_alias="price")


class CartItemUpdate(BaseModel):
    """Model for updating cart item."""
    
    quantity: Optional[int] = Field(None, ge=1, le=99, validation_alias="quantity")
    specialInstructions: Optional[str] = Field(None, max_length=500, validation_alias="special_instructions")
    
    class Config:
        populate_by_name = True


class CartItemResponse(CartItemBase):
    """Model for cart item response."""
    
    id: str = Field(..., validation_alias="id")
    cartId: str = Field(..., validation_alias="cart_id")
    restaurantId: str = Field(..., validation_alias="restaurant_id")
    price: int = Field(..., validation_alias="price")
    createdAt: datetime = Field(..., validation_alias="created_at")
    updatedAt: datetime = Field(..., validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CartItemWithDetails(CartItemResponse):
    """Cart item with dish details."""
    
    dishName: str = Field(..., validation_alias="dish_name")
    dishImage: Optional[str] = Field(None, validation_alias="dish_image")
    veg: bool = Field(..., validation_alias="veg")
    restaurantName: str = Field(..., validation_alias="restaurant_name")


class CartCreate(BaseModel):
    """Model for creating a cart."""
    
    poolId: str = Field(..., validation_alias="pool_id")
    
    class Config:
        populate_by_name = True


class CartResponse(BaseModel):
    """Model for cart response."""
    
    id: str = Field(..., validation_alias="id")
    customerId: str = Field(..., validation_alias="customer_id")
    poolId: str = Field(..., validation_alias="pool_id")
    createdAt: datetime = Field(..., validation_alias="created_at")
    updatedAt: datetime = Field(..., validation_alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CartSummaryResponse(BaseModel):
    """Model for cart summary with totals."""
    
    cartId: Optional[str] = Field(None, validation_alias="cart_id")
    customerId: str = Field(..., validation_alias="customer_id")
    poolId: str = Field(..., validation_alias="pool_id")
    poolName: str = Field(..., validation_alias="pool_name")
    campusId: str = Field(..., validation_alias="campus_id")
    restaurantCount: int = Field(..., validation_alias="restaurant_count")
    itemCount: int = Field(..., validation_alias="item_count")
    totalQuantity: int = Field(..., validation_alias="total_quantity")
    cartSubtotal: int = Field(..., validation_alias="cart_subtotal")
    deliveryFeePerOrder: int = Field(..., validation_alias="delivery_fee_per_order")
    createdAt: datetime = Field(..., validation_alias="created_at")
    updatedAt: datetime = Field(..., validation_alias="updated_at")
    items: List[CartItemWithDetails] = Field(default_factory=list, validation_alias="items")
    
    class Config:
        populate_by_name = True


class AddToCartRequest(BaseModel):
    """Request model for adding item to cart."""
    
    poolId: str = Field(...)
    restaurantId: str = Field(...)
    dishId: str = Field(...)
    quantity: int = Field(..., ge=1, le=99)
    specialInstructions: Optional[str] = Field(None, max_length=500)
    
    class Config:
        populate_by_name = True
