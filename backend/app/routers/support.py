"""
Support ticket API routes for customer support system.
"""

from fastapi import APIRouter, Depends, status
from typing import List
from supabase import Client
from app.dependencies import GetSupabase, GetSupabaseAdmin, GetCurrentUserId, RequireAdmin
from app.models.support import (
    SupportTicketCreate,
    SupportTicketUpdate,
    SupportTicketResponse,
    SupportMessageCreate,
    SupportMessageResponse
)
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException,
    UnauthorizedException
)


Router = APIRouter(prefix="/support", tags=["Support"])


@Router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def CreateSupportTicket(
    TicketData: SupportTicketCreate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Creates a new support ticket.
    
    Args:
        TicketData: Support ticket creation data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        SupportTicketResponse: Created support ticket
    """
    InsertData = {
        "customer_id": UserId,
        "order_id": TicketData.orderId,
        "subject": TicketData.subject,
        "description": TicketData.description,
        "category": TicketData.category or "other",
        "status": "open",
        "priority": "medium"
    }
    
    Response = Db.table("support_tickets").insert(InsertData).execute()
    Ticket = Response.data[0]
    
    return SupportTicketResponse(**Ticket)


@Router.get("/tickets", response_model=List[SupportTicketResponse])
async def GetMyTickets(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves all support tickets for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[SupportTicketResponse]: List of support tickets
    """
    Response = Db.table("support_tickets").select("*").eq("customer_id", UserId).order("created_at", desc=True).execute()
    
    return [SupportTicketResponse(**Item) for Item in Response.data]


@Router.get("/tickets/{TicketId}", response_model=SupportTicketResponse)
async def GetTicketDetails(
    TicketId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves details of a specific support ticket.
    
    Args:
        TicketId: Support ticket ID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        SupportTicketResponse: Support ticket details
    """
    Response = Db.table("support_tickets").select("*").eq("id", TicketId).eq("customer_id", UserId).single().execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Support ticket not found")
    
    Ticket = Response.data
    
    return SupportTicketResponse(**Ticket)


@Router.post("/tickets/{TicketId}/messages", response_model=SupportMessageResponse, status_code=status.HTTP_201_CREATED)
async def SendTicketMessage(
    TicketId: str,
    MessageData: SupportMessageCreate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Sends a message on a support ticket.
    
    Args:
        TicketId: Support ticket ID
        MessageData: Message data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        SupportMessageResponse: Created message
    """
    # Verify ticket exists and belongs to user
    TicketResponse = Db.table("support_tickets").select("*").eq("id", TicketId).eq("customer_id", UserId).single().execute()
    
    if not TicketResponse.data:
        raise NotFoundException(Detail="Support ticket not found")
    
    InsertData = {
        "ticket_id": TicketId,
        "sender_id": UserId,
        "sender_type": "customer",
        "message": MessageData.message,
        "attachments": MessageData.attachments
    }
    
    Response = Db.table("support_messages").insert(InsertData).execute()
    Message = Response.data[0]
    
    return SupportMessageResponse(**Message)


@Router.get("/tickets/{TicketId}/messages", response_model=List[SupportMessageResponse])
async def GetTicketMessages(
    TicketId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves all messages for a support ticket.
    
    Args:
        TicketId: Support ticket ID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[SupportMessageResponse]: List of messages
    """
    # Verify ticket exists and belongs to user
    TicketResponse = Db.table("support_tickets").select("*").eq("id", TicketId).eq("customer_id", UserId).single().execute()
    
    if not TicketResponse.data:
        raise NotFoundException(Detail="Support ticket not found")
    
    Response = Db.table("support_messages").select("*").eq("ticket_id", TicketId).order("created_at", asc=True).execute()
    
    return [SupportMessageResponse(**Item) for Item in Response.data]


# Admin endpoints
@Router.get("/admin/tickets", response_model=List[SupportTicketResponse])
async def GetAllTickets(
    Status: str = None,
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves all support tickets (admin only).
    
    Args:
        Status: Optional status filter
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        List[SupportTicketResponse]: List of all support tickets
    """
    Query = Db.table("support_tickets").select("*")
    
    if Status:
        Query = Query.eq("status", Status)
    
    Response = Query.order("created_at", desc=True).execute()
    
    return [SupportTicketResponse(**Item) for Item in Response.data]


@Router.patch("/admin/tickets/{TicketId}", response_model=SupportTicketResponse)
async def UpdateTicket(
    TicketId: str,
    TicketUpdate: SupportTicketUpdate,
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Updates a support ticket (admin only).
    
    Args:
        TicketId: Support ticket ID
        TicketUpdate: Ticket update data
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        SupportTicketResponse: Updated support ticket
    """
    UpdateData = {}
    
    if TicketUpdate.status is not None:
        UpdateData["status"] = TicketUpdate.status
        if TicketUpdate.status in ["resolved", "closed"]:
            UpdateData["resolved_at"] = "now()"
    
    if TicketUpdate.priority is not None:
        UpdateData["priority"] = TicketUpdate.priority
    
    if TicketUpdate.assignedTo is not None:
        UpdateData["assigned_to"] = TicketUpdate.assignedTo
    
    if TicketUpdate.resolutionNotes is not None:
        UpdateData["resolution_notes"] = TicketUpdate.resolutionNotes
    
    if not UpdateData:
        raise BadRequestException(Detail="No fields to update")
    
    Response = Db.table("support_tickets").update(UpdateData).eq("id", TicketId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Support ticket not found")
    
    Ticket = Response.data[0]
    
    return SupportTicketResponse(**Ticket)
