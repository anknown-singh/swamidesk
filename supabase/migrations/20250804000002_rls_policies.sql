-- Row Level Security Policies for SwamiCare
-- Migration: 20250804000002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

-- Patients Policies
CREATE POLICY "patients_select_policy" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "patients_insert_policy" ON patients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "patients_update_policy" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

-- Visits Policies
CREATE POLICY "visits_select_policy" ON visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "visits_insert_policy" ON visits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "visits_update_policy" ON visits
    FOR UPDATE USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

-- Services Policies
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.is_active = true
        )
    );

CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

-- Visit Services Policies
CREATE POLICY "visit_services_select_policy" ON visit_services
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id AND v.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "visit_services_insert_policy" ON visit_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "visit_services_update_policy" ON visit_services
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id AND v.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

-- Medicines Policies
CREATE POLICY "medicines_select_policy" ON medicines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "medicines_insert_policy" ON medicines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "medicines_update_policy" ON medicines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

-- Prescriptions Policies
CREATE POLICY "prescriptions_select_policy" ON prescriptions
    FOR SELECT USING (
        prescribed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'pharmacist')
            AND up.is_active = true
        )
    );

CREATE POLICY "prescriptions_insert_policy" ON prescriptions
    FOR INSERT WITH CHECK (
        prescribed_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

CREATE POLICY "prescriptions_update_policy" ON prescriptions
    FOR UPDATE USING (
        prescribed_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

-- Pharmacy Issues Policies
CREATE POLICY "pharmacy_issues_select_policy" ON pharmacy_issues
    FOR SELECT USING (
        issued_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor')
            AND up.is_active = true
        )
    );

CREATE POLICY "pharmacy_issues_insert_policy" ON pharmacy_issues
    FOR INSERT WITH CHECK (
        issued_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'pharmacist'
            AND up.is_active = true
        )
    );

CREATE POLICY "pharmacy_issues_update_policy" ON pharmacy_issues
    FOR UPDATE USING (
        issued_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'pharmacist'
            AND up.is_active = true
        )
    );

-- Treatment Plans Policies
CREATE POLICY "treatment_plans_select_policy" ON treatment_plans
    FOR SELECT USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'service_attendant')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_plans_insert_policy" ON treatment_plans
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'doctor'
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_plans_update_policy" ON treatment_plans
    FOR UPDATE USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

-- Treatment Sessions Policies
CREATE POLICY "treatment_sessions_select_policy" ON treatment_sessions
    FOR SELECT USING (
        conducted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM treatment_plans tp 
            WHERE tp.id = treatment_plan_id AND tp.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_sessions_insert_policy" ON treatment_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'doctor', 'service_attendant')
            AND up.is_active = true
        )
    );

CREATE POLICY "treatment_sessions_update_policy" ON treatment_sessions
    FOR UPDATE USING (
        conducted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM treatment_plans tp 
            WHERE tp.id = treatment_plan_id AND tp.doctor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'service_attendant')
            AND up.is_active = true
        )
    );

-- Invoices Policies
CREATE POLICY "invoices_select_policy" ON invoices
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "invoices_insert_policy" ON invoices
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );

CREATE POLICY "invoices_update_policy" ON invoices
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'receptionist')
            AND up.is_active = true
        )
    );