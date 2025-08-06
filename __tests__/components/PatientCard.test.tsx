import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, describe, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { dbSeeder, type TestPatient } from '@/lib/test/db-seeding'

// Mock PatientCard component (simulating a real component from the app)
interface PatientCardProps {
  patient: TestPatient
  onEdit?: (patient: TestPatient) => void
  onView?: (patient: TestPatient) => void
  onDelete?: (patientId: string) => void
  showActions?: boolean
  role?: 'admin' | 'doctor' | 'receptionist'
}

const PatientCard = ({ 
  patient, 
  onEdit, 
  onView, 
  onDelete, 
  showActions = true, 
  role = 'receptionist' 
}: PatientCardProps) => {
  const canEdit = role === 'admin' || role === 'receptionist'
  const canDelete = role === 'admin'
  const canView = true // All roles can view

  return (
    <div data-testid={`patient-card-${patient.id}`} className="patient-card">
      <div className="patient-info">
        <h3 data-testid="patient-name">
          {patient.first_name} {patient.last_name}
        </h3>
        <p data-testid="patient-phone">{patient.phone}</p>
        <p data-testid="patient-email">{patient.email || 'No email'}</p>
        <p data-testid="patient-dob">DOB: {patient.date_of_birth}</p>
        <p data-testid="patient-gender">Gender: {patient.gender}</p>
        {patient.address && (
          <p data-testid="patient-address">Address: {patient.address}</p>
        )}
        <p data-testid="patient-status">
          Status: {patient.is_active ? 'Active' : 'Inactive'}
        </p>
      </div>

      {showActions && (
        <div className="patient-actions" data-testid="patient-actions">
          {canView && (
            <button
              data-testid="view-patient-btn"
              onClick={() => onView?.(patient)}
              className="btn-primary"
            >
              View Details
            </button>
          )}
          
          {canEdit && (
            <button
              data-testid="edit-patient-btn"
              onClick={() => onEdit?.(patient)}
              className="btn-secondary"
            >
              Edit
            </button>
          )}
          
          {canDelete && (
            <button
              data-testid="delete-patient-btn"
              onClick={() => onDelete?.(patient.id)}
              className="btn-danger"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

describe('PatientCard Component', () => {
  const mockPatient: TestPatient = {
    id: 'patient-test-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    date_of_birth: '1990-05-15',
    gender: 'male',
    address: '123 Test Street, Mumbai',
    emergency_contact: 'Jane Doe',
    emergency_phone: '+91-9876543211',
    created_at: '2025-01-01T00:00:00.000Z',
    is_active: true
  }

  test('renders patient information correctly', () => {
    render(<PatientCard patient={mockPatient} />)

    expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe')
    expect(screen.getByTestId('patient-phone')).toHaveTextContent('+91-9876543210')
    expect(screen.getByTestId('patient-email')).toHaveTextContent('john.doe@example.com')
    expect(screen.getByTestId('patient-dob')).toHaveTextContent('DOB: 1990-05-15')
    expect(screen.getByTestId('patient-gender')).toHaveTextContent('Gender: male')
    expect(screen.getByTestId('patient-address')).toHaveTextContent('Address: 123 Test Street, Mumbai')
    expect(screen.getByTestId('patient-status')).toHaveTextContent('Status: Active')
  })

  test('handles missing optional fields gracefully', () => {
    const patientWithoutEmail: TestPatient = {
      ...mockPatient,
      email: undefined,
      address: undefined
    }

    render(<PatientCard patient={patientWithoutEmail} />)

    expect(screen.getByTestId('patient-email')).toHaveTextContent('No email')
    expect(screen.queryByTestId('patient-address')).not.toBeInTheDocument()
  })

  test('shows inactive status correctly', () => {
    const inactivePatient: TestPatient = {
      ...mockPatient,
      is_active: false
    }

    render(<PatientCard patient={inactivePatient} />)

    expect(screen.getByTestId('patient-status')).toHaveTextContent('Status: Inactive')
  })

  test('calls onView when view button is clicked', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()

    render(<PatientCard patient={mockPatient} onView={onView} />)

    await user.click(screen.getByTestId('view-patient-btn'))

    expect(onView).toHaveBeenCalledWith(mockPatient)
  })

  test('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(<PatientCard patient={mockPatient} onEdit={onEdit} />)

    await user.click(screen.getByTestId('edit-patient-btn'))

    expect(onEdit).toHaveBeenCalledWith(mockPatient)
  })

  test('calls onDelete when delete button is clicked (admin role)', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <PatientCard 
        patient={mockPatient} 
        onDelete={onDelete} 
        role="admin" 
      />
    )

    await user.click(screen.getByTestId('delete-patient-btn'))

    expect(onDelete).toHaveBeenCalledWith(mockPatient.id)
  })

  describe('Role-based Action Visibility', () => {
    test('admin role shows all action buttons', () => {
      render(<PatientCard patient={mockPatient} role="admin" />)

      expect(screen.getByTestId('view-patient-btn')).toBeInTheDocument()
      expect(screen.getByTestId('edit-patient-btn')).toBeInTheDocument()
      expect(screen.getByTestId('delete-patient-btn')).toBeInTheDocument()
    })

    test('receptionist role shows view and edit buttons only', () => {
      render(<PatientCard patient={mockPatient} role="receptionist" />)

      expect(screen.getByTestId('view-patient-btn')).toBeInTheDocument()
      expect(screen.getByTestId('edit-patient-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('delete-patient-btn')).not.toBeInTheDocument()
    })

    test('doctor role shows only view button', () => {
      render(<PatientCard patient={mockPatient} role="doctor" />)

      expect(screen.getByTestId('view-patient-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('edit-patient-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('delete-patient-btn')).not.toBeInTheDocument()
    })
  })

  test('hides actions when showActions is false', () => {
    render(<PatientCard patient={mockPatient} showActions={false} />)

    expect(screen.queryByTestId('patient-actions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-patient-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-patient-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-patient-btn')).not.toBeInTheDocument()
  })

  test('applies correct CSS classes', () => {
    render(<PatientCard patient={mockPatient} />)

    const card = screen.getByTestId(`patient-card-${mockPatient.id}`)
    expect(card).toHaveClass('patient-card')

    expect(screen.getByTestId('view-patient-btn')).toHaveClass('btn-primary')
    expect(screen.getByTestId('edit-patient-btn')).toHaveClass('btn-secondary')
  })

  test('handles button interactions with keyboard navigation', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const onEdit = vi.fn()

    render(<PatientCard patient={mockPatient} onView={onView} onEdit={onEdit} />)

    // Tab to view button and press Enter
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onView).toHaveBeenCalledWith(mockPatient)

    // Tab to edit button and press Space
    await user.tab()
    await user.keyboard(' ')
    expect(onEdit).toHaveBeenCalledWith(mockPatient)
  })
})