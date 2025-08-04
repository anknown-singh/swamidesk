-- ============================================================================
-- SwamiCare SAFE Database Setup Script (Handles Existing Objects)
-- Run this if you got "already exists" errors
-- ============================================================================

-- STEP 1: CREATE TYPES (SAFE VERSION - Won't error if they exist)
-- ============================================================================

-- Create custom enums for type safety (IF NOT EXISTS equivalent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visit_status AS ENUM ('waiting', 'in_consultation', 'services_pending', 'completed', 'billed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE treatment_status AS ENUM ('planned', 'active', 'completed', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'insurance', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- STEP 2: CREATE TABLES (SAFE VERSION)
-- ============================================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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
CREATE TABLE IF NOT EXISTS patients (
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

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
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
    estimated_wait_time INTEGER,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration INTEGER,
    price DECIMAL(10,2),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit services table
CREATE TABLE IF NOT EXISTS visit_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_to UUID REFERENCES user_profiles(id),
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
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    manufacturer VARCHAR(200),
    category VARCHAR(100),
    dosage_form VARCHAR(50),
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
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    dosage VARCHAR(100),
    duration VARCHAR(50),
    instructions TEXT,
    prescribed_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pharmacy issues table
CREATE TABLE IF NOT EXISTS pharmacy_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    quantity_issued INTEGER NOT NULL,
    issued_by UUID REFERENCES user_profiles(id),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    doctor_id UUID REFERENCES user_profiles(id),
    status treatment_status DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    total_sessions INTEGER,
    session_duration INTEGER,
    frequency VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment sessions table
CREATE TABLE IF NOT EXISTS treatment_sessions (
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

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
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

-- STEP 3: CREATE FUNCTIONS (SAFE VERSION)
-- ============================================================================

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: CREATE TRIGGERS (SAFE VERSION)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_set_patient_number ON patients;
CREATE TRIGGER trigger_set_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_number();

DROP TRIGGER IF EXISTS trigger_set_visit_number ON visits;
CREATE TRIGGER trigger_set_visit_number
    BEFORE INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION set_visit_number();

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Update timestamp triggers
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_patients_updated_at ON patients;
CREATE TRIGGER trigger_update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_visits_updated_at ON visits;
CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON services;
CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_visit_services_updated_at ON visit_services;
CREATE TRIGGER trigger_update_visit_services_updated_at
    BEFORE UPDATE ON visit_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_medicines_updated_at ON medicines;
CREATE TRIGGER trigger_update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_treatment_plans_updated_at ON treatment_plans;
CREATE TRIGGER trigger_update_treatment_plans_updated_at
    BEFORE UPDATE ON treatment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_treatment_sessions_updated_at ON treatment_sessions;
CREATE TRIGGER trigger_update_treatment_sessions_updated_at
    BEFORE UPDATE ON treatment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 5: CREATE INDEXES (SAFE VERSION)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_date_status ON visits(visit_date, status);
CREATE INDEX IF NOT EXISTS idx_visit_services_visit_id ON visit_services(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_services_assigned_to ON visit_services(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_issues_prescription_id ON pharmacy_issues(prescription_id);
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_plan_id ON treatment_sessions(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_visit_id ON invoices(visit_id);

-- STEP 6: ENABLE RLS AND CREATE POLICIES
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

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Basic policies for other tables (simplified for space)
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
CREATE POLICY "patients_select_policy" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

DROP POLICY IF EXISTS "visits_select_policy" ON visits;
CREATE POLICY "visits_select_policy" ON visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

DROP POLICY IF EXISTS "services_select_policy" ON services;
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

-- STEP 7: INSERT DEMO DATA (SAFE VERSION)
-- ============================================================================

-- Insert demo users (only if they don't exist)
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, 
    is_super_admin, role, aud
) VALUES 
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'admin@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated', 'authenticated'
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'doctor@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated', 'authenticated'
),
(
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'receptionist@swamicare.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated', 'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding user profiles
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', true),
('00000000-0000-0000-0000-000000000002', 'doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', true),
('00000000-0000-0000-0000-000000000003', 'receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample services
INSERT INTO services (name, description, category, duration, price, department, is_active) VALUES
('General Consultation', 'General medical consultation', 'consultation', 30, 500.00, 'General', true),
('ENT Consultation', 'Ear, Nose, Throat consultation', 'consultation', 30, 800.00, 'ENT', true),
('Blood Test', 'Complete blood count test', 'test', 10, 400.00, 'Laboratory', true)
ON CONFLICT DO NOTHING;

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, strength, unit_price, stock_quantity, minimum_stock) VALUES
('Paracetamol 650mg', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '650mg', 2.00, 1000, 100),
('Amoxicillin 500mg', 'Amoxicillin', 'Cipla Ltd', 'Antibiotic', 'Capsule', '500mg', 5.50, 500, 50)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- This safe version handles existing objects and won't error on re-runs
-- ============================================================================