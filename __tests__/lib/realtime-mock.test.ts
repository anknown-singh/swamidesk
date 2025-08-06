import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MockRealtimeChannel,
  mockChannelRegistry,
  realtimeTestUtils,
  createRealtimeHookMock,
  setupRealtimeTest,
  teardownRealtimeTest
} from '@/lib/test/realtime-mock'

describe('Real-time Mocking Infrastructure', () => {
  beforeEach(() => {
    setupRealtimeTest()
  })

  afterEach(() => {
    teardownRealtimeTest()
  })

  describe('MockRealtimeChannel', () => {
    test('creates channel with correct topic', () => {
      const channel = new MockRealtimeChannel('test-topic')
      expect(channel.topic).toBe('test-topic')
    })

    test('registers event callbacks correctly', () => {
      const channel = new MockRealtimeChannel('test-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', table: 'patients' }, callback)
      
      expect(channel._getCallbacks()).toHaveProperty('postgres_changes:{"event":"*","table":"patients"}')
    })

    test('subscribes and unsubscribes correctly', async () => {
      const channel = new MockRealtimeChannel('test-topic')
      
      expect(channel._isSubscribed()).toBe(false)
      
      const subscription = channel.subscribe()
      expect(channel._isSubscribed()).toBe(true)
      
      await subscription.unsubscribe()
      expect(channel._isSubscribed()).toBe(false)
    })

    test('triggers callbacks when events occur', () => {
      const channel = new MockRealtimeChannel('test-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', table: 'patients' }, callback)
      channel.subscribe()
      
      const payload = {
        eventType: 'INSERT' as const,
        table: 'patients',
        schema: 'public',
        new: { id: '1', name: 'John Doe' }
      }
      
      channel._trigger('INSERT', { event: '*', table: 'patients' }, payload)
      
      expect(callback).toHaveBeenCalledWith(payload)
    })

    test('handles subscription callback', (done) => {
      const channel = new MockRealtimeChannel('test-topic')
      
      channel.subscribe((status, error) => {
        expect(status).toBe('SUBSCRIBED')
        expect(error).toBeNull()
        done()
      })
    })
  })

  describe('mockChannelRegistry', () => {
    test('creates and manages channels', () => {
      const channel1 = mockChannelRegistry.createChannel('topic1')
      const channel2 = mockChannelRegistry.createChannel('topic2')
      
      expect(channel1.topic).toBe('topic1')
      expect(channel2.topic).toBe('topic2')
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(2)
    })

    test('returns existing channel for same topic', () => {
      const channel1 = mockChannelRegistry.createChannel('topic1')
      const channel2 = mockChannelRegistry.createChannel('topic1')
      
      expect(channel1).toBe(channel2)
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(1)
    })

    test('removes channels correctly', () => {
      const channel = mockChannelRegistry.createChannel('topic1')
      
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(1)
      
      mockChannelRegistry.removeChannel(channel)
      
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(0)
    })

    test('triggers events on matching channels', () => {
      const channel = mockChannelRegistry.createChannel('queue-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, callback)
      channel.subscribe()
      
      mockChannelRegistry.triggerEvent('queue', 'INSERT', {
        new: { id: '1', patient_id: '123', status: 'waiting' }
      })
      
      expect(callback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'queue',
        schema: 'public',
        new: { id: '1', patient_id: '123', status: 'waiting' }
      })
    })
  })

  describe('realtimeTestUtils', () => {
    test('simulates database insert', () => {
      const channel = mockChannelRegistry.createChannel('test-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback)
      channel.subscribe()
      
      const newPatient = { id: '1', name: 'John Doe', status: 'active' }
      realtimeTestUtils.simulateInsert('patients', newPatient)
      
      expect(callback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        table: 'patients',
        schema: 'public',
        new: newPatient
      })
    })

    test('simulates database update', () => {
      const channel = mockChannelRegistry.createChannel('test-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback)
      channel.subscribe()
      
      const oldRecord = { id: '1', name: 'John Doe', status: 'active' }
      const newRecord = { id: '1', name: 'John Doe', status: 'inactive' }
      
      realtimeTestUtils.simulateUpdate('patients', oldRecord, newRecord)
      
      expect(callback).toHaveBeenCalledWith({
        eventType: 'UPDATE',
        table: 'patients',
        schema: 'public',
        old: oldRecord,
        new: newRecord
      })
    })

    test('simulates database delete', () => {
      const channel = mockChannelRegistry.createChannel('test-topic')
      const callback = vi.fn()
      
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback)
      channel.subscribe()
      
      const deletedRecord = { id: '1', name: 'John Doe' }
      
      realtimeTestUtils.simulateDelete('patients', deletedRecord)
      
      expect(callback).toHaveBeenCalledWith({
        eventType: 'DELETE',
        table: 'patients',
        schema: 'public',
        old: deletedRecord
      })
    })

    test('waits for subscription to be ready', async () => {
      const channel = mockChannelRegistry.createChannel('test-topic')
      
      // Start subscription immediately
      channel.subscribe()
      
      // Wait for subscription
      await realtimeTestUtils.waitForSubscription(channel, 100)
      
      expect(channel._isSubscribed()).toBe(true)
    })

    test('timeout when waiting for subscription', async () => {
      const channel = mockChannelRegistry.createChannel('test-topic')
      
      // Don't start subscription - should timeout quickly
      const timeoutPromise = realtimeTestUtils.waitForSubscription(channel, 50)
      
      await expect(timeoutPromise).rejects.toThrow('Subscription timeout')
    })

    test('counts active subscriptions', () => {
      const channel1 = mockChannelRegistry.createChannel('topic1')
      const channel2 = mockChannelRegistry.createChannel('topic2')
      
      expect(realtimeTestUtils.getActiveSubscriptions()).toBe(0)
      
      channel1.subscribe()
      expect(realtimeTestUtils.getActiveSubscriptions()).toBe(1)
      
      channel2.subscribe()
      expect(realtimeTestUtils.getActiveSubscriptions()).toBe(2)
    })

    test('cleans up all channels', () => {
      mockChannelRegistry.createChannel('topic1')
      mockChannelRegistry.createChannel('topic2')
      
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(2)
      
      realtimeTestUtils.cleanup()
      
      expect(mockChannelRegistry.getAllChannels()).toHaveLength(0)
    })
  })

  describe('createRealtimeHookMock', () => {
    test('creates mock for real-time hook pattern', () => {
      const { mockRealtimeHook } = createRealtimeHookMock('patients')
      
      const { mockFetch, subscription, triggerUpdate } = mockRealtimeHook()
      
      expect(mockFetch).toBeTypeOf('function')
      expect(subscription).toHaveProperty('unsubscribe')
      expect(triggerUpdate).toBeTypeOf('function')
    })

    test('triggers fetch when real-time event occurs', () => {
      const { mockRealtimeHook } = createRealtimeHookMock('patients')
      
      const { mockFetch, triggerUpdate } = mockRealtimeHook()
      
      expect(mockFetch).not.toHaveBeenCalled()
      
      triggerUpdate({ id: '1', name: 'Updated Patient' })
      
      expect(mockFetch).toHaveBeenCalled()
    })

    test('handles different event types', () => {
      const { mockRealtimeHook } = createRealtimeHookMock('queue')
      
      const { mockFetch, triggerInsert, triggerUpdate, triggerDelete } = mockRealtimeHook()
      
      triggerInsert({ id: '1', status: 'waiting' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      triggerUpdate({ id: '1', status: 'in_progress' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      triggerDelete({ id: '1' })
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})