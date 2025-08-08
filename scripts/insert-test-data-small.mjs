/**
 * Small Test Data Generation Script
 * Creates a smaller set of realistic healthcare data for immediate testing
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Quick test data
const testPatients = [
  {
    full_name: 'Aadhya Sharma',
    phone: '9876543210',
    email: 'aadhya.sharma@example.com',
    date_of_birth: '1985-03-15',
    gender: 'Female',
    address: '123, MG Road, Bangalore',
    emergency_contact_name: 'Ravi Sharma',
    emergency_contact_phone: '9876543211',
  },
  {
    full_name: 'Arjun Patel',
    phone: '9876543212',
    email: 'arjun.patel@example.com',
    date_of_birth: '1990-07-22',
    gender: 'Male',
    address: '456, Brigade Road, Bangalore',
    emergency_contact_name: 'Meera Patel',
    emergency_contact_phone: '9876543214',
  },
  {
    full_name: 'Priya Singh',
    phone: '9876543213',
    email: 'priya.singh@example.com',
    date_of_birth: '1988-11-08',
    gender: 'Female',
    address: '789, Commercial Street, Bangalore',
    emergency_contact_name: 'Amit Singh',
    emergency_contact_phone: '9876543215',
  }
]

async function insertTestData() {
  console.log('🧪 Creating small test dataset...')
  
  try {
    // Insert test patients
    console.log('Creating patients...')
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .insert(testPatients)
      .select()
    
    if (patientError) {
      console.error('Error inserting patients:', patientError.message)
      return
    }
    
    console.log(`✅ Created ${patients.length} patients`)
    
    // Get a doctor for appointments
    const { data: doctors } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'doctor')
      .limit(1)
    
    if (doctors && doctors.length > 0) {
      const doctor = doctors[0]
      
      // Create test appointments
      const testAppointments = patients.slice(0, 2).map((patient, index) => ({
        patient_id: patient.id,
        doctor_id: doctor.id,
        department: 'ENT',
        appointment_type: 'consultation',
        status: index === 0 ? 'completed' : 'scheduled',
        scheduled_date: index === 0 ? '2025-08-07' : '2025-08-10',
        scheduled_time: '10:00',
        duration: 30,
        title: `Consultation - ${patient.full_name}`,
        description: `${index === 0 ? 'Follow-up' : 'Initial'} consultation with ${patient.full_name}`,
        created_by: doctor.id,
      }))
      
      console.log('Creating appointments...')
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .insert(testAppointments)
        .select()
      
      if (appointmentError) {
        console.error('Error inserting appointments:', appointmentError.message)
      } else {
        console.log(`✅ Created ${appointments.length} appointments`)
      }
    }
    
    console.log('')
    console.log('🎉 Test data created successfully!')
    console.log('✅ You can now test the search functionality')
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message)
  }
}

insertTestData().catch(console.error)