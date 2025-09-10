-- Remove specified columns from opd_records table
-- Removing visit_date, chief_complaint, examination_findings, diagnosis, treatment_plan

BEGIN;

-- Drop the specified columns from opd_records table
ALTER TABLE opd_records 
DROP COLUMN IF EXISTS visit_date,
DROP COLUMN IF EXISTS chief_complaint,
DROP COLUMN IF EXISTS examination_findings,
DROP COLUMN IF EXISTS diagnosis,
DROP COLUMN IF EXISTS treatment_plan;

COMMIT;

-- Success message
SELECT 'Removed columns from opd_records table!' as result,
       'visit_date, chief_complaint, examination_findings, diagnosis, treatment_plan columns have been dropped' as details;