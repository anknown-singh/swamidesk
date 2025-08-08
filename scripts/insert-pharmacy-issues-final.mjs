import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertPharmacyIssuesFinal() {
  console.log('🏪 Creating Pharmacy Issues (Final)...');
  
  try {
    // Get prescriptions
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id, medicine_id, quantity')
      .limit(25);

    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found');
      return;
    }

    const pharmacyIssues = [];

    // Create pharmacy issues with required fields
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const quantityRequested = prescription.quantity || Math.floor(Math.random() * 10) + 1;
      const quantityIssued = Math.floor(Math.random() * quantityRequested) + 1; // At least 1, up to requested
      
      pharmacyIssues.push({
        prescription_id: prescription.id,
        quantity_issued: quantityIssued
      });
    }

    console.log('📋 Inserting ' + pharmacyIssues.length + ' pharmacy issues...');

    const { data, error } = await supabase
      .from('pharmacy_issues')
      .insert(pharmacyIssues)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      return;
    }

    console.log('✅ Successfully inserted ' + data.length + ' pharmacy issues');
    
    // Show summary
    const totalIssued = pharmacyIssues.reduce((sum, issue) => sum + issue.quantity_issued, 0);
    
    console.log('');
    console.log('📊 Pharmacy Issues Summary:');
    console.log('   Total records: ' + pharmacyIssues.length);
    console.log('   Total quantity issued: ' + totalIssued + ' units');
    console.log('   Average per issue: ' + Math.round(totalIssued / pharmacyIssues.length) + ' units');
    
    console.log('');
    console.log('🎉 Pharmacy Issues table is now populated!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

insertPharmacyIssuesFinal();