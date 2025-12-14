-- Fix RLS INSERT policies to include proper qualification checks
-- This prevents users from impersonating other users when creating records

-- Fix customer_addresses INSERT policy
DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
CREATE POLICY "Customers can insert own addresses"
ON customer_addresses
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Fix reviews INSERT policy
DROP POLICY IF EXISTS "Customers can create own reviews" ON reviews;
CREATE POLICY "Customers can create own reviews"
ON reviews
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Fix customer_orders INSERT policy
DROP POLICY IF EXISTS "Customers can create orders" ON customer_orders;
CREATE POLICY "Customers can create orders"
ON customer_orders
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Fix support_tickets INSERT policy
DROP POLICY IF EXISTS "Customers can create tickets" ON support_tickets;
CREATE POLICY "Customers can create tickets"
ON support_tickets
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Fix support_messages INSERT policy
DROP POLICY IF EXISTS "Customers can send messages" ON support_messages;
CREATE POLICY "Customers can send messages"
ON support_messages
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets
        WHERE support_tickets.id = support_messages.ticket_id
        AND support_tickets.customer_id = auth.uid()
    )
);

-- Fix search_history INSERT policy
DROP POLICY IF EXISTS "Customers can add search history" ON search_history;
CREATE POLICY "Customers can add search history"
ON search_history
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Fix restaurant_views INSERT policy
DROP POLICY IF EXISTS "Customers can add restaurant views" ON restaurant_views;
CREATE POLICY "Customers can add restaurant views"
ON restaurant_views
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);

-- Add missing RLS policies for tables without policies

-- Enable RLS on all tables that need it
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;

-- Promo codes policies (public can view active codes, only admins can manage)
CREATE POLICY "Anyone can view active promo codes"
ON promo_codes
FOR SELECT
TO public
USING (is_active = true);

-- Promo code usage policies (customers can view own usage, system can insert)
CREATE POLICY "Customers can view own promo code usage"
ON promo_code_usage
FOR SELECT
TO public
USING (auth.uid() = customer_id);

-- Referrals policies
CREATE POLICY "Customers can view own referrals"
ON referrals
FOR SELECT
TO public
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Refunds policies
CREATE POLICY "Customers can view own refunds"
ON refunds
FOR SELECT
TO public
USING (auth.uid() = customer_id);

-- Restaurant hours policies (anyone can view)
CREATE POLICY "Anyone can view restaurant hours"
ON restaurant_hours
FOR SELECT
TO public
USING (true);

-- Add admin policies (requires is_admin column or custom claims - implement based on your auth setup)
-- For now, we'll use service role key for admin operations

-- Note: To properly implement admin policies, you need to:
-- 1. Add is_admin column to customers table, OR
-- 2. Use Supabase custom claims in JWT tokens
-- 3. Create admin-specific policies using those claims

-- Example admin policy structure (uncomment and adjust based on your setup):
-- CREATE POLICY "Admins can manage promo codes"
-- ON promo_codes
-- FOR ALL
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM customers
--         WHERE customers.id = auth.uid()
--         AND customers.is_admin = true
--     )
-- );
