/**
 * Test helper utilities for appointment booking and other components
 */

import { vi } from 'vitest'
import { TEST_UUIDS } from '@/lib/utils/uuid'

export const createMockAppointmentBookingForm = (overrides: any = {}) => {
  return {
    patient_id: TEST_UUIDS.PATIENT_1,
    doctor_id: TEST_UUIDS.DOCTOR_1,
    department: 'ENT',
    appointment_type: 'consultation',
    scheduled_date: '2025-08-07',
    scheduled_time: '10:00',
    duration: 30,
    priority: false,
    notes: 'Regular checkup',
    ...overrides
  }
}

export const createMockPatientData = () => {
  return {
    id: TEST_UUIDS.PATIENT_1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    date_of_birth: '1990-01-01',
    gender: 'male' as const,
    address: '123 Main St',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+91-9876543211',
    medical_history: 'No major illnesses',
    allergies: 'None',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    created_by: TEST_UUIDS.USER_1
  }
}

export const createMockDoctorData = () => {
  return {
    id: TEST_UUIDS.DOCTOR_1,
    first_name: 'Dr. John',
    last_name: 'Smith',
    email: 'doctor@example.com',
    role: 'doctor',
    department: 'ENT',
    specialization: 'ENT Specialist',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  }
}

export const createMockAppointmentData = () => {
  return {
    id: 'appointment-789',
    patient_id: TEST_UUIDS.PATIENT_1,
    doctor_id: TEST_UUIDS.DOCTOR_1,
    appointment_date: '2025-08-07',
    appointment_time: '10:00',
    status: 'scheduled' as const,
    department: 'ENT',
    notes: 'Regular checkup',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
}

export const mockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

// Missing functions for appointment calendar tests
export const createMockAppointment = (overrides: any = {}) => {
  return {
    id: 'appointment-123',
    patient_id: TEST_UUIDS.PATIENT_1,
    doctor_id: TEST_UUIDS.DOCTOR_1, 
    department: 'ENT',
    appointment_type: 'consultation',
    status: 'scheduled',
    scheduled_date: '2025-08-07',
    scheduled_time: '10:00',
    duration: 30,
    title: 'Consultation',
    notes: '',
    priority: false,
    estimated_cost: 1000,
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    created_by: TEST_UUIDS.USER_1,
    patient: {
      id: TEST_UUIDS.PATIENT_1,
      full_name: 'John Doe',
      phone: '+91-9876543210'
    },
    doctor: {
      id: TEST_UUIDS.DOCTOR_1,
      full_name: 'Dr. Smith',
      department: 'ENT'
    },
    ...overrides
  }
}

export const createMockDoctor = (overrides: any = {}) => {
  return {
    id: TEST_UUIDS.DOCTOR_1,
    role: 'doctor',
    full_name: 'Dr. Smith',
    email: 'doctor@example.com',
    phone: '+91-9876543210',
    department: 'ENT',
    specialization: 'ENT Specialist',
    password_hash: 'hashed_password',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides
  }
}

export const createMockVisit = (overrides: any = {}) => {
  return {
    id: 'visit-123',
    patient_id: TEST_UUIDS.PATIENT_1,
    doctor_id: TEST_UUIDS.DOCTOR_1,
    token_number: 1,
    department: 'ENT',
    visit_date: '2025-08-07',
    status: 'waiting' as const,
    consultation_notes: '',
    diagnosis: '',
    opd_charge: 500,
    priority: false,
    checked_in_at: '2025-08-07T09:00:00.000Z',
    consultation_started_at: null,
    consultation_ended_at: null,
    created_at: '2025-08-07T09:00:00.000Z',
    updated_at: '2025-08-07T09:00:00.000Z',
    patient: {
      id: TEST_UUIDS.PATIENT_1,
      name: 'John Doe',
      mobile: '+91-9876543210',
      dob: '1990-01-01',
      gender: 'male' as const,
      address: '123 Main St',
      email: 'john@example.com',
      emergency_contact: '+91-9876543211',
      created_by: TEST_UUIDS.USER_1,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z'
    },
    doctor: {
      id: TEST_UUIDS.DOCTOR_1,
      role: 'doctor' as const,
      full_name: 'Dr. Smith',
      email: 'doctor@example.com',
      phone: '+91-9876543210',
      department: 'ENT',
      specialization: 'ENT Specialist',
      password_hash: 'hashed_password',
      is_active: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z'
    },
    ...overrides
  }
}

export const createMockPatient = (overrides: any = {}) => {
  return {
    id: TEST_UUIDS.PATIENT_1,
    name: 'John Doe',
    mobile: '+91-9876543210',
    dob: '1990-01-01',
    gender: 'male' as const,
    address: '123 Main St',
    email: 'john@example.com',
    emergency_contact: '+91-9876543211',
    created_by: TEST_UUIDS.USER_1,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides
  }
}

export const createMockSupabaseClient = () => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        neq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        in: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        order: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        limit: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        single: vi.fn(() => Promise.resolve(mockSupabaseResponse(null))),
        maybeSingle: vi.fn(() => Promise.resolve(mockSupabaseResponse(null)))
      })),
      insert: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        match: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        match: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
      })),
      upsert: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}