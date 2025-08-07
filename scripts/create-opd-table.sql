-- OPD Records Table
CREATE TABLE IF NOT EXISTS opd_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Clinical Information
    chief_complaint TEXT NOT NULL,
    examination_findings TEXT,
    diagnosis TEXT NOT NULL,
    treatment_plan TEXT,
    
    -- Follow-up Information
    follow_up_date DATE,
    follow_up_instructions TEXT,
    
    -- Workflow Flags
    requires_procedures BOOLEAN DEFAULT FALSE,
    procedure_quotes JSONB DEFAULT '[]'::jsonb,
    requires_medicines BOOLEAN DEFAULT FALSE,
    prescription_notes TEXT,
    
    -- Status Tracking
    opd_status VARCHAR(50) DEFAULT 'consultation' CHECK (
        opd_status IN ('consultation', 'procedures_pending', 'admin_review', 'pharmacy_pending', 'completed')
    ),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opd_records_appointment_id ON opd_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_opd_records_patient_id ON opd_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_records_doctor_id ON opd_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_records_visit_date ON opd_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_opd_records_opd_status ON opd_records(opd_status);

-- Row Level Security (RLS)
ALTER TABLE opd_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own OPD records" ON opd_records
    FOR SELECT USING (
        auth.uid() = doctor_id OR 
        auth.uid() = patient_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
        )
    );

CREATE POLICY "Doctors can insert OPD records for their patients" ON opd_records
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own OPD records" ON opd_records
    FOR UPDATE USING (
        auth.uid() = doctor_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opd_records_updated_at 
    BEFORE UPDATE ON opd_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE opd_records IS 'OPD (Outpatient Department) records for post-consultation workflow management';
COMMENT ON COLUMN opd_records.opd_status IS 'Tracks the current status of the OPD workflow: consultation -> procedures_pending/pharmacy_pending -> completed';
COMMENT ON COLUMN opd_records.procedure_quotes IS 'JSON array of procedure quotes with custom pricing and diagnosis reasoning';
COMMENT ON COLUMN opd_records.requires_procedures IS 'Flag indicating if patient needs additional procedures';
COMMENT ON COLUMN opd_records.requires_medicines IS 'Flag indicating if patient needs medicines from pharmacy';