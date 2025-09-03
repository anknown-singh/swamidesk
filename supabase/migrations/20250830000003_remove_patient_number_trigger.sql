-- Remove patient_number trigger since actual table doesn't have this field
-- This fixes the 42703 error: record "new" has no field "patient_number"

-- Drop the trigger that's causing the error
DROP TRIGGER IF EXISTS trigger_set_patient_number ON patients;

-- Drop the trigger function since it references non-existent patient_number field
DROP FUNCTION IF EXISTS set_patient_number();

-- Drop the patient number generation function as well since it's not needed
DROP FUNCTION IF EXISTS generate_patient_number();

-- Add comment explaining the fix
COMMENT ON TABLE patients IS 'Patient number trigger removed - table uses UUID id field instead. RLS temporarily disabled for registration.';