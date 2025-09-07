-- Create missing user profile for ID: 8f4424ef-f9b2-4071-ab9c-da50aa9f1681
-- This script will create both the users and user_profiles records

-- First, check if a user exists for this profile ID
-- If not, create one
INSERT INTO users (id, email, full_name, role, phone, is_active)
VALUES (
    'f7c6ad1f-f759-4d9f-8692-dddb1f231307', -- This will be the users.id
    'current-user@example.com',
    'Current User',
    'doctor',
    '+91-1234567890',
    true
) ON CONFLICT (id) DO NOTHING;

-- Now create the user_profiles record with the ID your session expects
INSERT INTO user_profiles (
    id,
    user_id,
    specialization,
    qualification,
    experience_years,
    license_number,
    bio,
    consultation_fee,
    profile_picture_url,
    address,
    emergency_contact,
    department,
    shift_timings
) VALUES (
    '8f4424ef-f9b2-4071-ab9c-da50aa9f1681', -- This is what your session expects
    'f7c6ad1f-f759-4d9f-8692-dddb1f231307', -- References users.id
    'General Medicine',
    'MBBS, MD (General Medicine)',
    10,
    'MCI/12345/2013',
    'Current logged in user profile',
    '500.00',
    '/images/doctors/current-user.jpg',
    '123 Main Street, City - 123456',
    '+91-9876543210',
    'General Medicine',
    'Mon-Sat: 9AM-5PM'
) ON CONFLICT (id) DO UPDATE SET
    specialization = EXCLUDED.specialization,
    updated_at = NOW();

-- Verify the records were created
SELECT 'Users table:' as table_name, id, email, full_name, role FROM users WHERE id = 'f7c6ad1f-f759-4d9f-8692-dddb1f231307'
UNION ALL
SELECT 'User Profiles table:', id::text, user_id::text, specialization, department FROM user_profiles WHERE id = '8f4424ef-f9b2-4071-ab9c-da50aa9f1681';