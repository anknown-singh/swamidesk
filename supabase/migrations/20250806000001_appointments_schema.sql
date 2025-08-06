-- Appointments System Schema Migration
-- Migration: 20250806000001_appointments_schema.sql

-- Create appointment-related enums
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'arrived', 'in_progress', 
  'completed', 'cancelled', 'no_show', 'rescheduled'
);

CREATE TYPE appointment_type AS ENUM (
  'consultation', 'follow_up', 'procedure', 'checkup', 
  'emergency', 'vaccination'
);

CREATE TYPE recurrence_type AS ENUM (
  'none', 'daily', 'weekly', 'bi_weekly', 'monthly', 'custom'
);

CREATE TYPE availability_status AS ENUM (
  'available', 'busy', 'break', 'off', 'blocked'
);

CREATE TYPE reminder_type AS ENUM (
  'sms', 'email', 'whatsapp', 'call'
);

CREATE TYPE reminder_status AS ENUM (
  'pending', 'sent', 'failed', 'cancelled'
);

-- Appointments table - main appointment records
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    department VARCHAR(100) NOT NULL,
    appointment_type appointment_type NOT NULL DEFAULT 'consultation',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    
    -- Scheduling information
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- in minutes
    estimated_end_time TIME GENERATED ALWAYS AS (CAST(scheduled_time + (duration * INTERVAL '1 minute') AS TIME)) STORED,
    
    -- Appointment details
    title VARCHAR(200),
    description TEXT,
    chief_complaint TEXT,
    notes TEXT,
    patient_notes TEXT,
    
    -- Status flags
    priority BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type recurrence_type DEFAULT 'none',
    recurrence_end_date DATE,
    parent_appointment_id UUID REFERENCES appointments(id),
    
    -- Notifications
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Timestamps
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false AND recurrence_type = 'none') OR
        (is_recurring = true AND recurrence_type != 'none')
    ),
    CONSTRAINT valid_date_time CHECK (scheduled_date >= CURRENT_DATE - INTERVAL '1 year'),
    CONSTRAINT valid_duration CHECK (duration BETWEEN 5 AND 480) -- 5 min to 8 hours
);

-- Doctor availability patterns
CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    is_available BOOLEAN DEFAULT true,
    max_appointments INTEGER DEFAULT 20,
    appointment_duration INTEGER DEFAULT 30, -- default slot duration in minutes
    buffer_time INTEGER DEFAULT 0, -- buffer between appointments in minutes
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_day_times CHECK (start_time < end_time),
    CONSTRAINT valid_break_times CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND 
         break_start_time >= start_time AND break_end_time <= end_time AND
         break_start_time < break_end_time)
    ),
    CONSTRAINT valid_max_appointments CHECK (max_appointments > 0),
    CONSTRAINT valid_durations CHECK (appointment_duration > 0 AND buffer_time >= 0),
    
    UNIQUE(doctor_id, day_of_week, effective_from)
);

-- Specific appointment slots (overrides for availability)
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'available',
    appointment_id UUID REFERENCES appointments(id),
    max_capacity INTEGER DEFAULT 1,
    booked_count INTEGER DEFAULT 0,
    is_emergency_slot BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_slot_times CHECK (start_time < end_time),
    CONSTRAINT valid_capacity CHECK (max_capacity > 0 AND booked_count >= 0 AND booked_count <= max_capacity),
    CONSTRAINT valid_booking CHECK (
        (appointment_id IS NULL AND status IN ('available', 'break', 'off', 'blocked')) OR
        (appointment_id IS NOT NULL AND status IN ('busy'))
    ),
    
    UNIQUE(doctor_id, slot_date, start_time)
);

-- Services associated with appointments
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    estimated_duration INTEGER DEFAULT 30, -- in minutes
    actual_duration INTEGER,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
    notes TEXT,
    status service_status DEFAULT 'assigned',
    assigned_to UUID REFERENCES users(id), -- service attendant
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_durations CHECK (
        estimated_duration > 0 AND 
        (actual_duration IS NULL OR actual_duration > 0)
    )
);

-- Appointment reminders
CREATE TABLE appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status reminder_status NOT NULL DEFAULT 'pending',
    message_template TEXT NOT NULL,
    actual_message TEXT,
    recipient_contact VARCHAR(100), -- phone or email
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_retry CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT valid_status_logic CHECK (
        (status = 'sent' AND sent_at IS NOT NULL) OR
        (status != 'sent' AND sent_at IS NULL)
    )
);

