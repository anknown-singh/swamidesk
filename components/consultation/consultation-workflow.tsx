'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Types
import { 
  ConsultationSession, 
  ConsultationStep, 
  ConsultationStatus,
  Visit,
  Patient,
  UserProfile 
} from '@/lib/types'

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Clock, User, Calendar, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Consultation Step Components
import { ChiefComplaintsForm } from './chief-complaints-form'
import { HistoryTakingForm } from './history-taking-form'
import { VitalsForm } from './vitals-form'
import { ExaminationForm } from './examination-form'
import { DiagnosisForm } from './diagnosis-form'
import { InvestigationOrdersForm } from './investigation-orders-form'
import { TreatmentPlanForm } from './treatment-plan-form'
import { ConsultationSummary } from './consultation-summary'

interface ConsultationWorkflowProps {
  visitId: string
  onComplete?: () => void
  onCancel?: () => void
}

const CONSULTATION_STEPS: ConsultationStep[] = [
  'chief_complaints',
  'history',
  'vitals',
  'examination',
  'diagnosis',
  'investigations',
  'treatment',
  'completed'
]

const STEP_LABELS = {
  chief_complaints: 'Chief Complaints',
  history: 'History Taking',
  vitals: 'Vital Signs',
  examination: 'Physical Examination',
  diagnosis: 'Diagnosis',
  investigations: 'Investigations',
  treatment: 'Treatment Plan',
  completed: 'Summary'
}

const STEP_DESCRIPTIONS = {
  chief_complaints: 'Document patient\'s primary concerns and symptoms',
  history: 'Collect comprehensive medical and personal history',
  vitals: 'Record vital signs and basic measurements',
  examination: 'Perform systematic physical examination',
  diagnosis: 'Formulate provisional and final diagnoses',
  investigations: 'Order laboratory tests and imaging studies',
  treatment: 'Create comprehensive treatment plan',
  completed: 'Review and finalize consultation'
}

