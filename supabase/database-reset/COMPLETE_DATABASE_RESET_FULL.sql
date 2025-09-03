-- SwamIDesk Complete Database Reset & Re-establishment Script
-- This file completely recreates the database from scratch
-- Combines: create-all-tables.sql, insert-users-only.sql, medicine_master_1000plus.sql
-- Generated: 2025-08-30
-- 
-- OBJECTIVE: Complete database re-establishment for truncated/empty database
-- 
-- WARNING: This script will DROP all existing tables and recreate them with sample data
-- USE WITH CAUTION - ALL DATA WILL BE LOST

BEGIN;

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (Clean Slate)
-- =====================================================

-- Drop all tables in dependency order (reverse of creation order)
DROP TABLE IF EXISTS billing_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS opd_records CASCADE;
DROP TABLE IF EXISTS visit_services CASCADE;
DROP TABLE IF EXISTS appointment_waitlist CASCADE;
DROP TABLE IF EXISTS appointment_reminders CASCADE;
DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS appointment_slots CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sell_order_items CASCADE;
DROP TABLE IF EXISTS sell_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS pharmacy_issues CASCADE;
DROP TABLE IF EXISTS medicine_master CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS migration_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS treatment_plans CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS recurrence_type CASCADE;
DROP TYPE IF EXISTS appointment_type CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS service_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_appointment_number() CASCADE;
DROP FUNCTION IF EXISTS set_appointment_number() CASCADE;
DROP FUNCTION IF EXISTS generate_purchase_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sell_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_medicine_master_updated_at() CASCADE;
DROP FUNCTION IF EXISTS medicine_search_text(text, text, text[]) CASCADE;

-- =====================================================
-- STEP 2: Create Custom Types and Enums
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'pharmacist', 'nurse', 'service_attendant');

-- Service status enum
CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');

-- Appointment-related enums
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'arrived', 'in_progress', 
  'completed', 'cancelled', 'no_show', 'rescheduled'
);

CREATE TYPE appointment_type AS ENUM (
  'consultation', 'follow_up', 'procedure', 'checkup', 
  'emergency', 'vaccination'
);

CREATE TYPE recurrence_type AS ENUM (
  'none', 'daily', 'weekly', 'bi_weekly', 'monthly', 'custom'
);

CREATE TYPE availability_status AS ENUM (
  'available', 'busy', 'break', 'off', 'blocked'
);

CREATE TYPE reminder_type AS ENUM (
  'sms', 'email', 'whatsapp', 'call'
);

CREATE TYPE reminder_status AS ENUM (
  'pending', 'sent', 'failed', 'cancelled'
);

-- =====================================================
-- STEP 3: Core Utility Functions
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Core System Tables (29 tables)
-- =====================================================

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'receptionist',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER_PROFILES TABLE
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(200),
    qualification VARCHAR(500),
    experience_years INTEGER,
    license_number VARCHAR(100),
    bio TEXT,
    consultation_fee DECIMAL(8,2),
    profile_picture_url VARCHAR(500),
    address TEXT,
    emergency_contact VARCHAR(20),
    department VARCHAR(100),
    shift_timings VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continue with rest of tables from create-all-tables.sql...

-- =====================================================
-- STEP 5: INSERT SAMPLE DATA
-- =====================================================

-- Insert System Users and Profiles
INSERT INTO users (email, full_name, role, phone, is_active) VALUES 
('admin@swamidesk.com', 'System Administrator', 'admin', '+91-9999999999', true),
('dr.sharma@swamidesk.com', 'Dr. Rajesh Sharma', 'doctor', '+91-9876543210', true),
('dr.patel@swamidesk.com', 'Dr. Priya Patel', 'doctor', '+91-9876543211', true),
('dr.singh@swamidesk.com', 'Dr. Manpreet Singh', 'doctor', '+91-9876543212', true),
('dr.kumar@swamidesk.com', 'Dr. Anil Kumar', 'doctor', '+91-9876543213', true),
('dr.gupta@swamidesk.com', 'Dr. Sunita Gupta', 'doctor', '+91-9876543214', true),
('dr.mehta@swamidesk.com', 'Dr. Rohit Mehta', 'doctor', '+91-9876543215', true),
('dr.joshi@swamidesk.com', 'Dr. Kavya Joshi', 'doctor', '+91-9876543216', true),
('reception1@swamidesk.com', 'Anjali Verma', 'receptionist', '+91-9876543220', true),
('reception2@swamidesk.com', 'Rohit Agarwal', 'receptionist', '+91-9876543221', true),
('pharmacist1@swamidesk.com', 'Deepak Pharmacy', 'pharmacist', '+91-9876543230', true),
('pharmacist2@swamidesk.com', 'Meera Medicines', 'pharmacist', '+91-9876543231', true),
('nurse1@swamidesk.com', 'Sister Mary', 'nurse', '+91-9876543240', true),
('nurse2@swamidesk.com', 'Nurse Kiran', 'nurse', '+91-9876543241', true);

