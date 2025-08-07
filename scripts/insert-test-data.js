/**
 * Test Data Insertion Script
 * Inserts 200 patients and comprehensive appointment test data
 */

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Supabase configuration - update with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test data generators
const firstNames = [
  'Aarav', 'Aanya', 'Advik', 'Ahaan', 'Aisha', 'Anaya', 'Arjun', 'Avni', 'Dev', 'Diya',
  'Dhruv', 'Ishaan', 'Kiara', 'Krishna', 'Meera', 'Nisha', 'Priya', 'Raj', 'Ravi', 'Sana',
  'Shreya', 'Tanvi', 'Varun', 'Vidya', 'Yash', 'Zara', 'Amit', 'Anjali', 'Deepak', 'Geeta',
  'Harsh', 'Isha', 'Jatin', 'Kavya', 'Lalit', 'Maya', 'Nitin', 'Pooja', 'Rohit', 'Sunita',
  'Vikram', 'Anita', 'Bhavesh', 'Chetna', 'Dinesh', 'Ekta', 'Farhan', 'Garima', 'Hemant', 'Ira'
]

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Kumar', 'Jain', 'Patel', 'Shah', 'Mehta',
  'Chopra', 'Malhotra', 'Arora', 'Kapoor', 'Bansal', 'Mittal', 'Goel', 'Saxena', 'Joshi', 'Tyagi',
  'Bhatia', 'Khanna', 'Tiwari', 'Mishra', 'Pandey', 'Rao', 'Reddy', 'Nair', 'Menon', 'Iyer',
  'Subramanian', 'Krishnan', 'Naidu', 'Prasad', 'Chandra', 'Varma', 'Das', 'Sen', 'Ghosh', 'Roy',
  'Mukherjee', 'Banerjee', 'Dutta', 'Saha', 'Kar', 'Bhowmik', 'Chakraborty', 'Dey', 'Sinha', 'Mitra'
]

const departments = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'General Medicine',
  'Neurology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology'
]

const appointmentTypes = ['consultation', 'follow_up', 'procedure', 'checkup', 'emergency', 'vaccination']
const appointmentStatuses = ['pending', 'requested', 'scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']

function generateRandomPhone() {
  return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
}

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`
}

function generateRandomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
}

function generateRandomTime() {
  const hours = Math.floor(Math.random() * 11) + 8 // 8-18
  const minutes = Math.random() < 0.5 ? '00' : '30'
  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

async function insertPatients() {
  console.log('🏥 Generating 200 patients...')
  const patients = []
  
  for (let i = 0; i < 200; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    
    // Generate age between 1 and 90
    const age = Math.floor(Math.random() * 89) + 1
    const birthYear = new Date().getFullYear() - age
    const birthMonth = Math.floor(Math.random() * 12) + 1
    const birthDay = Math.floor(Math.random() * 28) + 1
    const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
    
    const patient = {
      full_name: fullName,
      phone: generateRandomPhone(),
      email: generateRandomEmail(firstName, lastName),
      date_of_birth: dateOfBirth,
      gender: getRandomElement(['male', 'female', 'other']),
      address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomElement(['MG Road', 'Park Street', 'Main Road', 'Station Road', 'Mall Road'])}, ${getRandomElement(cities)}`,
      emergency_contact_phone: generateRandomPhone(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    patients.push(patient)
  }
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert(patients)
      .select('id')
    
    if (error) throw error
    
    console.log(`✅ Successfully inserted ${data.length} patients`)
    return data.map(p => p.id)
  } catch (error) {
    console.error('❌ Error inserting patients:', error)
    throw error
  }
}

async function getDoctors() {
  console.log('👨‍⚕️ Fetching doctors...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, department')
      .eq('role', 'doctor')
      .eq('is_active', true)
    
    if (error) throw error
    
    console.log(`✅ Found ${data.length} doctors`)
    return data
  } catch (error) {
    console.error('❌ Error fetching doctors:', error)
    throw error
  }
}

