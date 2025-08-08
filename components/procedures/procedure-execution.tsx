'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  FileText,
  Play,
  Timer,
  Stethoscope,
  Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { workflowManager } from '@/lib/workflow-manager'

interface ProcedureQuote {
  id: string
  service_id: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  estimated_duration: number
  priority: string
  services: {
    id: string
    name: string
    description: string
    category: string
    base_price: number
  }
}

interface PatientWithProcedures {
  id: string
  patient_id: string
  opd_status: string
  procedure_quotes: ProcedureQuote[]
  requires_medicines: boolean
  created_at: string
  updated_at: string
  patients: {
    id: string
    patient_number: string
    first_name: string
    last_name: string
    phone: string
    date_of_birth: string
    gender: string
  }
  appointments?: {
    id: string
    scheduled_time: string
    appointment_type: string
  }
}

interface ProcedureExecution {
  patientId: string
  procedureId: string
  serviceId: string
  status: 'pending' | 'in_progress' | 'completed'
  startedAt?: string
  completedAt?: string
  notes: string
  executedBy?: string
}

export function ProcedureExecution() {
  const [pendingPatients, setPendingPatients] = useState<PatientWithProcedures[]>([])
  const [procedureExecutions, setProcedureExecutions] = useState<Record<string, ProcedureExecution>>({})
  const [loading, setLoading] = useState(true)
  const [processingProcedure, setProcessingProcedure] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPendingProcedures = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get patients with procedures_pending status and their visit services
      const { data: patients, error } = await supabase
        .from('opd_records')
        .select(`
          id,
          patient_id,
          opd_status,
          procedure_quotes,
          requires_medicines,
          created_at,
          updated_at,
          patients!inner (
            id,
            patient_number,
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender
          ),
          appointments (
            id,
            scheduled_time,
            appointment_type
          )
        `)
        .eq('opd_status', 'procedures_pending')
        .gte('created_at', today)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch existing visit_services records for these patients
      if (patients && patients.length > 0) {
        const patientIds = patients.map(p => p.patient_id)
        
        const { data: visitServices } = await supabase
          .from('visit_services')
          .select(`
            *,
            visits!inner (patient_id),
            services (name, description, category)
          `)
          .in('visits.patient_id', patientIds)
          .gte('created_at', today)

        // Merge visit services data with patient data
        const patientsWithServices = patients.map(patient => ({
          ...patient,
          visit_services: visitServices?.filter(vs => vs.visits.patient_id === patient.patient_id) || []
        }))

        setPendingPatients(patientsWithServices as PatientWithProcedures[])
        return
      }

      // Transform data to handle patients and appointments arrays from Supabase
      const transformedPatients = (patients || []).map(patient => ({
        ...patient,
        patients: Array.isArray(patient.patients) ? patient.patients[0] : patient.patients,
        appointments: Array.isArray(patient.appointments) ? patient.appointments[0] : patient.appointments
      }))

      // Process procedure quotes and expand service details
      const processedPatients = await Promise.all(transformedPatients.map(async (patient) => {
        const quotes = (patient.procedure_quotes || []) as ProcedureQuote[]
        
        // Fetch service details for each quote
        const quotesWithServices = await Promise.all(quotes.map(async (quote) => {
          const { data: service } = await supabase
            .from('services')
            .select('*')
            .eq('id', quote.service_id)
            .single()
          
          return {
            ...quote,
            services: service || { 
              id: quote.service_id,
              name: 'Unknown Service',
              description: '',
              category: '',
              base_price: quote.unit_price || 0
            }
          }
        }))

        return {
          ...patient,
          procedure_quotes: quotesWithServices
        }
      }))

      setPendingPatients(processedPatients)
    } catch (error) {
      console.error('Error fetching pending procedures:', error)
    }
  }, [supabase])

  const initializeProcedureExecutions = useCallback(() => {
    const executions: Record<string, ProcedureExecution> = {}
    
    pendingPatients.forEach(patient => {
      patient.procedure_quotes.forEach(quote => {
        const key = `${patient.patient_id}-${quote.id}`
        if (!executions[key]) {
          executions[key] = {
            patientId: patient.patient_id,
            procedureId: quote.id,
            serviceId: quote.service_id,
            status: 'pending',
            notes: ''
          }
        }
      })
    })
    
    setProcedureExecutions(executions)
  }, [pendingPatients])

  const startProcedure = async (patientId: string, procedureId: string) => {
    const key = `${patientId}-${procedureId}`
    const userData = localStorage.getItem('swamicare_user')
    const user = userData ? JSON.parse(userData) : null

    setProcessingProcedure(key)
    
    try {
      // Find the procedure quote to get service info
      const patient = pendingPatients.find(p => p.patient_id === patientId)
      const quote = patient?.procedure_quotes.find(q => q.id === procedureId)
      
      if (!quote) {
        throw new Error('Procedure not found')
      }

      // Create or update visit_services record
      const { error: insertError } = await supabase
        .from('visit_services')
        .upsert({
          visit_id: patient.id, // Using OPD record ID as visit ID for now
          service_id: quote.service_id,
          attendant_id: user?.id,
          quantity: quote.quantity || 1,
          unit_price: quote.unit_price,
          total_price: quote.total_price,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          notes: `Started by ${user?.full_name || 'Service Attendant'}`
        })

      if (insertError) throw insertError

      // Update local state
      setProcedureExecutions(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          executedBy: user?.id
        }
      }))
      
      alert('Procedure started successfully')
    } catch (error) {
      console.error('Error starting procedure:', error)
      alert('Failed to start procedure')
    } finally {
      setProcessingProcedure(null)
    }
  }

  const completeProcedure = async (patientId: string, procedureId: string, notes: string) => {
    const key = `${patientId}-${procedureId}`
    setProcessingProcedure(key)

    try {
      // Find the procedure quote to get service info
      const patient = pendingPatients.find(p => p.patient_id === patientId)
      const quote = patient?.procedure_quotes.find(q => q.id === procedureId)
      
      if (!quote || !patient) {
        throw new Error('Procedure or patient not found')
      }

      // Update visit_services record to completed
      const { error: updateError } = await supabase
        .from('visit_services')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes
        })
        .eq('visit_id', patient.id)
        .eq('service_id', quote.service_id)

      if (updateError) throw updateError

      // Mark procedure as completed locally
      setProcedureExecutions(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: 'completed',
          completedAt: new Date().toISOString(),
          notes
        }
      }))

      // Check if this patient has any more pending procedures
      const allProcedureKeys = patient.procedure_quotes.map(q => `${patientId}-${q.id}`)
      const remainingProcedures = allProcedureKeys.filter(k => 
        k !== key && (!procedureExecutions[k] || procedureExecutions[k]?.status !== 'completed')
      )

      const stillHasPendingProcedures = remainingProcedures.length > 0
      const requiresMedicines = patient.requires_medicines

      // Use workflow manager to route patient to next step
      const result = await workflowManager.completeProcedure(
        patientId,
        procedureId,
        stillHasPendingProcedures,
        requiresMedicines
      )

      if (result.success) {
        alert(`Procedure completed! ${result.message}`)
        fetchPendingProcedures() // Refresh the list
      } else {
        alert(`Procedure completed but routing failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Error completing procedure:', error)
      alert('Failed to complete procedure')
    } finally {
      setProcessingProcedure(null)
    }
  }

  const updateProcedureNotes = (patientId: string, procedureId: string, notes: string) => {
    const key = `${patientId}-${procedureId}`
    setProcedureExecutions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        notes
      }
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const calculateDuration = (startedAt?: string) => {
    if (!startedAt) return null
    const start = new Date(startedAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
    return `${diffMinutes}m`
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchPendingProcedures()
      setLoading(false)
    }
    loadData()
  }, [fetchPendingProcedures])

  useEffect(() => {
    initializeProcedureExecutions()
  }, [initializeProcedureExecutions])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading pending procedures...</p>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalProcedures = Object.keys(procedureExecutions).length
  const inProgressCount = Object.values(procedureExecutions).filter(p => p.status === 'in_progress').length
  const completedCount = Object.values(procedureExecutions).filter(p => p.status === 'completed').length
  const pendingCount = totalProcedures - inProgressCount - completedCount

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">awaiting execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">currently executing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground">procedures finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <Stethoscope className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalProcedures}</div>
            <p className="text-xs text-muted-foreground">procedures scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Patients with Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patients with Approved Procedures ({pendingPatients.length})
          </CardTitle>
          <CardDescription>
            Execute approved procedures and manage patient workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pendingPatients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-6 bg-gray-50">
                {/* Patient Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {patient.patients.first_name} {patient.patients.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.patients.patient_number} • {patient.patients.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-500 text-white">
                          {patient.patients.gender} • {new Date().getFullYear() - new Date(patient.patients.date_of_birth).getFullYear()}y
                        </Badge>
                      </div>
                    </div>

                    {patient.appointments && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        Appointment: {new Date(patient.appointments.scheduled_time).toLocaleTimeString()} 
                        • Type: {patient.appointments.appointment_type}
                      </div>
                    )}
                  </div>
                </div>

                {/* Procedures */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Approved Procedures ({patient.procedure_quotes.length})
                  </h4>
                  
                  {patient.procedure_quotes.map((quote) => {
                    const executionKey = `${patient.patient_id}-${quote.id}`
                    const execution = procedureExecutions[executionKey] || {
                      patientId: patient.patient_id,
                      procedureId: quote.id,
                      serviceId: quote.service_id,
                      status: 'pending',
                      notes: ''
                    }

                    return (
                      <div key={quote.id} className="border rounded-lg p-4 bg-white">
                        <div className="space-y-4">
                          {/* Procedure Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h5 className="font-medium text-gray-900">{quote.services.name}</h5>
                              <p className="text-sm text-gray-600">{quote.services.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Category: {quote.services.category}</span>
                                {quote.estimated_duration && (
                                  <>
                                    <span>•</span>
                                    <span>Duration: {quote.estimated_duration}min</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(execution.status)}
                                <Badge className={getPriorityColor(quote.priority)}>
                                  {quote.priority || 'Normal'} Priority
                                </Badge>
                              </div>
                              {execution.startedAt && execution.status === 'in_progress' && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <Timer className="h-3 w-3" />
                                  Running: {calculateDuration(execution.startedAt)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Procedure Details */}
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <strong>Quantity:</strong> {quote.quantity}
                            </div>
                            <div>
                              <strong>Unit Price:</strong> ₹{quote.unit_price}
                            </div>
                            <div>
                              <strong>Total Cost:</strong> ₹{quote.total_price}
                            </div>
                          </div>

                          {/* Execution Controls */}
                          {execution.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => startProcedure(patient.patient_id, quote.id)}
                                disabled={processingProcedure === executionKey}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start Procedure
                              </Button>
                            </div>
                          )}

                          {execution.status === 'in_progress' && (
                            <div className="space-y-3">
                              <Alert className="border-blue-200 bg-blue-50">
                                <Activity className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Procedure in progress</strong>
                                  <div className="text-sm text-blue-700 mt-1">
                                    Started: {execution.startedAt ? new Date(execution.startedAt).toLocaleTimeString() : 'Unknown'}
                                  </div>
                                </AlertDescription>
                              </Alert>
                              
                              <Textarea
                                placeholder="Add procedure notes (optional)"
                                value={execution.notes}
                                onChange={(e) => updateProcedureNotes(patient.patient_id, quote.id, e.target.value)}
                                className="text-sm"
                                rows={3}
                              />
                              
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => completeProcedure(patient.patient_id, quote.id, execution.notes)}
                                  disabled={processingProcedure === executionKey}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete Procedure
                                </Button>
                              </div>
                            </div>
                          )}

                          {execution.status === 'completed' && (
                            <Alert className="border-green-200 bg-green-50">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription>
                                <strong className="text-green-900">Procedure Completed</strong>
                                <div className="text-sm text-green-700 mt-1">
                                  Completed: {execution.completedAt ? new Date(execution.completedAt).toLocaleTimeString() : 'Unknown'}
                                </div>
                                {execution.notes && (
                                  <div className="text-sm text-green-700 mt-2">
                                    <strong>Notes:</strong> {execution.notes}
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Patient Next Step Info */}
                {patient.requires_medicines && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> Patient requires medicines after procedure completion.
                      Will be routed to pharmacy automatically.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}

            {pendingPatients.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No pending procedures</h3>
                <p>All approved procedures have been completed or no procedures are scheduled.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}