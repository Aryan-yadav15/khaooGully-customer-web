"""
Referral API routes for managing customer referrals.
"""

from fastapi import APIRouter, Depends, status
from typing import List
from supabase import Client
from app.dependencies import GetSupabase, GetCurrentUserId
from app.models.referral import (
    ReferralResponse,
    ReferralStatsResponse
)
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException
)


Router = APIRouter(prefix="/referrals", tags=["Referrals"])


@Router.get("/my-stats", response_model=ReferralStatsResponse)
async def GetMyReferralStats(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves referral statistics for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        ReferralStatsResponse: Referral statistics
    """
    # Get customer's referral code
    CustomerResponse = Db.table("customers").select("referral_code").eq("id", UserId).single().execute()
    
    if not CustomerResponse.data:
        raise NotFoundException(Detail="Customer not found")
    
    ReferralCode = CustomerResponse.data.get("referral_code")
    
    if not ReferralCode:
        raise BadRequestException(Detail="No referral code found for this customer")
    
    # Get all referrals
    ReferralsResponse = Db.table("referrals").select("*").eq("referrer_id", UserId).execute()
    
    Referrals = ReferralsResponse.data
    TotalReferrals = len(Referrals)
    PendingReferrals = len([r for r in Referrals if r["status"] == "pending"])
    CompletedReferrals = len([r for r in Referrals if r["status"] == "completed"])
    TotalRewards = sum(r.get("referrer_reward", 0) for r in Referrals if r["status"] == "completed")
    
    return ReferralStatsResponse(
        totalReferrals=TotalReferrals,
        pendingReferrals=PendingReferrals,
        completedReferrals=CompletedReferrals,
        totalRewards=TotalRewards,
        referralCode=ReferralCode
    )


@Router.get("/my-referrals", response_model=List[ReferralResponse])
async def GetMyReferrals(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves all referrals made by the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[ReferralResponse]: List of referrals
    """
    Response = Db.table("referrals").select("*").eq("referrer_id", UserId).order("created_at", desc=True).execute()
    
    return [ReferralResponse(**Item) for Item in Response.data]
