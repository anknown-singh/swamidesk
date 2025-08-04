-- COMPLETE RESET - Start Fresh
-- This completely resets auth and user data

-- 1. DELETE ALL EXISTING AUTH USERS (start fresh)
DELETE FROM auth.users WHERE email IN ('admin@swamicare.com', 'doctor@swamicare.com', 'receptionist@swamicare.com');

-- 2. DELETE ALL USER PROFILES
DELETE FROM user_profiles WHERE email IN ('admin@swamicare.com', 'doctor@swamicare.com', 'receptionist@swamicare.com');

-- 3. COMPLETELY DISABLE RLS ON ALL TABLES
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- 4. RECREATE DEMO USERS WITH PROPER SUPABASE AUTH
-- First, create the auth users
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, 
    is_super_admin, role, aud, confirmation_token, 
    email_change_token_new, recovery_token
) VALUES 
-- Admin user
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false, 'authenticated', 'authenticated',
    '', '', ''
),
-- Doctor user  
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'doctor@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false, 'authenticated', 'authenticated',
    '', '', ''
),
-- Receptionist user
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'receptionist@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false, 'authenticated', 'authenticated',
    '', '', ''
);

-- 5. CREATE USER PROFILES
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', true),
('22222222-2222-2222-2222-222222222222'::uuid, 'doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', true),
('33333333-3333-3333-3333-333333333333'::uuid, 'receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', true);

-- 6. VERIFY SETUP
SELECT 'COMPLETE RESET DONE - Auth users and profiles recreated' as status;
SELECT email, role, first_name, last_name FROM user_profiles;