'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PatientWorkflowGuide } from '@/components/workflow/patient-workflow-guide'
import {
  Search,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  ArrowRight,
  FileText
} from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  phone: string
  email: string
  created_at: string
}

interface WorkflowStats {
  totalPatients: number
  activeWorkflows: number
  completedToday: number
  pendingConsultations: number
}

export default function DoctorWorkflowPage() {
  const searchParams = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Get patient ID from URL params if navigating from patient detail
  const urlPatientId = searchParams.get('patientId')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent patients
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, full_name, phone, email, created_at')
          .order('created_at', { ascending: false })
          .limit(20)

        if (patientsData) {
          setPatients(patientsData)
          
          // If URL has patient ID, select that patient
          if (urlPatientId) {
            const patient = patientsData.find(p => p.id === urlPatientId)
            if (patient) {
              setSelectedPatient(patient)
            }
          }
        }

        // Fetch workflow statistics
        const [visitsRes, opdRes, appointmentsRes] = await Promise.all([
          supabase.from('visits').select('id, status, created_at').limit(100),
          supabase.from('opd_records').select('id, opd_status, created_at').limit(100),
          supabase.from('appointments').select('id, status, scheduled_date').limit(100)
        ])

        const today = new Date().toISOString().split('T')[0]
        
        setStats({
          totalPatients: patientsData?.length || 0,
          activeWorkflows: visitsRes.data?.filter(v => v.status === 'in_consultation').length || 0,
          completedToday: visitsRes.data?.filter(v => 
            v.status === 'completed' && v.created_at.startsWith(today)
          ).length || 0,
          pendingConsultations: visitsRes.data?.filter(v => 
            ['waiting', 'in_consultation'].includes(v.status)
          ).length || 0
        })

      } catch (error) {
        console.error('Error fetching workflow data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [urlPatientId, supabase])

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading workflow dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Care Workflow</h1>
          <p className="text-muted-foreground">
            Manage complete patient journey from registration to treatment completion
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/receptionist/patients'}>
            <Users className="h-4 w-4 mr-2" />
            Register New Patient
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/doctor/queue'}>
            <Activity className="h-4 w-4 mr-2" />
            Patient Queue
          </Button>
        </div>
      </div>

      {/* Workflow Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Patients</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Active Workflows</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.activeWorkflows}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completed Today</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Pending Consultations</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.pendingConsultations}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Select Patient
            </CardTitle>
            <CardDescription>
              Choose a patient to start or continue their care workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search patients by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              {selectedPatient && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{selectedPatient.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient.phone} • {selectedPatient.email}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{patient.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.phone}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {filteredPatients.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No patients found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>

              {!selectedPatient && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select a patient from the list above to begin or continue their care workflow.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Guide Panel */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <PatientWorkflowGuide
              patientId={selectedPatient.id}
              currentStep="opd_creation"
              isExistingPatient={true}
              className="w-full"
            />
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">Patient Care Workflow</CardTitle>
                <CardDescription className="mb-6 max-w-md mx-auto">
                  Select a patient from the list to start their complete care journey from registration through treatment completion.
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">Step 1-2</Badge>
                      <span className="font-medium">Registration & OPD</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Patient registration and OPD record creation
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-100 text-green-800">Step 3-4</Badge>
                      <span className="font-medium">Consultation & Planning</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Medical consultation and treatment planning
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">Step 5-6</Badge>
                      <span className="font-medium">Treatment & Pharmacy</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Medicine prescription and dispensing
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-orange-100 text-orange-800">Step 7</Badge>
                      <span className="font-medium">Completion</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Visit completion and follow-up scheduling
                    </p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/receptionist/patients'}
            >
              <Users className="h-4 w-4 mr-2" />
              Register New Patient
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/doctor/queue'}
            >
              <Activity className="h-4 w-4 mr-2" />
              View Patient Queue
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/doctor/consultations'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Active Consultations
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/doctor/appointments'}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today's Appointments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}