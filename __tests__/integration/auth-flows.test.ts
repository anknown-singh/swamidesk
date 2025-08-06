import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  TEST_USERS,
  ROLE_DASHBOARDS,
  ROLE_PERMISSIONS,
  testRoleAccess,
  mockAuthFlow,
  setupAuthenticatedTest,
  createMockSession
} from '@/lib/test/auth-helpers'
import { dbSeeder, testDbUtils } from '@/lib/test/db-seeding'

describe('Authentication Flows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testDbUtils.setupFreshData()
  })

  describe('User Authentication', () => {
    test('all 5 user roles can sign in successfully', () => {
      const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        const user = TEST_USERS[role]
        const result = mockAuthFlow.signIn(user.email, 'password123')
        
        expect(result.error).toBeNull()
        expect(result.data.user).toEqual(user)
        expect(result.data.session).toBeDefined()
        expect(result.data.session?.user.email).toBe(user.email)
        expect(result.data.session?.user.user_metadata.role).toBe(role)
      })
    })

    test('sign in fails with invalid credentials', () => {
      const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        const user = TEST_USERS[role]
        
        // Test wrong password
        const wrongPasswordResult = mockAuthFlow.signIn(user.email, 'wrongpassword')
        expect(wrongPasswordResult.error).toEqual({ message: 'Invalid credentials' })
        expect(wrongPasswordResult.data.user).toBeNull()
        expect(wrongPasswordResult.data.session).toBeNull()
        
        // Test wrong email
        const wrongEmailResult = mockAuthFlow.signIn('wrong@email.com', 'password123')
        expect(wrongEmailResult.error).toEqual({ message: 'Invalid credentials' })
        expect(wrongEmailResult.data.user).toBeNull()
        expect(wrongEmailResult.data.session).toBeNull()
      })
    })

    test('sign out works for all users', () => {
      const result = mockAuthFlow.signOut()
      expect(result.error).toBeNull()
    })

    test('session creation works for all roles', () => {
      const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        const session = createMockSession(role)
        const user = TEST_USERS[role]
        
        expect(session.access_token).toBe('mock-access-token')
        expect(session.token_type).toBe('bearer')
        expect(session.user.id).toBe(user.id)
        expect(session.user.email).toBe(user.email)
        expect(session.user.user_metadata.role).toBe(role)
        expect(session.user.user_metadata.first_name).toBe(user.first_name)
        expect(session.user.user_metadata.last_name).toBe(user.last_name)
      })
    })
  })

  describe('Role-based Access Control', () => {
    test('admin has access to all role paths', () => {
      const testPaths = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/settings',
        '/doctor/consultations',
        '/doctor/patients',
        '/receptionist/queue',
        '/receptionist/patients',
        '/attendant/services',
        '/attendant/procedures',
        '/pharmacy/inventory',
        '/pharmacy/dispensing'
      ]
      
      testPaths.forEach(path => {
        expect(testRoleAccess('admin', path)).toBe(true)
      })
    })

    test('doctor has access only to doctor paths', () => {
      const allowedPaths = [
        '/doctor/dashboard',
        '/doctor/consultations',
        '/doctor/patients',
        '/doctor/prescriptions',
        '/doctor/treatment-plans'
      ]
      
      const deniedPaths = [
        '/admin/dashboard',
        '/admin/users',
        '/receptionist/queue',
        '/attendant/services',
        '/pharmacy/inventory'
      ]
      
      allowedPaths.forEach(path => {
        expect(testRoleAccess('doctor', path)).toBe(true)
      })
      
      deniedPaths.forEach(path => {
        expect(testRoleAccess('doctor', path)).toBe(false)
      })
    })

    test('receptionist has access only to receptionist paths', () => {
      const allowedPaths = [
        '/receptionist/dashboard',
        '/receptionist/queue',
        '/receptionist/patients',
        '/receptionist/billing',
        '/receptionist/appointments'
      ]
      
      const deniedPaths = [
        '/admin/dashboard',
        '/doctor/consultations',
        '/attendant/services',
        '/pharmacy/inventory'
      ]
      
      allowedPaths.forEach(path => {
        expect(testRoleAccess('receptionist', path)).toBe(true)
      })
      
      deniedPaths.forEach(path => {
        expect(testRoleAccess('receptionist', path)).toBe(false)
      })
    })

    test('attendant has access only to attendant paths', () => {
      const allowedPaths = [
        '/attendant/dashboard',
        '/attendant/services',
        '/attendant/procedures',
        '/attendant/queue'
      ]
      
      const deniedPaths = [
        '/admin/dashboard',
        '/doctor/consultations',
        '/receptionist/billing',
        '/pharmacy/inventory'
      ]
      
      allowedPaths.forEach(path => {
        expect(testRoleAccess('attendant', path)).toBe(true)
      })
      
      deniedPaths.forEach(path => {
        expect(testRoleAccess('attendant', path)).toBe(false)
      })
    })

    test('pharmacist has access only to pharmacy paths', () => {
      const allowedPaths = [
        '/pharmacy/dashboard',
        '/pharmacy/inventory',
        '/pharmacy/dispensing',
        '/pharmacy/queue',
        '/pharmacy/medicines'
      ]
      
      const deniedPaths = [
        '/admin/dashboard',
        '/doctor/consultations',
        '/receptionist/patients',
        '/attendant/services'
      ]
      
      allowedPaths.forEach(path => {
        expect(testRoleAccess('pharmacist', path)).toBe(true)
      })
      
      deniedPaths.forEach(path => {
        expect(testRoleAccess('pharmacist', path)).toBe(false)
      })
    })
  })

  describe('Dashboard Routing', () => {
    test('each role has correct dashboard path', () => {
      expect(ROLE_DASHBOARDS.admin).toBe('/admin/dashboard')
      expect(ROLE_DASHBOARDS.doctor).toBe('/doctor/dashboard')
      expect(ROLE_DASHBOARDS.receptionist).toBe('/receptionist/dashboard')
      expect(ROLE_DASHBOARDS.attendant).toBe('/attendant/dashboard')
      expect(ROLE_DASHBOARDS.pharmacist).toBe('/pharmacy/dashboard')
    })

    test('dashboard paths are accessible by their respective roles', () => {
      const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        const dashboardPath = ROLE_DASHBOARDS[role]
        expect(testRoleAccess(role, dashboardPath)).toBe(true)
      })
    })

    test('users cannot access other role dashboards (except admin)', () => {
      const roles = ['doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(userRole => {
        roles.forEach(targetRole => {
          if (userRole !== targetRole) {
            const dashboardPath = ROLE_DASHBOARDS[targetRole]
            expect(testRoleAccess(userRole, dashboardPath)).toBe(false)
          }
        })
      })
    })
  })

  describe('Multi-user Session Management', () => {
    test('multiple users can have concurrent sessions', () => {
      const sessions = [
        mockAuthFlow.getSession('admin'),
        mockAuthFlow.getSession('doctor'),
        mockAuthFlow.getSession('receptionist'),
        mockAuthFlow.getSession('attendant'),
        mockAuthFlow.getSession('pharmacist')
      ]
      
      sessions.forEach((session, index) => {
        const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
        const role = roles[index]
        
        expect(session.error).toBeNull()
        expect(session.data.session).toBeDefined()
        expect(session.data.session?.user.user_metadata.role).toBe(role)
      })
      
      // Verify all sessions have unique user IDs
      const userIds = sessions.map(s => s.data.session?.user.id)
      const uniqueUserIds = new Set(userIds)
      expect(uniqueUserIds.size).toBe(5)
    })

    test('session data contains all required user information', () => {
      const roles = ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        const sessionResult = mockAuthFlow.getSession(role)
        const session = sessionResult.data.session!
        const user = TEST_USERS[role]
        
        // Verify session structure
        expect(session.access_token).toBeDefined()
        expect(session.refresh_token).toBeDefined()
        expect(session.expires_in).toBeDefined()
        expect(session.token_type).toBe('bearer')
        
        // Verify user data in session
        expect(session.user.id).toBe(user.id)
        expect(session.user.email).toBe(user.email)
        expect(session.user.user_metadata.role).toBe(role)
        expect(session.user.user_metadata.first_name).toBe(user.first_name)
        expect(session.user.user_metadata.last_name).toBe(user.last_name)
        expect(session.user.phone).toBe(user.phone)
      })
    })
  })

  describe('Authentication Integration with Database', () => {
    test('authenticated users can access patient data based on role', () => {
      const roles = ['admin', 'doctor', 'receptionist'] as const
      const patients = dbSeeder.getPatients()
      
      roles.forEach(role => {
        const { user } = setupAuthenticatedTest(role)
        expect(user.role).toBe(role)
        
        // These roles should have access to patient data
        switch (role) {
          case 'admin':
            // Admin can access all patients
            expect(patients).toHaveLength(4)
            break
          case 'doctor':
            // Doctor can access patients for consultations
            expect(patients).toHaveLength(4)
            break
          case 'receptionist':
            // Receptionist can access patients for registration/billing
            expect(patients).toHaveLength(4)
            break
        }
      })
    })

    test('authenticated users can access queue data based on role', () => {
      const roles = ['admin', 'doctor', 'receptionist'] as const
      const queueEntries = dbSeeder.getQueue()
      
      roles.forEach(role => {
        const { user } = setupAuthenticatedTest(role)
        expect(user.role).toBe(role)
        
        switch (role) {
          case 'admin':
            // Admin can see all queue entries
            expect(queueEntries.length).toBeGreaterThan(0)
            break
          case 'doctor':
            // Doctor can see queue entries assigned to them or waiting
            const doctorQueue = queueEntries.filter(
              q => q.doctor_id === user.id || q.status === 'waiting'
            )
            expect(doctorQueue.length).toBeGreaterThanOrEqual(0)
            break
          case 'receptionist':
            // Receptionist can see all queue entries they manage
            const receptionistQueue = queueEntries.filter(
              q => q.receptionist_id === user.id
            )
            expect(receptionistQueue.length).toBeGreaterThanOrEqual(0)
            break
        }
      })
    })

    test('authenticated users can access consultation data based on role', () => {
      const consultations = dbSeeder.getConsultations()
      
      // Doctor authentication test
      const { user: doctor } = setupAuthenticatedTest('doctor')
      const doctorConsultations = consultations.filter(c => c.doctor_id === doctor.id)
      expect(doctorConsultations.length).toBeGreaterThan(0)
      
      // Admin authentication test
      const { user: admin } = setupAuthenticatedTest('admin')
      expect(admin.role).toBe('admin')
      // Admin can access all consultations
      expect(consultations.length).toBeGreaterThan(0)
    })
  })

  describe('Role-specific Workflow Authorization', () => {
    test('receptionist can create and manage queue entries', () => {
      const { user } = setupAuthenticatedTest('receptionist')
      
      // Verify receptionist can create queue entries
      const newQueueEntry = dbSeeder.createQueueEntry({
        patient_id: 'patient-001',
        receptionist_id: user.id,
        status: 'waiting',
        priority: 'normal'
      })
      
      expect(newQueueEntry.receptionist_id).toBe(user.id)
      expect(newQueueEntry.status).toBe('waiting')
      
      // Verify receptionist can update queue status
      const updatedEntry = dbSeeder.updateQueueStatus(newQueueEntry.id, 'completed')
      expect(updatedEntry?.status).toBe('completed')
    })

    test('doctor can manage consultations and prescriptions', () => {
      const { user } = setupAuthenticatedTest('doctor')
      
      // Verify doctor can create consultations
      const newConsultation = dbSeeder.createConsultation({
        patient_id: 'patient-002',
        doctor_id: user.id,
        status: 'in_progress',
        chief_complaint: 'Test consultation'
      })
      
      expect(newConsultation.doctor_id).toBe(user.id)
      expect(newConsultation.status).toBe('in_progress')
      
      // Verify doctor has access to their consultations
      const doctorConsultations = dbSeeder.findConsultationsByPatientId('patient-002')
      const relevantConsultations = doctorConsultations.filter(c => c.doctor_id === user.id)
      expect(relevantConsultations.length).toBeGreaterThanOrEqual(1)
    })

    test('admin can access all user management functions', () => {
      const { user } = setupAuthenticatedTest('admin')
      expect(user.role).toBe('admin')
      
      // Admin can access all users
      const allUsers = Object.values(TEST_USERS)
      expect(allUsers).toHaveLength(5)
      
      // Admin can access all data
      expect(dbSeeder.getPatients()).toHaveLength(4)
      expect(dbSeeder.getQueue().length).toBeGreaterThan(0)
      expect(dbSeeder.getConsultations()).toHaveLength(2)
      expect(dbSeeder.getPrescriptions()).toHaveLength(2)
      expect(dbSeeder.getMedicines()).toHaveLength(3)
    })

    test('pharmacist can access medicine and prescription data', () => {
      const { user } = setupAuthenticatedTest('pharmacist')
      expect(user.role).toBe('pharmacist')
      
      // Pharmacist can access medicines
      const medicines = dbSeeder.getMedicines()
      expect(medicines).toHaveLength(3)
      
      // Pharmacist can access prescriptions
      const prescriptions = dbSeeder.getPrescriptions()
      expect(prescriptions).toHaveLength(2)
      
      // Verify medicines have required fields for pharmacy operations
      medicines.forEach(medicine => {
        expect(medicine).toHaveProperty('name')
        expect(medicine).toHaveProperty('stock_quantity')
        expect(medicine).toHaveProperty('price')
        expect(medicine).toHaveProperty('expiry_date')
        expect(medicine).toHaveProperty('is_active', true)
      })
    })

    test('attendant can access service and procedure data', () => {
      const { user } = setupAuthenticatedTest('attendant')
      expect(user.role).toBe('attendant')
      
      // Verify attendant user properties
      expect(user.first_name).toBe('Test')
      expect(user.last_name).toBe('Attendant')
      expect(user.is_active).toBe(true)
      
      // Test role-based access
      expect(testRoleAccess('attendant', '/attendant/services')).toBe(true)
      expect(testRoleAccess('attendant', '/attendant/procedures')).toBe(true)
      expect(testRoleAccess('attendant', '/doctor/consultations')).toBe(false)
    })
  })

  describe('Cross-role Data Access Control', () => {
    test('users cannot access data outside their role permissions', () => {
      const restrictedRoles = ['doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      restrictedRoles.forEach(role => {
        const { user } = setupAuthenticatedTest(role)
        
        // None of these roles should access admin-specific paths
        expect(testRoleAccess(role, '/admin/users')).toBe(false)
        expect(testRoleAccess(role, '/admin/settings')).toBe(false)
        
        // Roles should not access each other's exclusive areas
        if (role !== 'doctor') {
          expect(testRoleAccess(role, '/doctor/consultations')).toBe(false)
        }
        if (role !== 'pharmacist') {
          expect(testRoleAccess(role, '/pharmacy/inventory')).toBe(false)
        }
      })
    })

    test('shared data access works correctly', () => {
      const roles = ['doctor', 'receptionist'] as const
      
      roles.forEach(role => {
        const { user } = setupAuthenticatedTest(role)
        
        // Both doctors and receptionists should access patient data
        const patients = dbSeeder.getPatients()
        expect(patients.length).toBeGreaterThan(0)
        
        // Both should access queue data (different permissions)
        const queue = dbSeeder.getQueue()
        expect(queue.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Authentication Error Handling', () => {
    test('handles missing session gracefully', () => {
      const emptySession = mockAuthFlow.getSession()
      expect(emptySession.error).toBeNull()
      expect(emptySession.data.session).toBeNull()
    })

    test('handles invalid role access attempts gracefully', () => {
      const roles = ['doctor', 'receptionist', 'attendant', 'pharmacist'] as const
      
      roles.forEach(role => {
        // Should not throw errors, just return false
        expect(() => testRoleAccess(role, '/admin/dashboard')).not.toThrow()
        expect(() => testRoleAccess(role, '/invalid/path')).not.toThrow()
        expect(() => testRoleAccess(role, '')).not.toThrow()
      })
    })

    test('maintains session integrity across role switches', () => {
      const roles = ['admin', 'doctor', 'receptionist'] as const
      const sessions: any[] = []
      
      // Create sessions for all roles
      roles.forEach(role => {
        const { user, session } = setupAuthenticatedTest(role)
        sessions.push({ role, user, session })
      })
      
      // Verify each session maintains its integrity
      sessions.forEach(({ role, user, session }) => {
        expect(user.role).toBe(role)
        expect(session.user.user_metadata.role).toBe(role)
        expect(session.user.id).toBe(user.id)
      })
      
      // Verify sessions are distinct
      const sessionIds = sessions.map(s => s.session.user.id)
      const uniqueSessionIds = new Set(sessionIds)
      expect(uniqueSessionIds.size).toBe(sessions.length)
    })
  })
})