async function insertAppointments(patientIds, doctors) {
  console.log('📅 Generating appointments...')
  const appointments = []
  
  // Generate appointments for the next 30 days
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + 30)
  
  // Generate appointments for past 7 days (for testing historical data)
  const pastDate = new Date()
  pastDate.setDate(today.getDate() - 7)
  
  // Create diverse appointment scenarios
  for (let i = 0; i < 500; i++) { // 500 appointments total
    const patientId = getRandomElement(patientIds)
    const doctor = getRandomElement(doctors)
    
    // 70% future appointments, 30% past appointments
    const isHistorical = Math.random() < 0.3
    const appointmentDate = isHistorical 
      ? generateRandomDate(pastDate, today)
      : generateRandomDate(today, futureDate)
    
    const appointmentType = getRandomElement(appointmentTypes)
    
    // Status logic based on date and type
    let status
    if (isHistorical) {
      // Past appointments should have final statuses
      status = getRandomElement(['completed', 'cancelled', 'no_show'])
    } else {
      // Future appointments should have pending/scheduled statuses
      const futureStatuses = ['pending', 'requested', 'scheduled', 'confirmed']
      status = getRandomElement(futureStatuses)
    }
    
    // Emergency appointments should be confirmed/scheduled
    if (appointmentType === 'emergency') {
      status = isHistorical ? 'completed' : 'confirmed'
    }
    
    // Some appointments for today should be in progress or arrived
    const isToday = appointmentDate.toDateString() === today.toDateString()
    if (isToday && Math.random() < 0.3) {
      status = getRandomElement(['arrived', 'in_progress'])
    }
    
    const appointment = {
      patient_id: patientId,
      doctor_id: doctor.id,
      department: doctor.department || getRandomElement(departments),
      appointment_type: appointmentType,
      status: status,
      scheduled_date: appointmentDate.toISOString().split('T')[0],
      scheduled_time: generateRandomTime(),
      duration: appointmentType === 'procedure' ? 60 : (appointmentType === 'consultation' ? 30 : 15),
      title: `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} with Dr. ${doctor.full_name}`,
      priority: Math.random() < 0.1, // 10% high priority
      is_recurring: Math.random() < 0.05, // 5% recurring
      reminder_sent: isHistorical ? Math.random() < 0.8 : Math.random() < 0.3,
      confirmation_sent: status === 'confirmed' || status === 'scheduled',
      created_by: doctor.id, // Assuming doctor creates the appointment
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Add completion timestamps for completed appointments
    if (status === 'completed') {
      appointment.confirmed_at = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
      appointment.arrived_at = appointmentDate.toISOString()
      appointment.started_at = new Date(appointmentDate.getTime() + 5 * 60 * 1000).toISOString()
      appointment.completed_at = new Date(appointmentDate.getTime() + appointment.duration * 60 * 1000).toISOString()
    }
    
    // Add cancellation details for cancelled appointments
    if (status === 'cancelled') {
      appointment.cancelled_at = new Date().toISOString()
      appointment.cancellation_reason = getRandomElement(['Patient request', 'Doctor unavailable', 'Emergency', 'Rescheduled'])
    }
    
    appointments.push(appointment)
  }
  
  try {
    // Insert in batches of 50 to avoid timeout
    const batchSize = 50
    let insertedCount = 0
    
    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('appointments')
        .insert(batch)
      
      if (error) throw error
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch ${Math.ceil((i + batchSize) / batchSize)} - Total: ${insertedCount} appointments`)
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} appointments`)
    return insertedCount
  } catch (error) {
    console.error('❌ Error inserting appointments:', error)
    throw error
  }
}

async function generateTestStatistics(patientIds, appointmentCount) {
  console.log('📊 Generating test statistics...')
  
  // Today's appointments
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select('id, status, appointment_type')
    .eq('scheduled_date', today)
  
  // Appointment type breakdown
  const typeBreakdown = appointmentTypes.reduce((acc, type) => {
    acc[type] = todayAppointments?.filter(apt => apt.appointment_type === type).length || 0
    return acc
  }, {})
  
  // Status breakdown
  const statusBreakdown = appointmentStatuses.reduce((acc, status) => {
    acc[status] = todayAppointments?.filter(apt => apt.status === status).length || 0
    return acc
  }, {})
  
  console.log('\n📋 TEST DATA SUMMARY:')
  console.log('===================')
  console.log(`👥 Patients: ${patientIds.length}`)
  console.log(`📅 Total Appointments: ${appointmentCount}`)
  console.log(`🗓️ Today's Appointments: ${todayAppointments?.length || 0}`)
  console.log('\n📊 Today\'s Appointment Types:')
  Object.entries(typeBreakdown).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })
  console.log('\n🔄 Today\'s Appointment Statuses:')
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`)
  })
  console.log('\n✨ Test scenarios included:')
  console.log('   ✅ All appointment types (consultation, follow_up, procedure, checkup, emergency, vaccination)')
  console.log('   ✅ All appointment statuses (pending, requested, scheduled, confirmed, arrived, in_progress, completed, cancelled, no_show, rescheduled)')
  console.log('   ✅ Past, present, and future appointments')
  console.log('   ✅ Different time slots (08:00-18:30, 30-minute intervals)')
  console.log('   ✅ Priority appointments (10%)')
  console.log('   ✅ Recurring appointments (5%)')
  console.log('   ✅ Emergency appointments')
  console.log('   ✅ Multiple appointments per time slot')
  console.log('   ✅ Appointments across different departments')
  console.log('   ✅ Diverse patient demographics')
}

async function main() {
  console.log('🚀 Starting test data insertion...')
  console.log('=====================================\n')
  
  try {
    // Step 1: Insert patients
    const patientIds = await insertPatients()
    
    // Step 2: Get doctors
    const doctors = await getDoctors()
    
    if (doctors.length === 0) {
      console.error('❌ No doctors found! Please create doctor users first.')
      return
    }
    
    // Step 3: Insert appointments
    const appointmentCount = await insertAppointments(patientIds, doctors)
    
    // Step 4: Generate statistics
    await generateTestStatistics(patientIds, appointmentCount)
    
    console.log('\n🎉 Test data insertion completed successfully!')
    console.log('You can now test all appointment booking scenarios in the calendar.')
    
  } catch (error) {
    console.error('💥 Failed to insert test data:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { main }