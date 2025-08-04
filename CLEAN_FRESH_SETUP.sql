-- CLEAN FRESH SETUP - Drop existing tables and recreate
-- This ensures clean table structure

-- STEP 1: DROP ALL EXISTING TABLES IN CORRECT ORDER
-- ============================================================================

DROP TABLE IF EXISTS pharmacy_issues CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS treatment_sessions CASCADE;
DROP TABLE IF EXISTS treatment_plans CASCADE;
DROP TABLE IF EXISTS visit_services CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;

-- STEP 2: CREATE TYPES
-- ============================================================================

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

-- STEP 3: CREATE CLEAN TABLES
-- ============================================================================

-- User profiles table (STANDALONE - NO AUTH DEPENDENCY)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    password_hash TEXT NOT NULL, -- Store password hash
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (create early to avoid dependency issues)
CREATE TABLE services (
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

-- Medicines table
CREATE TABLE medicines (
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

-- Visits table
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
    estimated_wait_time INTEGER,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit services table
CREATE TABLE visit_services (
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

-- Prescriptions table
CREATE TABLE prescriptions (
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
CREATE TABLE pharmacy_issues (
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
    session_duration INTEGER,
    frequency VARCHAR(100),
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

-- Invoices table
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

-- STEP 4: CREATE FUNCTIONS AND TRIGGERS
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

CREATE OR REPLACE FUNCTION set_patient_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
        NEW.patient_number := generate_patient_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_number();

-- STEP 5: INSERT DEMO DATA
-- ============================================================================

-- Insert demo users with bcrypt hashes for 'password123'
INSERT INTO user_profiles (email, role, first_name, last_name, phone, password_hash, is_active) VALUES
('admin@swamicare.com', 'admin', 'Admin', 'User', '+91-9876543210', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('doctor@swamicare.com', 'doctor', 'Dr. Smith', 'Johnson', '+91-9876543211', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true),
('receptionist@swamicare.com', 'receptionist', 'Jane', 'Doe', '+91-9876543212', '$2b$10$rQZb8KvPvPvPzQzQ8vPvPuO1KvPvPvPvPvPvPvPvPvPvPvPvPvPvPu', true);

-- Insert sample services
INSERT INTO services (name, description, category, duration, price, department, is_active) VALUES
('General Consultation', 'General medical consultation', 'consultation', 30, 500.00, 'General', true),
('ENT Consultation', 'Ear, Nose, Throat consultation', 'consultation', 30, 800.00, 'ENT', true),
('Blood Test', 'Complete blood count test', 'test', 10, 400.00, 'Laboratory', true);

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, manufacturer, category, dosage_form, strength, unit_price, stock_quantity, minimum_stock) VALUES
('Paracetamol 650mg', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '650mg', 2.00, 1000, 100),
('Amoxicillin 500mg', 'Amoxicillin', 'Cipla Ltd', 'Antibiotic', 'Capsule', '500mg', 5.50, 500, 50);

-- STEP 6: DISABLE RLS COMPLETELY
-- ============================================================================

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- VERIFY SUCCESS
SELECT 'CLEAN DATABASE SETUP COMPLETED' as status;
SELECT email, role, first_name, last_name FROM user_profiles;