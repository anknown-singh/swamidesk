-- SwamIDesk Users Data Population Script
-- Inserts initial system users only
-- Run after create-all-tables.sql

BEGIN;

-- =====================================================
-- STEP 1: Insert Initial System Users
-- =====================================================

-- Insert Admin User
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('admin@swamidesk.com', 'System Administrator', 'admin', '+91-9999999999', true);

-- Insert Sample Doctors
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('dr.sharma@swamidesk.com', 'Dr. Rajesh Sharma', 'doctor', '+91-9876543210', true),
('dr.patel@swamidesk.com', 'Dr. Priya Patel', 'doctor', '+91-9876543211', true),
('dr.singh@swamidesk.com', 'Dr. Manpreet Singh', 'doctor', '+91-9876543212', true),
('dr.kumar@swamidesk.com', 'Dr. Anil Kumar', 'doctor', '+91-9876543213', true),
('dr.gupta@swamidesk.com', 'Dr. Sunita Gupta', 'doctor', '+91-9876543214', true),
('dr.mehta@swamidesk.com', 'Dr. Rohit Mehta', 'doctor', '+91-9876543215', true),
('dr.joshi@swamidesk.com', 'Dr. Kavya Joshi', 'doctor', '+91-9876543216', true);

-- Insert Sample Receptionists
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('reception1@swamidesk.com', 'Anjali Verma', 'receptionist', '+91-9876543220', true),
('reception2@swamidesk.com', 'Rohit Agarwal', 'receptionist', '+91-9876543221', true);

-- Insert Sample Pharmacists
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('pharmacist1@swamidesk.com', 'Deepak Pharmacy', 'pharmacist', '+91-9876543230', true),
('pharmacist2@swamidesk.com', 'Meera Medicines', 'pharmacist', '+91-9876543231', true);

-- Insert Sample Nurses
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('nurse1@swamidesk.com', 'Sister Mary', 'nurse', '+91-9876543240', true),
('nurse2@swamidesk.com', 'Nurse Kiran', 'nurse', '+91-9876543241', true);

-- =====================================================
-- STEP 2: Insert User Profiles for Doctors
-- =====================================================

-- Get doctor user IDs for profile creation
INSERT INTO user_profiles (user_id, specialization, qualification, experience_years, license_number, bio, consultation_fee, profile_picture_url, address, emergency_contact, department, shift_timings)
SELECT 
    u.id,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'Cardiology'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'Pediatrics'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'Orthopedics'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'General Medicine'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'Gynecology'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'ENT'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'Dental'
    END as specialization,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'MBBS, MD (Cardiology)'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'MBBS, MD (Pediatrics)'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'MBBS, MS (Orthopedics)'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'MBBS, MD (General Medicine)'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'MBBS, MD (Gynecology & Obstetrics)'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'MBBS, MS (ENT)'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'BDS, MDS (Oral Surgery)'
    END as qualification,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 15
        WHEN u.full_name = 'Dr. Priya Patel' THEN 12
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 18
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 20
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 14
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 16
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 11
    END as experience_years,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'MCI/12345/2008'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'MCI/23456/2011'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'MCI/34567/2005'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'MCI/45678/2003'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'MCI/56789/2009'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'MCI/67890/2007'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'DCI/78901/2012'
    END as license_number,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'Experienced cardiologist specializing in interventional cardiology and heart disease management.'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'Pediatric specialist with expertise in child healthcare and development.'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'Orthopedic surgeon specializing in joint replacement and sports injuries.'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'General physician with vast experience in internal medicine and preventive healthcare.'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'Gynecologist and obstetrician with expertise in women''s health and safe deliveries.'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'ENT specialist with expertise in ear, nose, throat disorders and ENT surgeries.'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'Dental surgeon specializing in oral surgery, implants and cosmetic dentistry.'
    END as bio,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 800.00
        WHEN u.full_name = 'Dr. Priya Patel' THEN 600.00
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 1000.00
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 500.00
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 700.00
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 750.00
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 650.00
    END as consultation_fee,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN '/images/doctors/dr-sharma.jpg'
        WHEN u.full_name = 'Dr. Priya Patel' THEN '/images/doctors/dr-patel.jpg'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN '/images/doctors/dr-singh.jpg'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN '/images/doctors/dr-kumar.jpg'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN '/images/doctors/dr-gupta.jpg'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN '/images/doctors/dr-mehta.jpg'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN '/images/doctors/dr-joshi.jpg'
    END as profile_picture_url,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN '123, Heart Care Centre, Medical Colony, New Delhi - 110001'
        WHEN u.full_name = 'Dr. Priya Patel' THEN '456, Child Care Clinic, Pediatric Wing, Mumbai - 400001'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN '789, Bone & Joint Hospital, Orthopedic Block, Chandigarh - 160001'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN '321, General Medicine Center, Health Plaza, Bangalore - 560001'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN '654, Women''s Health Clinic, Maternity Wing, Pune - 411001'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN '987, ENT Specialty Center, Throat Care Block, Hyderabad - 500001'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN '147, Dental Care Clinic, Smile Center, Ahmedabad - 380001'
    END as address,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN '+91-9876543250'
        WHEN u.full_name = 'Dr. Priya Patel' THEN '+91-9876543251'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN '+91-9876543252'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN '+91-9876543253'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN '+91-9876543254'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN '+91-9876543255'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN '+91-9876543256'
    END as emergency_contact,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'Cardiology'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'Pediatrics'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'Orthopedics'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'General Medicine'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'Gynecology'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'ENT'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'Dental'
    END as department,
    CASE 
        WHEN u.full_name = 'Dr. Rajesh Sharma' THEN 'Mon-Fri: 9AM-2PM, Sat: 9AM-12PM'
        WHEN u.full_name = 'Dr. Priya Patel' THEN 'Mon-Sat: 10AM-1PM, 4PM-7PM'
        WHEN u.full_name = 'Dr. Manpreet Singh' THEN 'Tue-Sat: 11AM-3PM'
        WHEN u.full_name = 'Dr. Anil Kumar' THEN 'Mon-Sat: 8AM-12PM, 5PM-8PM'
        WHEN u.full_name = 'Dr. Sunita Gupta' THEN 'Mon-Fri: 10AM-2PM, Sat: 10AM-1PM'
        WHEN u.full_name = 'Dr. Rohit Mehta' THEN 'Mon-Fri: 11AM-3PM, Sat: 10AM-1PM'
        WHEN u.full_name = 'Dr. Kavya Joshi' THEN 'Mon-Sat: 9AM-1PM, 3PM-7PM'
    END as shift_timings
FROM users u 
WHERE u.role = 'doctor';


COMMIT;

-- Success message
SELECT 'Users population completed successfully!' as result,
       (SELECT COUNT(*) FROM users) as total_users;