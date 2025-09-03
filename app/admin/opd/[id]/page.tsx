'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Stethoscope, 
  Pill, 
  Activity, 
  CheckSquare, 
  TestTube,
  Plus,
  Edit,
  Eye,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Patient {
  id: string
  full_name: string
  date_of_birth: string
  phone: string
  email: string
  address: string
  emergency_contact: string
}

interface Doctor {
  id: string
  full_name: string
  specialization: string
  qualification: string
}

interface Consultation {
  id: string
  consultation_date: string
  chief_complaints: string[]
  history_present_illness: string
  negative_history: string
  past_history: string
  personal_history: string
  general_examination: string
  local_examination: string
  provisional_diagnosis: string[]
  investigation_advice: string[]
  final_diagnosis: string[]
  status: 'completed' | 'in_progress' | 'pending'
  created_at: string
  updated_at: string
}

interface Treatment {
  id: string
  treatment_type: 'conservative' | 'surgical' | 'procedure'
  treatment_name: string
  description: string
  start_date: string
  end_date?: string
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  sessions_planned: number
  sessions_completed: number
  notes: string
  created_at: string
  updated_at: string
}

interface Prescription {
  id: string
  prescribed_date: string
  medicines: Array<{
    medicine_name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }>
  status: 'pending' | 'dispensed' | 'partially_dispensed'
  notes: string
  created_at: string
}

