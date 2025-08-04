-- Fix RLS Policy Infinite Recursion Issue
-- Run this in Supabase SQL Editor

-- Drop and recreate user_profiles policies to fix infinite recursion
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'authenticated'
    );

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id
    );

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- Also update other policies that might cause issues
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
CREATE POLICY "patients_select_policy" ON patients
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'authenticated'
    );

DROP POLICY IF EXISTS "visits_select_policy" ON visits;
CREATE POLICY "visits_select_policy" ON visits
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'authenticated'
    );

DROP POLICY IF EXISTS "services_select_policy" ON services;
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'authenticated'
    );