-- Migration: Add auto_rejected status to customer_orders table
-- Date: 2025-12-17
-- Description: Adds 'auto_rejected' as a valid order status to support restaurant auto-rejection feature

-- Step 1: Drop the existing status check constraint
ALTER TABLE public.customer_orders 
DROP CONSTRAINT IF EXISTS customer_orders_status_check;

-- Step 2: Add new check constraint with auto_rejected included
ALTER TABLE public.customer_orders 
ADD CONSTRAINT customer_orders_status_check CHECK (
  status = ANY (
    ARRAY[
      'pooling'::text,
      'pending'::text,
      'accepted'::text,
      'rejected'::text,
      'auto_rejected'::text,
      'out_for_delivery'::text,
      'delivered'::text,
      'cancelled'::text
    ]
  )
);

-- Step 3: Add a comment to document the status values
COMMENT ON COLUMN public.customer_orders.status IS 
'Order status: pooling (in cart), pending (sent to restaurant), accepted (restaurant confirmed), rejected (restaurant declined), auto_rejected (no restaurant response), out_for_delivery (driver assigned), delivered (completed), cancelled (customer cancelled)';

-- Verification query: Check if constraint was added successfully
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'customer_orders_status_check';

-- Note: This migration is backward compatible and does not require data migration
-- Existing orders with other statuses remain valid
