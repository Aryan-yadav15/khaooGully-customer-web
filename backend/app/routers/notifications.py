"""
Notification API routes for managing customer notifications.
"""

from fastapi import APIRouter, Depends, status
from typing import List
from supabase import Client
from app.dependencies import GetSupabase, GetSupabaseAdmin, GetCurrentUserId, RequireAdmin
from app.models.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse
)
from app.utils.exceptions import (
    NotFoundException
)


Router = APIRouter(prefix="/notifications", tags=["Notifications"])


@Router.get("/", response_model=List[NotificationResponse])
async def GetMyNotifications(
    UnreadOnly: bool = False,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves notifications for the authenticated customer.
    
    Args:
        UnreadOnly: If True, only return unread notifications
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[NotificationResponse]: List of notifications
    """
    Query = Db.table("notifications").select("*").eq("customer_id", UserId)
    
    if UnreadOnly:
        Query = Query.eq("is_read", False)
    
    Response = Query.order("created_at", desc=True).execute()
    
    return [NotificationResponse(**Item) for Item in Response.data]


@Router.get("/unread-count")
async def GetUnreadNotificationCount(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves count of unread notifications.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        Dict: Unread notification count
    """
    Response = Db.table("notifications").select("id", count="exact").eq("customer_id", UserId).eq("is_read", False).execute()
    
    return {
        "unreadCount": Response.count or 0
    }


@Router.patch("/{NotificationId}", response_model=NotificationResponse)
async def MarkNotificationAsRead(
    NotificationId: str,
    NotificationUpdate: NotificationUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Marks a notification as read or unread.
    
    Args:
        NotificationId: Notification ID
        NotificationUpdate: Notification update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        NotificationResponse: Updated notification
    """
    Response = Db.table("notifications").update({
        "is_read": NotificationUpdate.isRead
    }).eq("id", NotificationId).eq("customer_id", UserId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Notification not found")
    
    Notification = Response.data[0]
    
    return NotificationResponse(**Notification)


@Router.post("/mark-all-read")
async def MarkAllNotificationsAsRead(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Marks all notifications as read for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        Dict: Success message with count
    """
    Response = Db.table("notifications").update({
        "is_read": True
    }).eq("customer_id", UserId).eq("is_read", False).execute()
    
    return {
        "success": True,
        "markedCount": len(Response.data) if Response.data else 0,
        "message": "All notifications marked as read"
    }


# Admin endpoints
@Router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def CreateNotification(
    NotificationData: NotificationCreate,
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Creates a notification for a customer (admin only).
    
    Args:
        NotificationData: Notification creation data
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        NotificationResponse: Created notification
    """
    InsertData = {
        "customer_id": NotificationData.customerId,
        "title": NotificationData.title,
        "message": NotificationData.message,
        "type": NotificationData.type or "system",
        "action_url": NotificationData.actionUrl,
        "order_id": NotificationData.orderId,
        "is_read": False
    }
    
    Response = Db.table("notifications").insert(InsertData).execute()
    Notification = Response.data[0]
    
    return NotificationResponse(**Notification)
