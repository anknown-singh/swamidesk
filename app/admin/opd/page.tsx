'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  CheckCircle,
  Stethoscope,
  FileText,
  ArrowRight,
  Activity,
  Calendar,
  Phone
} from 'lucide-react'
import { OPDManagement } from '@/components/opd/opd-management'
import { AdminReviewDashboard } from '@/components/opd/admin-review-dashboard'
import { createClient } from '@/lib/supabase/client'

interface OPDStats {
  totalPatients: number
  waitingConsultation: number
  inConsultation: number
  servicesRequired: number
  medicinesRequired: number
  completed: number
}

interface PatientFlow {
  id: string
  patient_name: string
  patient_phone: string
  opd_number: string
  current_stage: 'registration' | 'consultation' | 'services' | 'pharmacy' | 'billing' | 'completed'
  stage_time: string
  next_action: string
}

export default function AdminOPDPage() {
  const [stats, setStats] = useState<OPDStats>({
    totalPatients: 0,
    waitingConsultation: 0,
    inConsultation: 0,
    servicesRequired: 0,
    medicinesRequired: 0,
    completed: 0
  })
  const [patientFlow, setPatientFlow] = useState<PatientFlow[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchOPDStats()
    fetchPatientFlow()
  }, [])

  const fetchOPDStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get visit statistics for today
      const { data: visits } = await supabase
        .from('visits')
        .select('status, visit_date')
        .eq('visit_date', today)

      if (visits) {
        setStats({
          totalPatients: visits.length,
          waitingConsultation: visits.filter(v => v.status === 'waiting').length,
          inConsultation: visits.filter(v => v.status === 'in_consultation').length,
          servicesRequired: visits.filter(v => v.status === 'services_pending').length,
          medicinesRequired: 0, // This would need pharmacy integration
          completed: visits.filter(v => v.status === 'completed').length
        })
      }
    } catch (error) {
      console.error('Error fetching OPD stats:', error)
    }
  }

  const fetchPatientFlow = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get current patient flow (simplified example)
      const { data: visits } = await supabase
        .from('visits')
        .select(`
          id,
          status,
          visit_time,
          patients (
            full_name,
            phone
          )
        `)
        .eq('visit_date', today)
        .order('visit_time')

      if (visits) {
        const flow: PatientFlow[] = visits.map((visit, index) => {
          let stage: PatientFlow['current_stage'] = 'registration'
          let nextAction = 'Start consultation'
          
          switch (visit.status) {
            case 'waiting':
              stage = 'consultation'
              nextAction = 'Doctor consultation needed'
              break
            case 'in_consultation':
              stage = 'consultation'
              nextAction = 'Consultation in progress'
              break
            case 'services_pending':
              stage = 'services'
              nextAction = 'Procedures required'
              break
            case 'completed':
              stage = 'completed'
              nextAction = 'Visit completed'
              break
            default:
              stage = 'registration'
              nextAction = 'Registration needed'
          }

          return {
            id: visit.id,
            patient_name: Array.isArray(visit.patients) ? visit.patients[0]?.full_name || 'Unknown' : visit.patients?.full_name || 'Unknown',
            patient_phone: Array.isArray(visit.patients) ? visit.patients[0]?.phone || '' : visit.patients?.phone || '',
            opd_number: `OPD${String(index + 1).padStart(3, '0')}`,
            current_stage: stage,
            stage_time: visit.visit_time || '',
            next_action: nextAction
          }
        })
        
        setPatientFlow(flow)
      }
    } catch (error) {
      console.error('Error fetching patient flow:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'registration': return <Users className="h-4 w-4" />
      case 'consultation': return <Stethoscope className="h-4 w-4" />
      case 'services': return <Activity className="h-4 w-4" />
      case 'pharmacy': return <FileText className="h-4 w-4" />
      case 'billing': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'registration': return 'bg-blue-100 text-blue-800'
      case 'consultation': return 'bg-orange-100 text-orange-800'
      case 'services': return 'bg-purple-100 text-purple-800'
      case 'pharmacy': return 'bg-green-100 text-green-800'
      case 'billing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPD - Outpatient Department</h1>
          <p className="text-muted-foreground">
            Complete patient journey management from registration to billing
          </p>
        </div>
        <Button onClick={() => window.location.href = '/admin/consultations'}>
          <Stethoscope className="h-4 w-4 mr-2" />
          View All Consultations
        </Button>
      </div>

      {/* OPD Stats Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.waitingConsultation}</div>
            <p className="text-xs text-muted-foreground">for consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inConsultation}</div>
            <p className="text-xs text-muted-foreground">with doctor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.servicesRequired}</div>
            <p className="text-xs text-muted-foreground">procedures needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacy</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.medicinesRequired}</div>
            <p className="text-xs text-muted-foreground">medicines pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">visits finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Flow Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Today&apos;s Patient Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading patient flow...</div>
            ) : patientFlow.length > 0 ? (
              patientFlow.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStageIcon(patient.current_stage)}
                      <Badge className={getStageColor(patient.current_stage)}>
                        {patient.opd_number}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold">{patient.patient_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.patient_phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {patient.stage_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {patient.current_stage.charAt(0).toUpperCase() + patient.current_stage.slice(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">{patient.next_action}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/admin/consultations/${patient.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients in OPD workflow today</p>
                <p className="text-sm">Patient visits will appear here as they progress through the system</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OPD Workflow Tabs */}
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow">OPD Workflow</TabsTrigger>
          <TabsTrigger value="management">Legacy Management</TabsTrigger>
          <TabsTrigger value="review">Pricing Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete OPD Patient Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { stage: '1. Registration', description: 'Patient registers and gets OPD number', icon: <Users className="h-6 w-6" />, color: 'blue' },
                  { stage: '2. Consultation', description: 'Doctor consultation, diagnosis, treatment plan', icon: <Stethoscope className="h-6 w-6" />, color: 'orange' },
                  { stage: '3. Treatments', description: 'Medical procedures, lab tests, imaging', icon: <Activity className="h-6 w-6" />, color: 'purple' },
                  { stage: '4. Pharmacy', description: 'Medicine dispensing based on prescriptions', icon: <FileText className="h-6 w-6" />, color: 'green' },
                  { stage: '5. Billing & Closure', description: 'Final billing, payment, OPD closure', icon: <CheckCircle className="h-6 w-6" />, color: 'gray' }
                ].map((step, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-${step.color}-100 flex items-center justify-center text-${step.color}-600`}>
                        {step.icon}
                      </div>
                      <h4 className="font-semibold text-sm mb-2">{step.stage}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-6">
          <OPDManagement userRole="admin" />
        </TabsContent>
        
        <TabsContent value="review" className="space-y-6">
          <AdminReviewDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}