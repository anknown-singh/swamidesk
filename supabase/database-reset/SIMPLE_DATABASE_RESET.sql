-- =====================================================
-- SwamIDesk SIMPLE Database Reset Script
-- =====================================================
-- Alternative reset script if the full version fails
-- Drops all tables first, then creates essential ones
-- =====================================================

-- Enable necessary extensions (these may already exist)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- STEP 1: FORCE DROP ALL TABLES (Aggressive Cleanup)
-- =====================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in current schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema()) AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions (except system ones)
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as args FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema()) AND proname NOT LIKE 'pg_%') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE ESSENTIAL TYPES
-- =====================================================

-- CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'pharmacist', 'nurse');
-- CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
-- CREATE TYPE appointment_type AS ENUM ('consultation', 'follow_up', 'procedure', 'checkup', 'emergency', 'vaccination');

SELECT 'SwamIDesk Simple Database Reset Complete!' as result;