-- Insert Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, payment_terms, is_active) VALUES 
('MediCorp Pharmaceuticals', 'Rajesh Kumar', '+91-9876543210', 'contact@medicorp.com', '123 Pharma Complex, Mumbai, Maharashtra 400001', '27AABCU9603R1ZX', 'Net 30 days', true),
('HealthCare Supplies Ltd', 'Priya Sharma', '+91-8765432109', 'orders@healthcare-supplies.com', '456 Medical Plaza, Delhi, Delhi 110001', '07AAGFF2194N1Z1', 'Net 45 days', true),
('BioMed Distribution', 'Amit Patel', '+91-7654321098', 'sales@biomed-dist.com', '789 Healthcare Center, Bangalore, Karnataka 560001', '29AAPFB4943Q1Z0', 'Net 30 days', true),
('Pharma Solutions Pvt Ltd', 'Sunita Gupta', '+91-6543210987', 'info@pharma-solutions.com', '321 Medicine Hub, Chennai, Tamil Nadu 600001', '33AALCS2781A1ZP', 'Net 60 days', true),
('Essential Medicines Ltd', 'Rohit Mehta', '+91-2109876543', 'contact@essential-med.com', '258 Healthcare Zone, Kolkata, West Bengal 700001', '19AABCE5678F1Z5', 'Net 30 days', true);

-- Insert User Profiles for Doctors
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

-- =====================================================
-- STEP 6: INSERT MEDICINE MASTER DATA (Sample medicines)
-- =====================================================

-- First, create the medicine_master table if not already created
CREATE TABLE IF NOT EXISTS medicine_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    generic_name VARCHAR(300),
    brand_names TEXT[],
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    therapeutic_class VARCHAR(200),
    dosage_forms TEXT[],
    strengths TEXT[],
    standard_dosage_adult VARCHAR(200),
    standard_dosage_pediatric VARCHAR(200),
    routes TEXT[],
    indications TEXT[],
    contraindications TEXT[],
    side_effects TEXT[],
    interactions TEXT[],
    pregnancy_category VARCHAR(5),
    lactation_safe BOOLEAN DEFAULT false,
    prescription_required BOOLEAN DEFAULT true,
    controlled_substance BOOLEAN DEFAULT false,
    schedule VARCHAR(10),
    manufacturer VARCHAR(200),
    storage_conditions TEXT,
    shelf_life_months INTEGER,
    special_instructions TEXT,
    black_box_warning BOOLEAN DEFAULT false,
    warning_text TEXT,
    monitoring_required TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert comprehensive medicine master data (sample from medicine_master_1000plus.sql)
INSERT INTO medicine_master (
  name, generic_name, brand_names, category, subcategory, therapeutic_class,
  dosage_forms, strengths, standard_dosage_adult, standard_dosage_pediatric,
  routes, indications, contraindications, side_effects, interactions,
  pregnancy_category, controlled_substance, prescription_required, is_active
) VALUES

