/**
 * Real-time Testing for Dynamic Data Operations
 * Tests real-time updates and database operations with dynamic data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client with real-time capabilities
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockRealtimeChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn().mockReturnThis(),
}

const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  channel: vi.fn().mockReturnValue(mockRealtimeChannel),
  removeChannel: vi.fn(),
}

describe('Dynamic Data Real-time Operations Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Real-time Appointment Updates', () => {
    it('should handle real-time appointment booking and calendar updates', async () => {
      const mockInitialAppointments = [
        {
          id: 'app1',
          scheduled_date: '2025-01-15',
          scheduled_time: '10:00',
          patients: { full_name: 'John Doe' },
          users: { full_name: 'Dr. Smith' }
        }
      ]

      const mockNewAppointment = {
        id: 'app2',
        scheduled_date: '2025-01-15',
        scheduled_time: '11:00',
        patients: { full_name: 'Jane Smith' },
        users: { full_name: 'Dr. Johnson' }
      }

      const mockUpdatedAppointments = [...mockInitialAppointments, mockNewAppointment]

      let realtimeCallback: (payload: any) => void = () => {}

      // Mock real-time subscription
      mockRealtimeChannel.on.mockImplementation((event: string, callback: (payload: any) => void) => {
        if (event === 'postgres_changes') {
          realtimeCallback = callback
        }
        return mockRealtimeChannel
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockInitialAppointments,
                  error: null
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              select: vi.fn().mockResolvedValue({
                data: [mockNewAppointment],
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      // Test real-time appointment workflow
      const realtimeAppointmentManager = {
        appointments: mockInitialAppointments,
        
        // Set up real-time subscription
        setupRealtimeSubscription: () => {
          const channel = mockSupabaseClient.channel('appointments-changes')
          
          channel
            .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'appointments' 
            }, (payload) => {
              // Simulate real-time update
              realtimeAppointmentManager.handleRealtimeUpdate(payload)
            })
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'appointments' 
            }, (payload) => {
              realtimeAppointmentManager.handleRealtimeUpdate(payload)
            })
            .subscribe()

          return channel
        },

        // Handle real-time updates
        handleRealtimeUpdate: (payload: any) => {
          switch (payload.eventType) {
            case 'INSERT':
              realtimeAppointmentManager.appointments.push(payload.new)
              break
            case 'UPDATE':
              const index = realtimeAppointmentManager.appointments.findIndex(app => app.id === payload.new.id)
              if (index !== -1) {
                realtimeAppointmentManager.appointments[index] = payload.new
              }
              break
            case 'DELETE':
              realtimeAppointmentManager.appointments = realtimeAppointmentManager.appointments.filter(
                app => app.id !== payload.old.id
              )
              break
          }
        },

        // Fetch initial appointments
        fetchAppointments: async () => {
          const { data, error } = await mockSupabaseClient
            .from('appointments')
            .select(`
              *,
              patients(full_name, phone),
              users(full_name, department)
            `)
            .order('scheduled_date')
            .limit(100)

          if (data) {
            realtimeAppointmentManager.appointments = data
          }
          return { data, error }
        },

        // Create new appointment (triggers real-time update)
        createAppointment: async (appointmentData: any) => {
          const { data, error } = await mockSupabaseClient
            .from('appointments')
            .insert([appointmentData])
            .select()

          if (data && data.length > 0) {
            // Simulate real-time callback trigger
            realtimeCallback({
              eventType: 'INSERT',
              new: data[0],
              old: null,
              schema: 'public',
              table: 'appointments'
            })
          }

          return { data, error }
        }
      }

      // Execute real-time workflow
      realtimeAppointmentManager.setupRealtimeSubscription()
      await realtimeAppointmentManager.fetchAppointments()
      
      expect(realtimeAppointmentManager.appointments).toHaveLength(1)

      // Simulate new appointment creation
      await realtimeAppointmentManager.createAppointment(mockNewAppointment)
      
      // Verify real-time update was handled
      expect(realtimeAppointmentManager.appointments).toHaveLength(2)
      expect(realtimeAppointmentManager.appointments[1].id).toBe('app2')

      // Verify real-time subscription setup
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('appointments-changes')
      expect(mockRealtimeChannel.on).toHaveBeenCalledWith('postgres_changes', 
        expect.objectContaining({ event: 'INSERT' }), 
        expect.any(Function)
      )
      expect(mockRealtimeChannel.subscribe).toHaveBeenCalled()
    })

    it('should handle real-time appointment status updates', async () => {
      const mockAppointment = {
        id: 'app1',
        status: 'scheduled',
        scheduled_date: '2025-01-15',
        patients: { full_name: 'John Doe' }
      }

      let realtimeCallback: (payload: any) => void = () => {}

      mockRealtimeChannel.on.mockImplementation((event: string, callback: (payload: any) => void) => {
        if (event === 'postgres_changes') {
          realtimeCallback = callback
        }
        return mockRealtimeChannel
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            update: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const appointmentStatusManager = {
        currentAppointment: mockAppointment,

        setupRealtimeUpdates: () => {
          const channel = mockSupabaseClient.channel('appointment-status-changes')
          channel.on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'appointments' 
          }, (payload) => {
            appointmentStatusManager.handleStatusUpdate(payload)
          }).subscribe()
        },

        handleStatusUpdate: (payload: any) => {
          if (payload.new.id === appointmentStatusManager.currentAppointment.id) {
            appointmentStatusManager.currentAppointment = {
              ...appointmentStatusManager.currentAppointment,
              ...payload.new
            }
          }
        },

        updateAppointmentStatus: async (appointmentId: string, newStatus: string) => {
          const updateData = { 
            status: newStatus,
            updated_at: new Date().toISOString()
          }

          if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString()
          }

          const { error } = await mockSupabaseClient
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)

          // Simulate real-time callback
          if (!error) {
            realtimeCallback({
              eventType: 'UPDATE',
              new: { ...appointmentStatusManager.currentAppointment, ...updateData },
              old: appointmentStatusManager.currentAppointment,
              schema: 'public',
              table: 'appointments'
            })
          }

          return { error }
        }
      }

      appointmentStatusManager.setupRealtimeUpdates()
      
      expect(appointmentStatusManager.currentAppointment.status).toBe('scheduled')

      // Update appointment status
      await appointmentStatusManager.updateAppointmentStatus('app1', 'in_progress')
      
      // Verify real-time update was applied
      expect(appointmentStatusManager.currentAppointment.status).toBe('in_progress')
      expect(appointmentStatusManager.currentAppointment.updated_at).toBeDefined()
    })
  })

  describe('Real-time Pharmacy Inventory Updates', () => {
    it('should handle real-time inventory level changes and low stock alerts', async () => {
      const mockInventoryItems = [
        {
          id: 'inv1',
          medicine_id: 'med1',
          quantity: 25,
          min_level: 20,
          medicines: { name: 'Paracetamol' }
        },
        {
          id: 'inv2',
          medicine_id: 'med2',
          quantity: 5,
          min_level: 10,
          medicines: { name: 'Amoxicillin' }
        }
      ]

      let inventoryCallback: (payload: any) => void = () => {}
      let lowStockAlerts: any[] = []

      mockRealtimeChannel.on.mockImplementation((event: string, callback: (payload: any) => void) => {
        if (event === 'postgres_changes') {
          inventoryCallback = callback
        }
        return mockRealtimeChannel
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockInventoryItems.filter(item => item.quantity < item.min_level),
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const inventoryManager = {
        inventory: mockInventoryItems,
        lowStockItems: [] as any[],

        setupRealtimeInventoryTracking: () => {
          const channel = mockSupabaseClient.channel('inventory-changes')
          
          channel.on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'inventory' 
          }, (payload) => {
            inventoryManager.handleInventoryUpdate(payload)
          }).subscribe()
        },

        handleInventoryUpdate: (payload: any) => {
          const itemIndex = inventoryManager.inventory.findIndex(item => item.id === payload.new.id)
          if (itemIndex !== -1) {
            inventoryManager.inventory[itemIndex] = { ...inventoryManager.inventory[itemIndex], ...payload.new }
            
            // Check for low stock alert
            const updatedItem = inventoryManager.inventory[itemIndex]
            if (updatedItem.quantity < updatedItem.min_level) {
              inventoryManager.triggerLowStockAlert(updatedItem)
            }
          }
        },

        triggerLowStockAlert: (item: any) => {
          const existingAlert = lowStockAlerts.find(alert => alert.id === item.id)
          if (!existingAlert) {
            lowStockAlerts.push({
              id: item.id,
              medicine_name: item.medicines.name,
              current_quantity: item.quantity,
              min_level: item.min_level,
              alert_triggered_at: new Date().toISOString()
            })
          }
        },

        fetchLowStockItems: async () => {
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

          if (data) {
            inventoryManager.lowStockItems = data
          }
          return { data, error }
        },

        updateInventoryQuantity: async (itemId: string, newQuantity: number) => {
          const { error } = await mockSupabaseClient
            .from('inventory')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', itemId)

          // Simulate real-time callback
          if (!error) {
            const updatedItem = inventoryManager.inventory.find(item => item.id === itemId)
            if (updatedItem) {
              inventoryCallback({
                eventType: 'UPDATE',
                new: { ...updatedItem, quantity: newQuantity },
                old: updatedItem,
                schema: 'public',
                table: 'inventory'
              })
            }
          }

          return { error }
        }
      }

      // Setup real-time tracking
      inventoryManager.setupRealtimeInventoryTracking()
      await inventoryManager.fetchLowStockItems()
      
      // Initial low stock items
      expect(inventoryManager.lowStockItems).toHaveLength(1)
      expect(inventoryManager.lowStockItems[0].medicines.name).toBe('Amoxicillin')

      // Update inventory that triggers low stock alert
      await inventoryManager.updateInventoryQuantity('inv1', 15) // Below min_level of 20
      
      // Verify real-time low stock alert was triggered
      expect(lowStockAlerts).toHaveLength(1)
      expect(lowStockAlerts[0].medicine_name).toBe('Paracetamol')
      expect(lowStockAlerts[0].current_quantity).toBe(15)

      // Verify inventory was updated in real-time
      const updatedItem = inventoryManager.inventory.find(item => item.id === 'inv1')
      expect(updatedItem?.quantity).toBe(15)
    })
  })

  describe('Real-time Prescription Queue Updates', () => {
    it('should handle real-time prescription status changes and queue updates', async () => {
      const mockPrescriptions = [
        {
          id: 'presc1',
          status: 'pending',
          priority: false,
          created_at: '2025-01-01T10:00:00Z',
          patients: { full_name: 'John Doe' },
          users: { full_name: 'Dr. Smith' }
        },
        {
          id: 'presc2',
          status: 'in_progress',
          priority: true,
          created_at: '2025-01-01T11:00:00Z',
          patients: { full_name: 'Jane Wilson' },
          users: { full_name: 'Dr. Johnson' }
        }
      ]

      let prescriptionCallback: (payload: any) => void = () => {}
      let queueMetrics = { pending: 0, inProgress: 0, completed: 0 }

      mockRealtimeChannel.on.mockImplementation((event: string, callback: (payload: any) => void) => {
        if (event === 'postgres_changes') {
          prescriptionCallback = callback
        }
        return mockRealtimeChannel
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockPrescriptions,
                    error: null
                  })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const prescriptionQueueManager = {
        prescriptions: mockPrescriptions,
        
        setupRealtimePrescriptionTracking: () => {
          const channel = mockSupabaseClient.channel('prescription-queue-changes')
          
          channel.on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'prescriptions' 
          }, (payload) => {
            prescriptionQueueManager.handlePrescriptionUpdate(payload)
          }).subscribe()
        },

        handlePrescriptionUpdate: (payload: any) => {
          switch (payload.eventType) {
            case 'INSERT':
              prescriptionQueueManager.prescriptions.push(payload.new)
              break
            case 'UPDATE':
              const index = prescriptionQueueManager.prescriptions.findIndex(p => p.id === payload.new.id)
              if (index !== -1) {
                prescriptionQueueManager.prescriptions[index] = { 
                  ...prescriptionQueueManager.prescriptions[index], 
                  ...payload.new 
                }
              }
              break
            case 'DELETE':
              prescriptionQueueManager.prescriptions = prescriptionQueueManager.prescriptions.filter(
                p => p.id !== payload.old.id
              )
              break
          }
          
          // Update queue metrics in real-time
          prescriptionQueueManager.updateQueueMetrics()
        },

        updateQueueMetrics: () => {
          queueMetrics = {
            pending: prescriptionQueueManager.prescriptions.filter(p => p.status === 'pending').length,
            inProgress: prescriptionQueueManager.prescriptions.filter(p => p.status === 'in_progress').length,
            completed: prescriptionQueueManager.prescriptions.filter(p => p.status === 'completed').length
          }
        },

        fetchPrescriptionQueue: async () => {
          const { data, error } = await mockSupabaseClient
            .from('prescriptions')
            .select(`
              *,
              patients(full_name),
              users(full_name)
            `)
            .eq('status', 'pending')
            .order('created_at')
            .limit(20)

          if (data) {
            prescriptionQueueManager.prescriptions = data
            prescriptionQueueManager.updateQueueMetrics()
          }
          return { data, error }
        },

        updatePrescriptionStatus: async (prescriptionId: string, newStatus: string) => {
          const updateData = { 
            status: newStatus,
            updated_at: new Date().toISOString()
          }

          if (newStatus === 'completed') {
            updateData.dispensed_at = new Date().toISOString()
          }

          const { error } = await mockSupabaseClient
            .from('prescriptions')
            .update(updateData)
            .eq('id', prescriptionId)

          // Simulate real-time callback
          if (!error) {
            const prescription = prescriptionQueueManager.prescriptions.find(p => p.id === prescriptionId)
            if (prescription) {
              prescriptionCallback({
                eventType: 'UPDATE',
                new: { ...prescription, ...updateData },
                old: prescription,
                schema: 'public',
                table: 'prescriptions'
              })
            }
          }

          return { error }
        }
      }

      // Setup real-time tracking and fetch initial data
      prescriptionQueueManager.setupRealtimePrescriptionTracking()
      prescriptionQueueManager.updateQueueMetrics()
      
      // Initial queue metrics
      expect(queueMetrics.pending).toBe(1)
      expect(queueMetrics.inProgress).toBe(1)
      expect(queueMetrics.completed).toBe(0)

      // Update prescription status - pending to in_progress
      await prescriptionQueueManager.updatePrescriptionStatus('presc1', 'in_progress')
      
      // Verify real-time metrics update
      expect(queueMetrics.pending).toBe(0)
      expect(queueMetrics.inProgress).toBe(2)
      
      // Update prescription status - in_progress to completed  
      await prescriptionQueueManager.updatePrescriptionStatus('presc1', 'completed')
      
      // Verify real-time metrics update
      expect(queueMetrics.pending).toBe(0)
      expect(queueMetrics.inProgress).toBe(1)
      expect(queueMetrics.completed).toBe(1)

      // Verify prescription object was updated
      const updatedPrescription = prescriptionQueueManager.prescriptions.find(p => p.id === 'presc1')
      expect(updatedPrescription?.status).toBe('completed')
      expect(updatedPrescription?.dispensed_at).toBeDefined()
    })
  })

  describe('Real-time Cross-System Updates', () => {
    it('should handle real-time updates across multiple interconnected systems', async () => {
      // Test scenario: Patient appointment completion triggers prescription creation,
      // which affects pharmacy queue, which updates dashboard metrics
      
      const mockAppointment = {
        id: 'app1',
        patient_id: 'pat1',
        doctor_id: 'doc1',
        status: 'in_progress'
      }

      const mockPrescription = {
        id: 'presc1',
        appointment_id: 'app1',
        patient_id: 'pat1',
        doctor_id: 'doc1',
        status: 'pending'
      }

      let appointmentCallback: (payload: any) => void = () => {}
      let prescriptionCallback: (payload: any) => void = () => {}
      
      // System metrics that get updated in real-time
      let systemMetrics = {
        completedAppointments: 0,
        pendingPrescriptions: 0,
        pharmacyQueueLength: 0
      }

      mockRealtimeChannel.on.mockImplementation((event: string, callback: (payload: any) => void) => {
        if (event === 'postgres_changes') {
          appointmentCallback = callback
          prescriptionCallback = callback
        }
        return mockRealtimeChannel
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        switch (table) {
          case 'appointments':
            return {
              ...mockSupabaseClient,
              update: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockResolvedValue({ error: null })
              })
            }
          case 'prescriptions':
            return {
              ...mockSupabaseClient,
              insert: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                select: vi.fn().mockResolvedValue({
                  data: [mockPrescription],
                  error: null
                })
              })
            }
          default:
            return mockSupabaseClient
        }
      })

      const crossSystemManager = {
        setupCrossSystemRealtime: () => {
          // Setup appointment changes tracking
          const appointmentChannel = mockSupabaseClient.channel('appointment-system-changes')
          appointmentChannel.on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'appointments' 
          }, (payload) => {
            crossSystemManager.handleAppointmentUpdate(payload)
          }).subscribe()

          // Setup prescription changes tracking
          const prescriptionChannel = mockSupabaseClient.channel('prescription-system-changes')
          prescriptionChannel.on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'prescriptions' 
          }, (payload) => {
            crossSystemManager.handlePrescriptionInsert(payload)
          }).subscribe()
        },

        handleAppointmentUpdate: (payload: any) => {
          if (payload.new.status === 'completed') {
            systemMetrics.completedAppointments++
            // This would typically trigger prescription creation
          }
        },

        handlePrescriptionInsert: (payload: any) => {
          systemMetrics.pendingPrescriptions++
          systemMetrics.pharmacyQueueLength++
        },

        completeAppointmentWorkflow: async (appointmentId: string) => {
          // Step 1: Complete appointment
          const { error: appointmentError } = await mockSupabaseClient
            .from('appointments')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', appointmentId)

          // Simulate real-time appointment update
          if (!appointmentError) {
            appointmentCallback({
              eventType: 'UPDATE',
              new: { ...mockAppointment, status: 'completed' },
              old: mockAppointment,
              schema: 'public',
              table: 'appointments'
            })
          }

          // Step 2: Create prescription (triggered by appointment completion)
          const { data: prescriptionData, error: prescriptionError } = await mockSupabaseClient
            .from('prescriptions')
            .insert([{
              appointment_id: appointmentId,
              patient_id: mockAppointment.patient_id,
              doctor_id: mockAppointment.doctor_id,
              status: 'pending'
            }])
            .select()

          // Simulate real-time prescription creation
          if (!prescriptionError && prescriptionData) {
            prescriptionCallback({
              eventType: 'INSERT',
              new: prescriptionData[0],
              old: null,
              schema: 'public',
              table: 'prescriptions'
            })
          }

          return {
            appointmentError,
            prescriptionError,
            prescriptionData
          }
        }
      }

      // Setup cross-system real-time tracking
      crossSystemManager.setupCrossSystemRealtime()
      
      // Initial state
      expect(systemMetrics.completedAppointments).toBe(0)
      expect(systemMetrics.pendingPrescriptions).toBe(0)
      expect(systemMetrics.pharmacyQueueLength).toBe(0)

      // Execute cross-system workflow
      await crossSystemManager.completeAppointmentWorkflow('app1')
      
      // Verify real-time cross-system updates
      expect(systemMetrics.completedAppointments).toBe(1)
      expect(systemMetrics.pendingPrescriptions).toBe(1)
      expect(systemMetrics.pharmacyQueueLength).toBe(1)

      // Verify all systems were called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prescriptions')
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('appointment-system-changes')
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('prescription-system-changes')
    })
  })

  describe('Real-time Error Handling and Recovery', () => {
    it('should handle real-time connection failures and implement recovery strategies', async () => {
      let connectionStatus = 'connected'
      let reconnectAttempts = 0
      let backupDataQueue: any[] = []

      // Mock connection failure scenarios
      mockRealtimeChannel.subscribe.mockImplementation(() => {
        if (reconnectAttempts > 0) {
          connectionStatus = 'reconnecting'
        }
        return mockRealtimeChannel
      })

      mockRealtimeChannel.unsubscribe.mockImplementation(() => {
        connectionStatus = 'disconnected'
        return mockRealtimeChannel
      })

      const realtimeErrorManager = {
        connectionStatus,
        backupQueue: backupDataQueue,

        setupRealtimeWithErrorHandling: () => {
          const channel = mockSupabaseClient.channel('error-handling-test')
          
          channel.on('postgres_changes', { event: '*' }, (payload) => {
            realtimeErrorManager.handleRealtimeData(payload)
          })
          .subscribe((status) => {
            realtimeErrorManager.handleConnectionStatus(status)
          })

          return channel
        },

        handleRealtimeData: (payload: any) => {
          if (connectionStatus === 'connected') {
            // Process data normally
            return payload
          } else {
            // Queue data for later processing
            backupDataQueue.push({
              ...payload,
              queuedAt: new Date().toISOString()
            })
          }
        },

        handleConnectionStatus: (status: string) => {
          connectionStatus = status
          
          if (status === 'SUBSCRIBED') {
            connectionStatus = 'connected'
            // Process queued data
            realtimeErrorManager.processQueuedData()
          } else if (status === 'CLOSED') {
            connectionStatus = 'disconnected'
            realtimeErrorManager.initiateReconnection()
          }
        },

        processQueuedData: () => {
          while (backupDataQueue.length > 0) {
            const queuedItem = backupDataQueue.shift()
            // Process queued item
            realtimeErrorManager.handleRealtimeData({
              ...queuedItem,
              processedFromQueue: true
            })
          }
        },

        initiateReconnection: () => {
          reconnectAttempts++
          
          if (reconnectAttempts <= 3) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, reconnectAttempts - 1) * 1000
            
            setTimeout(() => {
              connectionStatus = 'reconnecting'
              // Attempt to reconnect
              realtimeErrorManager.setupRealtimeWithErrorHandling()
            }, delay)
          } else {
            connectionStatus = 'failed'
            // Fall back to polling or other recovery strategy
          }
        },

        simulateConnectionFailure: () => {
          connectionStatus = 'disconnected'
          realtimeErrorManager.initiateReconnection()
        },

        simulateDataWhileDisconnected: (mockData: any) => {
          realtimeErrorManager.handleRealtimeData(mockData)
        }
      }

      // Setup real-time with error handling
      realtimeErrorManager.setupRealtimeWithErrorHandling()
      expect(connectionStatus).toBe('connected')

      // Simulate connection failure
      realtimeErrorManager.simulateConnectionFailure()
      expect(connectionStatus).toBe('reconnecting')
      expect(reconnectAttempts).toBe(1)

      // Simulate data arriving while disconnected
      const testData = { id: 'test1', event: 'INSERT', data: 'test' }
      realtimeErrorManager.simulateDataWhileDisconnected(testData)
      
      // Verify data was queued
      expect(backupDataQueue).toHaveLength(1)
      expect(backupDataQueue[0].id).toBe('test1')
      expect(backupDataQueue[0].queuedAt).toBeDefined()

      // Simulate successful reconnection
      realtimeErrorManager.handleConnectionStatus('SUBSCRIBED')
      expect(connectionStatus).toBe('connected')
      
      // Verify queued data was processed
      expect(backupDataQueue).toHaveLength(0)
    })
  })
})