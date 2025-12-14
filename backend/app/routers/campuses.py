"""
Campus API routes for listing and retrieving campus information.
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from supabase import Client
from app.dependencies import GetSupabaseAdmin
from app.models.campus import CampusResponse
from app.utils.exceptions import NotFoundException


Router = APIRouter(prefix="/campuses", tags=["Campuses"])


@Router.get("/", response_model=List[CampusResponse])
async def GetCampuses(
    isActive: Optional[bool] = Query(True, description="Filter by active status", alias="isActive"),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves list of campuses.
    
    Args:
        isActive: Filter by active status (default: True)
        Db: Supabase client instance
        
    Returns:
        List[CampusResponse]: List of campuses
    """
    QueryBuilder = Db.table("campuses").select("*")
    
    if isActive is not None:
        QueryBuilder = QueryBuilder.eq("is_active", isActive)
    
    Response = QueryBuilder.order("name").execute()
    
    return [CampusResponse(**Item) for Item in Response.data]


@Router.get("/{campusId}", response_model=CampusResponse)
async def GetCampusById(
    campusId: str,
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Retrieves a specific campus by ID.
    
    Args:
        campusId: Campus UUID
        Db: Supabase client instance
        
    Returns:
        CampusResponse: Campus details
        
    Raises:
        NotFoundException: If campus not found
    """
    Response = Db.table("campuses").select("*").eq("id", campusId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail=f"Campus with ID {campusId} not found")
    
    return CampusResponse(**Response.data[0])
