-- Seed data for SwamiCare development and testing
-- This file creates demo users and sample data

-- Insert demo users into auth.users table
-- Note: In production, these would be created via Supabase Auth API
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) VALUES 
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'admin@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'doctor@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
),
(
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'receptionist@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
),
(
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'attendant@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
),
(
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'pharmacist@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
);

-- Create corresponding user profiles
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', true),
('00000000-0000-0000-0000-000000000002', 'doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', true),
('00000000-0000-0000-0000-000000000003', 'receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', true),
('00000000-0000-0000-0000-000000000004', 'attendant@swamicare.com', 'service_attendant', 'Mike', 'Wilson', '+91-9876543213', true),
('00000000-0000-0000-0000-000000000005', 'pharmacist@swamicare.com', 'pharmacist', 'Sarah', 'Brown', '+91-9876543214', true);

-- Insert sample services
INSERT INTO services (name, description, category, duration, price, department, is_active) VALUES
-- Consultation Services
('General Consultation', 'General medical consultation', 'consultation', 30, 500.00, 'General', true),
('ENT Consultation', 'Ear, Nose, Throat consultation', 'consultation', 30, 800.00, 'ENT', true),
('Dental Consultation', 'Dental examination and consultation', 'consultation', 30, 600.00, 'Dental', true),

-- Procedures
('Tooth Extraction', 'Simple tooth extraction procedure', 'procedure', 45, 2000.00, 'Dental', true),
('Ear Wax Removal', 'Professional ear wax cleaning', 'procedure', 20, 800.00, 'ENT', true),
('Wound Dressing', 'Wound cleaning and dressing', 'procedure', 15, 300.00, 'General', true),

-- Tests
('Blood Test', 'Complete blood count test', 'test', 10, 400.00, 'Laboratory', true),
('X-Ray', 'Digital X-ray imaging', 'test', 15, 800.00, 'Radiology', true),
('ECG', 'Electrocardiogram test', 'test', 10, 500.00, 'Cardiology', true),

-- Therapies
('Physiotherapy Session', 'Physical therapy session', 'therapy', 60, 1000.00, 'Physiotherapy', true),
('Speech Therapy', 'Speech and language therapy', 'therapy', 45, 1200.00, 'Speech Therapy', true);

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, strength, unit_price, stock_quantity, minimum_stock) VALUES
-- Antibiotics
('Amoxicillin 500mg', 'Amoxicillin', 'Cipla Ltd', 'Antibiotic', 'Capsule', '500mg', 5.50, 500, 50),
('Azithromycin 250mg', 'Azithromycin', 'Sun Pharma', 'Antibiotic', 'Tablet', '250mg', 12.00, 200, 25),

-- Pain Management
('Paracetamol 650mg', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '650mg', 2.00, 1000, 100),
('Ibuprofen 400mg', 'Ibuprofen', 'Dr. Reddy\'s', 'NSAID', 'Tablet', '400mg', 3.50, 500, 50),
('Diclofenac Gel', 'Diclofenac Sodium', 'Novartis', 'Topical NSAID', 'Gel', '1%', 85.00, 50, 10),

-- Cough & Cold
('Cough Syrup', 'Dextromethorphan', 'Dabur', 'Antitussive', 'Syrup', '100ml', 45.00, 100, 20),
('Cetrizine 10mg', 'Cetirizine HCl', 'Johnson & Johnson', 'Antihistamine', 'Tablet', '10mg', 1.50, 800, 100),

-- Vitamins
('Vitamin D3', 'Cholecalciferol', 'Mankind Pharma', 'Vitamin', 'Capsule', '60000 IU', 15.00, 200, 30),
('B-Complex', 'Vitamin B Complex', 'Himalaya', 'Vitamin', 'Tablet', 'Multi', 8.00, 300, 50);

