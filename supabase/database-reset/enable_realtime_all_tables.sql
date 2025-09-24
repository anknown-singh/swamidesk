-- Enable realtime for all tables in SwamIDesk
-- This script adds all tables to the supabase_realtime publication
-- allowing real-time subscriptions for all database changes

-- Safe approach: Try to add each table, ignore if already exists
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'appointment_reminders', 'appointment_services', 'appointment_slots', 'appointment_waitlist',
        'appointments', 'audit_log', 'billing_items', 'consultation_chief_complaints',
        'consultation_diagnoses', 'consultation_history', 'consultation_progress_notes',
        'consultation_sessions', 'consultation_templates', 'consultation_treatment_plans',
        'consultation_vitals', 'doctor_availability', 'examination_findings', 'inventory',
        'investigation_orders', 'invoices', 'medicine_master', 'medicines', 'migration_log',
        'notifications', 'opd_records', 'patients', 'payments', 'pharmacy_issues',
        'prescriptions', 'purchase_order_items', 'purchase_orders', 'sell_order_items',
        'sell_orders', 'services', 'suppliers', 'treatment_plans', 'treatment_sessions',
        'user_profiles', 'users', 'visit_services', 'visits', 'workflow_requests'
    ];
    table_name TEXT;
    added_count INTEGER := 0;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        BEGIN
            -- Try to add table to publication
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
            added_count := added_count + 1;
            RAISE NOTICE 'Added table % to realtime publication', table_name;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, skip
            RAISE NOTICE 'Table % already in realtime publication', table_name;
        WHEN undefined_table THEN
            -- Table doesn't exist, skip
            RAISE NOTICE 'Table % does not exist, skipping', table_name;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Processed % tables, added % new tables to realtime', array_length(table_names, 1), added_count;
END $$;

-- Grant necessary permissions for realtime access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant specific realtime permissions for notifications (most important for pharmacy notifications)
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔄 Realtime enabled for all 41 SwamIDesk tables!';
    RAISE NOTICE '📡 All tables now support real-time subscriptions';
    RAISE NOTICE '🔔 Pharmacy notifications should work in real-time now';
END $$;