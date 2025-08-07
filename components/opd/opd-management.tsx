'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  UserIcon, 
  StethoscopeIcon,
  PillIcon,
  CalendarIcon,
  FileTextIcon,
  ArrowRightIcon,
  XIcon,
  CheckIcon,
  ActivityIcon
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { ProcedureQuoting } from './procedure-quoting'
import { toast } from '@/lib/toast'
import { WorkflowManager } from '@/lib/workflow-manager'

interface Patient {
  id: string
  name: string
  mobile: string
  email?: string
  gender: string
  date_of_birth: string
  address?: string
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  appointment_type: string
  patient?: Patient
}

interface ProcedureQuote {
  id?: string
  service_id: string
  service_name: string
  diagnosis_reason: string
  custom_price: number
  estimated_duration: number
  doctor_notes: string
  urgency: 'low' | 'medium' | 'high'
  status: 'quoted' | 'admin_review' | 'approved' | 'rejected'
}

interface OPDRecord {
  id?: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  chief_complaint: string
  examination_findings: string
  diagnosis: string
  treatment_plan: string
  follow_up_date?: string
  follow_up_instructions?: string
  requires_procedures: boolean
  procedure_quotes: ProcedureQuote[]
  requires_medicines: boolean
  prescription_notes: string
  opd_status: 'consultation' | 'procedures_pending' | 'admin_review' | 'pharmacy_pending' | 'completed'
  created_at?: string
  updated_at?: string
}

interface OPDManagementProps {
  userRole: 'admin' | 'doctor' | 'receptionist'
  userId?: string
}

