import { describe, test, expect, beforeEach } from 'vitest'
import {
  DatabaseSeeder,
  dbSeeder,
  createTestPatients,
  createTestQueue,
  createTestConsultations,
  createTestPrescriptions,
  createTestMedicines,
  createMockSupabaseWithData,
  testDbUtils
} from '@/lib/test/db-seeding'
import { TEST_USERS } from '@/lib/test/auth-helpers'

describe('Database Seeding Utilities', () => {
  beforeEach(() => {
    dbSeeder.reset()
  })

  describe('Test Data Generators', () => {
    test('createTestPatients generates valid patient data', () => {
      const patients = createTestPatients()
      
      expect(patients).toHaveLength(4)
      expect(patients[0]).toHaveProperty('id', 'patient-001')
      expect(patients[0]).toHaveProperty('first_name', 'John')
      expect(patients[0]).toHaveProperty('last_name', 'Doe')
      expect(patients[0]).toHaveProperty('phone', '+91-9876543210')
      expect(patients[0]).toHaveProperty('is_active', true)
    })

    test('createTestQueue generates valid queue data', () => {
      const queue = createTestQueue()
      
      expect(queue).toHaveLength(3)
      expect(queue[0]).toHaveProperty('id', 'queue-001')
      expect(queue[0]).toHaveProperty('patient_id', 'patient-001')
      expect(queue[0]).toHaveProperty('doctor_id', TEST_USERS.doctor.id)
      expect(queue[0]).toHaveProperty('status', 'waiting')
      expect(queue[0]).toHaveProperty('priority', 'normal')
    })

    test('createTestConsultations generates valid consultation data', () => {
      const consultations = createTestConsultations()
      
      expect(consultations).toHaveLength(2)
      expect(consultations[0]).toHaveProperty('id', 'consultation-001')
      expect(consultations[0]).toHaveProperty('patient_id', 'patient-001')
      expect(consultations[0]).toHaveProperty('doctor_id', TEST_USERS.doctor.id)
      expect(consultations[0]).toHaveProperty('status', 'completed')
    })

    test('createTestPrescriptions generates valid prescription data', () => {
      const prescriptions = createTestPrescriptions()
      
      expect(prescriptions).toHaveLength(2)
      expect(prescriptions[0]).toHaveProperty('id', 'prescription-001')
      expect(prescriptions[0]).toHaveProperty('medicine_name', 'Paracetamol 500mg')
      expect(prescriptions[0]).toHaveProperty('dosage', '500mg')
      expect(prescriptions[0]).toHaveProperty('status', 'dispensed')
    })

    test('createTestMedicines generates valid medicine data', () => {
      const medicines = createTestMedicines()
      
      expect(medicines).toHaveLength(3)
      expect(medicines[0]).toHaveProperty('id', 'medicine-001')
      expect(medicines[0]).toHaveProperty('name', 'Paracetamol 500mg')
      expect(medicines[0]).toHaveProperty('stock_quantity', 1000)
      expect(medicines[0]).toHaveProperty('is_active', true)
    })
  })

  describe('DatabaseSeeder Class', () => {
    test('creates new seeder instance with all data', () => {
      const seeder = new DatabaseSeeder()
      const allData = seeder.seedAll()
      
      expect(allData).toHaveProperty('patients')
      expect(allData).toHaveProperty('queue')
      expect(allData).toHaveProperty('consultations')
      expect(allData).toHaveProperty('prescriptions')
      expect(allData).toHaveProperty('medicines')
      expect(allData).toHaveProperty('users')
      
      expect(allData.patients).toHaveLength(4)
      expect(allData.queue).toHaveLength(3)
      expect(allData.consultations).toHaveLength(2)
      expect(allData.prescriptions).toHaveLength(2)
      expect(allData.medicines).toHaveLength(3)
    })

    test('finds records by ID correctly', () => {
      const seeder = new DatabaseSeeder()
      
      const patient = seeder.findPatientById('patient-001')
      expect(patient).toBeDefined()
      expect(patient?.first_name).toBe('John')
      
      const queueEntries = seeder.findQueueByPatientId('patient-001')
      expect(queueEntries).toHaveLength(1)
      expect(queueEntries[0].id).toBe('queue-001')
      
      const consultations = seeder.findConsultationsByPatientId('patient-001')
      expect(consultations).toHaveLength(1)
      expect(consultations[0].id).toBe('consultation-001')
    })

    test('creates new patient records', () => {
      const seeder = new DatabaseSeeder()
      
      const newPatient = seeder.createPatient({
        first_name: 'New',
        last_name: 'Patient',
        phone: '+91-1234567890'
      })
      
      expect(newPatient.first_name).toBe('New')
      expect(newPatient.last_name).toBe('Patient')
      expect(newPatient.phone).toBe('+91-1234567890')
      expect(newPatient.id).toContain('patient-')
      
      // Verify it was added to the dataset
      expect(seeder.getPatients()).toHaveLength(5)
    })

    test('creates new queue entries', () => {
      const seeder = new DatabaseSeeder()
      
      const newEntry = seeder.createQueueEntry({
        patient_id: 'patient-002',
        priority: 'urgent',
        notes: 'Test queue entry'
      })
      
      expect(newEntry.patient_id).toBe('patient-002')
      expect(newEntry.priority).toBe('urgent')
      expect(newEntry.notes).toBe('Test queue entry')
      expect(newEntry.id).toContain('queue-')
      
      // Verify it was added to the dataset
      expect(seeder.getQueue()).toHaveLength(4)
    })

    test('updates queue status', () => {
      const seeder = new DatabaseSeeder()
      
      const updatedEntry = seeder.updateQueueStatus('queue-001', 'completed')
      
      expect(updatedEntry).toBeDefined()
      expect(updatedEntry?.status).toBe('completed')
      expect(updatedEntry?.updated_at).not.toBe(updatedEntry?.created_at)
    })

    test('updates consultation status', () => {
      const seeder = new DatabaseSeeder()
      
      const updatedConsultation = seeder.updateConsultationStatus('consultation-002', 'completed')
      
      expect(updatedConsultation).toBeDefined()
      expect(updatedConsultation?.status).toBe('completed')
      expect(updatedConsultation?.updated_at).not.toBe(updatedConsultation?.created_at)
    })

    test('resets data correctly', () => {
      const seeder = new DatabaseSeeder()
      
      // Modify data
      seeder.createPatient({ first_name: 'Extra', last_name: 'Patient' })
      expect(seeder.getPatients()).toHaveLength(5)
      
      // Reset
      seeder.reset()
      expect(seeder.getPatients()).toHaveLength(4)
      expect(seeder.findPatientById('patient-001')?.first_name).toBe('John')
    })
  })

  describe('Mock Supabase with Data', () => {
    test('creates mock Supabase client with seeded data', async () => {
      const mockSupabase = createMockSupabaseWithData()
      
      // Test patients query
      const patientsResult = mockSupabase.from('patients').select()
      expect(patientsResult.data).toHaveLength(4)
      expect(patientsResult.error).toBeNull()
      
      // Test queue query
      const queueResult = mockSupabase.from('queue').select()
      expect(queueResult.data).toHaveLength(3)
      expect(queueResult.error).toBeNull()
      
      // Test medicines query
      const medicinesResult = mockSupabase.from('medicines').select()
      expect(medicinesResult.data).toHaveLength(3)
      expect(medicinesResult.error).toBeNull()
    })

    test('handles insert operations', () => {
      const mockSupabase = createMockSupabaseWithData()
      
      const newPatient = {
        id: 'patient-new',
        first_name: 'New',
        last_name: 'Patient',
        phone: '+91-0000000000'
      }
      
      const result = mockSupabase.from('patients').insert(newPatient)
      expect(result.data).toEqual([newPatient])
      expect(result.error).toBeNull()
    })

    test('handles update operations', () => {
      const mockSupabase = createMockSupabaseWithData()
      
      const updates = { status: 'completed' }
      
      const result = mockSupabase.from('queue').update(updates)
      expect(result.data).toEqual([updates])
      expect(result.error).toBeNull()
    })
  })

  describe('Test Database Utils', () => {
    test('setupFreshData resets and returns all data', () => {
      // Modify global seeder
      dbSeeder.createPatient({ first_name: 'Extra' })
      expect(dbSeeder.getPatients()).toHaveLength(5)
      
      // Setup fresh data
      const freshData = testDbUtils.setupFreshData()
      
      expect(freshData.patients).toHaveLength(4)
      expect(freshData.queue).toHaveLength(3)
      expect(dbSeeder.getPatients()).toHaveLength(4)
    })

    test('createEmptyQueueScenario removes queue entries', () => {
      const scenario = testDbUtils.createEmptyQueueScenario()
      
      expect(scenario.patients).toHaveLength(4)
      expect(scenario.queue).toHaveLength(0)
      expect(scenario.consultations).toHaveLength(2)
    })

    test('createBusyQueueScenario adds more queue entries', () => {
      const scenario = testDbUtils.createBusyQueueScenario()
      
      expect(scenario.queue.length).toBeGreaterThan(3)
      expect(scenario.queue).toHaveLength(10) // 3 original + 7 new
      
      // Check that new entries have proper structure
      const newEntries = scenario.queue.slice(3)
      newEntries.forEach(entry => {
        expect(entry).toHaveProperty('id')
        expect(entry).toHaveProperty('patient_id')
        expect(entry).toHaveProperty('status', 'waiting')
        expect(entry).toHaveProperty('priority', 'normal')
      })
    })

    test('createEmergencyScenario adds emergency queue entry', () => {
      const scenario = testDbUtils.createEmergencyScenario()
      
      expect(scenario.queue).toHaveLength(4) // 3 original + 1 emergency
      
      const emergencyEntry = scenario.queue.find(q => q.id === 'queue-emergency-001')
      expect(emergencyEntry).toBeDefined()
      expect(emergencyEntry?.priority).toBe('emergency')
      expect(emergencyEntry?.notes).toBe('Heart attack symptoms')
    })
  })

  describe('Data Relationships', () => {
    test('patient-queue relationships are consistent', () => {
      const data = testDbUtils.setupFreshData()
      
      // Check that all queue entries reference valid patients
      data.queue.forEach(queueEntry => {
        const patient = data.patients.find(p => p.id === queueEntry.patient_id)
        expect(patient).toBeDefined()
      })
    })

    test('consultation-patient relationships are consistent', () => {
      const data = testDbUtils.setupFreshData()
      
      // Check that all consultations reference valid patients
      data.consultations.forEach(consultation => {
        const patient = data.patients.find(p => p.id === consultation.patient_id)
        expect(patient).toBeDefined()
        
        const doctor = Object.values(data.users).find(u => u.id === consultation.doctor_id)
        expect(doctor).toBeDefined()
        expect(doctor?.role).toBe('doctor')
      })
    })

    test('prescription relationships are consistent', () => {
      const data = testDbUtils.setupFreshData()
      
      // Check that all prescriptions reference valid consultations and patients
      data.prescriptions.forEach(prescription => {
        const consultation = data.consultations.find(c => c.id === prescription.consultation_id)
        expect(consultation).toBeDefined()
        
        const patient = data.patients.find(p => p.id === prescription.patient_id)
        expect(patient).toBeDefined()
        
        const doctor = Object.values(data.users).find(u => u.id === prescription.doctor_id)
        expect(doctor).toBeDefined()
        expect(doctor?.role).toBe('doctor')
      })
    })
  })
})