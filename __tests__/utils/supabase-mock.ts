/**
 * Mock Supabase client for testing
 */

import { vi } from 'vitest'

export const mockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const createMockSupabaseClient = () => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        neq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        in: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        order: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        limit: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        single: vi.fn(() => Promise.resolve(mockSupabaseResponse(null))),
        maybeSingle: vi.fn(() => Promise.resolve(mockSupabaseResponse(null)))
      })),
      insert: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        match: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSupabaseResponse([]))),
        match: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
      })),
      upsert: vi.fn(() => Promise.resolve(mockSupabaseResponse([])))
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
      }))
    }
  }
}

export const mockSupabase = createMockSupabaseClient()
export const createSupabaseMock = createMockSupabaseClient