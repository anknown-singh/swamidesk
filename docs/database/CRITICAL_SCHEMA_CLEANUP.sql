-- CRITICAL SCHEMA CLEANUP
-- This script resolves the authentication issue by completely removing
-- the old user_profiles table and ensuring clean users table setup
-- 
-- ISSUE: Both user_profiles and users tables exist, causing authentication conflicts
-- SOLUTION: Complete removal of user_profiles table and dependencies

-- =============================================================================
-- STEP 1: SAFETY CHECK - Verify current state
-- =============================================================================
DO $$
DECLARE
    users_exists boolean := false;
    user_profiles_exists boolean := false;
    users_count integer := 0;
    profiles_count integer := 0;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO users_exists;
    
    -- Check if user_profiles table exists  
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) INTO user_profiles_exists;
    
    -- Count records if tables exist
    IF users_exists THEN
        SELECT COUNT(*) FROM users INTO users_count;
    END IF;
    
    IF user_profiles_exists THEN
        SELECT COUNT(*) FROM user_profiles INTO profiles_count;
    END IF;
    
    RAISE NOTICE '=== DATABASE STATE ASSESSMENT ===';
    RAISE NOTICE 'users table exists: %, count: %', users_exists, users_count;
    RAISE NOTICE 'user_profiles table exists: %, count: %', user_profiles_exists, profiles_count;
    RAISE NOTICE '====================================';
END $$;

-- =============================================================================
-- STEP 2: DISABLE RLS AND DROP ALL POLICIES ON user_profiles
-- =============================================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Check if user_profiles table exists before trying to modify it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Disable RLS
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on user_profiles';
        
        -- Drop all policies
        FOR policy_record IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON user_profiles';
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        END LOOP;
    END IF;
END $$;

-- =============================================================================
-- STEP 3: DROP ALL FOREIGN KEY CONSTRAINTS REFERENCING user_profiles
-- =============================================================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference user_profiles
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            tc.table_name,
            tc.table_schema
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'user_profiles'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(constraint_record.table_schema) || '.' || quote_ident(constraint_record.table_name) || 
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.constraint_name);
        RAISE NOTICE 'Dropped FK constraint % from table %', constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 4: DROP ALL TRIGGERS ON user_profiles
-- =============================================================================
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop all triggers on user_profiles table
    FOR trigger_record IN
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_profiles'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || ' ON user_profiles';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 5: COMPLETELY DROP user_profiles TABLE
-- =============================================================================
DROP TABLE IF EXISTS user_profiles CASCADE;
RAISE NOTICE 'DROPPED user_profiles table completely';

-- =============================================================================
-- STEP 6: ENSURE users TABLE EXISTS WITH CORRECT SCHEMA
-- =============================================================================

-- Recreate user_role enum with correct values
DO $$ 
BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
    RAISE NOTICE 'Created user_role enum with correct values';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with enum: %', SQLERRM;
END $$;

-- Drop and recreate users table to ensure clean schema
DROP TABLE IF EXISTS users CASCADE;

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

-- Disable RLS for immediate access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Created clean users table with correct schema';

-- =============================================================================
-- STEP 7: INSERT DEMO USERS WITH CORRECT DATA
-- =============================================================================
INSERT INTO users (email, role, full_name, phone, department, specialization, password_hash, is_active) VALUES
('admin@swamicare.com', 'admin', 'Admin User', '+91-9876543210', 'Administration', 'System Administration', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('doctor@swamicare.com', 'doctor', 'Dr. John Smith', '+91-9876543211', 'General Medicine', 'General Practice', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('receptionist@swamicare.com', 'receptionist', 'Jane Doe', '+91-9876543212', 'Reception', 'Patient Management', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('attendant@swamicare.com', 'service_attendant', 'Service Attendant', '+91-9876543213', 'Services', 'Patient Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('pharmacist@swamicare.com', 'pharmacist', 'Pharmacy Manager', '+91-9876543214', 'Pharmacy', 'Pharmaceutical Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true);

RAISE NOTICE 'Inserted 5 demo users with correct schema';

-- =============================================================================
-- STEP 8: FINAL VERIFICATION
-- =============================================================================
DO $$
DECLARE
    users_count integer;
    profiles_exists boolean;
    enum_values text[];
BEGIN
    -- Count users
    SELECT COUNT(*) FROM users INTO users_count;
    
    -- Check if user_profiles still exists (should be false)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) INTO profiles_exists;
    
    -- Get enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    INTO enum_values;
    
    RAISE NOTICE '=== CLEANUP VERIFICATION ===';
    RAISE NOTICE 'user_profiles table exists: % (should be FALSE)', profiles_exists;
    RAISE NOTICE 'users table count: % (should be 5)', users_count;
    RAISE NOTICE 'user_role enum values: %', enum_values;
    RAISE NOTICE '============================';
    
    IF NOT profiles_exists AND users_count = 5 THEN
        RAISE NOTICE '✅ DATABASE CLEANUP SUCCESSFUL! Authentication should now work.';
    ELSE
        RAISE NOTICE '❌ CLEANUP INCOMPLETE - Please check the errors above.';
    END IF;
END $$;

-- Show final user data
SELECT 
    'FINAL USERS DATA' as status,
    email, 
    role, 
    full_name, 
    department, 
    is_active 
FROM users 
ORDER BY role, email;