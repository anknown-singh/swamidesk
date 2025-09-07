-- Fix visits table to add missing department column
-- This column is being queried by the application but doesn't exist

ALTER TABLE visits ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add an index for performance since it's being queried
CREATE INDEX IF NOT EXISTS idx_visits_department ON visits(department);

-- Success message
SELECT 'Fixed visits table structure - added department column' as result;