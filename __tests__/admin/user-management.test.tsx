/**
 * Test cases for Admin User Management Dynamic Data
 * Tests dynamic roles and departments fetching in user management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import UsersPage from '@/app/admin/users/page'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockSupabaseClient = {
  from: vi.fn()
}

describe('Admin User Management Dynamic Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic Roles Fetching', () => {
    it('should fetch and display dynamic roles from user_roles table', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
        { name: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' },
        { name: 'nurse', label: 'Nurse', color: 'bg-pink-100 text-pink-800' },
        { name: 'technician', label: 'Lab Technician', color: 'bg-teal-100 text-teal-800' }
      ]

      const mockUsersData = [
        {
          id: 'user1',
          email: 'admin@swamicare.com',
          full_name: 'Admin User',
          role: 'admin',
          is_active: true,
          department: 'Administration',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockDepartmentsData = [
        { department: 'Administration' },
        { department: 'Medical' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click add user to show form
      const addButton = screen.getByText('Add New User')
      fireEvent.click(addButton)

      // Check if dynamic roles are loaded
      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument()
        expect(screen.getByText('Doctor')).toBeInTheDocument()
        expect(screen.getByText('Nurse')).toBeInTheDocument()
        expect(screen.getByText('Lab Technician')).toBeInTheDocument()
      })

      // Verify Supabase was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('name, label, color')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name')
    })

    it('should fall back to default roles when user_roles table does not exist', async () => {
      const mockUsersData = []
      const mockDepartmentsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Table not found' }
                })
              })
            })
          }
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click add user to show form
      const addButton = screen.getByText('Add New User')
      fireEvent.click(addButton)

      // Check if default fallback roles are displayed
      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument()
        expect(screen.getByText('Doctor')).toBeInTheDocument()
        expect(screen.getByText('Receptionist')).toBeInTheDocument()
        expect(screen.getByText('Pharmacist')).toBeInTheDocument()
        expect(screen.getByText('Attendant')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('User roles table not found, using default values')
      consoleSpy.mockRestore()
    })
  })

  describe('Dynamic Departments Fetching', () => {
    it('should extract dynamic departments from existing users', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' }
      ]

      const mockUsersData = [
        {
          id: 'user1',
          email: 'user1@swamicare.com',
          full_name: 'User One',
          role: 'admin',
          is_active: true,
          department: 'Cardiology',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockDepartmentsData = [
        { department: 'Cardiology' },
        { department: 'Neurology' },
        { department: 'Orthopedics' },
        { department: 'Emergency' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click add user to show form
      const addButton = screen.getByText('Add New User')
      fireEvent.click(addButton)

      // Check if dynamic departments are available
      await waitFor(() => {
        expect(screen.getByText('Cardiology')).toBeInTheDocument()
        expect(screen.getByText('Neurology')).toBeInTheDocument()
        expect(screen.getByText('Orthopedics')).toBeInTheDocument()
        expect(screen.getByText('Emergency')).toBeInTheDocument()
      })

      // Verify departments query
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('department')
      expect(mockSupabaseClient.not).toHaveBeenCalledWith('department', 'is', null)
    })

    it('should fall back to default departments when no departments found', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' }
      ]

      const mockUsersData = []
      const mockDepartmentsData = [] // Empty departments

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click add user to show form
      const addButton = screen.getByText('Add New User')
      fireEvent.click(addButton)

      // Check if default fallback departments are displayed
      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument()
        expect(screen.getByText('Medical')).toBeInTheDocument()
        expect(screen.getByText('Pharmacy')).toBeInTheDocument()
        expect(screen.getByText('Reception')).toBeInTheDocument()
      })
    })
  })

  describe('Dynamic Users Management', () => {
    it('should fetch and display dynamic users list', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
        { name: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' }
      ]

      const mockUsersData = [
        {
          id: 'user1',
          email: 'admin@swamicare.com',
          full_name: 'John Admin',
          phone: '+91-9876543210',
          role: 'admin',
          is_active: true,
          department: 'Administration',
          employee_id: 'EMP001',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: '2025-01-02T10:00:00Z'
        },
        {
          id: 'user2',
          email: 'doctor@swamicare.com',
          full_name: 'Dr. Jane Smith',
          phone: '+91-9876543211',
          role: 'doctor',
          is_active: true,
          department: 'Cardiology',
          employee_id: 'DOC001',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: null
        }
      ]

      const mockDepartmentsData = [
        { department: 'Administration' },
        { department: 'Cardiology' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Check if users are displayed with dynamic data
      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('admin@swamicare.com')).toBeInTheDocument()
        expect(screen.getByText('doctor@swamicare.com')).toBeInTheDocument()
        expect(screen.getByText('Administration')).toBeInTheDocument()
        expect(screen.getByText('Cardiology')).toBeInTheDocument()
        expect(screen.getByText('EMP001')).toBeInTheDocument()
        expect(screen.getByText('DOC001')).toBeInTheDocument()
      })

      // Verify users query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('full_name')
    })

    it('should handle user filtering by role', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
        { name: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' }
      ]

      const mockUsersData = [
        {
          id: 'user1',
          email: 'admin@swamicare.com',
          full_name: 'John Admin',
          role: 'admin',
          is_active: true,
          department: 'Administration',
          phone: '+91-9876543210',
          employee_id: 'EMP001',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: '2025-01-02T10:00:00Z'
        },
        {
          id: 'user2',
          email: 'doctor@swamicare.com',
          full_name: 'Dr. Jane Smith',
          role: 'doctor',
          is_active: true,
          department: 'Cardiology',
          phone: '+91-9876543211',
          employee_id: 'DOC001',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: null
        }
      ]

      const mockDepartmentsData = [
        { department: 'Administration' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument()
      })

      // Filter by admin role
      const roleFilter = screen.getByDisplayValue('All Roles')
      fireEvent.change(roleFilter, { target: { value: 'admin' } })

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.queryByText('Dr. Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('should handle user search functionality', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' }
      ]

      const mockUsersData = [
        {
          id: 'user1',
          email: 'john@swamicare.com',
          full_name: 'John Admin',
          role: 'admin',
          is_active: true,
          department: 'Administration',
          phone: '+91-9876543210',
          employee_id: 'EMP001',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: '2025-01-02T10:00:00Z'
        },
        {
          id: 'user2',
          email: 'jane@swamicare.com',
          full_name: 'Jane Smith',
          role: 'admin',
          is_active: true,
          department: 'Administration',
          phone: '+91-9876543211',
          employee_id: 'EMP002',
          hire_date: '2025-01-01',
          created_at: '2025-01-01T00:00:00Z',
          last_login: null
        }
      ]

      const mockDepartmentsData = [
        { department: 'Administration' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: mockDepartmentsData,
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: mockUsersData,
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      // Search for "John"
      const searchInput = screen.getByPlaceholderText('Search by name, email, or employee ID...')
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors when fetching users', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should show loading state while fetching data', async () => {
      // Make promises never resolve to test loading state
      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
      }))

      render(<UsersPage />)

      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })

    it('should show empty state when no users exist', async () => {
      const mockRolesData = [
        { name: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'user_roles') {
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
        }
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockImplementation((fields) => {
              if (fields === 'department') {
                return {
                  ...mockSupabaseClient,
                  not: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                }
              }
              return {
                ...mockSupabaseClient,
                eq: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              }
            })
          }
        }
        return mockSupabaseClient
      })

      render(<UsersPage />)

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
      })
    })
  })
})