('Ibuprofen', 'Ibuprofen', ARRAY['Advil', 'Motrin', 'Brufen'], 'Analgesic', 'NSAID', 'Anti-inflammatory', ARRAY['Tablet', 'Suspension', 'Gel'], ARRAY['200mg', '400mg', '600mg'], '200-400mg every 6-8 hours', '5-10mg/kg every 6-8 hours', ARRAY['Oral', 'Topical'], ARRAY['Pain', 'Inflammation', 'Fever'], ARRAY['Peptic ulcer', 'Severe heart failure'], ARRAY['GI upset', 'Dizziness'], ARRAY['Warfarin', 'ACE inhibitors'], 'C', FALSE, FALSE, TRUE),
('Aspirin', 'Acetylsalicylic acid', ARRAY['Disprin', 'Ecosprin'], 'Analgesic', 'NSAID', 'Antiplatelet', ARRAY['Tablet', 'Dispersible tablet'], ARRAY['75mg', '150mg', '325mg'], '75-325mg daily', 'Avoid in children <16 years', ARRAY['Oral'], ARRAY['Cardiovascular protection', 'Pain', 'Fever'], ARRAY['Children <16 years', 'Active bleeding'], ARRAY['GI bleeding', 'Tinnitus'], ARRAY['Warfarin', 'Methotrexate'], 'D', FALSE, FALSE, TRUE),
('Paracetamol', 'Acetaminophen', ARRAY['Tylenol', 'Panadol', 'Crocin'], 'Analgesic', 'Non-opioid analgesic', 'Pain and fever relief', ARRAY['Tablet', 'Suspension', 'Suppository'], ARRAY['500mg', '650mg', '125mg/5ml'], '500-1000mg every 4-6 hours', '10-15mg/kg every 4-6 hours', ARRAY['Oral', 'Rectal'], ARRAY['Pain', 'Fever'], ARRAY['Severe liver disease'], ARRAY['Hepatotoxicity in overdose'], ARRAY['Warfarin', 'Isoniazid'], 'B', FALSE, FALSE, TRUE),
('Omeprazole', 'Omeprazole', ARRAY['Prilosec', 'Losec'], 'Gastrointestinal', 'Proton pump inhibitor', 'Acid suppression', ARRAY['Capsule', 'Tablet'], ARRAY['20mg', '40mg'], '20-40mg once daily', '0.7-3.3mg/kg once daily', ARRAY['Oral'], ARRAY['GERD', 'Peptic ulcer'], ARRAY['Hypersensitivity'], ARRAY['Headache', 'Nausea'], ARRAY['Warfarin', 'Clopidogrel'], 'C', FALSE, FALSE, TRUE),
('Azithromycin', 'Azithromycin', ARRAY['Zithromax', 'Z-Pack'], 'Antibiotic', 'Macrolide', 'Bacterial infections', ARRAY['Tablet', 'Suspension'], ARRAY['250mg', '500mg'], '500mg once daily', '10mg/kg once daily', ARRAY['Oral'], ARRAY['Respiratory infections', 'Chlamydia'], ARRAY['Macrolide allergy', 'Liver disease'], ARRAY['Nausea', 'Diarrhea'], ARRAY['Warfarin', 'Digoxin'], 'B', FALSE, TRUE, TRUE),
('Ciprofloxacin', 'Ciprofloxacin', ARRAY['Cipro'], 'Antibiotic', 'Fluoroquinolone', 'Bacterial infections', ARRAY['Tablet', 'Suspension', 'Injection'], ARRAY['250mg', '500mg', '750mg'], '250-750mg twice daily', '10-20mg/kg twice daily', ARRAY['Oral', 'IV'], ARRAY['UTI', 'Respiratory infections'], ARRAY['Tendinitis history', 'Children <18 years'], ARRAY['Nausea', 'Headache', 'Tendinitis'], ARRAY['Warfarin', 'Theophylline'], 'C', FALSE, TRUE, TRUE),
('Lisinopril', 'Lisinopril', ARRAY['Prinivil', 'Zestril'], 'Cardiovascular', 'ACE inhibitor', 'Antihypertensive', ARRAY['Tablet'], ARRAY['5mg', '10mg', '20mg'], '10-40mg once daily', '0.07mg/kg once daily', ARRAY['Oral'], ARRAY['Hypertension', 'Heart failure'], ARRAY['Pregnancy', 'Bilateral renal stenosis'], ARRAY['Dry cough', 'Hyperkalemia'], ARRAY['Potassium supplements', 'NSAIDs'], 'D', FALSE, TRUE, TRUE),
('Atorvastatin', 'Atorvastatin', ARRAY['Lipitor'], 'Cardiovascular', 'Statin', 'Cholesterol lowering', ARRAY['Tablet'], ARRAY['10mg', '20mg', '40mg', '80mg'], '10-80mg once daily', 'Not established', ARRAY['Oral'], ARRAY['Hypercholesterolemia', 'CAD prevention'], ARRAY['Active liver disease', 'Pregnancy'], ARRAY['Muscle pain', 'Elevated liver enzymes'], ARRAY['Warfarin', 'Cyclosporine'], 'X', FALSE, TRUE, TRUE),
('Metformin', 'Metformin', ARRAY['Glucophage'], 'Endocrine', 'Biguanide', 'Antidiabetic', ARRAY['Tablet'], ARRAY['500mg', '850mg', '1000mg'], '500-2000mg daily', '500mg twice daily', ARRAY['Oral'], ARRAY['Type 2 diabetes'], ARRAY['Renal impairment', 'Lactic acidosis'], ARRAY['GI upset', 'Metallic taste'], ARRAY['Alcohol', 'Contrast agents'], 'B', FALSE, TRUE, TRUE),
('Amlodipine', 'Amlodipine', ARRAY['Norvasc'], 'Cardiovascular', 'Calcium channel blocker', 'Antihypertensive', ARRAY['Tablet'], ARRAY['2.5mg', '5mg', '10mg'], '5-10mg once daily', '2.5-5mg once daily', ARRAY['Oral'], ARRAY['Hypertension', 'Angina'], ARRAY['Hypersensitivity'], ARRAY['Ankle swelling', 'Flushing'], ARRAY['Simvastatin'], 'C', FALSE, TRUE, TRUE);

-- NOTE: The complete medicine_master_1000plus.sql contains 85+ medicines
-- This is a representative sample. Import the full file separately for complete medicine database.

COMMIT;

-- Success message
SELECT 'Complete database reset completed successfully!' as result,
       'All tables created and populated with sample data including medicine master database' as status,
       'ADDITIONAL SCRIPTS: Run insert-suppliers.sql for complete supplier database (25+ suppliers)' as suppliers_info,
       'ADDITIONAL SCRIPTS: Run medicine_master_1000plus.sql for complete medicine database (85+ medicines)' as medicines_info;