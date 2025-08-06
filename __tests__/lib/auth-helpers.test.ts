import { describe, test, expect, vi } from 'vitest'
import {
  TEST_USERS,
  ROLE_DASHBOARDS,
  testRoleAccess,
  mockAuthFlow,
  setupAuthenticatedTest,
  createMockSession
} from '@/lib/test/auth-helpers'

describe('Authentication Helpers', () => {
  describe('TEST_USERS', () => {
    test('contains all required user roles', () => {
      expect(TEST_USERS).toHaveProperty('admin')
      expect(TEST_USERS).toHaveProperty('doctor')
      expect(TEST_USERS).toHaveProperty('receptionist')
      expect(TEST_USERS).toHaveProperty('attendant')
      expect(TEST_USERS).toHaveProperty('pharmacist')
    })

    test('each user has required properties', () => {
      Object.values(TEST_USERS).forEach(user => {
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
        expect(user).toHaveProperty('first_name')
        expect(user).toHaveProperty('last_name')
        expect(user).toHaveProperty('phone')
        expect(user).toHaveProperty('is_active')
        expect(user).toHaveProperty('created_at')
        expect(user.is_active).toBe(true)
      })
    })
  })

  describe('ROLE_DASHBOARDS', () => {
    test('maps each role to correct dashboard path', () => {
      expect(ROLE_DASHBOARDS.admin).toBe('/admin/dashboard')
      expect(ROLE_DASHBOARDS.doctor).toBe('/doctor/dashboard')
      expect(ROLE_DASHBOARDS.receptionist).toBe('/receptionist/dashboard')
      expect(ROLE_DASHBOARDS.attendant).toBe('/attendant/dashboard')
      expect(ROLE_DASHBOARDS.pharmacist).toBe('/pharmacy/dashboard')
    })
  })

  describe('testRoleAccess', () => {
    test('admin can access all role paths', () => {
      expect(testRoleAccess('admin', '/admin/dashboard')).toBe(true)
      expect(testRoleAccess('admin', '/doctor/consultations')).toBe(true)
      expect(testRoleAccess('admin', '/receptionist/patients')).toBe(true)
      expect(testRoleAccess('admin', '/attendant/services')).toBe(true)
      expect(testRoleAccess('admin', '/pharmacy/inventory')).toBe(true)
    })

    test('doctor can only access doctor paths', () => {
      expect(testRoleAccess('doctor', '/doctor/dashboard')).toBe(true)
      expect(testRoleAccess('doctor', '/doctor/consultations')).toBe(true)
      expect(testRoleAccess('doctor', '/admin/dashboard')).toBe(false)
      expect(testRoleAccess('doctor', '/receptionist/patients')).toBe(false)
    })

    test('receptionist can only access receptionist paths', () => {
      expect(testRoleAccess('receptionist', '/receptionist/dashboard')).toBe(true)
      expect(testRoleAccess('receptionist', '/receptionist/patients')).toBe(true)
      expect(testRoleAccess('receptionist', '/doctor/consultations')).toBe(false)
      expect(testRoleAccess('receptionist', '/admin/users')).toBe(false)
    })

    test('attendant can only access attendant paths', () => {
      expect(testRoleAccess('attendant', '/attendant/dashboard')).toBe(true)
      expect(testRoleAccess('attendant', '/attendant/services')).toBe(true)
      expect(testRoleAccess('attendant', '/pharmacy/inventory')).toBe(false)
      expect(testRoleAccess('attendant', '/admin/settings')).toBe(false)
    })

    test('pharmacist can only access pharmacy paths', () => {
      expect(testRoleAccess('pharmacist', '/pharmacy/dashboard')).toBe(true)
      expect(testRoleAccess('pharmacist', '/pharmacy/inventory')).toBe(true)
      expect(testRoleAccess('pharmacist', '/doctor/prescriptions')).toBe(false)
      expect(testRoleAccess('pharmacist', '/receptionist/billing')).toBe(false)
    })
  })

  describe('mockAuthFlow', () => {
    test('successful sign in with valid credentials', () => {
      const result = mockAuthFlow.signIn('admin@test.com', 'password123')
      
      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(TEST_USERS.admin)
      expect(result.data.session).toHaveProperty('access_token')
      expect(result.data.session.user.email).toBe('admin@test.com')
    })

    test('failed sign in with invalid credentials', () => {
      const result = mockAuthFlow.signIn('admin@test.com', 'wrong-password')
      
      expect(result.error).toEqual({ message: 'Invalid credentials' })
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    test('failed sign in with non-existent user', () => {
      const result = mockAuthFlow.signIn('nonexistent@test.com', 'password123')
      
      expect(result.error).toEqual({ message: 'Invalid credentials' })
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    test('successful sign out', () => {
      const result = mockAuthFlow.signOut()
      expect(result.error).toBeNull()
    })

    test('get session with valid role', () => {
      const result = mockAuthFlow.getSession('doctor')
      
      expect(result.error).toBeNull()
      expect(result.data.session).toHaveProperty('access_token')
      expect(result.data.session.user.email).toBe('doctor@test.com')
    })

    test('get session without role returns null session', () => {
      const result = mockAuthFlow.getSession()
      
      expect(result.error).toBeNull()
      expect(result.data.session).toBeNull()
    })
  })

  describe('createMockSession', () => {
    test('creates valid session object', () => {
      const session = createMockSession('admin')
      
      expect(session).toHaveProperty('access_token')
      expect(session).toHaveProperty('refresh_token')
      expect(session).toHaveProperty('expires_in')
      expect(session).toHaveProperty('token_type')
      expect(session).toHaveProperty('user')
      
      expect(session.user.email).toBe('admin@test.com')
      expect(session.user.user_metadata.role).toBe('admin')
      expect(session.token_type).toBe('bearer')
    })

    test('creates different sessions for different roles', () => {
      const adminSession = createMockSession('admin')
      const doctorSession = createMockSession('doctor')
      
      expect(adminSession.user.email).toBe('admin@test.com')
      expect(doctorSession.user.email).toBe('doctor@test.com')
      expect(adminSession.user.id).not.toBe(doctorSession.user.id)
    })
  })

  describe('setupAuthenticatedTest', () => {
    test('sets up authenticated test environment', () => {
      const { user, session } = setupAuthenticatedTest('doctor')
      
      expect(user).toEqual(TEST_USERS.doctor)
      expect(session.user.email).toBe('doctor@test.com')
    })

    test('creates session for different roles', () => {
      const { user: adminUser } = setupAuthenticatedTest('admin')
      const { user: doctorUser } = setupAuthenticatedTest('doctor')
      
      expect(adminUser.role).toBe('admin')
      expect(doctorUser.role).toBe('doctor')
    })
  })
})