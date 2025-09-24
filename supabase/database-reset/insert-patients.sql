-- =====================================================
-- SwamIDesk Patients Data Population Script
-- =====================================================
-- Inserts comprehensive sample patient data for testing
-- Run after patients table is created
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Insert Sample Patients
-- =====================================================

-- Patient 1: Adult Male with Diabetes
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Rajesh Kumar Singh',
    '1985-03-15',
    'Male',
    '+91-9876543210',
    'rajesh.kumar@email.com',
    '123 MG Road, Sector 15, Gurgaon, Haryana 122001',
    'Priya Singh',
    '+91-9876543211',
    'B+',
    ARRAY['Penicillin', 'Shellfish'],
    'Type 2 Diabetes (diagnosed 2020), Hypertension',
    'HDFC ERGO Health Insurance',
    'HDFC-HI-2024-001',
    true
);

-- Patient 2: Young Female with Asthma
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Anita Sharma',
    '1992-07-22',
    'Female',
    '+91-9123456789',
    'anita.sharma@gmail.com',
    '45 Nehru Place, New Delhi 110019',
    'Suresh Sharma',
    '+91-9123456790',
    'O-',
    ARRAY['Dust mites', 'Pollen'],
    'Bronchial Asthma since childhood, Seasonal allergies',
    'Star Health Insurance',
    'STAR-2024-00456',
    true
);

-- Patient 3: Senior Citizen with Multiple Conditions
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Dr. Ramesh Gupta',
    '1955-12-08',
    'Male',
    '+91-9998887776',
    'ramesh.gupta@yahoo.com',
    '78 Civil Lines, Ludhiana, Punjab 141001',
    'Sunita Gupta',
    '+91-9998887777',
    'A+',
    ARRAY['Aspirin'],
    'Coronary Artery Disease (2018), Diabetes Type 2 (2015), Arthritis, Previous MI (2019)',
    'Bajaj Allianz Health Insurance',
    'BAJAJ-SR-2024-789',
    true
);

-- Patient 4: Middle-aged Female
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Meera Patel',
    '1978-09-30',
    'Female',
    '+91-8877665544',
    'meera.patel@hotmail.com',
    '56 SG Highway, Ahmedabad, Gujarat 380015',
    'Kiran Patel',
    '+91-8877665545',
    'AB-',
    ARRAY['Latex'],
    'Thyroid disorder (Hypothyroidism), PCOD',
    'ICICI Lombard Health Insurance',
    'ICICI-WH-2024-234',
    true
);

-- Patient 5: Young Adult Male
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Arjun Reddy',
    '1995-11-12',
    'Male',
    '+91-7766554433',
    'arjun.reddy@outlook.com',
    '90 Hi-Tech City, Hyderabad, Telangana 500081',
    'Lakshmi Reddy',
    '+91-7766554434',
    'O+',
    ARRAY[]::TEXT[],
    'No significant medical history',
    'Religare Health Insurance',
    'RELI-YA-2024-567',
    true
);

-- Patient 6: Elderly Female with Heart Condition
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Kamala Devi',
    '1948-04-25',
    'Female',
    '+91-6655443322',
    NULL,
    '34 Linking Road, Mumbai, Maharashtra 400050',
    'Ravi Devi',
    '+91-6655443323',
    'B-',
    ARRAY['Iodine', 'Sulfa drugs'],
    'Atrial Fibrillation, Osteoporosis, Cataract surgery (both eyes)',
    'New India Assurance Health',
    'NIA-ELD-2024-890',
    true
);

-- Patient 7: Pregnant Woman
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Priyanka Agarwal',
    '1990-01-18',
    'Female',
    '+91-5544332211',
    'priyanka.agarwal@gmail.com',
    '67 Park Street, Kolkata, West Bengal 700016',
    'Rohit Agarwal',
    '+91-5544332212',
    'A-',
    ARRAY[]::TEXT[],
    'Currently pregnant (Second trimester), Previous normal delivery (2022)',
    'Max Bupa Health Insurance',
    'MAX-PREG-2024-345',
    true
);

-- Patient 8: Child Patient
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Aarav Malhotra',
    '2015-06-10',
    'Male',
    '+91-4433221100',
    NULL,
    '23 Brigade Road, Bangalore, Karnataka 560025',
    'Neha Malhotra',
    '+91-4433221101',
    'AB+',
    ARRAY['Nuts', 'Eggs'],
    'Food allergies, Mild eczema, All vaccinations up to date',
    'Care Health Insurance',
    'CARE-CHILD-2024-123',
    true
);

