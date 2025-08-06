-- ============================================================================
-- SwamIDesk Complete Database Setup with Sample Data
-- This script creates all tables AND populates them with demo data
-- Execute this in Supabase SQL Editor to get working dynamic dashboards
-- ============================================================================

-- =============================================================================
-- STEP 1: CREATE ENUMS AND USER TABLE
-- =============================================================================

-- Create user_role enum (safe to run multiple times)
DO $$ 
BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
    RAISE NOTICE 'Created user_role enum';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with enum: %', SQLERRM;
END $$;

-- Create additional enums for data integrity (safe to run multiple times)
DO $$ 
BEGIN
    DROP TYPE IF EXISTS visit_status CASCADE;
    CREATE TYPE visit_status AS ENUM ('waiting', 'in_consultation', 'services_pending', 'completed', 'cancelled');
    RAISE NOTICE 'Created visit_status enum';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with visit_status enum: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    DROP TYPE IF EXISTS service_status CASCADE;
    CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');
    RAISE NOTICE 'Created service_status enum';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with service_status enum: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    DROP TYPE IF EXISTS payment_status CASCADE;
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');
    RAISE NOTICE 'Created payment_status enum';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with payment_status enum: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    DROP TYPE IF EXISTS payment_method CASCADE;
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'insurance', 'bank_transfer');
    RAISE NOTICE 'Created payment_method enum';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error with payment_method enum: %', SQLERRM;
END $$;

-- Drop and recreate users table to ensure correct schema
DROP TABLE IF EXISTS users CASCADE;

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

-- Disable RLS for demo purposes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: CREATE ALL SUPPORTING TABLES  
-- =============================================================================

-- Drop existing tables to ensure clean schema
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visit_services CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration INTEGER, -- in minutes
    price DECIMAL(10,2),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visits table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME,
    status visit_status DEFAULT 'waiting',
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    token_number INTEGER,
    priority BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit services (services assigned to visits)
CREATE TABLE visit_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_to UUID REFERENCES users(id),
    status service_status DEFAULT 'assigned',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines table
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    manufacturer VARCHAR(200),
    category VARCHAR(100),
    dosage_form VARCHAR(50), -- tablet, capsule, syrup, etc.
    strength VARCHAR(50),
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    expiry_date DATE,
    batch_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    dosage VARCHAR(200),
    duration VARCHAR(100),
    instructions TEXT,
    prescribed_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, dispensed, cancelled
    dispensed_by UUID REFERENCES users(id),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: INSERT DEMO USERS
-- =============================================================================

INSERT INTO users (email, role, full_name, phone, department, specialization, password_hash, is_active) VALUES
('admin@swamidesk.com', 'admin', 'Admin User', '+91-9876543210', 'Administration', 'System Administration', 'password', true),
('dr.smith@swamidesk.com', 'doctor', 'Dr. John Smith', '+91-9876543211', 'General Medicine', 'General Practice', 'password', true),
('receptionist@swamidesk.com', 'receptionist', 'Jane Doe', '+91-9876543212', 'Reception', 'Patient Management', 'password', true),
('attendant@swamidesk.com', 'service_attendant', 'Service Attendant', '+91-9876543213', 'Services', 'Patient Services', 'password', true),
('pharmacist@swamidesk.com', 'pharmacist', 'Pharmacy Manager', '+91-9876543214', 'Pharmacy', 'Pharmaceutical Services', 'password', true);

-- =============================================================================
-- STEP 4: INSERT SAMPLE DATA FOR DYNAMIC DASHBOARDS
-- =============================================================================

