-- Disable RLS for notifications table to work with custom authentication
-- This is needed because we're using custom cookie-based authentication instead of Supabase Auth

-- Disable Row Level Security on notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Disabled RLS on notifications table for custom authentication' as result;