-- APPOINTMENT SYSTEM DEPLOYMENT SCRIPT
-- This script combines the appointment schema and sample data for production deployment
-- Run this in your Supabase SQL Editor to set up the complete appointment system

-- First, ensure we have the required update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- =============================================================================
-- APPOINTMENT SCHEMA SETUP (from 20250806000001_appointments_schema.sql)
-- =============================================================================

-- Create appointment-related enums
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
      'scheduled', 'confirmed', 'arrived', 'in_progress', 
      'completed', 'cancelled', 'no_show', 'rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_type AS ENUM (
      'consultation', 'follow_up', 'procedure', 'checkup', 
      'emergency', 'vaccination'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_type AS ENUM (
      'none', 'daily', 'weekly', 'bi_weekly', 'monthly', 'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM (
      'available', 'busy', 'break', 'off', 'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_type AS ENUM (
      'sms', 'email', 'whatsapp', 'call'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_status AS ENUM (
      'pending', 'sent', 'failed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Appointments table - main appointment records
CREATE TABLE IF NOT EXISTS appointments (
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
CREATE TABLE IF NOT EXISTS doctor_availability (
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
CREATE TABLE IF NOT EXISTS appointment_slots (
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
CREATE TABLE IF NOT EXISTS appointment_services (
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
CREATE TABLE IF NOT EXISTS appointment_reminders (
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
CREATE TABLE IF NOT EXISTS appointment_waitlist (
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

-- Create functions and triggers (only if they don't exist)
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

CREATE OR REPLACE FUNCTION set_appointment_number() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := generate_appointment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if they don't exist
DO $$ BEGIN
    CREATE TRIGGER trigger_set_appointment_number
        BEFORE INSERT ON appointments
        FOR EACH ROW
        EXECUTE FUNCTION set_appointment_number();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trigger_update_appointments_updated_at
        BEFORE UPDATE ON appointments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_department ON appointments(department);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists, then create)
DROP POLICY IF EXISTS "Appointments visible to all authenticated users" ON appointments;
CREATE POLICY "Appointments visible to all authenticated users" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Doctor availability visible to authenticated users" ON doctor_availability;
CREATE POLICY "Doctor availability visible to authenticated users" ON doctor_availability
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- SAMPLE DATA SETUP (from 20250806000002_appointments_sample_data.sql)
-- =============================================================================

-- Insert sample doctor availability patterns
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start_time, break_end_time, max_appointments, appointment_duration, buffer_time) 
SELECT 
    id as doctor_id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '09:00'::time as start_time,
    '17:00'::time as end_time,
    '13:00'::time as break_start_time,
    '14:00'::time as break_end_time,
    16 as max_appointments,
    30 as appointment_duration,
    0 as buffer_time
FROM users 
WHERE role = 'doctor' AND is_active = true
ON CONFLICT (doctor_id, day_of_week, effective_from) DO NOTHING;

-- Create sample appointments for the current week
DO $$
DECLARE
    doctor_record RECORD;
    patient_record RECORD;
    appointment_date DATE;
    appointment_time TIME;
    appointment_types text[] := ARRAY['consultation', 'follow_up', 'procedure', 'checkup'];
    departments text[] := ARRAY['General Medicine', 'ENT', 'Dental', 'Cardiology'];
    statuses text[] := ARRAY['scheduled', 'confirmed', 'completed'];
    appointment_count INTEGER := 0;
    existing_count INTEGER;
BEGIN
    -- Check if we already have appointments
    SELECT COUNT(*) FROM appointments INTO existing_count;
    
    IF existing_count > 0 THEN
        RAISE NOTICE 'Appointments already exist (%), skipping sample data creation', existing_count;
        RETURN;
    END IF;
    
    -- Get current date range (this week)
    FOR appointment_date IN 
        SELECT generate_series(
            CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer,
            CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE)::integer),
            '1 day'::interval
        )::date
    LOOP
        -- Only create appointments for weekdays
        IF EXTRACT(DOW FROM appointment_date) IN (1,2,3,4,5) THEN -- Mon-Fri
            
            -- Loop through doctors
            FOR doctor_record IN 
                SELECT id, full_name, department FROM users 
                WHERE role = 'doctor' AND is_active = true
                LIMIT 3 -- Limit for sample data
            LOOP
                -- Create 2-4 appointments per doctor per day
                FOR i IN 1..(2 + (appointment_count % 3)) LOOP
                    -- Select random patient
                    SELECT * INTO patient_record 
                    FROM patients 
                    ORDER BY RANDOM() 
                    LIMIT 1;
                    
                    IF patient_record.id IS NOT NULL THEN
                        -- Calculate appointment time
                        appointment_time := ('09:00'::time + (i * INTERVAL '45 minutes'))::time;
                        
                        -- Skip lunch break
                        IF appointment_time >= '13:00'::time AND appointment_time < '14:00'::time THEN
                            appointment_time := '14:00'::time + ((i - 9) * INTERVAL '45 minutes');
                        END IF;
                        
                        -- Skip if too late
                        IF appointment_time > '17:00'::time THEN
                            CONTINUE;
                        END IF;
                        
                        -- Insert appointment
                        INSERT INTO appointments (
                            patient_id, doctor_id, department, appointment_type, status,
                            scheduled_date, scheduled_time, duration, title,
                            description, chief_complaint, priority, estimated_cost, created_by
                        ) VALUES (
                            patient_record.id, doctor_record.id,
                            COALESCE(doctor_record.department, departments[1 + (appointment_count % array_length(departments, 1))]),
                            appointment_types[1 + (appointment_count % array_length(appointment_types, 1))]::appointment_type,
                            CASE 
                                WHEN appointment_date < CURRENT_DATE THEN 'completed'
                                WHEN appointment_date = CURRENT_DATE AND appointment_time < CURRENT_TIME THEN 'confirmed'
                                ELSE 'scheduled'
                            END::appointment_status,
                            appointment_date, appointment_time,
                            CASE 
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'procedure' THEN 60
                                ELSE 30
                            END,
                            'Medical Appointment',
                            'Appointment scheduled through clinic system',
                            CASE 
                                WHEN appointment_count % 3 = 0 THEN 'Routine checkup'
                                WHEN appointment_count % 3 = 1 THEN 'Follow-up consultation'
                                ELSE 'General consultation'
                            END,
                            (appointment_count % 10 = 0), -- 10% priority
                            500.00, doctor_record.id
                        );
                        
                        appointment_count := appointment_count + 1;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % sample appointments', appointment_count;
END $$;

-- Update some appointments to confirmed status
UPDATE appointments 
SET status = 'confirmed', confirmed_at = created_at + INTERVAL '1 hour'
WHERE scheduled_date >= CURRENT_DATE 
  AND status = 'scheduled' 
  AND id IN (
      SELECT id FROM appointments 
      WHERE status = 'scheduled' 
      ORDER BY RANDOM() 
      LIMIT (SELECT GREATEST(1, COUNT(*) * 0.6) FROM appointments WHERE status = 'scheduled')::integer
  );

-- =============================================================================
-- VERIFICATION
-- =============================================================================
DO $$
DECLARE
    total_appointments INTEGER;
    total_doctors INTEGER;
    total_availability INTEGER;
BEGIN
    SELECT COUNT(*) FROM appointments INTO total_appointments;
    SELECT COUNT(*) FROM users WHERE role = 'doctor' AND is_active = true INTO total_doctors;
    SELECT COUNT(*) FROM doctor_availability INTO total_availability;
    
    RAISE NOTICE '=== APPOINTMENT SYSTEM DEPLOYMENT COMPLETE ===';
    RAISE NOTICE 'Total appointments: %', total_appointments;
    RAISE NOTICE 'Active doctors: %', total_doctors;
    RAISE NOTICE 'Availability patterns: %', total_availability;
    RAISE NOTICE '===============================================';
    
    IF total_appointments > 0 AND total_doctors > 0 THEN
        RAISE NOTICE '✅ SUCCESS! Real-time appointment calendar is ready to use.';
        RAISE NOTICE 'Features enabled:';
        RAISE NOTICE '  • Real-time appointment tracking';
        RAISE NOTICE '  • Dynamic statistics dashboard';
        RAISE NOTICE '  • Doctor availability management';
        RAISE NOTICE '  • Appointment booking workflow';
        RAISE NOTICE '  • Live calendar updates';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE. Please check patients and users data.';
    END IF;
END $$;