'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Heart,
  Activity,
  Stethoscope,
  FileSearch,
  Pill,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Send
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Patient {
  id: string
  full_name: string
  phone: string
  date_of_birth: string
  gender: string
  medical_history: string
  allergies: string
}

interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  status: string
  chief_complaint: string
  visit_date: string
  token_number: number
  diagnosis: string
  notes: string
  created_at: string
  patients: Patient
  users: {
    id: string
    full_name: string
    email: string
  }
}

export default function ConsultationSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const visitId = params.visitId as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVisitData = async () => {
      try {
        // First load the visit with patient data
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients (
              id,
              full_name,
              phone,
              date_of_birth,
              gender,
              medical_history,
              allergies
            )
          `)
          .eq('id', visitId)
          .single()

        if (visitError) throw visitError

        // Then load the doctor data separately
        let doctorData = null
        if (visitData.doctor_id) {
          const { data: doctor, error: doctorError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', visitData.doctor_id)
            .limit(1)
            .single()

          if (!doctorError && doctor) {
            doctorData = doctor
          } else {
            // Fallback: create placeholder doctor info
            doctorData = {
              id: visitData.doctor_id,
              full_name: 'Attending Doctor',
              email: 'doctor@hospital.com'
            }
          }
        }

        // Combine the data
        setVisit({
          ...visitData,
          users: doctorData
        })
      } catch (err) {
        console.error('Error loading visit data:', err)
        setError('Failed to load consultation summary')
      } finally {
        setLoading(false)
      }
    }

    if (visitId) {
      loadVisitData()
    }
  }, [visitId, supabase])

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} years`
  }

  const exportSummary = () => {
    // Export functionality - could generate PDF
    alert('Export functionality coming soon')
  }

  const sendToPatient = () => {
    // Email functionality
    alert('Email functionality coming soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading consultation summary...</p>
        </div>
      </div>
    )
  }

  if (error || !visit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Consultation Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || 'Visit data could not be loaded'}</p>
          <Button onClick={() => router.push('/doctor/consultations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Consultations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            <h1 className="text-2xl font-bold">Consultation Summary</h1>
          </div>
          <p className="text-muted-foreground">
            Completed consultation details and medical records
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/doctor/consultations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Consultations
        </Button>
      </div>

      {/* Patient & Visit Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Patient & Visit Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{visit.patients.full_name}</h4>
                <Badge variant="outline" className="mt-1">
                  Token #{visit.token_number}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Age:</strong> {calculateAge(visit.patients.date_of_birth)}
                </p>
                <p className="text-sm">
                  <strong>Gender:</strong> {visit.patients.gender}
                </p>
                <p className="text-sm">
                  <strong>Phone:</strong> {visit.patients.phone}
                </p>
                <p className="text-sm">
                  <strong>Date of Birth:</strong> {new Date(visit.patients.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm">
                  <strong>Attending Doctor:</strong> Dr. {visit.users.full_name}
                </p>
                <p className="text-sm">
                  <strong>Visit Date:</strong> {new Date(visit.visit_date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong> 
                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                    {visit.status}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Started:</strong> {new Date(visit.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaints & Diagnosis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Consultation Overview
          </CardTitle>
          <CardDescription>
            Primary concerns and diagnosis from the consultation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chief Complaint */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-medium">Chief Complaint</h4>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-700">{visit.chief_complaint || 'Not specified'}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">Final Diagnosis</h4>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700">{visit.diagnosis || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Medical History & Allergies */}
          {(visit.patients.medical_history || visit.patients.allergies) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {visit.patients.medical_history && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <h4 className="font-medium">Medical History</h4>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-700">{visit.patients.medical_history}</p>
                  </div>
                </div>
              )}

              {visit.patients.allergies && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h4 className="font-medium">Allergies</h4>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">{visit.patients.allergies}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Examination & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Clinical Examination & Notes
          </CardTitle>
          <CardDescription>
            Physical examination findings and clinical observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visit.notes ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">Clinical Notes:</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.notes}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h4 className="font-medium mb-2">No examination notes recorded</h4>
              <p className="text-sm">Clinical examination findings would appear here</p>
            </div>
          )}
          
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Detailed vital signs, physical examination findings, and other clinical 
              data from the consultation workflow would appear here if the full consultation forms were completed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Treatment & Management Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-green-500" />
            Treatment & Management Plan
          </CardTitle>
          <CardDescription>
            Treatment recommendations, medications, and follow-up instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(visit.diagnosis || visit.notes) ? (
            <div className="space-y-6">
              {visit.diagnosis && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-green-600" />
                    Final Diagnosis:
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-700">{visit.diagnosis}</p>
                  </div>
                </div>
              )}
              
              {visit.notes && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Treatment Notes:
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.notes}</p>
                  </div>
                </div>
              )}

              {/* Prescription Link */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-sm text-green-800 mb-1">Create Prescription</h5>
                    <p className="text-xs text-green-700">Generate a prescription based on this consultation</p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/doctor/prescriptions/new?patient_id=${visit.patients.id}&visit_id=${visit.id}`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Prescribe
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h4 className="font-medium mb-2">No treatment plan recorded</h4>
              <p className="text-sm">Treatment recommendations would appear here</p>
            </div>
          )}
          
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Detailed medication prescriptions, dosages, treatment plans, and follow-up 
              instructions from the consultation workflow would appear here if the full consultation forms were completed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => router.push('/doctor/consultations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Consultations
            </Button>
            
            <div className="flex-1" />
            
            <Button variant="outline" onClick={exportSummary}>
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
            
            <Button variant="outline" onClick={sendToPatient}>
              <Send className="w-4 h-4 mr-2" />
              Send to Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visit Summary */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          This consultation summary shows the available data from the visit record. For consultations 
          completed through the full consultation workflow, additional detailed information including 
          vital signs, examination findings, and comprehensive treatment plans would be displayed.
        </AlertDescription>
      </Alert>
    </div>
  )
}