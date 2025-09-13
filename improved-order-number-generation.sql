-- Improved Order Number Generation with Better Concurrency Handling
-- Run this in Supabase SQL editor to fix the duplicate order number issue

-- 1. First, let's see what order numbers currently exist
SELECT order_number, COUNT(*) as count
FROM purchase_orders 
WHERE order_number IS NOT NULL
GROUP BY order_number
HAVING COUNT(*) > 1;

-- 2. Drop existing functions and triggers
DROP TRIGGER IF EXISTS purchase_orders_set_order_number ON purchase_orders;
DROP TRIGGER IF EXISTS purchase_orders_update_timestamp ON purchase_orders;
DROP FUNCTION IF EXISTS set_purchase_order_number();
DROP FUNCTION IF EXISTS generate_purchase_order_number();

-- 3. Create an improved order number generation function with advisory locking
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_order_number TEXT;
    lock_key BIGINT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    lock_key := ('x' || RIGHT(MD5('purchase_order_' || year_suffix), 8))::BIT(32)::BIGINT;
    
    -- Use advisory lock to prevent concurrent number generation
    PERFORM pg_advisory_lock(lock_key);
    
    BEGIN
        -- Get the next order number for this year
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(po.order_number FROM 'PO-' || year_suffix || '-(\d+)') AS INTEGER)
        ), 0) + 1
        INTO next_number
        FROM purchase_orders po
        WHERE po.order_number LIKE 'PO-' || year_suffix || '-%';
        
        new_order_number := 'PO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
        
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(lock_key);
        
        RETURN new_order_number;
    EXCEPTION WHEN OTHERS THEN
        -- Make sure to release lock even on error
        PERFORM pg_advisory_unlock(lock_key);
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger function
CREATE OR REPLACE FUNCTION set_purchase_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set order number if it's not already provided
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_purchase_order_number();
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger for INSERT operations
CREATE TRIGGER purchase_orders_set_order_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_purchase_order_number();

-- 6. Create the trigger for UPDATE operations (timestamp only)
CREATE OR REPLACE FUNCTION update_purchase_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_orders_update_timestamp
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_timestamp();

-- 7. Clean up any existing duplicate order numbers
UPDATE purchase_orders 
SET order_number = generate_purchase_order_number()
WHERE id IN (
    SELECT po.id
    FROM purchase_orders po
    WHERE EXISTS (
        SELECT 1 
        FROM purchase_orders po2 
        WHERE po2.order_number = po.order_number 
        AND po2.id < po.id
    )
);

-- 8. Test the function
SELECT generate_purchase_order_number() as test_order_number;

-- 9. Verify all order numbers are now unique
SELECT 
    'Fix completed!' as status,
    COUNT(*) as total_orders,
    COUNT(DISTINCT order_number) as unique_order_numbers,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT order_number) THEN 'All unique ✓'
        ELSE 'Still duplicates ✗'
    END as validation
FROM purchase_orders 
WHERE order_number IS NOT NULL;

-- 10. Show recent order numbers to verify pattern
SELECT order_number, created_at 
FROM purchase_orders 
WHERE order_number IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;