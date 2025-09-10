-- =====================================================
-- SwamIDesk COMPLETE Database Reset Script
-- =====================================================
-- Comprehensive clinic management system database reset
-- Creates all 42 tables with proper relationships and dependencies
-- Based on complete migration analysis (2025-01-10)
--
-- WARNING: This script will DROP all existing tables and recreate them
-- USE WITH CAUTION - All data will be lost
-- =====================================================

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (Clean Slate)
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS appointment_waitlist CASCADE;
DROP TABLE IF EXISTS appointment_reminders CASCADE;
DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS consultation_progress_notes CASCADE;
DROP TABLE IF EXISTS consultation_treatment_plans CASCADE;
DROP TABLE IF EXISTS consultation_diagnoses CASCADE;
DROP TABLE IF EXISTS investigation_orders CASCADE;
DROP TABLE IF EXISTS examination_findings CASCADE;
DROP TABLE IF EXISTS consultation_vitals CASCADE;
DROP TABLE IF EXISTS consultation_history CASCADE;
DROP TABLE IF EXISTS consultation_chief_complaints CASCADE;
DROP TABLE IF EXISTS consultation_sessions CASCADE;
DROP TABLE IF EXISTS treatment_sessions CASCADE;
DROP TABLE IF EXISTS workflow_requests CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS appointment_slots CASCADE;
DROP TABLE IF EXISTS billing_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS visit_services CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sell_order_items CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS pharmacy_issues CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS consultation_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS opd_records CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS sell_orders CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS treatment_plans CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS migration_log CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS medicine_master CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
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

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_appointment_number() CASCADE;
DROP FUNCTION IF EXISTS generate_purchase_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sell_order_number() CASCADE;
DROP FUNCTION IF EXISTS medicine_search_text(medicines) CASCADE;

-- Drop views
DROP VIEW IF EXISTS current_queue CASCADE;

-- =====================================================
-- STEP 2: Create Custom Types and Enums
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'pharmacist', 'nurse');

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

