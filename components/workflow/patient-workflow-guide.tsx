'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
  UserCheck,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Heart
} from 'lucide-react'

interface WorkflowStep {
  id: string
  title: string
  description: string
  route: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  estimatedTime: string
  prerequisites?: string[]
  nextSteps?: string[]
}

const PATIENT_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'registration',
    title: 'Patient Registration',
    description: 'Register new patient with personal information, contact details, and medical history',
    route: '/receptionist/patients',
    icon: Users,
    roles: ['receptionist', 'admin'],
    status: 'pending',
    estimatedTime: '3-5 minutes',
    nextSteps: ['Create patient profile', 'Collect contact information', 'Record basic medical history']
  },
  {
    id: 'opd_creation',
    title: 'Start New OPD',
    description: 'Create new OPD record and assign patient to doctor queue',
    route: '/doctor/opd',
    icon: Activity,
    roles: ['doctor', 'receptionist', 'admin'],
    status: 'pending',
    estimatedTime: '2-3 minutes',
    prerequisites: ['Patient must be registered'],
    nextSteps: ['Generate OPD number', 'Assign to doctor', 'Set priority level']
  },
  {
    id: 'consultation',
    title: 'Medical Consultation',
    description: 'Conduct consultation, record symptoms, examination findings, and diagnosis',
    route: '/doctor/consultations',
    icon: Stethoscope,
    roles: ['doctor'],
    status: 'pending',
    estimatedTime: '10-20 minutes',
    prerequisites: ['OPD record created', 'Patient in queue'],
    nextSteps: ['Record chief complaint', 'Document examination', 'Provide diagnosis']
  },
  {
    id: 'treatment_plan',
    title: 'Treatment Plan',
    description: 'Create comprehensive treatment plan with sessions, procedures, and follow-up schedule',
    route: '/doctor/treatment-plans',
    icon: ClipboardList,
    roles: ['doctor'],
    status: 'pending',
    estimatedTime: '5-8 minutes',
    prerequisites: ['Consultation completed', 'Diagnosis confirmed'],
    nextSteps: ['Define treatment goals', 'Schedule sessions', 'Set follow-up dates']
  },
  {
    id: 'prescriptions',
    title: 'Medicine Prescription',
    description: 'Prescribe medications, set dosages, and send to pharmacy for dispensing',
    route: '/doctor/prescriptions',
    icon: Pill,
    roles: ['doctor'],
    status: 'pending',
    estimatedTime: '3-5 minutes',
    prerequisites: ['Consultation completed'],
    nextSteps: ['Select medicines', 'Set dosage & duration', 'Add instructions']
  },
  {
    id: 'pharmacy_dispatch',
    title: 'Pharmacy Dispensing',
    description: 'Dispense prescribed medications from pharmacy inventory',
    route: '/pharmacy/dispense',
    icon: Heart,
    roles: ['pharmacist'],
    status: 'pending',
    estimatedTime: '5-8 minutes',
    prerequisites: ['Prescription created'],
    nextSteps: ['Verify prescription', 'Check inventory', 'Dispense medicines']
  },
  {
    id: 'completion',
    title: 'Patient Completion',
    description: 'Mark patient visit as complete and schedule follow-up if needed',
    route: '/doctor/queue',
    icon: CheckCircle,
    roles: ['doctor', 'receptionist'],
    status: 'pending',
    estimatedTime: '2-3 minutes',
    prerequisites: ['All treatments completed'],
    nextSteps: ['Generate patient report', 'Schedule follow-up', 'Update medical records']
  }
]

interface PatientWorkflowGuideProps {
  currentStep?: string
  patientId?: string
  className?: string
  isExistingPatient?: boolean // Flag to indicate if patient is already registered
}

