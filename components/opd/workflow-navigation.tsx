'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2,
  Clock,
  ArrowRight,
  Stethoscope,
  ClipboardList,
  Pill,
  FileText,
  AlertCircle,
  Activity,
  PlayCircle,
  PauseCircle,
  SkipForward
} from 'lucide-react'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  icon: React.ComponentType<{ className?: string }>
  estimatedTime: string
  onStart?: () => void
  onPause?: () => void
  onSkip?: () => void
  isRequired: boolean
}

interface WorkflowNavigationProps {
  consultationCount: number
  treatmentCount: number
  prescriptionCount: number
  onAddConsultation: () => void
  onAddTreatment: () => void
  onAddPrescription: () => void
  currentWorkflow: 'none' | 'consultation' | 'treatment' | null
  sessionStatus: 'active' | 'completed' | 'follow_up_scheduled'
}

export function WorkflowNavigation({
  consultationCount,
  treatmentCount,
  prescriptionCount,
  onAddConsultation,
  onAddTreatment,
  onAddPrescription,
  currentWorkflow,
  sessionStatus
}: WorkflowNavigationProps) {
  const [activeStep, setActiveStep] = useState<string>('assessment')
  const [workflowProgress, setWorkflowProgress] = useState(0)

  // Define OPD workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'assessment',
      title: 'Initial Assessment',
      description: 'Review patient information and determine care pathway',
      status: sessionStatus === 'active' ? 'completed' : 'pending',
      icon: FileText,
      estimatedTime: '2-3 min',
      isRequired: true
    },
    {
      id: 'consultation',
      title: 'Medical Consultation',
      description: 'Conduct comprehensive patient consultation',
      status: consultationCount > 0 ? 'completed' : (currentWorkflow === 'consultation' ? 'in_progress' : 'pending'),
      icon: Stethoscope,
      estimatedTime: '15-20 min',
      onStart: onAddConsultation,
      isRequired: true
    },
    {
      id: 'treatment',
      title: 'Treatment Planning',
      description: 'Create and schedule treatment plans',
      status: treatmentCount > 0 ? 'completed' : (currentWorkflow === 'treatment' ? 'in_progress' : 'pending'),
      icon: ClipboardList,
      estimatedTime: '10-15 min',
      onStart: onAddTreatment,
      isRequired: false
    },
    {
      id: 'prescription',
      title: 'Medicine Prescription',
      description: 'Prescribe medications and dosages',
      status: prescriptionCount > 0 ? 'completed' : 'pending',
      icon: Pill,
      estimatedTime: '5-8 min',
      onStart: onAddPrescription,
      isRequired: false
    },
    {
      id: 'completion',
      title: 'Session Completion',
      description: 'Finalize session and schedule follow-up',
      status: sessionStatus === 'completed' ? 'completed' : 'pending',
      icon: CheckCircle2,
      estimatedTime: '3-5 min',
      isRequired: true
    }
  ]

  // Calculate workflow progress
  useEffect(() => {
    const completedSteps = workflowSteps.filter(step => step.status === 'completed').length
    const totalSteps = workflowSteps.length
    setWorkflowProgress((completedSteps / totalSteps) * 100)
  }, [consultationCount, treatmentCount, prescriptionCount, sessionStatus])

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-400" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepCardColor = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'skipped':
        return 'border-gray-200 bg-gray-50'
      default:
        return step.isRequired ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
    }
  }

  const isStepAvailable = (step: WorkflowStep, index: number) => {
    // First step is always available
    if (index === 0) return true
    
    // Step is available if previous required step is completed
    const previousSteps = workflowSteps.slice(0, index)
    const lastRequiredStep = previousSteps.reverse().find(s => s.isRequired)
    
    return lastRequiredStep ? lastRequiredStep.status === 'completed' : true
  }

  const handleStepAction = (step: WorkflowStep, action: 'start' | 'pause' | 'skip') => {
    switch (action) {
      case 'start':
        step.onStart?.()
        setActiveStep(step.id)
        break
      case 'pause':
        step.onPause?.()
        break
      case 'skip':
        step.onSkip?.()
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Workflow Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                OPD Workflow Navigation
              </CardTitle>
              <CardDescription>
                Complete patient care workflow with guided steps
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(workflowProgress)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{workflowSteps.filter(s => s.status === 'completed').length} of {workflowSteps.length} steps</span>
            </div>
            <Progress value={workflowProgress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Current Workflow Status */}
      {currentWorkflow && currentWorkflow !== 'none' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {currentWorkflow === 'consultation' ? '🩺 Consultation Workflow Active' : '📋 Treatment Workflow Active'}
              </span>
              <Badge variant="outline" className="animate-pulse">
                In Progress
              </Badge>
            </div>
            <p className="text-sm mt-1">
              {currentWorkflow === 'consultation' 
                ? 'Complete the consultation workflow to continue with other steps.'
                : 'Complete the treatment planning workflow to continue with other steps.'
              }
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          Workflow Steps
        </h3>
        
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          const isActive = activeStep === step.id
          const isAvailable = isStepAvailable(step, index)
          const nextStepIndex = workflowSteps.findIndex(s => s.status === 'pending' && isStepAvailable(s, workflowSteps.indexOf(s)))
          const isNextStep = nextStepIndex === index
          
          return (
            <Card 
              key={step.id} 
              className={`transition-all ${getStepCardColor(step)} ${
                isActive ? 'ring-2 ring-blue-500' : ''
              } ${
                isNextStep ? 'ring-1 ring-orange-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Number and Status */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : step.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : isNextStep
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="w-px h-8 bg-gray-300 mt-2" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                      {getStepStatusIcon(step.status)}
                      <Badge variant="outline" className="ml-auto">
                        {step.estimatedTime}
                      </Badge>
                      {step.isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {/* Step-specific information */}
                    {step.id === 'consultation' && consultationCount > 0 && (
                      <div className="mb-3 p-2 bg-green-100 rounded">
                        <span className="text-sm text-green-800">
                          ✅ {consultationCount} consultation{consultationCount > 1 ? 's' : ''} completed
                        </span>
                      </div>
                    )}
                    
                    {step.id === 'treatment' && treatmentCount > 0 && (
                      <div className="mb-3 p-2 bg-green-100 rounded">
                        <span className="text-sm text-green-800">
                          ✅ {treatmentCount} treatment plan{treatmentCount > 1 ? 's' : ''} created
                        </span>
                      </div>
                    )}
                    
                    {step.id === 'prescription' && prescriptionCount > 0 && (
                      <div className="mb-3 p-2 bg-green-100 rounded">
                        <span className="text-sm text-green-800">
                          ✅ {prescriptionCount} prescription{prescriptionCount > 1 ? 's' : ''} added
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      {step.status === 'pending' && isAvailable && step.onStart && (
                        <Button
                          size="sm"
                          onClick={() => handleStepAction(step, 'start')}
                          className="flex items-center gap-1"
                          variant={isNextStep ? 'default' : 'outline'}
                        >
                          <PlayCircle className="h-3 w-3" />
                          Start {step.title}
                        </Button>
                      )}
                      
                      {step.status === 'in_progress' && step.onPause && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepAction(step, 'pause')}
                        >
                          <PauseCircle className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      
                      {step.status === 'pending' && !step.isRequired && isAvailable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStepAction(step, 'skip')}
                          className="text-gray-500"
                        >
                          <SkipForward className="h-3 w-3 mr-1" />
                          Skip
                        </Button>
                      )}
                      
                      {step.status === 'completed' && step.onStart && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepAction(step, 'start')}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Review/Edit
                        </Button>
                      )}
                      
                      {!isAvailable && step.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          Complete previous steps first
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workflow Summary */}
      {workflowProgress === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Workflow Complete!</h3>
                <p className="text-green-700">
                  All required workflow steps have been completed. You can now finalize the session.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                Finalize Session
              </Button>
              <Button variant="outline">
                Review Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}