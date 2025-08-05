'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Stethoscope, User, Clock, FileText, Save, Search, Calendar } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  gender: string
  medical_history: string
  allergies: string
}

interface Visit {
  id: string
  visit_number: string
  patient_id: string
  visit_date: string
  status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
  chief_complaint: string
  diagnosis: string
  notes: string
  queue_number: number
  actual_start_time: string
  actual_end_time: string
  created_at: string
  patients: Patient
}

export default function ConsultationsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchConsultations()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConsultations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            medical_history,
            allergies
          )
        `)
        .eq('visit_date', today)
        .in('status', ['waiting', 'in_consultation', 'completed'])
        .order('queue_number', { ascending: true })

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error('Error fetching consultations:', error)
      setError('Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }

  const startConsultation = async (visit: Visit) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          status: 'in_consultation',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', visit.id)

      if (error) throw error

      setActiveVisit({...visit, status: 'in_consultation'})
      setDiagnosis(visit.diagnosis || '')
      setNotes(visit.notes || '')
      fetchConsultations()
      setSuccess('Consultation started')
    } catch (error) {
      console.error('Error starting consultation:', error)
      setError('Failed to start consultation')
    }
  }

  const saveConsultation = async () => {
    if (!activeVisit) return

    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          diagnosis,
          notes,
          status: 'services_pending'
        })
        .eq('id', activeVisit.id)

      if (error) throw error

      setSuccess('Consultation notes saved')
      fetchConsultations()
    } catch (error) {
      console.error('Error saving consultation:', error)
      setError('Failed to save consultation')
    }
  }

  const completeConsultation = async () => {
    if (!activeVisit) return

    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          diagnosis,
          notes,
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', activeVisit.id)

      if (error) throw error

      setSuccess('Consultation completed! Ready to create prescription.')
      setActiveVisit(null)
      setDiagnosis('')
      setNotes('')
      fetchConsultations()
    } catch (error) {
      console.error('Error completing consultation:', error)
      setError('Failed to complete consultation')
    }
  }


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

  const filteredVisits = visits.filter(visit =>
    visit.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const waitingVisits = filteredVisits.filter(v => v.status === 'waiting')
  const inConsultationVisits = filteredVisits.filter(v => v.status === 'in_consultation')
  const completedVisits = filteredVisits.filter(v => v.status === 'completed')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading consultations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
          <p className="text-muted-foreground">Manage patient consultations and medical records</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>{success}</span>
            {success.includes('prescription') && (
              <Button size="sm" onClick={() => router.push('/doctor/prescriptions')}>
                Create Prescription
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search patients by name, ID, or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">
              {filteredVisits.length} consultations today
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Queue */}
        <div className="space-y-6">
          {/* Waiting Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                Waiting ({waitingVisits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waitingVisits.map((visit) => (
                  <div key={visit.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                            #{visit.queue_number}
                          </span>
                          <h4 className="font-semibold">
                            {visit.patients.first_name} {visit.patients.last_name}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Complaint:</strong> {visit.chief_complaint}
                        </p>
                        <p className="text-xs text-gray-500">
                          {visit.patients.patient_number} • {calculateAge(visit.patients.date_of_birth)}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => startConsultation(visit)}
                        className="shrink-0"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
                {waitingVisits.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No patients waiting
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* In Consultation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Stethoscope className="h-5 w-5" />
                In Consultation ({inConsultationVisits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inConsultationVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      activeVisit?.id === visit.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setActiveVisit(visit)
                      setDiagnosis(visit.diagnosis || '')
                      setNotes(visit.notes || '')
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                          #{visit.queue_number}
                        </span>
                        <h4 className="font-semibold">
                          {visit.patients.first_name} {visit.patients.last_name}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Complaint:</strong> {visit.chief_complaint}
                      </p>
                      <p className="text-xs text-gray-500">
                        Started: {visit.actual_start_time ? new Date(visit.actual_start_time).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
                {inConsultationVisits.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No active consultations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultation Form */}
        <div>
          {activeVisit ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {activeVisit.patients.first_name} {activeVisit.patients.last_name}
                </CardTitle>
                <CardDescription>
                  {activeVisit.patients.patient_number} • {calculateAge(activeVisit.patients.date_of_birth)} • {activeVisit.patients.gender}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Chief Complaint</h4>
                  <p className="text-sm">{activeVisit.chief_complaint}</p>
                </div>

                {/* Medical History */}
                {(activeVisit.patients.medical_history || activeVisit.patients.allergies) && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Medical History & Allergies</h4>
                    {activeVisit.patients.medical_history && (
                      <p className="text-sm mb-2">
                        <strong>History:</strong> {activeVisit.patients.medical_history}
                      </p>
                    )}
                    {activeVisit.patients.allergies && (
                      <p className="text-sm text-red-600">
                        <strong>Allergies:</strong> {activeVisit.patients.allergies}
                      </p>
                    )}
                  </div>
                )}

                {/* Diagnosis */}
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-20"
                    placeholder="Enter diagnosis..."
                  />
                </div>

                {/* Clinical Notes */}
                <div>
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-24"
                    placeholder="Enter clinical notes, observations, treatment plan..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={saveConsultation} variant="outline" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Notes
                  </Button>
                  <Button onClick={completeConsultation} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Complete Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Active Consultation</h3>
                  <p>Select a patient from the queue to start consultation</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completed Consultations */}
      {completedVisits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <FileText className="h-5 w-5" />
              Completed Today ({completedVisits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedVisits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-3 bg-green-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
                        #{visit.queue_number}
                      </span>
                      <h4 className="font-semibold">
                        {visit.patients.first_name} {visit.patients.last_name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Diagnosis:</strong> {visit.diagnosis || 'Not specified'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Completed: {visit.actual_end_time ? new Date(visit.actual_end_time).toLocaleTimeString() : 'N/A'}
                    </p>
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