-- Patient 9: Middle-aged Male with Chronic Conditions
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Sunil Joshi',
    '1972-08-14',
    'Male',
    '+91-3322110099',
    'sunil.joshi@rediffmail.com',
    '89 FC Road, Pune, Maharashtra 411016',
    'Sunita Joshi',
    '+91-3322110098',
    'O-',
    ARRAY['Morphine'],
    'Chronic Kidney Disease Stage 3, Hypertension, Gout',
    'United India Insurance',
    'UII-CKD-2024-678',
    true
);

-- Patient 10: Young Female Student
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Shreya Iyer',
    '2002-02-28',
    'Female',
    '+91-2211009988',
    'shreya.iyer@student.ac.in',
    '45 Anna Nagar, Chennai, Tamil Nadu 600040',
    'Raman Iyer',
    '+91-2211009987',
    'B+',
    ARRAY[]::TEXT[],
    'No significant medical history, Annual health checkup normal',
    'Oriental Insurance Health',
    'ORI-STU-2024-901',
    true
);

-- Add 5 more diverse patients for better testing coverage

-- Patient 11: Senior Male with Vision Issues
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Govind Prasad Mishra',
    '1942-03-05',
    'Male',
    '+91-1100998877',
    NULL,
    '12 Hazratganj, Lucknow, Uttar Pradesh 226001',
    'Radha Mishra',
    '+91-1100998878',
    'A+',
    ARRAY['Contrast dye'],
    'Diabetic Retinopathy, Glaucoma, Diabetes Type 2 (20+ years)',
    'National Insurance Health',
    'NIC-VIS-2024-456',
    true
);

-- Patient 12: Working Professional with Stress Issues
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Vikram Singh Chauhan',
    '1988-10-20',
    'Male',
    '+91-0099887766',
    'vikram.chauhan@techcorp.com',
    '78 Cyber City, Gurgaon, Haryana 122002',
    'Pooja Chauhan',
    '+91-0099887765',
    'O+',
    ARRAY['Antihistamines'],
    'Anxiety disorder, Chronic back pain, Frequent headaches',
    'Apollo Munich Health Insurance',
    'APOLLO-PROF-2024-789',
    true
);

-- Patient 13: Retired Teacher with Joint Problems
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Lakshmi Narayan',
    '1958-07-12',
    'Female',
    '+91-9988776655',
    'lakshmi.narayan@retired.edu',
    '34 Teachers Colony, Jaipur, Rajasthan 302006',
    'Mahesh Narayan',
    '+91-9988776654',
    'AB-',
    ARRAY['NSAIDs'],
    'Rheumatoid Arthritis, Osteoporosis, Hypertension',
    'Life Insurance Corporation Health',
    'LIC-TEACH-2024-234',
    true
);

-- Patient 14: IT Professional with Lifestyle Issues
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Rahul Kapoor',
    '1987-12-03',
    'Male',
    '+91-8877665544',
    'rahul.kapoor@infotech.com',
    '90 Electronic City, Bangalore, Karnataka 560100',
    'Kavya Kapoor',
    '+91-8877665543',
    'B-',
    ARRAY[]::TEXT[],
    'Cervical spondylosis, Eye strain, Sleep disorders, Pre-diabetes',
    'SBI General Health Insurance',
    'SBI-IT-2024-567',
    true
);

-- Patient 15: Homemaker with Women's Health Issues
INSERT INTO patients (
    full_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    blood_group, 
    allergies, 
    medical_history, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES (
    'Sushma Reddy',
    '1983-05-16',
    'Female',
    '+91-7766554433',
    'sushma.reddy@homemail.com',
    '56 Banjara Hills, Hyderabad, Telangana 500034',
    'Anil Reddy',
    '+91-7766554432',
    'A-',
    ARRAY['Iron supplements'],
    'Iron deficiency anemia, Irregular menstrual cycles, Previous C-section (2018)',
    'Tata AIG Health Insurance',
    'TATA-HOME-2024-890',
    true
);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully inserted 15 sample patients!';
    RAISE NOTICE '📊 Patients include diverse age groups, genders, and medical conditions';
    RAISE NOTICE '🏥 All patients have realistic Indian names, addresses, and medical histories';
    RAISE NOTICE '📱 Contact information and insurance details are included';
END $$;