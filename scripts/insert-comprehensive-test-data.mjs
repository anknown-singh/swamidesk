/**
 * Comprehensive Test Data Generation Script
 * Creates realistic healthcare data for SwamIDesk search functionality testing
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Realistic Indian names and data
const indianNames = [
  { first: 'Aadhya', last: 'Sharma', gender: 'female' },
  { first: 'Arjun', last: 'Patel', gender: 'male' },
  { first: 'Priya', last: 'Singh', gender: 'female' },
  { first: 'Rahul', last: 'Kumar', gender: 'male' },
  { first: 'Sneha', last: 'Gupta', gender: 'female' },
  { first: 'Vikram', last: 'Reddy', gender: 'male' },
  { first: 'Meera', last: 'Nair', gender: 'female' },
  { first: 'Karan', last: 'Shah', gender: 'male' },
  { first: 'Anita', last: 'Joshi', gender: 'female' },
  { first: 'Suresh', last: 'Iyer', gender: 'male' },
  { first: 'Kavya', last: 'Menon', gender: 'female' },
  { first: 'Rohan', last: 'Agarwal', gender: 'male' },
  { first: 'Divya', last: 'Pillai', gender: 'female' },
  { first: 'Amit', last: 'Chopra', gender: 'male' },
  { first: 'Pooja', last: 'Bansal', gender: 'female' },
  { first: 'Sanjay', last: 'Malhotra', gender: 'male' },
  { first: 'Riya', last: 'Kapoor', gender: 'female' },
  { first: 'Nikhil', last: 'Saxena', gender: 'male' },
  { first: 'Shreya', last: 'Mishra', gender: 'female' },
  { first: 'Arun', last: 'Pandey', gender: 'male' }
]

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad']
const appointmentTypes = ['consultation', 'follow_up', 'procedure', 'checkup', 'emergency', 'vaccination']
const appointmentStatuses = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show']

// Helper functions
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)]
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const randomPhone = () => `${9000000000 + Math.floor(Math.random() * 999999999)}`
const randomEmail = (firstName, lastName) => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`

async function generatePatients() {
  console.log('🏥 Creating comprehensive patient database...')
  
  const patients = []
  const usedNames = new Set()
  
  for (let i = 0; i < 75; i++) {
    let nameData
    let fullName
    
    // Ensure unique names
    do {
      nameData = randomChoice(indianNames)
      fullName = `${nameData.first} ${nameData.last}`
    } while (usedNames.has(fullName))
    
    usedNames.add(fullName)
    
    const dob = randomDate(new Date(1950, 0, 1), new Date(2010, 0, 1))
    const city = randomChoice(cities)
    
    const patient = {
      name: fullName,
      mobile: randomPhone(),
      email: Math.random() > 0.3 ? randomEmail(nameData.first, nameData.last) : null,
      dob: dob.toISOString().split('T')[0],
      gender: nameData.gender,
      address: `${Math.floor(Math.random() * 999) + 1}, ${randomChoice(['MG Road', 'Brigade Road', 'Commercial Street', 'Residency Road', 'Cunningham Road'])}, ${city}`,
      emergency_contact: Math.random() > 0.4 ? randomPhone() : null,
      created_at: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      updated_at: new Date().toISOString()
    }
    
    patients.push(patient)
  }
  
  // Insert patients in batches
  const batchSize = 10
  for (let i = 0; i < patients.length; i += batchSize) {
    const batch = patients.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('patients')
      .insert(batch)
      .select()
    
    if (error) {
      console.error(`Error inserting patient batch ${i / batchSize + 1}:`, error)
    } else {
      console.log(`✅ Inserted patient batch ${i / batchSize + 1}/${Math.ceil(patients.length / batchSize)} (${data.length} patients)`)
    }
  }
  
  return patients.length
}

async function generateAppointments() {
  console.log('📅 Creating comprehensive appointment records...')
  
  // Get existing patients and doctors
  const { data: patients } = await supabase.from('patients').select('patient_id, name')
  const { data: doctors } = await supabase.from('users').select('id, full_name').eq('role', 'doctor')
  
  if (!patients?.length || !doctors?.length) {
    console.log('❌ No patients or doctors found. Skipping appointments.')
    return 0
  }
  
  const appointments = []
  const now = new Date()
  
  for (let i = 0; i < 200; i++) {
    const patient = randomChoice(patients)
    const doctor = randomChoice(doctors)
    
    // Generate appointments from 3 months ago to 2 months in future
    const appointmentDate = randomDate(
      new Date(now.getFullYear(), now.getMonth() - 3, 1),
      new Date(now.getFullYear(), now.getMonth() + 2, 28)
    )
    
    const hours = 9 + Math.floor(Math.random() * 8) // 9 AM to 5 PM
    const minutes = Math.random() > 0.5 ? '00' : '30'
    const scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`
    
    const appointmentType = randomChoice(appointmentTypes)
    let status = randomChoice(appointmentStatuses)
    
    // Make past appointments more likely to be completed
    if (appointmentDate < now) {
      status = Math.random() > 0.2 ? 'completed' : randomChoice(['completed', 'cancelled', 'no_show'])
    }
    
    const appointment = {
      patient_id: patient.patient_id,
      doctor_id: doctor.id,
      department: randomChoice(['ENT', 'General Medicine', 'Dentistry', 'Cardiology']),
      appointment_type: appointmentType,
      status: status,
      scheduled_date: appointmentDate.toISOString().split('T')[0],
      scheduled_time: scheduledTime,
      duration: randomChoice([30, 45, 60]),
      title: `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} - ${patient.name}`,
      description: `${appointmentType} appointment for ${patient.name} with Dr. ${doctor.full_name}`,
      notes: Math.random() > 0.6 ? randomChoice([
        'Patient reports headaches and fatigue',
        'Follow-up for previous consultation',
        'Routine checkup and medication review',
        'Ear infection symptoms',
        'Dental cleaning and examination'
      ]) : null,
      priority: Math.random() > 0.85,
      is_recurring: Math.random() > 0.9,
      reminder_sent: Math.random() > 0.3,
      confirmation_sent: Math.random() > 0.2,
      estimated_cost: Math.floor(Math.random() * 2000) + 500,
      created_by: doctor.id,
      created_at: randomDate(new Date(appointmentDate.getTime() - 7 * 24 * 60 * 60 * 1000), appointmentDate).toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Add status-specific timestamps
    if (status === 'confirmed') {
      appointment.confirmed_at = new Date(appointmentDate.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    } else if (status === 'completed') {
      appointment.confirmed_at = new Date(appointmentDate.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      appointment.arrived_at = new Date(appointmentDate.getTime() + Math.random() * 30 * 60 * 1000).toISOString()
      appointment.started_at = new Date(appointmentDate.getTime() + (Math.random() * 15 + 5) * 60 * 1000).toISOString()
      appointment.completed_at = new Date(appointmentDate.getTime() + (appointment.duration + Math.random() * 10) * 60 * 1000).toISOString()
    } else if (status === 'cancelled') {
      appointment.cancelled_at = new Date(appointmentDate.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString()
      appointment.cancellation_reason = randomChoice([
        'Patient emergency',
        'Doctor unavailable',
        'Weather conditions',
        'Personal reasons'
      ])
    }
    
    appointments.push(appointment)
  }
  
  // Insert appointments in batches
  const batchSize = 20
  for (let i = 0; i < appointments.length; i += batchSize) {
    const batch = appointments.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('appointments')
      .insert(batch)
      .select()
    
    if (error) {
      console.error(`Error inserting appointment batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`✅ Inserted appointment batch ${i / batchSize + 1}/${Math.ceil(appointments.length / batchSize)} (${data.length} appointments)`)
    }
  }
  
  return appointments.length
}

async function generatePrescriptions() {
  console.log('💊 Creating prescription records...')
  
  // Get completed appointments and available medicines
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_id')
    .eq('status', 'completed')
    .limit(100)
    
  const { data: medicines } = await supabase
    .from('medicines')
    .select('id, name, dosage_form')
    .eq('is_active', true)
  
  if (!appointments?.length || !medicines?.length) {
    console.log('❌ No completed appointments or medicines found. Skipping prescriptions.')
    return 0
  }
  
  const prescriptions = []
  
  for (const appointment of appointments) {
    // Each appointment gets 1-4 prescriptions
    const prescriptionCount = Math.floor(Math.random() * 4) + 1
    
    for (let i = 0; i < prescriptionCount; i++) {
      const medicine = randomChoice(medicines)
      
      const prescription = {
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        medicine_id: medicine.id,
        quantity: Math.floor(Math.random() * 30) + 1,
        dosage: randomChoice(['1 tablet', '2 tablets', '5ml', '10ml', '1 capsule']),
        frequency: randomChoice(['Once daily', 'Twice daily', 'Thrice daily', 'Every 8 hours', 'As needed']),
        duration: randomChoice(['3 days', '5 days', '7 days', '10 days', '14 days', '1 month']),
        instructions: Math.random() > 0.5 ? randomChoice([
          'Take with food',
          'Take on empty stomach',
          'Complete the full course',
          'Apply externally only',
          'Take before bedtime'
        ]) : null,
        status: randomChoice(['active', 'completed', 'cancelled']),
        created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
      }
      
      prescriptions.push(prescription)
    }
  }
  
  // Insert prescriptions in batches
  const batchSize = 25
  for (let i = 0; i < prescriptions.length; i += batchSize) {
    const batch = prescriptions.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('prescriptions')
      .insert(batch)
      .select()
    
    if (error) {
      console.error(`Error inserting prescription batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`✅ Inserted prescription batch ${i / batchSize + 1}/${Math.ceil(prescriptions.length / batchSize)} (${data.length} prescriptions)`)
    }
  }
  
  return prescriptions.length
}

async function generateInvoices() {
  console.log('💳 Creating invoice records...')
  
  // Get completed appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_id, estimated_cost')
    .eq('status', 'completed')
    .limit(80)
  
  if (!appointments?.length) {
    console.log('❌ No completed appointments found. Skipping invoices.')
    return 0
  }
  
  const invoices = []
  
  for (const appointment of appointments) {
    const opdCharge = appointment.estimated_cost || 500
    const servicesCharge = Math.floor(Math.random() * 3000)
    const medicinesCharge = Math.floor(Math.random() * 1000)
    const subtotal = opdCharge + servicesCharge + medicinesCharge
    const discountPercentage = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0
    const discountAmount = Math.floor(subtotal * discountPercentage / 100)
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.18) // 18% GST
    const totalAmount = subtotal - discountAmount + taxAmount
    
    // Random payment status
    const paymentStatus = randomChoice(['pending', 'partial', 'completed'])
    let amountPaid = 0
    
    if (paymentStatus === 'completed') {
      amountPaid = totalAmount
    } else if (paymentStatus === 'partial') {
      amountPaid = Math.floor(totalAmount * (0.3 + Math.random() * 0.4)) // 30-70% paid
    }
    
    const invoice = {
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opd_charge: opdCharge,
      services_charge: servicesCharge,
      medicines_charge: medicinesCharge,
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_amount: totalAmount - amountPaid,
      payment_status: paymentStatus,
      payment_method: paymentStatus !== 'pending' ? randomChoice(['cash', 'card', 'upi']) : null,
      created_by: appointment.doctor_id,
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (paymentStatus !== 'pending') {
      invoice.paid_at = randomDate(new Date(invoice.created_at), new Date()).toISOString()
    }
    
    invoices.push(invoice)
  }
  
  // Insert invoices in batches
  const batchSize = 20
  for (let i = 0; i < invoices.length; i += batchSize) {
    const batch = invoices.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('invoices')
      .insert(batch)
      .select()
    
    if (error) {
      console.error(`Error inserting invoice batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`✅ Inserted invoice batch ${i / batchSize + 1}/${Math.ceil(invoices.length / batchSize)} (${data.length} invoices)`)
    }
  }
  
  return invoices.length
}

async function main() {
  console.log('🎯 COMPREHENSIVE TEST DATA GENERATION')
  console.log('=====================================')
  console.log('This will create realistic healthcare data for search testing')
  console.log('')
  
  try {
    const patientCount = await generatePatients()
    const appointmentCount = await generateAppointments()
    const prescriptionCount = await generatePrescriptions()
    const invoiceCount = await generateInvoices()
    
    console.log('')
    console.log('🎉 DATA GENERATION COMPLETE')
    console.log('===========================')
    console.log(`📊 Summary:`)
    console.log(`   • Patients: ${patientCount}`)
    console.log(`   • Appointments: ${appointmentCount}`)
    console.log(`   • Prescriptions: ${prescriptionCount}`)
    console.log(`   • Invoices: ${invoiceCount}`)
    console.log('')
    console.log('✅ Search functionality now has comprehensive data to work with!')
    console.log('🔍 Try searching for patient names, appointment types, medicine names, etc.')
    
  } catch (error) {
    console.error('❌ Error generating test data:', error.message)
  }
}

main().catch(console.error)