export function OPDManagement({ userRole, userId }: OPDManagementProps) {
  const [consultations, setConsultations] = useState<Appointment[]>([])
  const [selectedConsultation, setSelectedConsultation] = useState<Appointment | null>(null)
  const [opdRecord, setOpdRecord] = useState<OPDRecord>({
    appointment_id: '',
    patient_id: '',
    doctor_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    examination_findings: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_date: '',
    follow_up_instructions: '',
    requires_procedures: false,
    procedure_quotes: [],
    requires_medicines: false,
    prescription_notes: '',
    opd_status: 'consultation'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch today's consultations that need OPD
  const fetchConsultations = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      const today = new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients(id, full_name, phone, email, gender, date_of_birth, address)
        `)
        .eq('scheduled_date', today)
        .in('status', ['arrived', 'in_progress', 'confirmed'])
        .eq('appointment_type', 'consultation')

      // Filter by doctor if user is a doctor
      if (userRole === 'doctor' && userId) {
        query = query.eq('doctor_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to match our interface
      const transformedData: Appointment[] = (data || []).map(apt => ({
        ...apt,
        patient: apt.patients ? {
          id: apt.patients.id,
          name: apt.patients.full_name,
          mobile: apt.patients.phone,
          email: apt.patients.email,
          gender: apt.patients.gender,
          date_of_birth: apt.patients.date_of_birth,
          address: apt.patients.address
        } : undefined
      }))

      setConsultations(transformedData)

    } catch (error) {
      console.error('Error fetching consultations:', error)
      toast.error('Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }, [userRole, userId])

  useEffect(() => {
    fetchConsultations()
  }, [fetchConsultations])

  const handleStartOPD = (consultation: Appointment) => {
    setSelectedConsultation(consultation)
    setOpdRecord({
      appointment_id: consultation.id,
      patient_id: consultation.patient_id,
      doctor_id: consultation.doctor_id,
      visit_date: new Date().toISOString().split('T')[0],
      chief_complaint: '',
      examination_findings: '',
      diagnosis: '',
      treatment_plan: '',
      follow_up_date: '',
      follow_up_instructions: '',
      requires_procedures: false,
      procedure_quotes: [],
      requires_medicines: false,
      prescription_notes: '',
      opd_status: 'consultation'
    })
  }

  const handleSaveOPD = async () => {
    setSaving(true)
    try {
      const supabase = createAuthenticatedClient()

      // Use workflow manager to determine next status and route patient
      const workflowManager = new WorkflowManager()
      const routingResult = await workflowManager.routePatientAfterConsultation(
        opdRecord.patient_id,
        opdRecord.requires_procedures,
        opdRecord.procedure_quotes,
        opdRecord.requires_medicines,
        opdRecord.prescription_notes
      )

      if (!routingResult.success) {
        throw new Error(routingResult.message)
      }

      const opdData = {
        ...opdRecord,
        opd_status: WorkflowManager.determineNextStatus(
          opdRecord.requires_procedures,
          opdRecord.procedure_quotes,
          opdRecord.requires_medicines
        ),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('opd_records')
        .insert(opdData)

      if (error) throw error

      // Update appointment status
      await supabase
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', opdRecord.appointment_id)

      toast.success('OPD record saved successfully!')
      toast.info(`Next Step: ${routingResult.nextStep} - ${routingResult.message}`)
      
      // Refresh consultations
      fetchConsultations()
      setSelectedConsultation(null)

    } catch (error) {
      console.error('Error saving OPD record:', error)
      toast.error('Failed to save OPD record')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading OPD Console...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading consultations...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If consultation is selected, show OPD form
  if (selectedConsultation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OPD - Outpatient Department</h1>
            <p className="text-muted-foreground">
              Patient: {selectedConsultation.patient?.name} | Time: {selectedConsultation.scheduled_time}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedConsultation(null)}
          >
            <XIcon className="h-4 w-4 mr-2" />
            Back to Consultations
          </Button>
        </div>

        {/* OPD Form */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Patient Information & Examination */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedConsultation.patient?.name}</div>
                  <div><strong>Mobile:</strong> {selectedConsultation.patient?.mobile}</div>
                  <div><strong>Gender:</strong> {selectedConsultation.patient?.gender}</div>
                  <div><strong>DOB:</strong> {selectedConsultation.patient?.date_of_birth}</div>
                  {selectedConsultation.patient?.email && (
                    <div><strong>Email:</strong> {selectedConsultation.patient.email}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chief Complaint */}
            <Card>
              <CardHeader>
                <CardTitle>Chief Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter patient&apos;s main complaint..."
                  value={opdRecord.chief_complaint}
                  onChange={(e) => setOpdRecord(prev => ({ ...prev, chief_complaint: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Examination Findings */}
            <Card>
              <CardHeader>
                <CardTitle>Examination Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter examination findings..."
                  value={opdRecord.examination_findings}
                  onChange={(e) => setOpdRecord(prev => ({ ...prev, examination_findings: e.target.value }))}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Diagnosis */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter diagnosis..."
                  value={opdRecord.diagnosis}
                  onChange={(e) => setOpdRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Treatment & Workflow */}
          <div className="space-y-6">
            {/* Treatment Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter treatment plan..."
                  value={opdRecord.treatment_plan}
                  onChange={(e) => setOpdRecord(prev => ({ ...prev, treatment_plan: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Procedures Required */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires-procedures"
                  checked={opdRecord.requires_procedures}
                  onCheckedChange={(checked) => 
                    setOpdRecord(prev => ({ 
                      ...prev, 
                      requires_procedures: checked as boolean,
                      procedure_quotes: checked ? prev.procedure_quotes : []
                    }))
                  }
                />
                <Label htmlFor="requires-procedures" className="text-lg font-semibold">
                  Patient requires procedures with custom pricing
                </Label>
              </div>

              {opdRecord.requires_procedures && (
                <ProcedureQuoting
                  diagnosis={opdRecord.diagnosis}
                  selectedProcedures={opdRecord.procedure_quotes}
                  onProceduresChange={(procedures) => 
                    setOpdRecord(prev => ({ ...prev, procedure_quotes: procedures }))
                  }
                  patientName={selectedConsultation.patient?.name || 'Patient'}
                  doctorRole={userRole === 'doctor'}
                  readonly={false}
                />
              )}
            </div>

            {/* Medicine Required */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PillIcon className="h-5 w-5" />
                  Medicine Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires-medicines"
                      checked={opdRecord.requires_medicines}
                      onCheckedChange={(checked) => 
                        setOpdRecord(prev => ({ ...prev, requires_medicines: checked as boolean }))
                      }
                    />
                    <Label htmlFor="requires-medicines">Patient requires medicines</Label>
                  </div>

                  {opdRecord.requires_medicines && (
                    <div>
                      <Label htmlFor="prescription">Prescription Notes</Label>
                      <Textarea
                        id="prescription"
                        placeholder="Enter prescription details for pharmacy..."
                        value={opdRecord.prescription_notes}
                        onChange={(e) => setOpdRecord(prev => ({ ...prev, prescription_notes: e.target.value }))}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="follow-up-date">Follow-up Date (Optional)</Label>
                    <Input
                      id="follow-up-date"
                      type="date"
                      value={opdRecord.follow_up_date}
                      onChange={(e) => setOpdRecord(prev => ({ ...prev, follow_up_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="follow-up-instructions">Follow-up Instructions</Label>
                    <Textarea
                      id="follow-up-instructions"
                      placeholder="Enter follow-up instructions..."
                      value={opdRecord.follow_up_instructions}
                      onChange={(e) => setOpdRecord(prev => ({ ...prev, follow_up_instructions: e.target.value }))}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>Workflow Process:</strong>
                    <ul className="mt-2 space-y-1">
                      {opdRecord.requires_procedures && opdRecord.procedure_quotes.length > 0 && (
                        <li className="flex items-center gap-2">
                          <ArrowRightIcon className="h-4 w-4 text-orange-600" />
                          Procedure quotes will be sent to admin for pricing approval
                        </li>
                      )}
                      {opdRecord.requires_medicines && (
                        <li className="flex items-center gap-2">
                          <ArrowRightIcon className="h-4 w-4 text-green-600" />
                          Patient will be referred to pharmacy for medicines
                        </li>
                      )}
                      {(!opdRecord.requires_procedures || opdRecord.procedure_quotes.length === 0) && !opdRecord.requires_medicines && (
                        <li className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4 text-gray-600" />
                          Consultation will be marked as completed
                        </li>
                      )}
                      {opdRecord.requires_procedures && opdRecord.procedure_quotes.length > 0 && (
                        <li className="flex items-center gap-2 ml-6 text-xs">
                          → Admin will review and approve final pricing
                        </li>
                      )}
                      {opdRecord.requires_procedures && opdRecord.procedure_quotes.length > 0 && (
                        <li className="flex items-center gap-2 ml-6 text-xs">
                          → Approved procedures will be added to patient billing
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={handleSaveOPD}
                    disabled={saving || !opdRecord.diagnosis.trim()}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Complete OPD & Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main OPD Dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPD Management</h1>
          <p className="text-muted-foreground">
            Manage post-consultation workflow for patients
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Consultations</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <p className="text-xs text-muted-foreground">awaiting OPD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">active consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedures Pending</CardTitle>
            <ActivityIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0</div>
            <p className="text-xs text-muted-foreground">waiting for procedures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacy Pending</CardTitle>
            <PillIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">waiting for medicines</p>
          </CardContent>
        </Card>
      </div>

      {/* Consultations List */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Consultations</CardTitle>
          <CardDescription>
            Patients who have arrived for consultation and need OPD processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{consultation.patient?.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {consultation.scheduled_time}
                    </Badge>
                    <Badge 
                      variant={consultation.status === 'in_progress' ? 'default' : 'secondary'}
                    >
                      {consultation.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Mobile: {consultation.patient?.mobile}</div>
                    <div>Type: {consultation.appointment_type}</div>
                  </div>
                </div>
                <Button onClick={() => handleStartOPD(consultation)}>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Start OPD
                </Button>
              </div>
            ))}

            {consultations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <StethoscopeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No consultations waiting for OPD processing.</p>
                <p className="text-sm">Completed consultations will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}