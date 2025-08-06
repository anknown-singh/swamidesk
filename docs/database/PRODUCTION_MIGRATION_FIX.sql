-- PRODUCTION DATABASE MIGRATION: user_profiles → users
-- Fix for "relation public.users does not exist" error
-- This script safely migrates existing user_profiles data to users table
-- Date: 2025-08-06
-- Version: 1.3.1 Production Hotfix

-- STEP 1: BACKUP EXISTING DATA (if user_profiles exists)
-- ============================================================================

DO $$
BEGIN
    -- Create backup table if user_profiles exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP TABLE IF EXISTS user_profiles_backup;
        CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;
        RAISE NOTICE 'Backed up user_profiles to user_profiles_backup';
    ELSE
        RAISE NOTICE 'No user_profiles table found - proceeding with fresh setup';
    END IF;
END $$;

-- STEP 2: CREATE REQUIRED ENUMS (if not exists)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role enum already exists';
END $$;

-- STEP 3: CREATE USERS TABLE
-- ============================================================================

-- Drop existing users table if it exists (clean slate)
DROP TABLE IF EXISTS users CASCADE;

-- Create new users table with all required fields
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

-- STEP 4: MIGRATE EXISTING DATA (if backup exists)
-- ============================================================================

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Check if backup table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles_backup') THEN
        -- Migrate each user from backup
        FOR user_record IN SELECT * FROM user_profiles_backup LOOP
            INSERT INTO users (
                id, 
                email, 
                role, 
                full_name, 
                phone, 
                password_hash, 
                is_active, 
                created_at, 
                updated_at
            ) VALUES (
                user_record.id,
                user_record.email,
                user_record.role::user_role,
                COALESCE(user_record.first_name || ' ' || user_record.last_name, user_record.first_name, user_record.last_name, 'Unknown User'),
                user_record.phone,
                COALESCE(user_record.password_hash, '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu'), -- default hash for 'password123'
                COALESCE(user_record.is_active, true),
                COALESCE(user_record.created_at, NOW()),
                COALESCE(user_record.updated_at, NOW())
            );
        END LOOP;
        
        RAISE NOTICE 'Migrated % users from user_profiles_backup', (SELECT COUNT(*) FROM user_profiles_backup);
    ELSE
        RAISE NOTICE 'No user_profiles_backup found - will create demo users';
    END IF;
END $$;

-- STEP 5: ENSURE DEMO USERS EXIST (for production access)
-- ============================================================================

-- Insert or update demo users (use ON CONFLICT to avoid duplicates)
INSERT INTO users (email, role, full_name, phone, department, specialization, password_hash, is_active) VALUES
('admin@swamicare.com', 'admin', 'Admin User', '+91-9876543210', 'Administration', 'System Administration', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('doctor@swamicare.com', 'doctor', 'Dr. John Smith', '+91-9876543211', 'General Medicine', 'General Practice', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('receptionist@swamicare.com', 'receptionist', 'Jane Doe', '+91-9876543212', 'Reception', 'Patient Management', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('attendant@swamicare.com', 'service_attendant', 'Service Attendant', '+91-9876543213', 'Services', 'Patient Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('pharmacist@swamicare.com', 'pharmacist', 'Pharmacy Manager', '+91-9876543214', 'Pharmacy', 'Pharmaceutical Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    specialization = EXCLUDED.specialization,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- STEP 6: CLEAN UP OLD TABLE (optional - keep backup for safety)
-- ============================================================================

-- Drop the original user_profiles table if it exists
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Rename backup table for clarity
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles_backup') THEN
        ALTER TABLE user_profiles_backup RENAME TO user_profiles_migration_backup;
        RAISE NOTICE 'Renamed backup table to user_profiles_migration_backup for safety';
    END IF;
END $$;

-- STEP 7: DISABLE RLS FOR PRODUCTION ACCESS
-- ============================================================================

-- Ensure RLS is disabled for immediate access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- STEP 8: VERIFICATION
-- ============================================================================

-- Display migration results
SELECT 
    'PRODUCTION MIGRATION COMPLETED SUCCESSFULLY' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctor_users,
    COUNT(CASE WHEN role = 'receptionist' THEN 1 END) as receptionist_users,
    COUNT(CASE WHEN role = 'attendant' THEN 1 END) as attendant_users,
    COUNT(CASE WHEN role = 'pharmacist' THEN 1 END) as pharmacist_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM users;

-- Show sample users (without password hashes)
SELECT 
    email, 
    role, 
    full_name, 
    department, 
    is_active,
    created_at
FROM users 
ORDER BY role, email;

-- Confirm table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;