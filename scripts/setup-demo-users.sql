-- Demo User Setup Script for SwamiCare
-- Run this AFTER creating users in Supabase Auth UI

-- First, check what users exist in auth.users
-- SELECT id, email FROM auth.users;

-- Replace the UUIDs below with actual IDs from auth.users table

-- Admin User Profile
INSERT INTO user_profiles (id, name, email, role, department, specialization, phone, is_active)
VALUES (
  'replace-with-admin-uuid',
  'Dr. Admin User',
  'admin@swamicare.com',
  'admin',
  'Administration',
  'System Administration',
  '9999999999',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization;

-- Doctor User Profile
INSERT INTO user_profiles (id, name, email, role, department, specialization, phone, is_active)
VALUES (
  'replace-with-doctor-uuid',
  'Dr. Rajesh Kumar',
  'doctor@swamicare.com',
  'doctor',
  'ENT',
  'Otolaryngology',
  '9876543210',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization;

-- Receptionist User Profile
INSERT INTO user_profiles (id, name, email, role, department, specialization, phone, is_active)
VALUES (
  'replace-with-receptionist-uuid',
  'Ms. Sunita Devi',
  'receptionist@swamicare.com',
  'receptionist',
  'Reception',
  'Patient Care',
  '9876543213',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization;

-- Service Attendant User Profile
INSERT INTO user_profiles (id, name, email, role, department, specialization, phone, is_active)
VALUES (
  'replace-with-attendant-uuid',
  'Mr. Ravi Kumar',
  'attendant@swamicare.com',
  'service_attendant',
  'ENT',
  'ENT Procedures',
  '9876543214',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization;

-- Pharmacist User Profile
INSERT INTO user_profiles (id, name, email, role, department, specialization, phone, is_active)
VALUES (
  'replace-with-pharmacist-uuid',
  'Mr. Suresh Gupta',
  'pharmacist@swamicare.com',
  'pharmacist',
  'Pharmacy',
  'Pharmacy Management',
  '9876543216',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization;

-- Verify the setup
SELECT 
  up.name,
  up.email,
  up.role,
  up.department,
  up.is_active,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.role;