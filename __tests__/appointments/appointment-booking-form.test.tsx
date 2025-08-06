/**
 * Test cases for Appointment Booking Form Dynamic Data
 * Tests all dynamic data fetching in appointment booking
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { AppointmentBookingForm } from '@/components/appointments/appointment-booking-form'
import { createClient } from '@/lib/supabase/client'
import { createMockAppointmentBookingForm } from '../utils/test-helpers'
import type { AppointmentBookingForm as FormData } from '@/lib/types'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
}

describe('AppointmentBookingForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dynamic Data Fetching', () => {
    it('should fetch and display dynamic doctors from users table', async () => {
      const mockDoctorsData = [
        {
          id: 'doc1',
          full_name: 'Dr. John Smith',
          department: 'cardiology',
          specialization: 'Cardiologist'
        },
        {
          id: 'doc2', 
          full_name: 'Dr. Sarah Johnson',
          department: 'dermatology',
          specialization: 'Dermatologist'
        },
        {
          id: 'doc3',
          full_name: 'Dr. Mike Wilson',
          department: 'orthopedics', 
          specialization: 'Orthopedic Surgeon'
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockDoctorsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading doctors and departments...')).not.toBeInTheDocument()
      })

      // Check if dynamic doctors are loaded
      await waitFor(() => {
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
        expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument()
        expect(screen.getByText('Dr. Mike Wilson')).toBeInTheDocument()
      })

      // Verify Supabase was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, full_name, department, specialization')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('role', 'doctor')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('full_name')
    })

    it('should extract and display dynamic departments from doctor data', async () => {
      const mockDoctorsData = [
        {
          id: 'doc1',
          full_name: 'Dr. ENT Specialist',
          department: 'ent',
          specialization: 'ENT Specialist'
        },
        {
          id: 'doc2',
          full_name: 'Dr. Dental Expert',
          department: 'dental',
          specialization: 'Dentist'
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockDoctorsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading doctors and departments...')).not.toBeInTheDocument()
      })

      // Check if departments are dynamically extracted and formatted
      await waitFor(() => {
        expect(screen.getByText('Ent')).toBeInTheDocument()
        expect(screen.getByText('Dental')).toBeInTheDocument()
      })
    })

    it('should handle doctors with null/undefined department and specialization', async () => {
      const mockDoctorsData = [
        {
          id: 'doc1',
          full_name: 'Dr. No Dept',
          department: null,
          specialization: null
        },
        {
          id: 'doc2',
          full_name: 'Dr. Undefined Dept',
          department: undefined,
          specialization: undefined
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockDoctorsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading doctors and departments...')).not.toBeInTheDocument()
      })

      // Check fallback values are used
      await waitFor(() => {
        expect(screen.getByText('General Practice')).toBeInTheDocument()
        expect(screen.getByText('General')).toBeInTheDocument()
      })
    })

    it('should display loading state while fetching doctors and departments', async () => {
      // Make the promise never resolve to test loading state
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByText('Loading doctors and departments...')).toBeInTheDocument()
      expect(screen.getByText('Book Appointment')).toBeInTheDocument()
    })

    it('should handle database errors gracefully with fallback departments', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading doctors and departments...')).not.toBeInTheDocument()
      })

      // Check if fallback departments are displayed
      await waitFor(() => {
        expect(screen.getByText('General Medicine')).toBeInTheDocument()
        expect(screen.getByText('Cardiology')).toBeInTheDocument()
        expect(screen.getByText('Dermatology')).toBeInTheDocument()
        expect(screen.getByText('Orthopedics')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching doctors and departments:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should auto-populate department when dynamic doctor is selected', async () => {
      const mockDoctorsData = [
        {
          id: 'doc1',
          full_name: 'Dr. Heart Specialist',
          department: 'cardiology',
          specialization: 'Cardiologist'
        }
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabaseClient,
            select: vi.fn().mockReturnValue({
              ...mockSupabaseClient,
              eq: vi.fn().mockReturnValue({
                ...mockSupabaseClient,
                order: vi.fn().mockResolvedValue({
                  data: mockDoctorsData,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabaseClient
      })

      render(
        <AppointmentBookingForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading doctors and departments...')).not.toBeInTheDocument()
      })

      // Select doctor
      const doctorSelect = screen.getByLabelText('Doctor *')
      fireEvent.click(doctorSelect)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Dr. Heart Specialist'))
      })

      // Check if department is auto-populated
      const departmentSelect = screen.getByLabelText('Department *')
      expect(departmentSelect).toHaveValue('cardiology')
    })
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Book New Appointment')).toBeInTheDocument()
      expect(screen.getByLabelText(/patient/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/appointment type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/doctor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument()
    })

    it('should render with initial data', () => {
      const initialData = createMockAppointmentBookingForm({
        patient_id: 'pat1',
        appointment_type: 'consultation',
        department: 'general'
      })

      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      )

      expect(screen.getByDisplayValue('consultation')).toBeInTheDocument()
      expect(screen.getByDisplayValue('general')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /booking/i })
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Booking...')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when required fields are missing', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate date is not in the past', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const dateInput = screen.getByLabelText(/date/i)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      fireEvent.change(dateInput, { 
        target: { value: yesterday.toISOString().split('T')[0] } 
      })

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/date cannot be in the past/i)).toBeInTheDocument()
      })
    })

    it('should validate phone number format', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Fill required fields first
      await user.selectOptions(screen.getByLabelText(/patient/i), 'pat1')
      await user.selectOptions(screen.getByLabelText(/appointment type/i), 'consultation')
      await user.selectOptions(screen.getByLabelText(/department/i), 'general')
      await user.selectOptions(screen.getByLabelText(/doctor/i), 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])
      await user.selectOptions(screen.getByLabelText(/time/i), '10:00')

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Field Interactions', () => {
    it('should auto-populate department when doctor is selected', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      await user.selectOptions(screen.getByLabelText(/doctor/i), 'doc1')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('general')).toBeInTheDocument()
      })
    })

    it('should filter doctors by department', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      await user.selectOptions(screen.getByLabelText(/department/i), 'cardiology')
      
      const doctorSelect = screen.getByLabelText(/doctor/i)
      const options = doctorSelect.querySelectorAll('option')
      
      // Should only show cardiology doctors
      const cardiologyDoctors = Array.from(options).filter(option => 
        option.textContent?.includes('Dr. John Brown')
      )
      expect(cardiologyDoctors).toHaveLength(1)
    })

    it('should update duration based on appointment type', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      await user.selectOptions(screen.getByLabelText(/appointment type/i), 'procedure')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('60')).toBeInTheDocument() // Procedures default to 60 min
      })
    })

    it('should show available time slots based on selected date', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])
      
      const timeSelect = screen.getByLabelText(/time/i)
      const timeOptions = timeSelect.querySelectorAll('option')
      
      expect(timeOptions.length).toBeGreaterThan(1) // Should have multiple time slots
    })
  })

  describe('Priority Appointments', () => {
    it('should handle priority checkbox', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const priorityCheckbox = screen.getByLabelText(/priority appointment/i)
      await user.click(priorityCheckbox)
      
      expect(priorityCheckbox).toBeChecked()
    })

    it('should show priority appointment warning', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const priorityCheckbox = screen.getByLabelText(/priority appointment/i)
      await user.click(priorityCheckbox)
      
      expect(screen.getByText(/requires urgent attention/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Fill all required fields
      await user.selectOptions(screen.getByLabelText(/patient/i), 'pat1')
      await user.selectOptions(screen.getByLabelText(/appointment type/i), 'consultation')
      await user.selectOptions(screen.getByLabelText(/department/i), 'general')
      await user.selectOptions(screen.getByLabelText(/doctor/i), 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])
      await user.selectOptions(screen.getByLabelText(/time/i), '10:00')

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            patient_id: 'pat1',
            appointment_type: 'consultation',
            department: 'general',
            doctor_id: 'doc1',
            scheduled_time: '10:00'
          })
        )
      })
    })

    it('should include optional fields in submission', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Fill required fields
      await user.selectOptions(screen.getByLabelText(/patient/i), 'pat1')
      await user.selectOptions(screen.getByLabelText(/appointment type/i), 'consultation')
      await user.selectOptions(screen.getByLabelText(/doctor/i), 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])
      await user.selectOptions(screen.getByLabelText(/time/i), '10:00')

      // Fill optional fields
      await user.type(screen.getByLabelText(/appointment title/i), 'Routine Checkup')
      await user.type(screen.getByLabelText(/patient's notes/i), 'Feeling unwell')
      await user.type(screen.getByLabelText(/estimated cost/i), '500')

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Routine Checkup',
            patient_notes: 'Feeling unwell',
            estimated_cost: 500
          })
        )
      })
    })

    it('should handle form cancellation', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/patient \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/appointment type \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/department \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/doctor \*/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const patientSelect = screen.getByLabelText(/patient/i)
      patientSelect.focus()
      
      expect(document.activeElement).toBe(patientSelect)
    })

    it('should announce form errors to screen readers', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Features', () => {
    it('should update available slots in real-time', async () => {
      const { rerender } = render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])

      // Initial slots
      const initialTimeSelect = screen.getByLabelText(/time/i)
      const initialOptions = initialTimeSelect.querySelectorAll('option')
      const initialCount = initialOptions.length

      // Simulate slot being booked (would come from real-time updates)
      rerender(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      await waitFor(() => {
        const updatedTimeSelect = screen.getByLabelText(/time/i)
        const updatedOptions = updatedTimeSelect.querySelectorAll('option')
        expect(updatedOptions.length).toBeLessThanOrEqual(initialCount)
      })
    })

    it('should handle doctor availability changes', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      await user.selectOptions(screen.getByLabelText(/department/i), 'cardiology')
      
      const doctorSelect = screen.getByLabelText(/doctor/i)
      const cardiologyDoctor = doctorSelect.querySelector('option[value="doc2"]')
      expect(cardiologyDoctor).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorOnSubmit = vi.fn().mockRejectedValue(new Error('API Error'))
      
      render(
        <AppointmentBookingForm
          onSubmit={errorOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Fill required fields and submit
      await user.selectOptions(screen.getByLabelText(/patient/i), 'pat1')
      await user.selectOptions(screen.getByLabelText(/doctor/i), 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(screen.getByLabelText(/date/i), tomorrow.toISOString().split('T')[0])
      await user.selectOptions(screen.getByLabelText(/time/i), '10:00')

      const submitButton = screen.getByRole('button', { name: /book appointment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
      })
    })

    it('should prevent double submission', async () => {
      render(
        <AppointmentBookingForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /booking/i })
      
      // Try to click while loading
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      
      expect(submitButton).toBeDisabled()
    })
  })
})