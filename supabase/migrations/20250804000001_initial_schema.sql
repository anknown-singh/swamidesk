-- Initial schema for SwamiCare Clinic Management System
-- Migration: 20250804000001_initial_schema.sql

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
    -- Get the count of existing patients to generate next number
    SELECT COUNT(*) + 1 INTO counter FROM patients;
    new_number := 'P' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(counter::TEXT, 4, '0');
    
    -- Ensure uniqueness
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
    -- Get the count of visits today to generate next number
    SELECT COUNT(*) + 1 INTO counter FROM visits WHERE visit_date = CURRENT_DATE;
    new_number := 'V' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    
    -- Ensure uniqueness
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
    -- Get the count of invoices today to generate next number
    SELECT COUNT(*) + 1 INTO counter FROM invoices WHERE DATE(created_at) = CURRENT_DATE;
    new_number := 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 3, '0');
    
    -- Ensure uniqueness
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