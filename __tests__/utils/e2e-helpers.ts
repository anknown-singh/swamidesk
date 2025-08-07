/**
 * E2E test helper utilities for end-to-end testing
 */

import { vi } from 'vitest'
import { TEST_UUIDS } from '@/lib/utils/uuid'

export const createMockRealtimeClient = () => {
  const callbacks: { [key: string]: ((payload?: any) => void)[] } = {}
  
  return {
    channel: vi.fn(() => ({
      on: vi.fn((event: string, filter: Record<string, any>, callback: (payload?: any) => void) => {
        if (!callbacks[event]) callbacks[event] = []
        callbacks[event].push(callback)
        return {
          subscribe: vi.fn(() => ({
            unsubscribe: vi.fn()
          }))
        }
      }),
      subscribe: vi.fn(() => ({
        unsubscribe: vi.fn()
      })),
      unsubscribe: vi.fn(),
      // Helper to trigger callbacks in tests
      _trigger: (event: string, payload?: any) => {
        if (callbacks[event]) {
          callbacks[event].forEach(callback => callback(payload))
        }
      }
    })),
    removeChannel: vi.fn(),
    getChannels: vi.fn(() => [])
  }
}

export const createMockPatientData = () => {
  return {
    id: 'patient-e2e-123',
    first_name: 'Test',
    last_name: 'Patient',
    email: 'test.patient@example.com',
    phone: '+91-9876543210',
    date_of_birth: '1990-01-01',
    gender: 'male' as const,
    address: '123 Test Street',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '+91-9876543211',
    medical_history: 'Test medical history',
    allergies: 'None',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    created_by: TEST_UUIDS.E2E_USER
  }
}

export const createMockAppointmentData = () => {
  return {
    id: 'appointment-e2e-789',
    patient_id: 'patient-e2e-123',
    doctor_id: 'doctor-e2e-456',
    appointment_date: '2025-08-07',
    appointment_time: '10:00',
    status: 'scheduled' as const,
    department: 'ENT',
    notes: 'E2E test appointment',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
}

export const createMockDoctorData = () => {
  return {
    id: 'doctor-e2e-456',
    first_name: 'Dr. E2E',
    last_name: 'Tester',
    email: 'doctor.e2e@example.com',
    role: 'doctor',
    department: 'ENT',
    specialization: 'ENT Specialist',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  }
}

export const mockE2ESupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const waitForElement = async (selector: string, timeout: number = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkElement = () => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      } else {
        setTimeout(checkElement, 100)
      }
    }
    
    checkElement()
  })
}

export const simulateUserInput = async (selector: string, value: string) => {
  const element = await waitForElement(selector) as HTMLInputElement
  if (element) {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export const clickElement = async (selector: string) => {
  const element = await waitForElement(selector) as HTMLElement
  if (element) {
    element.click()
  }
}