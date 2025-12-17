-- ========================================
-- Migration: Add order_group_id to customer_orders
-- Purpose: Group orders created from same cart checkout
-- Date: 2025-12-17
-- ========================================

-- STEP 1: Add order_group_id column to customer_orders table
-- ========================================
ALTER TABLE public.customer_orders 
ADD COLUMN order_group_id UUID NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.customer_orders.order_group_id 
IS 'Groups orders created from same cart checkout. Multiple restaurants = multiple orders with same group_id';

-- ========================================
-- STEP 2: Create index for the new column
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customer_orders_group 
ON public.customer_orders USING btree (order_group_id) 
TABLESPACE pg_default
WHERE (order_group_id IS NOT NULL);

-- ========================================
-- STEP 3: Drop and recreate order_details view
-- ========================================
DROP VIEW IF EXISTS public.order_details;

CREATE VIEW public.order_details AS
SELECT
  o.id AS order_id,
  o.order_group_id,
  o.pool_id,
  p.name AS pool_name,
  p.campus_id,
  c.name AS campus_name,
  c.hotspot_location AS delivery_hotspot,
  o.customer_id,
  cust.full_name AS customer_name,
  cust.phone AS customer_phone,
  cust.email AS customer_email,
  o.delivery_address,
  o.restaurant_id,
  r.name AS restaurant_name,
  r.address AS restaurant_address,
  r.latitude AS restaurant_lat,
  r.longitude AS restaurant_lng,
  r.phone AS restaurant_phone,
  o.items,
  o.subtotal,
  o.delivery_fee,
  o.platform_fee,
  o.taxes,
  o.discount,
  o.total,
  o.promo_code,
  o.special_instructions,
  o.payment_status,
  o.payment_id,
  o.status AS order_status,
  o.synced_to_fleetbase,
  o.cancelled_at,
  o.cancellation_reason,
  o.delivered_at,
  o.driver_name,
  o.driver_phone,
  o.otp,
  p.delivery_window,
  p.fleetbase_pool_id,
  o.created_at AS ordered_at,
  o.updated_at
FROM
  customer_orders o
  JOIN order_pools p ON p.id = o.pool_id
  JOIN campuses c ON c.id = p.campus_id
  JOIN customers cust ON cust.id = o.customer_id
  LEFT JOIN restaurants r ON r.id = o.restaurant_id;

-- ========================================
-- STEP 4: Drop and recreate customer_order_history view
-- ========================================
DROP VIEW IF EXISTS public.customer_order_history;

CREATE VIEW public.customer_order_history AS
SELECT
  o.customer_id,
  o.id AS order_id,
  o.order_group_id,
  o.pool_id,
  p.name AS pool_name,
  o.restaurant_id,
  r.name AS restaurant_name,
  r.image AS restaurant_image,
  o.items,
  o.total,
  o.status,
  o.payment_status,
  o.created_at AS ordered_at,
  o.delivered_at,
  (
    SELECT
      count(*) AS count
    FROM
      jsonb_array_elements(o.items) jsonb_array_elements(value)
  ) AS item_count
FROM
  customer_orders o
  JOIN order_pools p ON p.id = o.pool_id
  LEFT JOIN restaurants r ON r.id = o.restaurant_id
ORDER BY
  o.created_at DESC;

-- ========================================
-- Migration Complete
-- ========================================
-- Backward Compatibility: All existing orders will have order_group_id = NULL
-- They will display individually (no grouping) in the frontend
-- New orders will have the same UUID for all orders from the same checkout
