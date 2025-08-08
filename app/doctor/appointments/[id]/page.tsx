'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, User, FileText, Phone, Edit, Pill } from 'lucide-react'
import type { Appointment } from '@/lib/types'

export default function DoctorAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<any>(null)
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
            patients(name, mobile, email, dob, gender, address),
            opd_records(
              id, consultation_notes, diagnosis, opd_status,
              prescriptions(
                id, dosage, frequency, duration, instructions,
                medicines(name, dosage_form)
              )
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
          <h1 className="text-2xl font-bold">Patient Consultation</h1>
        </div>
        <div className="flex space-x-2">
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Update Notes
          </Button>
          <Button variant="outline" size="sm">
            <Pill className="h-4 w-4 mr-2" />
            Prescribe
          </Button>
        </div>
      </div>

      {/* Appointment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {appointment.patients?.name}
                </CardTitle>
                <CardDescription>
                  {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                </CardDescription>
              </div>
            </div>
            <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
              {appointment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Duration: {appointment.duration} minutes</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <span>Type: {appointment.appointment_type}</span>
            </div>
            {appointment.patients?.dob && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-500" />
                <span>Age: {Math.floor((Date.now() - new Date(appointment.patients.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</span>
              </div>
            )}
          </div>

          {/* Patient Contact */}
          {appointment.patients && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {appointment.patients.mobile && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{appointment.patients.mobile}</span>
                </div>
              )}
              {appointment.patients.gender && (
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs">
                    {appointment.patients.gender}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Records */}
      {appointment.opd_records && appointment.opd_records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Consultation Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.opd_records.map((record: any) => (
              <div key={record.id} className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={record.opd_status === 'completed' ? 'default' : 'secondary'}>
                    {record.opd_status}
                  </Badge>
                </div>

                {record.consultation_notes && (
                  <div className="mb-3">
                    <h5 className="font-medium text-blue-800 mb-1">Consultation Notes</h5>
                    <p className="text-blue-700 text-sm">{record.consultation_notes}</p>
                  </div>
                )}

                {record.diagnosis && (
                  <div className="mb-3">
                    <h5 className="font-medium text-blue-800 mb-1">Diagnosis</h5>
                    <p className="text-blue-700 text-sm">{record.diagnosis}</p>
                  </div>
                )}

                {/* Prescriptions */}
                {record.prescriptions && record.prescriptions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Prescriptions</h5>
                    <div className="space-y-2">
                      {record.prescriptions.map((prescription: any) => (
                        <div key={prescription.id} className="p-3 bg-white rounded border-l-4 border-green-400">
                          <p className="font-medium text-sm">{prescription.medicines?.name}</p>
                          <div className="text-xs text-gray-600 space-x-4">
                            <span>{prescription.dosage}</span>
                            <span>{prescription.frequency}</span>
                            <span>{prescription.duration}</span>
                          </div>
                          {prescription.instructions && (
                            <p className="text-xs text-gray-700 mt-1 italic">
                              "{prescription.instructions}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Patient Notes */}
      {appointment.patient_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Patient's Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-700">{appointment.patient_notes}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full" onClick={() => {
              // Handle start consultation
              console.log('Start consultation')
            }}>
              <FileText className="h-4 w-4 mr-2" />
              {appointment.status === 'completed' ? 'View Records' : 'Start Consultation'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              // Handle prescribe medicine
              console.log('Prescribe medicine')
            }}>
              <Pill className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              // Handle reschedule
              console.log('Reschedule appointment')
            }}>
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}