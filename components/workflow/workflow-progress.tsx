'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  AlertCircle,
  Calendar,
  Activity,
  TrendingUp,
  Zap,
  Timer,
  Target
} from 'lucide-react'
import {
  workflowEngine,
  type WorkflowInstance,
  type WorkflowState,
  type WorkflowAction,
  PatientWorkflowState,
  AppointmentWorkflowState,
  PrescriptionWorkflowState
} from '@/lib/workflow/workflow-engine'

interface WorkflowProgressProps {
  workflowId: string
  userId: string
  className?: string
  compact?: boolean
  showActions?: boolean
  onStateTransition?: (fromState: string, toState: string) => void
}

export function WorkflowProgress({ 
  workflowId, 
  userId, 
  className = '', 
  compact = false, 
  showActions = true,
  onStateTransition
}: WorkflowProgressProps) {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null)
  const [stateDefinition, setStateDefinition] = useState<WorkflowState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    loadWorkflowData()
    
    // Set up periodic refresh for workflow updates
    const interval = setInterval(loadWorkflowData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [workflowId])

  const loadWorkflowData = () => {
    try {
      const workflowData = workflowEngine.getWorkflow(workflowId)
      if (workflowData) {
        setWorkflow(workflowData)
        // Get state definition from workflow engine
        const stateDefinition = getStateDefinition(workflowData.type, workflowData.currentState as string)
        setStateDefinition(stateDefinition)
      } else {
        setError('Workflow not found')
      }
    } catch (err) {
      setError('Failed to load workflow data')
      console.error('Workflow loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStateDefinition = (workflowType: string, state: string): WorkflowState | null => {
    // This would typically fetch from the workflow engine's state definitions
    // For now, we'll create a mock implementation based on the workflow type
    const stateDefinitions = {
      patient: {
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
            { id: 'insurance_info', name: 'Insurance Information', description: 'Verify insurance coverage', required: true, completed: false }
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
        [PatientWorkflowState.CONSULTATION]: {
          id: 'consultation',
          name: 'Doctor Consultation',
          description: 'Medical consultation with doctor',
          state: PatientWorkflowState.CONSULTATION,
          progress: 50,
          estimatedDuration: 30,
          canTransitionTo: [PatientWorkflowState.TREATMENT, PatientWorkflowState.PHARMACY, PatientWorkflowState.BILLING],
          requiredActions: [
            { id: 'examination', name: 'Physical Examination', description: 'Conduct physical examination', required: true, completed: false },
            { id: 'diagnosis', name: 'Diagnosis', description: 'Document diagnosis', required: true, completed: false }
          ]
        },
        [PatientWorkflowState.DISCHARGE]: {
          id: 'discharge',
          name: 'Discharge',
          description: 'Patient discharge and follow-up planning',
          state: PatientWorkflowState.DISCHARGE,
          progress: 95,
          canTransitionTo: [PatientWorkflowState.FOLLOW_UP],
          requiredActions: [
            { id: 'discharge_summary', name: 'Discharge Summary', description: 'Complete discharge summary', required: true, completed: false }
          ]
        }
      }
    }

    return (stateDefinitions as any)[workflowType]?.[state] || null
  }

  const handleActionComplete = async (actionId: string) => {
    if (!workflow) return

    try {
      await workflowEngine.completeAction({
        workflowId,
        actionId,
        userId
      })
      
      loadWorkflowData() // Refresh data
    } catch (err) {
      setError('Failed to complete action')
      console.error('Action completion error:', err)
    }
  }

  const handleStateTransition = async (toState: string) => {
    if (!workflow) return

    try {
      setTransitioning(true)
      await workflowEngine.transitionWorkflow({
        workflowId,
        toState: toState as any,
        action: `transition_to_${toState}`,
        userId
      })
      
      onStateTransition?.(workflow.currentState as string, toState)
      loadWorkflowData() // Refresh data
    } catch (err) {
      setError('Failed to transition workflow state')
      console.error('State transition error:', err)
    } finally {
      setTransitioning(false)
    }
  }

  const formatStateName = (state: string) => {
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case PatientWorkflowState.REGISTRATION:
        return <User className="h-4 w-4" />
      case PatientWorkflowState.WAITING:
        return <Clock className="h-4 w-4" />
      case PatientWorkflowState.CONSULTATION:
        return <Activity className="h-4 w-4" />
      case PatientWorkflowState.DISCHARGE:
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-500'
    if (progress >= 50) return 'text-blue-500'
    if (progress >= 25) return 'text-yellow-500'
    return 'text-gray-500'
  }

  const calculateEstimatedCompletion = () => {
    if (!workflow || !stateDefinition) return null

    const remainingStates = stateDefinition.canTransitionTo.length
    const avgDuration = stateDefinition.estimatedDuration || 20
    const estimatedMinutes = remainingStates * avgDuration
    
    const completionTime = new Date()
    completionTime.setMinutes(completionTime.getMinutes() + estimatedMinutes)
    
    return completionTime
  }

  const getActionPriority = (action: WorkflowAction) => {
    if (action.required && !action.completed) return 'high'
    if (!action.completed) return 'medium'
    return 'low'
  }

  const getActionIcon = (action: WorkflowAction) => {
    if (action.completed) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (action.required) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !workflow || !stateDefinition) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Workflow data not available'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const estimatedCompletion = calculateEstimatedCompletion()
  const completedActions = stateDefinition.requiredActions.filter(a => a.completed).length
  const totalActions = stateDefinition.requiredActions.length
  const nextStates = stateDefinition.canTransitionTo

  if (compact) {
    return (
      <Card className={`${className} border-l-4 border-blue-500`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStateIcon(workflow.currentState as string)}
              <div>
                <div className="font-medium text-sm">{stateDefinition.name}</div>
                <div className="text-xs text-gray-500">
                  {completedActions}/{totalActions} actions completed
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getProgressColor(workflow.progress)}`}>
                {workflow.progress}%
              </div>
              <Progress value={workflow.progress} className="w-16 h-2 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStateIcon(workflow.currentState as string)}
            <span>{stateDefinition.name}</span>
          </div>
          <Badge variant="outline" className="font-normal">
            {workflow.type} workflow
          </Badge>
        </CardTitle>
        <CardDescription>{stateDefinition.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className={`font-medium ${getProgressColor(workflow.progress)}`}>
              {workflow.progress}% Complete
            </span>
          </div>
          <Progress value={workflow.progress} className="h-3" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-gray-500" />
              <span>Started: {new Date(workflow.startedAt).toLocaleString()}</span>
            </div>
            {estimatedCompletion && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span>Est. completion: {estimatedCompletion.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Current State Actions */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Current State Actions
          </h4>
          
          <div className="space-y-3">
            {stateDefinition.requiredActions.map((action) => (
              <div
                key={action.id}
                className={`p-3 rounded-lg border ${
                  action.completed 
                    ? 'bg-green-50 border-green-200' 
                    : action.required 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(action)}
                    <div>
                      <div className="font-medium text-sm">{action.name}</div>
                      <div className="text-xs text-gray-600">{action.description}</div>
                      {action.completedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed by {action.completedBy} • {new Date(action.completedAt!).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!action.completed && showActions && (
                    <Button
                      size="sm"
                      variant={action.required ? "default" : "outline"}
                      onClick={() => handleActionComplete(action.id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalActions > 0 && (
            <div className="text-sm text-gray-600">
              {completedActions} of {totalActions} actions completed
              {completedActions === totalActions && (
                <span className="text-green-600 font-medium"> • All actions complete!</span>
              )}
            </div>
          )}
        </div>

        {/* Next Steps */}
        {nextStates.length > 0 && showActions && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Available Transitions
              </h4>
              
              <div className="grid gap-2">
                {nextStates.map((nextState) => (
                  <Button
                    key={nextState}
                    variant="outline"
                    className="justify-between"
                    disabled={transitioning || (stateDefinition.requiredActions.some(a => a.required && !a.completed))}
                    onClick={() => handleStateTransition(nextState as string)}
                  >
                    <span className="flex items-center gap-2">
                      {getStateIcon(nextState as string)}
                      Move to {formatStateName(nextState as string)}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              {stateDefinition.requiredActions.some(a => a.required && !a.completed) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete all required actions before transitioning to the next state.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Workflow Stats */}
        <Separator />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{workflow.transitions.length}</div>
            <div className="text-xs text-gray-500">Transitions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {workflow.transitions.reduce((sum, t) => sum + (t.duration || 0), 0)}m
            </div>
            <div className="text-xs text-gray-500">Total Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {stateDefinition.estimatedDuration || 0}m
            </div>
            <div className="text-xs text-gray-500">Est. Current State</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Workflow Actions Component for standalone action management
export function WorkflowActions({ workflowId, userId, className = '' }: {
  workflowId: string
  userId: string
  className?: string
}) {
  return (
    <WorkflowProgress
      workflowId={workflowId}
      userId={userId}
      className={className}
      compact={false}
      showActions={true}
    />
  )
}

// Compact workflow widget for dashboards
export function WorkflowWidget({ workflowId, userId, className = '' }: {
  workflowId: string
  userId: string
  className?: string
}) {
  return (
    <WorkflowProgress
      workflowId={workflowId}
      userId={userId}
      className={className}
      compact={true}
      showActions={false}
    />
  )
}
export default WorkflowProgress;