export function ConsultationWorkflow({ visitId, onComplete, onCancel }: ConsultationWorkflowProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [consultationSession, setConsultationSession] = useState<ConsultationSession | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctor, setDoctor] = useState<UserProfile | null>(null)
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('chief_complaints')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load visit with patient data (using application-layer join for doctor)
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patients(*)
        `)
        .eq('id', visitId)
        .single()

      if (visitError) throw visitError
      if (!visitData) throw new Error('Visit not found')

      // Load doctor data separately (application-layer join)
      let doctorData = null
      if (visitData.doctor_id) {
        const { data: doctorResult, error: doctorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', visitData.doctor_id)
          .single()

        if (doctorError) {
          console.warn('Could not load doctor data:', doctorError.message)
        } else {
          doctorData = doctorResult
        }
      }

      setVisit(visitData)
      setPatient(visitData.patients)
      setDoctor(doctorData)

      // Check for existing consultation session
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('visit_id', visitId)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        // Handle missing table gracefully (404 errors)
        if (sessionError.message?.includes('does not exist') || 
            sessionError.message?.includes('404') ||
            sessionError.status === 404) {
          console.warn('Consultation sessions table does not exist yet - this is expected for new installations')
        } else {
          throw sessionError
        }
      }

      if (sessionData) {
        setConsultationSession(sessionData)
        setCurrentStep(sessionData.current_step)
        if (sessionData.started_at) {
          setStartTime(new Date(sessionData.started_at))
        }
      }

    } catch (err) {
      console.error('Error loading consultation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load consultation data')
    } finally {
      setLoading(false)
    }
  }, [visitId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Start consultation session
  const startConsultation = async () => {
    if (!visit || !doctor || !patient) return

    try {
      setSaving(true)
      const now = new Date()
      setStartTime(now)

      const { data: session, error } = await supabase
        .from('consultation_sessions')
        .insert({
          visit_id: visitId,
          doctor_id: visit.doctor_id,
          patient_id: visit.patient_id,
          started_at: now.toISOString(),
          current_step: 'chief_complaints',
          is_completed: false
        })
        .select()
        .single()

      if (error) throw error

      // Update visit status
      await supabase
        .from('visits')
        .update({ 
          status: 'in_consultation',
          actual_start_time: now.toISOString(),
          consultation_status: 'in_progress'
        })
        .eq('id', visitId)

      setConsultationSession(session)

    } catch (err) {
      console.error('Error starting consultation:', err)
    } finally {
      setSaving(false)
    }
  }

  // Navigate to next step
  const nextStep = async () => {
    if (!consultationSession) return

    const currentIndex = CONSULTATION_STEPS.indexOf(currentStep)
    const nextStepIndex = currentIndex + 1

    if (nextStepIndex < CONSULTATION_STEPS.length) {
      const newStep = CONSULTATION_STEPS[nextStepIndex]
      
      try {
        setSaving(true)
        
        await supabase
          .from('consultation_sessions')
          .update({ current_step: newStep })
          .eq('id', consultationSession.id)

        setCurrentStep(newStep)

      } catch (err) {
        console.error('Error updating step:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  // Navigate to previous step
  const previousStep = () => {
    const currentIndex = CONSULTATION_STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(CONSULTATION_STEPS[currentIndex - 1])
    }
  }

  // Complete consultation
  const completeConsultation = async () => {
    if (!consultationSession || !startTime) return

    try {
      setSaving(true)

      // First, validate that we have a final diagnosis
      const { data: diagnoses, error: diagnosisError } = await supabase
        .from('consultation_diagnoses')
        .select('*')
        .eq('consultation_id', consultationSession.id)

      if (diagnosisError) throw diagnosisError

      const hasFinalDiagnosis = diagnoses?.some(
        diagnosis => diagnosis.diagnosis_type === 'final' && diagnosis.is_primary
      )

      if (!hasFinalDiagnosis) {
        return
      }

      // Check for pending investigations
      const { data: investigations, error: investigationsError } = await supabase
        .from('investigation_orders')
        .select('*')
        .eq('consultation_id', consultationSession.id)

      if (investigationsError) throw investigationsError

      const hasInvestigations = investigations && investigations.length > 0

      const now = new Date()
      const durationMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000)

      // Update consultation session with follow-up requirements
      await supabase
        .from('consultation_sessions')
        .update({ 
          ended_at: now.toISOString(),
          is_completed: true,
          total_duration_minutes: durationMinutes,
          current_step: 'completed'
          // TODO: Re-enable when migration is applied
          // requires_followup: hasInvestigations,
          // followup_reason: hasInvestigations ? 'investigation_results' : null
        })
        .eq('id', consultationSession.id)

      // Update visit status based on investigation requirements
      const visitStatus = hasInvestigations ? 'investigations_pending' : 'completed'
      
      await supabase
        .from('visits')
        .update({ 
          status: visitStatus,
          actual_end_time: now.toISOString(),
          consultation_status: 'completed',
          requires_investigation_followup: hasInvestigations
        })
        .eq('id', visitId)

      // Show appropriate success message
      if (hasInvestigations) {
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
      setSaving(false)
    }
  }

  // Calculate progress
  const progress = (CONSULTATION_STEPS.indexOf(currentStep) / (CONSULTATION_STEPS.length - 1)) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading consultation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!visit || !patient || !doctor) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Required data not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation</h1>
          <p className="text-muted-foreground">
            Comprehensive patient consultation workflow
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {consultationSession && currentStep !== 'completed' && (
            <Button 
              variant="destructive" 
              onClick={() => router.push('/doctor/dashboard')}
            >
              Exit Consultation
            </Button>
          )}
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{patient.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>📞 {patient.phone || 'No phone'}</span>
                  <span>🎂 {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'No DOB'}</span>
                  <span>⚧ {patient.gender || 'Not specified'}</span>
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Doctor</div>
              <div className="font-medium">Dr. {doctor.full_name}</div>
              <div className="text-sm text-muted-foreground">{doctor.department}</div>
            </div>
          </div>
        </CardHeader>
        {consultationSession && startTime && (
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Started: {startTime.toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration: {Math.round((Date.now() - startTime.getTime()) / 60000)} min
                </span>
              </div>
              <Badge variant={consultationSession.is_completed ? 'success' : 'default'}>
                {consultationSession.is_completed ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Progress Bar */}
      {consultationSession && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Consultation Progress</h3>
                <span className="text-sm text-muted-foreground">
                  Step {CONSULTATION_STEPS.indexOf(currentStep) + 1} of {CONSULTATION_STEPS.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {CONSULTATION_STEPS.map((step, index) => (
                  <div 
                    key={step}
                    className={`text-center ${
                      index <= CONSULTATION_STEPS.indexOf(currentStep) 
                        ? 'text-primary font-medium' 
                        : ''
                    }`}
                  >
                    <div className="mb-1">
                      {index < CONSULTATION_STEPS.indexOf(currentStep) && (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-green-500" />
                      )}
                      {index === CONSULTATION_STEPS.indexOf(currentStep) && (
                        <div className="w-4 h-4 mx-auto bg-primary rounded-full animate-pulse" />
                      )}
                      {index > CONSULTATION_STEPS.indexOf(currentStep) && (
                        <div className="w-4 h-4 mx-auto bg-muted rounded-full" />
                      )}
                    </div>
                    <div className="truncate w-16">{STEP_LABELS[step]}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!consultationSession ? (
        // Start Consultation
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Start Consultation</CardTitle>
            <CardDescription>
              Begin the comprehensive consultation process with {patient.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {CONSULTATION_STEPS.slice(0, -1).map((step) => (
                <div key={step} className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{STEP_LABELS[step]}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {STEP_DESCRIPTIONS[step]}
                  </div>
                </div>
              ))}
            </div>
            <Button 
              size="lg" 
              onClick={startConsultation}
              disabled={saving}
            >
              {saving ? 'Starting...' : 'Start Consultation'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Consultation Steps
        <Card>
          <CardHeader>
            <CardTitle>{STEP_LABELS[currentStep]}</CardTitle>
            <CardDescription>{STEP_DESCRIPTIONS[currentStep]}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Render current step component */}
            {currentStep === 'chief_complaints' && (
              <ChiefComplaintsForm 
                consultationId={consultationSession.id}
                visitData={visit}
                onNext={nextStep}
              />
            )}
            {currentStep === 'history' && (
              <HistoryTakingForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'vitals' && (
              <VitalsForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'examination' && (
              <ExaminationForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'diagnosis' && (
              <DiagnosisForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'investigations' && (
              <InvestigationOrdersForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'treatment' && (
              <TreatmentPlanForm 
                consultationId={consultationSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'completed' && (
              <ConsultationSummary 
                consultationId={consultationSession.id}
                onComplete={completeConsultation}
                onPrevious={previousStep}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}