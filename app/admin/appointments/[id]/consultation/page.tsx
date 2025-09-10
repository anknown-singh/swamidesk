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

export default function ConsultationWorkflowPage() {
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
            patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone),
            users!appointments_doctor_id_fkey(
              id, full_name, email, phone,
              user_profiles(department, specialization)
            )
          `)
          .eq('id', appointmentId)
          .single()
        
        if (error) throw error
        if (!data) throw new Error('Appointment not found')
        
        // Keep the original appointment data structure
        const transformedAppointment: Appointment = {
          ...data
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
    
    // Navigate to the consultation workflow
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
            <h1 className="text-3xl font-bold tracking-tight">Consultation Workflow</h1>
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
              <p className="font-medium text-lg">{appointment.patients?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.patients?.phone} • {appointment.patients?.email}
              </p>
            </div>
            {appointment.patients?.date_of_birth && (
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.patients.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}
            {appointment.patients?.gender && (
              <div>
                <p className="text-sm font-medium">Gender</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {appointment.patients.gender}
                </p>
              </div>
            )}
            {appointment.patients?.address && (
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.patients.address}
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
              <p className="font-medium text-lg">{appointment.users?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.users?.department || 'General'}
              </p>
            </div>
            {appointment.users?.specialization && (
              <div>
                <p className="text-sm font-medium">Specialization</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.users?.specialization || 'General Practice'}
                </p>
              </div>
            )}
            {appointment.users?.phone && (
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.users.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {appointment.users?.email}
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
            Manage the consultation workflow for this appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {appointment.status === 'scheduled' && (
              <>
                <Button onClick={handleStartConsultation} className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Start Consultation
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateStatus('confirmed')}
                >
                  Confirm Appointment
                </Button>
              </>
            )}
            
            {appointment.status === 'confirmed' && (
              <Button onClick={handleStartConsultation} className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Start Consultation
              </Button>
            )}
            
            {appointment.status === 'pending' && (
              <>
                <Button 
                  onClick={() => handleUpdateStatus('scheduled')}
                  className="flex items-center gap-2"
                >
                  Approve Appointment
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateStatus('cancelled')}
                >
                  Reject Appointment
                </Button>
              </>
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
                onClick={() => router.push(`/admin/appointments/${appointmentId}/summary`)}
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