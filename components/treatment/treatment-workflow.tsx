'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Types
import { 
  TreatmentSession, 
  TreatmentStatus,
  Visit,
  Patient,
  UserProfile 
} from '@/lib/types'

// Local types
type TreatmentStep = 'treatment_planning' | 'goals_setting' | 'scheduling' | 'progress_tracking' | 'monitoring' | 'review' | 'completed'

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Clock, User, Calendar, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Treatment Step Components
import { TreatmentPlanForm } from './treatment-plan-form'
import { TreatmentGoalsForm } from './treatment-goals-form'
import { SessionSchedulingForm } from './session-scheduling-form'
import { ProgressTrackingForm } from './progress-tracking-form'
import { TreatmentMonitoringForm } from './treatment-monitoring-form'
import { TreatmentReviewForm } from './treatment-review-form'
import { TreatmentSummary } from './treatment-summary'

interface TreatmentWorkflowProps {
  appointmentId: string
  onComplete?: () => void
  onCancel?: () => void
}

const TREATMENT_STEPS: TreatmentStep[] = [
  'treatment_planning',
  'goals_setting',
  'scheduling',
  'progress_tracking',
  'monitoring',
  'review',
  'completed'
]

const STEP_LABELS = {
  treatment_planning: 'Treatment Planning',
  goals_setting: 'Goals Setting',
  scheduling: 'Session Scheduling',
  progress_tracking: 'Progress Tracking',
  monitoring: 'Treatment Monitoring',
  review: 'Treatment Review',
  completed: 'Summary'
}

const STEP_DESCRIPTIONS = {
  treatment_planning: 'Create comprehensive treatment plan with objectives and methods',
  goals_setting: 'Define specific treatment goals and measurable outcomes',
  scheduling: 'Schedule treatment sessions and follow-up appointments',
  progress_tracking: 'Monitor patient progress and treatment effectiveness',
  monitoring: 'Track treatment response and adjust as needed',
  review: 'Review treatment outcomes and plan next steps',
  completed: 'Finalize treatment workflow and documentation'
}

