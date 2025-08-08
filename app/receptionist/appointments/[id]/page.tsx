'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, User, Phone, CreditCard, CheckCircle } from 'lucide-react'
import type { Appointment } from '@/lib/types'

interface AppointmentWithDetails extends Appointment {
  patients?: {
    full_name: string
    phone?: string
    email?: string
    date_of_birth?: string
    gender?: string
    address?: string
    emergency_contact_name?: string
  }
  users?: {
    full_name: string
    phone?: string
    specialization?: string
    department?: string
  }
  invoices?: Array<{
    id: string
    total_amount: number
    payment_status: string
    balance_amount: number
  }>
}

export default function ReceptionistAppointmentDetailPage() {
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
            patients(full_name, phone, email, date_of_birth, gender, address, emergency_contact_name),
            users(full_name, phone, specialization, department),
            invoices(id, total_amount, payment_status, balance_amount)
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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus }
      
      // Add timestamp based on status
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString()
          break
        case 'arrived':
          updateData.arrived_at = new Date().toISOString()
          break
        case 'completed':
          updateData.completed_at = new Date().toISOString()
          break
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()
          break
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)

      if (error) {
        console.error('Failed to update appointment status:', error)
        return
      }

      // Update local state
      setAppointment(prev => ({
        ...prev,
        status: newStatus,
        ...updateData
      }))
    } catch (err) {
      console.error('Error updating appointment status:', err)
    }
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

  const getStatusActions = () => {
    switch (appointment.status) {
      case 'scheduled':
        return (
          <>
            <Button size="sm" onClick={() => handleStatusUpdate('confirmed')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('cancelled')}>
              Cancel
            </Button>
          </>
        )
      case 'confirmed':
        return (
          <>
            <Button size="sm" onClick={() => handleStatusUpdate('arrived')}>
              <User className="h-4 w-4 mr-2" />
              Mark Arrived
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </>
        )
      case 'arrived':
        return (
          <Button size="sm" onClick={() => handleStatusUpdate('in_progress')}>
            Start Consultation
          </Button>
        )
      default:
        return null
    }
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
          <h1 className="text-2xl font-bold">Appointment Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
            {appointment.status}
          </Badge>
          {appointment.priority && (
            <Badge variant="destructive" className="text-xs">High Priority</Badge>
          )}
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
                {appointment.patients?.full_name} with Dr. {appointment.users?.full_name}
              </CardTitle>
              <CardDescription>
                {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Duration: {appointment.duration} minutes</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>Type: {appointment.appointment_type}</span>
            </div>
            {appointment.estimated_cost && (
              <div className="flex items-center space-x-3">
                <span className="text-green-600 font-medium">Est. Cost: ₹{appointment.estimated_cost}</span>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="flex space-x-2 pt-4 border-t">
            {getStatusActions()}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Patient Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.patients && (
              <>
                <div>
                  <p className="font-medium text-lg">{appointment.patients.full_name}</p>
                  {appointment.patients.date_of_birth && (
                    <p className="text-sm text-gray-600">
                      Age: {Math.floor((Date.now() - new Date(appointment.patients.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {appointment.patients.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{appointment.patients.phone}</span>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        Call
                      </Button>
                    </div>
                  )}
                  
                  {appointment.patients.emergency_contact_name && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Emergency Contact</p>
                      <p className="text-sm text-red-600">{appointment.patients.emergency_contact_name}</p>
                    </div>
                  )}
                </div>

                {appointment.patients.gender && (
                  <Badge variant="outline" className="text-xs">
                    {appointment.patients.gender}
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Doctor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Doctor Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.users && (
              <>
                <div>
                  <p className="font-medium text-lg">Dr. {appointment.users.full_name}</p>
                  <p className="text-sm text-gray-600">{appointment.users.specialization}</p>
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

      {/* Billing Information */}
      {appointment.invoices && appointment.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <span>Billing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointment.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Invoice #{invoice.id.slice(0, 8)}...</p>
                    <p className="text-sm text-gray-600">Total: ₹{invoice.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      invoice.payment_status === 'completed' ? 'default' :
                      invoice.payment_status === 'partial' ? 'secondary' : 'destructive'
                    }>
                      {invoice.payment_status}
                    </Badge>
                    {invoice.balance_amount > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Balance: ₹{invoice.balance_amount}
                      </p>
                    )}
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="w-full">
              <User className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <Button variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Generate Bill
            </Button>
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}