import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertSimplePharmacyIssues() {
  console.log('🏪 Creating Simple Pharmacy Issues...');
  
  try {
    // Get prescriptions and medicines
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id, medicine_id, quantity')
      .limit(25);

    const { data: medicines } = await supabase
      .from('medicines')
      .select('id, name')
      .limit(30);

    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found');
      return;
    }

    if (!medicines || medicines.length === 0) {
      console.log('❌ No medicines found');
      return;
    }

    const pharmacyIssues = [];
    const priorities = ['normal', 'urgent'];

    // Create simple pharmacy issues
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const medicine = medicines.find(m => m.id === prescription.medicine_id) || 
                      medicines[Math.floor(Math.random() * medicines.length)];
      
      const priority = Math.random() < 0.2 ? 'urgent' : 'normal'; // 20% urgent
      const requestedQuantity = prescription.quantity || Math.floor(Math.random() * 10) + 1;
      
      const notes = priority === 'urgent' ? 'Urgent - Patient waiting' : null;

      // Try with very minimal fields first
      pharmacyIssues.push({
        prescription_id: prescription.id,
        requested_quantity: requestedQuantity,
        priority: priority,
        notes: notes
      });
    }

    console.log('📋 Inserting ' + pharmacyIssues.length + ' pharmacy issues...');

    // Try inserting one first to test what works
    const testIssue = pharmacyIssues[0];
    const { data: testData, error: testError } = await supabase
      .from('pharmacy_issues')
      .insert([testIssue])
      .select();

    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      
      // Try with even more minimal fields
      const minimalIssue = {
        prescription_id: testIssue.prescription_id,
        requested_quantity: testIssue.requested_quantity
      };
      
      const { data: minData, error: minError } = await supabase
        .from('pharmacy_issues')
        .insert([minimalIssue])
        .select();
      
      if (minError) {
        console.log('❌ Even minimal insert failed:', minError.message);
        
        // Try with just prescription_id
        const superMinimal = {
          prescription_id: testIssue.prescription_id
        };
        
        const { data: superMinData, error: superMinError } = await supabase
          .from('pharmacy_issues')
          .insert([superMinimal])
          .select();
        
        if (superMinError) {
          console.log('❌ Super minimal insert failed:', superMinError.message);
          return;
        } else {
          console.log('✅ Super minimal insert worked!');
          
          // Use super minimal for all
          const superMinimalIssues = pharmacyIssues.slice(1).map(issue => ({
            prescription_id: issue.prescription_id
          }));
          
          const { data, error } = await supabase
            .from('pharmacy_issues')
            .insert(superMinimalIssues)
            .select();
          
          if (error) {
            console.log('❌ Bulk insert failed:', error.message);
            return;
          }
          
          console.log('✅ Successfully inserted ' + (data.length + 1) + ' pharmacy issues (super minimal)');
        }
      } else {
        console.log('✅ Minimal insert worked!');
        
        // Use minimal schema for all records
        const minimalIssues = pharmacyIssues.slice(1).map(issue => ({
          prescription_id: issue.prescription_id,
          requested_quantity: issue.requested_quantity
        }));
        
        const { data, error } = await supabase
          .from('pharmacy_issues')
          .insert(minimalIssues)
          .select();
        
        if (error) {
          console.log('❌ Bulk insert failed:', error.message);
          return;
        }
        
        console.log('✅ Successfully inserted ' + (data.length + 1) + ' pharmacy issues (minimal)');
      }
    } else {
      console.log('✅ Full schema insert worked!');
      
      const { data, error } = await supabase
        .from('pharmacy_issues')
        .insert(pharmacyIssues.slice(1))
        .select();
      
      if (error) {
        console.log('❌ Bulk insert failed:', error.message);
        return;
      }
      
      console.log('✅ Successfully inserted ' + (data.length + 1) + ' pharmacy issues (full)');
    }
    
    console.log('');
    console.log('🎉 Pharmacy Issues table is now populated!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

insertSimplePharmacyIssues();