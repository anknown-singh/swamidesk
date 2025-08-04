-- SAFE RESET - Handle Foreign Key Dependencies
-- This safely resets without violating foreign key constraints

-- 1. COMPLETELY DISABLE RLS ON ALL TABLES FIRST
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

-- 2. DELETE IN CORRECT ORDER (respecting foreign keys)
-- Delete child records first
DELETE FROM pharmacy_issues;
DELETE FROM prescriptions;
DELETE FROM treatment_sessions;
DELETE FROM treatment_plans;
DELETE FROM visit_services;
DELETE FROM invoices;
DELETE FROM visits;
DELETE FROM patients;

-- Now safe to delete user_profiles
DELETE FROM user_profiles;

-- Delete auth users last
DELETE FROM auth.users WHERE email IN ('admin@swamicare.com', 'doctor@swamicare.com', 'receptionist@swamicare.com');

-- 3. RECREATE DEMO USERS WITH SIMPLE AUTH
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, 
    is_super_admin, role, aud
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
    false, 'authenticated', 'authenticated'
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
    false, 'authenticated', 'authenticated'
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
    false, 'authenticated', 'authenticated'
);

-- 4. CREATE USER PROFILES
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', true),
('22222222-2222-2222-2222-222222222222'::uuid, 'doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', true),
('33333333-3333-3333-3333-333333333333'::uuid, 'receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', true);

-- 5. RE-INSERT SAMPLE DATA
INSERT INTO services (name, description, category, duration, price, department, is_active) VALUES
('General Consultation', 'General medical consultation', 'consultation', 30, 500.00, 'General', true),
('ENT Consultation', 'Ear, Nose, Throat consultation', 'consultation', 30, 800.00, 'ENT', true),
('Blood Test', 'Complete blood count test', 'test', 10, 400.00, 'Laboratory', true)
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, strength, unit_price, stock_quantity, minimum_stock) VALUES
('Paracetamol 650mg', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '650mg', 2.00, 1000, 100),
('Amoxicillin 500mg', 'Amoxicillin', 'Cipla Ltd', 'Antibiotic', 'Capsule', '500mg', 5.50, 500, 50)
ON CONFLICT DO NOTHING;

-- 6. VERIFY SETUP
SELECT 'SAFE RESET COMPLETED - RLS disabled, fresh users created' as status;
SELECT email, role, first_name, last_name FROM user_profiles;