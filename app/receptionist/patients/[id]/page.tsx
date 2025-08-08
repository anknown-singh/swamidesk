'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Heart, CreditCard, FileText } from 'lucide-react'
import type { Patient } from '@/lib/types'

interface PatientWithDetails extends Patient {
  appointments?: Array<{
    id: string
    scheduled_date: string
    scheduled_time: string
    status: string
    estimated_cost?: number
    users?: {
      full_name: string
      specialization?: string
    }
  }>
  invoices?: Array<{
    id: string
    invoice_number: string
    total_amount: number
    amount_paid: number
    balance_amount: number
    payment_status: string
    created_at: string
  }>
}

export default function ReceptionistPatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<PatientWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const patientId = params.id as string

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        // Fetch patient basic info
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single()

        if (patientError) {
          setError('Patient not found')
          return
        }

        // Fetch receptionist-specific related data
        const [appointmentsRes, invoicesRes] = await Promise.all([
          supabase
            .from('appointments')
            .select(`
              *,
              users(full_name, specialization)
            `)
            .eq('patient_id', patientId)
            .order('scheduled_date', { ascending: false })
            .limit(10),
          
          supabase
            .from('invoices')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(10)
        ])

        setPatient({
          ...patientData,
          appointments: appointmentsRes.data || [],
          invoices: invoicesRes.data || []
        })
      } catch (err) {
        setError('Failed to load patient details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatientDetails()
    }
  }, [patientId])

  const getTotalOutstanding = () => {
    return patient?.invoices?.reduce((sum, invoice) => sum + (invoice.balance_amount || 0), 0) || 0
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

  if (error || !patient) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || 'Patient not found'}</p>
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
          <h1 className="text-2xl font-bold">Patient Profile</h1>
        </div>
        <div className="flex space-x-2">
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{patient.full_name}</CardTitle>
              <CardDescription>Patient ID: {patient.id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Born: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center space-x-3">
                <Heart className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{patient.gender}</span>
              </div>
            )}
          </div>

          {patient.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <span>{patient.address}</span>
            </div>
          )}

          {patient.emergency_contact_name && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Emergency Contact</h4>
              <p className="text-red-600">{patient.emergency_contact_name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{patient.appointments?.length || 0}</div>
            <p className="text-sm text-gray-600">Total Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{patient.invoices?.length || 0}</div>
            <p className="text-sm text-gray-600">Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-600">₹{getTotalOutstanding()}</div>
            <p className="text-sm text-gray-600">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {patient.appointments?.filter(apt => apt.status === 'completed').length || 0}
            </div>
            <p className="text-sm text-gray-600">Completed Visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      {patient.appointments && patient.appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{appointment.users?.full_name || 'Unknown Doctor'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                    </p>
                    <p className="text-xs text-gray-500">{appointment.users?.specialization}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                      {appointment.status}
                    </Badge>
                    {appointment.estimated_cost && (
                      <Badge variant="outline">
                        ₹{appointment.estimated_cost}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {patient.invoices && patient.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Total: ₹{invoice.total_amount}</span>
                      <span>Paid: ₹{invoice.amount_paid}</span>
                      <span>Balance: ₹{invoice.balance_amount}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      invoice.payment_status === 'completed' ? 'default' :
                      invoice.payment_status === 'partial' ? 'secondary' : 'destructive'
                    }>
                      {invoice.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}