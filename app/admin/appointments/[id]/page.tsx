'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Phone, CreditCard } from 'lucide-react'
import type { Appointment } from '@/lib/types'

interface AppointmentWithDetails extends Appointment {
  patients?: {
    id: string
    full_name: string
    phone?: string
    email?: string
    date_of_birth?: string
    gender?: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
  users?: {
    full_name: string
    phone?: string
    specialization?: string
    department?: string
  }
  services?: Array<{
    id: string
    name: string
    price: number
    category: string
  }>
  visit_services?: Array<{
    id: string
    status: string
    notes?: string
    services?: {
      name: string
      category: string
    }
  }>
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const appointmentId = params.id as string

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(full_name, phone, email, date_of_birth, gender),
            users(full_name, phone, specialization, department),
            visit_services(
              id, quantity, unit_price, total_price, status, notes,
              services(name, category, description)
            )
          `)
          .eq('id', appointmentId)
          .single()

        if (appointmentError) {
          setError('Appointment not found')
          return
        }

        setAppointment(appointmentData)
      } catch (err) {
        setError('Failed to load appointment details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (appointmentId) {
      fetchAppointmentDetails()
    }
  }, [appointmentId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'confirmed': return 'secondary'
      case 'scheduled': return 'outline'
      case 'cancelled': return 'destructive'
      case 'no_show': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPriorityBadge = (priority: boolean) => {
    return priority ? (
      <Badge variant="destructive" className="text-xs">High Priority</Badge>
    ) : null
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || 'Appointment not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Appointment Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
          {getPriorityBadge(appointment.priority)}
        </div>
      </div>

      {/* Appointment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Appointment #{appointment.id.slice(0, 8)}...
              </CardTitle>
              <CardDescription>
                {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Duration: {appointment.duration} minutes</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>Type: {appointment.appointment_type}</span>
              </div>
              {appointment.estimated_cost && (
                <div className="flex items-center space-x-3">
                  <span className="text-green-600 font-medium">Est. Cost: ₹{appointment.estimated_cost}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {appointment.confirmed_at && (
                <p className="text-sm text-gray-600">
                  Confirmed: {new Date(appointment.confirmed_at).toLocaleString()}
                </p>
              )}
              {appointment.arrived_at && (
                <p className="text-sm text-gray-600">
                  Arrived: {new Date(appointment.arrived_at).toLocaleString()}
                </p>
              )}
              {appointment.completed_at && (
                <p className="text-sm text-gray-600">
                  Completed: {new Date(appointment.completed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Appointment Notes</h4>
              <p className="text-blue-700">{appointment.notes}</p>
            </div>
          )}

          {appointment.patient_notes && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Patient Notes</h4>
              <p className="text-green-700">{appointment.patient_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient & Doctor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointment.patients && (
              <>
                <div>
                  <p className="font-medium text-lg">{appointment.patients.full_name}</p>
                  {appointment.patients.date_of_birth && (
                    <p className="text-sm text-gray-600">
                      Age: {Math.floor((Date.now() - new Date(appointment.patients.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  )}
                </div>
                {appointment.patients.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{appointment.patients.phone}</span>
                  </div>
                )}
                {appointment.patients.gender && (
                  <Badge variant="outline" className="text-xs">
                    {appointment.patients.gender}
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Doctor Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Doctor Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointment.users && (
              <>
                <div>
                  <p className="font-medium text-lg">{appointment.users.full_name}</p>
                  {appointment.users.specialization && (
                    <p className="text-sm text-gray-600">{appointment.users.specialization}</p>
                  )}
                </div>
                {appointment.users.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{appointment.users.phone}</span>
                  </div>
                )}
                {appointment.users.department && (
                  <Badge variant="outline" className="text-xs">
                    {appointment.users.department}
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services/Procedures */}
      {appointment.visit_services && appointment.visit_services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services & Procedures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointment.visit_services.map((visitService) => (
                <div key={visitService.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{visitService.services?.name}</p>
                    <p className="text-sm text-gray-600">{visitService.services?.category}</p>
                    {visitService.notes && (
                      <p className="text-xs text-gray-500 mt-1">{visitService.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Qty: {visitService.quantity}
                      </Badge>
                      <Badge variant={visitService.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {visitService.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-green-600">₹{visitService.total_price}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Administrative actions for this appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              className="w-full" 
              onClick={() => router.push(`/admin/patients/${appointment.patients?.id || appointment.patient_id}`)}
            >
              <User className="h-4 w-4 mr-2" />
              View Patient
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/admin/appointments/${appointment.id}/edit`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Edit Appointment
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Navigate to billing
                router.push(`/admin/billing?patient_id=${appointment.patient_id}&appointment_id=${appointment.id}`)
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Generate Bill
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.print()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Print Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}