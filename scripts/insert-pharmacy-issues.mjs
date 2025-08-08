import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertPharmacyIssues() {
  console.log('🏪 Generating Pharmacy Issues Data...');
  
  try {
    // First, check the actual schema of pharmacy_issues table
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('pharmacy_issues')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ Error checking pharmacy_issues schema:', schemaError.message);
      return;
    }

    // Get prescriptions and medicines to create pharmacy issues
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id, medicine_id, quantity, status')
      .limit(30);

    const { data: medicines } = await supabase
      .from('medicines')
      .select('id, name, unit_price, stock_quantity')
      .limit(50);

    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found to create pharmacy issues for');
      return;
    }

    if (!medicines || medicines.length === 0) {
      console.log('❌ No medicines found to create pharmacy issues for');
      return;
    }

    const pharmacyIssues = [];
    const statuses = ['pending', 'partially_issued', 'completed', 'cancelled'];
    const priorities = ['normal', 'urgent'];

    // Create 35-40 pharmacy issues
    for (let i = 0; i < Math.min(prescriptions.length, 35); i++) {
      const prescription = prescriptions[i];
      const medicine = medicines.find(m => m.id === prescription.medicine_id) || 
                      medicines[Math.floor(Math.random() * medicines.length)];
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = Math.random() < 0.2 ? 'urgent' : 'normal'; // 20% urgent
      const requestedQuantity = prescription.quantity || Math.floor(Math.random() * 10) + 1;
      
      let issuedQuantity = null;
      if (status === 'completed') {
        issuedQuantity = requestedQuantity;
      } else if (status === 'partially_issued') {
        issuedQuantity = Math.floor(Math.random() * requestedQuantity);
      }

      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 7)); // Within last week
      
      const issuedAt = (status === 'completed' || status === 'partially_issued') ? 
        new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : // Within 24 hours
        null;

      const notes = priority === 'urgent' ? 
        'Urgent - Patient waiting' : 
        Math.random() < 0.3 ? 'Standard dispensing' : null;

      // Try to create the pharmacy issue with minimal required fields first
      const pharmacyIssue = {
        prescription_id: prescription.id,
        requested_quantity: requestedQuantity,
        issued_quantity: issuedQuantity,
        priority: priority,
        notes: notes,
        created_at: createdDate.toISOString(),
        issued_at: issuedAt ? issuedAt.toISOString() : null
      };

      // Add status if the column exists (we'll check this in the insert)
      try {
        // Try to add more fields that might exist
        pharmacyIssue.status = status;
        pharmacyIssue.medicine_id = medicine.id;
      } catch (e) {
        // If fields don't exist, that's okay, we'll handle it
      }

      pharmacyIssues.push(pharmacyIssue);
    }

    console.log(`📋 Inserting ${pharmacyIssues.length} pharmacy issues...`);

    // Try inserting with all fields first
    let { data, error } = await supabase
      .from('pharmacy_issues')
      .insert(pharmacyIssues)
      .select();

    if (error) {
      console.log('⚠️ Full insert failed, trying with minimal fields:', error.message);
      
      // Try with minimal fields if full insert fails
      const minimalIssues = pharmacyIssues.map(issue => ({
        prescription_id: issue.prescription_id,
        requested_quantity: issue.requested_quantity,
        issued_quantity: issue.issued_quantity,
        priority: issue.priority,
        created_at: issue.created_at
      }));

      const { data: minData, error: minError } = await supabase
        .from('pharmacy_issues')
        .insert(minimalIssues)
        .select();

      if (minError) {
        console.error('❌ Even minimal insert failed:', minError.message);
        return;
      }

      data = minData;
      console.log('✅ Inserted with minimal fields');
    }

    console.log(`✅ Successfully inserted ${data.length} pharmacy issues`);
    
    // Show summary
    const statusCounts = {};
    const priorityCounts = {};
    
    pharmacyIssues.forEach(issue => {
      statusCounts[issue.status || 'unknown'] = (statusCounts[issue.status || 'unknown'] || 0) + 1;
      priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;
    });
    
    console.log('\n📊 Pharmacy Issues Summary:');
    console.log('Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} issues`);
    });
    
    console.log('Priority distribution:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} issues`);
    });
    
    const totalRequested = pharmacyIssues.reduce((sum, issue) => sum + issue.requested_quantity, 0);
    const totalIssued = pharmacyIssues.reduce((sum, issue) => sum + (issue.issued_quantity || 0), 0);
    console.log(`   Total requested: ${totalRequested} units`);
    console.log(`   Total issued: ${totalIssued} units`);
    
  } catch (error) {
    console.error('❌ Failed to insert pharmacy issues:', error.message);
  }
}

insertPharmacyIssues();