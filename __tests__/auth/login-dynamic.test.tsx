/**
 * Test cases for Authentication System Dynamic Data
 * Tests login authentication using dynamic user data
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/login/page'
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
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
})

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn()
}

const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn()
}

describe.skip('Authentication System Dynamic Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        pathname: '/login'
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic User Authentication', () => {
    it('should authenticate user with correct credentials from users table', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'doctor@swamicare.com',
        role: 'doctor',
        full_name: 'Dr. John Smith',
        password_hash: 'hashed_password',
        is_active: true
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
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
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      // Fill in login form
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'doctor@swamicare.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, email, role, full_name, password_hash, is_active')
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('email', 'doctor@swamicare.com')
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      })

      // Check if user session was stored
      expect(localStorage.setItem).toHaveBeenCalledWith('swamicare_user', JSON.stringify({
        id: 'user123',
        email: 'doctor@swamicare.com',
        role: 'doctor',
        name: 'Dr. John Smith'
      }))

      // Check if redirected to correct dashboard
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/doctor/dashboard')
      })
    })

    it('should handle authentication with different user roles', async () => {
      const testCases = [
        {
          role: 'admin',
          expectedPath: '/admin/dashboard',
          userData: {
            id: 'admin123',
            email: 'admin@swamicare.com', 
            role: 'admin',
            full_name: 'System Administrator',
            password_hash: 'hashed',
            is_active: true
          }
        },
        {
          role: 'receptionist',
          expectedPath: '/receptionist/dashboard',
          userData: {
            id: 'rec123',
            email: 'receptionist@swamicare.com',
            role: 'receptionist', 
            full_name: 'Jane Receptionist',
            password_hash: 'hashed',
            is_active: true
          }
        },
        {
          role: 'pharmacist',
          expectedPath: '/pharmacy/dashboard',
          userData: {
            id: 'pharm123',
            email: 'pharmacist@swamicare.com',
            role: 'pharmacist',
            full_name: 'Bob Pharmacist', 
            password_hash: 'hashed',
            is_active: true
          }
        },
        {
          role: 'attendant', 
          expectedPath: '/attendant/dashboard',
          userData: {
            id: 'att123',
            email: 'attendant@swamicare.com',
            role: 'attendant',
            full_name: 'Alice Attendant',
            password_hash: 'hashed', 
            is_active: true
          }
        }
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()

        mockSupabaseClient.from.mockImplementation((table) => {
          if (table === 'users') {
            return {
              ...mockSupabaseClient,
              select: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  single: vi.fn().mockResolvedValue({
                    data: testCase.userData,
                    error: null
                  })
                })
              })
            }
          }
          return mockSupabaseClient
        })

        const { rerender } = render(<LoginPage />)

        const emailInput = screen.getByLabelText('Email')
        const passwordInput = screen.getByLabelText('Password')
        const loginButton = screen.getByRole('button', { name: /sign in/i })

        fireEvent.change(emailInput, { target: { value: testCase.userData.email } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(loginButton)

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith(testCase.expectedPath)
        })

        // Clean up for next iteration
        rerender(<div />)
      }
    })

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'No user found' }
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'invalid@email.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      expect(localStorage.setItem).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should handle inactive users', async () => {
      const inactiveUserData = {
        id: 'user123',
        email: 'inactive@swamicare.com',
        role: 'doctor',
        full_name: 'Inactive Doctor',
        password_hash: 'hashed_password',
        is_active: false
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                single: vi.fn().mockResolvedValue({
                  data: null, // No active user found
                  error: { message: 'No active user found' }
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'inactive@swamicare.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })

    it('should handle wrong password', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'doctor@swamicare.com',
        role: 'doctor',
        full_name: 'Dr. John Smith',
        password_hash: 'hashed_password',
        is_active: true
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
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
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'doctor@swamicare.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      expect(localStorage.setItem).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      }))

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@email.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('should show loading state during authentication', async () => {
      // Make authentication take time
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                single: vi.fn().mockReturnValue(new Promise(resolve => 
                  setTimeout(() => resolve({ data: null, error: null }), 1000)
                ))
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@email.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(loginButton).toBeDisabled()
    })
  })

  describe('User Session Management', () => {
    it('should store user session data correctly', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'admin@swamicare.com',
        role: 'admin',
        full_name: 'System Administrator',
        password_hash: 'hashed_password',
        is_active: true
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
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
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'admin@swamicare.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('swamicare_user', JSON.stringify({
          id: 'user123',
          email: 'admin@swamicare.com',
          role: 'admin',
          name: 'System Administrator'
        }))
      })
    })

    it('should handle users with no full_name gracefully', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'test@swamicare.com',
        role: 'doctor',
        full_name: null, // No full name
        password_hash: 'hashed_password',
        is_active: true
      }

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
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
        }
        return mockSupabaseClient
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@swamicare.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('swamicare_user', JSON.stringify({
          id: 'user123',
          email: 'test@swamicare.com',
          role: 'doctor',
          name: 'Unknown User'
        }))
      })
    })
  })
})