-- Insert sample patients
INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, created_by) VALUES
('Rajesh', 'Kumar', '1985-06-15', 'Male', '+91-9876543001', 'rajesh.kumar@email.com', '123 MG Road, Bangalore', 'Sunita Kumar', '+91-9876543002', '00000000-0000-0000-0000-000000000003'),
('Priya', 'Sharma', '1990-03-22', 'Female', '+91-9876543003', 'priya.sharma@email.com', '456 Brigade Road, Bangalore', 'Arun Sharma', '+91-9876543004', '00000000-0000-0000-0000-000000000003'),
('Mohammed', 'Ali', '1975-12-08', 'Male', '+91-9876543005', 'mohammed.ali@email.com', '789 Commercial Street, Bangalore', 'Fatima Ali', '+91-9876543006', '00000000-0000-0000-0000-000000000003'),
('Lakshmi', 'Nair', '1988-09-30', 'Female', '+91-9876543007', 'lakshmi.nair@email.com', '321 Residency Road, Bangalore', 'Ravi Nair', '+91-9876543008', '00000000-0000-0000-0000-000000000003'),
('Arjun', 'Patel', '1995-01-18', 'Male', '+91-9876543009', 'arjun.patel@email.com', '654 Koramangala, Bangalore', 'Meera Patel', '+91-9876543010', '00000000-0000-0000-0000-000000000003');

-- Insert sample visits for today
INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, queue_number, created_by) VALUES
((SELECT id FROM patients WHERE first_name = 'Rajesh' AND last_name = 'Kumar'), '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00:00', 'waiting', 'Fever and cough for 3 days', 1, '00000000-0000-0000-0000-000000000003'),
((SELECT id FROM patients WHERE first_name = 'Priya' AND last_name = 'Sharma'), '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:30:00', 'waiting', 'Dental pain', 2, '00000000-0000-0000-0000-000000000003'),
((SELECT id FROM patients WHERE first_name = 'Mohammed' AND last_name = 'Ali'), '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '10:00:00', 'waiting', 'Regular checkup', 3, '00000000-0000-0000-0000-000000000003');

-- Create a sample completed visit with services and prescription
DO $$
DECLARE
    sample_visit_id UUID;
    sample_patient_id UUID;
    consultation_service_id UUID;
    blood_test_service_id UUID;
    paracetamol_id UUID;
    amoxicillin_id UUID;
BEGIN
    -- Get IDs for the sample data
    SELECT id INTO sample_patient_id FROM patients WHERE first_name = 'Lakshmi' AND last_name = 'Nair';
    SELECT id INTO consultation_service_id FROM services WHERE name = 'General Consultation';
    SELECT id INTO blood_test_service_id FROM services WHERE name = 'Blood Test';
    SELECT id INTO paracetamol_id FROM medicines WHERE name = 'Paracetamol 650mg';
    SELECT id INTO amoxicillin_id FROM medicines WHERE name = 'Amoxicillin 500mg';
    
    -- Insert completed visit
    INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, diagnosis, queue_number, actual_start_time, actual_end_time, created_by) 
    VALUES (sample_patient_id, '00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', '14:00:00', 'completed', 'Headache and body pain', 'Viral fever with myalgia', 1, CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 1.5 hours', '00000000-0000-0000-0000-000000000003')
    RETURNING id INTO sample_visit_id;
    
    -- Add services to the visit
    INSERT INTO visit_services (visit_id, service_id, assigned_to, status, price, completed_at) VALUES
    (sample_visit_id, consultation_service_id, '00000000-0000-0000-0000-000000000002', 'completed', 500.00, CURRENT_TIMESTAMP - INTERVAL '1 day 1.5 hours'),
    (sample_visit_id, blood_test_service_id, '00000000-0000-0000-0000-000000000004', 'completed', 400.00, CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour');
    
    -- Add prescriptions
    INSERT INTO prescriptions (visit_id, medicine_id, quantity, dosage, duration, instructions, prescribed_by) VALUES
    (sample_visit_id, paracetamol_id, 10, '1 tablet every 6 hours', '3 days', 'Take after meals', '00000000-0000-0000-0000-000000000002'),
    (sample_visit_id, amoxicillin_id, 15, '1 capsule twice daily', '5 days', 'Complete the full course', '00000000-0000-0000-0000-000000000002');
    
    -- Create and complete invoice
    INSERT INTO invoices (visit_id, patient_id, subtotal, total_amount, payment_status, payment_method, payment_date, created_by) VALUES
    (sample_visit_id, sample_patient_id, 900.00, 900.00, 'completed', 'cash', CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour', '00000000-0000-0000-0000-000000000003');
END $$;