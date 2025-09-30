'use client'

import { ReactNode } from 'react'

// Base consultation step types that can be extended by specialties
export type BaseConsultationStep =
  | 'chief_complaints'
  | 'history'
  | 'vitals'
  | 'examination'
  | 'diagnosis'
  | 'investigations'
  | 'treatment'
  | 'completed'

// Base consultation session interface
export interface BaseConsultationSession {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  specialty: string
  current_step: string
  status: 'active' | 'completed' | 'paused'
  started_at: string
  completed_at?: string
  is_completed: boolean
  session_data: Record<string, any>
}

// Base consultation workflow props
export interface BaseConsultationWorkflowProps {
  appointmentId: string
  specialty?: string
  onComplete?: () => void
  onCancel?: () => void
  customSteps?: string[]
}

// Base step component props
export interface BaseStepComponentProps {
  consultationId: string
  patientId: string
  appointmentId: string
  onNext?: () => void
  onPrevious?: () => void
  onSave?: (data: any) => Promise<void>
  isReadOnly?: boolean
}

// Specialty configuration interface
export interface SpecialtyConfig {
  name: string
  displayName: string
  steps: BaseConsultationStep[]
  customFields?: Record<string, any>
  requiredSteps?: BaseConsultationStep[]
  optionalSteps?: BaseConsultationStep[]
}

// Base consultation workflow component interface
export interface BaseConsultationWorkflowComponent {
  specialty: string
  config: SpecialtyConfig
  renderStep: (step: BaseConsultationStep, props: BaseStepComponentProps) => ReactNode
}

// Predefined specialty configurations
export const SPECIALTY_CONFIGS: Record<string, SpecialtyConfig> = {
  'general-medicine': {
    name: 'general-medicine',
    displayName: 'General Medicine',
    steps: ['chief_complaints', 'history', 'vitals', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'vitals', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'investigations', 'treatment']
  },
  'cardiology': {
    name: 'cardiology',
    displayName: 'Cardiology',
    steps: ['chief_complaints', 'history', 'vitals', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'vitals', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'investigations', 'treatment'],
    customFields: {
      ecgRequired: true,
      echoRequired: false,
      stressTestRequired: false
    }
  },
  'orthopedics': {
    name: 'orthopedics',
    displayName: 'Orthopedics',
    steps: ['chief_complaints', 'history', 'vitals', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'vitals', 'investigations', 'treatment'],
    customFields: {
      xrayRequired: true,
      mriRequired: false,
      rangeOfMotionTest: true
    }
  },
  'dermatology': {
    name: 'dermatology',
    displayName: 'Dermatology',
    steps: ['chief_complaints', 'history', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'investigations', 'treatment'],
    customFields: {
      skinPhotography: true,
      biopsyRequired: false,
      allergySensitivityTest: false
    }
  },
  'pediatrics': {
    name: 'pediatrics',
    displayName: 'Pediatrics',
    steps: ['chief_complaints', 'history', 'vitals', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'vitals', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'investigations', 'treatment'],
    customFields: {
      growthChart: true,
      developmentalAssessment: true,
      vaccinationStatus: true
    }
  },
  'dental': {
    name: 'dental',
    displayName: 'Dental',
    steps: ['chief_complaints', 'examination', 'diagnosis', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'examination', 'diagnosis', 'treatment'],
    optionalSteps: [],
    customFields: {
      dentalChart: true,
      periodontalCharting: true,
      oralPhotography: false,
      radiographs: true,
      vitalityTesting: false
    }
  },
  'ent': {
    name: 'ent',
    displayName: 'ENT (Otolaryngology)',
    steps: ['chief_complaints', 'history', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'examination', 'diagnosis'],
    optionalSteps: ['history', 'investigations', 'treatment'],
    customFields: {
      otoscopy: true,
      rhinoscopy: true,
      laryngoscopy: false,
      audiometry: false,
      nasalEndoscopy: false
    }
  },
  'facial-plastic-surgery': {
    name: 'facial-plastic-surgery',
    displayName: 'Facial Plastic Surgery',
    steps: ['chief_complaints', 'history', 'examination', 'diagnosis', 'investigations', 'treatment', 'completed'],
    requiredSteps: ['chief_complaints', 'examination', 'diagnosis', 'treatment'],
    optionalSteps: ['history', 'investigations'],
    customFields: {
      facialPhotography: true,
      aestheticAssessment: true,
      functionalAssessment: true,
      computerImaging: false,
      surgicalPlanning: true
    }
  }
}

// Utility function to get specialty configuration
export function getSpecialtyConfig(specialty: string): SpecialtyConfig {
  return SPECIALTY_CONFIGS[specialty] || SPECIALTY_CONFIGS['general-medicine']
}

// Utility function to validate consultation step completion
export function validateStepCompletion(
  step: BaseConsultationStep,
  data: any,
  config: SpecialtyConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Basic validation - can be extended by specialties
  if (!data || Object.keys(data).length === 0) {
    errors.push(`${step} data is required`)
  }

  // Check if step is required for this specialty
  if (config.requiredSteps?.includes(step) && (!data || Object.keys(data).length === 0)) {
    errors.push(`${step} is required for ${config.displayName}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Hook for consultation session management (to be implemented)
export interface UseConsultationSessionReturn {
  session: BaseConsultationSession | null
  currentStep: BaseConsultationStep
  isLoading: boolean
  error: string | null
  startSession: (appointmentId: string, specialty: string) => Promise<void>
  updateStep: (step: BaseConsultationStep, data: any) => Promise<void>
  completeSession: () => Promise<void>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
}