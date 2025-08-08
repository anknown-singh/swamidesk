import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get existing data to build relationships
async function getExistingData() {
  const [patients, doctors, medicines, services] = await Promise.all([
    supabase.from('patients').select('id, full_name').limit(10),
    supabase.from('users').select('id, full_name').eq('role', 'doctor').limit(5),
    supabase.from('medicines').select('id, name, unit_price').limit(20),
    supabase.from('services').select('id, name, price').limit(10)
  ]);

  return {
    patients: patients.data || [],
    doctors: doctors.data || [],
    medicines: medicines.data || [],
    services: services.data || []
  };
}

async function insertConsultationData(existingData) {
  console.log('📋 Inserting Consultation Management Data...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create Visits (Consultations)
  const visits = [];
  for (let i = 0; i < 15; i++) {
    const patient = existingData.patients[i % existingData.patients.length];
    const doctor = existingData.doctors[i % existingData.doctors.length];
    
    const visitDate = i < 5 ? today : (i < 10 ? yesterday : tomorrow);
    const statuses = ['waiting', 'in_consultation', 'services_pending', 'completed'];
    const status = statuses[Math.floor(i / 4)];

    visits.push({
      patient_id: patient.id,
      doctor_id: doctor.id,
      visit_date: visitDate.toISOString().split('T')[0],
      visit_time: `${9 + (i % 8)}:${(i % 4) * 15}0`,
      status: status,
      token_number: (i % 20) + 1,
      chief_complaint: [
        'Fever and headache for 3 days',
        'Ear pain and hearing difficulty',
        'Knee pain after sports injury',
        'Skin rash and itching',
        'Chest pain and shortness of breath',
        'Abdominal pain and nausea',
        'Back pain radiating to legs',
        'Persistent cough for 2 weeks',
        'Dizziness and fatigue',
        'Throat pain and difficulty swallowing'
      ][i % 10],
      notes: status === 'completed' || status === 'services_pending' ? `Patient presented with chief complaint. Physical examination revealed relevant findings. Advised treatment plan and follow-up.` : null,
      diagnosis: status === 'completed' || status === 'services_pending' ? [
        'Viral fever with headache',
        'Acute otitis media',
        'Sports-related knee strain',
        'Allergic dermatitis',
        'Stress-related chest discomfort',
        'Gastritis',
        'Lower back strain',
        'Upper respiratory tract infection',
        'Iron deficiency anemia',
        'Pharyngitis'
      ][i % 10] : null,
      priority: i % 7 === 0,
      checked_in_at: visitDate.toISOString(),
      actual_start_time: (status === 'in_consultation' || status === 'completed') ? visitDate.toISOString() : null,
      actual_end_time: status === 'completed' ? new Date(visitDate.getTime() + 30 * 60000).toISOString() : null,
      created_by: doctor.id
    });
  }

  const { error: visitError } = await supabase.from('visits').insert(visits);
  if (visitError) {
    console.log('⚠️ Some consultation records might already exist:', visitError.message);
  } else {
    console.log('✅ Inserted consultation records');
  }

  return visits;
}

async function insertPrescriptionData(existingData, consultations) {
  console.log('💊 Inserting Prescription Management Data...');

  const prescriptions = [];
  const completedConsultations = consultations.filter(c => c.status === 'completed' || c.status === 'services_pending');
  
  // Get the inserted visit records to get their IDs
  const { data: insertedVisits } = await supabase
    .from('visits')
    .select('id, patient_id, doctor_id')
    .in('patient_id', completedConsultations.map(c => c.patient_id));

  for (let i = 0; i < Math.min(25, insertedVisits?.length * 2 || 0); i++) {
    const visit = insertedVisits[i % insertedVisits.length];
    const medicine = existingData.medicines[i % existingData.medicines.length];
    
    prescriptions.push({
      visit_id: visit.id,
      medicine_id: medicine.id,
      quantity: [10, 20, 30, 14, 21][i % 5],
      dosage: ['500mg', '250mg', '1 tablet', '5ml', '2 tablets'][i % 5],
      frequency: ['Twice daily', 'Three times daily', 'Once daily', 'Four times daily', 'As needed'][i % 5],
      duration: ['7 days', '10 days', '14 days', '21 days', '5 days'][i % 5],
      instructions: [
        'Take after meals',
        'Take on empty stomach',
        'Take with plenty of water',
        'Take at bedtime',
        'Take before meals',
        'Apply topically',
        'Dissolve in water and drink'
      ][i % 7]
    });
  }

  const { error: prescriptionError } = await supabase.from('prescriptions').insert(prescriptions);
  if (prescriptionError) {
    console.log('⚠️ Some prescriptions might already exist:', prescriptionError.message);
  } else {
    console.log('✅ Inserted prescription records');
  }

  return prescriptions;
}

async function insertTreatmentPlanData(existingData, consultations) {
  console.log('🏥 Inserting Treatment Plan Management Data...');

  const treatmentPlans = [];
  const proceduresConsultations = consultations.filter(c => c.status === 'services_pending' || c.status === 'completed').slice(0, 8);
  
  // Get the inserted visit records
  const { data: insertedVisits } = await supabase
    .from('visits')
    .select('id, patient_id')
    .in('patient_id', proceduresConsultations.map(c => c.patient_id));

  for (let i = 0; i < insertedVisits?.length; i++) {
    const visit = insertedVisits[i];
    
    treatmentPlans.push({
      visit_id: visit.id,
      plan_title: [
        'Physiotherapy for Knee Recovery',
        'ENT Treatment Protocol',
        'Skin Care Treatment Plan',
        'Cardiac Rehabilitation Program',
        'Pain Management Protocol',
        'Respiratory Therapy Plan',
        'Diabetes Management Program',
        'Hypertension Control Plan'
      ][i % 8],
      plan_description: [
        'Comprehensive physiotherapy program to restore knee function and mobility',
        'Multi-step ENT treatment including medications and follow-up procedures',
        'Dermatological treatment plan with topical medications and lifestyle changes',
        'Structured cardiac rehabilitation with exercise and dietary guidelines',
        'Pain management through medication and physical therapy',
        'Respiratory therapy with breathing exercises and medications',
        'Complete diabetes management with diet, exercise and medication monitoring',
        'Blood pressure control through lifestyle modifications and medications'
      ][i % 8],
      total_sessions: [6, 8, 4, 12, 10, 8, 6, 8][i % 8],
      completed_sessions: Math.floor(Math.random() * 4),
      estimated_cost: [5000, 7500, 3000, 12000, 8000, 6000, 4500, 6500][i % 8],
      status: ['active', 'planned', 'completed'][i % 3],
      start_date: new Date().toISOString().split('T')[0],
      expected_end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 30 days later
      notes: 'Treatment plan created based on patient condition and doctor recommendations'
    });
  }

  const { error: planError } = await supabase.from('treatment_plans').insert(treatmentPlans);
  if (planError) {
    console.log('⚠️ Some treatment plans might already exist:', planError.message);
  } else {
    console.log('✅ Inserted treatment plan records');
  }

  return treatmentPlans;
}

async function insertProceduresData(existingData, consultations) {
  console.log('⚕️ Inserting Procedures Data...');

  const visitServices = [];
  const proceduresConsultations = consultations.filter(c => c.status === 'services_pending' || c.status === 'completed');
  
  // Get visit records that need procedures
  const { data: insertedVisits } = await supabase
    .from('visits')
    .select('id, patient_id')
    .in('patient_id', proceduresConsultations.map(c => c.patient_id));

  // Get service attendants (users with attendant role)
  const { data: attendants } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['attendant', 'service_attendant'])
    .limit(3);

  for (let i = 0; i < Math.min(20, insertedVisits?.length * 2 || 0); i++) {
    const visit = insertedVisits[i % insertedVisits.length];
    const service = existingData.services[i % existingData.services.length];
    const attendant = attendants?.[i % (attendants.length || 1)];
    
    visitServices.push({
      visit_id: visit.id,
      service_id: service.id,
      attendant_id: attendant?.id || null,
      quantity: 1,
      unit_price: service.price,
      total_price: service.price,
      status: ['assigned', 'in_progress', 'completed'][i % 3],
      notes: [
        'Procedure scheduled and patient informed',
        'Procedure in progress, patient comfortable',
        'Procedure completed successfully',
        'Pre-procedure preparation done',
        'Post-procedure monitoring required',
        'Patient showed good response'
      ][i % 6],
      scheduled_at: new Date().toISOString(),
      started_at: i % 3 >= 1 ? new Date(Date.now() - 60 * 60 * 1000).toISOString() : null, // 1 hour ago
      completed_at: i % 3 === 2 ? new Date(Date.now() - 30 * 60 * 1000).toISOString() : null, // 30 mins ago
    });
  }

  const { error: servicesError } = await supabase.from('visit_services').insert(visitServices);
  if (servicesError) {
    console.log('⚠️ Some visit services might already exist:', servicesError.message);
  } else {
    console.log('✅ Inserted visit services (procedures) records');
  }

  return visitServices;
}

