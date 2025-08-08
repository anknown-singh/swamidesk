import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableSchemas() {
  const tables = ['prescriptions', 'treatment_plans', 'visit_services', 'pharmacy_issues', 'invoices'];
  
  console.log('🔍 Checking table schemas...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error && data) {
        console.log(`\n✅ ${table}:`);
        if (data.length > 0) {
          console.log('   Columns:', Object.keys(data[0]).join(', '));
        } else {
          console.log('   Table exists but is empty');
        }
      } else if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

checkTableSchemas();