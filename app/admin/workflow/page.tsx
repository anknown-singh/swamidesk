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
  FileText,
  BarChart3,
  Settings
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
  totalVisits: number
  completedVisits: number
}

export default function AdminWorkflowPage() {
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
          .limit(50)

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

        // Fetch comprehensive workflow statistics
        const [visitsRes, opdRes, appointmentsRes, invoicesRes] = await Promise.all([
          supabase.from('visits').select('id, status, created_at').limit(200),
          supabase.from('opd_records').select('id, opd_status, created_at').limit(200),
          supabase.from('appointments').select('id, status, scheduled_date').limit(200),
          supabase.from('invoices').select('id, payment_status, created_at').limit(200)
        ])

        const today = new Date().toISOString().split('T')[0]
        const visits = visitsRes.data || []
        
        setStats({
          totalPatients: patientsData?.length || 0,
          activeWorkflows: visits.filter(v => ['waiting', 'in_consultation'].includes(v.status)).length,
          completedToday: visits.filter(v => 
            v.status === 'completed' && v.created_at.startsWith(today)
          ).length,
          pendingConsultations: visits.filter(v => 
            ['waiting', 'in_consultation'].includes(v.status)
          ).length,
          totalVisits: visits.length,
          completedVisits: visits.filter(v => v.status === 'completed').length
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
        <div className="text-lg">Loading admin workflow dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Care Workflow Management</h1>
          <p className="text-muted-foreground">
            Oversee and manage complete patient care workflows across the medical center
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/admin/reports'}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Workflow Reports
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin/settings'}>
            <Settings className="h-4 w-4 mr-2" />
            Workflow Settings
          </Button>
        </div>
      </div>

      {/* Enhanced Workflow Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.pendingConsultations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Total Visits</span>
              </div>
              <div className="text-2xl font-bold text-indigo-600">{stats.totalVisits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium">Completion Rate</span>
              </div>
              <div className="text-2xl font-bold text-teal-600">
                {stats.totalVisits > 0 ? Math.round((stats.completedVisits / stats.totalVisits) * 100) : 0}%
              </div>
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
              Patient Selection
            </CardTitle>
            <CardDescription>
              Choose a patient to review or manage their care workflow
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.href = `/admin/patients/${selectedPatient.id}`}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Patient Details
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients.slice(0, 20).map((patient) => (
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
                        <div className="text-xs text-muted-foreground">
                          Registered: {new Date(patient.created_at).toLocaleDateString()}
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
                    Select a patient from the list above to review their care workflow progress and manage their treatment plan.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Management Panel */}
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
                <CardTitle className="mb-2">Patient Care Workflow Management</CardTitle>
                <CardDescription className="mb-6 max-w-md mx-auto">
                  Select a patient from the list to review and manage their complete care journey. Monitor workflow progress, identify bottlenecks, and ensure optimal patient care delivery.
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">Workflow Monitoring</Badge>
                    </div>
                    <h3 className="font-medium mb-1">Track Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor patient workflow progress across all departments
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-100 text-green-800">Quality Assurance</Badge>
                    </div>
                    <h3 className="font-medium mb-1">Ensure Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify compliance and maintain care quality standards
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">Resource Management</Badge>
                    </div>
                    <h3 className="font-medium mb-1">Optimize Resources</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage staff allocation and resource utilization
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-orange-100 text-orange-800">Performance Analytics</Badge>
                    </div>
                    <h3 className="font-medium mb-1">Analyze Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Review completion rates and workflow efficiency
                    </p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Administrative Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrative Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/admin/patients'}
            >
              <Users className="h-4 w-4 mr-2" />
              Patient Management
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/admin/queue'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Queue Overview
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/admin/consultations'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Consultation Review
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/admin/reports'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Workflow Reports
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}