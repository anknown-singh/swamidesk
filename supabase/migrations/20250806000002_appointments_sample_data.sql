-- Sample Appointment Data
-- Migration: 20250806000002_appointments_sample_data.sql

-- Insert sample doctor availability patterns
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, break_start_time, break_end_time, max_appointments, appointment_duration, buffer_time) 
SELECT 
    id as doctor_id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '09:00'::time as start_time,
    '17:00'::time as end_time,
    '13:00'::time as break_start_time,
    '14:00'::time as break_end_time,
    16 as max_appointments, -- 8 hours - 1 hour break = 7 hours = 14 slots of 30min each
    30 as appointment_duration,
    0 as buffer_time
FROM users 
WHERE role = 'doctor' AND is_active = true;

-- Insert weekend availability for some doctors (Saturday mornings)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, max_appointments, appointment_duration, buffer_time) 
SELECT 
    id as doctor_id,
    6 as day_of_week, -- Saturday
    '09:00'::time as start_time,
    '13:00'::time as end_time,
    8 as max_appointments, -- 4 hours = 8 slots of 30min each
    30 as appointment_duration,
    0 as buffer_time
FROM users 
WHERE role = 'doctor' AND is_active = true
LIMIT 2; -- Only first 2 doctors work weekends

-- Insert sample appointments for the current week
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
BEGIN
    -- Get current date range (this week)
    FOR appointment_date IN 
        SELECT generate_series(
            CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer, -- Start of week (Sunday)
            CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE)::integer), -- End of week (Saturday)
            '1 day'::interval
        )::date
    LOOP
        -- Only create appointments for weekdays and Saturday morning
        IF EXTRACT(DOW FROM appointment_date) IN (1,2,3,4,5,6) THEN -- Mon-Sat
            
            -- Loop through doctors
            FOR doctor_record IN 
                SELECT id, full_name, department FROM users 
                WHERE role = 'doctor' AND is_active = true
                ORDER BY id
                LIMIT 3 -- Limit to first 3 doctors to keep sample data manageable
            LOOP
                -- Create 3-5 appointments per doctor per day
                FOR i IN 1..(3 + (appointment_count % 3)) LOOP
                    -- Select random patient
                    SELECT * INTO patient_record 
                    FROM patients 
                    ORDER BY RANDOM() 
                    LIMIT 1;
                    
                    IF patient_record.id IS NOT NULL THEN
                        -- Calculate appointment time based on availability
                        IF EXTRACT(DOW FROM appointment_date) = 6 THEN -- Saturday
                            appointment_time := ('09:00'::time + (i * INTERVAL '45 minutes'))::time;
                            -- Skip if time would be after 13:00
                            IF appointment_time > '13:00'::time THEN
                                CONTINUE;
                            END IF;
                        ELSE -- Weekdays
                            appointment_time := ('09:00'::time + (i * INTERVAL '45 minutes'))::time;
                            -- Skip lunch break
                            IF appointment_time >= '13:00'::time AND appointment_time < '14:00'::time THEN
                                appointment_time := '14:00'::time + ((i - 9) * INTERVAL '45 minutes');
                            END IF;
                            -- Skip if time would be after 17:00
                            IF appointment_time > '17:00'::time THEN
                                CONTINUE;
                            END IF;
                        END IF;
                        
                        -- Insert appointment
                        INSERT INTO appointments (
                            patient_id,
                            doctor_id,
                            department,
                            appointment_type,
                            status,
                            scheduled_date,
                            scheduled_time,
                            duration,
                            title,
                            description,
                            chief_complaint,
                            priority,
                            estimated_cost,
                            created_by
                        ) VALUES (
                            patient_record.id,
                            doctor_record.id,
                            COALESCE(doctor_record.department, departments[1 + (appointment_count % array_length(departments, 1))]),
                            appointment_types[1 + (appointment_count % array_length(appointment_types, 1))]::appointment_type,
                            CASE 
                                WHEN appointment_date < CURRENT_DATE THEN 'completed'
                                WHEN appointment_date = CURRENT_DATE AND appointment_time < CURRENT_TIME THEN 
                                    statuses[1 + (appointment_count % array_length(statuses, 1))]::appointment_status
                                ELSE 'scheduled'
                            END::appointment_status,
                            appointment_date,
                            appointment_time,
                            CASE 
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'procedure' THEN 60
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'checkup' THEN 45
                                ELSE 30
                            END,
                            CASE 
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'consultation' THEN 'General Consultation'
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'follow_up' THEN 'Follow-up Visit'
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'procedure' THEN 'Medical Procedure'
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'checkup' THEN 'Routine Checkup'
                                ELSE 'Medical Appointment'
                            END,
                            'Appointment scheduled through clinic management system',
                            CASE 
                                WHEN appointment_count % 4 = 0 THEN 'Fever and headache for 3 days'
                                WHEN appointment_count % 4 = 1 THEN 'Regular checkup and vaccination'
                                WHEN appointment_count % 4 = 2 THEN 'Follow-up for previous treatment'
                                ELSE 'General consultation'
                            END,
                            (appointment_count % 10 = 0), -- 10% priority appointments
                            CASE 
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'procedure' THEN 2500.00
                                WHEN appointment_types[1 + (appointment_count % array_length(appointment_types, 1))] = 'checkup' THEN 800.00
                                ELSE 500.00
                            END,
                            doctor_record.id
                        );
                        
                        appointment_count := appointment_count + 1;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % sample appointments', appointment_count;
