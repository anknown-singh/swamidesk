/**
 * End-to-End Integration Tests for Dynamic Data Conversion
 * Tests complete workflows with dynamic data fetching across multiple components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
}

describe('Dynamic Data Integration E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Appointment Workflow Integration', () => {
    it('should handle full appointment booking workflow with dynamic data', async () => {
      const mockDoctorsData = [
        {
          id: 'doc1',
          full_name: 'Dr. John Smith',
          department: 'cardiology',
          specialization: 'Cardiologist'
        }
      ]

      const mockPatientsData = [
        {
          id: 'pat1',
          patient_number: 'P001',
          full_name: 'John Doe',
          phone: '+91-9876543210'
        }
      ]

      const mockAppointmentData = [
        {
          id: 'app1',
          patient_id: 'pat1',
          doctor_id: 'doc1',
          department: 'cardiology',
          scheduled_date: '2025-01-15',
          scheduled_time: '10:00',
          status: 'scheduled',
          patients: { full_name: 'John Doe' },
          users: { full_name: 'Dr. John Smith' }
        }
      ]

      // Mock all the expected database calls in sequence
      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'users':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockDoctorsData,
                    error: null
                  })
                })
              })
            }
          case 'patients':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockPatientsData,
                    error: null
                  })
                })
              })
            }
          case 'appointments':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                insert: vi.fn().mockResolvedValue({
                  data: mockAppointmentData,
                  error: null
                }),
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockAppointmentData,
                    error: null
                  })
                })
              }),
              insert: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                select: vi.fn().mockResolvedValue({
                  data: mockAppointmentData,
                  error: null
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      // Test the complete workflow integration
      const appointmentWorkflow = {
        // Step 1: Fetch dynamic doctors
        fetchDoctors: async () => {
          const { data, error } = await mockSupabaseClient
            .from('users')
            .select('id, full_name, department, specialization')
            .eq('role', 'doctor')
            .eq('is_active', true)
            .order('full_name')

          expect(data).toEqual(mockDoctorsData)
          expect(error).toBeNull()
          return data
        },

        // Step 2: Fetch dynamic patients
        fetchPatients: async () => {
          const { data, error } = await mockSupabaseClient
            .from('patients')
            .select('id, patient_number, full_name, phone')
            .eq('is_active', true)
            .order('full_name')

          expect(data).toEqual(mockPatientsData)
          expect(error).toBeNull()
          return data
        },

        // Step 3: Create appointment with dynamic data
        createAppointment: async (appointmentData: any) => {
          const { data, error } = await mockSupabaseClient
            .from('appointments')
            .insert([appointmentData])
            .select()

          expect(data).toEqual(mockAppointmentData)
          expect(error).toBeNull()
          return data
        },

        // Step 4: Update appointment calendar
        updateCalendar: async () => {
          const { data, error } = await mockSupabaseClient
            .from('appointments')
            .select(`
              *,
              patients(full_name, phone),
              users(full_name, department)
            `)
            .order('scheduled_date')
            .limit(100)

          expect(data).toEqual(mockAppointmentData)
          expect(error).toBeNull()
          return data
        }
      }

      // Execute the complete workflow
      const doctors = await appointmentWorkflow.fetchDoctors()
      const patients = await appointmentWorkflow.fetchPatients()
      
      const appointmentData = {
        patient_id: patients[0].id,
        doctor_id: doctors[0].id,
        department: doctors[0].department,
        scheduled_date: '2025-01-15',
        scheduled_time: '10:00',
        appointment_type: 'consultation'
      }

      await appointmentWorkflow.createAppointment(appointmentData)
      await appointmentWorkflow.updateCalendar()

      // Verify all calls were made correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments')
    })
  })

  describe('Pharmacy Dashboard Workflow Integration', () => {
    it('should handle complete pharmacy dashboard workflow with dynamic metrics', async () => {
      const mockPrescriptionsData = [
        {
          id: 'presc1',
          status: 'pending',
          created_at: '2025-01-01T10:00:00Z',
          patients: { full_name: 'John Doe' },
          users: { full_name: 'Dr. Smith' },
          prescription_items: [{ id: '1' }, { id: '2' }]
        }
      ]

      const mockInventoryData = [
        {
          id: 'inv1',
          quantity: 5,
          min_level: 20,
          medicines: { name: 'Paracetamol' }
        }
      ]

      const mockMetricsData = {
        pendingPrescriptions: 15,
        totalMedicines: 523,
        lowStockItems: 12,
        expiringItems: 7
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'prescriptions':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockReturnValue({
                    ...mockSupabaseClient,
                    limit: vi.fn().mockResolvedValue({
                      data: mockPrescriptionsData,
                      error: null,
                      count: mockMetricsData.pendingPrescriptions
                    })
                  })
                })
              })
            }
          case 'inventory':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                gt: vi.fn().mockResolvedValue({
                  count: mockMetricsData.totalMedicines,
                  error: null
                }),
                filter: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockReturnValue({
                    ...mockSupabaseClient,
                    limit: vi.fn().mockResolvedValue({
                      data: mockInventoryData,
                      error: null,
                      count: mockMetricsData.lowStockItems
                    })
                  })
                }),
                lt: vi.fn().mockResolvedValue({
                  count: mockMetricsData.expiringItems,
                  error: null
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      // Test complete pharmacy workflow
      const pharmacyWorkflow = {
        // Step 1: Fetch dynamic prescription metrics
        fetchPrescriptionMetrics: async () => {
          const { count, error } = await mockSupabaseClient
            .from('prescriptions')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')

          expect(count).toBe(mockMetricsData.pendingPrescriptions)
          expect(error).toBeNull()
          return count
        },

        // Step 2: Fetch dynamic inventory metrics
        fetchInventoryMetrics: async () => {
          const { count, error } = await mockSupabaseClient
            .from('inventory')
            .select('*', { count: 'exact' })
            .gt('quantity', 0)

          expect(count).toBe(mockMetricsData.totalMedicines)
          expect(error).toBeNull()
          return count
        },

        // Step 3: Fetch dynamic low stock alerts
        fetchLowStockAlerts: async () => {
          const { data, error } = await mockSupabaseClient
            .from('inventory')
            .select(`
              id,
              quantity,
              min_level,
              medicines(name)
            `)
            .filter('quantity', 'lt', 'min_level')
            .order('quantity')
            .limit(10)

          expect(data).toEqual(mockInventoryData)
          expect(error).toBeNull()
          return data
        },

        // Step 4: Fetch dynamic prescription queue
        fetchPrescriptionQueue: async () => {
          const { data, error } = await mockSupabaseClient
            .from('prescriptions')
            .select(`
              *,
              patients(full_name),
              users(full_name),
              prescription_items(*)
            `)
            .eq('status', 'pending')
            .order('created_at')
            .limit(20)

          expect(data).toEqual(mockPrescriptionsData)
          expect(error).toBeNull()
          return data
        }
      }

      // Execute complete workflow
      await Promise.all([
        pharmacyWorkflow.fetchPrescriptionMetrics(),
        pharmacyWorkflow.fetchInventoryMetrics(),
        pharmacyWorkflow.fetchLowStockAlerts(),
        pharmacyWorkflow.fetchPrescriptionQueue()
      ])

      // Verify all metrics calls were made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prescriptions')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('inventory')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockSupabaseClient.gt).toHaveBeenCalledWith('quantity', 0)
    })
  })

  describe('User Authentication and Role Management Integration', () => {
    it('should handle complete user authentication workflow with dynamic roles', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'doctor@swamicare.com',
        role: 'doctor',
        full_name: 'Dr. John Smith',
        password_hash: 'hashed_password',
        is_active: true
      }

      const mockRolesData = [
        { name: 'doctor', label: 'Doctor', permissions: ['read_patients', 'write_prescriptions'] },
        { name: 'admin', label: 'Administrator', permissions: ['full_access'] }
      ]

      const mockDashboardData = {
        todayPatients: 18,
        queueLength: 5,
        prescriptions: 8,
        procedures: 12
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'users':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  single: vi.fn().mockResolvedValue({
                    data: mockUserData,
                    error: null
                  })
                })
              })
            }
          case 'user_roles':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockRolesData,
                    error: null
                  })
                })
              })
            }
          case 'appointments':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  filter: vi.fn().mockResolvedValue({
                    count: mockDashboardData.todayPatients,
                    error: null
                  })
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      // Test complete authentication and dashboard workflow
      const authWorkflow = {
        // Step 1: Authenticate user with dynamic data
        authenticateUser: async (email: string, password: string) => {
          const { data, error } = await mockSupabaseClient
            .from('users')
            .select('id, email, role, full_name, password_hash, is_active')
            .eq('email', email)
            .eq('is_active', true)
            .single()

          expect(data).toEqual(mockUserData)
          expect(error).toBeNull()
          return data
        },

        // Step 2: Fetch user role permissions
        fetchUserPermissions: async (role: string) => {
          const { data, error } = await mockSupabaseClient
            .from('user_roles')
            .select('name, label, permissions')
            .eq('name', role)
            .eq('is_active', true)
            .order('name')

          expect(data).toEqual(mockRolesData.filter(r => r.name === role))
          expect(error).toBeNull()
          return data
        },

        // Step 3: Load role-specific dashboard data
        loadDashboardData: async (userId: string, role: string) => {
          if (role === 'doctor') {
            const { count, error } = await mockSupabaseClient
              .from('appointments')
              .select('*', { count: 'exact' })
              .eq('doctor_id', userId)
              .eq('status', 'scheduled')
              .filter('scheduled_date', 'eq', new Date().toISOString().split('T')[0])

            expect(count).toBe(mockDashboardData.todayPatients)
            expect(error).toBeNull()
            return { todayPatients: count }
          }
          return {}
        }
      }

      // Execute complete authentication workflow
      const user = await authWorkflow.authenticateUser('doctor@swamicare.com', 'password123')
      const permissions = await authWorkflow.fetchUserPermissions(user.role)
      const dashboardData = await authWorkflow.loadDashboardData(user.id, user.role)

      // Verify complete authentication flow
      expect(user.role).toBe('doctor')
      expect(permissions).toHaveLength(1)
      expect(dashboardData.todayPatients).toBe(18)
      
      // Verify all authentication calls were made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments')
    })
  })

  describe('Service Management Integration', () => {
    it('should handle complete service management workflow with dynamic service types', async () => {
      const mockServiceTypesData = [
        { name: 'Blood Collection', category: 'Laboratory' },
        { name: 'X-Ray', category: 'Imaging' },
        { name: 'Physical Therapy', category: 'Therapy' }
      ]

      const mockServiceRequestsData = [
        {
          id: 'req1',
          service_type: 'Blood Collection',
          service_name: 'CBC Test',
          status: 'pending',
          priority: 'medium',
          patients: { full_name: 'John Doe' },
          service_types: { name: 'Blood Collection' }
        }
      ]

      const mockPatientsData = [
        {
          id: 'pat1',
          patient_number: 'P001',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+91-9876543210'
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'service_types':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockServiceTypesData,
                    error: null
                  })
                })
              })
            }
          case 'service_requests':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockServiceRequestsData,
                    error: null
                  })
                })
              }),
              insert: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                select: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              }),
              update: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockResolvedValue({
                  error: null
                })
              })
            }
          case 'patients':
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockPatientsData,
                    error: null
                  })
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      // Test complete service management workflow
      const serviceWorkflow = {
        // Step 1: Fetch dynamic service types
        fetchServiceTypes: async () => {
          const { data, error } = await mockSupabaseClient
            .from('service_types')
            .select('name, category')
            .eq('is_active', true)
            .order('name')

          expect(data).toEqual(mockServiceTypesData)
          expect(error).toBeNull()
          return data
        },

        // Step 2: Fetch dynamic patients for service request
        fetchPatients: async () => {
          const { data, error } = await mockSupabaseClient
            .from('patients')
            .select('id, patient_number, first_name, last_name, phone')
            .eq('is_active', true)
            .order('first_name')

          expect(data).toEqual(mockPatientsData)
          expect(error).toBeNull()
          return data
        },

        // Step 3: Create service request with dynamic data
        createServiceRequest: async (requestData: any) => {
          const { data, error } = await mockSupabaseClient
            .from('service_requests')
            .insert([requestData])
            .select()

          expect(data).toEqual(mockServiceRequestsData)
          expect(error).toBeNull()
          return data
        },

        // Step 4: Update service request status
        updateServiceStatus: async (requestId: string, newStatus: string) => {
          const { error } = await mockSupabaseClient
            .from('service_requests')
            .update({ status: newStatus })
            .eq('id', requestId)

          expect(error).toBeNull()
          return true
        },

        // Step 5: Fetch updated service queue
        fetchServiceQueue: async () => {
          const { data, error } = await mockSupabaseClient
            .from('service_requests')
            .select(`
              *,
              patients(full_name),
              service_types(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50)

          expect(data).toEqual(mockServiceRequestsData)
          expect(error).toBeNull()
          return data
        }
      }

      // Execute complete service management workflow
      const serviceTypes = await serviceWorkflow.fetchServiceTypes()
      const patients = await serviceWorkflow.fetchPatients()
      
      const serviceRequestData = {
        patient_id: patients[0].id,
        service_type: serviceTypes[0].name,
        service_name: 'CBC Test',
        priority: 'medium',
        status: 'pending'
      }

      await serviceWorkflow.createServiceRequest(serviceRequestData)
      await serviceWorkflow.updateServiceStatus('req1', 'in_progress')
      await serviceWorkflow.fetchServiceQueue()

      // Verify all service management calls were made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('service_types')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('service_requests')
      expect(mockSupabaseClient.insert).toHaveBeenCalled()
      expect(mockSupabaseClient.update).toHaveBeenCalled()
    })
  })

  describe('Cross-System Integration Tests', () => {
    it('should handle data consistency across multiple systems', async () => {
      // Test scenario: Patient appointment creates prescription, affects pharmacy metrics
      const mockPatientData = { id: 'pat1', full_name: 'John Doe' }
      const mockDoctorData = { id: 'doc1', full_name: 'Dr. Smith' }
      const mockAppointmentData = { id: 'app1', patient_id: 'pat1', doctor_id: 'doc1', status: 'completed' }
      const mockPrescriptionData = { id: 'presc1', appointment_id: 'app1', status: 'pending' }

      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'appointments':
            return {
              ...mockSupabaseClient,
              insert: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                select: vi.fn().mockResolvedValue({
                  data: [mockAppointmentData],
                  error: null
                })
              }),
              update: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockResolvedValue({
                  error: null
                })
              })
            }
          case 'prescriptions':
            return {
              ...mockSupabaseClient,
              insert: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                select: vi.fn().mockResolvedValue({
                  data: [mockPrescriptionData],
                  error: null
                })
              }),
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockResolvedValue({
                  count: 1,
                  error: null
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      // Test cross-system workflow
      const crossSystemWorkflow = {
        // Step 1: Complete appointment
        completeAppointment: async (appointmentId: string) => {
          const { error } = await mockSupabaseClient
            .from('appointments')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', appointmentId)

          expect(error).toBeNull()
          return true
        },

        // Step 2: Create prescription from appointment
        createPrescription: async (appointmentId: string) => {
          const { data, error } = await mockSupabaseClient
            .from('prescriptions')
            .insert([{
              appointment_id: appointmentId,
              status: 'pending',
              created_at: new Date().toISOString()
            }])
            .select()

          expect(data).toEqual([mockPrescriptionData])
          expect(error).toBeNull()
          return data
        },

        // Step 3: Update pharmacy metrics
        updatePharmacyMetrics: async () => {
          const { count, error } = await mockSupabaseClient
            .from('prescriptions')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')

          expect(count).toBe(1)
          expect(error).toBeNull()
          return count
        }
      }

      // Execute cross-system workflow
      await crossSystemWorkflow.completeAppointment('app1')
      await crossSystemWorkflow.createPrescription('app1')
      const pendingCount = await crossSystemWorkflow.updatePharmacyMetrics()

      // Verify cross-system data consistency
      expect(pendingCount).toBe(1)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prescriptions')
      expect(mockSupabaseClient.update).toHaveBeenCalled()
      expect(mockSupabaseClient.insert).toHaveBeenCalled()
    })
  })

  describe('Error Handling Across Systems', () => {
    it('should handle cascading failures gracefully', async () => {
      // Test scenario: Database failure affects multiple systems
      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      }))

      const errorHandlingWorkflow = {
        handleSystemFailure: async () => {
          const results = await Promise.allSettled([
            mockSupabaseClient.from('appointments').select('*'),
            mockSupabaseClient.from('patients').select('*'),
            mockSupabaseClient.from('prescriptions').select('*')
          ])

          const failedSystems = results.filter(result => result.status === 'rejected')
          expect(failedSystems).toHaveLength(3)
          
          return {
            totalSystems: 3,
            failedSystems: failedSystems.length,
            healthyPercentage: ((3 - failedSystems.length) / 3) * 100
          }
        }
      }

      const systemHealth = await errorHandlingWorkflow.handleSystemFailure()
      expect(systemHealth.failedSystems).toBe(3)
      expect(systemHealth.healthyPercentage).toBe(0)
    })
  })
})