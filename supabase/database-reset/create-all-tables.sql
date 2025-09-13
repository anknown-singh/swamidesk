-- SwamIDesk Complete Database Schema
-- Creates all 29 tables for the clinic management system
-- Generated: 2025-08-30
-- WARNING: This script will DROP all existing tables and recreate them

BEGIN;

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (Clean Slate)
-- =====================================================

-- Drop all tables in dependency order (reverse of creation order)
DROP TABLE IF EXISTS billing_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS opd_records CASCADE;
DROP TABLE IF EXISTS visit_services CASCADE;
DROP TABLE IF EXISTS appointment_waitlist CASCADE;
DROP TABLE IF EXISTS appointment_reminders CASCADE;
DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS appointment_slots CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sell_order_items CASCADE;
DROP TABLE IF EXISTS sell_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS pharmacy_issues CASCADE;
DROP TABLE IF EXISTS medicine_master CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS migration_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS treatment_plans CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
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

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_appointment_number() CASCADE;
DROP FUNCTION IF EXISTS set_appointment_number() CASCADE;
DROP FUNCTION IF EXISTS generate_purchase_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sell_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_medicine_master_updated_at() CASCADE;
DROP FUNCTION IF EXISTS medicine_search_text(text, text, text[]) CASCADE;

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

-- Purchase order number generation function
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    new_order_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Fixed regex pattern to properly extract the number
    SELECT COALESCE(MAX(
        CAST(REGEXP_REPLACE(
            SUBSTRING(order_number FROM 'PO-' || year_suffix || '-(.+)'), 
            '[^0-9]', '', 'g'
        ) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM purchase_orders
    WHERE order_number LIKE 'PO-' || year_suffix || '-%';
    
    new_order_number := 'PO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Core System Tables (9 tables)
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

-- 2. USER_PROFILES TABLE
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

-- 3. PATIENTS TABLE
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    blood_group VARCHAR(5),
    allergies TEXT[],
    medical_history TEXT,
    insurance_provider VARCHAR(200),
    insurance_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SERVICES TABLE
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL DEFAULT 0,
    estimated_duration INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    department VARCHAR(100),
    requires_appointment BOOLEAN DEFAULT true,
    preparation_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VISITS TABLE
CREATE TABLE visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME DEFAULT CURRENT_TIME,
    token_number VARCHAR(10),
    chief_complaint TEXT,
    history_present_illness TEXT,
    examination_findings TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PRESCRIPTIONS TABLE
CREATE TABLE prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id),
    medicine_id UUID,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'active',
    prescribed_by UUID REFERENCES users(id),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    dispensed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TREATMENT_PLANS TABLE
CREATE TABLE treatment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    total_sessions INTEGER,
    completed_sessions INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INVOICES TABLE
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    visit_id UUID REFERENCES visits(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MIGRATION_LOG TABLE
CREATE TABLE migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT
);

-- =====================================================
-- STEP 5: Medicine & Pharmacy Tables (8 tables)
-- =====================================================

-- 10. MEDICINES TABLE (Inventory)
CREATE TABLE medicines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(200),
    batch_number VARCHAR(100),
    expiry_date DATE,
    unit_price DECIMAL(8,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
    dosage_form VARCHAR(50),
    strength VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. MEDICINE_MASTER TABLE (Reference Data)
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

-- 12. PHARMACY_ISSUES TABLE
CREATE TABLE pharmacy_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id),
    medicine_id UUID REFERENCES medicines(id),
    quantity_requested INTEGER NOT NULL,
    quantity_issued INTEGER DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    issue_date DATE DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. PURCHASE_ORDERS TABLE
CREATE TABLE purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_purchase_order_number(),
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

-- 14. PURCHASE_ORDER_ITEMS TABLE
CREATE TABLE purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    salt_content VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    batch_number VARCHAR(100),
    expiry_date DATE,
    scheme_offer TEXT,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. SELL_ORDERS TABLE
CREATE TABLE sell_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(255),
    customer_address TEXT,
    customer_email VARCHAR(255),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'credit')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id)
);

