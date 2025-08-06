-- DEBUG USERS TABLE
-- Check if users were properly created and troubleshoot login issues

-- Step 1: Check if users table exists and has data
SELECT 'Users table check' as test;
SELECT COUNT(*) as total_users FROM users;

-- Step 2: List all users with key fields
SELECT 'All users in database' as test;
SELECT email, role, full_name, is_active, created_at FROM users ORDER BY email;

-- Step 3: Check specific admin user
SELECT 'Admin user check' as test;
SELECT email, role, full_name, is_active, length(password_hash) as hash_length 
FROM users 
WHERE email = 'admin@swamicare.com';

-- Step 4: Test the exact login query
SELECT 'Login query test' as test;
SELECT id, email, role, full_name, password_hash, is_active
FROM users 
WHERE email = 'admin@swamicare.com' 
AND is_active = true;

-- Step 5: Check for case sensitivity issues
SELECT 'Case sensitivity check' as test;
SELECT email, role, is_active 
FROM users 
WHERE LOWER(email) = LOWER('admin@swamicare.com');

-- Step 6: Check if there are any NULL values causing issues
SELECT 'NULL values check' as test;
SELECT 
    email,
    role,
    is_active,
    CASE WHEN email IS NULL THEN 'NULL EMAIL' ELSE 'OK' END as email_status,
    CASE WHEN password_hash IS NULL THEN 'NULL PASSWORD' ELSE 'OK' END as password_status,
    CASE WHEN is_active IS NULL THEN 'NULL ACTIVE' ELSE 'OK' END as active_status
FROM users;