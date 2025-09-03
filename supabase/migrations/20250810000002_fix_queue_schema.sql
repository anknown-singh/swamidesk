-- Fix Queue Management Database Schema
-- Migration: 20250810000002_fix_queue_schema.sql
-- Purpose: Fix schema mismatches between code expectations and database structure

-- 1. Add missing columns to visits table for queue management
ALTER TABLE visits ADD COLUMN IF NOT EXISTS token_number INTEGER;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT false;

-- 2. Copy existing queue_number values to token_number for backward compatibility
UPDATE visits SET token_number = queue_number WHERE token_number IS NULL AND queue_number IS NOT NULL;

-- 3. Set checked_in_at for existing visits that don't have it
UPDATE visits SET checked_in_at = created_at WHERE checked_in_at IS NULL AND created_at IS NOT NULL;

-- 4. Create users view that points to user_profiles table for code compatibility
-- This allows existing code that queries 'users' to work with 'user_profiles' table
CREATE OR REPLACE VIEW users AS
SELECT 
    id,
    email,
    role,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    phone,
    address,
    is_active,
    created_at,
    updated_at,
    -- Add department field for compatibility (doctors in ENT, General Medicine, etc.)
    CASE 
        WHEN role = 'doctor' THEN 
            CASE 
                WHEN id::text = '1' THEN 'ENT'
                WHEN id::text = '2' THEN 'General Medicine'
                WHEN id::text = '3' THEN 'Pediatrics'
                ELSE 'General Medicine'
            END
        ELSE NULL
    END as department
FROM user_profiles;

-- 5. Create indexes for better queue management performance
CREATE INDEX IF NOT EXISTS idx_visits_token_number ON visits(token_number);
CREATE INDEX IF NOT EXISTS idx_visits_checked_in_at ON visits(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_visits_priority ON visits(priority);
CREATE INDEX IF NOT EXISTS idx_visits_queue_management ON visits(visit_date, status, priority, token_number);

-- 6. Add function to automatically generate token numbers for new visits
CREATE OR REPLACE FUNCTION generate_token_number() 
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    -- Get the highest token number for today
    SELECT COALESCE(MAX(token_number), 0) + 1 
    INTO next_token 
    FROM visits 
    WHERE visit_date = CURRENT_DATE;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically set token_number and checked_in_at for new visits
CREATE OR REPLACE FUNCTION set_visit_queue_fields() 
RETURNS TRIGGER AS $$
BEGIN
    -- Set token_number if not provided
    IF NEW.token_number IS NULL THEN
        NEW.token_number := generate_token_number();
    END IF;
    
    -- Set checked_in_at if not provided and status is 'waiting'
    IF NEW.checked_in_at IS NULL AND NEW.status = 'waiting' THEN
        NEW.checked_in_at := NOW();
    END IF;
    
    -- Set queue_number to match token_number for backward compatibility
    IF NEW.queue_number IS NULL AND NEW.token_number IS NOT NULL THEN
        NEW.queue_number := NEW.token_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger
DROP TRIGGER IF EXISTS trigger_set_visit_queue_fields ON visits;
CREATE TRIGGER trigger_set_visit_queue_fields
    BEFORE INSERT OR UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION set_visit_queue_fields();

-- 9. Update visit_status enum to include additional states if needed
-- This ensures compatibility with existing code expectations
DO $$ 
BEGIN
    -- Check if 'cancelled' status exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM unnest(enum_range(NULL::visit_status)) AS val WHERE val::text = 'cancelled'
    ) THEN
        ALTER TYPE visit_status ADD VALUE 'cancelled';
    END IF;
END $$;

-- 10. Add comments for documentation
COMMENT ON COLUMN visits.token_number IS 'Sequential token number for daily queue management';
COMMENT ON COLUMN visits.checked_in_at IS 'Timestamp when patient checked in for appointment';
COMMENT ON COLUMN visits.priority IS 'Priority flag for urgent cases';
COMMENT ON VIEW users IS 'Compatibility view mapping user_profiles to users table for existing code';

-- 11. Grant appropriate permissions for the view
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- 12. Update RLS policies for the users view
ALTER VIEW users OWNER TO postgres;

COMMIT;