'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  UserIcon, 
  ClockIcon,
  StethoscopeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  PillIcon,
  IndianRupeeIcon,
  ArrowRightIcon,
  ActivityIcon,
  CalendarIcon
} from 'lucide-react'
import { WorkflowManager, type PatientStatus } from '@/lib/workflow-manager'
import { toast } from '@/lib/toast'

interface Patient {
  id: string
  full_name: string
  phone: string
  email?: string
}

interface PatientTrackingData {
  id: string
  patient_id: string
  appointment_id?: string
  opd_status: PatientStatus
  requires_procedures: boolean
  requires_medicines: boolean
  procedure_quotes: any[]
  created_at: string
  updated_at: string
  patients?: Patient
  visit_date: string
  chief_complaint: string
  diagnosis: string
  scheduled_time?: string
}

interface PatientTrackerProps {
  userRole: 'admin' | 'doctor' | 'receptionist' | 'attendant' | 'pharmacist'
  showAllPatients?: boolean
  filterByStatus?: PatientStatus[]
  department?: string
}

export function PatientTracker({
  userRole,
  showAllPatients = false,
  filterByStatus,
  department
}: PatientTrackerProps) {
  const [patients, setPatients] = useState<PatientTrackingData[]>([])
  const [workflowSummary, setWorkflowSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<PatientTrackingData | null>(null)

  // Define which statuses each role should see
  const getRoleBasedStatuses = useCallback(() => {
    if (filterByStatus) return filterByStatus
    
    switch (userRole) {
      case 'doctor':
        return ['waiting', 'in_consultation'] as PatientStatus[]
      case 'admin':
        return showAllPatients 
          ? ['waiting', 'in_consultation', 'admin_review', 'procedures_pending', 'pharmacy_pending', 'completed'] as PatientStatus[]
          : ['admin_review'] as PatientStatus[]
      case 'attendant':
        return ['procedures_pending'] as PatientStatus[]
      case 'pharmacist':
        return ['pharmacy_pending'] as PatientStatus[]
      case 'receptionist':
        return showAllPatients
          ? ['waiting', 'in_consultation', 'admin_review', 'procedures_pending', 'pharmacy_pending', 'completed', 'billed'] as PatientStatus[]
          : ['completed', 'billed'] as PatientStatus[]
      default:
        return ['waiting'] as PatientStatus[]
    }
  }, [userRole, showAllPatients, filterByStatus])

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const statuses = getRoleBasedStatuses()
      const workflowManager = new WorkflowManager()
      const data = await workflowManager.getPatientsByDepartmentAndStatus(
        department || 'all',
        statuses
      )
      // Transform data to match PatientTrackingData interface
      const transformedData: PatientTrackingData[] = data.map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        appointment_id: item.appointment_id,
        opd_status: item.current_status || (item as any).opd_status,
        requires_procedures: item.requires_procedures,
        requires_medicines: item.requires_medicines,
        procedure_quotes: item.procedure_quotes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        patients: (item as any).patients,
        visit_date: (item as any).visit_date || new Date().toISOString().split('T')[0],
        chief_complaint: (item as any).chief_complaint || '',
        diagnosis: (item as any).diagnosis || '',
        scheduled_time: (item as any).appointments?.[0]?.scheduled_time
      }))
      setPatients(transformedData)
      
      // Get workflow summary
      const summary = await workflowManager.getWorkflowSummary()
      setWorkflowSummary(summary)
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patient data')
    } finally {
      setLoading(false)
    }
  }, [getRoleBasedStatuses, department])

  useEffect(() => {
    fetchPatients()
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchPatients, 30000)
    return () => clearInterval(interval)
  }, [fetchPatients])

  const getStatusColor = (status: PatientStatus) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_consultation':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'admin_review':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'procedures_pending':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pharmacy_pending':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'billed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: PatientStatus) => {
    switch (status) {
      case 'waiting':
        return <ClockIcon className="h-4 w-4" />
      case 'in_consultation':
        return <StethoscopeIcon className="h-4 w-4" />
      case 'admin_review':
        return <AlertTriangleIcon className="h-4 w-4" />
      case 'procedures_pending':
        return <ActivityIcon className="h-4 w-4" />
      case 'pharmacy_pending':
        return <PillIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'billed':
        return <IndianRupeeIcon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  const formatStatus = (status: PatientStatus) => {
    switch (status) {
      case 'admin_review':
        return 'Admin Review'
      case 'procedures_pending':
        return 'Procedures Pending'
      case 'pharmacy_pending':
        return 'Pharmacy Pending'
      case 'in_consultation':
        return 'In Consultation'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours}h ${diffMinutes % 60}m ago`
    }
  }

  const handlePatientAction = async (patient: PatientTrackingData, action: string) => {
    try {
      const workflowManager = new WorkflowManager()
      let result
      
      switch (action) {
        case 'start_consultation':
          result = await workflowManager.updatePatientStatus(patient.patient_id, 'in_consultation')
          break
        case 'complete_consultation':
          // This would typically be handled in the OPD form
          break
        case 'complete_procedure':
          result = await workflowManager.completeProcedure(
            patient.patient_id,
            'temp_procedure_id', // In real implementation, would have specific procedure ID
            false, // No more procedures pending
            patient.requires_medicines
          )
          break
        case 'complete_pharmacy':
          result = await workflowManager.completePharmacy(patient.patient_id)
          break
        default:
          return
      }
      
      if (result?.success) {
        toast.success(result.message)
        fetchPatients() // Refresh the list
      } else {
        toast.error(result?.message || 'Action failed')
      }
    } catch (error) {
      console.error('Error handling patient action:', error)
      toast.error('Failed to perform action')
    }
  }

  const getActionButton = (patient: PatientTrackingData) => {
    switch (patient.opd_status) {
      case 'waiting':
        if (userRole === 'doctor') {
          return (
            <Button 
              size="sm"
              onClick={() => handlePatientAction(patient, 'start_consultation')}
            >
              Start Consultation
            </Button>
          )
        }
        break
      case 'procedures_pending':
        if (userRole === 'attendant') {
          return (
            <Button 
              size="sm"
              onClick={() => handlePatientAction(patient, 'complete_procedure')}
            >
              Complete Procedure
            </Button>
          )
        }
        break
      case 'pharmacy_pending':
        if (userRole === 'pharmacist') {
          return (
            <Button 
              size="sm"
              onClick={() => handlePatientAction(patient, 'complete_pharmacy')}
            >
              Complete Dispensing
            </Button>
          )
        }
        break
      case 'completed':
        if (userRole === 'receptionist') {
          return (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => {/* Navigate to billing */}}
            >
              Generate Bill
            </Button>
          )
        }
        break
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Patient Tracker...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading patients...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Summary */}
      {showAllPatients && (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waiting</CardTitle>
              <ClockIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{workflowSummary.waiting || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultation</CardTitle>
              <StethoscopeIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{workflowSummary.in_consultation || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Review</CardTitle>
              <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{workflowSummary.admin_review || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Procedures</CardTitle>
              <ActivityIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{workflowSummary.procedures_pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pharmacy</CardTitle>
              <PillIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{workflowSummary.pharmacy_pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{workflowSummary.completed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billed</CardTitle>
              <IndianRupeeIcon className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{workflowSummary.billed || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Patient Tracking ({patients.length})
          </CardTitle>
          <CardDescription>
            {showAllPatients ? 'All patients in workflow' : `Patients for ${userRole} department`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{patient.patients?.full_name}</h3>
                    <Badge variant="outline" className={getStatusColor(patient.opd_status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(patient.opd_status)}
                        {formatStatus(patient.opd_status)}
                      </span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getTimeElapsed(patient.updated_at)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>📱 {patient.patients?.phone}</span>
                      <span>📅 {new Date(patient.visit_date).toLocaleDateString()}</span>
                      {patient.scheduled_time && (
                        <span>🕒 {patient.scheduled_time}</span>
                      )}
                    </div>
                    
                    {patient.chief_complaint && (
                      <div><strong>Complaint:</strong> {patient.chief_complaint}</div>
                    )}
                    
                    {patient.diagnosis && (
                      <div><strong>Diagnosis:</strong> {patient.diagnosis}</div>
                    )}
                    
                    {patient.requires_procedures && patient.procedure_quotes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <ActivityIcon className="h-4 w-4 text-purple-600" />
                        <span>{patient.procedure_quotes.length} procedure(s) required</span>
                      </div>
                    )}
                    
                    {patient.requires_medicines && (
                      <div className="flex items-center gap-1">
                        <PillIcon className="h-4 w-4 text-green-600" />
                        <span>Medicines required</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getActionButton(patient)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {patients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No patients in queue</p>
                <p className="text-sm">
                  {userRole === 'doctor' && 'No patients waiting for consultation'}
                  {userRole === 'admin' && 'No procedures pending review'}
                  {userRole === 'attendant' && 'No procedures scheduled for today'}
                  {userRole === 'pharmacist' && 'No prescriptions pending'}
                  {userRole === 'receptionist' && 'No patients ready for billing'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Patient Journey Details</span>
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedPatient.patients?.full_name}</div>
                    <div><strong>Phone:</strong> {selectedPatient.patients?.phone}</div>
                    <div><strong>Status:</strong> {formatStatus(selectedPatient.opd_status)}</div>
                    <div><strong>Visit Date:</strong> {new Date(selectedPatient.visit_date).toLocaleDateString()}</div>
                  </div>
                </div>
                
                {selectedPatient.chief_complaint && (
                  <div>
                    <h4 className="font-semibold mb-2">Chief Complaint</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.chief_complaint}</p>
                  </div>
                )}
                
                {selectedPatient.diagnosis && (
                  <div>
                    <h4 className="font-semibold mb-2">Diagnosis</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.diagnosis}</p>
                  </div>
                )}
                
                {selectedPatient.procedure_quotes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Procedure Quotes</h4>
                    <div className="space-y-2">
                      {selectedPatient.procedure_quotes.map((quote: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div><strong>{quote.service_name}</strong></div>
                          <div>Price: ₹{quote.custom_price?.toLocaleString('en-IN')}</div>
                          <div>Status: {quote.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>Created: {new Date(selectedPatient.created_at).toLocaleString()}</div>
                    <div>Updated: {new Date(selectedPatient.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}