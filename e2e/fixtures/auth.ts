import { test as base, Page } from '@playwright/test'
import { TEST_USERS } from '../../lib/test/auth-helpers'

/**
 * Authentication fixtures for SwamIDesk E2E tests
 * 
 * These fixtures provide authenticated page contexts for different user roles
 */

export interface AuthFixtures {
  adminPage: Page
  doctorPage: Page
  receptionistPage: Page
  attendantPage: Page
  pharmacistPage: Page
}

/**
 * Mock authentication helper for E2E tests
 * In a real application, this would handle actual authentication flows
 */
async function authenticateAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role]
  
  // For demo purposes, we'll simulate authentication by setting localStorage
  // In a real app, you'd go through the actual login flow
  await page.evaluate((userData) => {
    localStorage.setItem('auth_user', JSON.stringify(userData))
    localStorage.setItem('auth_session', JSON.stringify({
      access_token: 'mock-access-token',
      user: userData
    }))
  }, user)
  
  // Navigate to the appropriate dashboard
  const dashboards = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard', 
    receptionist: '/receptionist/dashboard',
    attendant: '/attendant/dashboard',
    service_attendant: '/attendant/dashboard',
    pharmacist: '/pharmacy/dashboard'
  }
  
  await page.goto(dashboards[role])
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await authenticateAs(page, 'admin')
    await use(page)
    await context.close()
  },

  doctorPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await authenticateAs(page, 'doctor')
    await use(page)
    await context.close()
  },

  receptionistPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await authenticateAs(page, 'receptionist')
    await use(page)
    await context.close()
  },

  attendantPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await authenticateAs(page, 'attendant')
    await use(page)
    await context.close()
  },

  pharmacistPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await authenticateAs(page, 'pharmacist')
    await use(page)
    await context.close()
  }
})

export { expect } from '@playwright/test'