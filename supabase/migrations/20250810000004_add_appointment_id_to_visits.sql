-- Add appointment_id column to visits table
-- Migration: 20250810000004_add_appointment_id_to_visits.sql
-- Purpose: Link visits back to their original appointments

-- 1. Add appointment_id column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS appointment_id UUID;

-- 2. Add foreign key constraint to appointments table
ALTER TABLE visits 
ADD CONSTRAINT fk_visits_appointment_id 
FOREIGN KEY (appointment_id) 
REFERENCES appointments(id) 
ON DELETE SET NULL;

-- 3. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_appointment_id ON visits(appointment_id);

-- 4. Add comment for documentation
COMMENT ON COLUMN visits.appointment_id IS 'Reference to the appointment that created this visit (optional)';

-- 5. Update the trigger function to handle appointment_id
CREATE OR REPLACE FUNCTION set_visit_queue_fields() 
RETURNS TRIGGER AS $$
BEGIN
    -- Always set token_number if not provided or is null
    IF NEW.token_number IS NULL THEN
        NEW.token_number := generate_token_number();
    END IF;
    
    -- Set checked_in_at if not provided and status is 'waiting'
    IF NEW.checked_in_at IS NULL AND NEW.status = 'waiting' THEN
        NEW.checked_in_at := NOW();
    END IF;
    
    -- Set priority to false if not specified
    IF NEW.priority IS NULL THEN
        NEW.priority := false;
    END IF;
    
    -- Sync queue_number with token_number for backward compatibility
    NEW.queue_number := NEW.token_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;