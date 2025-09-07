-- =====================================================
-- SwamIDesk Row Level Security (RLS) Policies
-- =====================================================
-- Comprehensive security policies for all 29+ tables
-- Role-based access control for clinic management system

-- =====================================================
-- STEP 1: Enable RLS on All Tables
-- =====================================================

-- Core system tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Medicine & Pharmacy tables
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Appointment system tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- Clinical management tables
ALTER TABLE visit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supporting tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Helper Functions
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT department 
        FROM user_profiles 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'doctor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff member
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.role() = 'authenticated' AND 
           get_user_role() IN ('admin', 'doctor', 'receptionist', 'pharmacist', 'nurse');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Users & User Profiles Policies
-- =====================================================

-- Users table policies
CREATE POLICY "Users can view all user records" ON users
    FOR SELECT USING (is_staff());

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (is_admin());

-- User profiles policies
CREATE POLICY "Staff can view all user profiles" ON user_profiles
    FOR SELECT USING (is_staff());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user profiles" ON user_profiles
    FOR ALL USING (is_admin());

-- =====================================================
-- STEP 4: Patient Management Policies
-- =====================================================

CREATE POLICY "Staff can view all patients" ON patients
    FOR SELECT USING (is_staff());

CREATE POLICY "Receptionist and admin can manage patients" ON patients
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

CREATE POLICY "Medical staff can update patient medical info" ON patients
    FOR UPDATE USING (
        get_user_role() IN ('admin', 'doctor', 'nurse')
    );

-- =====================================================
-- STEP 5: Services & Clinical Policies
-- =====================================================

-- Services policies
CREATE POLICY "Staff can view all services" ON services
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin can manage services" ON services
    FOR ALL USING (is_admin());

-- Visits policies
CREATE POLICY "Staff can view visits" ON visits
    FOR SELECT USING (is_staff());

CREATE POLICY "Doctors can manage their visits" ON visits
    FOR ALL USING (
        get_user_role() = 'doctor' AND auth.uid() = doctor_id
    );

CREATE POLICY "Receptionist can manage visits" ON visits
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Visit services policies
CREATE POLICY "Staff can view visit services" ON visit_services
    FOR SELECT USING (is_staff());

CREATE POLICY "Medical staff can manage visit services" ON visit_services
    FOR ALL USING (
        get_user_role() IN ('admin', 'doctor', 'nurse') OR
        (get_user_role() = 'nurse' AND auth.uid() = performed_by)
    );

-- Prescriptions policies
CREATE POLICY "Medical and pharmacy staff can view prescriptions" ON prescriptions
    FOR SELECT USING (
        get_user_role() IN ('admin', 'doctor', 'pharmacist', 'nurse')
    );

CREATE POLICY "Doctors can create prescriptions for their visits" ON prescriptions
    FOR INSERT WITH CHECK (
        get_user_role() = 'doctor' AND 
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND doctor_id = auth.uid())
    );

CREATE POLICY "Doctors can update their prescriptions" ON prescriptions
    FOR UPDATE USING (
        get_user_role() = 'doctor' AND auth.uid() = prescribed_by
    );

CREATE POLICY "Pharmacists can dispense prescriptions" ON prescriptions
    FOR UPDATE USING (
        get_user_role() = 'pharmacist' AND 
        (dispensed_by IS NULL OR dispensed_by = auth.uid())
    );

-- =====================================================
-- STEP 6: Medicine & Pharmacy Policies
-- =====================================================

-- Medicine master policies (reference data)
CREATE POLICY "Staff can view medicine master" ON medicine_master
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin and pharmacist can manage medicine master" ON medicine_master
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Medicines inventory policies
CREATE POLICY "Medical and pharmacy staff can view medicines" ON medicines
    FOR SELECT USING (
        get_user_role() IN ('admin', 'doctor', 'pharmacist', 'nurse')
    );

CREATE POLICY "Pharmacists can manage medicines inventory" ON medicines
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Pharmacy issues policies
CREATE POLICY "Pharmacy staff can view pharmacy issues" ON pharmacy_issues
    FOR SELECT USING (
        get_user_role() IN ('admin', 'pharmacist')
    );

CREATE POLICY "Pharmacists can manage pharmacy issues" ON pharmacy_issues
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Purchase orders policies
CREATE POLICY "Admin and pharmacist can view purchase orders" ON purchase_orders
    FOR SELECT USING (
        get_user_role() IN ('admin', 'pharmacist')
    );

