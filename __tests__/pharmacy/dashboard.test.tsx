/**
 * Test cases for Pharmacy Dashboard Dynamic Data
 * Tests all dynamic data fetching and real-time updates
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PharmacyDashboard from '@/app/pharmacy/dashboard/page'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  gt: vi.fn(),
  filter: vi.fn(),
  lt: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  in: vi.fn(),
}

describe.skip('Pharmacy Dashboard Dynamic Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dashboard Statistics', () => {
    it('should fetch and display dynamic prescription statistics', async () => {
      // Mock prescription count response  
      const mockSelectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 15,
            error: null
          })
        })
      }
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            select: vi.fn().mockReturnValue(mockSelectChain)
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading pharmacy data...')).not.toBeInTheDocument()
      })

      // Check if dynamic prescription count is displayed
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
        expect(screen.getByText('Pending dispensing')).toBeInTheDocument()
      })

      // Verify Supabase was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prescriptions')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should fetch and display dynamic inventory statistics', async () => {
      // Mock inventory count response
      const mockSelectChain = {
        gt: vi.fn().mockResolvedValue({
          count: 523,
          error: null
        })
      }
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
          return {
            select: vi.fn().mockReturnValue(mockSelectChain)
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('523')).toBeInTheDocument()
        expect(screen.getByText('Total medicines in stock')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('inventory')
      expect(mockSupabaseClient.gt).toHaveBeenCalledWith('quantity', 0)
    })

    it('should fetch and display dynamic low stock alerts', async () => {
      // Mock low stock count response
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
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

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('Items need reordering')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.filter).toHaveBeenCalledWith('quantity', 'lt', 'min_level')
    })

    it('should fetch and display expiring medicines count', async () => {
      // Mock expiring medicines count
      const mockExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              lt: vi.fn().mockResolvedValue({
                count: 7,
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument()
        expect(screen.getByText('Expiring in 30 days')).toBeInTheDocument()
      })

      expect(mockSupabaseClient.lt).toHaveBeenCalledWith('expiry_date', mockExpiryDate)
    })
  })

  describe('Prescription Queue Dynamic Data', () => {
    it('should fetch and display dynamic prescription queue', async () => {
      const mockPrescriptionData = [
        {
          id: 'presc1',
          priority: true,
          created_at: '2025-01-01T10:00:00Z',
          patients: { full_name: 'John Doe' },
          users: { full_name: 'Dr. Smith' },
          prescription_items: [{ id: '1' }, { id: '2' }, { id: '3' }]
        },
        {
          id: 'presc2', 
          priority: false,
          created_at: '2025-01-01T11:00:00Z',
          patients: { full_name: 'Jane Wilson' },
          users: { full_name: 'Dr. Johnson' },
          prescription_items: [{ id: '4' }, { id: '5' }]
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockPrescriptionData,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Wilson')).toBeInTheDocument()
        expect(screen.getByText('3 medicines • Dr. Smith')).toBeInTheDocument()
        expect(screen.getByText('2 medicines • Dr. Johnson')).toBeInTheDocument()
        expect(screen.getByText('Urgent')).toBeInTheDocument()
      })
    })

    it('should display empty state when no prescriptions pending', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('No pending prescriptions')).toBeInTheDocument()
      })
    })
  })

  describe('Low Stock Items Dynamic Data', () => {
    it('should fetch and display dynamic low stock items', async () => {
      const mockLowStockData = [
        {
          id: 'inv1',
          quantity: 5,
          min_level: 20,
          medicines: { name: 'Paracetamol 500mg' }
        },
        {
          id: 'inv2',
          quantity: 2,
          min_level: 15,
          medicines: { name: 'Amoxicillin 250mg' }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: mockLowStockData,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
        expect(screen.getByText('Amoxicillin 250mg')).toBeInTheDocument()
        expect(screen.getByText('Stock: 5 / Min: 20')).toBeInTheDocument()
        expect(screen.getByText('Stock: 2 / Min: 15')).toBeInTheDocument()
        expect(screen.getByText('Critical')).toBeInTheDocument()
      })
    })

    it('should display empty state when all medicines are adequately stocked', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'inventory') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              filter: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue({
                  ...mockSupabaseClient,
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('All medicines adequately stocked')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      }))

      render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching pharmacy data:', expect.any(Error))
      })

      // Should still render the dashboard structure
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle loading states properly', async () => {
      // Make the promise never resolve to test loading state
      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSupabaseClient,
        select: vi.fn().mockReturnValue({
          ...mockSupabaseClient,
          eq: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
        })
      }))

      render(<PharmacyDashboard />)

      expect(screen.getByText('Loading pharmacy data...')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should update statistics when data changes', async () => {
      // Initial data
      let prescriptionCount = 10
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'prescriptions') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockResolvedValue({
                count: prescriptionCount,
                error: null
              })
            })
          }
        }
        return mockSupabaseClient
      })

      const { rerender } = render(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })

      // Simulate data change
      prescriptionCount = 15
      rerender(<PharmacyDashboard />)

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })
  })
})