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

async function insertVisitsData(existingData) {
  console.log('📋 Inserting Consultation (Visits) Data...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visits = [];
  for (let i = 0; i < 15; i++) {
    const patient = existingData.patients[i % existingData.patients.length];
    const doctor = existingData.doctors[i % existingData.doctors.length];
    
    const visitDate = i < 5 ? today : (i < 10 ? yesterday : tomorrow);
    const statuses = ['waiting', 'in_consultation', 'services_pending', 'completed'];
    const status = statuses[Math.floor(i / 4)];
    const hour = 9 + (i % 8);
    const minute = (i % 4) * 15;

    visits.push({
      patient_id: patient.id,
      doctor_id: doctor.id,
      visit_date: visitDate.toISOString().split('T')[0],
      visit_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
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
      notes: status === 'completed' || status === 'services_pending' ? 
        `Patient presented with chief complaint. Physical examination revealed relevant findings. Advised treatment plan and follow-up.` : null,
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
      actual_start_time: (status === 'in_consultation' || status === 'completed') ? 
        visitDate.toISOString() : null,
      actual_end_time: status === 'completed' ? 
        new Date(visitDate.getTime() + 30 * 60000).toISOString() : null,
      created_by: doctor.id
    });
  }

  const { error: visitError } = await supabase.from('visits').insert(visits);
  if (visitError) {
    console.log('⚠️ Visit insertion error:', visitError.message);
  } else {
    console.log('✅ Inserted consultation records');
  }

  return visits;
}

async function insertPrescriptionsData(existingData) {
  console.log('💊 Inserting Prescription Data...');

  // Get completed visits
  const { data: completedVisits } = await supabase
    .from('visits')
    .select('id, patient_id, doctor_id')
    .in('status', ['completed', 'services_pending'])
    .limit(10);

  if (!completedVisits?.length) {
    console.log('⚠️ No completed visits found for prescriptions');
    return [];
  }

  const prescriptions = [];
  for (let i = 0; i < completedVisits.length * 2; i++) {
    const visit = completedVisits[i % completedVisits.length];
    const medicine = existingData.medicines[i % existingData.medicines.length];
    
    prescriptions.push({
      visit_id: visit.id,
      medicine_id: medicine.id,
      quantity: [10, 20, 30, 14, 21][i % 5],
      dosage: ['500mg', '250mg', '1 tablet', '5ml', '2 tablets'][i % 5],
      duration: ['7 days', '10 days', '14 days', '21 days', '5 days'][i % 5],
      instructions: [
        'Take after meals',
        'Take on empty stomach', 
        'Take with plenty of water',
        'Take at bedtime',
        'Take before meals'
      ][i % 5],
      prescribed_by: visit.doctor_id,
      status: ['pending', 'dispensed', 'partially_dispensed'][i % 3]
    });
  }

  const { error: prescriptionError } = await supabase.from('prescriptions').insert(prescriptions);
  if (prescriptionError) {
    console.log('⚠️ Prescription insertion error:', prescriptionError.message);
  } else {
    console.log('✅ Inserted prescription records');
  }

  return prescriptions;
}

async function insertTreatmentPlansData(existingData) {
  console.log('🏥 Inserting Treatment Plans Data...');

  // Get visits that need treatment plans
  const { data: procedureVisits } = await supabase
    .from('visits')
    .select('id, patient_id')
    .eq('status', 'services_pending')
    .limit(6);

  if (!procedureVisits?.length) {
    console.log('⚠️ No visits found for treatment plans');
    return [];
  }

  const treatmentPlans = [];
  for (let i = 0; i < procedureVisits.length; i++) {
    const visit = procedureVisits[i];
    
    treatmentPlans.push({
      visit_id: visit.id,
      title: [
        'Physiotherapy for Knee Recovery',
        'ENT Treatment Protocol', 
        'Skin Care Treatment Plan',
        'Pain Management Protocol',
        'Respiratory Therapy Plan',
        'Diabetes Management Program'
      ][i % 6],
      description: [
        'Comprehensive physiotherapy program to restore knee function',
        'Multi-step ENT treatment with medications and procedures',
        'Dermatological treatment with topical medications', 
        'Pain management through medication and physical therapy',
        'Respiratory therapy with breathing exercises and medications',
        'Complete diabetes management with diet and exercise monitoring'
      ][i % 6],
      total_sessions: [6, 8, 4, 10, 8, 12][i % 6],
      status: ['active', 'planned', 'completed'][i % 3],
      start_date: new Date().toISOString().split('T')[0],
      expected_end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      estimated_cost: [5000, 7500, 3000, 8000, 6000, 12000][i % 6]
    });
  }

  const { error: planError } = await supabase.from('treatment_plans').insert(treatmentPlans);
  if (planError) {
    console.log('⚠️ Treatment plan insertion error:', planError.message);
  } else {
    console.log('✅ Inserted treatment plan records');
  }

  return treatmentPlans;
}

async function insertVisitServicesData(existingData) {
  console.log('⚕️ Inserting Visit Services (Procedures) Data...');

  // Get visits that need services
  const { data: serviceVisits } = await supabase
    .from('visits')
    .select('id, patient_id')
    .in('status', ['services_pending', 'completed'])
    .limit(10);

  if (!serviceVisits?.length) {
    console.log('⚠️ No visits found for services');
    return [];
  }

  // Get attendants
  const { data: attendants } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['attendant', 'service_attendant', 'receptionist'])
    .limit(3);

  const visitServices = [];
  for (let i = 0; i < serviceVisits.length * 2; i++) {
    const visit = serviceVisits[i % serviceVisits.length];
    const service = existingData.services[i % existingData.services.length];
    const attendant = attendants?.[i % (attendants?.length || 1)];
    
    visitServices.push({
      visit_id: visit.id,
      service_id: service.id,
      assigned_to: attendant?.id || null,
      status: ['assigned', 'in_progress', 'completed'][i % 3],
      scheduled_time: new Date(Date.now() + (i * 60 * 60 * 1000)).toISOString(), // Staggered hours
      started_at: i % 3 >= 1 ? new Date(Date.now() - (60 * 60 * 1000)).toISOString() : null,
      completed_at: i % 3 === 2 ? new Date(Date.now() - (30 * 60 * 1000)).toISOString() : null,
      notes: [
        'Procedure scheduled and patient informed',
        'Procedure in progress, patient comfortable',
        'Procedure completed successfully',
        'Pre-procedure preparation completed',
        'Post-procedure monitoring in progress'
      ][i % 5],
      price: service.price
    });
  }

  const { error: serviceError } = await supabase.from('visit_services').insert(visitServices);
  if (serviceError) {
    console.log('⚠️ Visit services insertion error:', serviceError.message);
  } else {
    console.log('✅ Inserted visit services records');
  }

  return visitServices;
}

