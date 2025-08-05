'use client'

import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, User, Plus, AlertCircle, CheckCircle } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  phone: string
}

interface Visit {
  id: string
  visit_number: string
  patient_id: string
  visit_date: string
  status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
  chief_complaint: string
  queue_number: number
  estimated_wait_time: number
  created_at: string
  patients: Patient
}

export default function QueuePage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [complaint, setComplaint] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  // const router = useRouter() // Reserved for future navigation features

  useEffect(() => {
    fetchTodaysQueue()
    fetchPatients()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTodaysQueue = async () => {
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
            phone
          )
        `)
        .eq('visit_date', today)
        .order('queue_number', { ascending: true })

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error('Error fetching queue:', error)
      setError('Failed to load today&apos;s queue')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_number, first_name, last_name, phone')
        .order('first_name', { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const addToQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedPatient || !complaint.trim()) {
      setError('Please select a patient and enter chief complaint')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      // Calculate next queue number
      const nextQueueNumber = visits.length + 1

      const { error } = await supabase
        .from('visits')
        .insert([{
          patient_id: selectedPatient,
          visit_date: new Date().toISOString().split('T')[0],
          status: 'waiting',
          chief_complaint: complaint,
          queue_number: nextQueueNumber,
          estimated_wait_time: nextQueueNumber * 15, // 15 mins per patient estimate
          created_by: user?.id
        }])
        .select(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          )
        `)

      if (error) throw error

      const patient = patients.find(p => p.id === selectedPatient)
      setSuccess(`${patient?.first_name} ${patient?.last_name} added to queue at position ${nextQueueNumber}`)
      
      setSelectedPatient('')
      setComplaint('')
      setShowForm(false)
      fetchTodaysQueue()
    } catch (error) {
      console.error('Error adding to queue:', error)
      setError('Failed to add patient to queue')
    }
  }

  const updateVisitStatus = async (visitId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          status: newStatus,
          actual_start_time: newStatus === 'in_consultation' ? new Date().toISOString() : undefined,
          actual_end_time: newStatus === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', visitId)

      if (error) throw error
      
      fetchTodaysQueue()
      if (newStatus === 'in_consultation') {
        setSuccess('Consultation started! Patient ready for doctor.')
      } else {
        setSuccess('Visit status updated successfully')
      }
    } catch (error) {
      console.error('Error updating visit status:', error)
      setError('Failed to update visit status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'in_consultation': return 'bg-blue-100 text-blue-800'
      case 'services_pending': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'billed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4" />
      case 'in_consultation': return <User className="h-4 w-4" />
      case 'services_pending': return <AlertCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const waitingCount = visits.filter(v => v.status === 'waiting').length
  const inConsultationCount = visits.filter(v => v.status === 'in_consultation').length
  const completedCount = visits.filter(v => v.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Manage today&apos;s patient queue and appointments</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add to Queue
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{waitingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Consultation</p>
                <p className="text-2xl font-bold text-blue-600">{inConsultationCount}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add to Queue Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Patient to Queue</CardTitle>
            <CardDescription>Select a patient and add them to today&apos;s consultation queue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addToQueue} className="space-y-4">
              <div>
                <Label htmlFor="patient_search">Search Patient</Label>
                <Input
                  id="patient_search"
                  placeholder="Search by name or patient number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="patient_select">Select Patient *</Label>
                <select
                  id="patient_select"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a patient...</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="complaint">Chief Complaint *</Label>
                <textarea
                  id="complaint"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Main reason for visit..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add to Queue</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Today's Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today&apos;s Queue ({visits.length} patients)
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-lg">
                        #{visit.queue_number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {visit.patients.first_name} {visit.patients.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">{visit.patients.patient_number}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(visit.status)}`}>
                        {getStatusIcon(visit.status)}
                        {visit.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>Chief Complaint:</strong> {visit.chief_complaint}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Registered at: {new Date(visit.created_at).toLocaleTimeString()}
                      {visit.estimated_wait_time > 0 && (
                        <span className="ml-4">
                          Est. wait: {visit.estimated_wait_time} mins
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {visit.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => updateVisitStatus(visit.id, 'in_consultation')}
                      >
                        Start Consultation
                      </Button>
                    )}
                    {visit.status === 'in_consultation' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVisitStatus(visit.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {visits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No patients in queue today
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}