'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Types  
import { 
  ConsultationSession,
  ConsultationChiefComplaint,
  ConsultationHistory,
  ConsultationVitals,
  ExaminationFinding,
  ConsultationDiagnosis,
  InvestigationOrder,
  ConsultationTreatmentPlan
} from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
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

interface ConsultationSummaryProps {
  consultationId: string
  onPrevious: () => void
  onComplete?: () => void
}

interface PatientSummary {
  full_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  gender: string | null
}

interface DoctorSummary {
  full_name: string | null
  name: string | null
  email: string | null
}

interface ConsultationData {
  session: ConsultationSession | null
  patient: PatientSummary | null
  doctor: DoctorSummary | null
  chiefComplaints: ConsultationChiefComplaint[]
  history: ConsultationHistory[]
  vitals: ConsultationVitals[]
  examinations: ExaminationFinding[]
  diagnoses: ConsultationDiagnosis[]
  investigations: InvestigationOrder[]
  treatmentPlan: ConsultationTreatmentPlan | null
}

export function ConsultationSummary({ consultationId, onPrevious, onComplete }: ConsultationSummaryProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    session: null,
    patient: null,
    doctor: null,
    chiefComplaints: [],
    history: [],
    vitals: [],
    examinations: [],
    diagnoses: [],
    investigations: [],
    treatmentPlan: null
  })

  // Load all consultation data
  useEffect(() => {
    const loadConsultationData = async () => {
      try {
        // Load consultation session first
        const { data: session, error: sessionError } = await supabase
          .from('consultation_sessions')
          .select('*')
          .eq('id', consultationId)
          .single()

        if (sessionError) throw sessionError

        // Load patient and doctor information separately
        let patient = null
        let doctor = null

        if (session.patient_id) {
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('full_name, date_of_birth, phone, email, gender')
            .eq('id', session.patient_id)
            .single()
          
          if (!patientError) patient = patientData
        }

        if (session.doctor_id) {
          const { data: doctorData, error: doctorError } = await supabase
            .from('users')
            .select('full_name, name, email')
            .eq('id', session.doctor_id)
            .single()
          
          if (!doctorError) doctor = doctorData
        }

        // Load all consultation components
        const [
          chiefComplaintsResult,
          historyResult,
          vitalsResult,
          examinationsResult,
          diagnosesResult,
          investigationsResult,
          treatmentPlanResult
        ] = await Promise.all([
          supabase.from('consultation_chief_complaints').select('*').eq('consultation_id', consultationId),
          supabase.from('consultation_history').select('*').eq('consultation_id', consultationId),
          supabase.from('consultation_vitals').select('*').eq('consultation_id', consultationId),
          supabase.from('examination_findings').select('*').eq('consultation_id', consultationId),
          supabase.from('consultation_diagnoses').select('*').eq('consultation_id', consultationId),
          supabase.from('investigation_orders').select('*').eq('consultation_id', consultationId),
          supabase.from('consultation_treatment_plans').select('*').eq('consultation_id', consultationId).order('created_at', { ascending: false })
        ])

        setConsultationData({
          session: session,
          patient: patient,
          doctor: doctor,
          chiefComplaints: chiefComplaintsResult.data || [],
          history: historyResult.data || [],
          vitals: vitalsResult.data || [],
          examinations: examinationsResult.data || [],
          diagnoses: diagnosesResult.data || [],
          investigations: investigationsResult.data || [],
          treatmentPlan: treatmentPlanResult.data && treatmentPlanResult.data.length > 0 ? treatmentPlanResult.data[0] : null
        })

      } catch (err) {
        console.error('Error loading consultation data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConsultationData()
  }, [consultationId, supabase])

  const completeConsultation = async () => {
    try {
      setCompleting(true)

      // Validation: Check for final diagnosis requirement
      const hasFinalDiagnosis = consultationData.diagnoses.some(
        diagnosis => diagnosis.diagnosis_type === 'final' && diagnosis.is_primary
      )

      if (!hasFinalDiagnosis) {
        return
      }

      // Check for pending investigations
      const hasInvestigations = consultationData.investigations.length > 0

      // Update consultation session as completed
      const now = new Date().toISOString()
      const { error: sessionUpdateError } = await supabase
        .from('consultation_sessions')
        .update({
          is_completed: true,
          ended_at: now,
          current_step: 'completed'
          // TODO: Re-enable when migration is applied
          // requires_followup: hasInvestigations
        })
        .eq('id', consultationId)

      if (sessionUpdateError) throw sessionUpdateError

      // Update visit status based on investigation requirements
      if (consultationData.session?.visit_id) {
        const visitStatus = hasInvestigations ? 'investigations_pending' : 'completed'
        
        await supabase
          .from('visits')
          .update({
            status: visitStatus,
            consultation_completed_at: now,
            consultation_status: 'completed'
          })
          .eq('id', consultationData.session.visit_id)

        // If investigations are ordered, show appropriate message
        if (hasInvestigations) {
        } else {
          }
      } else {
      }
      
      if (onComplete) {
        onComplete()
      } else {
        router.push('/doctor/patients')
      }

    } catch (err) {
      console.error('Error completing consultation:', err)
    } finally {
      setCompleting(false)
    }
  }

  // Generate Invoice Handler
  const handleGenerateInvoice = async () => {
    if (!consultationData.session || !consultationData.patient) {
      console.error("Missing required data for invoice generation");
      return;
    }

    try {
      console.log("Generating consultation invoice...");

      // Get appointment details first
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", consultationData.session.appointment_id)
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      // Check if invoice already exists
      const { data: existingInvoice, error: checkError } = await supabase
        .from("consultation_invoices")
        .select("*")
        .eq("appointment_id", consultationData.session.appointment_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingInvoice) {
        console.log("Invoice already exists, opening existing invoice");
        window.open(`/doctor/invoices/${existingInvoice.id}`, '_blank');
        return;
      }

      // Get consultation fee from department services
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("department", appointmentData.department)
        .eq("category", "consultation")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (servicesError && servicesError.code !== 'PGRST116') {
        throw servicesError;
      }

      const consultationFee = services?.price || 500; // Default fee if no service found

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create consultation invoice
      const invoiceData = {
        appointment_id: consultationData.session.appointment_id,
        consultation_session_id: consultationData.session.id,
        invoice_number: invoiceNumber,
        patient_name: consultationData.patient.full_name,
        patient_contact: consultationData.patient.phone || '',
        patient_address: '', // Not available in patient summary
        patient_email: consultationData.patient.email || '',
        doctor_name: consultationData.doctor?.full_name || consultationData.doctor?.name || 'Doctor',
        doctor_id: consultationData.session.doctor_id,
        department: appointmentData.department,
        consultation_fee: consultationFee,
        additional_charges: 0,
        discount_amount: 0,
        total_amount: consultationFee,
        consultation_date: consultationData.session.started_at ? new Date(consultationData.session.started_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        consultation_duration: consultationData.session.ended_at && consultationData.session.started_at ?
          Math.round((new Date(consultationData.session.ended_at).getTime() - new Date(consultationData.session.started_at).getTime()) / (1000 * 60)) : null,
        created_by: consultationData.session.doctor_id
      };

      const { data: newInvoice, error: invoiceError } = await supabase
        .from("consultation_invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      console.log("✅ Successfully generated consultation invoice");

      // Open invoice in new tab
      window.open(`/doctor/invoices/${newInvoice.id}`, '_blank');

    } catch (error) {
      console.error("❌ Error generating consultation invoice:", error);
    }
  };

  const exportSummary = () => {
    // This would generate a PDF or printable summary
  }

  const sendToPatient = () => {
    // This would email the summary to the patient
  }

  // Validation helper functions
  const hasFinalDiagnosis = consultationData.diagnoses.some(
    diagnosis => diagnosis.diagnosis_type === 'final' && diagnosis.is_primary
  )
  
  const hasInvestigations = consultationData.investigations.length > 0
  
  const canComplete = hasFinalDiagnosis

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Consultation Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Review the complete consultation details before finalizing.
        </p>
      </div>

      {/* Patient & Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">{consultationData.patient?.full_name}</h4>
              <p className="text-sm text-muted-foreground">
                Age: {consultationData.patient?.date_of_birth 
                  ? Math.floor((Date.now() - new Date(consultationData.patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                  : 'N/A'} years
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: {consultationData.patient?.phone}
              </p>
            </div>
            <div>
              <p className="text-sm">
                <strong>Doctor:</strong> Dr. {consultationData.doctor?.full_name}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {new Date(consultationData.session?.started_at || '').toLocaleDateString()}
              </p>
              <p className="text-sm">
                <strong>Time:</strong> {new Date(consultationData.session?.started_at || '').toLocaleTimeString()}
              </p>
              {consultationData.session?.total_duration_minutes && (
                <p className="text-sm">
                  <strong>Duration:</strong> {consultationData.session.total_duration_minutes} minutes
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Consultation Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Chief Complaints</span>
                </div>
                <p className="text-2xl font-bold">{consultationData.chiefComplaints.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Vital Signs</span>
                </div>
                <p className="text-2xl font-bold">{consultationData.vitals.length > 0 ? 'Recorded' : 'None'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Diagnoses</span>
                </div>
                <p className="text-2xl font-bold">{consultationData.diagnoses.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium">Investigations</span>
                </div>
                <p className="text-2xl font-bold">{consultationData.investigations.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Medications</span>
                </div>
                <p className="text-2xl font-bold">
                  {(() => {
                    const medications = consultationData.treatmentPlan?.medications || consultationData.treatmentPlan?.plan_details?.medications;
                    if (Array.isArray(medications)) {
                      return medications.length;
                    } else if (medications && typeof medications === 'object') {
                      return Object.keys(medications).length;
                    }
                    return 0;
                  })()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Ready to Complete
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Separator />

      {/* Chief Complaints Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Chief Complaints
        </h4>
        {consultationData.chiefComplaints.length > 0 ? (
          consultationData.chiefComplaints.map((complaint, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">Complaint {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Description:</strong> {complaint.complaint}</p>
                {complaint.duration && <p><strong>Duration:</strong> {complaint.duration}</p>}
                {complaint.severity && (
                  <p><strong>Severity:</strong> {complaint.severity}/10</p>
                )}
                {complaint.associated_symptoms && complaint.associated_symptoms.length > 0 && (
                  <div>
                    <p><strong>Associated Symptoms:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {complaint.associated_symptoms.map((symptom, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No chief complaints recorded
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Examination Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-500" />
          Physical Examination
        </h4>
        {/* Vitals */}
        {consultationData.vitals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultationData.vitals.map((vital, index) => (
                <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vital.temperature && <div><strong>Temperature:</strong> {vital.temperature}°C</div>}
                  {vital.heart_rate && <div><strong>Pulse:</strong> {vital.heart_rate} bpm</div>}
                  {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                    <div><strong>BP:</strong> {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</div>
                  )}
                  {vital.respiratory_rate && <div><strong>RR:</strong> {vital.respiratory_rate}/min</div>}
                  {vital.oxygen_saturation && <div><strong>SpO2:</strong> {vital.oxygen_saturation}%</div>}
                  {vital.height && vital.weight && (
                    <div><strong>BMI:</strong> {(vital.weight / ((vital.height / 100) ** 2)).toFixed(1)} kg/m²</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Physical Examination Findings */}
        {consultationData.examinations.length > 0 ? (
          consultationData.examinations.map((exam, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">Examination Finding {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {typeof exam.findings === 'string' ? (
                    <p>{exam.findings}</p>
                  ) : (
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(exam.findings, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : consultationData.vitals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No examination findings recorded
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Separator />

      {/* Diagnosis Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-purple-500" />
          Diagnosis
        </h4>
        {consultationData.diagnoses.length > 0 ? (
          consultationData.diagnoses.map((diagnosis, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">Diagnosis {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Condition:</strong> {diagnosis.diagnosis_text}</p>
                {diagnosis.icd10_code && <p><strong>ICD Code:</strong> {diagnosis.icd10_code}</p>}
                {diagnosis.confidence_level && (
                  <div className="flex items-center gap-2">
                    <strong>Confidence:</strong>
                    <Badge variant={diagnosis.confidence_level >= 4 ? 'default' : 'secondary'}>
                      {diagnosis.confidence_level}/5
                    </Badge>
                  </div>
                )}
                {diagnosis.clinical_notes && <p><strong>Notes:</strong> {diagnosis.clinical_notes}</p>}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No diagnoses recorded
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Investigations Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-teal-500" />
          Investigations & Tests
        </h4>
        {consultationData.investigations.length > 0 ? (
          consultationData.investigations.map((investigation, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {investigation.investigation_name}
                  <Badge 
                    variant={investigation.urgency === 'stat' ? 'destructive' : 
                            investigation.urgency === 'urgent' ? 'default' : 'secondary'}
                  >
                    {investigation.urgency}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Type:</strong> {investigation.investigation_type}</p>
                {investigation.clinical_indication && (
                  <p><strong>Clinical Indication:</strong> {investigation.clinical_indication}</p>
                )}
                {investigation.instructions && (
                  <p><strong>Instructions:</strong> {investigation.instructions}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No investigations ordered
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Treatment Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-green-500" />
          Treatment Plan
        </h4>
        {consultationData.treatmentPlan ? (
          <>
            {/* Medications */}
            {(consultationData.treatmentPlan.medications || consultationData.treatmentPlan.plan_details?.medications) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Medications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    // Try to get medications from either location
                    const medications = consultationData.treatmentPlan.medications || consultationData.treatmentPlan.plan_details?.medications;
                    
                    if (Array.isArray(medications)) {
                      return medications.map((medication: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{medication.medication_name || medication.generic_name || medication.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {medication.dosage && `${medication.dosage}`}
                                {medication.frequency && ` • ${medication.frequency}`}
                                {medication.duration && ` • ${medication.duration}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Route: {medication.route}
                              </p>
                              {medication.instructions && (
                                <p className="text-sm text-blue-600 mt-1">{medication.instructions}</p>
                              )}
                              {medication.category && (
                                <p className="text-sm text-gray-500 mt-1">Category: {medication.category}</p>
                              )}
                            </div>
                            {medication.is_critical && (
                              <Badge variant="destructive" className="ml-2">
                                Critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      ));
                    } else {
                      return (
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Medications data format:</p>
                          <pre className="text-xs bg-gray-50 p-2 mt-2 rounded overflow-auto">
                            {JSON.stringify(medications, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Lifestyle Modifications */}
            {consultationData.treatmentPlan.lifestyle_modifications && consultationData.treatmentPlan.lifestyle_modifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Lifestyle Modifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {consultationData.treatmentPlan.lifestyle_modifications.map((modification: string, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm">{modification}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Follow-up */}
            {consultationData.treatmentPlan.follow_up_required && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Follow-up Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {consultationData.treatmentPlan.follow_up_days && (
                    <p><strong>Follow-up in:</strong> {consultationData.treatmentPlan.follow_up_days} days</p>
                  )}
                  {consultationData.treatmentPlan.follow_up_instructions && (
                    <p><strong>Instructions:</strong> {consultationData.treatmentPlan.follow_up_instructions}</p>
                  )}
                  {consultationData.treatmentPlan.warning_signs && consultationData.treatmentPlan.warning_signs.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm"><strong>Warning Signs:</strong></p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {consultationData.treatmentPlan.warning_signs.map((sign: string, index: number) => (
                          <li key={index}>{sign}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No treatment plan recorded
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Requirements Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Completion Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {hasFinalDiagnosis ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Final Diagnosis Required</span>
              </div>
              <Badge variant={hasFinalDiagnosis ? 'default' : 'destructive'}>
                {hasFinalDiagnosis ? 'Complete' : 'Missing'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Investigation Orders</span>
              </div>
              <Badge variant="outline">
                {hasInvestigations ? `${consultationData.investigations.length} ordered` : 'None'}
              </Badge>
            </div>

            {hasInvestigations && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Follow-up Required:</strong> This consultation has {consultationData.investigations.length} pending investigations. 
                  A follow-up appointment will be scheduled to review results.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onPrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back: Treatment Plan
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

            {/* Generate Invoice Button - Only show if consultation is completed */}
            {consultationData.session?.is_completed && (
              <Button
                variant="outline"
                onClick={handleGenerateInvoice}
                className="border-green-200 hover:bg-green-50 hover:border-green-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            )}

            <Button
              onClick={completeConsultation}
              disabled={completing || !canComplete}
              className={`${
                canComplete
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {completing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Consultation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion Confirmation */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          {canComplete ? (
            <>
              Once you complete this consultation, it will be marked as finished and the patient&apos;s visit will be updated.
              {hasInvestigations && ' A follow-up consultation will be scheduled for investigation results.'}
              {' '}Make sure all information is accurate before proceeding.
            </>
          ) : (
            <>
              <strong>Cannot complete consultation:</strong> A final diagnosis is required before completion. 
              Please go back to the Diagnosis step and ensure at least one diagnosis is marked as &apos;Final&apos; and &apos;Primary&apos;.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}