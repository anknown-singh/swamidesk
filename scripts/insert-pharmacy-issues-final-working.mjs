import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertPharmacyIssuesFinalWorking() {
  console.log('🏪 Creating Pharmacy Issues (Final Working Version)...');
  
  try {
    // Get prescriptions to create issues for
    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select('id, quantity, status')
      .limit(25);
    
    if (prescError) {
      console.log('❌ Error fetching prescriptions:', prescError.message);
      return;
    }

    if (!prescriptions || prescriptions.length === 0) {
      console.log('❌ No prescriptions found');
      return;
    }

    console.log('✅ Found', prescriptions.length, 'prescriptions to process');

    // Get users who can issue medicines (pharmacists/doctors)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('role', ['pharmacist', 'doctor', 'admin'])
      .limit(10);

    const pharmacyIssues = [];

    // Create pharmacy issues with correct schema
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const prescribedQuantity = prescription.quantity || Math.floor(Math.random() * 10) + 1;
      
      // Generate realistic dispensing scenarios
      const isFullyIssued = Math.random() < 0.7; // 70% fully issued
      const isPartiallyIssued = !isFullyIssued && Math.random() < 0.8; // 24% partially issued, 6% not issued
      
      let quantityIssued;
      if (isFullyIssued) {
        quantityIssued = prescribedQuantity;
      } else if (isPartiallyIssued) {
        quantityIssued = Math.max(1, Math.floor(Math.random() * prescribedQuantity));
      } else {
        quantityIssued = Math.floor(Math.random() * 3); // 0-2 units for minimal issues
      }
      
      const issuedBy = users && users.length > 0 ? 
        users[Math.floor(Math.random() * users.length)].id : 
        null;
      
      // Generate issue date (within last 7 days)
      const issuedAt = new Date();
      issuedAt.setDate(issuedAt.getDate() - Math.floor(Math.random() * 7));
      
      // Generate batch numbers for medicines
      const batchNumber = Math.random() < 0.8 ? 
        'BATCH-' + Math.random().toString(36).substr(2, 9).toUpperCase() : 
        null;
      
      // Generate expiry dates (6 months to 3 years from now)
      const expiryDate = Math.random() < 0.7 ? (() => {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + Math.floor(Math.random() * 30) + 6);
        return expiry.toISOString().split('T')[0];
      })() : null;
      
      // Generate notes for some records
      const notes = Math.random() < 0.3 ? [
        'Patient counseled on dosage',
        'Verified patient identity',
        'Standard dispensing procedure',
        'Partial stock available',
        'Urgent dispensing request',
        'Patient pickup confirmed'
      ][Math.floor(Math.random() * 6)] : null;

      // Create pharmacy issue with correct schema
      const pharmacyIssue = {
        prescription_id: prescription.id,
        quantity_issued: quantityIssued,
        issued_by: issuedBy,
        issued_at: issuedAt.toISOString(),
        batch_number: batchNumber,
        expiry_date: expiryDate,
        notes: notes
      };

      pharmacyIssues.push(pharmacyIssue);
    }

    console.log('📋 Inserting', pharmacyIssues.length, 'pharmacy issues...');

    const { data, error } = await supabase
      .from('pharmacy_issues')
      .insert(pharmacyIssues)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      return;
    }

    console.log('🎉 Successfully inserted', data.length, 'pharmacy issues!');
    
    // Show detailed summary
    let totalIssued = 0;
    let recordsWithBatch = 0;
    let recordsWithExpiry = 0;
    let recordsWithNotes = 0;
    let recordsWithIssuer = 0;

    pharmacyIssues.forEach(issue => {
      totalIssued += issue.quantity_issued;
      if (issue.batch_number) recordsWithBatch++;
      if (issue.expiry_date) recordsWithExpiry++;
      if (issue.notes) recordsWithNotes++;
      if (issue.issued_by) recordsWithIssuer++;
    });

    console.log('\n📊 Pharmacy Issues Summary:');
    console.log('   Total records: ' + pharmacyIssues.length);
    console.log('   Total quantity issued: ' + totalIssued + ' units');
    console.log('   Average per issue: ' + Math.round(totalIssued / pharmacyIssues.length) + ' units');
    console.log('   Records with batch number: ' + recordsWithBatch + ' (' + Math.round((recordsWithBatch / pharmacyIssues.length) * 100) + '%)');
    console.log('   Records with expiry date: ' + recordsWithExpiry + ' (' + Math.round((recordsWithExpiry / pharmacyIssues.length) * 100) + '%)');
    console.log('   Records with notes: ' + recordsWithNotes + ' (' + Math.round((recordsWithNotes / pharmacyIssues.length) * 100) + '%)');
    console.log('   Records with issuer: ' + recordsWithIssuer + ' (' + Math.round((recordsWithIssuer / pharmacyIssues.length) * 100) + '%)');
    
    console.log('\n🎉 Pharmacy Issues table is now fully populated!');
    console.log('✅ Management sections should now display comprehensive data');

  } catch (error) {
    console.error('❌ Failed to insert pharmacy issues:', error.message);
  }
}

insertPharmacyIssuesFinalWorking();