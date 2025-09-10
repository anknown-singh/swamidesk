-- Disable RLS for opd_records table to fix custom authentication compatibility
-- The application uses custom cookie-based authentication, so RLS policies
-- that depend on Supabase auth functions don't work

BEGIN;

-- Disable RLS on opd_records table 
ALTER TABLE opd_records DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Success message
SELECT 'RLS disabled for opd_records table!' as result,
       'OPD record creation should now work with cookie-based auth' as details;