-- 16. SELL_ORDER_ITEMS TABLE
CREATE TABLE sell_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sell_order_id UUID NOT NULL REFERENCES sell_orders(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    salt_content VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    batch_number VARCHAR(100),
    expiry_date DATE,
    scheme_offer TEXT,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    prescription_id UUID REFERENCES prescriptions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. INVENTORY TABLE
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_id UUID REFERENCES medicines(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: Appointment System Tables (6 tables)
-- =====================================================

-- 18. APPOINTMENTS TABLE
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    department VARCHAR(100) NOT NULL,
    appointment_type appointment_type NOT NULL DEFAULT 'consultation',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    estimated_end_time TIME GENERATED ALWAYS AS (CAST(scheduled_time + (duration * INTERVAL '1 minute') AS TIME)) STORED,
    title VARCHAR(200),
    description TEXT,
    chief_complaint TEXT,
    notes TEXT,
    patient_notes TEXT,
    priority BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type recurrence_type DEFAULT 'none',
    recurrence_end_date DATE,
    parent_appointment_id UUID REFERENCES appointments(id),
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false AND recurrence_type = 'none') OR
        (is_recurring = true AND recurrence_type != 'none')
    ),
    CONSTRAINT valid_date_time CHECK (scheduled_date >= CURRENT_DATE - INTERVAL '1 year'),
    CONSTRAINT valid_duration CHECK (duration BETWEEN 5 AND 480)
);

-- 19. DOCTOR_AVAILABILITY TABLE
CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    is_available BOOLEAN DEFAULT true,
    max_appointments INTEGER DEFAULT 20,
    appointment_duration INTEGER DEFAULT 30,
    buffer_time INTEGER DEFAULT 0,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_day_times CHECK (start_time < end_time),
    CONSTRAINT valid_break_times CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND 
         break_start_time >= start_time AND break_end_time <= end_time AND
         break_start_time < break_end_time)
    ),
    CONSTRAINT valid_max_appointments CHECK (max_appointments > 0),
    CONSTRAINT valid_durations CHECK (appointment_duration > 0 AND buffer_time >= 0),
    UNIQUE(doctor_id, day_of_week, effective_from)
);

-- 20. APPOINTMENT_SLOTS TABLE
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'available',
    appointment_id UUID REFERENCES appointments(id),
    max_capacity INTEGER DEFAULT 1,
    booked_count INTEGER DEFAULT 0,
    is_emergency_slot BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_slot_times CHECK (start_time < end_time),
    CONSTRAINT valid_capacity CHECK (max_capacity > 0 AND booked_count >= 0 AND booked_count <= max_capacity),
    CONSTRAINT valid_booking CHECK (
        (appointment_id IS NULL AND status IN ('available', 'break', 'off', 'blocked')) OR
        (appointment_id IS NOT NULL AND status IN ('busy'))
    ),
    UNIQUE(doctor_id, slot_date, start_time)
);

-- 21. APPOINTMENT_SERVICES TABLE
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    estimated_duration INTEGER DEFAULT 30,
    actual_duration INTEGER,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
    notes TEXT,
    status service_status DEFAULT 'assigned',
    assigned_to UUID REFERENCES users(id),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_durations CHECK (
        estimated_duration > 0 AND 
        (actual_duration IS NULL OR actual_duration > 0)
    )
);

-- 22. APPOINTMENT_REMINDERS TABLE
CREATE TABLE appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status reminder_status NOT NULL DEFAULT 'pending',
    message_template TEXT NOT NULL,
    actual_message TEXT,
    recipient_contact VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_retry CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT valid_status_logic CHECK (
        (status = 'sent' AND sent_at IS NOT NULL) OR
        (status != 'sent' AND sent_at IS NULL)
    )
);

-- 23. APPOINTMENT_WAITLIST TABLE
CREATE TABLE appointment_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    department VARCHAR(100),
    appointment_type appointment_type NOT NULL DEFAULT 'consultation',
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'expired', 'fulfilled')),
    contact_attempts INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    fulfilled_appointment_id UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_priority CHECK (priority >= 0),
    CONSTRAINT valid_time_range CHECK (
        (preferred_time_start IS NULL AND preferred_time_end IS NULL) OR
        (preferred_time_start IS NOT NULL AND preferred_time_end IS NOT NULL AND
         preferred_time_start < preferred_time_end)
    ),
    CONSTRAINT valid_contact_attempts CHECK (contact_attempts >= 0)
);

