/**
 * Test cases for Dashboard Metrics Dynamic Data Conversion
 * Tests conversion of static metrics to dynamic data in all role dashboards
 */

import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DoctorDashboard from '@/app/doctor/dashboard/page'
import ReceptionistDashboard from '@/app/receptionist/dashboard/page'
import AttendantDashboard from '@/app/attendant/dashboard/page'
import { createClient } from '@/lib/supabase/client'
import { createMockSupabaseClient, mockUsers } from '@/lib/test/supabase-mock'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock useUser hook
vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    loading: false
  })
}))

const mockSupabaseClient = createMockSupabaseClient()

describe.skip('Dashboard Metrics Dynamic Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as vi.Mock).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Doctor Dashboard Dynamic Metrics', () => {
    it('should fetch and display dynamic patient statistics', async () => {
      // Mock appointments count for today's patients
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 18,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('18')).toBeInTheDocument()
        expect(screen.getByText("Today's Patients")).toBeInTheDocument()
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'scheduled')
    })

    it('should fetch dynamic queue length from pending appointments', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 5,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('Queue Length')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'waiting')
    })

    it('should fetch dynamic prescription count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 8,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
        expect(screen.getByText('Prescriptions')).toBeInTheDocument()
      })
    })

    it('should fetch dynamic procedures count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 12,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('Procedures')).toBeInTheDocument()
      })
    })

    it('should fetch dynamic patient queue data', async () => {
      const mockQueueData = [
        {
          id: 'app1',
          token_number: 'ENT001',
          scheduled_time: '10:30',
          priority: false,
          patients: { full_name: 'Rajesh Kumar' }
        },
        {
          id: 'app2', 
          token_number: 'ENT002',
          scheduled_time: '10:45',
          priority: true,
          patients: { full_name: 'Priya Sharma' }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockQueueData,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument()
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(screen.getByText('ENT001 • 10:30')).toBeInTheDocument()
        expect(screen.getByText('Priority')).toBeInTheDocument()
      })
    })
  })

  describe('Receptionist Dashboard Dynamic Metrics', () => {
    it('should fetch dynamic today\'s patients count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'patients') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockResolvedValue({
                count: 45,
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument()
        expect(screen.getByText("Today's Patients")).toBeInTheDocument()
      })
    })

    it('should fetch dynamic queue length across departments', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 8,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
        expect(screen.getByText('Queue Length')).toBeInTheDocument()
      })
    })

    it('should fetch dynamic appointments count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockResolvedValue({
                count: 12,
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('Appointments')).toBeInTheDocument()
      })
    })

    it('should fetch dynamic revenue from billing table', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'billing') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockResolvedValue({
                data: [{ total_amount: 15240 }],
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('₹15,240')).toBeInTheDocument()
        expect(screen.getByText('Revenue')).toBeInTheDocument()
      })
    })

    it('should fetch dynamic department queue data', async () => {
      const mockDepartmentQueue = [
        { department: 'ENT', waiting_count: 3 },
        { department: 'Dental', waiting_count: 2 },
        { department: 'Cosmetic', waiting_count: 3 }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                count: vi.fn().mockResolvedValue({
                  data: mockDepartmentQueue,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('3 waiting')).toBeInTheDocument()
        expect(screen.getByText('2 waiting')).toBeInTheDocument()
        expect(screen.getByText('ENT')).toBeInTheDocument()
        expect(screen.getByText('Dental')).toBeInTheDocument()
      })
    })
  })

  describe('Attendant Dashboard Dynamic Metrics', () => {
    it('should fetch dynamic assigned services count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 8,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<AttendantDashboard />)

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
        expect(screen.getByText('Assigned Services')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'assigned')
    })

    it('should fetch dynamic in-progress services count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 2,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<AttendantDashboard />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('In Progress')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'in_progress')
    })

    it('should fetch dynamic completed services count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 5,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<AttendantDashboard />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('Completed')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'completed')
    })

    it('should fetch dynamic pending services count', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: 1,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<AttendantDashboard />)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should fetch dynamic service queue data', async () => {
      const mockServiceQueue = [
        {
          id: 'serv1',
          status: 'assigned',
          priority: false,
          patients: { full_name: 'Rajesh Kumar' },
          service_types: { name: 'Ear Cleaning' }
        },
        {
          id: 'serv2',
          status: 'in_progress', 
          priority: true,
          patients: { full_name: 'Priya Sharma' },
          service_types: { name: 'Nasal Endoscopy' }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'service_assignments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              in: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockServiceQueue,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<AttendantDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument()
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(screen.getByText('Ear Cleaning')).toBeInTheDocument()
        expect(screen.getByText('Nasal Endoscopy')).toBeInTheDocument()
        expect(screen.getByText('Priority')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States and Error Handling', () => {
    it('should show loading states for dashboard metrics', async () => {
      // Make promises never resolve to test loading state
      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockReturnValue({
          ...mockSupabaseClient,
          eq: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
        })
      }))

      render(<DoctorDashboard />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      }))

      render(<DoctorDashboard />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error))
      })

      // Should still render dashboard structure with fallback values
      expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should display fallback metrics when data fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockReturnValue({
          ...mockSupabaseClient,
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Query failed' },
            count: 0
          })
        })
      }))

      render(<ReceptionistDashboard />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument() // Fallback count
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should update metrics when data changes in real-time', async () => {
      let patientCount = 10
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'appointments') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                filter: vi.fn().mockResolvedValue({
                  count: patientCount,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const { rerender } = render(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })

      // Simulate real-time data change
      patientCount = 15
      rerender(<DoctorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })
  })
})