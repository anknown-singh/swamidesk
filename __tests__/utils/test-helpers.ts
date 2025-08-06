/**
 * Test helper utilities for appointment booking and other components
 */

import { vi } from 'vitest'

export const createMockAppointmentBookingForm = () => {
  return {
    patientId: 'patient-123',
    doctorId: 'doctor-456',
    appointmentDate: '2025-08-07',
    appointmentTime: '10:00',
    department: 'ENT',
    notes: 'Regular checkup'
  }
}

export const createMockPatientData = () => {
  return {
    id: 'patient-123',
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
    created_by: 'user-1'
  }
}

export const createMockDoctorData = () => {
  return {
    id: 'doctor-456',
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
    patient_id: 'patient-123',
    doctor_id: 'doctor-456',
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