"""
Dependency injection utilities for FastAPI routes.

This module provides reusable dependencies for authentication,
database access, and common request validation.
"""

from typing import Optional
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import GetSupabaseClientWithAuth, SupabaseAdminClient
from app.utils.auth import ExtractUserIdFromToken
from app.utils.exceptions import UnauthorizedException

logger = logging.getLogger(__name__)

SecurityScheme = HTTPBearer()


def GetCurrentUserId(
    Credentials: HTTPAuthorizationCredentials = Depends(SecurityScheme)
) -> str:
    """
    Extracts and validates the current user ID from JWT token.
    
    Args:
        Credentials: HTTP bearer token credentials
        
    Returns:
        str: Authenticated user ID
        
    Raises:
        UnauthorizedException: If token is invalid
    """
    Token = Credentials.credentials
    return ExtractUserIdFromToken(Token)


def GetSupabase(
    Credentials: HTTPAuthorizationCredentials = Depends(SecurityScheme)
):
    """
    Provides Supabase client instance with user authentication.
    This client respects RLS policies based on auth.uid().
    
    Args:
        Credentials: HTTP bearer token credentials
        
    Yields:
        Supabase client for database operations with user context
    """
    Token = Credentials.credentials
    yield GetSupabaseClientWithAuth(Token)


def GetSupabaseAdmin():
    """
    Provides Supabase admin client instance.
    WARNING: This bypasses ALL RLS policies. Use only for admin operations.
    
    Yields:
        Supabase admin client with elevated privileges
    """
    yield SupabaseAdminClient


async def GetCurrentUser(
    UserId: str = Depends(GetCurrentUserId),
    Db = Depends(GetSupabaseAdmin)
):
    """
    Retrieves complete customer profile for authenticated user.
    Uses admin client to bypass RLS for reading user data.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase admin client
        
    Returns:
        Dict: Customer profile data
        
    Raises:
        UnauthorizedException: If user not found
    """
    logger.info(f"GetCurrentUser called with UserId: {UserId}")
    Response = Db.table("customers").select("*").eq("id", UserId).single().execute()
    logger.info(f"Customer query response: {Response.data}")
    
    if not Response.data:
        logger.error(f"User not found for ID: {UserId}")
        raise UnauthorizedException(Detail="User not found")
    
    return Response.data


def RequireAdmin(CurrentUser: dict = Depends(GetCurrentUser)) -> dict:
    """
    Validates that current user has admin privileges.
    
    Args:
        CurrentUser: Authenticated user data
        
    Returns:
        Dict: User data if admin
        
    Raises:
        HTTPException: If user is not an admin
    """
    logger.info(f"RequireAdmin checking user: {CurrentUser.get('email')}, is_admin: {CurrentUser.get('is_admin')}")
    IsAdmin = CurrentUser.get("is_admin", False)
    
    if not IsAdmin:
        logger.warning(f"Admin access denied for user: {CurrentUser.get('email')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return CurrentUser
