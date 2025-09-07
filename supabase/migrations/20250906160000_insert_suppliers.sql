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

-- Emergency Medicine Suppliers
('Emergency Care Supplies', 'Rajiv Sharma', '+91-9876543210', 'rajiv@emergency-care.com', '951 Emergency Complex, AIIMS Road, New Delhi, Delhi 110029', '07RRSTST2345W1ZM', 'Net 7 days', true),
('Critical Care Medicines', 'Anjali Singh', '+91-8765432109', 'anjali@critical-care.com', '357 Critical Plaza, Medical Square, Mumbai, Maharashtra 400012', '27SSTUTU3456X1ZN', 'Net 15 days', true);

-- Success message
SELECT 'Suppliers data inserted successfully!' as result,
       (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as active_suppliers;