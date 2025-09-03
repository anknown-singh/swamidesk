-- Quick fix for medicines RLS issue
-- Run this in Supabase SQL Editor to allow access to medicines

-- Option 1: Temporarily disable RLS on medicines table (for development/testing)
ALTER TABLE medicines DISABLE ROW LEVEL SECURITY;

-- Option 2: Or replace restrictive policies with more permissive ones
-- (Comment out Option 1 above and use this instead)

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "medicines_select_policy" ON medicines;
DROP POLICY IF EXISTS "medicines_insert_policy" ON medicines;  
DROP POLICY IF EXISTS "medicines_update_policy" ON medicines;

-- Create more permissive policies
CREATE POLICY "medicines_select_policy" ON medicines
    FOR SELECT USING (true);

CREATE POLICY "medicines_insert_policy" ON medicines
    FOR INSERT WITH CHECK (true);

CREATE POLICY "medicines_update_policy" ON medicines
    FOR UPDATE USING (true);
*/

-- Test query to verify access
SELECT 'Medicines RLS disabled - should now be accessible' as status;
SELECT COUNT(*) as medicine_count FROM medicines;