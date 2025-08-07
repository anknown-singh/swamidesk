-- Fix RLS policies for all appointment-related tables to work with Supabase authentication
-- The issue is that auth.role() = 'authenticated' doesn't work as expected with PostgREST
-- We need to check if auth.uid() is not null instead

-- FIX APPOINTMENTS TABLE
DROP POLICY IF EXISTS "Appointments visible to all authenticated users" ON appointments;
DROP POLICY IF EXISTS "Appointments can be inserted by authenticated users" ON appointments;  
DROP POLICY IF EXISTS "Appointments can be updated by authenticated users" ON appointments;

CREATE POLICY "Enable read access for authenticated users" ON appointments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users" ON appointments  
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users" ON appointments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users" ON appointments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- FIX DOCTOR AVAILABILITY TABLE
DROP POLICY IF EXISTS "Doctor availability visible to authenticated users" ON doctor_availability;

CREATE POLICY "Enable all access for authenticated users on doctor_availability" ON doctor_availability
    FOR ALL USING (auth.uid() IS NOT NULL);

-- FIX APPOINTMENT SLOTS TABLE  
DROP POLICY IF EXISTS "Appointment slots visible to authenticated users" ON appointment_slots;

CREATE POLICY "Enable all access for authenticated users on appointment_slots" ON appointment_slots
    FOR ALL USING (auth.uid() IS NOT NULL);

-- FIX APPOINTMENT SERVICES TABLE
DROP POLICY IF EXISTS "Appointment services visible to authenticated users" ON appointment_services;

CREATE POLICY "Enable all access for authenticated users on appointment_services" ON appointment_services
    FOR ALL USING (auth.uid() IS NOT NULL);

-- FIX APPOINTMENT REMINDERS TABLE
DROP POLICY IF EXISTS "Appointment reminders visible to authenticated users" ON appointment_reminders;

CREATE POLICY "Enable all access for authenticated users on appointment_reminders" ON appointment_reminders
    FOR ALL USING (auth.uid() IS NOT NULL);

-- FIX APPOINTMENT WAITLIST TABLE
DROP POLICY IF EXISTS "Appointment waitlist visible to authenticated users" ON appointment_waitlist;

CREATE POLICY "Enable all access for authenticated users on appointment_waitlist" ON appointment_waitlist
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled on all tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;  
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;