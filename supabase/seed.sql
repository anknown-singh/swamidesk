-- =====================================================
-- SwamIDesk Essential Seed Data
-- =====================================================
-- This file contains essential data needed for basic system functionality
-- Run after schema.sql to populate the database with minimal required data

BEGIN;

-- =====================================================
-- STEP 1: Essential System Users
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
-- STEP 2: Doctor Profiles
-- =====================================================

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
-- STEP 3: Essential Medicine Suppliers
-- =====================================================

-- Insert essential suppliers for pharmacy operations
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, payment_terms, is_active) VALUES 

-- Major Pharmaceutical Suppliers
('MediCorp Pharmaceuticals Ltd', 'Rajesh Kumar', '+91-9876543210', 'rajesh.kumar@medicorp.com', '123 Pharma Complex, Andheri West, Mumbai, Maharashtra 400058', '27AABCU9603R1ZX', 'Net 30 days', true),
('HealthCare Supplies Ltd', 'Priya Sharma', '+91-8765432109', 'orders@healthcare-supplies.com', '456 Medical Plaza, Connaught Place, New Delhi, Delhi 110001', '07AAGFF2194N1Z1', 'Net 45 days', true),
('BioMed Distribution Pvt Ltd', 'Amit Patel', '+91-7654321098', 'amit.patel@biomed-dist.com', '789 Healthcare Center, Electronic City, Bangalore, Karnataka 560100', '29AAPFB4943Q1Z0', 'Net 30 days', true),

-- Regional Distributors
('Apollo Pharmacy Distribution', 'Kavitha Reddy', '+91-4012345678', 'kavitha@apollo-dist.com', '147 Apollo Complex, Banjara Hills, Hyderabad, Telangana 500034', '36AABCA1326J1ZQ', 'Net 21 days', true),
('Cipla Regional Office', 'Manish Singh', '+91-2267890123', 'manish.singh@cipla.com', '654 Cipla House, Worli, Mumbai, Maharashtra 400025', '27AACCG1234M1Z3', 'Net 45 days', true),

-- Generic Medicine Suppliers
('Generic Medicine Co', 'Anita Sharma', '+91-4321098765', 'anita@generic-med.com', '357 Generic Plaza, Koregaon Park, Pune, Maharashtra 411001', '27EEFGF9012J1Z9', 'Net 30 days', true);

-- =====================================================
-- STEP 4: Essential Medicines
-- =====================================================

-- Insert essential commonly used medicines using simple category varchar field
INSERT INTO medicines (name, category, manufacturer, batch_number, expiry_date, unit_price, stock_quantity, minimum_stock, dosage_form, strength, is_active) VALUES
-- Pain Relief Medicines
('Paracetamol 500mg', 'Pain Relief', 'GlaxoSmithKline', 'PC2024001', '2025-12-31', 2.50, 500, 50, 'Tablet', '500mg', true),
('Ibuprofen 400mg', 'Pain Relief', 'Abbott', 'IB2024001', '2025-11-30', 3.50, 300, 50, 'Tablet', '400mg', true),
('Aspirin 325mg', 'Pain Relief', 'Reckitt Benckiser', 'AS2024001', '2025-09-30', 1.80, 400, 60, 'Tablet', '325mg', true),

-- Antibiotics
('Amoxicillin 500mg', 'Antibiotics', 'GlaxoSmithKline', 'AX2024001', '2025-10-31', 8.00, 200, 30, 'Capsule', '500mg', true),
('Azithromycin 500mg', 'Antibiotics', 'Dr Reddys', 'AZ2024001', '2025-07-31', 28.33, 150, 25, 'Tablet', '500mg', true),
('Ciprofloxacin 500mg', 'Antibiotics', 'Ranbaxy', 'CF2024001', '2025-06-30', 9.50, 120, 20, 'Tablet', '500mg', true),

-- Cardiovascular
('Amlodipine 5mg', 'Cardiovascular', 'Pfizer', 'AM2024001', '2026-03-31', 4.50, 150, 25, 'Tablet', '5mg', true),
('Atenolol 50mg', 'Cardiovascular', 'Cipla', 'AT2024001', '2025-12-31', 3.20, 180, 30, 'Tablet', '50mg', true),

-- Diabetes
('Metformin 500mg', 'Diabetes', 'Bristol Myers Squibb', 'MF2024001', '2025-08-31', 1.50, 300, 40, 'Tablet', '500mg', true),
('Glimepiride 1mg', 'Diabetes', 'Sanofi', 'GL2024001', '2025-10-31', 4.25, 200, 35, 'Tablet', '1mg', true),

