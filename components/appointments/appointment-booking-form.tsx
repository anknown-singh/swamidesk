'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, ClockIcon, UserIcon, StethoscopeIcon, AlertTriangleIcon } from 'lucide-react'
import type { AppointmentBookingForm, AppointmentType, UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface AppointmentBookingFormProps {
  onSubmit: (data: AppointmentBookingForm) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<AppointmentBookingForm>
}

const appointmentTypes: { value: AppointmentType; label: string; description: string }[] = [
  { value: 'consultation', label: 'Consultation', description: 'Initial or routine consultation' },
  { value: 'follow_up', label: 'Follow-up', description: 'Follow-up after treatment' },
  { value: 'procedure', label: 'Procedure', description: 'Medical procedure or treatment' },
  { value: 'checkup', label: 'Checkup', description: 'Regular health checkup' },
  { value: 'emergency', label: 'Emergency', description: 'Urgent medical attention' },
  { value: 'vaccination', label: 'Vaccination', description: 'Immunization appointment' },
]

interface Department {
  value: string
  label: string
}

interface Doctor {
  id: string
  name: string
  department: string
  specialization: string
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

export function AppointmentBookingForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {}
}: AppointmentBookingFormProps) {
  const [formData, setFormData] = useState<AppointmentBookingForm>({
    patient_id: '',
    doctor_id: '',
    department: '',
    appointment_type: 'consultation',
    scheduled_date: '',
    scheduled_time: '',
    duration: 30,
    title: '',
    description: '',
    patient_notes: '',
    priority: false,
    services: [],
    estimated_cost: undefined,
    ...initialData
  })

  const [selectedPatient, setSelectedPatient] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchDoctorsAndDepartments()
  }, [])

  const fetchDoctorsAndDepartments = async () => {
    try {
      setLoadingData(true)
      
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('users')
        .select('id, full_name, department, specialization')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('full_name')
      
      if (doctorsError) throw doctorsError
      
      const mappedDoctors = (doctorsData as any[]).map(doc => ({
        id: doc.id,
        name: doc.full_name,
        department: doc.department || 'general',
        specialization: doc.specialization || 'General Practice'
      }))
      
      setDoctors(mappedDoctors)
      
      // Extract unique departments from doctors
      const uniqueDepartments = Array.from(
        new Set(mappedDoctors.map(doc => doc.department))
      ).map(dept => ({
        value: dept,
        label: dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, ' ')
      }))
      
      setDepartments(uniqueDepartments)
    } catch (error) {
      console.error('Error fetching doctors and departments:', error)
      // Fallback to default values
      setDepartments([
        { value: 'general', label: 'General Medicine' },
        { value: 'cardiology', label: 'Cardiology' },
        { value: 'dermatology', label: 'Dermatology' },
        { value: 'orthopedics', label: 'Orthopedics' }
      ])
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof AppointmentBookingForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    // Validate required fields
    if (!formData.patient_id || !formData.doctor_id || !formData.scheduled_date || !formData.scheduled_time) {
      alert('Please fill in all required fields')
      return
    }

    onSubmit(formData)
  }

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (doctor) {
      handleInputChange('doctor_id', doctorId)
      handleInputChange('department', doctor.department)
    }
  }

  if (loadingData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Book Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading doctors and departments...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredDoctors = formData.department 
    ? doctors.filter(doc => doc.department === formData.department)
    : doctors

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book New Appointment
        </CardTitle>
        <CardDescription>
          Schedule a new appointment for a patient
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patient_search" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Patient *
              </Label>
              <div className="space-y-2">
                <Input
                  id="patient_search"
                  placeholder="Search patient by name or phone..."
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  disabled={isLoading}
                />
                <Select 
                  value={formData.patient_id} 
                  onValueChange={(value) => handleInputChange('patient_id', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pat1">John Doe - +91-9876543210</SelectItem>
                    <SelectItem value="pat2">Sarah Johnson - +91-9876543211</SelectItem>
                    <SelectItem value="pat3">Mike Wilson - +91-9876543212</SelectItem>
                    <SelectItem value="pat4">Emma Davis - +91-9876543213</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_type">Appointment Type *</Label>
              <Select 
                value={formData.appointment_type} 
                onValueChange={(value: AppointmentType) => handleInputChange('appointment_type', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department & Doctor Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => handleInputChange('department', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor_id" className="flex items-center gap-2">
                <StethoscopeIcon className="h-4 w-4" />
                Doctor *
              </Label>
              <Select 
                value={formData.doctor_id} 
                onValueChange={handleDoctorChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div>
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-sm text-muted-foreground">{doctor.specialization}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time" className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Time *
              </Label>
              <Select 
                value={formData.scheduled_time} 
                onValueChange={(value) => handleInputChange('scheduled_time', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select 
                value={formData.duration?.toString() || '30'} 
                onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title & Description */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input
                id="title"
                placeholder="Brief title for the appointment"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost</Label>
              <Input
                id="estimated_cost"
                type="number"
                placeholder="0.00"
                value={formData.estimated_cost || ''}
                onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || undefined)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Doctor's Notes</Label>
              <Textarea
                id="description"
                placeholder="Internal notes for the doctor..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_notes">Patient's Notes</Label>
              <Textarea
                id="patient_notes"
                placeholder="Patient's concerns or symptoms..."
                value={formData.patient_notes || ''}
                onChange={(e) => handleInputChange('patient_notes', e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>

          {/* Priority Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="priority"
              checked={formData.priority}
              onCheckedChange={(checked) => handleInputChange('priority', !!checked)}
              disabled={isLoading}
            />
            <Label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
              Priority Appointment
              <span className="text-muted-foreground font-normal">
                (Requires urgent attention)
              </span>
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}