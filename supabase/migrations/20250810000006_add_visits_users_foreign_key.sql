-- Add foreign key constraint between visits and users tables
-- Migration: 20250810000006_add_visits_users_foreign_key.sql
-- Purpose: Create the missing foreign key relationship for PostgREST queries

-- 1. Drop any existing constraint with the same name (in case it exists but is broken)
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_doctor_id_fkey;

-- 2. Ensure data consistency before adding the constraint
-- Update any visits that reference non-existent users to NULL
UPDATE visits 
SET doctor_id = NULL 
WHERE doctor_id IS NOT NULL 
AND doctor_id NOT IN (SELECT id FROM users);

-- 3. Add the foreign key constraint
ALTER TABLE visits 
ADD CONSTRAINT visits_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES users(id)
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 4. Create an index on doctor_id for better performance
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);

-- 5. Add comments for documentation
COMMENT ON CONSTRAINT visits_doctor_id_fkey ON visits IS 'Foreign key linking visits to the doctor (user) handling the visit';

-- 6. Refresh PostgREST schema cache (this may not work in all environments)
NOTIFY pgrst, 'reload schema';

COMMIT;