CREATE POLICY "Admin and pharmacist can manage purchase orders" ON purchase_orders
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Purchase order items policies
CREATE POLICY "Admin and pharmacist can view purchase order items" ON purchase_order_items
    FOR SELECT USING (
        get_user_role() IN ('admin', 'pharmacist')
    );

CREATE POLICY "Admin and pharmacist can manage purchase order items" ON purchase_order_items
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Sell orders policies
CREATE POLICY "Staff can view sell orders" ON sell_orders
    FOR SELECT USING (is_staff());

CREATE POLICY "Pharmacist and admin can manage sell orders" ON sell_orders
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist', 'receptionist'));

-- Sell order items policies
CREATE POLICY "Staff can view sell order items" ON sell_order_items
    FOR SELECT USING (is_staff());

CREATE POLICY "Pharmacist can manage sell order items" ON sell_order_items
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- Inventory policies
CREATE POLICY "Pharmacy staff can view inventory" ON inventory
    FOR SELECT USING (
        get_user_role() IN ('admin', 'pharmacist')
    );

CREATE POLICY "Pharmacists can manage inventory" ON inventory
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- =====================================================
-- STEP 7: Appointment System Policies
-- =====================================================

-- Appointments policies
CREATE POLICY "Staff can view appointments" ON appointments
    FOR SELECT USING (is_staff());

CREATE POLICY "Doctors can view their appointments" ON appointments
    FOR SELECT USING (
        get_user_role() = 'doctor' AND auth.uid() = doctor_id
    );

CREATE POLICY "Receptionist can manage appointments" ON appointments
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

CREATE POLICY "Doctors can update their appointments" ON appointments
    FOR UPDATE USING (
        get_user_role() = 'doctor' AND auth.uid() = doctor_id
    );

-- Doctor availability policies
CREATE POLICY "Staff can view doctor availability" ON doctor_availability
    FOR SELECT USING (is_staff());

CREATE POLICY "Doctors can manage own availability" ON doctor_availability
    FOR ALL USING (
        get_user_role() = 'doctor' AND auth.uid() = doctor_id
    );

CREATE POLICY "Admin can manage all doctor availability" ON doctor_availability
    FOR ALL USING (is_admin());

-- Appointment slots policies
CREATE POLICY "Staff can view appointment slots" ON appointment_slots
    FOR SELECT USING (is_staff());

CREATE POLICY "Receptionist can manage appointment slots" ON appointment_slots
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

CREATE POLICY "Doctors can manage their appointment slots" ON appointment_slots
    FOR ALL USING (
        get_user_role() = 'doctor' AND auth.uid() = doctor_id
    );

-- Appointment services policies
CREATE POLICY "Staff can view appointment services" ON appointment_services
    FOR SELECT USING (is_staff());

CREATE POLICY "Medical staff can manage appointment services" ON appointment_services
    FOR ALL USING (
        get_user_role() IN ('admin', 'doctor', 'nurse') OR
        (get_user_role() = 'nurse' AND auth.uid() = assigned_to)
    );

-- Appointment reminders policies
CREATE POLICY "Staff can view appointment reminders" ON appointment_reminders
    FOR SELECT USING (is_staff());

CREATE POLICY "Receptionist can manage appointment reminders" ON appointment_reminders
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Appointment waitlist policies
CREATE POLICY "Staff can view appointment waitlist" ON appointment_waitlist
    FOR SELECT USING (is_staff());

CREATE POLICY "Receptionist can manage appointment waitlist" ON appointment_waitlist
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- =====================================================
-- STEP 8: Treatment & Billing Policies
-- =====================================================

-- Treatment plans policies
CREATE POLICY "Medical staff can view treatment plans" ON treatment_plans
    FOR SELECT USING (
        get_user_role() IN ('admin', 'doctor', 'nurse')
    );

CREATE POLICY "Doctors can manage treatment plans" ON treatment_plans
    FOR ALL USING (
        get_user_role() = 'doctor' OR is_admin()
    );

-- Invoices policies
CREATE POLICY "Staff can view invoices" ON invoices
    FOR SELECT USING (is_staff());

CREATE POLICY "Billing staff can manage invoices" ON invoices
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Billing items policies
CREATE POLICY "Staff can view billing items" ON billing_items
    FOR SELECT USING (is_staff());

