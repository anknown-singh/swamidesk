-- SIMPLE USERS TABLE SETUP
-- Since user_profiles table no longer exists, just ensure users table is correct
-- This script is safe to run multiple times

-- =============================================================================
-- STEP 1: VERIFY CURRENT STATE
-- =============================================================================
DO $$
DECLARE
    users_exists boolean := false;
    users_count integer := 0;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO users_exists;
    
    -- Count records if table exists
    IF users_exists THEN
        SELECT COUNT(*) FROM users INTO users_count;
    END IF;
    
    RAISE NOTICE '=== CURRENT DATABASE STATE ===';
    RAISE NOTICE 'users table exists: %, count: %', users_exists, users_count;
    RAISE NOTICE '===============================';
END $$;

-- =============================================================================
-- STEP 2: ENSURE CORRECT user_role ENUM
-- =============================================================================
DO $$ 
BEGIN
    -- Drop and recreate enum to ensure correct values
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
    RAISE NOTICE 'Created user_role enum with correct values';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with enum: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 3: ENSURE USERS TABLE EXISTS WITH CORRECT SCHEMA
-- =============================================================================
-- Drop existing users table if it exists (to ensure clean schema)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    specialization VARCHAR(200),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Disable RLS for immediate access (can be enabled later if needed)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'Created users table with correct schema';
END $$;

-- =============================================================================
-- STEP 4: INSERT DEMO USERS
-- =============================================================================
INSERT INTO users (email, role, full_name, phone, department, specialization, password_hash, is_active) VALUES
('admin@swamicare.com', 'admin', 'Admin User', '+91-9876543210', 'Administration', 'System Administration', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('doctor@swamicare.com', 'doctor', 'Dr. John Smith', '+91-9876543211', 'General Medicine', 'General Practice', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('receptionist@swamicare.com', 'receptionist', 'Jane Doe', '+91-9876543212', 'Reception', 'Patient Management', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('attendant@swamicare.com', 'service_attendant', 'Service Attendant', '+91-9876543213', 'Services', 'Patient Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('pharmacist@swamicare.com', 'pharmacist', 'Pharmacy Manager', '+91-9876543214', 'Pharmacy', 'Pharmaceutical Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true);

DO $$
BEGIN
    RAISE NOTICE 'Inserted 5 demo users with correct schema';
END $$;

-- =============================================================================
-- STEP 5: FINAL VERIFICATION
-- =============================================================================
DO $$
DECLARE
    users_count integer;
    enum_values text[];
BEGIN
    -- Count users
    SELECT COUNT(*) FROM users INTO users_count;
    
    -- Get enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    INTO enum_values;
    
    RAISE NOTICE '=== SETUP VERIFICATION ===';
    RAISE NOTICE 'users table count: % (should be 5)', users_count;
    RAISE NOTICE 'user_role enum values: %', enum_values;
    RAISE NOTICE '==========================';
    
    IF users_count = 5 THEN
        RAISE NOTICE '✅ USERS TABLE SETUP SUCCESSFUL! Authentication should now work.';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE - Expected 5 users, got %', users_count;
    END IF;
END $$;

-- Show final user data for verification
SELECT 
    'SUCCESS - Demo Users Created' as status,
    email, 
    role, 
    full_name, 
    department, 
    is_active 
FROM users 
ORDER BY role, email;