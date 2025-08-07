import { vi } from 'vitest'
import type { UserProfile } from '@/lib/types'
import { TEST_USERS } from './auth-helpers'

// Test data types
export interface TestPatient {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  created_at: string
  is_active: boolean
}

export interface TestQueueEntry {
  id: string
  patient_id: string
  doctor_id?: string
  receptionist_id: string
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'normal' | 'urgent' | 'emergency'
  notes?: string
  created_at: string
  updated_at: string
  estimated_time?: number
  [key: string]: unknown
}

export interface TestConsultation {
  id: string
  patient_id: string
  doctor_id: string
  queue_id?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  chief_complaint?: string
  history?: string
  examination?: string
  diagnosis?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TestPrescription {
  id: string
  consultation_id: string
  patient_id: string
  doctor_id: string
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  status: 'pending' | 'dispensed' | 'cancelled'
  created_at: string
}

export interface TestMedicine {
  id: string
  name: string
  generic_name?: string
  manufacturer?: string
  batch_number?: string
  expiry_date: string
  price: number
  stock_quantity: number
  unit: string
  category: string
  created_at: string
  is_active: boolean
}

// Seed data generators
export const createTestPatients = (): TestPatient[] => [
  {
    id: 'patient-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    date_of_birth: '1990-05-15',
    gender: 'male',
    address: '123 Test Street, Mumbai',
    emergency_contact: 'Jane Doe',
    emergency_phone: '+91-9876543211',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'patient-002',
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91-8765432109',
    date_of_birth: '1985-08-22',
    gender: 'female',
    address: '456 Health Avenue, Delhi',
    emergency_contact: 'Raj Sharma',
    emergency_phone: '+91-8765432110',
    created_at: '2025-01-02T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'patient-003',
    first_name: 'Ahmed',
    last_name: 'Khan',
    phone: '+91-7654321098',
    date_of_birth: '1975-12-10',
    gender: 'male',
    address: '789 Wellness Road, Bangalore',
    created_at: '2025-01-03T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'patient-004',
    first_name: 'Sunita',
    last_name: 'Patel',
    email: 'sunita.patel@example.com',
    phone: '+91-6543210987',
    date_of_birth: '1995-03-18',
    gender: 'female',
    created_at: '2025-01-04T00:00:00.000Z',
    is_active: true
  }
]

export const createTestQueue = (): TestQueueEntry[] => [
  {
    id: 'queue-001',
    patient_id: 'patient-001',
    doctor_id: TEST_USERS.doctor.id,
    receptionist_id: TEST_USERS.receptionist.id,
    status: 'waiting',
    priority: 'normal',
    notes: 'Regular checkup',
    created_at: '2025-01-06T09:00:00.000Z',
    updated_at: '2025-01-06T09:00:00.000Z',
    estimated_time: 30
  },
  {
    id: 'queue-002',
    patient_id: 'patient-002',
    doctor_id: TEST_USERS.doctor.id,
    receptionist_id: TEST_USERS.receptionist.id,
    status: 'in_progress',
    priority: 'urgent',
    notes: 'Follow-up consultation',
    created_at: '2025-01-06T09:30:00.000Z',
    updated_at: '2025-01-06T10:00:00.000Z',
    estimated_time: 45
  },
  {
    id: 'queue-003',
    patient_id: 'patient-003',
    receptionist_id: TEST_USERS.receptionist.id,
    status: 'waiting',
    priority: 'emergency',
    notes: 'Chest pain - urgent',
    created_at: '2025-01-06T10:15:00.000Z',
    updated_at: '2025-01-06T10:15:00.000Z'
  }
]

export const createTestConsultations = (): TestConsultation[] => [
  {
    id: 'consultation-001',
    patient_id: 'patient-001',
    doctor_id: TEST_USERS.doctor.id,
    queue_id: 'queue-001',
    status: 'completed',
    chief_complaint: 'Headache and fever',
    history: 'Patient reports headache for 2 days',
    examination: 'Temperature 99.2F, BP 120/80',
    diagnosis: 'Viral fever',
    notes: 'Rest and paracetamol prescribed',
    created_at: '2025-01-05T10:00:00.000Z',
    updated_at: '2025-01-05T10:30:00.000Z'
  },
  {
    id: 'consultation-002',
    patient_id: 'patient-002',
    doctor_id: TEST_USERS.doctor.id,
    status: 'in_progress',
    chief_complaint: 'Diabetes follow-up',
    history: 'Type 2 diabetes, on medication',
    examination: 'Blood sugar levels checked',
    created_at: '2025-01-06T10:00:00.000Z',
    updated_at: '2025-01-06T10:00:00.000Z'
  }
]

export const createTestPrescriptions = (): TestPrescription[] => [
  {
    id: 'prescription-001',
    consultation_id: 'consultation-001',
    patient_id: 'patient-001',
    doctor_id: TEST_USERS.doctor.id,
    medicine_name: 'Paracetamol 500mg',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '3 days',
    instructions: 'Take after meals',
    status: 'dispensed',
    created_at: '2025-01-05T10:30:00.000Z'
  },
  {
    id: 'prescription-002',
    consultation_id: 'consultation-002',
    patient_id: 'patient-002',
    doctor_id: TEST_USERS.doctor.id,
    medicine_name: 'Metformin 500mg',
    dosage: '500mg',
    frequency: 'Once daily',
    duration: '30 days',
    instructions: 'Take with dinner',
    status: 'pending',
    created_at: '2025-01-06T10:30:00.000Z'
  }
]

export const createTestMedicines = (): TestMedicine[] => [
  {
    id: 'medicine-001',
    name: 'Paracetamol 500mg',
    generic_name: 'Acetaminophen',
    manufacturer: 'ABC Pharmaceuticals',
    batch_number: 'PC001',
    expiry_date: '2026-12-31',
    price: 2.50,
    stock_quantity: 1000,
    unit: 'tablet',
    category: 'Analgesic',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'medicine-002',
    name: 'Metformin 500mg',
    generic_name: 'Metformin Hydrochloride',
    manufacturer: 'XYZ Pharma',
    batch_number: 'MF002',
    expiry_date: '2026-06-30',
    price: 5.25,
    stock_quantity: 500,
    unit: 'tablet',
    category: 'Antidiabetic',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  },
  {
    id: 'medicine-003',
    name: 'Amoxicillin 250mg',
    generic_name: 'Amoxicillin',
    manufacturer: 'PQR Drugs',
    batch_number: 'AM003',
    expiry_date: '2025-09-15',
    price: 12.75,
    stock_quantity: 200,
    unit: 'capsule',
    category: 'Antibiotic',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  }
]

// Database seeding utilities
export class DatabaseSeeder {
  private mockData: {
    patients: TestPatient[]
    queue: TestQueueEntry[]
    consultations: TestConsultation[]
    prescriptions: TestPrescription[]
    medicines: TestMedicine[]
    users: Record<string, UserProfile>
  }

