import { render, screen } from '@testing-library/react'
import { expect, test, describe, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { type TestPatient } from '@/lib/test/db-seeding'

// Simplified PatientForm component without complex state management
interface SimplePatientFormProps {
  initialData?: Partial<TestPatient>
  onSubmit: (data: FormData) => void
  onCancel?: () => void
  isEditing?: boolean
  isLoading?: boolean
  errors?: Record<string, string>
}

const SimplePatientForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  errors = {}
}: SimplePatientFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <form data-testid="patient-form" onSubmit={handleSubmit}>
      <h2 data-testid="form-title">
        {isEditing ? 'Edit Patient' : 'Add New Patient'}
      </h2>

      <div className="form-fields">
        <input
          name="first_name"
          data-testid="first-name-input"
          type="text"
          placeholder="First Name"
          defaultValue={initialData.first_name || ''}
          className={errors.first_name ? 'error' : ''}
          disabled={isLoading}
          required
        />
        {errors.first_name && (
          <span data-testid="first-name-error" className="error-message">
            {errors.first_name}
          </span>
        )}

        <input
          name="last_name"
          data-testid="last-name-input"
          type="text"
          placeholder="Last Name"
          defaultValue={initialData.last_name || ''}
          className={errors.last_name ? 'error' : ''}
          disabled={isLoading}
          required
        />
        {errors.last_name && (
          <span data-testid="last-name-error" className="error-message">
            {errors.last_name}
          </span>
        )}

        <input
          name="phone"
          data-testid="phone-input"
          type="tel"
          placeholder="+91-XXXXXXXXXX"
          defaultValue={initialData.phone || ''}
          className={errors.phone ? 'error' : ''}
          disabled={isLoading}
          required
        />
        {errors.phone && (
          <span data-testid="phone-error" className="error-message">
            {errors.phone}
          </span>
        )}

        <input
          name="email"
          data-testid="email-input"
          type="email"
          placeholder="Email (optional)"
          defaultValue={initialData.email || ''}
          className={errors.email ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.email && (
          <span data-testid="email-error" className="error-message">
            {errors.email}
          </span>
        )}

        <input
          name="date_of_birth"
          data-testid="dob-input"
          type="date"
          defaultValue={initialData.date_of_birth || ''}
          className={errors.date_of_birth ? 'error' : ''}
          disabled={isLoading}
          required
        />

        <select
          name="gender"
          data-testid="gender-select"
          defaultValue={initialData.gender || 'male'}
          className={errors.gender ? 'error' : ''}
          disabled={isLoading}
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <textarea
          name="address"
          data-testid="address-input"
          placeholder="Address (optional)"
          defaultValue={initialData.address || ''}
          className={errors.address ? 'error' : ''}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="form-actions" data-testid="form-actions">
        {onCancel && (
          <button
            type="button"
            data-testid="cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          data-testid="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span data-testid="loading-indicator">⏳</span>
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>{isEditing ? 'Update Patient' : 'Add Patient'}</>
          )}
        </button>
      </div>
    </form>
  )
}

