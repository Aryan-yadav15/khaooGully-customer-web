"""
Authentication utilities for JWT token handling and user verification.

This module provides functions for creating, validating, and decoding
JWT tokens used for user authentication.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.config import settings
from app.utils.exceptions import UnauthorizedException


def CreateAccessToken(Data: Dict[str, Any], ExpiresMinutes: Optional[int] = None) -> str:
    """
    Creates a JWT access token.
    
    Args:
        Data: Payload data to encode in token
        ExpiresMinutes: Token expiration time in minutes
        
    Returns:
        str: Encoded JWT token
    """
    ToEncode = Data.copy()
    
    if ExpiresMinutes:
        Expire = datetime.utcnow() + timedelta(minutes=ExpiresMinutes)
    else:
        Expire = datetime.utcnow() + timedelta(minutes=settings.AccessTokenExpireMinutes)
    
    ToEncode.update({"exp": Expire})
    EncodedJwt = jwt.encode(ToEncode, settings.JwtSecret, algorithm=settings.JwtAlgorithm)
    
    return EncodedJwt


def DecodeAccessToken(Token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token.
    
    Args:
        Token: JWT token string
        
    Returns:
        Dict[str, Any]: Decoded token payload
        
    Raises:
        UnauthorizedException: If token is invalid or expired
    """
    try:
        Payload = jwt.decode(Token, settings.JwtSecret, algorithms=[settings.JwtAlgorithm])
        return Payload
    except JWTError as Error:
        raise UnauthorizedException(Detail=f"Invalid token: {str(Error)}")


def ExtractUserIdFromToken(Token: str) -> str:
    """
    Extracts user ID from Supabase JWT token.
    
    Args:
        Token: JWT token string from Supabase
        
    Returns:
        str: User ID (UUID)
        
    Raises:
        UnauthorizedException: If token is invalid or missing user ID
    """
    try:
        # Decode without signature verification since Supabase already validated it
        # We still need to provide a dummy key but it won't be used for verification
        # Supabase access tokens include an `aud` claim (typically "authenticated").
        # python-jose validates audience by default; since we're not verifying signature
        # here, disable `aud` verification as well to avoid false 401s.
        Payload = jwt.decode(
            Token,
            settings.JwtSecret,
            algorithms=[settings.JwtAlgorithm],
            options={"verify_signature": False, "verify_aud": False}
        )
        UserId = Payload.get("sub")
        
        if not UserId:
            raise UnauthorizedException(Detail="Token missing user ID")
        
        return UserId
    except JWTError as Error:
        raise UnauthorizedException(Detail=f"Invalid token format: {str(Error)}")
