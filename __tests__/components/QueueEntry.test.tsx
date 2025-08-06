import { render, screen } from '@testing-library/react'
import { expect, test, describe, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { dbSeeder, type TestQueueEntry, type TestPatient } from '@/lib/test/db-seeding'

// Mock QueueEntry component
interface QueueEntryProps {
  queueEntry: TestQueueEntry
  patient?: TestPatient
  onStartConsultation?: (entryId: string) => void
  onCompleteConsultation?: (entryId: string) => void
  onCancelEntry?: (entryId: string) => void
  userRole?: 'admin' | 'doctor' | 'receptionist' | 'attendant'
  showActions?: boolean
}

const QueueEntry = ({
  queueEntry,
  patient,
  onStartConsultation,
  onCompleteConsultation,
  onCancelEntry,
  userRole = 'receptionist',
  showActions = true
}: QueueEntryProps) => {
  const canStartConsultation = (userRole === 'doctor' || userRole === 'admin') && 
                               queueEntry.status === 'waiting'
  const canCompleteConsultation = (userRole === 'doctor' || userRole === 'admin') && 
                                  queueEntry.status === 'in_progress'
  const canCancelEntry = userRole === 'admin' || userRole === 'receptionist'

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'text-red-600 bg-red-50'
      case 'urgent': return 'text-orange-600 bg-orange-50'
      case 'normal': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-50'
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div 
      data-testid={`queue-entry-${queueEntry.id}`}
      className={`queue-entry border rounded-lg p-4 ${queueEntry.priority === 'emergency' ? 'border-red-500' : 'border-gray-200'}`}
    >
      <div className="queue-entry-header">
        <div className="flex justify-between items-start">
          <div>
            <h4 data-testid="patient-info" className="font-semibold">
              {patient ? `${patient.first_name} ${patient.last_name}` : `Patient ID: ${queueEntry.patient_id}`}
            </h4>
            {patient && (
              <p data-testid="patient-contact" className="text-sm text-gray-600">
                {patient.phone}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <span 
              data-testid="priority-badge"
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(queueEntry.priority)}`}
            >
              {queueEntry.priority.toUpperCase()}
            </span>
            <span 
              data-testid="status-badge"
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(queueEntry.status)}`}
            >
              {queueEntry.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="queue-entry-details mt-3">
        {queueEntry.notes && (
          <p data-testid="queue-notes" className="text-sm text-gray-700 mb-2">
            Notes: {queueEntry.notes}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span data-testid="created-time">
              Added: {new Date(queueEntry.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span data-testid="updated-time">
              Updated: {new Date(queueEntry.updated_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {queueEntry.estimated_time && (
          <div className="mt-2">
            <span data-testid="estimated-time" className="text-sm text-gray-600">
              Estimated time: {queueEntry.estimated_time} minutes
            </span>
          </div>
        )}

        {queueEntry.doctor_id && (
          <div className="mt-2">
            <span data-testid="assigned-doctor" className="text-sm text-gray-600">
              Doctor: {queueEntry.doctor_id}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="queue-entry-actions mt-4 flex gap-2" data-testid="queue-actions">
          {canStartConsultation && (
            <button
              data-testid="start-consultation-btn"
              onClick={() => onStartConsultation?.(queueEntry.id)}
              className="btn btn-primary"
            >
              Start Consultation
            </button>
          )}

          {canCompleteConsultation && (
            <button
              data-testid="complete-consultation-btn"
              onClick={() => onCompleteConsultation?.(queueEntry.id)}
              className="btn btn-success"
            >
              Complete
            </button>
          )}

          {canCancelEntry && queueEntry.status !== 'completed' && queueEntry.status !== 'cancelled' && (
            <button
              data-testid="cancel-entry-btn"
              onClick={() => onCancelEntry?.(queueEntry.id)}
              className="btn btn-danger"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

describe('QueueEntry Component', () => {
  const mockPatient: TestPatient = {
    id: 'patient-001',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+91-9876543210',
    date_of_birth: '1990-05-15',
    gender: 'male',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  }

  const mockQueueEntry: TestQueueEntry = {
    id: 'queue-001',
    patient_id: 'patient-001',
    receptionist_id: 'receptionist-test-id',
    status: 'waiting',
    priority: 'normal',
    notes: 'Regular checkup appointment',
    created_at: '2025-01-06T09:00:00.000Z',
    updated_at: '2025-01-06T09:00:00.000Z',
    estimated_time: 30
  }

  test('renders queue entry information correctly', () => {
    render(<QueueEntry queueEntry={mockQueueEntry} patient={mockPatient} />)

    expect(screen.getByTestId('patient-info')).toHaveTextContent('John Doe')
    expect(screen.getByTestId('patient-contact')).toHaveTextContent('+91-9876543210')
    expect(screen.getByTestId('priority-badge')).toHaveTextContent('NORMAL')
    expect(screen.getByTestId('status-badge')).toHaveTextContent('WAITING')
    expect(screen.getByTestId('queue-notes')).toHaveTextContent('Notes: Regular checkup appointment')
    expect(screen.getByTestId('estimated-time')).toHaveTextContent('Estimated time: 30 minutes')
  })

  test('handles missing patient information gracefully', () => {
    render(<QueueEntry queueEntry={mockQueueEntry} />)

    expect(screen.getByTestId('patient-info')).toHaveTextContent('Patient ID: patient-001')
    expect(screen.queryByTestId('patient-contact')).not.toBeInTheDocument()
  })

  test('shows correct priority styling for emergency cases', () => {
    const emergencyEntry: TestQueueEntry = {
      ...mockQueueEntry,
      priority: 'emergency',
      notes: 'Chest pain - urgent attention required'
    }

    render(<QueueEntry queueEntry={emergencyEntry} patient={mockPatient} />)

    const card = screen.getByTestId(`queue-entry-${emergencyEntry.id}`)
    expect(card).toHaveClass('border-red-500')
    
    const priorityBadge = screen.getByTestId('priority-badge')
    expect(priorityBadge).toHaveTextContent('EMERGENCY')
    expect(priorityBadge).toHaveClass('text-red-600', 'bg-red-50')
  })

  test('displays different status colors correctly', () => {
    const statuses: TestQueueEntry['status'][] = ['waiting', 'in_progress', 'completed', 'cancelled']
    
    statuses.forEach(status => {
      const entry = { ...mockQueueEntry, status, id: `queue-${status}` }
      const { rerender } = render(<QueueEntry queueEntry={entry} patient={mockPatient} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      
      switch (status) {
        case 'waiting':
          expect(statusBadge).toHaveClass('text-yellow-600', 'bg-yellow-50')
          break
        case 'in_progress':
          expect(statusBadge).toHaveClass('text-blue-600', 'bg-blue-50')
          break
        case 'completed':
          expect(statusBadge).toHaveClass('text-green-600', 'bg-green-50')
          break
        case 'cancelled':
          expect(statusBadge).toHaveClass('text-red-600', 'bg-red-50')
          break
      }
      
      rerender(<div></div>)
    })
  })

  test('shows doctor information when assigned', () => {
    const entryWithDoctor: TestQueueEntry = {
      ...mockQueueEntry,
      doctor_id: 'doctor-test-id',
      status: 'in_progress'
    }

    render(<QueueEntry queueEntry={entryWithDoctor} patient={mockPatient} />)

    expect(screen.getByTestId('assigned-doctor')).toHaveTextContent('Doctor: doctor-test-id')
  })

  describe('Role-based Action Buttons', () => {
    test('doctor can start consultation for waiting patients', async () => {
      const user = userEvent.setup()
      const onStartConsultation = vi.fn()

      render(
        <QueueEntry 
          queueEntry={mockQueueEntry} 
          patient={mockPatient}
          userRole="doctor"
          onStartConsultation={onStartConsultation}
        />
      )

      expect(screen.getByTestId('start-consultation-btn')).toBeInTheDocument()

      await user.click(screen.getByTestId('start-consultation-btn'))
      expect(onStartConsultation).toHaveBeenCalledWith(mockQueueEntry.id)
    })

    test('doctor can complete in-progress consultation', async () => {
      const user = userEvent.setup()
      const onCompleteConsultation = vi.fn()
      const inProgressEntry: TestQueueEntry = {
        ...mockQueueEntry,
        status: 'in_progress',
        doctor_id: 'doctor-test-id'
      }

      render(
        <QueueEntry 
          queueEntry={inProgressEntry} 
          patient={mockPatient}
          userRole="doctor"
          onCompleteConsultation={onCompleteConsultation}
        />
      )

      expect(screen.getByTestId('complete-consultation-btn')).toBeInTheDocument()

      await user.click(screen.getByTestId('complete-consultation-btn'))
      expect(onCompleteConsultation).toHaveBeenCalledWith(inProgressEntry.id)
    })

    test('receptionist can cancel entries', async () => {
      const user = userEvent.setup()
      const onCancelEntry = vi.fn()

      render(
        <QueueEntry 
          queueEntry={mockQueueEntry} 
          patient={mockPatient}
          userRole="receptionist"
          onCancelEntry={onCancelEntry}
        />
      )

      expect(screen.getByTestId('cancel-entry-btn')).toBeInTheDocument()

      await user.click(screen.getByTestId('cancel-entry-btn'))
      expect(onCancelEntry).toHaveBeenCalledWith(mockQueueEntry.id)
    })

    test('admin has all action capabilities', () => {
      render(
        <QueueEntry 
          queueEntry={mockQueueEntry} 
          patient={mockPatient}
          userRole="admin"
        />
      )

      expect(screen.getByTestId('start-consultation-btn')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-entry-btn')).toBeInTheDocument()
    })

    test('attendant has limited actions', () => {
      render(
        <QueueEntry 
          queueEntry={mockQueueEntry} 
          patient={mockPatient}
          userRole="attendant"
        />
      )

      expect(screen.queryByTestId('start-consultation-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('cancel-entry-btn')).not.toBeInTheDocument()
    })
  })

  test('hides actions when showActions is false', () => {
    render(
      <QueueEntry 
        queueEntry={mockQueueEntry} 
        patient={mockPatient}
        showActions={false}
      />
    )

    expect(screen.queryByTestId('queue-actions')).not.toBeInTheDocument()
  })

  test('does not show cancel button for completed entries', () => {
    const completedEntry: TestQueueEntry = {
      ...mockQueueEntry,
      status: 'completed'
    }

    render(
      <QueueEntry 
        queueEntry={completedEntry} 
        patient={mockPatient}
        userRole="receptionist"
      />
    )

    expect(screen.queryByTestId('cancel-entry-btn')).not.toBeInTheDocument()
  })

  test('handles missing optional fields gracefully', () => {
    const minimalEntry: TestQueueEntry = {
      id: 'queue-minimal',
      patient_id: 'patient-001',
      receptionist_id: 'receptionist-test-id',
      status: 'waiting',
      priority: 'normal',
      created_at: '2025-01-06T09:00:00.000Z',
      updated_at: '2025-01-06T09:00:00.000Z'
    }

    render(<QueueEntry queueEntry={minimalEntry} patient={mockPatient} />)

    expect(screen.queryByTestId('queue-notes')).not.toBeInTheDocument()
    expect(screen.queryByTestId('estimated-time')).not.toBeInTheDocument()
    expect(screen.queryByTestId('assigned-doctor')).not.toBeInTheDocument()
  })

  test('formats time display correctly', () => {
    render(<QueueEntry queueEntry={mockQueueEntry} patient={mockPatient} />)

    const createdTime = screen.getByTestId('created-time')
    const updatedTime = screen.getByTestId('updated-time')

    expect(createdTime.textContent).toContain('Added:')
    expect(updatedTime.textContent).toContain('Updated:')
    
    // Verify time formatting (should contain time components)
    expect(createdTime.textContent).toMatch(/\d+:\d+/)
    expect(updatedTime.textContent).toMatch(/\d+:\d+/)
  })

  test('handles keyboard navigation for action buttons', async () => {
    const user = userEvent.setup()
    const onStartConsultation = vi.fn()
    const onCancelEntry = vi.fn()

    render(
      <QueueEntry 
        queueEntry={mockQueueEntry} 
        patient={mockPatient}
        userRole="admin"
        onStartConsultation={onStartConsultation}
        onCancelEntry={onCancelEntry}
      />
    )

    // Tab to first button and activate with Enter
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onStartConsultation).toHaveBeenCalledWith(mockQueueEntry.id)

    // Tab to next button and activate with Space
    await user.tab()
    await user.keyboard(' ')
    expect(onCancelEntry).toHaveBeenCalledWith(mockQueueEntry.id)
  })
})