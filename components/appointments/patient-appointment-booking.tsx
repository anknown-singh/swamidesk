'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  StethoscopeIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  CreditCardIcon
} from 'lucide-react'
import type { AppointmentBookingForm, AppointmentType, UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface PatientAppointmentBookingProps {
  patientId?: string
  onSubmit?: (data: AppointmentBookingForm) => void
  onCancel?: () => void
  isLoading?: boolean
  availableDoctors?: UserProfile[]
  availableSlots?: { [key: string]: string[] } // date -> available times
}

const appointmentTypes: { value: AppointmentType; label: string; description: string; estimatedCost?: number }[] = [
  { 
    value: 'consultation', 
    label: 'New Consultation', 
    description: 'First-time visit or new medical concern',
    estimatedCost: 500
  },
  { 
    value: 'follow_up', 
    label: 'Follow-up Visit', 
    description: 'Follow-up for existing treatment',
    estimatedCost: 300
  },
  { 
    value: 'checkup', 
    label: 'Routine Check-up', 
    description: 'Preventive health screening',
    estimatedCost: 400
  },
  { 
    value: 'procedure', 
    label: 'Medical Procedure', 
    description: 'Scheduled medical procedure',
    estimatedCost: 1500
  },
  { 
    value: 'emergency', 
    label: 'Emergency Visit', 
    description: 'Urgent medical attention needed',
    estimatedCost: 800
  },
  { 
    value: 'vaccination', 
    label: 'Vaccination', 
    description: 'Immunization appointment',
    estimatedCost: 200
  },
]

interface Department {
  value: string
  label: string
  description: string
}

interface Doctor {
  id: string
  name: string
  department: string
  specialization: string
}

const mockAvailableSlots: { [key: string]: string[] } = {
  [new Date(Date.now() + 86400000).toISOString().split('T')[0]]: ['09:00', '10:30', '14:00', '15:30'],
  [new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]]: ['09:30', '11:00', '14:30', '16:00'],
  [new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]]: ['10:00', '11:30', '15:00', '16:30'],
}