export function PatientWorkflowGuide({ currentStep, patientId, className, isExistingPatient = true }: PatientWorkflowGuideProps) {
  const router = useRouter()
  
  // If patient is existing (selected from list), start from OPD creation and mark registration as completed
  const getInitialSteps = () => {
    if (isExistingPatient && patientId) {
      return PATIENT_WORKFLOW_STEPS.map(step => 
        step.id === 'registration' 
          ? { ...step, status: 'completed' as const }
          : step
      )
    }
    return PATIENT_WORKFLOW_STEPS
  }
  
  const getInitialActiveStep = () => {
    if (currentStep) return currentStep
    if (isExistingPatient && patientId) return 'opd_creation'
    return 'registration'
  }
  
  const [activeStep, setActiveStep] = useState(getInitialActiveStep())
  const [workflowSteps, setWorkflowSteps] = useState(getInitialSteps())

  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const navigateToStep = (step: WorkflowStep) => {
    let targetRoute = step.route
    
    if (patientId && step.route.includes('[id]')) {
      targetRoute = step.route.replace('[id]', patientId)
    } else if (patientId && step.id === 'opd_creation') {
      // For OPD creation with workflow-selected patient, pass patient ID as URL parameter
      targetRoute = `${step.route}?patientId=${patientId}`
    }
    
    console.log(`Navigating to step: ${step.id}, route: ${targetRoute}`) // Debug log
    router.push(targetRoute)
    setActiveStep(step.id)
  }

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'skipped':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-gray-200 bg-white hover:bg-gray-50'
    }
  }

  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length
  const totalSteps = workflowSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workflow Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Patient Care Workflow</CardTitle>
              <CardDescription>
                Complete patient journey from registration to treatment completion
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {completedSteps}/{totalSteps}
              </div>
              <div className="text-sm text-gray-600">Steps Completed</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Navigation Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {patientId 
                ? `Working with selected patient (ID: ${patientId.slice(0, 8)}...) - Patient registration completed, ready for OPD workflow`
                : 'Start by registering a new patient to begin the workflow'
              }
            </span>
            {patientId && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push(`/doctor/patients/${patientId}`)}
              >
                <FileText className="h-4 w-4 mr-1" />
                View Patient Details
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Workflow Steps</h3>
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          const isActive = activeStep === step.id
          const isNext = index === 0 || workflowSteps[index - 1].status === 'completed'
          const isFirstAvailableStep = isExistingPatient && patientId && step.id === 'opd_creation'
          
          return (
            <Card 
              key={step.id} 
              className={`transition-all cursor-pointer ${getStepStatusColor(step.status)} ${
                isActive ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => navigateToStep(step)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Number and Status */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : isActive 
                          ? 'bg-blue-100 text-blue-800'
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
                    </div>
                    
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {/* Prerequisites */}
                    {step.prerequisites && step.prerequisites.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Prerequisites:</h5>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {step.prerequisites.map((prerequisite, i) => (
                            <li key={i}>{prerequisite}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Next Steps */}
                    {step.nextSteps && step.nextSteps.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Key Actions:</h5>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {step.nextSteps.map((nextStep, i) => (
                            <li key={i}>{nextStep}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateToStep(step)
                        }}
                        disabled={!isNext && !isFirstAvailableStep && step.status === 'pending'}
                        className="flex items-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {step.status === 'completed' ? 'Review' : 'Start Step'}
                      </Button>
                      
                      {step.status === 'pending' && (isNext || isFirstAvailableStep) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateStepStatus(step.id, 'in_progress')
                          }}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      
                      {step.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateStepStatus(step.id, 'completed')
                          }}
                        >
                          Mark Complete
                        </Button>
                      )}

                      <div className="ml-auto">
                        <Badge variant={step.roles.includes('doctor') ? 'default' : 'secondary'}>
                          {step.roles.join(', ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workflow Summary */}
      {completedSteps === totalSteps && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Workflow Complete!</h3>
                <p className="text-green-700">
                  Patient care workflow has been successfully completed. All steps have been finished.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button onClick={() => router.push('/doctor/dashboard')}>
                Return to Dashboard
              </Button>
              {patientId && (
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/doctor/patients/${patientId}`)}
                >
                  View Patient Summary
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}