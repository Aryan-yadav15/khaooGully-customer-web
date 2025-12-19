-- Add closed_at timestamp to order_pools table
-- This tracks the actual time when the pool was closed and orders were sent to restaurants

ALTER TABLE order_pools
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN order_pools.closed_at IS 'Timestamp when the pool was actually closed and orders were dispatched to restaurants. NULL for pools that are still open or were created before this feature.';

-- Update order_details view to include pool_closed_at
-- This makes the timestamp visible in the API responses
-- Drop and recreate to add new column in the middle
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
  p.closed_at AS pool_closed_at,
  o.created_at AS ordered_at,
  o.updated_at
FROM
  customer_orders o
  JOIN order_pools p ON p.id = o.pool_id
  JOIN campuses c ON c.id = p.campus_id
  JOIN customers cust ON cust.id = o.customer_id
  LEFT JOIN restaurants r ON r.id = o.restaurant_id;
