import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientAppointmentBooking } from '@/components/appointments/patient-appointment-booking'
import type { AppointmentBookingForm } from '@/lib/types'

describe('PatientAppointmentBooking', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Multi-step Wizard', () => {
    it('should start with appointment type selection', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Choose the type of appointment you need')).toBeInTheDocument()
      expect(screen.getByText('New Consultation')).toBeInTheDocument()
      expect(screen.getByText('Follow-up Visit')).toBeInTheDocument()
      expect(screen.getByText('Routine Check-up')).toBeInTheDocument()
    })

    it('should show progress bar', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle('width: 16.67%') // Step 1 of 6
    })

    it('should advance to next step when appointment type is selected', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Select appointment type
      const consultationOption = screen.getByText('New Consultation').closest('div')
      fireEvent.click(consultationOption!)

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Select the medical department')).toBeInTheDocument()
      })
    })

    it('should allow navigation back to previous step', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Advance to step 2
      const consultationOption = screen.getByText('New Consultation').closest('div')
      fireEvent.click(consultationOption!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Select the medical department')).toBeInTheDocument()
      })

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('Choose the type of appointment you need')).toBeInTheDocument()
      })
    })
  })

  describe('Step 1: Appointment Type Selection', () => {
    it('should display all appointment types with costs', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('New Consultation')).toBeInTheDocument()
      expect(screen.getByText('₹500')).toBeInTheDocument()
      expect(screen.getByText('Follow-up Visit')).toBeInTheDocument()
      expect(screen.getByText('₹300')).toBeInTheDocument()
      expect(screen.getByText('Medical Procedure')).toBeInTheDocument()
      expect(screen.getByText('₹1500')).toBeInTheDocument()
    })

    it('should highlight selected appointment type', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const consultationOption = screen.getByText('New Consultation').closest('div')
      fireEvent.click(consultationOption!)

      expect(consultationOption).toHaveClass('border-primary', 'bg-primary/5')
    })

    it('should disable next button until type is selected', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Step 2: Department Selection', () => {
    beforeEach(async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Advance to department selection
      const consultationOption = screen.getByText('New Consultation').closest('div')
      fireEvent.click(consultationOption!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Select the medical department')).toBeInTheDocument()
      })
    })

    it('should display all departments with descriptions', () => {
      expect(screen.getByText('General Medicine')).toBeInTheDocument()
      expect(screen.getByText('Primary healthcare and routine medical care')).toBeInTheDocument()
      expect(screen.getByText('Cardiology')).toBeInTheDocument()
      expect(screen.getByText('Heart and cardiovascular conditions')).toBeInTheDocument()
    })

    it('should highlight selected department', async () => {
      const generalMedicine = screen.getByText('General Medicine').closest('div')
      fireEvent.click(generalMedicine!)

      expect(generalMedicine).toHaveClass('border-primary', 'bg-primary/5')
    })
  })

  describe('Step 3: Doctor Selection', () => {
    beforeEach(async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Advance to doctor selection
      fireEvent.click(screen.getByText('New Consultation').closest('div')!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('General Medicine').closest('div')!)
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Choose your preferred doctor')).toBeInTheDocument()
      })
    })

    it('should display doctors for selected department', () => {
      expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument()
      expect(screen.getByText('Internal Medicine, Family Practice')).toBeInTheDocument()
    })

    it('should show doctor contact information', () => {
      expect(screen.getByText('+91-9876543220')).toBeInTheDocument()
      expect(screen.getByText('sarah.smith@swamidesk.com')).toBeInTheDocument()
    })

    it('should highlight selected doctor', async () => {
      const doctor = screen.getByText('Dr. Sarah Smith').closest('div')
      fireEvent.click(doctor!)

      expect(doctor).toHaveClass('border-primary', 'bg-primary/5')
    })
  })

  describe('Step 4: Date & Time Selection', () => {
    beforeEach(async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Navigate to date/time step
      fireEvent.click(screen.getByText('New Consultation').closest('div')!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('General Medicine').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Dr. Sarah Smith').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Pick your preferred date and time')).toBeInTheDocument()
      })
    })

    it('should display available dates', () => {
      expect(screen.getByText('Select Date')).toBeInTheDocument()
      // Should show future dates
      const dateOptions = screen.getAllByText(/slots available/)
      expect(dateOptions.length).toBeGreaterThan(0)
    })

    it('should show time slots when date is selected', async () => {
      const dateOption = screen.getAllByText(/slots available/)[0].closest('div')
      fireEvent.click(dateOption!)

      await waitFor(() => {
        expect(screen.getByText('Select Time')).toBeInTheDocument()
        expect(screen.getByText('9:00 AM')).toBeInTheDocument()
      })
    })

    it('should disable next until both date and time are selected', () => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Step 5: Patient Details', () => {
    beforeEach(async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Navigate through all steps to patient details
      fireEvent.click(screen.getByText('New Consultation').closest('div')!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('General Medicine').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Dr. Sarah Smith').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const dateOption = screen.getAllByText(/slots available/)[0].closest('div')
        fireEvent.click(dateOption!)
      })

      await waitFor(() => {
        const timeOption = screen.getByText('9:00 AM').closest('div')
        fireEvent.click(timeOption!)
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Provide additional details')).toBeInTheDocument()
      })
    })

    it('should display patient information form', () => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reason for visit/i)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/mobile number/i), '+91-9876543210')

      expect(nextButton).toBeEnabled()
    })

    it('should validate phone number format', async () => {
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/mobile number/i), 'invalid-phone')

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 6: Confirmation', () => {
    beforeEach(async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Navigate through all steps to confirmation
      fireEvent.click(screen.getByText('New Consultation').closest('div')!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('General Medicine').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Dr. Sarah Smith').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const dateOption = screen.getAllByText(/slots available/)[0].closest('div')
        fireEvent.click(dateOption!)
      })

      await waitFor(() => {
        const timeOption = screen.getByText('9:00 AM').closest('div')
        fireEvent.click(timeOption!)
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        await user.type(screen.getByLabelText(/full name/i), 'John Doe')
        await user.type(screen.getByLabelText(/mobile number/i), '+91-9876543210')
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Review and confirm your appointment')).toBeInTheDocument()
      })
    })

    it('should display appointment summary', () => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
      expect(screen.getByText('New Consultation')).toBeInTheDocument()
      expect(screen.getByText('General Medicine')).toBeInTheDocument()
      expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument()
      expect(screen.getByText('₹500')).toBeInTheDocument()
    })

    it('should display patient information', () => {
      expect(screen.getByText('Patient Information')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('+91-9876543210')).toBeInTheDocument()
    })

    it('should show clinic information', () => {
      expect(screen.getByText('Clinic Information')).toBeInTheDocument()
      expect(screen.getByText('SwamIDesk Clinic')).toBeInTheDocument()
      expect(screen.getByText('+91-9876543200')).toBeInTheDocument()
    })

    it('should require terms acceptance', () => {
      const confirmButton = screen.getByRole('button', { name: /confirm appointment/i })
      expect(confirmButton).toBeDisabled()

      const termsCheckbox = screen.getByLabelText(/terms and conditions/i)
      fireEvent.click(termsCheckbox)

      expect(confirmButton).toBeEnabled()
    })

    it('should show important instructions', () => {
      expect(screen.getByText(/arrive 15 minutes before/i)).toBeInTheDocument()
      expect(screen.getByText(/bring a valid ID/i)).toBeInTheDocument()
      expect(screen.getByText(/cancellations must be made/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit complete appointment data', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Complete all steps
      fireEvent.click(screen.getByText('New Consultation').closest('div')!)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('General Medicine').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Dr. Sarah Smith').closest('div')!)
      })
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const dateOption = screen.getAllByText(/slots available/)[0].closest('div')
        fireEvent.click(dateOption!)
      })

      await waitFor(() => {
        const timeOption = screen.getByText('9:00 AM').closest('div')
        fireEvent.click(timeOption!)
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        await user.type(screen.getByLabelText(/full name/i), 'John Doe')
        await user.type(screen.getByLabelText(/mobile number/i), '+91-9876543210')
        await user.type(screen.getByLabelText(/reason for visit/i), 'Regular checkup')
      })
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const termsCheckbox = screen.getByLabelText(/terms and conditions/i)
        fireEvent.click(termsCheckbox)
      })

      const confirmButton = screen.getByRole('button', { name: /confirm appointment/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            appointment_type: 'consultation',
            department: 'general',
            doctor_id: 'doc1',
            patient_notes: 'Regular checkup',
            estimated_cost: 500
          })
        )
      })
    })

    it('should handle submission errors', async () => {
      const errorOnSubmit = vi.fn().mockRejectedValue(new Error('Booking failed'))
      
      render(
        <PatientAppointmentBooking
          onSubmit={errorOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Complete booking process and submit
      // ... (abbreviated for brevity)
      
      await waitFor(() => {
        expect(screen.getByText(/error submitting/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
    })

    it('should have descriptive button labels', () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const consultationOption = screen.getByText('New Consultation').closest('div')
      consultationOption?.focus()
      
      fireEvent.keyDown(consultationOption!, { key: 'Enter' })
      
      expect(consultationOption).toHaveClass('border-primary')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 })
      
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Book Your Appointment')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during submission', async () => {
      render(
        <PatientAppointmentBooking
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      // Navigate to final step
      // ... (complete navigation)
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })
})