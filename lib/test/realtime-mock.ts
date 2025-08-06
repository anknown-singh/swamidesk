import { vi } from 'vitest'

// Mock real-time event types
export type MockRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type MockEventPayload = {
  eventType: MockRealtimeEvent
  new?: Record<string, unknown>
  old?: Record<string, unknown>
  table: string
  schema: string
}

// Mock channel class for real-time testing
export class MockRealtimeChannel {
  private callbacks: { [event: string]: ((payload: MockEventPayload) => void)[] } = {}
  private subscriptions: Set<string> = new Set()
  public topic: string
  
  constructor(topic: string) {
    this.topic = topic
  }
  
  on(event: string, filter: Record<string, unknown>, callback: (payload: MockEventPayload) => void) {
    const eventKey = `${event}:${JSON.stringify(filter)}`
    
    if (!this.callbacks[eventKey]) {
      this.callbacks[eventKey] = []
    }
    
    this.callbacks[eventKey].push(callback)
    return this
  }
  
  subscribe(callback?: (status: string, error: unknown) => void) {
    this.subscriptions.add(this.topic)
    
    if (callback) {
      // Simulate successful subscription
      Promise.resolve().then(() => callback('SUBSCRIBED', null))
    }
    
    return {
      unsubscribe: vi.fn(() => {
        this.subscriptions.delete(this.topic)
        this.callbacks = {}
        return Promise.resolve({ error: null })
      })
    }
  }
  
  unsubscribe() {
    this.subscriptions.delete(this.topic)
    this.callbacks = {}
    return Promise.resolve({ error: null })
  }
  
  // Test helper to trigger events
  _trigger(eventType: MockRealtimeEvent, filter: Record<string, unknown>, payload: MockEventPayload) {
    const eventKey = `postgres_changes:${JSON.stringify(filter)}`
    
    if (this.callbacks[eventKey]) {
      this.callbacks[eventKey].forEach(callback => {
        callback(payload)
      })
    }
  }
  
  // Test helper to check if subscribed
  _isSubscribed(): boolean {
    return this.subscriptions.has(this.topic)
  }
  
  // Test helper to get all callbacks
  _getCallbacks() {
    return this.callbacks
  }
}

// Global channel registry for testing
class MockChannelRegistry {
  private channels: Map<string, MockRealtimeChannel> = new Map()
  
  createChannel(topic: string): MockRealtimeChannel {
    if (this.channels.has(topic)) {
      return this.channels.get(topic)!
    }
    
    const channel = new MockRealtimeChannel(topic)
    this.channels.set(topic, channel)
    return channel
  }
  
  getChannel(topic: string): MockRealtimeChannel | undefined {
    return this.channels.get(topic)
  }
  
  removeChannel(channel: MockRealtimeChannel) {
    this.channels.delete(channel.topic)
  }
  
  getAllChannels(): MockRealtimeChannel[] {
    return Array.from(this.channels.values())
  }
  
  clear() {
    this.channels.clear()
  }
  
  // Test helper to trigger events on all matching channels
  triggerEvent(
    table: string, 
    eventType: MockRealtimeEvent, 
    payload: Omit<MockEventPayload, 'eventType' | 'table' | 'schema'>
  ) {
    const fullPayload: MockEventPayload = {
      eventType,
      table,
      schema: 'public',
      ...payload
    }
    
    this.channels.forEach(channel => {
      // Check if channel is listening for this table
      const filter = { event: '*', schema: 'public', table }
      channel._trigger(eventType, filter, fullPayload)
    })
  }
}

export const mockChannelRegistry = new MockChannelRegistry()

// Mock Supabase client with real-time capabilities
export const createMockRealtimeClient = () => {
  return {
    channel: vi.fn((topic: string) => {
      return mockChannelRegistry.createChannel(topic)
    }),
    
    removeChannel: vi.fn((channel: MockRealtimeChannel) => {
      mockChannelRegistry.removeChannel(channel)
      return Promise.resolve({ error: null })
    }),
    
    getChannels: vi.fn(() => {
      return mockChannelRegistry.getAllChannels()
    }),
    
    removeAllChannels: vi.fn(() => {
      mockChannelRegistry.clear()
      return Promise.resolve({ error: null })
    }),
  }
}

// Real-time testing utilities
export const realtimeTestUtils = {
  // Simulate database insert
  simulateInsert: (table: string, newRecord: Record<string, unknown>) => {
    mockChannelRegistry.triggerEvent(table, 'INSERT', {
      new: newRecord
    })
  },
  
  // Simulate database update
  simulateUpdate: (
    table: string, 
    oldRecord: Record<string, unknown>, 
    newRecord: Record<string, unknown>
  ) => {
    mockChannelRegistry.triggerEvent(table, 'UPDATE', {
      old: oldRecord,
      new: newRecord
    })
  },
  
  // Simulate database delete
  simulateDelete: (table: string, deletedRecord: Record<string, unknown>) => {
    mockChannelRegistry.triggerEvent(table, 'DELETE', {
      old: deletedRecord
    })
  },
  
  // Wait for subscription to be ready
  waitForSubscription: (channel: MockRealtimeChannel, timeout = 1000) => {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now()
      
      const check = () => {
        const elapsed = Date.now() - start
        if (channel._isSubscribed()) {
          resolve()
          return
        } 
        if (elapsed >= timeout) {
          reject(new Error('Subscription timeout'))
          return
        }
        // Use shorter interval and ensure we don't continue checking after timeout
        if (elapsed < timeout) {
          setTimeout(check, Math.min(10, timeout - elapsed))
        }
      }
      
      check()
    })
  },
  
  // Clean up all channels
  cleanup: () => {
    mockChannelRegistry.clear()
  },
  
  // Get active subscriptions count
  getActiveSubscriptions: () => {
    return mockChannelRegistry.getAllChannels().filter(c => c._isSubscribed()).length
  }
}

// Real-time hook testing helpers
export const createRealtimeHookMock = (tableName: string) => {
  const channel = mockChannelRegistry.createChannel(`test-${tableName}`)
  
  return {
    channel,
    
    // Mock the common real-time pattern
    mockRealtimeHook: () => {
      const mockFetch = vi.fn()
      
      // Simulate useEffect pattern
      const subscription = channel
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: tableName 
        }, () => {
          mockFetch()
        })
        .subscribe()
      
      return {
        mockFetch,
        subscription,
        triggerUpdate: (data: Record<string, unknown>) => {
          realtimeTestUtils.simulateUpdate(tableName, {}, data)
        },
        triggerInsert: (data: Record<string, unknown>) => {
          realtimeTestUtils.simulateInsert(tableName, data)
        },
        triggerDelete: (data: Record<string, unknown>) => {
          realtimeTestUtils.simulateDelete(tableName, data)
        }
      }
    }
  }
}

// Setup and teardown helpers for tests
export const setupRealtimeTest = () => {
  // Clear any existing channels
  realtimeTestUtils.cleanup()
  
  // Mock timers for subscription delays
  vi.useFakeTimers()
}

export const teardownRealtimeTest = () => {
  // Clean up channels
  realtimeTestUtils.cleanup()
  
  // Restore timers
  vi.useRealTimers()
}