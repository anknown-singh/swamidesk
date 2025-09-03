-- Debug Purchase Order Issue
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if suppliers table exists and has data
SELECT 'Suppliers Table Check' as check_type, COUNT(*) as count FROM suppliers;

-- 2. Check purchase_orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS policies on purchase_orders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'purchase_orders';

-- 4. Try a simple insert to see what fails
INSERT INTO purchase_orders (
    supplier_name, 
    supplier_contact, 
    supplier_address, 
    expected_delivery_date,
    notes,
    subtotal,
    gst_amount,
    discount_amount,
    total_amount,
    status
) VALUES (
    'Test Supplier',
    null,
    'Test Address',
    '2025-08-30',
    null,
    10000,
    1800,
    0,
    11800,
    'pending'
);

-- 5. If the insert worked, clean it up
DELETE FROM purchase_orders WHERE supplier_name = 'Test Supplier';

-- 6. Check if order number generation function exists
SELECT proname FROM pg_proc WHERE proname = 'generate_purchase_order_number';