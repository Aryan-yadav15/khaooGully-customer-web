"""
API Endpoints Quick Reference

This document provides a quick reference for all available API endpoints
in the KhaoGully backend.

## Base URL
Development: http://localhost:8000
Production: [Your production URL]

## Authentication
Most endpoints require authentication via Bearer token in Authorization header:
Authorization: Bearer <your-jwt-token>

## Endpoints

### Health Check
- GET  /                - Basic health check
- GET  /health          - Detailed health check

### Campuses
- GET  /campuses        - List all active campuses
- GET  /campuses/{id}   - Get specific campus details

### Restaurants & Menu
- GET  /restaurants              - List restaurants
- GET  /restaurants/{id}         - Get restaurant details
- GET  /restaurants/{id}/menu    - Get restaurant menu
- GET  /dishes/{id}              - Get dish details

### Order Pools
- GET  /pools                    - List active pools
- GET  /pools/{id}               - Get pool details
- GET  /pools/{id}/stats         - Get pool statistics
- GET  /pools/{id}/restaurants   - Get restaurants in pool

### Cart (Authenticated)
- POST   /cart/items             - Add item to cart
- GET    /cart                   - Get current cart
- PUT    /cart/items/{id}        - Update cart item quantity
- DELETE /cart/items/{id}        - Remove item from cart
- DELETE /cart                   - Clear entire cart

### Orders (Authenticated)
- POST   /orders                 - Create order from cart
- GET    /orders                 - Get order history
- GET    /orders/{id}            - Get order details
- PATCH  /orders/{id}/status     - Update order status (cancel)

### Customer Profile (Authenticated)
- GET    /profile                - Get profile summary
- PUT    /profile                - Update profile
- GET    /profile/addresses      - List saved addresses
- POST   /profile/addresses      - Add new address
- PUT    /profile/addresses/{id} - Update address
- DELETE /profile/addresses/{id} - Delete address

### Reviews (Authenticated)
- POST   /reviews                - Create review
- GET    /reviews                - List reviews
- PUT    /reviews/{id}           - Update review
- DELETE /reviews/{id}           - Delete review

### Admin (Authenticated + Admin Role)
- POST   /admin/campuses         - Create campus
- PUT    /admin/campuses/{id}    - Update campus
- POST   /admin/restaurants      - Create restaurant
- POST   /admin/dishes           - Create dish
- PUT    /admin/dishes/{id}      - Update dish
- POST   /admin/pools            - Create pool
- PUT    /admin/pools/{id}       - Update pool

## Response Format

### Success Response
{
  "data": {...},
  "status": 200
}

### Error Response
{
  "error": true,
  "message": "Error description",
  "status_code": 400
}

### Validation Error
{
  "error": true,
  "message": "Validation error",
  "details": [
    {
      "field": "fieldName",
      "message": "Error message",
      "type": "error_type"
    }
  ]
}

## Common Status Codes
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Interactive Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