-- =====================================================
-- STEP 7: Clinical Management Tables (3 tables)
-- =====================================================

-- 24. VISIT_SERVICES TABLE
CREATE TABLE visit_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id),
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(10,2),
    status service_status DEFAULT 'assigned',
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. OPD_RECORDS TABLE
CREATE TABLE opd_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    token_number INTEGER,
    opd_status VARCHAR(50) DEFAULT 'consultation',
    chief_complaint TEXT,
    examination_findings TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    procedure_quotes JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50),
    data JSONB DEFAULT '{}'::jsonb,
    action_url VARCHAR(500),
    actions JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- STEP 8: Supporting Tables (3 tables)
-- =====================================================

-- 27. SUPPLIERS TABLE
CREATE TABLE suppliers (
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

-- 28. BILLING_ITEMS TABLE
CREATE TABLE billing_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    service_id UUID REFERENCES services(id),
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. PAYMENTS TABLE
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. CONSULTATION_TEMPLATES TABLE
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

-- 31. AUDIT_LOG TABLE
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

-- 32. CONSULTATION_SESSIONS TABLE
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

-- 33. WORKFLOW_REQUESTS TABLE
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

-- 34. TREATMENT_SESSIONS TABLE
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

-- 35. CONSULTATION_CHIEF_COMPLAINTS TABLE
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

-- 36. CONSULTATION_HISTORY TABLE
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

-- 37. CONSULTATION_VITALS TABLE
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

-- 38. EXAMINATION_FINDINGS TABLE
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

-- 39. INVESTIGATION_ORDERS TABLE
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

-- 40. CONSULTATION_DIAGNOSES TABLE
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

-- 41. CONSULTATION_TREATMENT_PLANS TABLE
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

-- 42. CONSULTATION_PROGRESS_NOTES TABLE
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
-- STEP 9: Create Essential Functions
-- =====================================================

-- Appointment number generation function
CREATE OR REPLACE FUNCTION generate_appointment_number() 
RETURNS VARCHAR(30) AS $$
DECLARE
    new_number VARCHAR(30);
    counter INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO counter 
    FROM appointments 
    WHERE scheduled_date = CURRENT_DATE;
    
    new_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    
    WHILE EXISTS (SELECT 1 FROM appointments WHERE appointment_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to set appointment number on insert
CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := generate_appointment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sell order number generation function
CREATE OR REPLACE FUNCTION generate_sell_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    order_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 'SO-' || year_suffix || '-(\\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM sell_orders
    WHERE order_number LIKE 'SO-' || year_suffix || '-%';
    
    order_number := 'SO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Medicine master update timestamp function
CREATE OR REPLACE FUNCTION update_medicine_master_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Immutable function for medicine search text
CREATE OR REPLACE FUNCTION medicine_search_text(name text, generic_name text, brand_names text[])
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT to_tsvector('english', name || ' ' || COALESCE(generic_name, '') || ' ' || COALESCE(array_to_string(brand_names, ' '), ''));
$$;

-- =====================================================
-- STEP 10: Create Triggers
-- =====================================================

-- Update triggers for all tables with updated_at columns
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

CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
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

CREATE TRIGGER trigger_update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_medicine_master_updated_at
    BEFORE UPDATE ON medicine_master
    FOR EACH ROW
    EXECUTE FUNCTION update_medicine_master_updated_at();

CREATE TRIGGER trigger_update_pharmacy_issues_updated_at
    BEFORE UPDATE ON pharmacy_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visit_services_updated_at
    BEFORE UPDATE ON visit_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_opd_records_updated_at
    BEFORE UPDATE ON opd_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Appointment-related triggers
CREATE TRIGGER trigger_set_appointment_number
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_number();

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_waitlist_updated_at
    BEFORE UPDATE ON appointment_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 11: Create Indexes for Performance
-- =====================================================

-- Core table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_active ON patients(is_active);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);

CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_date ON visits(visit_date);

CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_medicine_id ON prescriptions(medicine_id);

CREATE INDEX idx_treatment_plans_patient_id ON treatment_plans(patient_id);

CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_visit_id ON invoices(visit_id);

-- Medicine and pharmacy indexes
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_active ON medicines(is_active);

CREATE INDEX idx_medicine_master_name ON medicine_master(name);
CREATE INDEX idx_medicine_master_generic_name ON medicine_master(generic_name);
CREATE INDEX idx_medicine_master_category ON medicine_master(category);
CREATE INDEX idx_medicine_master_therapeutic_class ON medicine_master(therapeutic_class);
CREATE INDEX idx_medicine_master_active ON medicine_master(is_active);

-- Full-text search index for medicine master
CREATE INDEX idx_medicine_master_search ON medicine_master USING gin(
    medicine_search_text(name, generic_name, brand_names)
);

CREATE INDEX idx_pharmacy_issues_prescription_id ON pharmacy_issues(prescription_id);
CREATE INDEX idx_pharmacy_issues_medicine_id ON pharmacy_issues(medicine_id);

CREATE INDEX idx_inventory_medicine_id ON inventory(medicine_id);

CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_name);
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_order_items_purchase_order ON purchase_order_items(purchase_order_id);

