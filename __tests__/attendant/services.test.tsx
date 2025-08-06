/**
 * Test cases for Attendant Services Page Dynamic Data
 * Tests service types fetching and service request management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
}

describe.skip('Attendant Services Page Dynamic Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
    
    // Mock user in localStorage
    ;(localStorage.getItem as any).mockReturnValue(JSON.stringify({
      id: 'attendant123',
      role: 'attendant',
      name: 'Test Attendant'
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic Service Types Fetching', () => {
    it('should fetch and display dynamic service types from service_types table', async () => {
      const mockServiceTypesData = [
        { name: 'Blood Collection' },
        { name: 'ECG Test' },
        { name: 'X-Ray Imaging' },
        { name: 'Physical Therapy' }
      ]

      const mockServiceRequestsData = []
      const mockPatientsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_types') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockServiceTypesData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockPatientsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading service queue...')).not.toBeInTheDocument()
      })

      // Click add service request to show form
      const addButton = screen.getByText('Add Service Request')
      fireEvent.click(addButton)

      // Check if dynamic service types are displayed in dropdown
      await waitFor(() => {
        expect(screen.getByText('Blood Collection')).toBeInTheDocument()
        expect(screen.getByText('ECG Test')).toBeInTheDocument()
        expect(screen.getByText('X-Ray Imaging')).toBeInTheDocument()
        expect(screen.getByText('Physical Therapy')).toBeInTheDocument()
      })

      // Verify Supabase was called correctly for service types
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('service_types')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name')
    })

    it('should fall back to default service types when service_types table does not exist', async () => {
      const mockServiceRequestsData = []
      const mockPatientsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_types') {
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
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockPatientsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading service queue...')).not.toBeInTheDocument()
      })

      // Click add service request to show form
      const addButton = screen.getByText('Add Service Request')
      fireEvent.click(addButton)

      // Check if default fallback service types are displayed
      await waitFor(() => {
        expect(screen.getByText('Laboratory Test')).toBeInTheDocument()
        expect(screen.getByText('Diagnostic Imaging')).toBeInTheDocument()
        expect(screen.getByText('Physical Therapy')).toBeInTheDocument()
        expect(screen.getByText('Vaccination')).toBeInTheDocument()
        expect(screen.getByText('ECG')).toBeInTheDocument()
        expect(screen.getByText('X-Ray')).toBeInTheDocument()
        expect(screen.getByText('Ultrasound')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Service types table not found, using default values')
      consoleSpy.mockRestore()
    })

    it('should handle network errors with fallback service types', async () => {
      const mockServiceRequestsData = []
      const mockPatientsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_types') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockRejectedValue(new Error('Network error'))
          }
        }
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockPatientsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading service queue...')).not.toBeInTheDocument()
      })

      // Should still show fallback service types
      const addButton = screen.getByText('Add Service Request')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Laboratory Test')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching service types:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Dynamic Service Requests Management', () => {
    it('should fetch and display dynamic service requests from service_requests table', async () => {
      const mockServiceRequestsData = [
        {
          id: 'req1',
          patient_id: 'pat1',
          service_type: 'Laboratory Test',
          service_name: 'Blood Test - CBC',
          description: 'Complete Blood Count test',
          priority: 'medium',
          status: 'pending',
          estimated_duration: 30,
          scheduled_time: '2025-01-01T10:00:00Z',
          completed_at: null,
          notes: 'Fasting required',
          created_at: '2025-01-01T09:00:00Z',
          patients: {
            id: 'pat1',
            patient_number: 'P001',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+91-9876543210'
          }
        },
        {
          id: 'req2',
          patient_id: 'pat2',
          service_type: 'Diagnostic Imaging',
          service_name: 'Chest X-Ray',
          description: 'Routine chest imaging',
          priority: 'high',
          status: 'in_progress',
          estimated_duration: 15,
          scheduled_time: '2025-01-01T11:00:00Z',
          completed_at: null,
          notes: '',
          created_at: '2025-01-01T10:30:00Z',
          patients: {
            id: 'pat2',
            patient_number: 'P002',
            first_name: 'Jane',
            last_name: 'Smith',
            phone: '+91-9876543211'
          }
        }
      ]

      const mockServiceTypesData = [{ name: 'Laboratory Test' }]
      const mockPatientsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'service_types') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockServiceTypesData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockPatientsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading service queue...')).not.toBeInTheDocument()
      })

      // Check if service requests are displayed
      await waitFor(() => {
        expect(screen.getByText('Blood Test - CBC')).toBeInTheDocument()
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument()
        expect(screen.getByText('John Doe • P001')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith • P002')).toBeInTheDocument()
        expect(screen.getByText('MEDIUM')).toBeInTheDocument()
        expect(screen.getByText('HIGH')).toBeInTheDocument()
        expect(screen.getByText('PENDING')).toBeInTheDocument()
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
      })

      // Verify statistics are calculated correctly
      expect(screen.getByText('1')).toBeInTheDocument() // Pending count
      expect(screen.getByText('1')).toBeInTheDocument() // In progress count
      expect(screen.getByText('2')).toBeInTheDocument() // Total requests

      // Verify Supabase query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('service_requests')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          )
        `)
    })

    it('should fetch dynamic patients for service request form', async () => {
      const mockPatientsData = [
        {
          id: 'pat1',
          patient_number: 'P001',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+91-9876543210'
        },
        {
          id: 'pat2',
          patient_number: 'P002',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+91-9876543211'
        }
      ]

      const mockServiceTypesData = [{ name: 'Laboratory Test' }]
      const mockServiceRequestsData = []

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockPatientsData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'service_types') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockServiceTypesData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading service queue...')).not.toBeInTheDocument()
      })

      // Click add service request to show form
      const addButton = screen.getByText('Add Service Request')
      fireEvent.click(addButton)

      // Check if patients are loaded in dropdown
      await waitFor(() => {
        expect(screen.getByText('John Doe - P001 (+91-9876543210)')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith - P002 (+91-9876543211)')).toBeInTheDocument()
      })

      // Verify patients query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, patient_number, first_name, last_name, phone')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should handle service request status updates', async () => {
      const mockServiceRequestsData = [
        {
          id: 'req1',
          patient_id: 'pat1',
          service_type: 'Laboratory Test',
          service_name: 'Blood Test',
          status: 'pending',
          priority: 'medium',
          estimated_duration: 30,
          scheduled_time: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T09:00:00Z',
          completed_at: null,
          description: '',
          notes: '',
          patients: {
            id: 'pat1',
            patient_number: 'P001',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+91-9876543210'
          }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
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

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.getByText('Blood Test')).toBeInTheDocument()
      })

      // Find and click Start button
      const startButton = screen.getByText('Start')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'in_progress' })
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'req1')
      })
    })
  })

  describe('Search and Filter Functionality', () => {
    it('should filter service requests by search term', async () => {
      const mockServiceRequestsData = [
        {
          id: 'req1',
          service_name: 'Blood Test',
          service_type: 'Laboratory Test',
          status: 'pending',
          priority: 'medium',
          estimated_duration: 30,
          scheduled_time: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T09:00:00Z',
          completed_at: null,
          description: '',
          notes: '',
          patients: {
            patient_number: 'P001',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+91-9876543210'
          }
        },
        {
          id: 'req2',
          service_name: 'X-Ray',
          service_type: 'Imaging',
          status: 'completed',
          priority: 'low',
          estimated_duration: 15,
          scheduled_time: '2025-01-01T11:00:00Z',
          created_at: '2025-01-01T10:30:00Z',
          completed_at: '2025-01-01T11:15:00Z',
          description: '',
          notes: '',
          patients: {
            patient_number: 'P002',
            first_name: 'Jane',
            last_name: 'Smith',
            phone: '+91-9876543211'
          }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.getByText('Blood Test')).toBeInTheDocument()
        expect(screen.getByText('X-Ray')).toBeInTheDocument()
      })

      // Search for "Blood"
      const searchInput = screen.getByPlaceholderText('Search by patient name, ID, or service type...')
      fireEvent.change(searchInput, { target: { value: 'Blood' } })

      await waitFor(() => {
        expect(screen.getByText('Blood Test')).toBeInTheDocument()
        expect(screen.queryByText('X-Ray')).not.toBeInTheDocument()
        expect(screen.getByText('1 requests found')).toBeInTheDocument()
      })
    })

    it('should filter service requests by status', async () => {
      const mockServiceRequestsData = [
        {
          id: 'req1',
          service_name: 'Blood Test',
          status: 'pending',
          priority: 'medium',
          estimated_duration: 30,
          scheduled_time: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T09:00:00Z',
          completed_at: null,
          description: '',
          notes: '',
          service_type: 'Lab',
          patients: {
            patient_number: 'P001',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+91-9876543210'
          }
        },
        {
          id: 'req2',
          service_name: 'X-Ray',
          status: 'completed',
          priority: 'low',
          estimated_duration: 15,
          scheduled_time: '2025-01-01T11:00:00Z',
          created_at: '2025-01-01T10:30:00Z',
          completed_at: '2025-01-01T11:15:00Z',
          description: '',
          notes: '',
          service_type: 'Imaging',
          patients: {
            patient_number: 'P002',
            first_name: 'Jane',
            last_name: 'Smith',
            phone: '+91-9876543211'
          }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: mockServiceRequestsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.getByText('Blood Test')).toBeInTheDocument()
        expect(screen.getByText('X-Ray')).toBeInTheDocument()
      })

      // Filter by pending status
      const statusFilter = screen.getByRole('combobox')
      fireEvent.change(statusFilter, { target: { value: 'pending' } })

      await waitFor(() => {
        expect(screen.getByText('Blood Test')).toBeInTheDocument()
        expect(screen.queryByText('X-Ray')).not.toBeInTheDocument()
        expect(screen.getByText('1 requests found')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors when fetching service requests', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load service requests')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching service requests:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should show empty state when no service requests exist', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_requests') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              order: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ServiceQueuePage />)

      await waitFor(() => {
        expect(screen.getByText('No service requests in queue yet')).toBeInTheDocument()
      })
    })
  })
})