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
                "total_value": int
            }
        }
    """
    restaurant_map = defaultdict(
        lambda: {
            "items": defaultdict(
                lambda: {"menu_item_id": "", "name": "", "quantity": 0}
            ),
            "total_value": 0,
        }
    )

    for order in db_orders:
        restaurant_id = order["restaurant_id"]

        # Add this order's total value
        restaurant_map[restaurant_id]["total_value"] += order["total"]

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


def format_rupees(amount: int) -> str:
    """
    Format amount with comma separators (no currency symbol).
    
    Args:
        amount: Integer amount in paise (smallest currency unit)
        
    Returns:
        Formatted string like "58,000"
    """
    return f"{amount:,.0f}"


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
