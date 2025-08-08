'use client'

import { auditLogger, AuditEventType } from '@/lib/security/audit-logger'
import { notificationSystem, NotificationType, HealthcareNotifications } from '@/lib/notifications/notification-system'

// Workflow states for different healthcare processes
export enum PatientWorkflowState {
  REGISTRATION = 'registration',
  WAITING = 'waiting',
  TRIAGE = 'triage',
  CONSULTATION = 'consultation',
  DIAGNOSTICS = 'diagnostics',
  TREATMENT = 'treatment',
  PHARMACY = 'pharmacy',
  BILLING = 'billing',
  DISCHARGE = 'discharge',
  FOLLOW_UP = 'follow_up'
}

export enum AppointmentWorkflowState {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export enum PrescriptionWorkflowState {
  PRESCRIBED = 'prescribed',
  PHARMACY_REVIEW = 'pharmacy_review',
  DISPENSING = 'dispensing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DISPENSED = 'dispensed',
  COMPLETED = 'completed'
}

export enum ProcedureWorkflowState {
  SCHEDULED = 'scheduled',
  PRE_PROCEDURE = 'pre_procedure',
  IN_PROCEDURE = 'in_procedure',
  POST_PROCEDURE = 'post_procedure',
  RECOVERY = 'recovery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum BillingWorkflowState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  INSURANCE_REVIEW = 'insurance_review',
  PATIENT_PAYMENT = 'patient_payment',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded'
}

// Generic workflow state interface
export interface WorkflowState<T = string> {
  id: string
  name: string
  description: string
  state: T
  progress: number // 0-100
  estimatedDuration?: number // minutes
  actualDuration?: number // minutes
  canTransitionTo: T[]
  requiredActions: WorkflowAction[]
  metadata?: any
}

// Workflow action interface
export interface WorkflowAction {
  id: string
  name: string
  description: string
  required: boolean
  completed: boolean
  completedBy?: string
  completedAt?: string
  data?: any
}

// Workflow transition interface
export interface WorkflowTransition<T = string> {
  from: T
  to: T
  action: string
  userId: string
  timestamp: string
  data?: any
  duration?: number
}

// Workflow instance interface
export interface WorkflowInstance<T = string> {
  id: string
  type: string
  entityId: string
  entityType: string
  currentState: T
  previousState?: T
  progress: number
  startedAt: string
  estimatedCompletion?: string
  actualCompletion?: string
  transitions: WorkflowTransition<T>[]
  metadata?: any
}

// Patient workflow definition
const PATIENT_WORKFLOW_STATES: Record<PatientWorkflowState, WorkflowState<PatientWorkflowState>> = {
  [PatientWorkflowState.REGISTRATION]: {
    id: 'registration',
    name: 'Patient Registration',
    description: 'Initial patient registration and data collection',
    state: PatientWorkflowState.REGISTRATION,
    progress: 10,
    estimatedDuration: 15,
    canTransitionTo: [PatientWorkflowState.WAITING, PatientWorkflowState.TRIAGE],
    requiredActions: [
      { id: 'personal_info', name: 'Personal Information', description: 'Collect patient personal details', required: true, completed: false },
      { id: 'insurance_info', name: 'Insurance Information', description: 'Verify insurance coverage', required: true, completed: false },
      { id: 'medical_history', name: 'Medical History', description: 'Record patient medical history', required: false, completed: false }
    ]
  },
  [PatientWorkflowState.WAITING]: {
    id: 'waiting',
    name: 'Waiting Room',
    description: 'Patient waiting for consultation',
    state: PatientWorkflowState.WAITING,
    progress: 20,
    canTransitionTo: [PatientWorkflowState.TRIAGE, PatientWorkflowState.CONSULTATION],
    requiredActions: [
      { id: 'check_in', name: 'Check-in', description: 'Confirm patient arrival', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.TRIAGE]: {
    id: 'triage',
    name: 'Triage Assessment',
    description: 'Initial medical assessment and prioritization',
    state: PatientWorkflowState.TRIAGE,
    progress: 30,
    estimatedDuration: 10,
    canTransitionTo: [PatientWorkflowState.CONSULTATION, PatientWorkflowState.WAITING],
    requiredActions: [
      { id: 'vital_signs', name: 'Vital Signs', description: 'Record vital signs', required: true, completed: false },
      { id: 'chief_complaint', name: 'Chief Complaint', description: 'Document primary concern', required: true, completed: false },
      { id: 'priority_assessment', name: 'Priority Assessment', description: 'Assign triage priority', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.CONSULTATION]: {
    id: 'consultation',
    name: 'Doctor Consultation',
    description: 'Medical consultation with doctor',
    state: PatientWorkflowState.CONSULTATION,
    progress: 50,
    estimatedDuration: 30,
    canTransitionTo: [PatientWorkflowState.DIAGNOSTICS, PatientWorkflowState.TREATMENT, PatientWorkflowState.PHARMACY, PatientWorkflowState.DISCHARGE],
    requiredActions: [
      { id: 'examination', name: 'Physical Examination', description: 'Conduct physical examination', required: true, completed: false },
      { id: 'diagnosis', name: 'Diagnosis', description: 'Document diagnosis', required: true, completed: false },
      { id: 'treatment_plan', name: 'Treatment Plan', description: 'Create treatment plan', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.DIAGNOSTICS]: {
    id: 'diagnostics',
    name: 'Diagnostic Tests',
    description: 'Laboratory tests and imaging',
    state: PatientWorkflowState.DIAGNOSTICS,
    progress: 60,
    estimatedDuration: 45,
    canTransitionTo: [PatientWorkflowState.CONSULTATION, PatientWorkflowState.TREATMENT],
    requiredActions: [
      { id: 'lab_tests', name: 'Laboratory Tests', description: 'Complete lab tests', required: false, completed: false },
      { id: 'imaging', name: 'Medical Imaging', description: 'Complete imaging studies', required: false, completed: false },
      { id: 'results_review', name: 'Results Review', description: 'Review test results', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.TREATMENT]: {
    id: 'treatment',
    name: 'Treatment',
    description: 'Medical treatment and procedures',
    state: PatientWorkflowState.TREATMENT,
    progress: 70,
    estimatedDuration: 60,
    canTransitionTo: [PatientWorkflowState.PHARMACY, PatientWorkflowState.BILLING, PatientWorkflowState.DISCHARGE],
    requiredActions: [
      { id: 'procedure', name: 'Medical Procedure', description: 'Perform medical procedure', required: false, completed: false },
      { id: 'medication_admin', name: 'Medication Administration', description: 'Administer medications', required: false, completed: false },
      { id: 'treatment_notes', name: 'Treatment Notes', description: 'Document treatment provided', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.PHARMACY]: {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Prescription dispensing',
    state: PatientWorkflowState.PHARMACY,
    progress: 80,
    estimatedDuration: 20,
    canTransitionTo: [PatientWorkflowState.BILLING, PatientWorkflowState.DISCHARGE],
    requiredActions: [
      { id: 'prescription_review', name: 'Prescription Review', description: 'Review prescription for accuracy', required: true, completed: false },
      { id: 'medication_dispensing', name: 'Medication Dispensing', description: 'Dispense medications', required: true, completed: false },
      { id: 'patient_counseling', name: 'Patient Counseling', description: 'Counsel patient on medication use', required: true, completed: false }
    ]
  },
  [PatientWorkflowState.BILLING]: {
    id: 'billing',
    name: 'Billing & Payment',
    description: 'Process billing and payment',
    state: PatientWorkflowState.BILLING,
    progress: 90,
    estimatedDuration: 10,
    canTransitionTo: [PatientWorkflowState.DISCHARGE],
    requiredActions: [
      { id: 'invoice_generation', name: 'Invoice Generation', description: 'Generate patient invoice', required: true, completed: false },
      { id: 'payment_processing', name: 'Payment Processing', description: 'Process payment', required: true, completed: false },
      { id: 'insurance_claim', name: 'Insurance Claim', description: 'Submit insurance claim', required: false, completed: false }
    ]
  },
  [PatientWorkflowState.DISCHARGE]: {
    id: 'discharge',
    name: 'Discharge',
    description: 'Patient discharge and follow-up planning',
    state: PatientWorkflowState.DISCHARGE,
    progress: 95,
    estimatedDuration: 15,
    canTransitionTo: [PatientWorkflowState.FOLLOW_UP],
    requiredActions: [
      { id: 'discharge_summary', name: 'Discharge Summary', description: 'Complete discharge summary', required: true, completed: false },
      { id: 'discharge_instructions', name: 'Discharge Instructions', description: 'Provide discharge instructions', required: true, completed: false },
      { id: 'follow_up_scheduling', name: 'Follow-up Scheduling', description: 'Schedule follow-up appointment', required: false, completed: false }
    ]
  },
  [PatientWorkflowState.FOLLOW_UP]: {
    id: 'follow_up',
    name: 'Follow-up',
    description: 'Follow-up care and monitoring',
    state: PatientWorkflowState.FOLLOW_UP,
    progress: 100,
    canTransitionTo: [],
    requiredActions: [
      { id: 'follow_up_complete', name: 'Follow-up Complete', description: 'Follow-up care completed', required: true, completed: false }
    ]
  }
}

// Workflow engine class
export class WorkflowEngine<T = string> {
  private static instance: WorkflowEngine
  private workflows = new Map<string, WorkflowInstance>()
  private stateDefinitions: Map<string, Record<string, WorkflowState>> = new Map()

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine()
    }
    return WorkflowEngine.instance
  }

  constructor() {
    // Register workflow state definitions
    this.stateDefinitions.set('patient', PATIENT_WORKFLOW_STATES as Record<string, WorkflowState>)
    this.initializeWorkflowDefinitions()
  }

  private initializeWorkflowDefinitions(): void {
    // Additional workflow definitions can be registered here
    console.log('🔄 Workflow engine initialized with state definitions')
  }

  // Create new workflow instance
  async createWorkflow(params: {
    type: string
    entityId: string
    entityType: string
    initialState: T
    metadata?: any
    userId: string
  }): Promise<string> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const workflow: WorkflowInstance<T> = {
      id: workflowId,
      type: params.type,
      entityId: params.entityId,
      entityType: params.entityType,
      currentState: params.initialState,
      progress: this.calculateProgress(params.type, params.initialState as string),
      startedAt: new Date().toISOString(),
      transitions: [],
      metadata: params.metadata
    }

    this.workflows.set(workflowId, workflow as WorkflowInstance)

    // Log workflow creation
    await auditLogger.log(AuditEventType.SYSTEM_ERROR, {
      eventData: {
        action: 'workflow_created',
        workflowId,
        type: params.type,
        entityId: params.entityId,
        initialState: params.initialState
      },
      userId: params.userId
    })

    return workflowId
  }

  // Transition workflow to new state
  async transitionWorkflow(params: {
    workflowId: string
    toState: T
    action: string
    userId: string
    data?: any
  }): Promise<boolean> {
    const workflow = this.workflows.get(params.workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${params.workflowId} not found`)
    }

    const fromState = workflow.currentState
    
    // Validate transition
    if (!this.canTransition(workflow.type, fromState as string, params.toState as string)) {
      throw new Error(`Invalid transition from ${fromState} to ${params.toState}`)
    }

    // Calculate transition duration
    const lastTransition = workflow.transitions[workflow.transitions.length - 1]
    const duration = lastTransition ? 
      new Date().getTime() - new Date(lastTransition.timestamp).getTime() : 
      new Date().getTime() - new Date(workflow.startedAt).getTime()

    // Create transition record
    const transition: WorkflowTransition<T> = {
      from: fromState as T,
      to: params.toState,
      action: params.action,
      userId: params.userId,
      timestamp: new Date().toISOString(),
      data: params.data,
      duration: Math.floor(duration / 1000 / 60) // minutes
    }

    // Update workflow
    workflow.previousState = fromState as T
    workflow.currentState = params.toState as T
    workflow.progress = this.calculateProgress(workflow.type, params.toState as string)
    workflow.transitions.push(transition as WorkflowTransition)

    // Check if workflow is completed
    if (this.isWorkflowComplete(workflow.type, params.toState as string)) {
      workflow.actualCompletion = new Date().toISOString()
    }

    // Send notifications for state changes
    await this.sendStateChangeNotifications(workflow, transition as WorkflowTransition, params.userId)

    // Log transition
    await auditLogger.log(AuditEventType.SYSTEM_ERROR, {
      eventData: {
        action: 'workflow_transition',
        workflowId: params.workflowId,
        from: fromState,
        to: params.toState,
        duration: transition.duration
      },
      userId: params.userId
    })

    return true
  }

  // Complete workflow action
  async completeAction(params: {
    workflowId: string
    actionId: string
    userId: string
    data?: any
  }): Promise<void> {
    const workflow = this.workflows.get(params.workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${params.workflowId} not found`)
    }

    const stateDefinition = this.getStateDefinition(workflow.type, workflow.currentState as string)
    if (!stateDefinition) {
      throw new Error(`State definition not found for ${workflow.type}:${workflow.currentState}`)
    }

    const action = stateDefinition.requiredActions.find(a => a.id === params.actionId)
    if (!action) {
      throw new Error(`Action ${params.actionId} not found in state ${workflow.currentState}`)
    }

    // Mark action as completed
    action.completed = true
    action.completedBy = params.userId
    action.completedAt = new Date().toISOString()
    action.data = params.data

    // Update workflow progress based on completed actions
    const completedActions = stateDefinition.requiredActions.filter(a => a.completed).length
    const totalActions = stateDefinition.requiredActions.length
    const actionProgress = (completedActions / totalActions) * 10 // 10% per state
    const baseProgress = this.calculateProgress(workflow.type, workflow.currentState as string)
    
    workflow.progress = Math.min(100, baseProgress + actionProgress)

    // Log action completion
    await auditLogger.log(AuditEventType.SYSTEM_ERROR, {
      eventData: {
        action: 'workflow_action_completed',
        workflowId: params.workflowId,
        actionId: params.actionId,
        state: workflow.currentState
      },
      userId: params.userId
    })

    // Check if all required actions are completed for auto-transition
    const allRequiredCompleted = stateDefinition.requiredActions
      .filter(a => a.required)
      .every(a => a.completed)

    if (allRequiredCompleted) {
      // Send notification that state is ready for transition
      await notificationSystem.createNotification({
        type: NotificationType.PATIENT_READY_FOR_CONSULTATION,
        title: 'Workflow Ready for Next Step',
        message: `All required actions completed for ${stateDefinition.name}`,
        recipientId: params.userId,
        data: {
          workflowId: params.workflowId,
          currentState: workflow.currentState,
          nextStates: stateDefinition.canTransitionTo
        }
      })
    }
  }

  // Validate if transition is allowed
  private canTransition(workflowType: string, fromState: string, toState: string): boolean {
    const stateDefinition = this.getStateDefinition(workflowType, fromState)
    return stateDefinition ? stateDefinition.canTransitionTo.includes(toState as any) : false
  }

  // Get state definition
  private getStateDefinition(workflowType: string, state: string): WorkflowState | null {
    const definitions = this.stateDefinitions.get(workflowType)
    return definitions ? definitions[state] || null : null
  }

  // Calculate progress percentage
  private calculateProgress(workflowType: string, state: string): number {
    const stateDefinition = this.getStateDefinition(workflowType, state)
    return stateDefinition ? stateDefinition.progress : 0
  }

  // Check if workflow is complete
  private isWorkflowComplete(workflowType: string, state: string): boolean {
    const stateDefinition = this.getStateDefinition(workflowType, state)
    return stateDefinition ? stateDefinition.canTransitionTo.length === 0 : false
  }

  // Send state change notifications
  private async sendStateChangeNotifications(
    workflow: WorkflowInstance, 
    transition: WorkflowTransition, 
    _userId: string
  ): Promise<void> {
    // Example notifications based on workflow type and state
    if (workflow.type === 'patient') {
      switch (transition.to) {
        case PatientWorkflowState.WAITING:
          await HealthcareNotifications.notifyPatientArrival(
            workflow.entityId,
            workflow.metadata?.patientName || 'Patient',
            workflow.metadata?.doctorId || ''
          )
          break
        case PatientWorkflowState.CONSULTATION:
          await HealthcareNotifications.notifyConsultationReady(
            workflow.entityId,
            workflow.metadata?.patientName || 'Patient',
            workflow.metadata?.doctorId || ''
          )
          break
        case PatientWorkflowState.PHARMACY:
          await HealthcareNotifications.notifyPrescriptionReady(
            workflow.entityId,
            workflow.metadata?.patientName || 'Patient',
            workflow.metadata?.prescriptionId || ''
          )
          break
      }
    }
  }

  // Get workflow by ID
  getWorkflow(workflowId: string): WorkflowInstance | null {
    return this.workflows.get(workflowId) || null
  }

  // Get workflows by entity
  getWorkflowsByEntity(entityId: string, entityType: string): WorkflowInstance[] {
    return Array.from(this.workflows.values())
      .filter(w => w.entityId === entityId && w.entityType === entityType)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }

  // Get active workflows
  getActiveWorkflows(): WorkflowInstance[] {
    return Array.from(this.workflows.values())
      .filter(w => !w.actualCompletion)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
  }

  // Get workflow statistics
  getWorkflowStats(): {
    total: number
    active: number
    completed: number
    averageDuration: number
    byType: Record<string, number>
  } {
    const allWorkflows = Array.from(this.workflows.values())
    const active = allWorkflows.filter(w => !w.actualCompletion)
    const completed = allWorkflows.filter(w => w.actualCompletion)
    
    const durations = completed
      .map(w => new Date(w.actualCompletion!).getTime() - new Date(w.startedAt).getTime())
      .filter(d => d > 0)
    
    const averageDuration = durations.length > 0 ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length / 1000 / 60 : 0 // minutes

    const byType = allWorkflows.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: allWorkflows.length,
      active: active.length,
      completed: completed.length,
      averageDuration: Math.round(averageDuration),
      byType
    }
  }

  // Get bottleneck analysis
  getBottleneckAnalysis(): {
    slowestStates: Array<{ state: string; averageDuration: number; count: number }>
    stateDistribution: Record<string, number>
  } {
    const stateData = new Map<string, { durations: number[]; count: number }>()

    // Analyze all transitions
    for (const workflow of this.workflows.values()) {
      for (const transition of workflow.transitions) {
        const key = `${workflow.type}:${transition.from}`
        const data = stateData.get(key) || { durations: [], count: 0 }
        
        if (transition.duration) {
          data.durations.push(transition.duration)
        }
        data.count++
        stateData.set(key, data)
      }
    }

    // Calculate averages and sort by duration
    const slowestStates = Array.from(stateData.entries())
      .map(([state, data]) => ({
        state,
        averageDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length || 0,
        count: data.count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10)

    // Current state distribution
    const stateDistribution = Array.from(this.workflows.values())
      .reduce((acc, w) => {
        if (!w.actualCompletion) {
          const key = `${w.type}:${w.currentState}`
          acc[key] = (acc[key] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

    return {
      slowestStates,
      stateDistribution
    }
  }
}

// Export singleton instance
export const workflowEngine = WorkflowEngine.getInstance()