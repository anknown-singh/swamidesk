import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  mockChannelRegistry,
  realtimeTestUtils,
  setupRealtimeTest,
  teardownRealtimeTest,
  createRealtimeHookMock
} from '@/lib/test/realtime-mock'
import {
  dbSeeder,
  testDbUtils,
  type TestQueueEntry
} from '@/lib/test/db-seeding'
import { setupAuthenticatedTest } from '@/lib/test/auth-helpers'

describe('Queue Real-time Management Integration Tests', () => {
  beforeEach(() => {
    setupRealtimeTest()
    testDbUtils.setupFreshData()
  })

  afterEach(() => {
    teardownRealtimeTest()
  })

  describe('Real-time Queue Subscription', () => {
    test('establishes real-time connection to queue table', () => {
      const channel = mockChannelRegistry.createChannel('queue-updates')
      const callback = vi.fn()

      // Subscribe to queue changes
      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      
      channel.subscribe()
      
      expect(channel._isSubscribed()).toBe(true)
      expect(channel._getCallbacks()).toHaveProperty(
        'postgres_changes:{"event":"*","schema":"public","table":"queue"}'
      )
    })

    test('receives INSERT events when new patient added to queue', () => {
      const channel = mockChannelRegistry.createChannel('queue-updates')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      // Simulate new patient being added by receptionist
      const newQueueEntry: TestQueueEntry = {
        id: 'queue-realtime-001',
        patient_id: 'patient-004',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'urgent',
        notes: 'Walk-in patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', newQueueEntry)

      expect(callback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: newQueueEntry
      })
    })

    test('receives UPDATE events when queue status changes', () => {
      const channel = mockChannelRegistry.createChannel('queue-updates')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      // Get existing queue entry
      const originalEntry = dbSeeder.getQueue().find(q => q.status === 'waiting')!
      
      // Simulate doctor starting consultation
      const updatedEntry = {
        ...originalEntry,
        status: 'in_progress' as const,
        doctor_id: 'doctor-test-id',
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateUpdate('queue', originalEntry, updatedEntry)

      expect(callback).toHaveBeenCalledWith({
        eventType: 'UPDATE',
        table: 'queue',
        schema: 'public',
        old: originalEntry,
        new: updatedEntry
      })
    })

    test('receives DELETE events when patient removed from queue', () => {
      const channel = mockChannelRegistry.createChannel('queue-updates')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      // Get existing queue entry to remove
      const entryToRemove = dbSeeder.getQueue()[0]

      realtimeTestUtils.simulateDelete('queue', entryToRemove)

      expect(callback).toHaveBeenCalledWith({
        eventType: 'DELETE',
        table: 'queue',
        schema: 'public',
        old: entryToRemove
      })
    })
  })

  describe('Multi-user Real-time Scenarios', () => {
    test('receptionist and doctor receive same real-time updates', () => {
      // Setup channels for both user types
      const receptionistChannel = mockChannelRegistry.createChannel('receptionist-queue')
      const doctorChannel = mockChannelRegistry.createChannel('doctor-queue')
      
      const receptionistCallback = vi.fn()
      const doctorCallback = vi.fn()

      // Both subscribe to queue changes
      receptionistChannel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        receptionistCallback
      )
      doctorChannel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        doctorCallback
      )

      receptionistChannel.subscribe()
      doctorChannel.subscribe()

      // Simulate queue update
      const newEntry: TestQueueEntry = {
        id: 'queue-multi-user-001',
        patient_id: 'patient-003',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', newEntry)

      // Both users should receive the update
      expect(receptionistCallback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: newEntry
      })

      expect(doctorCallback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: newEntry
      })
    })

    test('handles concurrent updates from multiple users', () => {
      const channel = mockChannelRegistry.createChannel('concurrent-queue')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      const queueEntries = dbSeeder.getQueue()
      
      // Simulate concurrent updates
      const updates = queueEntries.slice(0, 3).map((entry, index) => ({
        old: entry,
        new: {
          ...entry,
          status: 'in_progress' as const,
          doctor_id: `doctor-${index + 1}`,
          updated_at: new Date(Date.now() + index).toISOString()
        }
      }))

      // Send all updates
      updates.forEach(({ old, new: updated }) => {
        realtimeTestUtils.simulateUpdate('queue', old, updated)
      })

      // Verify all updates were received
      expect(callback).toHaveBeenCalledTimes(3)
      
      updates.forEach(({ old, new: updated }, index) => {
        expect(callback).toHaveBeenNthCalledWith(index + 1, {
          eventType: 'UPDATE',
          table: 'queue',
          schema: 'public',
          old: old,
          new: updated
        })
      })
    })
  })

  describe('Queue Priority Real-time Updates', () => {
    test('handles emergency priority queue additions in real-time', () => {
      // Start with empty queue
      testDbUtils.createEmptyQueueScenario()
      
      const channel = mockChannelRegistry.createChannel('priority-queue')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      // Add normal priority patient
      const normalEntry: TestQueueEntry = {
        id: 'queue-normal-001',
        patient_id: 'patient-001',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', normalEntry)

      // Add emergency patient
      const emergencyEntry: TestQueueEntry = {
        id: 'queue-emergency-001',
        patient_id: 'patient-002',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'emergency',
        notes: 'Chest pain - immediate attention required',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', emergencyEntry)

      // Verify both updates received
      expect(callback).toHaveBeenCalledTimes(2)
      
      // Check emergency entry details
      expect(callback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: emergencyEntry
      })
    })
  })

  describe('Real-time Hook Integration', () => {
    test('queue hook triggers data refetch on real-time updates', () => {
      const { mockRealtimeHook } = createRealtimeHookMock('queue')
      const { mockFetch, triggerUpdate, triggerInsert, triggerDelete } = mockRealtimeHook()

      expect(mockFetch).not.toHaveBeenCalled()

      // Test insert trigger
      triggerInsert({
        id: 'queue-hook-001',
        patient_id: 'patient-001',
        status: 'waiting'
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Test update trigger
      triggerUpdate({
        id: 'queue-001',
        status: 'in_progress'
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Test delete trigger
      triggerDelete({
        id: 'queue-001'
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('High Volume Real-time Testing', () => {
    test('handles rapid succession of queue updates', () => {
      // Use busy queue scenario
      testDbUtils.createBusyQueueScenario()
      
      const channel = mockChannelRegistry.createChannel('high-volume-queue')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      channel.subscribe()

      const queueEntries = dbSeeder.getQueue()
      
      // Simulate rapid status changes (busy clinic scenario)
      queueEntries.forEach((entry, index) => {
        const updatedEntry = {
          ...entry,
          status: index % 2 === 0 ? 'in_progress' as const : 'completed' as const,
          updated_at: new Date(Date.now() + index * 100).toISOString()
        }
        
        realtimeTestUtils.simulateUpdate('queue', entry, updatedEntry)
      })

      // Verify all updates processed
      expect(callback).toHaveBeenCalledTimes(queueEntries.length)
    })

    test('maintains subscription stability under load', () => {
      const channel = mockChannelRegistry.createChannel('load-test-queue')
      
      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        vi.fn()
      )
      
      channel.subscribe()
      expect(channel._isSubscribed()).toBe(true)

      // Send many rapid updates
      for (let i = 0; i < 100; i++) {
        const testEntry: TestQueueEntry = {
          id: `queue-load-${i}`,
          patient_id: 'patient-001',
          receptionist_id: 'receptionist-test-id',
          status: 'waiting',
          priority: 'normal',
          created_at: new Date(Date.now() + i).toISOString(),
          updated_at: new Date(Date.now() + i).toISOString()
        }
        
        realtimeTestUtils.simulateInsert('queue', testEntry)
      }

      // Channel should remain subscribed
      expect(channel._isSubscribed()).toBe(true)
      expect(realtimeTestUtils.getActiveSubscriptions()).toBeGreaterThan(0)
    })
  })

  describe('Role-based Real-time Access Control', () => {
    test('all authorized roles can subscribe to queue updates', () => {
      const roles = ['admin', 'doctor', 'receptionist'] as const
      
      roles.forEach(role => {
        const { user } = setupAuthenticatedTest(role)
        
        const channel = mockChannelRegistry.createChannel(`${role}-queue-access`)
        const callback = vi.fn()

        channel.on('postgres_changes', 
          { event: '*', schema: 'public', table: 'queue' },
          callback
        )
        
        channel.subscribe()
        
        expect(channel._isSubscribed()).toBe(true)
        
        // Test that real-time updates work for this role
        const testEntry: TestQueueEntry = {
          id: `queue-${role}-test`,
          patient_id: 'patient-001',
          receptionist_id: user.id,
          status: 'waiting',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        realtimeTestUtils.simulateInsert('queue', testEntry)

        expect(callback).toHaveBeenCalledWith({
          eventType: 'INSERT',
          table: 'queue',
          schema: 'public',
          new: testEntry
        })
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    test('handles subscription reconnection gracefully', () => {
      const channel = mockChannelRegistry.createChannel('reconnection-test')
      const callback = vi.fn()

      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        callback
      )
      
      channel.subscribe()
      expect(channel._isSubscribed()).toBe(true)

      // Test that callbacks work before disconnection
      const beforeDisconnectEntry: TestQueueEntry = {
        id: 'queue-before-disconnect',
        patient_id: 'patient-001',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', beforeDisconnectEntry)
      expect(callback).toHaveBeenCalledTimes(1)

      // Simulate disconnection
      channel.unsubscribe()
      expect(channel._isSubscribed()).toBe(false)

      // Create a new callback for reconnection (simulating real reconnection behavior)
      const reconnectCallback = vi.fn()
      
      // Re-register callback and reconnect
      channel.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        reconnectCallback
      )
      
      channel.subscribe()
      expect(channel._isSubscribed()).toBe(true)

      // Verify updates work after reconnection with new callback
      const afterReconnectEntry: TestQueueEntry = {
        id: 'queue-after-reconnect',
        patient_id: 'patient-002',
        receptionist_id: 'receptionist-test-id',
        status: 'waiting',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      realtimeTestUtils.simulateInsert('queue', afterReconnectEntry)

      expect(reconnectCallback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: afterReconnectEntry
      })
    })

    test('handles cleanup of all subscriptions properly', () => {
      // Create multiple channels
      const channels = [
        mockChannelRegistry.createChannel('cleanup-test-1'),
        mockChannelRegistry.createChannel('cleanup-test-2'),
        mockChannelRegistry.createChannel('cleanup-test-3')
      ]

      channels.forEach(channel => {
        channel.on('postgres_changes', 
          { event: '*', schema: 'public', table: 'queue' },
          vi.fn()
        )
        channel.subscribe()
      })

      expect(realtimeTestUtils.getActiveSubscriptions()).toBe(3)

      // Cleanup all
      realtimeTestUtils.cleanup()

      expect(realtimeTestUtils.getActiveSubscriptions()).toBe(0)
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(0)
    })
  })
})