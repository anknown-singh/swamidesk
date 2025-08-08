import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function discoverPharmacySchema() {
  console.log('🔍 Discovering pharmacy_issues table schema...');
  
  try {
    // Get a valid prescription_id first
    const { data: prescriptions } = await supabase.from('prescriptions').select('id').limit(1);
    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found');
      return;
    }
    
    const prescriptionId = prescriptions[0].id;
    console.log('✅ Using prescription ID:', prescriptionId);
    
    // Try inserting with just prescription_id
    const testIssue = { prescription_id: prescriptionId };
    
    const { data, error } = await supabase
      .from('pharmacy_issues')
      .insert([testIssue])
      .select();
    
    if (error) {
      console.log('❌ Minimal insert error:', error.message);
      console.log('Error details:', error.details || 'No details');
      console.log('Error hint:', error.hint || 'No hint');
      
      // Try with other possible field combinations
      const testCombinations = [
        { prescription_id: prescriptionId, quantity_requested: 5 },
        { prescription_id: prescriptionId, requested_quantity: 5 },
        { prescription_id: prescriptionId, quantity_issued: 3 },
        { prescription_id: prescriptionId, quantity: 5 },
        { prescription_id: prescriptionId, status: 'pending' },
        { prescription_id: prescriptionId, medicine_id: prescriptionId }  // Just to test
      ];
      
      for (const combo of testCombinations) {
        console.log('\nTesting combination:', Object.keys(combo).join(', '));
        const { data: comboData, error: comboError } = await supabase
          .from('pharmacy_issues')
          .insert([combo])
          .select();
        
        if (comboError) {
          console.log('  ❌', comboError.message);
        } else {
          console.log('  ✅ SUCCESS! Working schema found');
          console.log('  📋 Record:', JSON.stringify(comboData[0], null, 2));
          console.log('  📋 Available columns:', Object.keys(comboData[0]).join(', '));
          break;
        }
      }
    } else {
      console.log('✅ Minimal insert worked!');
      console.log('📋 Inserted record:', JSON.stringify(data[0], null, 2));
      console.log('📋 Available columns:', Object.keys(data[0]).join(', '));
    }
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

discoverPharmacySchema();