-- Insert sample services
INSERT INTO services (name, description, category, duration, price, department, is_active) VALUES
-- Consultations
('General Consultation', 'General medical consultation', 'consultation', 30, 500.00, 'General', true),
('ENT Consultation', 'Ear, Nose, Throat consultation', 'consultation', 30, 800.00, 'ENT', true),
('Dental Consultation', 'Dental examination and consultation', 'consultation', 30, 600.00, 'Dental', true),
-- Procedures
('Blood Test', 'Complete blood count test', 'test', 10, 400.00, 'Laboratory', true),
('X-Ray', 'Digital X-ray imaging', 'test', 15, 800.00, 'Radiology', true),
('ECG', 'Electrocardiogram test', 'test', 10, 500.00, 'Cardiology', true),
-- Treatments
('Wound Dressing', 'Wound cleaning and dressing', 'procedure', 15, 300.00, 'General', true),
('Physiotherapy Session', 'Physical therapy session', 'therapy', 60, 1000.00, 'Physiotherapy', true);

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, strength, unit_price, stock_quantity, minimum_stock, is_active) VALUES
-- Common Medicines
('Paracetamol 650mg', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '650mg', 2.00, 1000, 100, true),
('Amoxicillin 500mg', 'Amoxicillin', 'Cipla Ltd', 'Antibiotic', 'Capsule', '500mg', 5.50, 500, 50, true),
('Ibuprofen 400mg', 'Ibuprofen', 'Dr. Reddys', 'NSAID', 'Tablet', '400mg', 3.50, 500, 50, true),
('Cetirizine 10mg', 'Cetirizine HCl', 'Johnson & Johnson', 'Antihistamine', 'Tablet', '10mg', 1.50, 800, 100, true),
('Omeprazole 20mg', 'Omeprazole', 'AstraZeneca', 'PPI', 'Capsule', '20mg', 5.50, 300, 30, true),
-- Low stock items for pharmacy alerts
('Insulin', 'Human Insulin', 'Novo Nordisk', 'Hormone', 'Injection', '100U/ml', 250.00, 15, 20, true),
('Ventolin Inhaler', 'Salbutamol', 'GSK', 'Bronchodilator', 'Inhaler', '100mcg', 180.00, 8, 15, true);