async function insertPharmacyIssuesData() {
  console.log('🏪 Inserting Pharmacy Queue Data...');

  // Get prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, medicine_id, quantity, status')
    .limit(15);

  if (!prescriptions?.length) {
    console.log('⚠️ No prescriptions found for pharmacy queue');
    return [];
  }

  // Get pharmacists
  const { data: pharmacists } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'pharmacist')
    .limit(2);

  const pharmacyIssues = [];
  for (let i = 0; i < prescriptions.length; i++) {
    const prescription = prescriptions[i];
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
      unit_price: Math.round(Math.random() * 100 + 10),
      batch_number: `BATCH${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      issued_by: pharmacist?.id || null,
      status: status,
      priority: i % 5 === 0,
      notes: [
        'Standard dispensing',
        'Patient counseled on usage', 
        'Partial stock available',
        'Urgent prescription',
        'Generic substitution offered'
      ][i % 5],
      issued_at: status !== 'pending' ? 
        new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString() : null
    });
  }

  const { error: pharmacyError } = await supabase.from('pharmacy_issues').insert(pharmacyIssues);
  if (pharmacyError) {
    console.log('⚠️ Pharmacy issues insertion error:', pharmacyError.message);
  } else {
    console.log('✅ Inserted pharmacy queue records');
  }

  return pharmacyIssues;
}

async function insertInvoicesData() {
  console.log('💰 Inserting Invoice Data...');

  // Get completed visits  
  const { data: completedVisits } = await supabase
    .from('visits')
    .select('id, patient_id')
    .eq('status', 'completed')
    .limit(8);

  if (!completedVisits?.length) {
    console.log('⚠️ No completed visits found for invoicing');
    return [];
  }

  const invoices = [];
  for (let i = 0; i < completedVisits.length; i++) {
    const visit = completedVisits[i];
    
    const subtotal = [1000, 1500, 2000, 800, 1200, 2500, 900, 1800][i % 8];
    const discountAmount = Math.round(subtotal * ([0, 5, 10, 15][i % 4]) / 100);
    const taxAmount = Math.round((subtotal - discountAmount) * 0.05); // 5% tax
    const totalAmount = subtotal - discountAmount + taxAmount;
    
    const paymentStatuses = ['pending', 'completed', 'partial'];
    const paymentStatus = paymentStatuses[i % 3];

    invoices.push({
      visit_id: visit.id,
      patient_id: visit.patient_id,
      subtotal: subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_status: paymentStatus,
      payment_method: paymentStatus !== 'pending' ? 
        ['cash', 'card', 'upi', 'bank_transfer'][i % 4] : null,
      payment_date: paymentStatus !== 'pending' ? 
        new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      notes: [
        'Regular billing',
        'Senior citizen discount applied',
        'Insurance billing',
        'Corporate account',
        'Family package discount'
      ][i % 5],
      created_by: visit.id // Using visit ID as proxy for created_by
    });
  }

  const { error: invoiceError } = await supabase.from('invoices').insert(invoices);
  if (invoiceError) {
    console.log('⚠️ Invoice insertion error:', invoiceError.message);
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
    console.log('📊 Getting existing data...');
    const existingData = await getExistingData();
    
    if (existingData.patients.length === 0 || existingData.doctors.length === 0) {
      console.log('❌ Missing required base data. Please ensure patients and doctors exist.');
      return;
    }
    
    console.log(`Found: ${existingData.patients.length} patients, ${existingData.doctors.length} doctors, ${existingData.medicines.length} medicines, ${existingData.services.length} services`);
    
    // Insert data with proper sequencing
    const visits = await insertVisitsData(existingData);
    
    // Wait for visits to be inserted
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const [prescriptions, treatmentPlans, visitServices] = await Promise.all([
      insertPrescriptionsData(existingData),
      insertTreatmentPlansData(existingData), 
      insertVisitServicesData(existingData)
    ]);
    
    // Wait for prescriptions/services to be inserted
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const [pharmacyIssues, invoices] = await Promise.all([
      insertPharmacyIssuesData(),
      insertInvoicesData()
    ]);
    
    console.log('');
    console.log('🎉 DATA INSERTION COMPLETE');
    console.log('==========================');
    console.log(`✅ Consultations (Visits): ${visits.length}`);
    console.log(`✅ Prescriptions: ${prescriptions.length}`);
    console.log(`✅ Treatment Plans: ${treatmentPlans.length}`);
    console.log(`✅ Procedures (Services): ${visitServices.length}`);
    console.log(`✅ Pharmacy Queue: ${pharmacyIssues.length}`);
    console.log(`✅ Invoices: ${invoices.length}`);
    console.log('');
    console.log('🚀 All management sections now have comprehensive test data!');
    
  } catch (error) {
    console.error('❌ Error inserting management data:', error.message);
  }
}

main();