interface Task {
  id: string
  task_type: 'follow_up' | 'investigation' | 'procedure' | 'consultation'
  title: string
  description: string
  assigned_to: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

interface OPDDetail {
  id: string
  patient: Patient
  doctor: Doctor
  opd_date: string
  opd_time: string
  department: string
  opd_status: 'consultation' | 'procedures_pending' | 'pharmacy_pending' | 'investigations_pending' | 'completed'
  chief_complaint: string
  consultations: Consultation[]
  treatments: Treatment[]
  prescriptions: Prescription[]
  tasks: Task[]
  notes: string
  created_at: string
  updated_at: string
}

export default function OPDDetailPage() {
  const { id } = useParams()
  const [opdDetail, setOpdDetail] = useState<OPDDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadOPDDetail = async () => {
      setLoading(true)
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockDetail: OPDDetail = {
        id: id as string,
        patient: {
          id: 'pat-001',
          full_name: 'Sarah Johnson',
          date_of_birth: '1985-03-15',
          phone: '+1-555-0123',
          email: 'sarah.johnson@email.com',
          address: '123 Main Street, Anytown, ST 12345',
          emergency_contact: 'John Johnson (Husband) - +1-555-0124'
        },
        doctor: {
          id: 'doc-001',
          full_name: 'Dr. Michael Smith',
          specialization: 'Cardiology',
          qualification: 'MD, DM Cardiology'
        },
        opd_date: '2024-01-15',
        opd_time: '09:00',
        department: 'Cardiology',
        opd_status: 'procedures_pending',
        chief_complaint: 'Chest pain and shortness of breath',
        consultations: [
          {
            id: 'cons-001',
            consultation_date: '2024-01-15T09:00:00Z',
            chief_complaints: ['Chest pain', 'Shortness of breath', 'Fatigue'],
            history_present_illness: 'Patient reports onset of chest pain 3 days ago, associated with shortness of breath during exertion. Pain is described as crushing, substernal, radiating to left arm.',
            negative_history: 'No history of diabetes, hypertension, or previous cardiac events',
            past_history: 'Appendectomy in 2010, no other significant medical history',
            personal_history: 'Non-smoker, occasional alcohol use, regular exercise routine',
            general_examination: 'Patient appears anxious, vitals stable, no acute distress',
            local_examination: 'Heart rate regular, no murmurs, chest clear to auscultation',
            provisional_diagnosis: ['Possible acute coronary syndrome', 'Anxiety-related chest pain'],
            investigation_advice: ['ECG', '2D Echo', 'Troponin levels', 'Lipid profile'],
            final_diagnosis: ['Unstable angina', 'Dyslipidemia'],
            status: 'completed',
            created_at: '2024-01-15T09:00:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          }
        ],
        treatments: [
          {
            id: 'treat-001',
            treatment_type: 'conservative',
            treatment_name: 'Cardiac Rehabilitation Program',
            description: 'Structured exercise program with dietary counseling and medication management',
            start_date: '2024-01-20',
            status: 'planned',
            sessions_planned: 12,
            sessions_completed: 0,
            notes: 'Patient enrolled in Phase II cardiac rehabilitation',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          }
        ],
        prescriptions: [
          {
            id: 'pres-001',
            prescribed_date: '2024-01-15',
            medicines: [
              {
                medicine_name: 'Atorvastatin',
                dosage: '40mg',
                frequency: 'Once daily',
                duration: '30 days',
                instructions: 'Take at bedtime'
              },
              {
                medicine_name: 'Aspirin',
                dosage: '75mg',
                frequency: 'Once daily',
                duration: '30 days',
                instructions: 'Take after meals'
              },
              {
                medicine_name: 'Metoprolol',
                dosage: '25mg',
                frequency: 'Twice daily',
                duration: '30 days',
                instructions: 'Take with or without food'
              }
            ],
            status: 'dispensed',
            notes: 'Patient counseled on medication compliance',
            created_at: '2024-01-15T11:00:00Z'
          }
        ],
        tasks: [
          {
            id: 'task-001',
            task_type: 'investigation',
            title: 'Schedule Angiography',
            description: 'Patient requires coronary angiography to assess vessel patency',
            assigned_to: 'Cardiology Team',
            due_date: '2024-01-22',
            status: 'pending',
            priority: 'high',
            created_at: '2024-01-15T10:45:00Z'
          },
          {
            id: 'task-002',
            task_type: 'follow_up',
            title: 'Follow-up Appointment',
            description: 'Review investigation reports and adjust treatment plan',
            assigned_to: 'Dr. Michael Smith',
            due_date: '2024-01-25',
            status: 'pending',
            priority: 'medium',
            created_at: '2024-01-15T11:00:00Z'
          }
        ],
        notes: 'Patient is cooperative and motivated for treatment. Family history of cardiac disease noted.',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T11:30:00Z'
      }
      
      setOpdDetail(mockDetail)
      setLoading(false)
    }

    if (id) {
      loadOPDDetail()
    }
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800'
      case 'procedures_pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'pharmacy_pending':
        return 'bg-orange-100 text-orange-800'
      case 'investigations_pending':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'planned':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'dispensed':
        return 'bg-green-100 text-green-800'
      case 'partially_dispensed':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading OPD details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!opdDetail) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            OPD record not found. Please check the ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/opd-list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to OPD List
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{opdDetail.patient.full_name}</h1>
            <p className="text-muted-foreground">
              OPD Session - {new Date(opdDetail.opd_date).toLocaleDateString()} at {opdDetail.opd_time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(opdDetail.opd_status)}>
            {opdDetail.opd_status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Session
          </Button>
        </div>
      </div>

      {/* Patient and Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Full Name:</span>
                <p className="font-medium">{opdDetail.patient.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date of Birth:</span>
                <p className="font-medium">
                  {new Date(opdDetail.patient.date_of_birth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{opdDetail.patient.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{opdDetail.patient.email}</p>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Address:</span>
              <p className="font-medium">{opdDetail.patient.address}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Emergency Contact:</span>
              <p className="font-medium">{opdDetail.patient.emergency_contact}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Doctor & Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Doctor:</span>
                <p className="font-medium">{opdDetail.doctor.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Specialization:</span>
                <p className="font-medium">{opdDetail.doctor.specialization}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-medium">{opdDetail.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Session Date:</span>
                <p className="font-medium">
                  {new Date(opdDetail.opd_date).toLocaleDateString()} at {opdDetail.opd_time}
                </p>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Chief Complaint:</span>
              <p className="font-medium">{opdDetail.chief_complaint}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Session Notes:</span>
              <p className="font-medium">{opdDetail.notes || 'No notes added'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{opdDetail.consultations.length}</div>
                    <div className="text-sm text-muted-foreground">Consultations</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{opdDetail.treatments.length}</div>
                    <div className="text-sm text-muted-foreground">Treatments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{opdDetail.prescriptions.length}</div>
                    <div className="text-sm text-muted-foreground">Prescriptions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {opdDetail.tasks.filter(t => t.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Add new sessions or manage existing ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col gap-2">
                  <Stethoscope className="w-6 h-6" />
                  <span>Add Consultation</span>
                </Button>
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <Activity className="w-6 h-6" />
                  <span>Add Treatment</span>
                </Button>
                <Button className="h-20 flex flex-col gap-2" variant="outline">
                  <Pill className="w-6 h-6" />
                  <span>Add Medication</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Consultation Sessions</h3>
              <p className="text-muted-foreground">
                {opdDetail.consultations.length} consultation{opdDetail.consultations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Consultation
            </Button>
          </div>

          <div className="space-y-4">
            {opdDetail.consultations.map((consultation) => (
              <Card key={consultation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Consultation - {new Date(consultation.consultation_date).toLocaleString()}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Chief Complaints</h4>
                      <div className="flex flex-wrap gap-1">
                        {consultation.chief_complaints.map((complaint, idx) => (
                          <Badge key={idx} variant="secondary">{complaint}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Final Diagnosis</h4>
                      <div className="flex flex-wrap gap-1">
                        {consultation.final_diagnosis.map((diagnosis, idx) => (
                          <Badge key={idx} variant="outline">{diagnosis}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">History of Present Illness</h4>
                    <p className="text-sm text-muted-foreground">{consultation.history_present_illness}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Treatment Plans</h3>
              <p className="text-muted-foreground">
                {opdDetail.treatments.length} treatment plan{opdDetail.treatments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Treatment
            </Button>
          </div>

          <div className="space-y-4">
            {opdDetail.treatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{treatment.treatment_name}</CardTitle>
                      <CardDescription>{treatment.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(treatment.status)}>
                        {treatment.status}
                      </Badge>
                      <Badge variant="secondary">
                        {treatment.treatment_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium">{new Date(treatment.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sessions:</span>
                      <p className="font-medium">{treatment.sessions_completed} / {treatment.sessions_planned}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <p className="font-medium">
                        {Math.round((treatment.sessions_completed / treatment.sessions_planned) * 100)}%
                      </p>
                    </div>
                  </div>
                  {treatment.notes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Notes:</span>
                      <p className="text-sm">{treatment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Prescriptions</h3>
              <p className="text-muted-foreground">
                {opdDetail.prescriptions.length} prescription{opdDetail.prescriptions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Prescription
            </Button>
          </div>

          <div className="space-y-4">
            {opdDetail.prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Prescription - {new Date(prescription.prescribed_date).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription>
                        {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''} prescribed
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(prescription.status)}>
                      {prescription.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prescription.medicines.map((medicine, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Medicine:</span>
                            <p className="font-medium">{medicine.medicine_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dosage:</span>
                            <p className="font-medium">{medicine.dosage}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frequency:</span>
                            <p className="font-medium">{medicine.frequency}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="font-medium">{medicine.duration}</p>
                          </div>
                        </div>
                        {medicine.instructions && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Instructions:</span>
                            <p>{medicine.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {prescription.notes && (
                    <div className="mt-4 pt-3 border-t">
                      <span className="text-muted-foreground text-sm">Notes:</span>
                      <p className="text-sm">{prescription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Assigned Tasks</h3>
              <p className="text-muted-foreground">
                {opdDetail.tasks.length} task{opdDetail.tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          <div className="space-y-4">
            {opdDetail.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span>Assigned to:</span>
                          <p className="font-medium">{task.assigned_to}</p>
                        </div>
                        <div>
                          <span>Due Date:</span>
                          <p className="font-medium">{new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span>Task Type:</span>
                          <p className="font-medium">{task.task_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Test Reports & Documents</h3>
              <p className="text-muted-foreground">
                Upload and manage test reports and medical documents
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Report
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Reports Uploaded</h3>
                <p className="text-muted-foreground">
                  Test reports and medical documents will appear here once uploaded
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}