-- Insert sample patients
INSERT INTO patients (full_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, created_by) VALUES
('Rajesh Kumar', '1985-06-15', 'Male', '+91-9876543001', 'rajesh.kumar@email.com', '123 MG Road, Bangalore', 'Sunita Kumar', '+91-9876543002', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Priya Sharma', '1990-03-22', 'Female', '+91-9876543003', 'priya.sharma@email.com', '456 Brigade Road, Bangalore', 'Arun Sharma', '+91-9876543004', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Mohammed Ali', '1975-12-08', 'Male', '+91-9876543005', 'mohammed.ali@email.com', '789 Commercial Street, Bangalore', 'Fatima Ali', '+91-9876543006', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Lakshmi Nair', '1988-09-30', 'Female', '+91-9876543007', 'lakshmi.nair@email.com', '321 Residency Road, Bangalore', 'Ravi Nair', '+91-9876543008', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Arjun Patel', '1995-01-18', 'Male', '+91-9876543009', 'arjun.patel@email.com', '654 Koramangala, Bangalore', 'Meera Patel', '+91-9876543010', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Deepika Singh', '1992-07-25', 'Female', '+91-9876543011', 'deepika.singh@email.com', '789 Whitefield, Bangalore', 'Vikram Singh', '+91-9876543012', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Suresh Reddy', '1980-11-30', 'Male', '+91-9876543013', 'suresh.reddy@email.com', '234 Electronic City, Bangalore', 'Kavitha Reddy', '+91-9876543014', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
('Anita Gupta', '1987-04-12', 'Female', '+91-9876543015', 'anita.gupta@email.com', '567 HSR Layout, Bangalore', 'Rohit Gupta', '+91-9876543016', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com'));

-- Insert sample visits for TODAY (waiting queue)
INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, token_number, priority, checked_in_at, created_by) VALUES
((SELECT id FROM patients WHERE full_name = 'Rajesh Kumar'), (SELECT id FROM users WHERE email = 'dr.smith@swamidesk.com'), CURRENT_DATE, '09:00:00', 'waiting', 'Fever and cough for 3 days', 1, false, NOW() - INTERVAL '2 hours', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
((SELECT id FROM patients WHERE full_name = 'Priya Sharma'), (SELECT id FROM users WHERE email = 'dr.smith@swamidesk.com'), CURRENT_DATE, '09:30:00', 'waiting', 'Dental pain', 2, true, NOW() - INTERVAL '1.5 hours', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
((SELECT id FROM patients WHERE full_name = 'Mohammed Ali'), (SELECT id FROM users WHERE email = 'dr.smith@swamidesk.com'), CURRENT_DATE, '10:00:00', 'waiting', 'Regular checkup', 3, false, NOW() - INTERVAL '1 hour', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com')),
((SELECT id FROM patients WHERE full_name = 'Deepika Singh'), (SELECT id FROM users WHERE email = 'dr.smith@swamidesk.com'), CURRENT_DATE, '10:30:00', 'in_consultation', 'Headache and nausea', 4, false, NOW() - INTERVAL '30 minutes', (SELECT id FROM users WHERE email = 'receptionist@swamidesk.com'));

-- Insert completed visits from YESTERDAY and earlier for revenue metrics
DO $$
DECLARE
    visit1_id UUID;
    visit2_id UUID;
    visit3_id UUID;
    consultation_service_id UUID;
    blood_test_service_id UUID;
    xray_service_id UUID;
    paracetamol_id UUID;
    amoxicillin_id UUID;
    doctor_id UUID;
    attendant_id UUID;
    pharmacist_id UUID;
    receptionist_id UUID;
BEGIN
    -- Get service and medicine IDs
    SELECT id INTO consultation_service_id FROM services WHERE name = 'General Consultation';
    SELECT id INTO blood_test_service_id FROM services WHERE name = 'Blood Test';
    SELECT id INTO xray_service_id FROM services WHERE name = 'X-Ray';
    SELECT id INTO paracetamol_id FROM medicines WHERE name = 'Paracetamol 650mg';
    SELECT id INTO amoxicillin_id FROM medicines WHERE name = 'Amoxicillin 500mg';
    SELECT id INTO doctor_id FROM users WHERE email = 'dr.smith@swamidesk.com';
    SELECT id INTO attendant_id FROM users WHERE email = 'attendant@swamidesk.com';
    SELECT id INTO pharmacist_id FROM users WHERE email = 'pharmacist@swamidesk.com';
    SELECT id INTO receptionist_id FROM users WHERE email = 'receptionist@swamidesk.com';
    
    -- YESTERDAY's completed visit 1
    INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, diagnosis, token_number, actual_start_time, actual_end_time, created_by) 
    VALUES ((SELECT id FROM patients WHERE full_name = 'Lakshmi Nair'), doctor_id, CURRENT_DATE - INTERVAL '1 day', '14:00:00', 'completed', 'Headache and body pain', 'Viral fever with myalgia', 1, 
            CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 1.5 hours', receptionist_id)
    RETURNING id INTO visit1_id;
    
    -- Add services to yesterday's visit 1
    INSERT INTO visit_services (visit_id, service_id, assigned_to, status, price, completed_at) VALUES
    (visit1_id, consultation_service_id, doctor_id, 'completed', 500.00, CURRENT_TIMESTAMP - INTERVAL '1 day 1.5 hours'),
    (visit1_id, blood_test_service_id, attendant_id, 'completed', 400.00, CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour');
    
    -- Add prescriptions for visit 1
    INSERT INTO prescriptions (visit_id, medicine_id, quantity, dosage, duration, instructions, prescribed_by, status, dispensed_by, dispensed_at) VALUES
    (visit1_id, paracetamol_id, 10, '1 tablet every 6 hours', '3 days', 'Take after meals', doctor_id, 'dispensed', pharmacist_id, CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour'),
    (visit1_id, amoxicillin_id, 15, '1 capsule twice daily', '5 days', 'Complete the full course', doctor_id, 'dispensed', pharmacist_id, CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour');
    
    -- Create invoice for visit 1
    INSERT INTO invoices (visit_id, patient_id, subtotal, total_amount, payment_status, payment_method, payment_date, created_by) VALUES
    (visit1_id, (SELECT id FROM patients WHERE full_name = 'Lakshmi Nair'), 920.00, 920.00, 'completed', 'cash', CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour', receptionist_id);
    
    -- YESTERDAY's completed visit 2
    INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, diagnosis, token_number, actual_start_time, actual_end_time, created_by) 
    VALUES ((SELECT id FROM patients WHERE full_name = 'Arjun Patel'), doctor_id, CURRENT_DATE - INTERVAL '1 day', '16:00:00', 'completed', 'Back pain', 'Muscle strain', 2, 
            CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour', CURRENT_TIMESTAMP - INTERVAL '1 day 0.5 hours', receptionist_id)
    RETURNING id INTO visit2_id;
    
    -- Add services to yesterday's visit 2
    INSERT INTO visit_services (visit_id, service_id, assigned_to, status, price, completed_at) VALUES
    (visit2_id, consultation_service_id, doctor_id, 'completed', 500.00, CURRENT_TIMESTAMP - INTERVAL '1 day 0.5 hours'),
    (visit2_id, xray_service_id, attendant_id, 'completed', 800.00, CURRENT_TIMESTAMP - INTERVAL '1 day 0.5 hours');
    
    -- Create invoice for visit 2
    INSERT INTO invoices (visit_id, patient_id, subtotal, total_amount, payment_status, payment_method, payment_date, created_by) VALUES
    (visit2_id, (SELECT id FROM patients WHERE full_name = 'Arjun Patel'), 1300.00, 1300.00, 'completed', 'card', CURRENT_TIMESTAMP - INTERVAL '1 day 0.5 hours', receptionist_id);
    
    -- TODAY's completed visit for revenue
    INSERT INTO visits (patient_id, doctor_id, visit_date, visit_time, status, chief_complaint, diagnosis, token_number, actual_start_time, actual_end_time, created_by) 
    VALUES ((SELECT id FROM patients WHERE full_name = 'Suresh Reddy'), doctor_id, CURRENT_DATE, '08:00:00', 'completed', 'Regular checkup', 'Healthy', 0, 
            CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2.5 hours', receptionist_id)
    RETURNING id INTO visit3_id;
    
    -- Add services to today's visit
    INSERT INTO visit_services (visit_id, service_id, assigned_to, status, price, completed_at) VALUES
    (visit3_id, consultation_service_id, doctor_id, 'completed', 500.00, CURRENT_TIMESTAMP - INTERVAL '2.5 hours');
    
    -- Create invoice for today's visit
    INSERT INTO invoices (visit_id, patient_id, subtotal, total_amount, payment_status, payment_method, payment_date, created_by) VALUES
    (visit3_id, (SELECT id FROM patients WHERE full_name = 'Suresh Reddy'), 500.00, 500.00, 'completed', 'upi', CURRENT_TIMESTAMP - INTERVAL '2.5 hours', receptionist_id);

END $$;

-- =============================================================================
-- STEP 5: VERIFY DATA FOR DASHBOARDS
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    patients_count INTEGER;
    visits_today_count INTEGER;
    visits_yesterday_count INTEGER;
    completed_visits_count INTEGER;
    pending_prescriptions_count INTEGER;
    total_revenue_today DECIMAL(10,2);
    total_revenue_yesterday DECIMAL(10,2);
BEGIN
    SELECT COUNT(*) FROM users INTO users_count;
    SELECT COUNT(*) FROM patients INTO patients_count;
    SELECT COUNT(*) FROM visits WHERE visit_date = CURRENT_DATE INTO visits_today_count;
    SELECT COUNT(*) FROM visits WHERE visit_date = CURRENT_DATE - INTERVAL '1 day' INTO visits_yesterday_count;
    SELECT COUNT(*) FROM visits WHERE status = 'completed' INTO completed_visits_count;
    SELECT COUNT(*) FROM prescriptions WHERE status = 'pending' INTO pending_prescriptions_count;
    
    SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE DATE(created_at) = CURRENT_DATE INTO total_revenue_today;
    SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' INTO total_revenue_yesterday;
    
    RAISE NOTICE '=== DATABASE SETUP VERIFICATION ===';
    RAISE NOTICE 'Users: % (should be 5)', users_count;
    RAISE NOTICE 'Patients: % (should be 8)', patients_count;
    RAISE NOTICE 'Visits today: % (should be 4)', visits_today_count;
    RAISE NOTICE 'Visits yesterday: % (should be 2)', visits_yesterday_count;
    RAISE NOTICE 'Completed visits: % (should be 3)', completed_visits_count;
    RAISE NOTICE 'Pending prescriptions: % (should be 0)', pending_prescriptions_count;
    RAISE NOTICE 'Today revenue: ₹% (should be > 0)', total_revenue_today;
    RAISE NOTICE 'Yesterday revenue: ₹% (should be > 0)', total_revenue_yesterday;
    RAISE NOTICE '===================================';
    
    IF users_count >= 5 AND patients_count >= 8 AND total_revenue_today > 0 THEN
        RAISE NOTICE '✅ DATABASE SETUP SUCCESSFUL! Dynamic dashboards should now show real data.';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE - Check the counts above';
    END IF;
END $$;

-- Show sample of created data
SELECT 'Demo Users' as type, email as name, role::text, full_name as details FROM users
UNION ALL
SELECT 'Patients' as type, full_name as name, gender as role, phone as details FROM patients
UNION ALL  
SELECT 'Today Visits' as type, p.full_name as name, v.status::text as role, v.chief_complaint as details 
FROM visits v JOIN patients p ON v.patient_id = p.id 
WHERE v.visit_date = CURRENT_DATE
ORDER BY type, name
LIMIT 15;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- 
-- Your SwamIDesk database now has:
-- ✅ 5 demo user accounts with correct schema
-- ✅ 8+ sample patients  
-- ✅ Sample visits (today's queue + completed visits)
-- ✅ Sample medicines with stock levels
-- ✅ Complete invoices and prescriptions for revenue metrics
-- ✅ Service assignments for attendant dashboard
-- ✅ All data needed for dynamic dashboard calculations
--
-- Login credentials:
-- 👤 admin@swamidesk.com / password
-- 👨‍⚕️ dr.smith@swamidesk.com / password  
-- 👩‍💼 receptionist@swamidesk.com / password
-- 👨‍🔧 attendant@swamidesk.com / password
-- 💊 pharmacist@swamidesk.com / password
-- ============================================================================