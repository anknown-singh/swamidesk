-- Fix appointment_status enum to include 'checked_in' value
-- Migration: 20250810000005_fix_appointment_status_enum.sql
-- Purpose: Add 'checked_in' as a valid appointment_status enum value

-- 1. Check if the appointment_status enum type exists and add 'checked_in' value
DO $$
BEGIN
    -- Try to add 'checked_in' to the enum if it doesn't exist
    BEGIN
        ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'checked_in';
    EXCEPTION
        WHEN duplicate_object THEN
            -- Value already exists, do nothing
            RAISE NOTICE 'Value "checked_in" already exists in appointment_status enum';
        WHEN undefined_object THEN
            -- Enum doesn't exist, create it
            CREATE TYPE appointment_status AS ENUM (
                'pending',
                'requested', 
                'scheduled',
                'confirmed',
                'checked_in',
                'arrived',
                'in_progress',
                'completed',
                'cancelled',
                'no_show',
                'rescheduled'
            );
            RAISE NOTICE 'Created appointment_status enum with checked_in value';
    END;
END
$$;

-- 2. Ensure appointments table uses the correct enum type
DO $$
BEGIN
    -- Check if appointments table exists and has status column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Update the column to use the enum type if it's not already
        BEGIN
            ALTER TABLE appointments 
            ALTER COLUMN status TYPE appointment_status 
            USING status::appointment_status;
            
            RAISE NOTICE 'Updated appointments.status column to use appointment_status enum';
        EXCEPTION
            WHEN OTHERS THEN
                -- Column might already be using the enum, or other issue
                RAISE NOTICE 'appointments.status column type update skipped: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'appointments table or status column not found';
    END IF;
END
$$;

-- 3. Add a check constraint as backup if enum doesn't work
DO $$
BEGIN
    -- Add check constraint to ensure valid status values
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN (
        'pending',
        'requested', 
        'scheduled',
        'confirmed',
        'checked_in',
        'arrived',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
        'rescheduled'
    ));
    
    RAISE NOTICE 'Added check constraint for appointment status values';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Check constraint addition failed: %', SQLERRM;
END
$$;

-- 4. Add comments for documentation
COMMENT ON TYPE appointment_status IS 'Valid appointment status values including checked_in for queue workflow';

COMMIT;