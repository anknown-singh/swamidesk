/**
 * Simplified Test cases for Admin User Management Dynamic Data
 * Tests dynamic roles and departments fetching with proper mocking
 */

import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import UsersPage from '@/app/admin/users/page'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock useUser hook
vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      email: 'admin@test.com'
    },
    loading: false
  })
}))

describe('Admin User Management Dynamic Data Tests', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        not: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        })),
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => Promise.resolve({
        data: [],
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user', email: 'admin@test.com' } },
        error: null
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as vi.Mock).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic Data Integration', () => {
    it('should render user management page with dynamic data setup', async () => {
      render(<UsersPage />)
      
      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify basic elements are present
      expect(screen.getByText('Manage staff accounts and permissions')).toBeInTheDocument()
      expect(screen.getByText('Add User')).toBeInTheDocument()
      
      // Verify Supabase integration
      expect(createClient).toHaveBeenCalled()
    })

    it('should call user_roles table for dynamic roles', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { name: 'admin', label: 'Administrator', color: 'bg-purple-100' }
              ],
              error: null
            })
          })
        })
      })

      render(<UsersPage />)
      
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles')
      })
    })

    it('should handle loading state', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(
          new Promise(() => {}) // Never resolves
        )
      })

      render(<UsersPage />)
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Database error'))
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})