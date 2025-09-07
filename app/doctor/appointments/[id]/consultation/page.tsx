'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Calendar, Clock, Stethoscope, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Appointment } from '@/lib/types'

export default function DoctorConsultationWorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appointmentId) return
    
    const loadAppointment = async () => {
      try {
        setLoading(true)
        const supabase = createAuthenticatedClient()
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
            users!appointments_doctor_id_fkey(
              id, full_name, email, phone, created_at, updated_at,
              user_profiles(department, specialization)
            )
          `)
          .eq('id', appointmentId)
          .single()
        
        if (error) throw error
        if (!data) throw new Error('Appointment not found')
        
        // Type-safe data access for users with user_profiles
        interface UserWithProfile {
          id: string
          full_name: string
          email: string
          phone: string
          created_at: string
          updated_at: string
          user_profiles?: {
            department?: string
            specialization?: string
          }
        }

        // Transform to match our type structure
        const transformedAppointment: Appointment = {
          ...data,
          patient: data.patients ? {
            id: data.patients.id,
            name: data.patients.full_name,
            mobile: data.patients.phone,
            email: data.patients.email,
            dob: data.patients.date_of_birth,
            gender: data.patients.gender,
            address: data.patients.address,
            emergency_contact: data.patients.emergency_contact_phone,
            created_at: data.patients.created_at || '',
            updated_at: data.patients.updated_at || '',
          } : undefined,
          doctor: data.users ? {
            id: (data.users as UserWithProfile).id,
            role: 'doctor' as const,
            full_name: (data.users as UserWithProfile).full_name,
            email: (data.users as UserWithProfile).email,
            phone: (data.users as UserWithProfile).phone,
            department: (data.users as UserWithProfile).user_profiles?.department || 'general',
            specialization: (data.users as UserWithProfile).user_profiles?.specialization || null,
            password_hash: '',
            is_active: true,
            created_at: (data.users as UserWithProfile).created_at || '',
            updated_at: (data.users as UserWithProfile).updated_at || '',
          } : undefined
        }
        
        setAppointment(transformedAppointment)
        
      } catch (err) {
        console.error('Error loading appointment:', err)
        setError(err instanceof Error ? err.message : 'Failed to load appointment')
      } finally {
        setLoading(false)
      }
    }

    loadAppointment()
  }, [appointmentId])

  const handleStartConsultation = () => {
    if (!appointment) return
    
    // Navigate to the main consultation workflow
    router.push(`/doctor/patients/${appointment.patient_id}/consultation?appointmentId=${appointmentId}`)
  }
  
  const handleUpdateStatus = async (newStatus: string) => {
    if (!appointment) return
    
    try {
      const supabase = createAuthenticatedClient()
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
      
      if (error) throw error
      
      setAppointment(prev => prev ? { ...prev, status: newStatus as any } : null)
      
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading appointment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Appointment not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'scheduled': return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-green-50 text-green-800 border-green-200'
      case 'in_progress': return 'bg-purple-50 text-purple-800 border-purple-200'
      case 'completed': return 'bg-gray-50 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-200'
      default: return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Consultation</h1>
            <p className="text-muted-foreground">
              Appointment #{appointment.id.slice(0, 8)}... • {appointment.appointment_type}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status}
        </Badge>
      </div>

      {/* Appointment Details */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-lg">{appointment.patient?.name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.patient?.mobile} • {appointment.patient?.email}
              </p>
            </div>
            {appointment.patient?.dob && (
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.patient.dob).toLocaleDateString()}
                </p>
              </div>
            )}
            {appointment.patient?.gender && (
              <div>
                <p className="text-sm font-medium">Gender</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {appointment.patient.gender}
                </p>
              </div>
            )}
            {appointment.patient?.address && (
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.patient.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-lg">{appointment.doctor?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.doctor?.department}
              </p>
            </div>
            {appointment.doctor?.specialization && (
              <div>
                <p className="text-sm font-medium">Specialization</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor.specialization}
                </p>
              </div>
            )}
            {appointment.doctor?.phone && (
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {appointment.doctor?.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {appointment.duration} minutes
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Department</p>
              <p className="text-sm text-muted-foreground">
                {appointment.department}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Type</p>
              <p className="text-sm text-muted-foreground capitalize">
                {appointment.appointment_type}
              </p>
            </div>
            {appointment.priority && (
              <div>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  Priority Appointment
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {appointment.patient_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{appointment.patient_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage this consultation appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {['scheduled', 'confirmed', 'arrived'].includes(appointment.status) && (
              <Button 
                onClick={handleStartConsultation} 
                className="flex items-center gap-2"
                size="lg"
              >
                <Stethoscope className="h-4 w-4" />
                Start Consultation
              </Button>
            )}
            
            {appointment.status === 'scheduled' && (
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus('confirmed')}
              >
                Confirm Appointment
              </Button>
            )}
            
            {['scheduled', 'confirmed'].includes(appointment.status) && (
              <Button 
                variant="destructive" 
                onClick={() => handleUpdateStatus('cancelled')}
              >
                Cancel Appointment
              </Button>
            )}
            
            {appointment.status === 'completed' && (
              <Button 
                variant="outline" 
                onClick={() => router.push(`/doctor/appointments/${appointmentId}/summary`)}
              >
                View Consultation Summary
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}