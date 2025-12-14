"""
Custom exceptions for KhaoGully API.

This module defines all custom exception classes used throughout
the application for consistent error handling.
"""

from fastapi import HTTPException, status


class KhaoGullyException(HTTPException):
    """Base exception for all KhaoGully-specific errors."""
    
    def __init__(self, StatusCode: int, Detail: str):
        super().__init__(status_code=StatusCode, detail=Detail)


class NotFoundException(KhaoGullyException):
    """Raised when a requested resource is not found."""
    
    def __init__(self, Detail: str = "Resource not found"):
        super().__init__(StatusCode=status.HTTP_404_NOT_FOUND, Detail=Detail)


class UnauthorizedException(KhaoGullyException):
    """Raised when authentication fails or is required."""
    
    def __init__(self, Detail: str = "Unauthorized"):
        super().__init__(StatusCode=status.HTTP_401_UNAUTHORIZED, Detail=Detail)


class ForbiddenException(KhaoGullyException):
    """Raised when user lacks permission for an action."""
    
    def __init__(self, Detail: str = "Forbidden"):
        super().__init__(StatusCode=status.HTTP_403_FORBIDDEN, Detail=Detail)


class BadRequestException(KhaoGullyException):
    """Raised for invalid request data or business logic violations."""
    
    def __init__(self, Detail: str = "Bad request"):
        super().__init__(StatusCode=status.HTTP_400_BAD_REQUEST, Detail=Detail)


class ConflictException(KhaoGullyException):
    """Raised when a resource conflict occurs."""
    
    def __init__(self, Detail: str = "Resource conflict"):
        super().__init__(StatusCode=status.HTTP_409_CONFLICT, Detail=Detail)
