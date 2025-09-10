-- Fix OPD records RLS policy to allow receptionists to create OPD records
-- when booking appointments

-- Drop existing policies
DROP POLICY IF EXISTS "Medical staff can view OPD records" ON opd_records;
DROP POLICY IF EXISTS "Medical staff can manage OPD records" ON opd_records;

-- Create updated policies that include receptionist role
CREATE POLICY "Medical staff can view OPD records" ON opd_records
    FOR SELECT USING (
        get_user_role() IN ('admin', 'doctor', 'nurse', 'receptionist')
    );

CREATE POLICY "Medical staff can manage OPD records" ON opd_records
    FOR ALL USING (
        get_user_role() IN ('admin', 'doctor', 'nurse', 'receptionist')
    );

-- Add comment for clarity
COMMENT ON POLICY "Medical staff can manage OPD records" ON opd_records 
IS 'Allows admin, doctor, nurse, and receptionist roles to create, read, update, and delete OPD records. Receptionists need this access to create OPD records when booking appointments.';