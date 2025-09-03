-- SwamIDesk Suppliers Data Population Script
-- Inserts comprehensive supplier data for pharmacy purchase orders
-- Run after suppliers table is created
-- 
-- OBJECTIVE: Populate suppliers table with comprehensive supplier data for purchase order functionality

BEGIN;

-- =====================================================
-- STEP 1: Create suppliers table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
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

-- =====================================================
-- STEP 2: Insert Comprehensive Supplier Data
-- =====================================================

-- Clear existing data (optional - remove this line if you want to keep existing suppliers)
-- DELETE FROM suppliers;

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

-- Regional Pharmacy Chains
('Wellness Pharmacy Chain', 'Arjun Nair', '+91-4847382910', 'arjun@wellness-chain.com', '741 Wellness Plaza, MG Road, Kochi, Kerala 682016', '32NNOPO8901S1ZI', 'Net 15 days', true),
('LifeCare Distributors', 'Rashmi Joshi', '+91-2025467891', 'rashmi@lifecare-dist.com', '963 LifeCare Tower, FC Road, Pune, Maharashtra 411005', '27OOPQP9012T1ZJ', 'Net 30 days', true),

-- Laboratory & Diagnostic Suppliers
('PathLab Supplies Ltd', 'Dr. Sunil Kumar', '+91-5544332211', 'sunil@pathlab-sup.com', '159 PathLab Center, Malviya Nagar, Jaipur, Rajasthan 302017', '08PPQRQ0123U1ZK', 'Net 21 days', true),
('Diagnostic Solutions', 'Nisha Gupta', '+91-9900112233', 'nisha@diag-solutions.com', '753 Diagnostic Plaza, Richmond Road, Bangalore, Karnataka 560025', '29QQRSR1234V1ZL', 'Net 30 days', true),

-- Emergency Medicine Suppliers
('Emergency Care Supplies', 'Rajiv Sharma', '+91-9876543210', 'rajiv@emergency-care.com', '951 Emergency Complex, AIIMS Road, New Delhi, Delhi 110029', '07RRSTST2345W1ZM', 'Net 7 days', true),
('Critical Care Medicines', 'Anjali Singh', '+91-8765432109', 'anjali@critical-care.com', '357 Critical Plaza, Medical Square, Mumbai, Maharashtra 400012', '27SSTUTU3456X1ZN', 'Net 15 days', true),

-- Veterinary Medicine Suppliers (for clinic expansion)
('Animal Healthcare Ltd', 'Prakash Rao', '+91-9988776655', 'prakash@animal-health.com', '852 Veterinary Complex, Residency Road, Bangalore, Karnataka 560025', '29TTUVU4567Y1ZO', 'Net 45 days', true);

-- =====================================================
-- STEP 3: Update timestamps for existing records
-- =====================================================

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- =====================================================
-- STEP 4: Create useful indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_gst_number ON suppliers(gst_number);
CREATE INDEX IF NOT EXISTS idx_suppliers_contact_person ON suppliers(contact_person);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);

COMMIT;

-- Success message
SELECT 'Suppliers database populated successfully!' as result,
       (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as active_suppliers,
       (SELECT COUNT(*) FROM suppliers) as total_suppliers;