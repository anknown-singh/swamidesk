import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findConsultationTables() {
  const possibleTables = ['visits', 'consultations', 'appointments', 'opd_visits', 'patient_visits'];
  
  console.log('🔍 Checking for consultation-related tables...');
  
  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log('✅ ' + table + ' exists');
        if (data && data.length > 0) {
          console.log('   Sample columns:', Object.keys(data[0]).join(', '));
        } else {
          console.log('   Table exists but is empty');
        }
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }
}

findConsultationTables();