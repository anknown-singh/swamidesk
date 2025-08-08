import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAppointmentCreation() {
  console.log('🧪 Testing Appointment Creation:')
  
  // Get a patient and doctor
  const { data: patients } = await supabase.from('patients').select('id, full_name').limit(1)
  const { data: doctors } = await supabase.from('users').select('id, full_name').eq('role', 'doctor').limit(1)
  
  if (!patients || patients.length === 0) {
    console.log('❌ No patients found')
    return
  }
  
  if (!doctors || doctors.length === 0) {
    console.log('❌ No doctors found')
    return
  }
  
  const patient = patients[0]
  const doctor = doctors[0]
  
  console.log(`Patient: ${patient.full_name} (${patient.id.slice(0, 8)}...)`)
  console.log(`Doctor: Dr. ${doctor.full_name} (${doctor.id.slice(0, 8)}...)`)
  
  // Try creating a simple appointment
  const testAppointment = {
    patient_id: patient.id,
    doctor_id: doctor.id,
    department: 'ENT',
    appointment_type: 'consultation',
    status: 'scheduled',
    scheduled_date: '2025-08-10',
    scheduled_time: '10:00',
    duration: 30,
    title: `Test Consultation - ${patient.full_name}`,
    description: `Test consultation with ${patient.full_name}`,
    created_by: doctor.id
  }
  
  console.log('\n📅 Creating test appointment...')
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert([testAppointment])
    .select()
    .single()
  
  if (error) {
    console.log('❌ Appointment creation failed:', error.message)
  } else {
    console.log('✅ Appointment created successfully!')
    console.log(`   ID: ${appointment.id.slice(0, 8)}...`)
    console.log(`   Title: ${appointment.title}`)
    console.log(`   Status: ${appointment.status}`)
  }
}

testAppointmentCreation().catch(console.error)