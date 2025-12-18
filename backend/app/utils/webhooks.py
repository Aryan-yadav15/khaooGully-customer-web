"""
Webhook utilities for sending order notifications to restaurant team.

This module contains functions to process and send cumulative order data
to restaurant partners via WhatsApp webhook integration.
"""

import requests
from collections import defaultdict
from typing import Dict, List, Any, Optional, Tuple
from supabase import Client


def fetch_restaurant_phone(db: Client, restaurant_id: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetch restaurant phone number and name by restaurant_id.
    
    Args:
        db: Supabase client instance
        restaurant_id: UUID of the restaurant
        
    Returns:
        Tuple of (phone, name) or (None, None) if not found
    """
    try:
        response = (
            db.table("restaurants")
            .select("phone, name")
            .eq("id", restaurant_id)
            .single()
            .execute()
        )
        data = response.data

        if not data:
            return None, None

        return data.get("phone"), data.get("name")
    except Exception as e:
        print(f"Error fetching restaurant {restaurant_id}: {e}")
        return None, None


def build_restaurant_cumulative_orders(db_orders: List[Dict[str, Any]]) -> Dict[str, Dict]:
    """
    Group orders by restaurant and compute cumulative items and totals.
    
    Args:
        db_orders: List of order dictionaries from order_details view
        
    Returns:
        Dictionary mapping restaurant_id to cumulative order data:
        {
            "restaurant_id": {
                "items": {"menu_item_id": {"menu_item_id", "name", "quantity"}},
                "subtotal": int (items cost only - what restaurant receives),
                "delivery_fees": int (delivery charges),
                "platform_fees": int (platform charges),
                "total_customer_paid": int (full amount customer paid)
            }
        }
    """
    restaurant_map = defaultdict(
        lambda: {
            "items": defaultdict(
                lambda: {"menu_item_id": "", "name": "", "quantity": 0}
            ),
            "subtotal": 0,
            "delivery_fees": 0,
            "platform_fees": 0,
            "total_customer_paid": 0,
        }
    )

    for order in db_orders:
        restaurant_id = order["restaurant_id"]

        # Track all components separately
        restaurant_map[restaurant_id]["subtotal"] += order.get("subtotal", 0)
        restaurant_map[restaurant_id]["delivery_fees"] += order.get("delivery_fee", 0)
        restaurant_map[restaurant_id]["platform_fees"] += order.get("platform_fee", 0)
        restaurant_map[restaurant_id]["total_customer_paid"] += order.get("total", 0)

        # Process each menu item
        for item in order["items"]:
            item_id = item["menu_item_id"]
            item_name = item["name"]
            qty = item["quantity"]

            if item_id not in restaurant_map[restaurant_id]["items"]:
                restaurant_map[restaurant_id]["items"][item_id] = {
                    "menu_item_id": item_id,
                    "name": item_name,
                    "quantity": 0
                }

            restaurant_map[restaurant_id]["items"][item_id]["quantity"] += qty

    return restaurant_map


def format_rupees(amount_paise: int) -> str:
    """Format an amount in paise as rupees (no currency symbol).

    This is used for outbound webhook payloads (WhatsApp/Railway). Internally we
    store money in paise, but webhook consumers expect rupees.

    Examples:
        40000 -> "400"
        4050 -> "40.5"
    """

    rupees = (amount_paise or 0) / 100
    if float(rupees).is_integer():
        return str(int(rupees))
    return f"{rupees:.2f}".rstrip("0").rstrip(".")


def send_to_webhook(payload: Dict[str, Any], webhook_url: str) -> bool:
    """
    Send cumulative order payload to restaurant WhatsApp webhook.
    
    Args:
        payload: Dictionary containing:
            - restaurantId: Restaurant UUID
            - restaurantName: Restaurant name
            - restaurantPhone: Phone number for WhatsApp
            - cumulativeOrders: List of items with quantities
            - totalOrderValue: Formatted total value string
        webhook_url: URL of the webhook endpoint
        
    Returns:
        True if successful (status 200), False otherwise
    """
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(webhook_url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print(f"✅ Webhook sent to {payload['restaurantName']} ({payload['restaurantPhone']})")
            return True
        else:
            print(f"⚠️ Webhook failed for {payload['restaurantName']}: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⚠️ Webhook timeout for {payload['restaurantName']}")
        return False
    except requests.exceptions.ConnectionError:
        print(f"⚠️ Webhook connection error for {payload['restaurantName']}")
        return False
    except Exception as e:
        print(f"⚠️ Webhook error for {payload['restaurantName']}: {e}")
        return False


def send_orders_to_backend(orders: List[Dict[str, Any]], backend_url: str, api_key: str = "") -> Dict[str, Any]:
    """
    Send individual orders to restaurant team's backend API.
    This populates their fetched_orders table.
    
    Args:
        orders: List of order dictionaries from order_details view
        backend_url: Base URL of restaurant backend
        api_key: Optional API key for authentication
        
    Returns:
        Dictionary with results:
            - success: bool
            - inserted_count: int
            - skipped_count: int
            - error: str (if failed)
    """
    url = f"{backend_url}/api/webhook/receive-orders"
    headers = {
        "Content-Type": "application/json",
    }
    
    if api_key:
        headers["X-API-Key"] = api_key
    
    # Transform orders to match the webhook payload format
    formatted_orders = []
    for order in orders:
        formatted_orders.append({
            "order_id": order.get("order_id") or order.get("id"),  # order_details view uses 'order_id'
            "pool_id": order.get("pool_id"),
            "restaurant_id": order["restaurant_id"],
            "restaurant_phone": order.get("restaurant_phone"),
            "customer_name": order.get("customer_name", "Unknown"),
            "customer_phone": order.get("customer_phone", "N/A"),
            "items": order["items"],
            "total_amount": order["total"],
            "payment_status": order.get("payment_status", ""),
            "order_status": "pending",
            "created_at": order.get("created_at") or order.get("ordered_at"),  # view might use 'ordered_at'
            # New amount breakdown fields (all in paise)
            "subtotal": order.get("subtotal"),
            "delivery_fee": order.get("delivery_fee"),
            "platform_fee": order.get("platform_fee"),
            "total_customer_paid": order.get("total"),
            "amount_to_collect": order.get("subtotal")  # Restaurant receives the subtotal amount
        })
    
    payload = {"orders": formatted_orders}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            inserted = result.get("inserted_count", 0)
            skipped = result.get("skipped_count", 0)
            print(f"✅ Restaurant Backend API: Inserted {inserted}, Skipped {skipped} duplicates")
            return {
                "success": True,
                "inserted_count": inserted,
                "skipped_count": skipped
            }
        else:
            error_msg = f"Status {response.status_code}: {response.text}"
            print(f"⚠️ Restaurant Backend API error: {error_msg}")
            return {
                "success": False,
                "inserted_count": 0,
                "skipped_count": 0,
                "error": error_msg
            }
            
    except requests.exceptions.ConnectionError:
        error_msg = "Backend API not reachable"
        print(f"⚠️ {error_msg}")
        return {
            "success": False,
            "inserted_count": 0,
            "skipped_count": 0,
            "error": error_msg
        }
    except requests.exceptions.Timeout:
        error_msg = "Backend API timeout"
        print(f"⚠️ {error_msg}")
        return {
            "success": False,
            "inserted_count": 0,
            "skipped_count": 0,
            "error": error_msg
        }
    except Exception as e:
        error_msg = str(e)
        print(f"⚠️ Restaurant Backend API error: {error_msg}")
        return {
            "success": False,
            "inserted_count": 0,
            "skipped_count": 0,
            "error": error_msg
        }