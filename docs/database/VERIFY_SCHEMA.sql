-- Verify current database schema after migration
-- Run this in Supabase SQL Editor to confirm the schema is correct

-- Check if users table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_profiles table still exists (should NOT exist)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
) as user_profiles_table_exists;

-- Check user_role enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

-- Check sample user data
SELECT 
    id, 
    email, 
    role, 
    full_name, 
    is_active 
FROM users 
WHERE is_active = true 
LIMIT 5;

-- Verify RLS policies are in place
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';