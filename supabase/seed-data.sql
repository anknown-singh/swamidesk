-- Insert Services Master Data
INSERT INTO services (name, category, subcategory, price, duration, description) VALUES
-- ENT Services
('Consultation - ENT', 'ENT', 'General', 500.00, 30, 'General ENT consultation'),
('Ear Cleaning', 'ENT', 'Ear', 300.00, 15, 'Professional ear wax removal'),
('Nasal Endoscopy', 'ENT', 'Nose', 1500.00, 45, 'Diagnostic nasal endoscopy'),
('Throat Examination', 'ENT', 'Throat', 400.00, 20, 'Detailed throat examination'),
('Hearing Test', 'ENT', 'Ear', 800.00, 30, 'Comprehensive hearing assessment'),

-- Dental Services
('Consultation - Dental', 'Dental', 'General', 400.00, 30, 'General dental consultation'),
('Tooth Extraction', 'Dental', 'Surgery', 1200.00, 60, 'Simple tooth extraction'),
('Root Canal Treatment', 'Dental', 'Endodontics', 3500.00, 90, 'Single sitting RCT'),
('Dental Cleaning', 'Dental', 'Preventive', 800.00, 45, 'Professional teeth cleaning'),
('Filling', 'Dental', 'Restorative', 1000.00, 45, 'Composite tooth filling'),
('Crown Placement', 'Dental', 'Restorative', 5000.00, 120, 'Ceramic crown placement'),

-- Cosmetic Services
('Consultation - Cosmetic', 'Cosmetic', 'General', 800.00, 45, 'Cosmetic consultation'),
('Botox Treatment', 'Cosmetic', 'Injectable', 8000.00, 30, 'Botox injection treatment'),
('Chemical Peel', 'Cosmetic', 'Skin', 4000.00, 60, 'Facial chemical peel treatment'),
('Laser Hair Removal', 'Cosmetic', 'Laser', 2500.00, 45, 'Laser hair removal session'),
('Skin Rejuvenation', 'Cosmetic', 'Skin', 6000.00, 90, 'Laser skin rejuvenation');

-- Insert Medicines Master Data
INSERT INTO medicines (name, generic_name, brand, unit_price, unit_type, stock, min_stock_level, supplier) VALUES
-- Common Medicines
('Paracetamol 500mg', 'Paracetamol', 'Crocin', 2.50, 'tablet', 500, 50, 'GSK'),
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 8.00, 'capsule', 200, 20, 'GSK'),
('Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 3.50, 'tablet', 300, 30, 'Abbott'),
('Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 1.20, 'tablet', 400, 40, 'UCB'),
('Omeprazole 20mg', 'Omeprazole', 'Prilosec', 5.50, 'capsule', 150, 25, 'AstraZeneca'),

-- ENT Specific
('Betamethasone Nasal Spray', 'Betamethasone', 'Betnesol', 85.00, 'bottle', 25, 5, 'GSK'),
('Xylometazoline Nasal Drops', 'Xylometazoline', 'Otrivin', 45.00, 'bottle', 40, 10, 'Novartis'),
('Chlorhexidine Mouthwash', 'Chlorhexidine', 'Hexidine', 65.00, 'bottle', 30, 8, 'ICPA'),

-- Dental Specific
('Lignocaine 2% Injection', 'Lignocaine', 'Xylocaine', 15.00, 'vial', 50, 10, 'AstraZeneca'),
('Metronidazole 400mg', 'Metronidazole', 'Flagyl', 4.20, 'tablet', 180, 20, 'Sanofi'),
('Clindamycin 300mg', 'Clindamycin', 'Dalacin', 12.50, 'capsule', 100, 15, 'Pfizer'),

-- Cosmetic/Topical
('Tretinoin 0.025% Cream', 'Tretinoin', 'Retin-A', 180.00, 'tube', 20, 5, 'J&J'),
('Hydroquinone 2% Cream', 'Hydroquinone', 'Eldoquin', 120.00, 'tube', 15, 5, 'ICN'),
('Vitamin C Serum', 'Ascorbic Acid', 'SkinCeuticals', 2500.00, 'bottle', 10, 3, 'L''Oreal');

-- Insert some demo user profiles (These would normally be created through auth signup)
-- You'll need to run this after creating users through Supabase Auth
/*
INSERT INTO user_profiles (id, role, name, email, phone, department, specialization) VALUES
-- Admin
('admin-uuid-here', 'admin', 'Dr. Admin User', 'admin@swamicare.com', '9999999999', 'Administration', 'Administration'),

-- Doctors
('doctor1-uuid-here', 'doctor', 'Dr. Rajesh Kumar', 'dr.rajesh@swamicare.com', '9876543210', 'ENT', 'Otolaryngology'),
('doctor2-uuid-here', 'doctor', 'Dr. Priya Sharma', 'dr.priya@swamicare.com', '9876543211', 'Dental', 'General Dentistry'),
('doctor3-uuid-here', 'doctor', 'Dr. Amit Patel', 'dr.amit@swamicare.com', '9876543212', 'Cosmetic', 'Dermatology'),

-- Receptionist
('receptionist-uuid-here', 'receptionist', 'Ms. Sunita Devi', 'receptionist@swamicare.com', '9876543213', 'Reception', 'Patient Care'),

-- Service Attendants
('attendant1-uuid-here', 'service_attendant', 'Mr. Ravi Kumar', 'ravi@swamicare.com', '9876543214', 'ENT', 'ENT Procedures'),
('attendant2-uuid-here', 'service_attendant', 'Ms. Meera Singh', 'meera@swamicare.com', '9876543215', 'Dental', 'Dental Assistance'),

-- Pharmacist
('pharmacist-uuid-here', 'pharmacist', 'Mr. Suresh Gupta', 'pharmacist@swamicare.com', '9876543216', 'Pharmacy', 'Pharmacy Management');
*/