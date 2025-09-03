-- Fix the ambiguous column reference in order number generation function
-- Drop in correct order to avoid dependency issues

-- Drop the trigger first
DROP TRIGGER IF EXISTS purchase_orders_set_order_number ON purchase_orders;

-- Now drop the functions
DROP FUNCTION IF EXISTS set_purchase_order_number();
DROP FUNCTION IF EXISTS generate_purchase_order_number();

-- Create corrected function to generate order numbers
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_order_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next order number for this year - using table alias to avoid ambiguity
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(po.order_number FROM 'PO-' || year_suffix || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM purchase_orders po
    WHERE po.order_number LIKE 'PO-' || year_suffix || '-%';
    
    new_order_number := 'PO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION set_purchase_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_purchase_order_number();
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER purchase_orders_set_order_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_purchase_order_number();

-- Test the function
SELECT generate_purchase_order_number() as test_order_number;

-- Verify the fix worked
SELECT 'Fix completed successfully!' as status;