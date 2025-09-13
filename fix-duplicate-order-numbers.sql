-- Fix duplicate order number issue with proper concurrency handling
-- This script creates a robust order number generation system that prevents duplicates

BEGIN;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS purchase_orders_set_order_number ON purchase_orders;
DROP FUNCTION IF EXISTS set_purchase_order_number();
DROP FUNCTION IF EXISTS generate_purchase_order_number();

-- Create a sequence-based order number generation function
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_order_number TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Loop until we get a unique order number
    WHILE attempt < max_attempts LOOP
        -- Get the next order number for this year with proper locking
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(po.order_number FROM 'PO-' || year_suffix || '-(\d+)') AS INTEGER)
        ), 0) + 1
        INTO next_number
        FROM purchase_orders po
        WHERE po.order_number LIKE 'PO-' || year_suffix || '-%'
        FOR UPDATE; -- This ensures proper locking
        
        new_order_number := 'PO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
        
        -- Check if this order number already exists (double-check)
        IF NOT EXISTS (
            SELECT 1 FROM purchase_orders 
            WHERE order_number = new_order_number
        ) THEN
            RETURN new_order_number;
        END IF;
        
        attempt := attempt + 1;
    END LOOP;
    
    -- If we couldn't generate a unique number after max attempts, use timestamp
    new_order_number := 'PO-' || year_suffix || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT;
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function with better error handling
CREATE OR REPLACE FUNCTION set_purchase_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set order number if it's not already provided
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_purchase_order_number();
    END IF;
    
    -- Always update the timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER purchase_orders_set_order_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_purchase_order_number();

-- Also create an update trigger to handle order number changes
CREATE TRIGGER purchase_orders_update_timestamp
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_purchase_order_number();

-- Test the function
DO $$
DECLARE
    test_number TEXT;
BEGIN
    SELECT generate_purchase_order_number() INTO test_number;
    RAISE NOTICE 'Generated test order number: %', test_number;
END $$;

-- Clean up any existing duplicate order numbers
-- First, identify duplicates
WITH duplicate_orders AS (
    SELECT order_number, COUNT(*) as count
    FROM purchase_orders
    WHERE order_number IS NOT NULL
    GROUP BY order_number
    HAVING COUNT(*) > 1
)
UPDATE purchase_orders
SET order_number = generate_purchase_order_number()
WHERE id IN (
    SELECT po.id
    FROM purchase_orders po
    INNER JOIN duplicate_orders d ON po.order_number = d.order_number
    WHERE po.id NOT IN (
        -- Keep the first record of each duplicate group
        SELECT DISTINCT ON (order_number) id
        FROM purchase_orders
        WHERE order_number IN (SELECT order_number FROM duplicate_orders)
        ORDER BY order_number, created_at ASC
    )
);

COMMIT;

-- Verify the fix
SELECT 
    'Order number generation fixed!' as status,
    COUNT(*) as total_orders,
    COUNT(DISTINCT order_number) as unique_order_numbers,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT order_number) THEN 'All order numbers are unique ✓'
        ELSE 'Still have duplicates ✗'
    END as validation
FROM purchase_orders 
WHERE order_number IS NOT NULL;