  constructor() {
    this.mockData = {
      patients: createTestPatients(),
      queue: createTestQueue(),
      consultations: createTestConsultations(),
      prescriptions: createTestPrescriptions(),
      medicines: createTestMedicines(),
      users: TEST_USERS
    }
  }

  // Seed all tables with test data
  seedAll() {
    return {
      patients: this.mockData.patients,
      queue: this.mockData.queue,
      consultations: this.mockData.consultations,
      prescriptions: this.mockData.prescriptions,
      medicines: this.mockData.medicines,
      users: this.mockData.users
    }
  }

  // Get specific table data
  getPatients() {
    return this.mockData.patients
  }

  getQueue() {
    return this.mockData.queue
  }

  getConsultations() {
    return this.mockData.consultations
  }

  getPrescriptions() {
    return this.mockData.prescriptions
  }

  getMedicines() {
    return this.mockData.medicines
  }

  getUsers() {
    return this.mockData.users
  }

  // Find specific records
  findPatientById(id: string) {
    return this.mockData.patients.find(p => p.id === id)
  }

  findQueueByPatientId(patientId: string) {
    return this.mockData.queue.filter(q => q.patient_id === patientId)
  }

  findConsultationsByPatientId(patientId: string) {
    return this.mockData.consultations.filter(c => c.patient_id === patientId)
  }

  findPrescriptionsByConsultationId(consultationId: string) {
    return this.mockData.prescriptions.filter(p => p.consultation_id === consultationId)
  }

  // Create new test records
  createPatient(data: Partial<TestPatient>): TestPatient {
    const newPatient: TestPatient = {
      id: `patient-${Date.now()}`,
      first_name: 'Test',
      last_name: 'Patient',
      phone: '+91-0000000000',
      date_of_birth: '1990-01-01',
      gender: 'other',
      created_at: new Date().toISOString(),
      is_active: true,
      ...data
    }
    this.mockData.patients.push(newPatient)
    return newPatient
  }

  createQueueEntry(data: Partial<TestQueueEntry>): TestQueueEntry {
    const newEntry: TestQueueEntry = {
      id: `queue-${Date.now()}`,
      patient_id: 'patient-001',
      receptionist_id: TEST_USERS.receptionist.id,
      status: 'waiting',
      priority: 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    }
    this.mockData.queue.push(newEntry)
    return newEntry
  }

