-- ============================================================================
-- SwamiCare Complete Database Setup Script
-- Copy this entire file and paste it into your Supabase SQL Editor
-- This will create all tables, policies, and demo data in one go
-- ============================================================================

-- STEP 1: CREATE SCHEMA AND TABLES
-- ============================================================================

-- Create custom enums for type safety
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
CREATE TYPE visit_status AS ENUM ('waiting', 'in_consultation', 'services_pending', 'completed', 'billed');
CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE treatment_status AS ENUM ('planned', 'active', 'completed', 'paused');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'insurance', 'bank_transfer');

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
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
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visits table (appointment/consultation records)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES user_profiles(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME,
    status visit_status DEFAULT 'waiting',
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    queue_number INTEGER,
    estimated_wait_time INTEGER, -- in minutes
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (procedures, tests, treatments offered)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'consultation', 'procedure', 'test', 'therapy'
    duration INTEGER, -- in minutes
    price DECIMAL(10,2),
    department VARCHAR(100), -- e.g., 'ENT', 'Dental', 'General'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit services (services provided during a visit)
CREATE TABLE visit_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_to UUID REFERENCES user_profiles(id), -- service attendant
    status service_status DEFAULT 'assigned',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    price DECIMAL(10,2), -- can override service price
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
    unit_price DECIMAL(8,2),
    stock_quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
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
    dosage VARCHAR(100), -- e.g., "1 tablet twice daily"
    duration VARCHAR(50), -- e.g., "7 days"
    instructions TEXT,
    prescribed_by UUID REFERENCES user_profiles(id), -- doctor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pharmacy issues (medicine dispensing records)
CREATE TABLE pharmacy_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    quantity_issued INTEGER NOT NULL,
    issued_by UUID REFERENCES user_profiles(id), -- pharmacist
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans table
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    doctor_id UUID REFERENCES user_profiles(id),
    status treatment_status DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    total_sessions INTEGER,
    session_duration INTEGER, -- in minutes
    frequency VARCHAR(100), -- e.g., "weekly", "daily"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment sessions table
CREATE TABLE treatment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    conducted_by UUID REFERENCES user_profiles(id),
    status service_status DEFAULT 'assigned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table (billing)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    visit_id UUID REFERENCES visits(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom functions
CREATE OR REPLACE FUNCTION generate_patient_number() 
RETURNS VARCHAR(20) AS $$
DECLARE
    new_number VARCHAR(20);
    counter INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM patients;
    new_number := 'P' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(counter::TEXT, 4, '0');
    
    WHILE EXISTS (SELECT 1 FROM patients WHERE patient_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'P' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(counter::TEXT, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_visit_number() 
RETURNS VARCHAR(20) AS $$
DECLARE
    new_number VARCHAR(20);
    counter INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM visits WHERE visit_date = CURRENT_DATE;
    new_number := 'V' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    
    WHILE EXISTS (SELECT 1 FROM visits WHERE visit_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'V' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS VARCHAR(30) AS $$
DECLARE
    new_number VARCHAR(30);
    counter INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO counter FROM invoices WHERE DATE(created_at) = CURRENT_DATE;
    new_number := 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    
    WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic number generation
CREATE OR REPLACE FUNCTION set_patient_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
        NEW.patient_number := generate_patient_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_visit_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visit_number IS NULL OR NEW.visit_number = '' THEN
        NEW.visit_number := generate_visit_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_invoice_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_number();

CREATE TRIGGER trigger_set_visit_number
    BEFORE INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION set_visit_number();

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visit_services_updated_at
    BEFORE UPDATE ON visit_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_treatment_plans_updated_at
    BEFORE UPDATE ON treatment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_treatment_sessions_updated_at
    BEFORE UPDATE ON treatment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_date_status ON visits(visit_date, status);
CREATE INDEX idx_visit_services_visit_id ON visit_services(visit_id);
CREATE INDEX idx_visit_services_assigned_to ON visit_services(assigned_to);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_pharmacy_issues_prescription_id ON pharmacy_issues(prescription_id);
CREATE INDEX idx_treatment_sessions_plan_id ON treatment_sessions(treatment_plan_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_visit_id ON invoices(visit_id);

-- STEP 2: ENABLE ROW LEVEL SECURITY AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Patients Policies
CREATE POLICY "patients_select_policy" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "patients_insert_policy" ON patients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "patients_update_policy" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

-- Visits Policies
CREATE POLICY "visits_select_policy" ON visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "visits_insert_policy" ON visits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "visits_update_policy" ON visits
    FOR UPDATE USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

-- Services Policies
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

-- Visit Services Policies
CREATE POLICY "visit_services_select_policy" ON visit_services
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id AND v.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "visit_services_insert_policy" ON visit_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "visit_services_update_policy" ON visit_services
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id AND v.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

-- Medicines Policies
CREATE POLICY "medicines_select_policy" ON medicines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "medicines_insert_policy" ON medicines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "medicines_update_policy" ON medicines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

-- Prescriptions Policies
CREATE POLICY "prescriptions_select_policy" ON prescriptions
    FOR SELECT USING (
        prescribed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "prescriptions_insert_policy" ON prescriptions
    FOR INSERT WITH CHECK (
        prescribed_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

CREATE POLICY "prescriptions_update_policy" ON prescriptions
    FOR UPDATE USING (
        prescribed_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

-- Pharmacy Issues Policies
CREATE POLICY "pharmacy_issues_select_policy" ON pharmacy_issues
    FOR SELECT USING (
        issued_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "pharmacy_issues_insert_policy" ON pharmacy_issues
    FOR INSERT WITH CHECK (
        issued_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'pharmacist'
            AND up.is_active = true
        )
    );

CREATE POLICY "pharmacy_issues_update_policy" ON pharmacy_issues
    FOR UPDATE USING (
        issued_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'pharmacist'
            AND up.is_active = true
        )
    );

-- Treatment Plans Policies
CREATE POLICY "treatment_plans_select_policy" ON treatment_plans
    FOR SELECT USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'service_attendant')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_plans_insert_policy" ON treatment_plans
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_plans_update_policy" ON treatment_plans
    FOR UPDATE USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

-- Treatment Sessions Policies
CREATE POLICY "treatment_sessions_select_policy" ON treatment_sessions
    FOR SELECT USING (
        conducted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM treatment_plans tp 
            WHERE tp.id = treatment_plan_id AND tp.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_sessions_insert_policy" ON treatment_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor', 'service_attendant')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_sessions_update_policy" ON treatment_sessions
    FOR UPDATE USING (
        conducted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM treatment_plans tp 
            WHERE tp.id = treatment_plan_id AND tp.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'service_attendant')
            AND up.is_active = true
        )
    );

-- Invoices Policies
CREATE POLICY "invoices_select_policy" ON invoices
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "invoices_insert_policy" ON invoices
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "invoices_update_policy" ON invoices
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

-- STEP 3: INSERT DEMO DATA
-- ============================================================================

-- Insert demo users into auth.users table
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
('Ibuprofen 400mg', 'Ibuprofen', 'Dr. Reddys', 'NSAID', 'Tablet', '400mg', 3.50, 500, 50),
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

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- 
-- Your SwamiCare database is now ready with:
-- ✅ 11 tables with relationships and triggers
-- ✅ Row Level Security policies for all tables
-- ✅ 5 demo user accounts (password: password123)
-- ✅ Sample services, medicines, patients, and visits
-- ✅ Complete clinic workflow example
--
-- Next steps:
-- 1. Run: npm run dev  
-- 2. Go to: http://localhost:3000
-- 3. Login with: admin@swamicare.com / password123
-- 
-- Demo accounts ready:
-- 👤 Admin: admin@swamicare.com
-- 👨‍⚕️ Doctor: doctor@swamicare.com  
-- 👩‍💼 Receptionist: receptionist@swamicare.com
-- 👨‍🔧 Attendant: attendant@swamicare.com
-- 💊 Pharmacist: pharmacist@swamicare.com
-- ============================================================================