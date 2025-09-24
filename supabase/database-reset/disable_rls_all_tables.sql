-- =====================================================
-- Disable RLS Policies for All Tables
-- =====================================================
-- This script dynamically disables Row Level Security (RLS)
-- for all tables in the public schema without hardcoding table names
-- =====================================================

-- Enable notice messages
SET client_min_messages TO NOTICE;

DO $$
DECLARE
    table_record RECORD;
    disabled_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- Get all tables in the public schema that have RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        total_count := total_count + 1;
        
        BEGIN
            -- Check if RLS is enabled for this table
            IF EXISTS (
                SELECT 1 
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = table_record.schemaname 
                AND c.relname = table_record.tablename 
                AND c.relrowsecurity = true
            ) THEN
                -- Disable RLS for this table
                EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
                              table_record.schemaname, table_record.tablename);
                
                disabled_count := disabled_count + 1;
                RAISE NOTICE '✅ Disabled RLS for table: %', table_record.tablename;
            ELSE
                RAISE NOTICE '⏭️  RLS already disabled for table: %', table_record.tablename;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other tables
            RAISE NOTICE '❌ Error disabling RLS for table %: %', 
                         table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '🔓 RLS Disable Summary:';
    RAISE NOTICE '   Total tables processed: %', total_count;
    RAISE NOTICE '   RLS policies disabled: %', disabled_count;
    RAISE NOTICE '   Tables with RLS already disabled: %', (total_count - disabled_count);
    
    IF disabled_count > 0 THEN
        RAISE NOTICE '✅ Successfully disabled RLS for % tables', disabled_count;
    ELSE
        RAISE NOTICE '⚠️  No tables had RLS enabled';
    END IF;
    
END $$;

-- Additional cleanup: Drop any remaining RLS policies (optional)
-- This section removes any orphaned policies that might still exist

DO $$
DECLARE
    policy_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Cleaning up remaining RLS policies...';
    
    -- Get all RLS policies in the public schema
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        BEGIN
            -- Drop the policy
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          policy_record.policyname,
                          policy_record.schemaname, 
                          policy_record.tablename);
            
            dropped_count := dropped_count + 1;
            RAISE NOTICE '🗑️  Dropped policy: % on table %', 
                         policy_record.policyname, policy_record.tablename;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error dropping policy % on table %: %', 
                         policy_record.policyname, policy_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Summary for policy cleanup
    RAISE NOTICE '';
    IF dropped_count > 0 THEN
        RAISE NOTICE '✅ Successfully dropped % RLS policies', dropped_count;
    ELSE
        RAISE NOTICE '⚠️  No RLS policies found to drop';
    END IF;
    
END $$;

-- Final verification
DO $$
DECLARE
    rls_enabled_count INTEGER;
BEGIN
    -- Count tables with RLS still enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r'  -- Only tables
    AND c.relrowsecurity = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Final Verification:';
    IF rls_enabled_count = 0 THEN
        RAISE NOTICE '✅ All tables in public schema have RLS disabled';
    ELSE
        RAISE NOTICE '⚠️  % tables still have RLS enabled', rls_enabled_count;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 RLS disable operation completed!';
    RAISE NOTICE '🔓 All Row Level Security policies have been disabled';
    RAISE NOTICE '⚠️  Warning: This removes all access control - use with caution!';
END $$;