END $$;

-- Update some appointments to have realistic status transitions
UPDATE appointments 
SET 
    confirmed_at = created_at + INTERVAL '2 hours',
    status = 'confirmed',
    confirmation_sent = true
WHERE scheduled_date >= CURRENT_DATE 
  AND status = 'scheduled' 
  AND id IN (
      SELECT id FROM appointments 
      WHERE status = 'scheduled' 
      ORDER BY RANDOM() 
      LIMIT (SELECT COUNT(*) * 0.7 FROM appointments WHERE status = 'scheduled')::integer
  );

-- Mark some past appointments as completed with times
UPDATE appointments 
SET 
    status = 'completed',
    arrived_at = scheduled_date + scheduled_time - INTERVAL '5 minutes',
    started_at = scheduled_date + scheduled_time,
    completed_at = scheduled_date + scheduled_time + (duration * INTERVAL '1 minute'),
    actual_cost = estimated_cost
WHERE scheduled_date < CURRENT_DATE;

-- Mark a few appointments as cancelled
UPDATE appointments 
SET 
    status = 'cancelled',
    cancelled_at = created_at + INTERVAL '1 day',
    cancellation_reason = 'Patient requested cancellation due to scheduling conflict'
WHERE scheduled_date > CURRENT_DATE 
  AND id IN (
      SELECT id FROM appointments 
      WHERE scheduled_date > CURRENT_DATE 
      ORDER BY RANDOM() 
      LIMIT 3
  );

-- Add some appointment services for completed appointments
INSERT INTO appointment_services (appointment_id, service_id, quantity, estimated_duration, actual_duration, unit_price, status, completed_at)
SELECT 
    a.id as appointment_id,
    s.id as service_id,
    1 as quantity,
    30 as estimated_duration,
    35 as actual_duration,
    s.price as unit_price,
    'completed'::service_status,
    a.completed_at
FROM appointments a
CROSS JOIN services s
WHERE a.status = 'completed'
  AND s.category = 'consultation'
  AND a.id IN (
      SELECT id FROM appointments 
      WHERE status = 'completed' 
      ORDER BY RANDOM() 
      LIMIT 10
  )
LIMIT 10;

-- Add some appointment reminders for upcoming appointments
INSERT INTO appointment_reminders (appointment_id, reminder_type, scheduled_at, message_template, recipient_contact, status)
SELECT 
    id as appointment_id,
    'sms'::reminder_type,
    (scheduled_date + scheduled_time - INTERVAL '24 hours') as scheduled_at,
    'Reminder: You have an appointment tomorrow at ' || scheduled_time || ' with your doctor. Please arrive 15 minutes early. Call us if you need to reschedule.' as message_template,
    COALESCE(p.phone, '+91-9876543210') as recipient_contact,
    CASE 
        WHEN scheduled_date + scheduled_time - INTERVAL '24 hours' < NOW() THEN 'sent'
        ELSE 'pending'
    END::reminder_status
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.scheduled_date >= CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
LIMIT 15;

