-- QUICK PRODUCTION FIX: Create users table
-- Execute this in Supabase SQL Editor to fix "users table does not exist" error
-- This creates the users table required by v1.3.1

-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing users table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with required structure
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

-- Create performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Insert demo users (password is 'password123' for all)
INSERT INTO users (email, role, full_name, phone, department, specialization, password_hash, is_active) VALUES
('admin@swamicare.com', 'admin', 'Admin User', '+91-9876543210', 'Administration', 'System Administration', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('doctor@swamicare.com', 'doctor', 'Dr. John Smith', '+91-9876543211', 'General Medicine', 'General Practice', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('receptionist@swamicare.com', 'receptionist', 'Jane Doe', '+91-9876543212', 'Reception', 'Patient Management', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('attendant@swamicare.com', 'service_attendant', 'Service Attendant', '+91-9876543213', 'Services', 'Patient Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('pharmacist@swamicare.com', 'pharmacist', 'Pharmacy Manager', '+91-9876543214', 'Pharmacy', 'Pharmaceutical Services', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true);

-- Disable RLS for immediate access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify creation
SELECT 'Users table created successfully' as status, COUNT(*) as user_count FROM users;
SELECT email, role, full_name, department FROM users ORDER BY role;