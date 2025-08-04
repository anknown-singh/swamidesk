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

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT department 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (get_user_role() = 'admin');

-- Patients Policies
CREATE POLICY "Staff can view all patients" ON patients
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist')
    );

CREATE POLICY "Receptionists and admins can manage patients" ON patients
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Visits Policies
CREATE POLICY "Staff can view visits" ON visits
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist')
    );

CREATE POLICY "Doctors can view their visits" ON visits
    FOR SELECT USING (
        auth.uid() = doctor_id AND get_user_role() = 'doctor'
    );

CREATE POLICY "Receptionists can manage visits" ON visits
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

CREATE POLICY "Doctors can update their visits" ON visits
    FOR UPDATE USING (
        auth.uid() = doctor_id AND get_user_role() = 'doctor'
    );

-- Services Policies (Master data - read-only for most users)
CREATE POLICY "All staff can view services" ON services
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist')
    );

CREATE POLICY "Admins can manage services" ON services
    FOR ALL USING (get_user_role() = 'admin');

-- Visit Services Policies
CREATE POLICY "Staff can view visit services" ON visit_services
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist')
    );

CREATE POLICY "Doctors can assign services" ON visit_services
    FOR INSERT USING (
        get_user_role() = 'doctor' AND 
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND doctor_id = auth.uid())
    );

CREATE POLICY "Service attendants can update assigned services" ON visit_services
    FOR UPDATE USING (
        (auth.uid() = attendant_id AND get_user_role() = 'service_attendant') OR
        get_user_role() = 'admin'
    );

-- Medicines Policies
CREATE POLICY "Staff can view medicines" ON medicines
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'pharmacist')
    );

CREATE POLICY "Pharmacists and admins can manage medicines" ON medicines
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Prescriptions Policies
CREATE POLICY "Medical staff can view prescriptions" ON prescriptions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'pharmacist')
    );

CREATE POLICY "Doctors can create prescriptions for their visits" ON prescriptions
    FOR INSERT USING (
        get_user_role() = 'doctor' AND 
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND doctor_id = auth.uid())
    );

CREATE POLICY "Doctors can update their prescriptions" ON prescriptions
    FOR UPDATE USING (
        get_user_role() = 'doctor' AND 
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND doctor_id = auth.uid())
    );

-- Pharmacy Issues Policies
CREATE POLICY "Pharmacists can view all pharmacy issues" ON pharmacy_issues
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'pharmacist')
    );

CREATE POLICY "Pharmacists can manage pharmacy issues" ON pharmacy_issues
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Treatment Plans Policies
CREATE POLICY "Medical staff can view treatment plans" ON treatment_plans
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'service_attendant')
    );

CREATE POLICY "Doctors can manage treatment plans for their visits" ON treatment_plans
    FOR ALL USING (
        get_user_role() IN ('admin', 'doctor') AND 
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND doctor_id = auth.uid())
    );

-- Treatment Sessions Policies
CREATE POLICY "Medical staff can view treatment sessions" ON treatment_sessions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'doctor', 'service_attendant')
    );

CREATE POLICY "Service attendants can update assigned sessions" ON treatment_sessions
    FOR UPDATE USING (
        (auth.uid() = attendant_id AND get_user_role() = 'service_attendant') OR
        get_user_role() = 'admin'
    );

-- Invoices Policies
CREATE POLICY "Billing staff can view all invoices" ON invoices
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        get_user_role() IN ('admin', 'receptionist')
    );

CREATE POLICY "Billing staff can manage invoices" ON invoices
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE visits;
ALTER PUBLICATION supabase_realtime ADD TABLE visit_services;
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;