export function TreatmentWorkflow({ appointmentId, onComplete, onCancel }: TreatmentWorkflowProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [treatmentSession, setTreatmentSession] = useState<TreatmentSession | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctor, setDoctor] = useState<UserProfile | null>(null)
  const [currentStep, setCurrentStep] = useState<TreatmentStep>('treatment_planning')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load visit with patient data
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patients(*)
        `)
        .eq('id', appointmentId)
        .single()

      if (visitError) throw visitError
      if (!visitData) throw new Error('Visit not found')

      // Load doctor data separately
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

      // Check for existing treatment session
      const { data: sessionData, error: sessionError } = await supabase
        .from('treatment_sessions')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        // Handle missing table gracefully
        if (sessionError.message?.includes('does not exist') || 
            sessionError.message?.includes('404') ||
            (sessionError as any).status === 404) {
          console.warn('Treatment sessions table does not exist yet - this is expected for new installations')
        } else {
          throw sessionError
        }
      }

      if (sessionData) {
        setTreatmentSession(sessionData)
        setCurrentStep(sessionData.current_step)
        if (sessionData.started_at) {
          setStartTime(new Date(sessionData.started_at))
        }
      }

    } catch (err) {
      console.error('Error loading treatment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load treatment data')
    } finally {
      setLoading(false)
    }
  }, [appointmentId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Start treatment session
  const startTreatment = async () => {
    if (!visit || !doctor || !patient) return

    try {
      setSaving(true)
      const now = new Date()
      setStartTime(now)

      const { data: session, error } = await supabase
        .from('treatment_sessions')
        .insert({
          appointment_id: appointmentId,
          doctor_id: visit.doctor_id,
          patient_id: visit.patient_id,
          started_at: now.toISOString(),
          current_step: 'treatment_planning',
          is_completed: false
        })
        .select()
        .single()

      if (error) throw error

      // Update visit status
      await supabase
        .from('visits')
        .update({ 
          status: 'in_treatment',
          treatment_started_at: now.toISOString(),
          treatment_status: 'in_progress'
        })
        .eq('id', appointmentId)

      setTreatmentSession(session)

    } catch (err) {
      console.error('Error starting treatment:', err)
    } finally {
      setSaving(false)
    }
  }

  // Navigate to next step
  const nextStep = async () => {
    if (!treatmentSession) return

    const currentIndex = TREATMENT_STEPS.indexOf(currentStep)
    const nextStepIndex = currentIndex + 1

    if (nextStepIndex < TREATMENT_STEPS.length) {
      const newStep = TREATMENT_STEPS[nextStepIndex]
      
      try {
        setSaving(true)
        
        await supabase
          .from('treatment_sessions')
          .update({ current_step: newStep })
          .eq('id', treatmentSession.id)

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
    const currentIndex = TREATMENT_STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(TREATMENT_STEPS[currentIndex - 1])
    }
  }

  // Complete treatment
  const completeTreatment = async () => {
    if (!treatmentSession || !startTime) return

    try {
      setSaving(true)
      const now = new Date()
      const durationMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000)

      await supabase
        .from('treatment_sessions')
        .update({ 
          ended_at: now.toISOString(),
          is_completed: true,
          total_duration_minutes: durationMinutes,
          current_step: 'completed'
        })
        .eq('id', treatmentSession.id)

      // Update visit status
      await supabase
        .from('visits')
        .update({ 
          status: 'treatment_completed',
          treatment_ended_at: now.toISOString(),
          treatment_status: 'completed'
        })
        .eq('id', appointmentId)

      
      if (onComplete) {
        onComplete()
      } else {
        router.push('/doctor/patients')
      }

    } catch (err) {
      console.error('Error completing treatment:', err)
    } finally {
      setSaving(false)
    }
  }

  // Calculate progress
  const progress = (TREATMENT_STEPS.indexOf(currentStep) / (TREATMENT_STEPS.length - 1)) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading treatment workflow...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Treatment Workflow</h1>
          <p className="text-muted-foreground">
            Comprehensive treatment planning and management workflow
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {treatmentSession && currentStep !== 'completed' && (
            <Button 
              variant="destructive" 
              onClick={() => router.push('/doctor/dashboard')}
            >
              Exit Treatment Workflow
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
        {treatmentSession && startTime && (
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
              <Badge variant={treatmentSession.status === 'completed' ? 'secondary' : 'default'}>
                {treatmentSession.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Progress Bar */}
      {treatmentSession && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Treatment Progress</h3>
                <span className="text-sm text-muted-foreground">
                  Step {TREATMENT_STEPS.indexOf(currentStep) + 1} of {TREATMENT_STEPS.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {TREATMENT_STEPS.map((step, index) => (
                  <div 
                    key={step}
                    className={`text-center ${
                      index <= TREATMENT_STEPS.indexOf(currentStep) 
                        ? 'text-primary font-medium' 
                        : ''
                    }`}
                  >
                    <div className="mb-1">
                      {index < TREATMENT_STEPS.indexOf(currentStep) && (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-green-500" />
                      )}
                      {index === TREATMENT_STEPS.indexOf(currentStep) && (
                        <div className="w-4 h-4 mx-auto bg-primary rounded-full animate-pulse" />
                      )}
                      {index > TREATMENT_STEPS.indexOf(currentStep) && (
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
      {!treatmentSession ? (
        // Start Treatment
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Start Treatment Workflow</CardTitle>
            <CardDescription>
              Begin the comprehensive treatment planning process for {patient.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {TREATMENT_STEPS.slice(0, -1).map((step) => (
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
              onClick={startTreatment}
              disabled={saving}
            >
              {saving ? 'Starting...' : 'Start Treatment Workflow'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Treatment Steps
        <Card>
          <CardHeader>
            <CardTitle>{STEP_LABELS[currentStep]}</CardTitle>
            <CardDescription>{STEP_DESCRIPTIONS[currentStep]}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Render current step component */}
            {currentStep === 'treatment_planning' && (
              <TreatmentPlanForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
              />
            )}
            {currentStep === 'goals_setting' && (
              <TreatmentGoalsForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'scheduling' && (
              <SessionSchedulingForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'progress_tracking' && (
              <ProgressTrackingForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'monitoring' && (
              <TreatmentMonitoringForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'review' && (
              <TreatmentReviewForm 
                treatmentId={treatmentSession.id}
                onNext={nextStep}
                onPrevious={previousStep}
              />
            )}
            {currentStep === 'completed' && (
              <TreatmentSummary 
                treatmentId={treatmentSession.id}
                onComplete={completeTreatment}
                onPrevious={previousStep}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}