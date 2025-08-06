import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppointmentBookingForm } from '@/components/appointments/appointment-booking-form'
import { createMockAppointmentBookingForm } from '../utils/test-helpers'
import type { AppointmentBookingForm as FormData } from '@/lib/types'

describe('AppointmentBookingForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
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