-- Update sent reminders with sent_at timestamp
UPDATE appointment_reminders 
SET sent_at = scheduled_at + INTERVAL '5 minutes'
WHERE status = 'sent';

-- Add some waitlist entries
INSERT INTO appointment_waitlist (patient_id, doctor_id, department, appointment_type, preferred_date, preferred_time_start, preferred_time_end, priority, notes, status)
SELECT 
    p.id as patient_id,
    u.id as doctor_id,
    u.department,
    'consultation'::appointment_type,
    CURRENT_DATE + INTERVAL '1 week' as preferred_date,
    '10:00'::time as preferred_time_start,
    '16:00'::time as preferred_time_end,
    CASE WHEN p.id::text LIKE '%1' THEN 5 ELSE 1 END as priority, -- Some high priority based on ID pattern
    'Patient requested appointment but no slots available' as notes,
    'active' as status
FROM patients p
CROSS JOIN users u
WHERE u.role = 'doctor' AND u.is_active = true
ORDER BY RANDOM()
LIMIT 5;

-- Create some specific appointment slots for next week (override availability)
INSERT INTO appointment_slots (doctor_id, slot_date, start_time, end_time, status, max_capacity, is_emergency_slot, notes)
SELECT 
    id as doctor_id,
    CURRENT_DATE + INTERVAL '1 week' as slot_date,
    '18:00'::time as start_time,
    '19:00'::time as end_time,
    'available'::availability_status,
    2 as max_capacity,
    true as is_emergency_slot,
    'Extended hours for emergency appointments' as notes
FROM users 
WHERE role = 'doctor' AND is_active = true
LIMIT 2;

-- Final verification and statistics
DO $$
DECLARE
    total_appointments INTEGER;
    total_confirmed INTEGER;
    total_completed INTEGER;
    total_cancelled INTEGER;
    total_reminders INTEGER;
    total_waitlist INTEGER;
BEGIN
    SELECT COUNT(*) FROM appointments INTO total_appointments;
    SELECT COUNT(*) FROM appointments WHERE status = 'confirmed' INTO total_confirmed;
    SELECT COUNT(*) FROM appointments WHERE status = 'completed' INTO total_completed;
    SELECT COUNT(*) FROM appointments WHERE status = 'cancelled' INTO total_cancelled;
    SELECT COUNT(*) FROM appointment_reminders INTO total_reminders;
    SELECT COUNT(*) FROM appointment_waitlist WHERE status = 'active' INTO total_waitlist;
    
    RAISE NOTICE '=== APPOINTMENT SYSTEM SAMPLE DATA SUMMARY ===';
    RAISE NOTICE 'Total appointments: %', total_appointments;
    RAISE NOTICE 'Confirmed appointments: %', total_confirmed;
    RAISE NOTICE 'Completed appointments: %', total_completed;
    RAISE NOTICE 'Cancelled appointments: %', total_cancelled;
    RAISE NOTICE 'Appointment reminders: %', total_reminders;
    RAISE NOTICE 'Active waitlist entries: %', total_waitlist;
    RAISE NOTICE '=============================================';
    
    IF total_appointments > 0 THEN
        RAISE NOTICE '✅ APPOINTMENT SYSTEM READY! Calendar will now show real appointment data.';
    ELSE
        RAISE NOTICE '❌ No appointments created. Check patients and doctors data.';
    END IF;
END $$;

-- Show sample of created appointments for verification
SELECT 
    'Sample Appointments Created' as status,
    a.appointment_number,
    p.first_name || ' ' || p.last_name as patient_name,
    u.full_name as doctor_name,
    a.appointment_type,
    a.status,
    a.scheduled_date,
    a.scheduled_time,
    a.duration || ' min' as duration,
    a.estimated_cost
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
WHERE a.scheduled_date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY a.scheduled_date, a.scheduled_time
LIMIT 10;