-- Respiratory
('Salbutamol Inhaler', 'Respiratory', 'GlaxoSmithKline', 'SB2024001', '2025-06-30', 125.00, 50, 10, 'Inhaler', '100mcg', true),
('Montelukast 10mg', 'Respiratory', 'Merck', 'MT2024001', '2025-09-30', 12.50, 100, 20, 'Tablet', '10mg', true),

-- Gastrointestinal
('Omeprazole 20mg', 'Gastrointestinal', 'AstraZeneca', 'OM2024001', '2025-07-31', 5.50, 150, 25, 'Capsule', '20mg', true),
('Domperidone 10mg', 'Gastrointestinal', 'Sun Pharma', 'DP2024001', '2025-08-31', 2.80, 200, 30, 'Tablet', '10mg', true),

-- General/Common medicines
('Cetirizine 10mg', 'Antihistamine', 'Johnson & Johnson', 'CT2024001', '2025-11-30', 1.20, 400, 50, 'Tablet', '10mg', true),
('Multivitamin', 'Vitamins', 'Pfizer', 'MV2024001', '2025-12-31', 8.00, 150, 25, 'Tablet', 'Multi', true);

-- =====================================================
-- STEP 6: Essential Medical Services
-- =====================================================

-- Insert basic medical services
INSERT INTO services (name, description, category, estimated_duration, price, department, is_active) VALUES
('General Consultation', 'Basic doctor consultation for general health issues', 'Consultation', 30, 500.00, 'General Medicine', true),
('Cardiac Consultation', 'Specialized consultation for heart-related conditions', 'Consultation', 45, 800.00, 'Cardiology', true),
('Pediatric Consultation', 'Child healthcare consultation', 'Consultation', 30, 600.00, 'Pediatrics', true),
('Orthopedic Consultation', 'Bone and joint related consultation', 'Consultation', 40, 1000.00, 'Orthopedics', true),
('Blood Test - Complete Blood Count', 'Comprehensive blood analysis', 'Laboratory', 15, 300.00, 'Laboratory', true),
('X-Ray Chest', 'Chest X-ray imaging', 'Radiology', 20, 400.00, 'Radiology', true);

-- =====================================================
-- STEP 7: Essential Suppliers Data
-- =====================================================

-- Insert comprehensive supplier data for pharmacy operations
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, payment_terms, is_active) VALUES 

-- Major Pharmaceutical Suppliers
('MediCorp Pharmaceuticals Ltd', 'Rajesh Kumar', '+91-9876543210', 'rajesh.kumar@medicorp.com', '123 Pharma Complex, Andheri West, Mumbai, Maharashtra 400058', '27AABCU9603R1ZX', 'Net 30 days', true),
('HealthCare Supplies Ltd', 'Priya Sharma', '+91-8765432109', 'orders@healthcare-supplies.com', '456 Medical Plaza, Connaught Place, New Delhi, Delhi 110001', '07AAGFF2194N1Z1', 'Net 45 days', true),
('BioMed Distribution Pvt Ltd', 'Amit Patel', '+91-7654321098', 'amit.patel@biomed-dist.com', '789 Healthcare Center, Electronic City, Bangalore, Karnataka 560100', '29AAPFB4943Q1Z0', 'Net 30 days', true),
('Pharma Solutions Pvt Ltd', 'Sunita Gupta', '+91-6543210987', 'info@pharma-solutions.com', '321 Medicine Hub, T. Nagar, Chennai, Tamil Nadu 600017', '33AALCS2781A1ZP', 'Net 60 days', true),
('Essential Medicines Ltd', 'Rohit Mehta', '+91-2109876543', 'contact@essential-med.com', '258 Healthcare Zone, Park Street, Kolkata, West Bengal 700016', '19AABCE5678F1Z5', 'Net 30 days', true),

-- Regional Distributors
('Apollo Pharmacy Distribution', 'Kavitha Reddy', '+91-4012345678', 'kavitha@apollo-dist.com', '147 Apollo Complex, Banjara Hills, Hyderabad, Telangana 500034', '36AABCA1326J1ZQ', 'Net 21 days', true),
('Cipla Regional Office', 'Manish Singh', '+91-2267890123', 'manish.singh@cipla.com', '654 Cipla House, Worli, Mumbai, Maharashtra 400025', '27AACCG1234M1Z3', 'Net 45 days', true),
('Sun Pharma Distributors', 'Deepika Jain', '+91-7912345678', 'deepika@sunpharma-dist.com', '987 Sun Tower, C.G. Road, Ahmedabad, Gujarat 380009', '24AAHCN2345P1Z4', 'Net 30 days', true),

