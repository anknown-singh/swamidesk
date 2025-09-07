-- =====================================================
-- SwamIDesk Missing Tables Migration
-- =====================================================
-- Adds all missing tables from production schema to match local instance

BEGIN;

-- =====================================================
-- STEP 1: Add Missing Custom Types (ENUMs)
-- =====================================================

-- Add missing enum types (with proper error handling)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
        CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_type') THEN
        CREATE TYPE reminder_type AS ENUM ('sms', 'email', 'whatsapp', 'call');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        CREATE TYPE availability_status AS ENUM ('available', 'booked', 'blocked', 'holiday');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
        CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_type') THEN
        CREATE TYPE appointment_type AS ENUM ('consultation', 'follow_up', 'emergency', 'procedure', 'vaccination');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled', 'on_hold');
    END IF;
END $$;

-- =====================================================
-- STEP 2: Consultation System Tables
-- =====================================================

-- Consultation Sessions (Main consultation tracking)
CREATE TABLE consultation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITHOUT TIME ZONE,
    current_step VARCHAR(50) DEFAULT 'chief_complaints',
    is_completed BOOLEAN DEFAULT false,
    total_duration_minutes INTEGER,
    consultation_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Chief Complaints with detailed symptom analysis
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Consultation History
CREATE TABLE consultation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    history_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    summary_text TEXT,
    relevant_negatives TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Vital Signs
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
    recorded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id)
);

-- Examination Findings
CREATE TABLE examination_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    examination_type VARCHAR(50) NOT NULL,
    findings JSONB NOT NULL,
    normal_findings TEXT[],
    abnormal_findings TEXT[],
    clinical_significance TEXT,
    examination_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Investigation Orders
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Consultation Diagnoses
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Consultation Treatment Plans
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Consultation Progress Notes
CREATE TABLE consultation_progress_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_sessions(id),
    note_type VARCHAR(20) DEFAULT 'progress',
    note_text TEXT NOT NULL,
    clinical_changes TEXT,
    plan_modifications TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Consultation Templates
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Workflow Management
-- =====================================================

-- Workflow Requests (Key missing table)
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    responded_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- STEP 4: Treatment Sessions
-- =====================================================

-- Treatment Sessions (missing from local)
CREATE TABLE treatment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
    session_number INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME WITHOUT TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    conducted_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: Add Missing Columns to Existing Tables
-- =====================================================

-- Add opd_id column to appointments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'opd_id') THEN
        ALTER TABLE appointments ADD COLUMN opd_id UUID REFERENCES opd_records(id);
    END IF;
END $$;

-- Add supplier column to medicines table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medicines' AND column_name = 'supplier') THEN
        ALTER TABLE medicines ADD COLUMN supplier VARCHAR(255);
    END IF;
END $$;

-- =====================================================
-- STEP 6: Create Indexes for Performance
-- =====================================================

-- Consultation system indexes
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient_id ON consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_doctor_id ON consultation_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_visit_id ON consultation_sessions(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultation_chief_complaints_consultation_id ON consultation_chief_complaints(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_history_consultation_id ON consultation_history(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_vitals_consultation_id ON consultation_vitals(consultation_id);
CREATE INDEX IF NOT EXISTS idx_examination_findings_consultation_id ON examination_findings(consultation_id);
CREATE INDEX IF NOT EXISTS idx_investigation_orders_consultation_id ON investigation_orders(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_diagnoses_consultation_id ON consultation_diagnoses(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_treatment_plans_consultation_id ON consultation_treatment_plans(consultation_id);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_requests_patient_id ON workflow_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_requests_requested_by ON workflow_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_workflow_requests_assigned_to ON workflow_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_requests_status ON workflow_requests(status);
CREATE INDEX IF NOT EXISTS idx_workflow_requests_created_at ON workflow_requests(created_at);

-- Treatment sessions indexes
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_treatment_plan_id ON treatment_sessions(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_conducted_by ON treatment_sessions(conducted_by);
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_scheduled_date ON treatment_sessions(scheduled_date);

-- =====================================================
-- STEP 7: Create Update Triggers
-- =====================================================

-- Update trigger function (reuse existing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers for new tables
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

COMMIT;

-- Success message
SELECT 'Missing tables migration completed successfully!' as result,
       'Added: Consultation system, workflow requests, treatment sessions' as details;