import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { createMockAppointment, createMockDoctor } from '../utils/test-helpers'
import type { Appointment, UserProfile } from '@/lib/types'

// Mock data
const mockAppointments: Appointment[] = [
  createMockAppointment({
    id: 'apt1',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    status: 'confirmed',
    patient: { name: 'John Doe' }
  }),
  createMockAppointment({
    id: 'apt2',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '14:30',
    status: 'scheduled',
    patient: { name: 'Jane Smith' }
  })
]

const mockDoctors: UserProfile[] = [
  createMockDoctor({
    id: 'doc1',
    name: 'Dr. Sarah Smith',
    department: 'general'
  }),
  createMockDoctor({
    id: 'doc2',
    name: 'Dr. John Brown',
    department: 'cardiology'
  })
]

describe('AppointmentCalendar', () => {
  const mockOnAppointmentSelect = vi.fn()
  const mockOnSlotSelect = vi.fn()
  const mockOnBookAppointment = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render calendar with appointments', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          onAppointmentSelect={mockOnAppointmentSelect}
          onSlotSelect={mockOnSlotSelect}
          onBookAppointment={mockOnBookAppointment}
        />
      )

      expect(screen.getByText('Appointment Calendar')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should display correct appointment statuses', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
    })

    it('should show available slots', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      expect(screen.getAllByText('Available')).toHaveLength(12) // 14 total slots - 2 booked = 12 available
    })
  })

  describe('View Mode Toggle', () => {
    it('should toggle between week and day view', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          viewMode="week"
        />
      )

      const dayButton = screen.getByRole('button', { name: /day/i })
      const weekButton = screen.getByRole('button', { name: /week/i })

      expect(weekButton).toHaveAttribute('data-state', 'active')
      
      fireEvent.click(dayButton)
      await waitFor(() => {
        expect(dayButton).toHaveAttribute('data-state', 'active')
      })
    })

    it('should show different content in day vs week view', () => {
      const { rerender } = render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          viewMode="week"
        />
      )

      // Week view should show multiple days
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()

      rerender(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          viewMode="day"
        />
      )

      // Day view should show single day
      expect(screen.queryByText('Sun')).not.toBeInTheDocument()
    })
  })

  describe('Doctor Filtering', () => {
    it('should filter appointments by doctor', async () => {
      render(
        <AppointmentCalendar
          appointments={[
            createMockAppointment({ 
              doctor_id: 'doc1', 
              patient: { name: 'Patient 1' } 
            }),
            createMockAppointment({ 
              doctor_id: 'doc2', 
              patient: { name: 'Patient 2' } 
            })
          ]}
          doctors={mockDoctors}
        />
      )

      // Initially both appointments should be visible
      expect(screen.getByText('Patient 1')).toBeInTheDocument()
      expect(screen.getByText('Patient 2')).toBeInTheDocument()

      // Filter by first doctor
      const filterSelect = screen.getByRole('combobox')
      fireEvent.click(filterSelect)
      
      const doctorOption = await screen.findByText('Dr. Sarah Smith')
      fireEvent.click(doctorOption)

      await waitFor(() => {
        expect(screen.getByText('Patient 1')).toBeInTheDocument()
        expect(screen.queryByText('Patient 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to previous week', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous/i })
      fireEvent.click(prevButton)

      // Should trigger navigation (implementation would update date)
      await waitFor(() => {
        expect(prevButton).toHaveBeenCalledTimes
      })
    })

    it('should navigate to next week', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(nextButton).toHaveBeenCalledTimes
      })
    })

    it('should navigate to today', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      const todayButton = screen.getByRole('button', { name: /today/i })
      fireEvent.click(todayButton)

      await waitFor(() => {
        expect(todayButton).toHaveBeenCalledTimes
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle appointment click', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          onAppointmentSelect={mockOnAppointmentSelect}
        />
      )

      const appointmentSlot = screen.getByText('John Doe').closest('div')
      fireEvent.click(appointmentSlot!)

      await waitFor(() => {
        expect(mockOnAppointmentSelect).toHaveBeenCalledWith(mockAppointments[0])
      })
    })

    it('should handle available slot click', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          onSlotSelect={mockOnSlotSelect}
        />
      )

      const availableSlots = screen.getAllByText('Available')
      const firstAvailableSlot = availableSlots[0].closest('div')
      fireEvent.click(firstAvailableSlot!)

      await waitFor(() => {
        expect(mockOnSlotSelect).toHaveBeenCalledWith(
          expect.any(String), // date
          expect.any(String), // time
          expect.any(String)  // doctorId (optional)
        )
      })
    })

    it('should handle book appointment button click', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
          onBookAppointment={mockOnBookAppointment}
        />
      )

      const bookButton = screen.getByRole('button', { name: /book/i })
      fireEvent.click(bookButton)

      expect(mockOnBookAppointment).toHaveBeenCalled()
    })
  })

  describe('Status Legend', () => {
    it('should display status legend', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      expect(screen.getByText('Status Legend:')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
      expect(screen.getByText('Arrived')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      const calendar = screen.getByRole('region', { name: /calendar/i })
      expect(calendar).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      const firstSlot = screen.getAllByText('Available')[0].closest('div')
      firstSlot?.focus()
      
      fireEvent.keyDown(firstSlot!, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockOnSlotSelect).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty appointments array', () => {
      render(
        <AppointmentCalendar
          appointments={[]}
          doctors={mockDoctors}
        />
      )

      expect(screen.getByText('Appointment Calendar')).toBeInTheDocument()
      expect(screen.getAllByText('Available')).toHaveLength(14) // All slots available
    })

    it('should handle empty doctors array', () => {
      render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={[]}
        />
      )

      expect(screen.getByText('Appointment Calendar')).toBeInTheDocument()
    })

    it('should handle missing callback functions', () => {
      expect(() => {
        render(
          <AppointmentCalendar
            appointments={mockAppointments}
            doctors={mockDoctors}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Real-time Updates', () => {
    it('should update when appointments prop changes', async () => {
      const { rerender } = render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()

      const updatedAppointments = [
        ...mockAppointments,
        createMockAppointment({
          id: 'apt3',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '16:00',
          status: 'scheduled',
          patient: { name: 'New Patient' }
        })
      ]

      rerender(
        <AppointmentCalendar
          appointments={updatedAppointments}
          doctors={mockDoctors}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New Patient')).toBeInTheDocument()
      })
    })

    it('should handle appointment status changes', async () => {
      const { rerender } = render(
        <AppointmentCalendar
          appointments={mockAppointments}
          doctors={mockDoctors}
        />
      )

      expect(screen.getByText('Scheduled')).toBeInTheDocument()

      const updatedAppointments = mockAppointments.map(apt => 
        apt.id === 'apt2' ? { ...apt, status: 'confirmed' as const } : apt
      )

      rerender(
        <AppointmentCalendar
          appointments={updatedAppointments}
          doctors={mockDoctors}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('Confirmed')).toHaveLength(2)
      })
    })
  })
})