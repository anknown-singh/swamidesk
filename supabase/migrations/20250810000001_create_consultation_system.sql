-- Comprehensive Consultation System Database Schema
-- Phase 1: Core consultation tables for SwamIDesk

-- 1. Consultation Sessions - Main consultation tracking
CREATE TABLE consultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    current_step VARCHAR(50) DEFAULT 'chief_complaints',
    is_completed BOOLEAN DEFAULT FALSE,
    total_duration_minutes INTEGER,
    consultation_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Chief Complaints
CREATE TABLE consultation_chief_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    complaint TEXT NOT NULL,
    duration VARCHAR(100),
    severity INTEGER CHECK (severity BETWEEN 1 AND 10),
    associated_symptoms TEXT[],
    onset VARCHAR(50), -- sudden, gradual, acute, chronic
    character VARCHAR(100), -- sharp, dull, burning, etc.
    location VARCHAR(100), -- body part/region
    radiation VARCHAR(100), -- where pain/symptom spreads
    aggravating_factors TEXT[],
    relieving_factors TEXT[],
    timing VARCHAR(100), -- morning, night, after meals, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Medical History - Comprehensive history taking
CREATE TABLE consultation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    history_type VARCHAR(50) NOT NULL, -- 'present_illness', 'past_medical', 'personal', 'family', 'allergy'
    content JSONB NOT NULL,
    summary_text TEXT, -- Human-readable summary
    relevant_negatives TEXT[], -- Important things patient denies
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Examination Findings - Physical examination
CREATE TABLE examination_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    examination_type VARCHAR(50) NOT NULL, -- 'general', 'cardiovascular', 'respiratory', 'abdominal', etc.
    findings JSONB NOT NULL,
    normal_findings TEXT[],
    abnormal_findings TEXT[],
    clinical_significance TEXT, -- Doctor's interpretation
    examination_order INTEGER DEFAULT 1, -- Order in which examination was done
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Vital Signs (Part of general examination but separate for easy access)
CREATE TABLE consultation_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    temperature DECIMAL(4,1), -- in Celsius
    pulse_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,1),
    pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
    recorded_at TIMESTAMP DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id)
);

-- 6. Diagnoses - Both provisional and final
CREATE TABLE consultation_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    diagnosis_type VARCHAR(20) NOT NULL, -- 'provisional', 'final', 'differential'
    diagnosis_text TEXT NOT NULL,
    icd10_code VARCHAR(20),
    icd10_description TEXT,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5), -- 1=low, 5=very high
    is_primary BOOLEAN DEFAULT FALSE,
    supporting_evidence TEXT[], -- References to history/examination findings
    ruling_out_evidence TEXT[], -- Why this diagnosis might not be correct
    clinical_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Investigation Orders
CREATE TABLE investigation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    investigation_type VARCHAR(50) NOT NULL, -- 'lab', 'imaging', 'specialized', 'biopsy'
    investigation_name VARCHAR(200) NOT NULL,
    investigation_code VARCHAR(50), -- Standard medical codes
    category VARCHAR(100), -- Blood work, X-ray, MRI, etc.
    urgency VARCHAR(20) DEFAULT 'routine', -- 'urgent', 'routine', 'stat', 'within_24h'
    clinical_indication TEXT, -- Why this investigation is needed
    instructions TEXT,
    expected_date DATE,
    cost_estimate DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'ordered', -- 'ordered', 'sample_collected', 'in_process', 'completed', 'cancelled'
    results JSONB, -- Store results when available
    results_summary TEXT,
    interpretation TEXT, -- Doctor's interpretation of results
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Treatment Plans
CREATE TABLE consultation_treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    treatment_type VARCHAR(50) NOT NULL, -- 'conservative', 'surgical', 'procedural', 'combined'
    primary_treatment TEXT NOT NULL,
    treatment_goals TEXT[],
    plan_details JSONB NOT NULL,
    
    -- Conservative treatment details
    medications JSONB, -- Array of medication objects with detailed prescriptions
    lifestyle_modifications TEXT[],
    dietary_advice TEXT,
    activity_restrictions TEXT[],
    home_care_instructions TEXT[],
    
    -- Surgical/Procedural treatment details
    procedures JSONB, -- Array of procedure objects
    pre_operative_requirements TEXT[],
    post_operative_care TEXT[],
    risk_assessment TEXT,
    consent_required BOOLEAN DEFAULT FALSE,
    
    -- Follow-up and monitoring
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_days INTEGER,
    follow_up_instructions TEXT,
    warning_signs TEXT[], -- Red flags for patient to watch for
    emergency_instructions TEXT,
    
    -- Administrative
    estimated_cost DECIMAL(10,2),
    insurance_approval_needed BOOLEAN DEFAULT FALSE,
    referral_required BOOLEAN DEFAULT FALSE,
    referral_specialty VARCHAR(100),
    
    special_instructions TEXT,
    patient_education_provided TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Consultation Templates - For common conditions
