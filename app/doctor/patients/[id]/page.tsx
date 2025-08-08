'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Phone, Mail, Calendar, Heart, FileText, Pill } from 'lucide-react'
import type { Patient } from '@/lib/types'

interface PatientWithDetails extends Patient {
  appointments?: any[]
  prescriptions?: any[]
  opd_records?: any[]
}

export default function DoctorPatientDetailPage() {
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
          .eq('patient_id', patientId)
          .single()

        if (patientError) {
          setError('Patient not found')
          return
        }

        // Fetch doctor-specific related data
        const [appointmentsRes, prescriptionsRes, opdRecordsRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('scheduled_date', { ascending: false })
            .limit(10),
          
          supabase
            .from('prescriptions')
            .select(`
              *,
              medicines(name, dosage_form, unit_price)
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(10),
          
          supabase
            .from('opd_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('visit_date', { ascending: false })
            .limit(10)
        ])

        setPatient({
          ...patientData,
          appointments: appointmentsRes.data || [],
          prescriptions: prescriptionsRes.data || [],
          opd_records: opdRecordsRes.data || []
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
          <h1 className="text-2xl font-bold">Patient Medical Records</h1>
        </div>
        <div className="flex space-x-2">
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            New Consultation
          </Button>
          <Button variant="outline" size="sm">
            <Pill className="h-4 w-4 mr-2" />
            Prescribe
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
              <CardTitle className="text-xl">{patient.name}</CardTitle>
              <CardDescription>Patient ID: {patient.patient_id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patient.mobile && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patient.mobile}</span>
              </div>
            )}
            {patient.dob && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Age: {Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center space-x-3">
                <Heart className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{patient.gender}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical History Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{patient.appointments?.length || 0}</div>
            <p className="text-sm text-gray-600">Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{patient.opd_records?.length || 0}</div>
            <p className="text-sm text-gray-600">Consultations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{patient.prescriptions?.length || 0}</div>
            <p className="text-sm text-gray-600">Prescriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prescriptions */}
      {patient.prescriptions && patient.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.prescriptions.slice(0, 5).map((prescription: any) => (
                <div key={prescription.id} className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{(prescription.medicines as any)?.name}</p>
                      <p className="text-sm text-gray-600">
                        {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                      </p>
                      <p className="text-xs text-gray-500">
                        Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {(prescription.medicines as any)?.dosage_form}
                    </Badge>
                  </div>
                  {prescription.instructions && (
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border-l-2 border-green-400">
                      {prescription.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Consultations */}
      {patient.opd_records && patient.opd_records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.opd_records.slice(0, 5).map((record: any) => (
                <div key={record.id} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Visit on {new Date(record.visit_date).toLocaleDateString()}</p>
                    <Badge variant={record.opd_status === 'completed' ? 'default' : 'secondary'}>
                      {record.opd_status}
                    </Badge>
                  </div>
                  {record.consultation_notes && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Notes:</strong> {record.consultation_notes}
                    </p>
                  )}
                  {record.diagnosis && (
                    <p className="text-sm text-gray-600">
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}