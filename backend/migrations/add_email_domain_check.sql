-- Add email domain validation for customers table
-- Only allow emails ending with @kiit.ac.in or @kims.ac.in

-- Add CHECK constraint to ensure email ends with allowed domains
ALTER TABLE customers 
ADD CONSTRAINT email_domain_check 
CHECK (
    email ILIKE '%@kiit.ac.in' OR 
    email ILIKE '%@kims.ac.in'
);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT email_domain_check ON customers IS 
'Ensures email addresses are from allowed domains: kiit.ac.in, kims.ac.in';
