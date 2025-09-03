-- Add follow-up tracking fields to consultation system
-- This migration adds support for tracking investigation follow-ups and consultation chains

-- Add requires_followup field to consultation_sessions
ALTER TABLE consultation_sessions 
ADD COLUMN requires_followup BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_consultation_id UUID REFERENCES consultation_sessions(id),
ADD COLUMN followup_reason TEXT,
ADD COLUMN followup_scheduled_at TIMESTAMP;

-- Add follow-up related fields to visits table to track investigation-pending status
ALTER TABLE visits 
ADD COLUMN requires_investigation_followup BOOLEAN DEFAULT FALSE,
ADD COLUMN investigation_followup_scheduled_at TIMESTAMP;

-- Create index for efficient queries on follow-up consultations
CREATE INDEX idx_consultation_sessions_parent_consultation_id ON consultation_sessions(parent_consultation_id);
CREATE INDEX idx_consultation_sessions_requires_followup ON consultation_sessions(requires_followup);
CREATE INDEX idx_visits_requires_investigation_followup ON visits(requires_investigation_followup);

-- Add comments for documentation
COMMENT ON COLUMN consultation_sessions.requires_followup IS 'Indicates if this consultation requires a follow-up (e.g., for investigation results)';
COMMENT ON COLUMN consultation_sessions.parent_consultation_id IS 'References parent consultation if this is a follow-up consultation';
COMMENT ON COLUMN consultation_sessions.followup_reason IS 'Reason for follow-up (e.g., investigation results, medication review)';
COMMENT ON COLUMN consultation_sessions.followup_scheduled_at IS 'When the follow-up is scheduled';
COMMENT ON COLUMN visits.requires_investigation_followup IS 'Indicates if visit has pending investigations requiring follow-up';
COMMENT ON COLUMN visits.investigation_followup_scheduled_at IS 'When investigation follow-up is scheduled';