export function PatientAppointmentBooking({
  patientId,
  onSubmit,
  onCancel,
  isLoading = false,
  availableDoctors,
  availableSlots
}: PatientAppointmentBookingProps) {
  const [step, setStep] = useState<'type' | 'department' | 'doctor' | 'datetime' | 'details' | 'confirmation'>('type')
  const [formData, setFormData] = useState<AppointmentBookingForm>({
    patient_id: patientId || '',
    doctor_id: '',
    department: '',
    appointment_type: 'consultation',
    scheduled_date: '',
    scheduled_time: '',
    duration: 30,
    title: '',
    patient_notes: '',
    priority: false,
    estimated_cost: 500
  })
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null)
  const [selectedType, setSelectedType] = useState<typeof appointmentTypes[0] | null>(null)
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    address: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [doctors, setDoctors] = useState<UserProfile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    if (availableDoctors && !loadingData) {
      setDoctors(availableDoctors)
    } else {
      fetchDoctorsAndDepartments()
    }
  }, [availableDoctors])

  const fetchDoctorsAndDepartments = async () => {
    try {
      setLoadingData(true)
      
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, department, specialization, is_active, created_at, updated_at')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('full_name')
      
      if (doctorsError) throw doctorsError
      
      const mappedDoctors = (doctorsData as any[]).map(doc => ({
        id: doc.id,
        role: 'doctor' as const,
        name: doc.full_name,
        email: doc.email,
        phone: doc.phone,
        department: doc.department || 'general',
        specialization: doc.specialization || 'General Practice',
        is_active: doc.is_active,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }))
      
      setDoctors(mappedDoctors)
      
      // Extract unique departments from doctors
      const uniqueDepartments = Array.from(
        new Set(mappedDoctors.map(doc => doc.department))
      ).map(dept => ({
        value: dept,
        label: dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, ' '),
        description: `Medical care specializing in ${dept}`
      }))
      
      setDepartments(uniqueDepartments)
    } catch (error) {
      console.error('Error fetching doctors and departments:', error)
      // Fallback to default values
      setDepartments([
        { value: 'general', label: 'General Medicine', description: 'Primary healthcare and routine medical care' },
        { value: 'cardiology', label: 'Cardiology', description: 'Heart and cardiovascular conditions' },
        { value: 'dermatology', label: 'Dermatology', description: 'Skin, hair, and nail conditions' }
      ])
    } finally {
      setLoadingData(false)
    }
  }

  const filteredDoctors = selectedDepartment 
    ? doctors.filter(doc => doc.department === selectedDepartment)
    : doctors

  const availableDates = Object.keys(availableSlots).sort()
  const availableTimesForDate = formData.scheduled_date 
    ? availableSlots[formData.scheduled_date] || []
    : []

  useEffect(() => {
    // Auto-advance steps based on selections
    if (step === 'type' && selectedType) {
      setFormData(prev => ({
        ...prev,
        appointment_type: selectedType.value,
        estimated_cost: selectedType.estimatedCost
      }))
    }
    
    if (step === 'department' && selectedDepartment) {
      setFormData(prev => ({
        ...prev,
        department: selectedDepartment
      }))
    }
    
    if (step === 'doctor' && selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctor_id: selectedDoctor.id,
        department: selectedDoctor.department || ''
      }))
    }
  }, [step, selectedType, selectedDepartment, selectedDoctor])

  const handleNext = () => {
    switch (step) {
      case 'type':
        if (selectedType) setStep('department')
        break
      case 'department':
        if (selectedDepartment) setStep('doctor')
        break
      case 'doctor':
        if (selectedDoctor) setStep('datetime')
        break
      case 'datetime':
        if (formData.scheduled_date && formData.scheduled_time) setStep('details')
        break
      case 'details':
        setStep('confirmation')
        break
      case 'confirmation':
        handleSubmit()
        break
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'department':
        setStep('type')
        break
      case 'doctor':
        setStep('department')
        break
      case 'datetime':
        setStep('doctor')
        break
      case 'details':
        setStep('datetime')
        break
      case 'confirmation':
        setStep('details')
        break
    }
  }

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setNotification({ type: 'error', message: 'Please agree to the terms and conditions to proceed.' })
      return
    }

    try {
      onSubmit?.(formData)
      setNotification({ type: 'success', message: 'Your appointment request has been submitted successfully!' })
    } catch (error) {
      setNotification({ type: 'error', message: 'There was an error submitting your appointment. Please try again.' })
    }
  }

  const getStepProgress = () => {
    const steps = ['type', 'department', 'doctor', 'datetime', 'details', 'confirmation']
    return ((steps.indexOf(step) + 1) / steps.length) * 100
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${getStepProgress()}%` }}
        />
      </div>

      {/* Notification */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <AlertCircleIcon className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Book Your Appointment
          </CardTitle>
          <CardDescription>
            {step === 'type' && 'Choose the type of appointment you need'}
            {step === 'department' && 'Select the medical department'}
            {step === 'doctor' && 'Choose your preferred doctor'}
            {step === 'datetime' && 'Pick your preferred date and time'}
            {step === 'details' && 'Provide additional details'}
            {step === 'confirmation' && 'Review and confirm your appointment'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Appointment Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {appointmentTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedType?.value === type.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {type.estimatedCost && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <CreditCardIcon className="h-4 w-4" />
                            ₹{type.estimatedCost}
                          </div>
                          <div className="text-xs text-muted-foreground">Estimated</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Department Selection */}
          {step === 'department' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {departments.map((dept) => (
                  <div
                    key={dept.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDepartment === dept.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDepartment(dept.value)}
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{dept.label}</h3>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Doctor Selection */}
          {step === 'doctor' && (
            <div className="space-y-4">
              {filteredDoctors.length === 0 ? (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    No doctors available for the selected department. Please go back and select a different department.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDoctor?.id === doctor.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StethoscopeIcon className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">{doctor.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {doctor.phone && (
                              <div className="flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {doctor.phone}
                              </div>
                            )}
                            {doctor.email && (
                              <div className="flex items-center gap-1">
                                <MailIcon className="h-3 w-3" />
                                {doctor.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Date & Time Selection */}
          {step === 'datetime' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Date Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Select Date</h3>
                  <div className="grid gap-2">
                    {availableDates.map((date) => (
                      <div
                        key={date}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.scheduled_date === date 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, scheduled_date: date, scheduled_time: '' }))}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatDate(date)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {availableSlots[date]?.length || 0} slots available
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Select Time</h3>
                  {formData.scheduled_date ? (
                    <div className="grid gap-2">
                      {availableTimesForDate.map((time) => (
                        <div
                          key={time}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.scheduled_time === time 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, scheduled_time: time }))}
                        >
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{formatTime(time)}</span>
                          </div>
                        </div>
                      ))}
                      {availableTimesForDate.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No available time slots for selected date
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a date first
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Patient Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Full Name *</Label>
                  <Input
                    id="patient_name"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient_mobile">Mobile Number *</Label>
                  <Input
                    id="patient_mobile"
                    value={patientInfo.mobile}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+91-9876543210"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient_email">Email Address</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={patientInfo.email}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient_dob">Date of Birth</Label>
                  <Input
                    id="patient_dob"
                    type="date"
                    value={patientInfo.dateOfBirth}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_address">Address</Label>
                <Textarea
                  id="patient_address"
                  value={patientInfo.address}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your complete address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_notes">Reason for Visit / Symptoms</Label>
                <Textarea
                  id="patient_notes"
                  value={formData.patient_notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_notes: e.target.value }))}
                  placeholder="Please describe your symptoms or reason for the appointment..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <Alert>
                <CheckCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Please review your appointment details before confirming.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Appointment Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedType?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span>{departments.find(d => d.value === selectedDepartment)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doctor:</span>
                      <span>{selectedDoctor?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(formData.scheduled_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{formatTime(formData.scheduled_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">Estimated Cost:</span>
                      <span>₹{formData.estimated_cost}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Patient Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{patientInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span>{patientInfo.mobile}</span>
                    </div>
                    {patientInfo.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{patientInfo.email}</span>
                      </div>
                    )}
                    {formData.patient_notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-sm">{formData.patient_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Clinic Information</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>SwamIDesk Clinic, 123 Healthcare Street, Medical District</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>+91-9876543200</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    <span>appointments@swamidesk.com</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">
                      terms and conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:underline">
                      privacy policy
                    </a>
                  </Label>
                </div>
                
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Please arrive 15 minutes before your appointment time</li>
                      <li>Bring a valid ID and any relevant medical documents</li>
                      <li>Cancellations must be made at least 2 hours in advance</li>
                      <li>You will receive a confirmation SMS and email</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step !== 'type' && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="ml-2">
                  Cancel
                </Button>
              )}
            </div>
            <Button 
              onClick={handleNext}
              disabled={
                isLoading ||
                (step === 'type' && !selectedType) ||
                (step === 'department' && !selectedDepartment) ||
                (step === 'doctor' && !selectedDoctor) ||
                (step === 'datetime' && (!formData.scheduled_date || !formData.scheduled_time)) ||
                (step === 'details' && (!patientInfo.name || !patientInfo.mobile)) ||
                (step === 'confirmation' && !agreedToTerms)
              }
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : step === 'confirmation' ? (
                'Confirm Appointment'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}