CREATE TABLE consultation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100),
    condition VARCHAR(200),
    template_data JSONB NOT NULL, -- Pre-filled form structure
    chief_complaints_template JSONB,
    history_template JSONB,
    examination_template JSONB,
    common_diagnoses TEXT[],
    common_investigations TEXT[],
    common_treatments JSONB,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Consultation Progress Notes - For ongoing consultations
CREATE TABLE consultation_progress_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    note_type VARCHAR(50) DEFAULT 'progress', -- 'progress', 'addendum', 'correction', 'follow_up'
    note_text TEXT NOT NULL,
    clinical_changes TEXT, -- What changed since last note
    plan_modifications TEXT, -- Changes to treatment plan
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consultation_sessions_visit_id ON consultation_sessions(visit_id);
CREATE INDEX idx_consultation_sessions_doctor_id ON consultation_sessions(doctor_id);
CREATE INDEX idx_consultation_sessions_patient_id ON consultation_sessions(patient_id);
CREATE INDEX idx_consultation_sessions_started_at ON consultation_sessions(started_at);

CREATE INDEX idx_chief_complaints_consultation_id ON consultation_chief_complaints(consultation_id);

CREATE INDEX idx_consultation_history_consultation_id ON consultation_history(consultation_id);
CREATE INDEX idx_consultation_history_type ON consultation_history(history_type);

CREATE INDEX idx_examination_findings_consultation_id ON examination_findings(consultation_id);
CREATE INDEX idx_examination_findings_type ON examination_findings(examination_type);

CREATE INDEX idx_consultation_vitals_consultation_id ON consultation_vitals(consultation_id);
CREATE INDEX idx_consultation_vitals_recorded_at ON consultation_vitals(recorded_at);

CREATE INDEX idx_consultation_diagnoses_consultation_id ON consultation_diagnoses(consultation_id);
CREATE INDEX idx_consultation_diagnoses_type ON consultation_diagnoses(diagnosis_type);
CREATE INDEX idx_consultation_diagnoses_icd10 ON consultation_diagnoses(icd10_code);

CREATE INDEX idx_investigation_orders_consultation_id ON investigation_orders(consultation_id);
CREATE INDEX idx_investigation_orders_status ON investigation_orders(status);
CREATE INDEX idx_investigation_orders_urgency ON investigation_orders(urgency);

CREATE INDEX idx_treatment_plans_consultation_id ON consultation_treatment_plans(consultation_id);
CREATE INDEX idx_treatment_plans_type ON consultation_treatment_plans(treatment_type);

CREATE INDEX idx_consultation_templates_specialty ON consultation_templates(specialty);
CREATE INDEX idx_consultation_templates_condition ON consultation_templates(condition);

CREATE INDEX idx_progress_notes_consultation_id ON consultation_progress_notes(consultation_id);

-- Update visits table to include consultation_data column if not exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS consultation_data JSONB DEFAULT '{}';

-- Add consultation status to visits
ALTER TABLE visits ADD COLUMN IF NOT EXISTS consultation_status VARCHAR(50) DEFAULT 'not_started'; 
-- Values: 'not_started', 'in_progress', 'completed', 'on_hold'

COMMENT ON TABLE consultation_sessions IS 'Main consultation session tracking';
COMMENT ON TABLE consultation_chief_complaints IS 'Patient chief complaints with detailed symptom analysis';
COMMENT ON TABLE consultation_history IS 'Comprehensive medical history taking';
COMMENT ON TABLE examination_findings IS 'Physical examination findings by system';
COMMENT ON TABLE consultation_vitals IS 'Vital signs and basic measurements';
COMMENT ON TABLE consultation_diagnoses IS 'Provisional and final diagnoses with ICD-10 codes';
COMMENT ON TABLE investigation_orders IS 'Laboratory and imaging investigation orders';
COMMENT ON TABLE consultation_treatment_plans IS 'Comprehensive treatment planning';
COMMENT ON TABLE consultation_templates IS 'Reusable consultation templates for common conditions';
COMMENT ON TABLE consultation_progress_notes IS 'Ongoing consultation notes and updates';