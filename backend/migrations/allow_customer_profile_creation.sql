-- Allow authenticated users to create their own customer profile
-- This is needed for new signups to create their profile record

CREATE POLICY "Customers can create own profile"
ON public.customers
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);