async function insertPharmacyQueueData(prescriptions) {
  console.log('🏪 Inserting Pharmacy Queue Data...');

  // Get prescription IDs from database
  const { data: insertedPrescriptions } = await supabase
    .from('prescriptions')
    .select('id, medicine_id, quantity, opd_record_id')
    .limit(15);

  if (!insertedPrescriptions?.length) {
    console.log('⚠️ No prescriptions found for pharmacy queue');
    return [];
  }

  // Get pharmacist users
  const { data: pharmacists } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'pharmacist')
    .limit(2);

  const pharmacyIssues = [];
  for (let i = 0; i < insertedPrescriptions.length; i++) {
    const prescription = insertedPrescriptions[i];
    const pharmacist = pharmacists?.[i % (pharmacists?.length || 1)];
    
    const statuses = ['pending', 'dispensed', 'partially_dispensed'];
    const status = statuses[i % 3];
    const issuedQuantity = status === 'partially_dispensed' ? 
      Math.floor(prescription.quantity * 0.7) : prescription.quantity;

    pharmacyIssues.push({
      prescription_id: prescription.id,
      medicine_id: prescription.medicine_id,
      requested_quantity: prescription.quantity,
      issued_quantity: status === 'pending' ? 0 : issuedQuantity,
      unit_price: Math.round(Math.random() * 100 + 10), // Random price between 10-110
      total_price: status === 'pending' ? 0 : issuedQuantity * Math.round(Math.random() * 100 + 10),
      batch_number: `BATCH${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      issued_by: pharmacist?.id || null,
      status: status,
      priority: i % 5 === 0,
      notes: [
        'Standard dispensing',
        'Patient counseled on usage',
        'Partial stock available',
        'Urgent prescription',
        'Generic substitution offered',
        'Patient education provided'
      ][i % 6],
      issued_at: status !== 'pending' ? new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString() : null,
      queue_position: status === 'pending' ? (i % 10) + 1 : null
    });
  }

  const { error: pharmacyError } = await supabase.from('pharmacy_issues').insert(pharmacyIssues);
  if (pharmacyError) {
    console.log('⚠️ Some pharmacy issues might already exist:', pharmacyError.message);
  } else {
    console.log('✅ Inserted pharmacy queue records');
  }

  return pharmacyIssues;
}

async function insertBillingInvoiceData(consultations, existingData) {
  console.log('💰 Inserting Billing & Invoice Management Data...');

  // Get completed visits
  const { data: completedVisits } = await supabase
    .from('visits')
    .select(`
      id, patient_id,
      visit_services(total_price),
      pharmacy_issues(total_price)
    `)
    .eq('status', 'completed');

  if (!completedVisits?.length) {
    console.log('⚠️ No completed consultations found for billing');
    return [];
  }

  const invoices = [];
  for (let i = 0; i < completedVisits.length; i++) {
    const record = completedVisits[i];
    
    // Calculate charges
    const opdCharge = [300, 400, 250, 500, 350][i % 5]; // Default OPD charges
    const servicesCharge = record.visit_services?.reduce((sum, vs) => sum + vs.total_price, 0) || 0;
    const medicinesCharge = record.pharmacy_issues?.reduce((sum, pi) => sum + pi.total_price, 0) || 0;
    
    const subtotal = opdCharge + servicesCharge + medicinesCharge;
    const discountPercentage = [0, 5, 10, 15][i % 4];
    const discountAmount = Math.round(subtotal * discountPercentage / 100);
    const taxRate = 5; // 5% tax
    const taxAmount = Math.round((subtotal - discountAmount) * taxRate / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;
    
    const paymentStatuses = ['pending', 'partial', 'completed', 'completed'];
    const paymentStatus = paymentStatuses[i % 4];
    const amountPaid = paymentStatus === 'completed' ? totalAmount :
                     paymentStatus === 'partial' ? Math.round(totalAmount * 0.6) : 0;

    invoices.push({
      visit_id: record.id,
      invoice_number: `INV${new Date().getFullYear()}${String(Date.now() + i).slice(-6)}`,
      opd_charge: opdCharge,
      services_charge: servicesCharge,
      medicines_charge: medicinesCharge,
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      tax_percentage: taxRate,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_amount: totalAmount - amountPaid,
      payment_status: paymentStatus,
      payment_method: amountPaid > 0 ? ['cash', 'card', 'upi', 'bank_transfer'][i % 4] : null,
      payment_reference: amountPaid > 0 ? `PAY${String(Date.now() + i).slice(-8)}` : null,
      notes: [
        'Regular billing',
        'Senior citizen discount applied',
        'Insurance claim pending',
        'Corporate billing',
        'Family package discount',
        'Emergency treatment billing'
      ][i % 6],
      paid_at: amountPaid > 0 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      due_date: paymentStatus === 'pending' || paymentStatus === 'partial' ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    });
  }

  const { error: invoiceError } = await supabase.from('invoices').insert(invoices);
  if (invoiceError) {
    console.log('⚠️ Some invoices might already exist:', invoiceError.message);
  } else {
    console.log('✅ Inserted invoice records');
  }

  return invoices;
}

async function main() {
  console.log('🏥 INSERTING COMPREHENSIVE MANAGEMENT DATA');
  console.log('==========================================');
  
  try {
    // Get existing data
    console.log('📊 Getting existing data for relationships...');
    const existingData = await getExistingData();
    
    if (existingData.patients.length === 0 || existingData.doctors.length === 0) {
      console.log('❌ Missing required base data. Please run patient/doctor/medicine insertion first.');
      return;
    }
    
    console.log(`Found: ${existingData.patients.length} patients, ${existingData.doctors.length} doctors, ${existingData.medicines.length} medicines, ${existingData.services.length} services`);
    
    // Insert data in sequence (maintaining relationships)
    const consultations = await insertConsultationData(existingData);
    
    // Wait a bit for DB to catch up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const prescriptions = await insertPrescriptionData(existingData, consultations);
    const treatmentPlans = await insertTreatmentPlanData(existingData, consultations);
    const procedures = await insertProceduresData(existingData, consultations);
    
    // Wait a bit more for pharmacy and billing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pharmacyQueue = await insertPharmacyQueueData(prescriptions);
    const invoices = await insertBillingInvoiceData(consultations, existingData);
    
    console.log('');
    console.log('🎉 DATA INSERTION SUMMARY');
    console.log('========================');
    console.log(`✅ Consultation Records: ${consultations.length}`);
    console.log(`✅ Prescriptions: ${prescriptions.length}`);
    console.log(`✅ Treatment Plans: ${treatmentPlans.length}`);
    console.log(`✅ Procedures: ${procedures.length}`);
    console.log(`✅ Pharmacy Queue: ${pharmacyQueue.length}`);
    console.log(`✅ Invoices: ${invoices.length}`);
    console.log('');
    console.log('🚀 All management sections now have comprehensive test data!');
    
  } catch (error) {
    console.error('❌ Error inserting management data:', error.message);
  }
}

main();