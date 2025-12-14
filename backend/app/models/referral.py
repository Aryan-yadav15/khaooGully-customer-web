"""
Referral related Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReferralBase(BaseModel):
    """Base referral model."""
    
    referralCode: str = Field(..., min_length=4, max_length=20, validation_alias="referral_code")

    class Config:
        populate_by_name = True


class ReferralCreate(BaseModel):
    """Model for creating a referral (using a referral code)."""
    
    referralCode: str = Field(..., min_length=4, max_length=20, validation_alias="referral_code")

    class Config:
        populate_by_name = True


class ReferralResponse(BaseModel):
    """Model for referral response."""
    
    id: str
    referrerId: str = Field(validation_alias="referrer_id")
    referralCode: str = Field(validation_alias="referral_code")
    refereeId: Optional[str] = Field(None, validation_alias="referee_id")
    referrerReward: int = Field(validation_alias="referrer_reward")
    refereeReward: int = Field(validation_alias="referee_reward")
    status: str
    completedAt: Optional[datetime] = Field(None, validation_alias="completed_at")
    createdAt: datetime = Field(validation_alias="created_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ReferralStatsResponse(BaseModel):
    """Model for referral statistics."""
    
    totalReferrals: int
    pendingReferrals: int
    completedReferrals: int
    totalRewards: int
    referralCode: str

    class Config:
        populate_by_name = True