CREATE INDEX idx_sell_orders_status ON sell_orders(status);
CREATE INDEX idx_sell_orders_sale_date ON sell_orders(sale_date);
CREATE INDEX idx_sell_orders_customer ON sell_orders(customer_name);
CREATE INDEX idx_sell_orders_order_number ON sell_orders(order_number);
CREATE INDEX idx_sell_orders_patient ON sell_orders(patient_id);
CREATE INDEX idx_sell_orders_payment_status ON sell_orders(payment_status);
CREATE INDEX idx_sell_order_items_sell_order ON sell_order_items(sell_order_id);
CREATE INDEX idx_sell_order_items_prescription ON sell_order_items(prescription_id);

-- Appointment system indexes
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX idx_appointments_department ON appointments(department);
CREATE INDEX idx_appointments_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_recurring ON appointments(parent_appointment_id) WHERE is_recurring = true;

CREATE INDEX idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX idx_doctor_availability_effective ON doctor_availability(effective_from, effective_to);

CREATE INDEX idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);
CREATE INDEX idx_appointment_slots_date_time ON appointment_slots(slot_date, start_time);
CREATE INDEX idx_appointment_slots_status ON appointment_slots(status);

CREATE INDEX idx_appointment_services_appointment ON appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service ON appointment_services(service_id);
CREATE INDEX idx_appointment_services_assigned ON appointment_services(assigned_to);

CREATE INDEX idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled ON appointment_reminders(scheduled_at);
CREATE INDEX idx_appointment_reminders_status ON appointment_reminders(status);

CREATE INDEX idx_appointment_waitlist_patient ON appointment_waitlist(patient_id);
CREATE INDEX idx_appointment_waitlist_doctor ON appointment_waitlist(doctor_id);
CREATE INDEX idx_appointment_waitlist_status ON appointment_waitlist(status);
CREATE INDEX idx_appointment_waitlist_priority ON appointment_waitlist(priority DESC);

-- Other indexes
CREATE INDEX idx_visit_services_visit_id ON visit_services(visit_id);
CREATE INDEX idx_visit_services_service_id ON visit_services(service_id);

CREATE INDEX idx_opd_records_patient_id ON opd_records(patient_id);
CREATE INDEX idx_opd_records_visit_date ON opd_records(visit_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_role ON notifications(role);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_billing_items_invoice_id ON billing_items(invoice_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- =====================================================
-- STEP 12: Grant Permissions
-- =====================================================

-- Disable RLS for all tables (for development - re-enable for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sell_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE sell_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waitlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE opd_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to database roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator, anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticator, anon, authenticated;

-- =====================================================
-- STEP 13: Log Migration
-- =====================================================

INSERT INTO migration_log (migration_name, applied_at, description) VALUES (
  'create_all_tables_fresh_install',
  NOW(),
  'Fresh installation: Created all 29 tables for SwamIDesk clinic management system'
);

COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- All 29 tables have been created successfully!
-- Database is ready for SwamIDesk clinic management system
-- Next steps: Populate with initial data and create demo users