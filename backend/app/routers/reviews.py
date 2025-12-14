"""
Review and rating API routes.
"""

from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional
from supabase import Client
from app.dependencies import GetSupabase, GetCurrentUserId
from app.models.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewTargetType
)
from app.utils.exceptions import NotFoundException, BadRequestException


Router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


@Router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def CreateReview(
    ReviewData: ReviewCreate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Creates a new review for a restaurant or dish.
    
    Args:
        ReviewData: Review creation data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        ReviewResponse: Created review
        
    Raises:
        BadRequestException: If user already reviewed this item
    """
    # Check if user already reviewed this item
    ExistingReview = Db.table("reviews").select("*").eq("customer_id", UserId).eq("target_id", ReviewData.targetId).eq("target_type", ReviewData.targetType.value).execute()
    
    if ExistingReview.data:
        raise BadRequestException(Detail="You have already reviewed this item")
    
    InsertData = {
        "customer_id": UserId,
        "customer_name": ReviewData.customerName,
        "customer_avatar": ReviewData.customerAvatar,
        "target_id": ReviewData.targetId,
        "target_type": ReviewData.targetType.value,
        "rating": ReviewData.rating,
        "comment": ReviewData.comment
    }
    
    Response = Db.table("reviews").insert(InsertData).execute()
    Review = Response.data[0]
    
    return ReviewResponse(**Review)


@Router.get("/", response_model=List[ReviewResponse])
async def GetReviews(
    TargetId: Optional[str] = Query(None, description="Filter by target (restaurant/dish) ID"),
    TargetType: Optional[ReviewTargetType] = Query(None, description="Filter by target type"),
    Limit: int = Query(20, ge=1, le=100),
    Offset: int = Query(0, ge=0),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves reviews.
    
    Args:
        TargetId: Filter by target ID
        TargetType: Filter by target type
        Limit: Maximum number of results
        Offset: Pagination offset
        Db: Supabase client instance
        
    Returns:
        List[ReviewResponse]: List of reviews
    """
    QueryBuilder = Db.table("reviews").select("*")
    
    if TargetId:
        QueryBuilder = QueryBuilder.eq("target_id", TargetId)
    
    if TargetType:
        QueryBuilder = QueryBuilder.eq("target_type", TargetType.value)
    
    Response = QueryBuilder.order("created_at", desc=True).range(Offset, Offset + Limit - 1).execute()
    
    return [ReviewResponse(**Item) for Item in Response.data]


@Router.put("/{ReviewId}", response_model=ReviewResponse)
async def UpdateReview(
    ReviewId: str,
    ReviewUpdate: ReviewUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Updates an existing review.
    
    Args:
        ReviewId: Review UUID
        ReviewUpdate: Review update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        ReviewResponse: Updated review
        
    Raises:
        NotFoundException: If review not found or doesn't belong to user
    """
    # Verify review belongs to user
    CheckResponse = Db.table("reviews").select("*").eq("id", ReviewId).eq("customer_id", UserId).execute()
    
    if not CheckResponse.data:
        raise NotFoundException(Detail="Review not found")
    
    UpdateData = {}
    
    if ReviewUpdate.rating is not None:
        UpdateData["rating"] = ReviewUpdate.rating
    if ReviewUpdate.comment is not None:
        UpdateData["comment"] = ReviewUpdate.comment
    
    if not UpdateData:
        Review = CheckResponse.data[0]
    else:
        Updated = Db.table("reviews").update(UpdateData).eq("id", ReviewId).execute()
        Review = Updated.data[0]
    
    return ReviewResponse(**Review)


@Router.delete("/{ReviewId}", status_code=status.HTTP_204_NO_CONTENT)
async def DeleteReview(
    ReviewId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Deletes a review.
    
    Args:
        ReviewId: Review UUID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Raises:
        NotFoundException: If review not found or doesn't belong to user
    """
    # Verify review belongs to user
    CheckResponse = Db.table("reviews").select("*").eq("id", ReviewId).eq("customer_id", UserId).execute()
    
    if not CheckResponse.data:
        raise NotFoundException(Detail="Review not found")
    
    Db.table("reviews").delete().eq("id", ReviewId).execute()