-- Appointment waitlist
CREATE TABLE appointment_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    department VARCHAR(100),
    appointment_type appointment_type NOT NULL DEFAULT 'consultation',
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    priority INTEGER DEFAULT 0, -- higher number = higher priority
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'expired', 'fulfilled')),
    contact_attempts INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    fulfilled_appointment_id UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_priority CHECK (priority >= 0),
    CONSTRAINT valid_time_range CHECK (
        (preferred_time_start IS NULL AND preferred_time_end IS NULL) OR
        (preferred_time_start IS NOT NULL AND preferred_time_end IS NOT NULL AND
         preferred_time_start < preferred_time_end)
    ),
    CONSTRAINT valid_contact_attempts CHECK (contact_attempts >= 0)
);

-- Functions for appointment number generation
CREATE OR REPLACE FUNCTION generate_appointment_number() 
RETURNS VARCHAR(30) AS $$
DECLARE
    new_number VARCHAR(30);
    counter INTEGER;
BEGIN
    -- Get the count of appointments today to generate next number
    SELECT COUNT(*) + 1 INTO counter 
    FROM appointments 
    WHERE scheduled_date = CURRENT_DATE;
    
    new_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM appointments WHERE appointment_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic appointment number generation
CREATE OR REPLACE FUNCTION set_appointment_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := generate_appointment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_number
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_number();

-- Function to calculate appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_doctor_id UUID,
    p_scheduled_date DATE,
    p_scheduled_time TIME,
    p_duration INTEGER,
    p_exclude_appointment_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    end_time TIME;
    conflict_count INTEGER;
BEGIN
    end_time := p_scheduled_time + (p_duration * INTERVAL '1 minute');
    
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND scheduled_date = p_scheduled_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND (
          (scheduled_time <= p_scheduled_time AND estimated_end_time > p_scheduled_time) OR
          (scheduled_time < end_time AND scheduled_time >= p_scheduled_time)
      );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for timestamp management
CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_appointment_waitlist_updated_at
    BEFORE UPDATE ON appointment_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX idx_appointments_department ON appointments(department);
CREATE INDEX idx_appointments_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_recurring ON appointments(parent_appointment_id) WHERE is_recurring = true;

CREATE INDEX idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX idx_doctor_availability_effective ON doctor_availability(effective_from, effective_to);

CREATE INDEX idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);
CREATE INDEX idx_appointment_slots_date_time ON appointment_slots(slot_date, start_time);
CREATE INDEX idx_appointment_slots_status ON appointment_slots(status);

CREATE INDEX idx_appointment_services_appointment ON appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service ON appointment_services(service_id);
CREATE INDEX idx_appointment_services_assigned ON appointment_services(assigned_to);

CREATE INDEX idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled ON appointment_reminders(scheduled_at);
CREATE INDEX idx_appointment_reminders_status ON appointment_reminders(status);

CREATE INDEX idx_appointment_waitlist_patient ON appointment_waitlist(patient_id);
CREATE INDEX idx_appointment_waitlist_doctor ON appointment_waitlist(doctor_id);
CREATE INDEX idx_appointment_waitlist_status ON appointment_waitlist(status);
CREATE INDEX idx_appointment_waitlist_priority ON appointment_waitlist(priority DESC);

-- Enable Row Level Security (RLS) for all appointment tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Appointments visible to all authenticated users" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Appointments can be inserted by authenticated users" ON appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Appointments can be updated by authenticated users" ON appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Doctor availability visible to authenticated users" ON doctor_availability
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Appointment slots visible to authenticated users" ON appointment_slots
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Appointment services visible to authenticated users" ON appointment_services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Appointment reminders visible to authenticated users" ON appointment_reminders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Appointment waitlist visible to authenticated users" ON appointment_waitlist
    FOR ALL USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE appointments IS 'Main appointment records with scheduling and status management';
COMMENT ON TABLE doctor_availability IS 'Weekly availability patterns for doctors';
COMMENT ON TABLE appointment_slots IS 'Specific time slots that override general availability';
COMMENT ON TABLE appointment_services IS 'Services associated with each appointment';
COMMENT ON TABLE appointment_reminders IS 'Automated reminder system for appointments';
COMMENT ON TABLE appointment_waitlist IS 'Patient waitlist for appointment availability';

COMMENT ON FUNCTION generate_appointment_number() IS 'Generates unique appointment numbers in format APT+YYYYMMDD+0001';
COMMENT ON FUNCTION check_appointment_conflict(UUID, DATE, TIME, INTEGER, UUID) IS 'Checks for scheduling conflicts before booking appointments';