-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'service_attendant', 'pharmacist');
CREATE TYPE visit_status AS ENUM ('waiting', 'in_consultation', 'services_pending', 'completed', 'billed');
CREATE TYPE service_status AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE treatment_status AS ENUM ('planned', 'active', 'completed', 'paused');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'insurance', 'bank_transfer');

-- User Profiles (extends auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    specialization TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Patients
CREATE TABLE patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT UNIQUE,
    dob DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    email TEXT,
    emergency_contact TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Visits (OPD)
CREATE TABLE visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    token_number INTEGER NOT NULL,
    department TEXT NOT NULL,
    visit_date DATE DEFAULT CURRENT_DATE NOT NULL,
    status visit_status DEFAULT 'waiting' NOT NULL,
    consultation_notes TEXT,
    diagnosis TEXT,
    opd_charge DECIMAL(10,2) DEFAULT 0,
    priority BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(token_number, department, visit_date)
);

-- Services Master
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER DEFAULT 30, -- in minutes
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Visit Services (Services assigned to a visit)
CREATE TABLE visit_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    attendant_id UUID REFERENCES auth.users(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status service_status DEFAULT 'assigned' NOT NULL,
    notes TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Medicines Master
CREATE TABLE medicines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    brand TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_type TEXT DEFAULT 'tablet', -- tablet, syrup, injection, etc.
    stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    batch_number TEXT,
    expiry_date DATE,
    supplier TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES medicines(id) NOT NULL,
    quantity INTEGER NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pharmacy Issues (Medicine dispensing)
CREATE TABLE pharmacy_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
    issued_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    batch_number TEXT,
    expiry_date DATE,
    issued_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'dispensed' CHECK (status IN ('dispensed', 'cancelled')),
    notes TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Treatment Plans
CREATE TABLE treatment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    total_sessions INTEGER NOT NULL,
    completed_sessions INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2),
    status treatment_status DEFAULT 'planned' NOT NULL,
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Treatment Sessions
CREATE TABLE treatment_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE NOT NULL,
    session_number INTEGER NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    attendant_id UUID REFERENCES auth.users(id),
    scheduled_date DATE,
    session_date DATE,
    status service_status DEFAULT 'assigned' NOT NULL,
    notes TEXT,
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(treatment_plan_id, session_number)
);

-- Invoices
CREATE TABLE invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    opd_charge DECIMAL(10,2) DEFAULT 0,
    services_charge DECIMAL(10,2) DEFAULT 0,
    medicines_charge DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    payment_method payment_method,
    payment_reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Queue Management (Real-time view)
CREATE VIEW current_queue AS
SELECT 
    v.id,
    v.token_number,
    v.department,
    v.status,
    v.priority,
    v.checked_in_at,
    p.name as patient_name,
    p.mobile as patient_mobile,
    up.name as doctor_name,
    ROW_NUMBER() OVER (PARTITION BY v.department ORDER BY v.priority DESC, v.checked_in_at ASC) as queue_position
FROM visits v
JOIN patients p ON v.patient_id = p.id
JOIN user_profiles up ON v.doctor_id = up.id
WHERE v.visit_date = CURRENT_DATE 
AND v.status IN ('waiting', 'in_consultation')
ORDER BY v.department, v.priority DESC, v.checked_in_at ASC;

-- Indexes for performance
CREATE INDEX idx_visits_date_status ON visits(visit_date, status);
CREATE INDEX idx_visits_doctor_date ON visits(doctor_id, visit_date);
CREATE INDEX idx_patients_mobile ON patients(mobile);
CREATE INDEX idx_prescriptions_visit ON prescriptions(visit_id);
CREATE INDEX idx_visit_services_visit ON visit_services(visit_id);
CREATE INDEX idx_visit_services_attendant ON visit_services(attendant_id);
CREATE INDEX idx_pharmacy_issues_prescription ON pharmacy_issues(prescription_id);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_invoices_visit ON invoices(visit_id);

-- Functions for business logic
CREATE OR REPLACE FUNCTION generate_token_number(dept TEXT, visit_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1 
    INTO next_token
    FROM visits 
    WHERE department = dept AND visit_date = visit_date;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 
    INTO next_number
    FROM invoices 
    WHERE invoice_number LIKE 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';
    
    invoice_num := 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_number::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visit_services_updated_at BEFORE UPDATE ON visit_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_sessions_updated_at BEFORE UPDATE ON treatment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();