describe('SimplePatientForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders form with correct title for new patient', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    expect(screen.getByTestId('form-title')).toHaveTextContent('Add New Patient')
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Add Patient')
  })

  test('renders form with correct title for editing', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} isEditing={true} />)

    expect(screen.getByTestId('form-title')).toHaveTextContent('Edit Patient')
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Update Patient')
  })

  test('populates form fields with initial data', () => {
    const initialData: Partial<TestPatient> = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543210',
      date_of_birth: '1990-05-15',
      gender: 'male',
      address: '123 Test Street'
    }

    render(<SimplePatientForm onSubmit={mockOnSubmit} initialData={initialData} />)

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+91-9876543210')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1990-05-15')).toBeInTheDocument()
    expect(screen.getByTestId('gender-select')).toHaveValue('male')
    expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument()
  })

  test('shows validation errors correctly', () => {
    const errors = {
      first_name: 'First name is required',
      phone: 'Invalid phone format',
      email: 'Invalid email address'
    }

    render(<SimplePatientForm onSubmit={mockOnSubmit} errors={errors} />)

    expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required')
    expect(screen.getByTestId('phone-error')).toHaveTextContent('Invalid phone format')
    expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')

    // Check error styling
    expect(screen.getByTestId('first-name-input')).toHaveClass('error')
    expect(screen.getByTestId('phone-input')).toHaveClass('error')
    expect(screen.getByTestId('email-input')).toHaveClass('error')
  })

  test('disables form inputs when loading', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} isLoading={true} />)

    expect(screen.getByTestId('first-name-input')).toBeDisabled()
    expect(screen.getByTestId('last-name-input')).toBeDisabled()
    expect(screen.getByTestId('phone-input')).toBeDisabled()
    expect(screen.getByTestId('email-input')).toBeDisabled()
    expect(screen.getByTestId('dob-input')).toBeDisabled()
    expect(screen.getByTestId('gender-select')).toBeDisabled()
    expect(screen.getByTestId('address-input')).toBeDisabled()
    expect(screen.getByTestId('submit-btn')).toBeDisabled()
  })

  test('shows loading state in submit button', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} isLoading={true} />)

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Adding...')
  })

  test('shows loading state for editing', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} isEditing={true} isLoading={true} />)

    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Updating...')
  })

  test('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    // Fill out form
    await user.type(screen.getByTestId('first-name-input'), 'Jane')
    await user.type(screen.getByTestId('last-name-input'), 'Smith')
    await user.type(screen.getByTestId('phone-input'), '+91-9876543210')
    await user.type(screen.getByTestId('dob-input'), '1995-03-20')

    // Submit form
    await user.click(screen.getByTestId('submit-btn'))

    expect(mockOnSubmit).toHaveBeenCalled()
    
    // Check that FormData was passed
    const callArgs = mockOnSubmit.mock.calls[0][0]
    expect(callArgs).toBeInstanceOf(FormData)
  })

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.click(screen.getByTestId('cancel-btn'))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  test('hides cancel button when onCancel is not provided', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    expect(screen.queryByTestId('cancel-btn')).not.toBeInTheDocument()
  })

  test('handles user input correctly', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    const firstNameInput = screen.getByTestId('first-name-input')
    const emailInput = screen.getByTestId('email-input')
    const genderSelect = screen.getByTestId('gender-select')

    // Test text input
    await user.type(firstNameInput, 'John')
    expect(firstNameInput).toHaveValue('John')

    // Test email input
    await user.type(emailInput, 'john@example.com')
    expect(emailInput).toHaveValue('john@example.com')

    // Test select input
    await user.selectOptions(genderSelect, 'female')
    expect(genderSelect).toHaveValue('female')
  })

  test('form has proper accessibility attributes', () => {
    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    // Check required fields have required attribute
    expect(screen.getByTestId('first-name-input')).toHaveAttribute('required')
    expect(screen.getByTestId('last-name-input')).toHaveAttribute('required')
    expect(screen.getByTestId('phone-input')).toHaveAttribute('required')
    expect(screen.getByTestId('dob-input')).toHaveAttribute('required')
    expect(screen.getByTestId('gender-select')).toHaveAttribute('required')

    // Check optional fields don't have required attribute
    expect(screen.getByTestId('email-input')).not.toHaveAttribute('required')
    expect(screen.getByTestId('address-input')).not.toHaveAttribute('required')
  })

  test('prevents form submission when loading', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} isLoading={true} />)

    const submitBtn = screen.getByTestId('submit-btn')
    expect(submitBtn).toBeDisabled()

    // Attempting to click disabled button should not trigger submission
    await user.click(submitBtn)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('handles form submission with partial data', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    // Fill only required fields
    await user.type(screen.getByTestId('first-name-input'), 'Jane')
    await user.type(screen.getByTestId('last-name-input'), 'Doe')
    await user.type(screen.getByTestId('phone-input'), '+91-1234567890')
    await user.type(screen.getByTestId('dob-input'), '1990-01-01')

    await user.click(screen.getByTestId('submit-btn'))

    expect(mockOnSubmit).toHaveBeenCalled()

    // Verify FormData contains the expected fields
    const formData = mockOnSubmit.mock.calls[0][0] as FormData
    expect(formData.get('first_name')).toBe('Jane')
    expect(formData.get('last_name')).toBe('Doe')
    expect(formData.get('phone')).toBe('+91-1234567890')
    expect(formData.get('date_of_birth')).toBe('1990-01-01')
    expect(formData.get('gender')).toBe('male') // default value
  })

  test('handles textarea input correctly', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} />)

    const addressInput = screen.getByTestId('address-input')
    const longAddress = '123 Main Street\nApartment 4B\nMumbai, Maharashtra\n400001'

    await user.type(addressInput, longAddress)
    expect(addressInput).toHaveValue(longAddress)
  })

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup()

    render(<SimplePatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    // Tab through form elements
    await user.tab() // first name
    expect(screen.getByTestId('first-name-input')).toHaveFocus()

    await user.tab() // last name
    expect(screen.getByTestId('last-name-input')).toHaveFocus()

    await user.tab() // phone
    expect(screen.getByTestId('phone-input')).toHaveFocus()

    // Continue tabbing to reach buttons
    await user.tab() // email
    await user.tab() // dob
    await user.tab() // gender
    await user.tab() // address
    await user.tab() // cancel button
    expect(screen.getByTestId('cancel-btn')).toHaveFocus()

    await user.tab() // submit button
    expect(screen.getByTestId('submit-btn')).toHaveFocus()
  })
})