-- Appointment number generator
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TEXT AS $$
DECLARE
    number_part INTEGER;
    result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_number FROM 4) AS INTEGER)), 0) + 1
    INTO number_part
    FROM appointments
    WHERE appointment_number LIKE 'APT%';
    
    result := 'APT' || LPAD(number_part::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Purchase order number generator
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    number_part INTEGER;
    result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 3) AS INTEGER)), 0) + 1
    INTO number_part
    FROM purchase_orders
    WHERE order_number LIKE 'PO%';
    
    result := 'PO' || LPAD(number_part::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Sell order number generator
CREATE OR REPLACE FUNCTION generate_sell_order_number()
RETURNS TEXT AS $$
DECLARE
    number_part INTEGER;
    result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 3) AS INTEGER)), 0) + 1
    INTO number_part
    FROM sell_orders
    WHERE order_number LIKE 'SO%';
    
    result := 'SO' || LPAD(number_part::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Medicine search function (will be created after medicines table)

-- =====================================================
-- STEP 4: Level 0 Tables (No Dependencies)
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

-- 2. PATIENTS TABLE
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(20),
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_history TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SERVICES TABLE
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(8,2),
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MEDICINES TABLE
CREATE TABLE medicines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generic_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    strength VARCHAR(50),
    dosage_form VARCHAR(50),
    manufacturer VARCHAR(255),
    category VARCHAR(100),
    unit_price DECIMAL(8,2),
    minimum_stock INTEGER DEFAULT 10,
    maximum_stock INTEGER DEFAULT 1000,
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MEDICINE_MASTER TABLE
CREATE TABLE medicine_master (
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

-- 6. SUPPLIERS TABLE
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(20),
    drug_license VARCHAR(100),
    credit_terms VARCHAR(100),
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MIGRATION_LOG TABLE
CREATE TABLE migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Medicine search function (now that medicines table exists)
CREATE OR REPLACE FUNCTION medicine_search_text(medicine medicines)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        COALESCE(medicine.generic_name, '') || ' ' ||
        COALESCE(medicine.brand_name, '') || ' ' ||
        COALESCE(medicine.manufacturer, '') || ' ' ||
        COALESCE(medicine.category, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- STEP 5: Level 1 Tables (Depend on Level 0)
-- =====================================================

-- 8. USER_PROFILES TABLE
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

-- 9. VISITS TABLE
CREATE TABLE visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    visit_date DATE NOT NULL,
    visit_time TIME,
    visit_type VARCHAR(50),
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_notes TEXT,
    follow_up_date DATE,
    visit_status VARCHAR(20) DEFAULT 'scheduled',
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TREATMENT_PLANS TABLE
CREATE TABLE treatment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    visit_id UUID REFERENCES visits(id),
    plan_name VARCHAR(255),
    description TEXT,
    start_date DATE,
    estimated_end_date DATE,
    total_sessions INTEGER,
    completed_sessions INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2),
    status service_status DEFAULT 'assigned',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. INVOICES TABLE
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    visit_id UUID REFERENCES visits(id),
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. PURCHASE_ORDERS TABLE
CREATE TABLE purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    supplier_address TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 13. SELL_ORDERS TABLE
CREATE TABLE sell_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE DEFAULT generate_sell_order_number(),
    patient_id UUID REFERENCES patients(id),
    order_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    order_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. DOCTOR_AVAILABILITY TABLE
CREATE TABLE doctor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30,
    max_patients INTEGER DEFAULT 1,
    break_start_time TIME,
    break_end_time TIME,
    is_available BOOLEAN DEFAULT true,
    recurrence_type recurrence_type DEFAULT 'weekly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctor_id, day_of_week, start_time, end_time)
);

-- 15. OPD_RECORDS TABLE (simplified after column removal)
CREATE TABLE opd_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(10) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. CONSULTATION_TEMPLATES TABLE
CREATE TABLE consultation_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100),
    condition VARCHAR(200),
    template_data JSONB NOT NULL,
    chief_complaints_template JSONB,
    history_template JSONB,
    examination_template JSONB,
    common_diagnoses TEXT[],
    common_investigations TEXT[],
    common_treatments JSONB,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. AUDIT_LOG TABLE
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: Level 2 Tables (Depend on Level 1)
-- =====================================================

-- 19. PRESCRIPTIONS TABLE
CREATE TABLE prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id),
    prescription_number VARCHAR(50) UNIQUE,
    prescription_date DATE DEFAULT CURRENT_DATE,
    patient_instructions TEXT,
    total_amount DECIMAL(8,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    prescribed_by UUID REFERENCES users(id),
    dispensed_by UUID REFERENCES users(id),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. PHARMACY_ISSUES TABLE
CREATE TABLE pharmacy_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id),
    medicine_id UUID REFERENCES medicines(id),
    quantity_issued INTEGER NOT NULL,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(8,2),
    batch_number VARCHAR(50),
    expiry_date DATE,
    issued_date DATE DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. PURCHASE_ORDER_ITEMS TABLE
CREATE TABLE purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    batch_number VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. SELL_ORDER_ITEMS TABLE
CREATE TABLE sell_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sell_order_id UUID NOT NULL REFERENCES sell_orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    prescription_id UUID REFERENCES prescriptions(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. INVENTORY TABLE
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_id UUID REFERENCES medicines(id),
    batch_number VARCHAR(50),
    expiry_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(8,2),
    selling_price DECIMAL(8,2),
    supplier_name VARCHAR(255),
    received_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. APPOINTMENT_SLOTS TABLE (foreign key for appointment_id added later)
CREATE TABLE appointment_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status DEFAULT 'available',
    appointment_id UUID,
    max_patients INTEGER DEFAULT 1,
    booked_patients INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctor_id, slot_date, start_time)
);

