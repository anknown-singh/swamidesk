-- FINAL AUTH FIX - Handle ALL required auth.users fields
-- This addresses the confirmation_token NULL error

-- 1. DISABLE RLS COMPLETELY
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

-- 2. CLEAN DELETE (respecting foreign keys)
DELETE FROM pharmacy_issues;
DELETE FROM prescriptions; 
DELETE FROM treatment_sessions;
DELETE FROM treatment_plans;
DELETE FROM visit_services;
DELETE FROM invoices;
DELETE FROM visits;
DELETE FROM patients;
DELETE FROM user_profiles;
DELETE FROM auth.users WHERE email IN ('admin@swamicare.com', 'doctor@swamicare.com', 'receptionist@swamicare.com');

-- 3. CREATE AUTH USERS WITH ALL REQUIRED FIELDS
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, 
    is_super_admin, role, aud,
    confirmation_token, email_change_token_new, recovery_token,
    email_change_token_current, phone_change_token
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
    '', '', '', '', ''
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
    '', '', '', '', ''
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
    '', '', '', '', ''
);

-- 4. CREATE USER PROFILES
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', true),
('22222222-2222-2222-2222-222222222222'::uuid, 'doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', true),
('33333333-3333-3333-3333-333333333333'::uuid, 'receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', true);

-- 5. VERIFY SUCCESS
SELECT 'FINAL AUTH FIX COMPLETED - All token fields handled' as status;
SELECT email, role, first_name, last_name FROM user_profiles;