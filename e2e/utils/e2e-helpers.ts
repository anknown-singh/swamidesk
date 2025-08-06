/**
 * E2E test helper utilities
 */

import { Page } from '@playwright/test'

export const loginAsAdmin = async (page: Page) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'admin@example.com')
  await page.fill('[data-testid="password-input"]', 'admin123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/admin/dashboard')
}

export const loginAsDoctor = async (page: Page) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'doctor@example.com')
  await page.fill('[data-testid="password-input"]', 'doctor123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/doctor/dashboard')
}

export const loginAsReceptionist = async (page: Page) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'receptionist@example.com')
  await page.fill('[data-testid="password-input"]', 'receptionist123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/receptionist/dashboard')
}

export const createTestPatient = async (page: Page, patientData: {
  name: string
  mobile: string
  email?: string
  dob?: string
  gender?: string
  address?: string
}) => {
  await page.click('[data-testid="add-patient-button"]')
  
  await page.fill('[data-testid="patient-name-input"]', patientData.name)
  await page.fill('[data-testid="patient-mobile-input"]', patientData.mobile)
  
  if (patientData.email) {
    await page.fill('[data-testid="patient-email-input"]', patientData.email)
  }
  
  if (patientData.dob) {
    await page.fill('[data-testid="patient-dob-input"]', patientData.dob)
  }
  
  if (patientData.gender) {
    await page.selectOption('[data-testid="patient-gender-select"]', patientData.gender)
  }
  
  if (patientData.address) {
    await page.fill('[data-testid="patient-address-input"]', patientData.address)
  }
  
  await page.click('[data-testid="save-patient-button"]')
  await page.waitForSelector('[data-testid="success-message"]')
}

export const bookAppointment = async (page: Page, appointmentData: {
  patientName: string
  doctorName: string
  date: string
  time: string
  type: string
}) => {
  await page.click('[data-testid="book-appointment-button"]')
  
  // Search and select patient
  await page.fill('[data-testid="patient-search-input"]', appointmentData.patientName)
  await page.click(`[data-testid="patient-option-${appointmentData.patientName}"]`)
  
  // Select doctor
  await page.selectOption('[data-testid="doctor-select"]', appointmentData.doctorName)
  
  // Set date and time
  await page.fill('[data-testid="appointment-date-input"]', appointmentData.date)
  await page.fill('[data-testid="appointment-time-input"]', appointmentData.time)
  
  // Select appointment type
  await page.selectOption('[data-testid="appointment-type-select"]', appointmentData.type)
  
  await page.click('[data-testid="book-appointment-submit-button"]')
  await page.waitForSelector('[data-testid="appointment-success-message"]')
}

export const waitForQueueUpdate = async (page: Page, tokenNumber?: number) => {
  if (tokenNumber) {
    await page.waitForSelector(`[data-testid="queue-item-${tokenNumber}"]`)
  } else {
    await page.waitForSelector('[data-testid="queue-list"]')
  }
}

export const navigateToQueue = async (page: Page) => {
  await page.click('[data-testid="queue-nav-link"]')
  await page.waitForURL('/*/queue')
}

export const startConsultation = async (page: Page, tokenNumber: number) => {
  await page.click(`[data-testid="start-consultation-${tokenNumber}"]`)
  await page.waitForSelector('[data-testid="consultation-form"]')
}

export const completeConsultation = async (page: Page, consultationData: {
  notes: string
  diagnosis: string
}) => {
  await page.fill('[data-testid="consultation-notes-input"]', consultationData.notes)
  await page.fill('[data-testid="diagnosis-input"]', consultationData.diagnosis)
  
  await page.click('[data-testid="complete-consultation-button"]')
  await page.waitForSelector('[data-testid="consultation-complete-message"]')
}

export const expectQueuePosition = async (page: Page, tokenNumber: number, position: number) => {
  const queueItem = page.locator(`[data-testid="queue-item-${tokenNumber}"]`)
  const positionText = await queueItem.locator('[data-testid="queue-position"]').textContent()
  if (positionText !== position.toString()) {
    throw new Error(`Expected queue position ${position}, got ${positionText}`)
  }
}

export const setupTestUser = async (page: Page, userType: 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'attendant' = 'admin') => {
  const users = {
    admin: { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    doctor: { email: 'doctor@example.com', password: 'doctor123', role: 'doctor' },
    receptionist: { email: 'receptionist@example.com', password: 'receptionist123', role: 'receptionist' },
    pharmacist: { email: 'pharmacist@example.com', password: 'pharmacist123', role: 'pharmacist' },
    attendant: { email: 'attendant@example.com', password: 'attendant123', role: 'attendant' }
  }
  
  // Login the user to the page
  const user = users[userType]
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.click('[data-testid="login-button"]')
  
  return user
}

export const cleanupTestData = async () => {
  // Mock implementation - in real app this would clean test data
  console.log('Cleaning up test data...')
}

export const createMockRealtimeClient = () => {
  return {
    channel: (channelName: string) => ({
      on: (event: string, callback: (payload: any) => void) => ({ }),
      subscribe: () => ({ }),
      unsubscribe: () => ({ }),
      send: (payload: any) => ({ })
    }),
    removeChannel: (channel: any) => ({ }),
    disconnect: () => ({ })
  }
}

export const createMockPatientData = (overrides: any = {}) => {
  return {
    id: 'patient-test-123',
    name: 'Test Patient',
    mobile: '+91-9876543210',
    email: 'patient@test.com',
    dob: '1990-01-01',
    gender: 'male',
    address: '123 Test Street',
    emergency_contact: '+91-9876543211',
    created_at: new Date().toISOString(),
    ...overrides
  }
}