-- 25. VISIT_SERVICES TABLE
CREATE TABLE visit_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(8,2),
    status service_status DEFAULT 'assigned',
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. BILLING_ITEMS TABLE
CREATE TABLE billing_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    item_type VARCHAR(20) DEFAULT 'service',
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(8,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. PAYMENTS TABLE
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. CONSULTATION_SESSIONS TABLE
CREATE TABLE consultation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    current_step VARCHAR(50) DEFAULT 'chief_complaints',
    is_completed BOOLEAN DEFAULT false,
    total_duration_minutes INTEGER,
    consultation_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. WORKFLOW_REQUESTS TABLE
CREATE TABLE workflow_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    request_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    requested_by UUID NOT NULL REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    request_details JSONB NOT NULL DEFAULT '{}',
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 30. TREATMENT_SESSIONS TABLE
CREATE TABLE treatment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
    session_number INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    conducted_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 7: Level 3 Tables (Depend on Level 2)
-- =====================================================

-- 31. APPOINTMENTS TABLE (now with opd_id reference)
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_number VARCHAR(50) UNIQUE DEFAULT generate_appointment_number(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    parent_appointment_id UUID REFERENCES appointments(id),
    opd_id UUID REFERENCES opd_records(id),
    appointment_type appointment_type DEFAULT 'consultation',
    status appointment_status DEFAULT 'scheduled',
    priority VARCHAR(10) DEFAULT 'normal',
    department VARCHAR(100),
    chief_complaint TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    estimated_end_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 30,
    consultation_fee DECIMAL(8,2),
    additional_charges DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(8,2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    visit_notes TEXT,
    prescription_notes TEXT,
    next_visit_instructions TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    rescheduled_from UUID REFERENCES appointments(id),
    rescheduled_to UUID REFERENCES appointments(id),
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    rescheduled_by UUID REFERENCES users(id),
    rescheduled_reason TEXT,
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 32. CONSULTATION_CHIEF_COMPLAINTS TABLE
CREATE TABLE consultation_chief_complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    complaint TEXT NOT NULL,
    duration VARCHAR(100),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    associated_symptoms TEXT[],
    onset VARCHAR(100),
    character VARCHAR(100),
    location VARCHAR(100),
    radiation VARCHAR(100),
    aggravating_factors TEXT[],
    relieving_factors TEXT[],
    timing VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 33. CONSULTATION_HISTORY TABLE
CREATE TABLE consultation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    history_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    summary_text TEXT,
    relevant_negatives TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 34. CONSULTATION_VITALS TABLE
CREATE TABLE consultation_vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    temperature NUMERIC(4,1),
    pulse_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    bmi NUMERIC(4,1),
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id)
);

-- 35. EXAMINATION_FINDINGS TABLE
CREATE TABLE examination_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    examination_type VARCHAR(50) NOT NULL,
    findings JSONB NOT NULL,
    normal_findings TEXT[],
    abnormal_findings TEXT[],
    clinical_significance TEXT,
    examination_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 36. INVESTIGATION_ORDERS TABLE
CREATE TABLE investigation_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    investigation_type VARCHAR(100) NOT NULL,
    investigation_name VARCHAR(200) NOT NULL,
    investigation_code VARCHAR(50),
    category VARCHAR(100),
    urgency VARCHAR(20) DEFAULT 'routine',
    clinical_indication TEXT,
    instructions TEXT,
    expected_date DATE,
    cost_estimate NUMERIC(8,2),
    status VARCHAR(20) DEFAULT 'ordered',
    results JSONB,
    results_summary TEXT,
    interpretation TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 37. CONSULTATION_DIAGNOSES TABLE
CREATE TABLE consultation_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    diagnosis_type VARCHAR(20) NOT NULL,
    diagnosis_text TEXT NOT NULL,
    icd10_code VARCHAR(10),
    icd10_description TEXT,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    is_primary BOOLEAN DEFAULT false,
    supporting_evidence TEXT[],
    ruling_out_evidence TEXT[],
    clinical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 38. CONSULTATION_TREATMENT_PLANS TABLE
CREATE TABLE consultation_treatment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    treatment_type VARCHAR(50) NOT NULL,
    primary_treatment TEXT NOT NULL,
    treatment_goals TEXT[],
    plan_details JSONB NOT NULL,
    medications JSONB,
    lifestyle_modifications TEXT[],
    dietary_advice TEXT,
    activity_restrictions TEXT[],
    home_care_instructions TEXT[],
    procedures JSONB,
    pre_operative_requirements TEXT[],
    post_operative_care TEXT[],
    risk_assessment TEXT,
    consent_required BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_days INTEGER,
    follow_up_instructions TEXT,
    warning_signs TEXT[],
    emergency_instructions TEXT,
    estimated_cost NUMERIC(10,2),
    insurance_approval_needed BOOLEAN DEFAULT false,
    referral_required BOOLEAN DEFAULT false,
    referral_specialty VARCHAR(100),
    special_instructions TEXT,
    patient_education_provided TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 39. CONSULTATION_PROGRESS_NOTES TABLE
CREATE TABLE consultation_progress_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    note_type VARCHAR(20) DEFAULT 'progress',
    note_text TEXT NOT NULL,
    clinical_changes TEXT,
    plan_modifications TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 8: Level 4 Tables (Depend on Level 3)
-- =====================================================

-- 40. APPOINTMENT_SERVICES TABLE
CREATE TABLE appointment_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(8,2),
    status service_status DEFAULT 'assigned',
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 41. APPOINTMENT_REMINDERS TABLE
CREATE TABLE appointment_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_time TIMESTAMP WITH TIME ZONE,
    status reminder_status DEFAULT 'pending',
    message_content TEXT,
    recipient_contact VARCHAR(20),
    delivery_status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 42. APPOINTMENT_WAITLIST TABLE
CREATE TABLE appointment_waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    appointment_type appointment_type DEFAULT 'consultation',
    priority VARCHAR(10) DEFAULT 'normal',
    contact_number VARCHAR(20),
    notes TEXT,
    notified BOOLEAN DEFAULT false,
    appointment_offered_id UUID REFERENCES appointments(id),
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 9: Create Views
-- =====================================================

-- Current queue view for real-time patient tracking
CREATE VIEW current_queue AS
SELECT 
    a.id,
    a.appointment_number,
    a.scheduled_date,
    a.scheduled_time,
    a.status,
    a.appointment_type,
    p.full_name as patient_name,
    p.phone as patient_phone,
    u.full_name as doctor_name,
    up.department,
    a.created_at,
    ROW_NUMBER() OVER (
        PARTITION BY a.doctor_id, a.scheduled_date 
        ORDER BY a.scheduled_time
    ) as queue_position
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE a.scheduled_date = CURRENT_DATE
AND a.status IN ('confirmed', 'arrived', 'in_progress')
ORDER BY a.scheduled_time;

-- =====================================================
-- STEP 10: Create Indexes for Performance
-- =====================================================

-- Core table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);