  createConsultation(data: Partial<TestConsultation>): TestConsultation {
    const newConsultation: TestConsultation = {
      id: `consultation-${Date.now()}`,
      patient_id: 'patient-001',
      doctor_id: TEST_USERS.doctor.id,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    }
    this.mockData.consultations.push(newConsultation)
    return newConsultation
  }

  // Update existing records
  updateQueueStatus(id: string, status: TestQueueEntry['status']) {
    const entry = this.mockData.queue.find(q => q.id === id)
    if (entry) {
      entry.status = status
      entry.updated_at = new Date().toISOString()
    }
    return entry
  }

  updateConsultationStatus(id: string, status: TestConsultation['status']) {
    const consultation = this.mockData.consultations.find(c => c.id === id)
    if (consultation) {
      consultation.status = status
      consultation.updated_at = new Date().toISOString()
    }
    return consultation
  }

  // Clear all data
  reset() {
    this.mockData = {
      patients: createTestPatients(),
      queue: createTestQueue(),
      consultations: createTestConsultations(),
      prescriptions: createTestPrescriptions(),
      medicines: createTestMedicines(),
      users: TEST_USERS
    }
  }
}

// Global seeder instance
export const dbSeeder = new DatabaseSeeder()

// Mock Supabase responses with seeded data
export const createMockSupabaseWithData = () => {
  const seeder = new DatabaseSeeder()

  return {
    from: vi.fn((table: string) => {
      const mockQuery = {
        select: vi.fn(() => {
          let data: unknown[] = []
          
          switch (table) {
            case 'patients':
              data = seeder.getPatients()
              break
            case 'queue':
              data = seeder.getQueue()
              break
            case 'consultations':
              data = seeder.getConsultations()
              break
            case 'prescriptions':
              data = seeder.getPrescriptions()
              break
            case 'medicines':
              data = seeder.getMedicines()
              break
            case 'users':
              data = Object.values(seeder.getUsers())
              break
          }
          
          return {
            data,
            error: null
          }
        }),

        insert: vi.fn((newData: unknown) => ({
          data: Array.isArray(newData) ? newData : [newData],
          error: null
        })),

        update: vi.fn((updates: unknown) => ({
          data: [updates],
          error: null
        })),

        delete: vi.fn(() => ({
          data: null,
          error: null
        })),

        /* eslint-disable @typescript-eslint/no-unused-vars */
        eq: vi.fn((_column: string, _value: unknown) => mockQuery),
        in: vi.fn((_column: string, _values: unknown[]) => mockQuery),
        gte: vi.fn((_column: string, _value: unknown) => mockQuery),
        lte: vi.fn((_column: string, _value: unknown) => mockQuery),
        ilike: vi.fn((_column: string, _value: unknown) => mockQuery),
        order: vi.fn((_column: string) => mockQuery),
        limit: vi.fn((_count: number) => mockQuery),
        /* eslint-enable @typescript-eslint/no-unused-vars */
        single: vi.fn(() => mockQuery)
      }

      return mockQuery
    }),

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    channel: vi.fn((_topic: string) => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }))
  }
}

// Test utilities for database operations
export const testDbUtils = {
  // Setup fresh data for each test
  setupFreshData: () => {
    dbSeeder.reset()
    return dbSeeder.seedAll()
  },

  // Create test scenario data
  createEmptyQueueScenario: () => {
    dbSeeder.reset()
    // Remove queue entries but keep other data
    const data = dbSeeder.seedAll()
    data.queue = []
    return data
  },

  createBusyQueueScenario: () => {
    dbSeeder.reset()
    const data = dbSeeder.seedAll()
    
    // Add more queue entries
    for (let i = 4; i <= 10; i++) {
      data.queue.push({
        id: `queue-00${i}`,
        patient_id: `patient-00${i % 4 + 1}`,
        doctor_id: TEST_USERS.doctor.id,
        receptionist_id: TEST_USERS.receptionist.id,
        status: 'waiting',
        priority: 'normal',
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        updated_at: new Date(Date.now() + i * 1000).toISOString(),
        estimated_time: 30
      })
    }
    
    return data
  },

  createEmergencyScenario: () => {
    dbSeeder.reset()
    const data = dbSeeder.seedAll()
    
    // Add emergency queue entries
    data.queue.push({
      id: 'queue-emergency-001',
      patient_id: 'patient-003',
      receptionist_id: TEST_USERS.receptionist.id,
      status: 'waiting',
      priority: 'emergency',
      notes: 'Heart attack symptoms',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    return data
  }
}