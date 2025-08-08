import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertPharmacyIssuesRobust() {
  console.log('🏪 Creating Pharmacy Issues (Robust Version)...');
  
  try {
    // Get prescriptions with all details
    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select('id, medicine_id, quantity, status')
      .limit(30);
    
    if (prescError) {
      console.log('❌ Error fetching prescriptions:', prescError.message);
      return;
    }

    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found');
      return;
    }

    console.log('✅ Found', prescriptions.length, 'prescriptions to process');

    // Get medicines for reference
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('id, name, unit_price')
      .limit(50);

    if (medError) {
      console.log('❌ Error fetching medicines:', medError.message);
      return;
    }

    const pharmacyIssues = [];
    const statuses = ['pending', 'issued', 'partially_issued', 'cancelled'];
    const priorities = ['normal', 'urgent', 'low'];

    // Create pharmacy issues for each prescription
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = Math.random() < 0.15 ? 'urgent' : Math.random() < 0.1 ? 'low' : 'normal';
      const requestedQuantity = prescription.quantity || Math.floor(Math.random() * 10) + 1;
      
      let issuedQuantity = 0;
      if (status === 'issued') {
        issuedQuantity = requestedQuantity;
      } else if (status === 'partially_issued') {
        issuedQuantity = Math.max(1, Math.floor(Math.random() * requestedQuantity));
      }

      const notes = priority === 'urgent' ? 
        'Urgent dispensing required' : 
        (Math.random() < 0.3 ? 'Standard dispensing procedure' : null);

      // Create with minimal required fields
      const pharmacyIssue = {
        prescription_id: prescription.id,
        medicine_id: prescription.medicine_id,
        requested_quantity: requestedQuantity,
        issued_quantity: issuedQuantity,
        status: status,
        priority: priority,
        notes: notes
      };

      pharmacyIssues.push(pharmacyIssue);
    }

    console.log('📋 Inserting', pharmacyIssues.length, 'pharmacy issues...');

    // Try inserting with progressive field reduction if needed
    let insertSuccess = false;
    let insertData = null;

    // Attempt 1: Full schema
    const { data: fullData, error: fullError } = await supabase
      .from('pharmacy_issues')
      .insert(pharmacyIssues)
      .select();

    if (fullError) {
      console.log('⚠️ Full insert failed:', fullError.message);
      
      // Attempt 2: Without medicine_id
      const reducedIssues = pharmacyIssues.map(issue => ({
        prescription_id: issue.prescription_id,
        requested_quantity: issue.requested_quantity,
        issued_quantity: issue.issued_quantity,
        status: issue.status,
        priority: issue.priority,
        notes: issue.notes
      }));

      const { data: reducedData, error: reducedError } = await supabase
        .from('pharmacy_issues')
        .insert(reducedIssues)
        .select();

      if (reducedError) {
        console.log('⚠️ Reduced insert failed:', reducedError.message);
        
        // Attempt 3: Minimal fields only
        const minimalIssues = pharmacyIssues.map(issue => ({
          prescription_id: issue.prescription_id,
          requested_quantity: issue.requested_quantity,
          issued_quantity: issue.issued_quantity
        }));

        const { data: minimalData, error: minimalError } = await supabase
          .from('pharmacy_issues')
          .insert(minimalIssues)
          .select();

        if (minimalError) {
          console.log('❌ Even minimal insert failed:', minimalError.message);
          return;
        } else {
          insertData = minimalData;
          insertSuccess = true;
          console.log('✅ Minimal insert succeeded');
        }
      } else {
        insertData = reducedData;
        insertSuccess = true;
        console.log('✅ Reduced insert succeeded');
      }
    } else {
      insertData = fullData;
      insertSuccess = true;
      console.log('✅ Full insert succeeded');
    }

    if (insertSuccess) {
      console.log('🎉 Successfully inserted', insertData.length, 'pharmacy issues!');
      
      // Show summary
      const statusCounts = {};
      const priorityCounts = {};
      let totalRequested = 0;
      let totalIssued = 0;

      pharmacyIssues.forEach(issue => {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
        priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;
        totalRequested += issue.requested_quantity;
        totalIssued += issue.issued_quantity;
      });

      console.log('\n📊 Pharmacy Issues Summary:');
      console.log('Status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log('   ' + status + ': ' + count + ' issues');
      });
      
      console.log('Priority distribution:');
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        console.log('   ' + priority + ': ' + count + ' issues');
      });
      
      console.log('Quantity summary:');
      console.log('   Total requested: ' + totalRequested + ' units');
      console.log('   Total issued: ' + totalIssued + ' units');
      console.log('   Fulfillment rate: ' + Math.round((totalIssued / totalRequested) * 100) + '%');
    }

  } catch (error) {
    console.error('❌ Failed to insert pharmacy issues:', error.message);
  }
}

insertPharmacyIssuesRobust();