-- Patient indexes
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_is_active ON patients(is_active);
CREATE INDEX idx_patients_full_name ON patients(full_name);

-- Appointment indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_appointment_number ON appointments(appointment_number);
CREATE INDEX idx_appointments_opd_id ON appointments(opd_id);

-- Visit indexes
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);

-- Medicine indexes
CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_brand_name ON medicines(brand_name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_is_active ON medicines(is_active);

-- Prescription indexes
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_prescribed_by ON prescriptions(prescribed_by);
CREATE INDEX idx_prescriptions_prescription_date ON prescriptions(prescription_date);

-- Consultation system indexes
CREATE INDEX idx_consultation_sessions_patient_id ON consultation_sessions(patient_id);
CREATE INDEX idx_consultation_sessions_doctor_id ON consultation_sessions(doctor_id);
CREATE INDEX idx_consultation_sessions_visit_id ON consultation_sessions(visit_id);
CREATE INDEX idx_consultation_chief_complaints_consultation_id ON consultation_chief_complaints(consultation_id);
CREATE INDEX idx_consultation_history_consultation_id ON consultation_history(consultation_id);
CREATE INDEX idx_consultation_vitals_consultation_id ON consultation_vitals(consultation_id);
CREATE INDEX idx_examination_findings_consultation_id ON examination_findings(consultation_id);
CREATE INDEX idx_investigation_orders_consultation_id ON investigation_orders(consultation_id);
CREATE INDEX idx_consultation_diagnoses_consultation_id ON consultation_diagnoses(consultation_id);
CREATE INDEX idx_consultation_treatment_plans_consultation_id ON consultation_treatment_plans(consultation_id);

-- Workflow indexes
CREATE INDEX idx_workflow_requests_patient_id ON workflow_requests(patient_id);
CREATE INDEX idx_workflow_requests_status ON workflow_requests(status);
CREATE INDEX idx_workflow_requests_created_at ON workflow_requests(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- STEP 10.1: Add Deferred Foreign Key Constraints
-- =====================================================

-- Add foreign key constraint for appointment_slots.appointment_id
ALTER TABLE appointment_slots 
ADD CONSTRAINT fk_appointment_slots_appointment_id 
FOREIGN KEY (appointment_id) REFERENCES appointments(id);

-- =====================================================
-- STEP 11: Create Update Triggers
-- =====================================================

-- Add update triggers for tables with updated_at columns
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_treatment_plans_updated_at
    BEFORE UPDATE ON treatment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_sell_orders_updated_at
    BEFORE UPDATE ON sell_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_opd_records_updated_at
    BEFORE UPDATE ON opd_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visit_services_updated_at
    BEFORE UPDATE ON visit_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_services_updated_at
    BEFORE UPDATE ON appointment_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_reminders_updated_at
    BEFORE UPDATE ON appointment_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_waitlist_updated_at
    BEFORE UPDATE ON appointment_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_consultation_sessions_updated_at
    BEFORE UPDATE ON consultation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_consultation_history_updated_at
    BEFORE UPDATE ON consultation_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_examination_findings_updated_at
    BEFORE UPDATE ON examination_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_investigation_orders_updated_at
    BEFORE UPDATE ON investigation_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_consultation_diagnoses_updated_at
    BEFORE UPDATE ON consultation_diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_consultation_treatment_plans_updated_at
    BEFORE UPDATE ON consultation_treatment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_consultation_templates_updated_at
    BEFORE UPDATE ON consultation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_workflow_requests_updated_at
    BEFORE UPDATE ON workflow_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_treatment_sessions_updated_at
    BEFORE UPDATE ON treatment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 12: Insert Essential Sample Data
-- =====================================================

-- Insert sample admin user
INSERT INTO users (id, email, full_name, role, phone, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@swamicare.com', 'System Administrator', 'admin', '+91-9876543210', true);

-- Insert admin profile
INSERT INTO user_profiles (user_id, department, qualification, bio) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Administration', 'IT Administration', 'System Administrator with full access to SwamIDesk');

-- Insert sample service categories
INSERT INTO services (name, category, base_price, duration_minutes) VALUES
('General Consultation', 'Consultation', 500.00, 30),
('Follow-up Consultation', 'Consultation', 300.00, 15),
('Health Checkup', 'Preventive', 1500.00, 45),
('Blood Pressure Check', 'Vital Signs', 100.00, 10),
('Blood Sugar Test', 'Laboratory', 200.00, 15);

COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'SwamIDesk Database Reset Complete!' as result,
       '42 tables created with proper relationships and dependencies' as tables,
       '8 custom types and enums' as types,
       'All indexes, triggers, and sample data installed' as features,
       'Database ready for production use' as status;