CREATE POLICY "Billing staff can manage billing items" ON billing_items
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- Payments policies
CREATE POLICY "Staff can view payments" ON payments
    FOR SELECT USING (is_staff());

CREATE POLICY "Billing staff can manage payments" ON payments
    FOR ALL USING (get_user_role() IN ('admin', 'receptionist'));

-- =====================================================
-- STEP 9: Clinical Records Policies
-- =====================================================

-- OPD records policies
CREATE POLICY "Medical staff can view OPD records" ON opd_records
    FOR SELECT USING (
        get_user_role() IN ('admin', 'doctor', 'nurse')
    );

CREATE POLICY "Medical staff can manage OPD records" ON opd_records
    FOR ALL USING (
        get_user_role() IN ('admin', 'doctor', 'nurse')
    );

-- =====================================================
-- STEP 10: Notifications & Supporting Tables
-- =====================================================

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (role IS NOT NULL AND get_user_role()::text = role) OR
        is_admin()
    );

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all notifications" ON notifications
    FOR ALL USING (is_admin());

-- Suppliers policies
CREATE POLICY "Staff can view suppliers" ON suppliers
    FOR SELECT USING (is_staff());

CREATE POLICY "Admin and pharmacist can manage suppliers" ON suppliers
    FOR ALL USING (get_user_role() IN ('admin', 'pharmacist'));

-- =====================================================
-- STEP 11: Enable Realtime for Critical Tables
-- =====================================================

-- Enable realtime subscriptions for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE visits;
ALTER PUBLICATION supabase_realtime ADD TABLE visit_services;
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE opd_records;

-- =====================================================
-- STEP 12: Additional Security Functions
-- =====================================================

-- Function to check patient access
CREATE OR REPLACE FUNCTION can_access_patient(patient_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin can access all patients
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Doctors can access their patients
    IF get_user_role() = 'doctor' THEN
        RETURN EXISTS (
            SELECT 1 FROM visits 
            WHERE patient_id = patient_uuid AND doctor_id = auth.uid()
        );
    END IF;
    
    -- Other staff can access all patients
    IF is_staff() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check appointment access
CREATE OR REPLACE FUNCTION can_access_appointment(appointment_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin can access all appointments
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Doctors can access their appointments
    IF get_user_role() = 'doctor' THEN
        RETURN EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_uuid AND doctor_id = auth.uid()
        );
    END IF;
    
    -- Receptionist can access all appointments
    IF get_user_role() = 'receptionist' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 13: Audit and Logging Setup
-- =====================================================

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    user_role user_role,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies (admin only)
CREATE POLICY "Admin can view audit log" ON audit_log
    FOR SELECT USING (is_admin());

CREATE POLICY "System can insert audit log" ON audit_log
    FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- STEP 14: Performance and Security Indexes
-- =====================================================

-- Security-related indexes for better RLS performance
-- Note: Cannot use auth.uid() in index predicates as it's not IMMUTABLE
-- CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE id = auth.uid();
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_uid ON user_profiles(user_id) WHERE user_id = auth.uid();
-- CREATE INDEX IF NOT EXISTS idx_visits_doctor_auth ON visits(doctor_id) WHERE doctor_id = auth.uid();
-- CREATE INDEX IF NOT EXISTS idx_appointments_doctor_auth ON appointments(doctor_id) WHERE doctor_id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by ON prescriptions(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role ON notifications(user_id, role);

-- =====================================================
-- STEP 15: Comment Documentation
-- =====================================================

-- Add comprehensive comments
COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION get_user_department() IS 'Returns the department of the currently authenticated user';
COMMENT ON FUNCTION is_admin() IS 'Returns true if the current user is an admin';
COMMENT ON FUNCTION is_doctor() IS 'Returns true if the current user is a doctor';
COMMENT ON FUNCTION is_staff() IS 'Returns true if the current user is a staff member';
COMMENT ON FUNCTION can_access_patient(UUID) IS 'Checks if the current user can access a specific patient';
COMMENT ON FUNCTION can_access_appointment(UUID) IS 'Checks if the current user can access a specific appointment';

COMMENT ON TABLE audit_log IS 'Audit trail for sensitive database operations';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SwamIDesk RLS Policies setup completed successfully!';
    RAISE NOTICE 'Configured: 29+ tables with role-based access control';
    RAISE NOTICE 'Roles: admin, doctor, receptionist, pharmacist, nurse';
END $$;