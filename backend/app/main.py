"""
KhaoGully FastAPI Application - Main Entry Point

This is the core FastAPI application that orchestrates all routes,
middleware, and configurations for the KhaoGully food delivery pooling platform.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.utils.exceptions import KhaoGullyException
from app.routers import (
    campuses,
    restaurants,
    pools,
    cart,
    orders,
    customers,
    reviews,
    admin,
    promo_codes,
    referrals,
    wallet,
    support,
    notifications
)


# Create FastAPI application instance
App = FastAPI(
    title=settings.AppName,
    version=settings.AppVersion,
    description="Food delivery pooling platform API for campus environments",
    docs_url="/docs",
    redoc_url="/redoc"
)


# CORS Middleware Configuration
App.add_middleware(
    CORSMiddleware,
    allow_origins=settings.AllowedOrigins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@App.exception_handler(KhaoGullyException)
async def KhaoGullyExceptionHandler(Request: Request, Exc: KhaoGullyException):
    """
    Handles custom KhaoGully exceptions.
    
    Args:
        Request: FastAPI request object
        Exc: Custom exception instance
        
    Returns:
        JSONResponse: Error response
    """
    return JSONResponse(
        status_code=Exc.status_code,
        content={
            "error": True,
            "message": Exc.detail,
            "status_code": Exc.status_code
        }
    )


@App.exception_handler(RequestValidationError)
async def ValidationExceptionHandler(Request: Request, Exc: RequestValidationError):
    """
    Handles Pydantic validation errors.
    
    Args:
        Request: FastAPI request object
        Exc: Validation error instance
        
    Returns:
        JSONResponse: Validation error response
    """
    # Helpful debug logging for 422s (body parsing/validation happens before route handler).
    # `Exc.body` is provided by FastAPI for RequestValidationError.
    try:
        print("❌ Validation error:")
        print(Exc.errors())
        print("Request body:")
        print(getattr(Exc, "body", None))
    except Exception:
        # Never let logging break error handling.
        pass

    Errors = []
    for Error in Exc.errors():
        Errors.append({
            "field": ".".join(str(loc) for loc in Error["loc"]),
            "message": Error["msg"],
            "type": Error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": Errors
        }
    )


@App.exception_handler(Exception)
async def GeneralExceptionHandler(Request: Request, Exc: Exception):
    """
    Handles unexpected errors.
    
    Args:
        Request: FastAPI request object
        Exc: Exception instance
        
    Returns:
        JSONResponse: Generic error response
    """
    if settings.Debug:
        # In debug mode, return detailed error
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": "Internal server error",
                "detail": str(Exc),
                "type": type(Exc).__name__
            }
        )
    else:
        # In production, hide error details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": "Internal server error"
            }
        )


# API Routes
App.include_router(campuses.Router)
App.include_router(restaurants.Router)
App.include_router(pools.Router)
App.include_router(cart.Router)
App.include_router(orders.Router)
App.include_router(customers.Router)
App.include_router(reviews.Router)
App.include_router(admin.Router)
App.include_router(promo_codes.Router)
App.include_router(referrals.Router)
App.include_router(wallet.Router)
App.include_router(support.Router)
App.include_router(notifications.Router)


# Health Check Endpoint
@App.get("/", tags=["Health"])
async def HealthCheck():
    """
    Health check endpoint to verify API is running.
    
    Returns:
        dict: API status information
    """
    return {
        "status": "healthy",
        "service": settings.AppName,
        "version": settings.AppVersion,
        "environment": settings.Environment
    }


@App.get("/health", tags=["Health"])
async def DetailedHealthCheck():
    """
    Detailed health check with system information.
    
    Returns:
        dict: Detailed system health information
    """
    return {
        "status": "healthy",
        "service": settings.AppName,
        "version": settings.AppVersion,
        "environment": settings.Environment,
        "debug_mode": settings.Debug,
        "database": "Supabase PostgreSQL",
        "features": {
            "authentication": True,
            "cart_management": True,
            "order_pooling": True,
            "multi_restaurant_ordering": True,
            "reviews": True,
            "admin_panel": True
        }
    }


# Application Events
@App.on_event("startup")
async def Startup():
    """
    Executes on application startup.
    Performs initialization tasks.
    """
    print(f"🚀 {settings.AppName} v{settings.AppVersion} starting...")
    print(f"📍 Environment: {settings.Environment}")
    print(f"🔧 Debug mode: {settings.Debug}")
    print(f"🌐 CORS origins: {', '.join(settings.AllowedOrigins)}")
    print("✅ Application started successfully")


@App.on_event("shutdown")
async def Shutdown():
    """
    Executes on application shutdown.
    Performs cleanup tasks.
    """
    print(f"👋 {settings.AppName} shutting down...")
    print("✅ Cleanup completed")
