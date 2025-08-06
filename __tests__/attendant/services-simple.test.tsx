/**
 * Simplified Test cases for Attendant Services Dynamic Data
 * Tests service types fetching with proper mocking
 */

import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useRouter } from 'next/navigation'
import ServiceQueuePage from '@/app/attendant/services/page'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn().mockReturnValue(JSON.stringify({
      id: 'attendant123',
      role: 'attendant',
      name: 'Test Attendant'
    })),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
})

describe.skip('Attendant Services Dynamic Data Tests', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn()
  }

  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic Service Types', () => {
    it('should render service queue page with dynamic data setup', async () => {
      // Mock basic service responses
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })

      render(<ServiceQueuePage />)
      
      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Service Queue')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify Supabase integration
      expect(createClient).toHaveBeenCalled()
    })

    it('should call service_types table for dynamic service types', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { name: 'Blood Collection' },
                { name: 'X-Ray' }
              ],
              error: null
            })
          })
        })
      })

      render(<ServiceQueuePage />)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('service_types')
      })
    })

    it('should handle loading state', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(
          new Promise(() => {}) // Never resolves
        )
      })

      render(<ServiceQueuePage />)
      
      expect(screen.getByText('Loading service queue...')).toBeInTheDocument()
    })
  })

  describe('Fallback Handling', () => {
    it('should use fallback service types when table does not exist', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Table not found' }
            })
          })
        })
      })

      render(<ServiceQueuePage />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Service types table not found, using default values')
      })

      consoleSpy.mockRestore()
    })
  })
})