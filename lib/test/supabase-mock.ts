import { vi } from 'vitest'
import { TEST_UUIDS } from '@/lib/utils/uuid'

// Mock data for testing
export const mockPatients = [
  {
    id: '1',
    patient_number: 'P001',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+91-9876543210',
    email: 'john.doe@example.com',
    date_of_birth: '1990-01-01',
    gender: 'male',
    address: '123 Main St',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+91-9876543211',
    medical_history: 'No major illnesses',
    allergies: 'None',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    created_by: TEST_UUIDS.USER_1
  }
]

export const mockUsers = [
  {
    id: 'admin-id',
    email: 'admin@swamidesk.com',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    phone: '+91-9999999999',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'doctor-id',
    email: 'doctor@swamidesk.com',
    role: 'doctor',
    first_name: 'Dr. John',
    last_name: 'Smith',
    phone: '+91-8888888888',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'receptionist-id',
    email: 'receptionist@swamidesk.com',
    role: 'receptionist',
    first_name: 'Jane',
    last_name: 'Doe',
    phone: '+91-7777777777',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  }
]

export const mockQueueItems = [
  {
    id: '1',
    patient_id: '1',
    queue_number: 1,
    status: 'waiting' as const,
    priority: 'normal' as const,
    notes: 'Regular checkup',
    created_at: '2025-01-01T09:00:00.000Z',
    updated_at: '2025-01-01T09:00:00.000Z',
    patients: mockPatients[0]
  }
]

// Mock Supabase response structure
export const createMockSupabaseResponse = <T>(data: T, error: Error | null = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

// Mock Supabase channel for real-time testing
export const createMockChannel = () => {
  const callbacks: { [key: string]: ((payload?: unknown) => void)[] } = {}
  
  return {
    on: vi.fn((event: string, filter: Record<string, unknown>, callback: (payload?: unknown) => void) => {
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
    _trigger: (event: string, payload?: unknown) => {
      if (callbacks[event]) {
        callbacks[event].forEach(callback => callback(payload))
      }
    }
  }
}

// Mock Supabase client
export const createMockSupabaseClient = (customMocks: Record<string, unknown> = {}) => {
  const mockChannel = createMockChannel()
  
  const defaultMocks = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => createMockSupabaseResponse([])),
        neq: vi.fn(() => createMockSupabaseResponse([])),
        in: vi.fn(() => createMockSupabaseResponse([])),
        order: vi.fn(() => createMockSupabaseResponse([])),
        limit: vi.fn(() => createMockSupabaseResponse([])),
        single: vi.fn(() => createMockSupabaseResponse(null)),
        maybeSingle: vi.fn(() => createMockSupabaseResponse(null)),
      })),
      insert: vi.fn(() => createMockSupabaseResponse([])),
      update: vi.fn(() => ({
        eq: vi.fn(() => createMockSupabaseResponse([])),
        match: vi.fn(() => createMockSupabaseResponse([])),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => createMockSupabaseResponse([])),
        match: vi.fn(() => createMockSupabaseResponse([])),
      })),
      upsert: vi.fn(() => createMockSupabaseResponse([])),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    getChannels: vi.fn(() => []),
    ...customMocks
  }

  return defaultMocks as Record<string, unknown>
}

// Helper to mock successful authentication
export const mockAuthenticatedUser = (role: string = 'admin') => {
  const user = mockUsers.find(u => u.role === role) || mockUsers[0]
  
  return {
    data: {
      session: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.created_at,
        },
      },
    },
    error: null,
  }
}

// Mock environment variables for tests
export const setupTestEnv = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
}