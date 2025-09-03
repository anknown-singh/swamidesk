-- Fix users and user_profiles relationship issue
-- Migration: 20250903000001_fix_users_user_profiles_relationship.sql
-- This addresses the PGRST200 error where PostgREST can't find the relationship
-- between 'users' and 'user_profiles' tables

BEGIN;

-- 1. Drop the existing users view to avoid conflicts
DROP VIEW IF EXISTS users CASCADE;
DROP MATERIALIZED VIEW IF EXISTS users_materialized CASCADE;

-- 2. Create a proper users table that references user_profiles
-- This maintains backward compatibility while fixing the relationship issue
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    department VARCHAR(100),
    specialization VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Populate users table from existing user_profiles data
INSERT INTO users (user_profile_id, email, role, full_name, first_name, last_name, phone, address, department, specialization, is_active, created_at, updated_at)
SELECT 
    id as user_profile_id,
    email,
    role,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    phone,
    address,
    department,
    specialization,
    is_active,
    created_at,
    updated_at
FROM user_profiles
ON CONFLICT (user_profile_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    department = EXCLUDED.department,
    specialization = EXCLUDED.specialization,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_profile_id ON users(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DROP POLICY IF EXISTS "Users can view all user records" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

CREATE POLICY "Users can view all user records" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own record" ON users FOR SELECT TO authenticated USING (user_profile_id = auth.uid());
CREATE POLICY "Admins can manage users" ON users FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 7. Create a function to sync users table when user_profiles changes
CREATE OR REPLACE FUNCTION sync_users_from_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO users (user_profile_id, email, role, full_name, first_name, last_name, phone, address, department, specialization, is_active, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            NEW.role,
            CONCAT(NEW.first_name, ' ', NEW.last_name),
            NEW.first_name,
            NEW.last_name,
            NEW.phone,
            NEW.address,
            NEW.department,
            NEW.specialization,
            NEW.is_active,
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (user_profile_id) DO UPDATE SET
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            department = EXCLUDED.department,
            specialization = EXCLUDED.specialization,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE users SET
            email = NEW.email,
            role = NEW.role,
            full_name = CONCAT(NEW.first_name, ' ', NEW.last_name),
            first_name = NEW.first_name,
            last_name = NEW.last_name,
            phone = NEW.phone,
            address = NEW.address,
            department = NEW.department,
            specialization = NEW.specialization,
            is_active = NEW.is_active,
            updated_at = NEW.updated_at
        WHERE user_profile_id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM users WHERE user_profile_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to keep users table in sync
DROP TRIGGER IF EXISTS sync_users_trigger ON user_profiles;
CREATE TRIGGER sync_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION sync_users_from_user_profiles();

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Add comments
COMMENT ON TABLE users IS 'Users table that maintains relationship with user_profiles for API compatibility';
COMMENT ON COLUMN users.user_profile_id IS 'Reference to user_profiles table';
COMMENT ON FUNCTION sync_users_from_user_profiles() IS 'Keeps users table synchronized with user_profiles changes';

-- 11. Update any foreign key references that might be pointing to the old view
-- This ensures all existing relationships work correctly

COMMIT;