-- Specialty Medicine Suppliers
('Oncology Specialties Ltd', 'Dr. Ramesh Nair', '+91-8033445566', 'ramesh@onco-special.com', '159 Cancer Care Center, Jayanagar, Bangalore, Karnataka 560011', '29BBCDE6789G1Z6', 'Net 15 days', true),
('Cardiac Care Medicines', 'Neha Agarwal', '+91-1123456789', 'neha@cardiac-meds.com', '753 Heart Institute, Lajpat Nagar, New Delhi, Delhi 110024', '07CCDDE7890H1Z7', 'Net 30 days', true),
('Diabetic Care Solutions', 'Suresh Pillai', '+91-9876541234', 'suresh@diabetic-care.com', '951 Diabetes Center, Marine Drive, Mumbai, Maharashtra 400020', '27DDEFE8901I1Z8', 'Net 45 days', true),

-- Generic Medicine Suppliers
('Generic Medicine Co', 'Anita Sharma', '+91-4321098765', 'anita@generic-med.com', '357 Generic Plaza, Koregaon Park, Pune, Maharashtra 411001', '27EEFGF9012J1Z9', 'Net 30 days', true),
('Universal Generics Ltd', 'Vikram Malhotra', '+91-1234567890', 'vikram@universal-gen.com', '852 Universal Tower, Sector 18, Noida, Uttar Pradesh 201301', '09FFGHG0123K1ZA', 'Net 60 days', true),
('Quality Generics Pvt Ltd', 'Meera Krishnan', '+91-4428765432', 'meera@quality-gen.com', '741 Quality Complex, Anna Salai, Chennai, Tamil Nadu 600002', '33GGHIH1234L1ZB', 'Net 45 days', true),

-- International Suppliers
('Global Pharma Imports', 'David Wilson', '+91-9988776655', 'david@global-pharma.com', '963 International Trade Center, BKC, Mumbai, Maharashtra 400051', '27HHIJI2345M1ZC', 'Net 90 days', true),
('European Medicines Ltd', 'Sarah Johnson', '+91-8877665544', 'sarah@euro-meds.com', '159 Euro Plaza, Cyber City, Gurgaon, Haryana 122002', '06IIJKJ3456N1ZD', 'Net 75 days', true),

-- Ayurvedic & Herbal Suppliers  
('Ayurvedic Wellness Ltd', 'Guru Prasad', '+91-8033221100', 'guru@ayur-wellness.com', '753 Ayurveda Complex, Jayanagar, Bangalore, Karnataka 560070', '29JJKLK4567O1ZE', 'Net 30 days', true),
('Herbal Solutions Pvt Ltd', 'Priyanka Das', '+91-3322110099', 'priyanka@herbal-sol.com', '951 Herbal Center, Salt Lake, Kolkata, West Bengal 700064', '19KKLML5678P1ZF', 'Net 21 days', true),

-- Medical Equipment Suppliers (also supply medicines)
('MedEquip Solutions', 'Ravi Gupta', '+91-1122334455', 'ravi@medequip.com', '357 Equipment Plaza, Karol Bagh, New Delhi, Delhi 110005', '07LLMNM6789Q1ZG', 'Net 30 days', true),
('Healthcare Instruments Ltd', 'Pooja Reddy', '+91-4455667788', 'pooja@healthcare-inst.com', '852 Instrument Complex, Banjara Hills, Hyderabad, Telangana 500082', '36MMNOM7890R1ZH', 'Net 45 days', true),

-- Emergency Medicine Suppliers
('Emergency Care Supplies', 'Rajiv Sharma', '+91-9876543210', 'rajiv@emergency-care.com', '951 Emergency Complex, AIIMS Road, New Delhi, Delhi 110029', '07RRSTST2345W1ZM', 'Net 7 days', true),
('Critical Care Medicines', 'Anjali Singh', '+91-8765432109', 'anjali@critical-care.com', '357 Critical Plaza, Medical Square, Mumbai, Maharashtra 400012', '27SSTUTU3456X1ZN', 'Net 15 days', true);

-- =====================================================
-- STEP 8: Essential System Settings (Skipped)
-- =====================================================
-- Note: system_settings table not found in schema, skipping for now

COMMIT;

-- Success message
SELECT 
    'Essential seed data inserted successfully!' as result,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM medicines) as total_medicines,
    (SELECT COUNT(*) FROM services) as total_services;