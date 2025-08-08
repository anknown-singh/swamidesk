'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  FileText,
  Send,
  X,
  Info,
  Zap,
  Target,
  Calendar,
  Timer,
  MessageSquare
} from 'lucide-react'
import {
  workflowEngine,
  type WorkflowInstance,
  type WorkflowState,
  type WorkflowAction,
  PatientWorkflowState
} from '@/lib/workflow/workflow-engine'
import { notificationSystem, NotificationType } from '@/lib/notifications/notification-system'

interface WorkflowTransitionManagerProps {
  workflowId: string
  userId: string
  userName: string
  onTransition?: (fromState: string, toState: string) => void
  onError?: (error: string) => void
  className?: string
}

interface TransitionData {
  notes?: string
  attachments?: File[]
  metadata?: Record<string, any>
}

export function WorkflowTransitionManager({
  workflowId,
  userId,
  userName,
  onTransition,
  onError,
  className = ''
}: WorkflowTransitionManagerProps) {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null)
  const [currentStateDefinition, setCurrentStateDefinition] = useState<WorkflowState | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Dialog states
  const [showTransitionDialog, setShowTransitionDialog] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<string>('')
  const [transitionData, setTransitionData] = useState<TransitionData>({})
  
  // Action completion states
  const [completingAction, setCompletingAction] = useState<string>('')
  const [actionNotes, setActionNotes] = useState<string>('')

  useEffect(() => {
    loadWorkflowData()
  }, [workflowId])

  const loadWorkflowData = () => {
    try {
      const workflowData = workflowEngine.getWorkflow(workflowId)
      if (workflowData) {
        setWorkflow(workflowData)
        const stateDefinition = getStateDefinition(workflowData.type, workflowData.currentState as string)
        setCurrentStateDefinition(stateDefinition)
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

  const getStateDefinition = (// workflowType: string, state: string): WorkflowState | null => {
    // Mock implementation - in a real app, this would fetch from the workflow engine
    const patientStates = {
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
      }
    }

    return (patientStates as any)[state] || null
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
        return <FileText className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const canTransition = (toState: string) => {
    if (!currentStateDefinition) return false
    
    // Check if transition is allowed
    if (!currentStateDefinition.canTransitionTo.includes(toState as any)) return false
    
    // Check if all required actions are completed
    const requiredActions = currentStateDefinition.requiredActions.filter(a => a.required)
    return requiredActions.every(a => a.completed)
  }

  const handleActionComplete = async (action: WorkflowAction) => {
    if (completingAction) return
    
    setCompletingAction(action.id)
    
    try {
      await workflowEngine.completeAction({
        workflowId,
        actionId: action.id,
        userId,
        data: {
          notes: actionNotes,
          completedBy: userName,
          timestamp: new Date().toISOString()
        }
      })
      
      // Refresh workflow data
      loadWorkflowData()
      
      // Clear action notes
      setActionNotes('')
      
      // Send notification
      await notificationSystem.createNotification({
        type: NotificationType.CONSULTATION_COMPLETED,
        title: 'Action Completed',
        message: `${action.name} has been completed by ${userName}`,
        recipientId: userId,
        data: {
          workflowId,
          actionId: action.id,
          actionName: action.name
        }
      })
      
    } catch (err) {
      const errorMessage = 'Failed to complete action'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('Action completion error:', err)
    } finally {
      setCompletingAction('')
    }
  }

  const handleTransitionRequest = (toState: string) => {
    setSelectedTransition(toState)
    setTransitionData({})
    setShowTransitionDialog(true)
  }

  const confirmTransition = async () => {
    if (!selectedTransition || !workflow) return
    
    try {
      setTransitioning(true)
      
      await workflowEngine.transitionWorkflow({
        workflowId,
        toState: selectedTransition as any,
        action: `transition_to_${selectedTransition}`,
        userId,
        data: {
          ...transitionData,
          transitionedBy: userName,
          timestamp: new Date().toISOString()
        }
      })
      
      // Refresh workflow data
      loadWorkflowData()
      
      // Close dialog
      setShowTransitionDialog(false)
      
      // Call callback
      onTransition?.(workflow.currentState as string, selectedTransition)
      
      // Send notification
      await notificationSystem.createNotification({
        type: NotificationType.PATIENT_READY_FOR_CONSULTATION,
        title: 'Workflow State Changed',
        message: `Workflow has moved from ${formatStateName(workflow.currentState as string)} to ${formatStateName(selectedTransition)}`,
        recipientId: userId,
        data: {
          workflowId,
          fromState: workflow.currentState,
          toState: selectedTransition,
          transitionedBy: userName
        }
      })
      
    } catch (err) {
      const errorMessage = 'Failed to transition workflow state'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('State transition error:', err)
    } finally {
      setTransitioning(false)
    }
  }

  const // getActionPriority = (action: WorkflowAction) => {
    if (action.required && !action.completed) return 'high'
    if (!action.completed) return 'medium'
    return 'low'
  }

  const getActionStatusColor = (action: WorkflowAction) => {
    if (action.completed) return 'text-green-600 bg-green-50 border-green-200'
    if (action.required) return 'text-red-600 bg-red-50 border-red-200'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
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

  if (error || !workflow || !currentStateDefinition) {
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

  const uncompletedActions = currentStateDefinition.requiredActions.filter(a => !a.completed)
  const requiredIncomplete = uncompletedActions.filter(a => a.required)

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStateIcon(workflow.currentState as string)}
              <span>Workflow Actions & Transitions</span>
            </div>
            <Badge variant="outline">
              {formatStateName(workflow.currentState as string)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Complete required actions and manage workflow transitions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current State Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Current State</span>
            </div>
            <p className="text-sm text-blue-800">{currentStateDefinition.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-blue-700">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>Estimated duration: {currentStateDefinition.estimatedDuration || 'N/A'}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>Progress: {workflow.progress}%</span>
              </div>
            </div>
          </div>

          {/* Required Actions */}
          {uncompletedActions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Pending Actions
              </h4>
              
              <div className="space-y-3">
                {uncompletedActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-lg border ${getActionStatusColor(action)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{action.name}</span>
                          {action.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>

                    {completingAction === action.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add notes about completing this action..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          className="min-h-20"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleActionComplete(action)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete Action
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCompletingAction('')
                              setActionNotes('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={action.required ? "default" : "outline"}
                        onClick={() => setCompletingAction(action.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Actions Summary */}
          {currentStateDefinition.requiredActions.some(a => a.completed) && (
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Completed Actions</h4>
              <div className="space-y-2">
                {currentStateDefinition.requiredActions
                  .filter(a => a.completed)
                  .map((action) => (
                    <div key={action.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <span className="font-medium text-green-900">{action.name}</span>
                        {action.completedBy && (
                          <div className="text-xs text-green-700 mt-1">
                            Completed by {action.completedBy} • {new Date(action.completedAt!).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Available Transitions */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Available Transitions
            </h4>
            
            {requiredIncomplete.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete {requiredIncomplete.length} required action{requiredIncomplete.length > 1 ? 's' : ''} before transitioning to the next state.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3">
              {currentStateDefinition.canTransitionTo.map((nextState) => (
                <Button
                  key={nextState}
                  variant="outline"
                  className="justify-between p-4 h-auto"
                  disabled={!canTransition(nextState as string) || transitioning}
                  onClick={() => handleTransitionRequest(nextState as string)}
                >
                  <div className="flex items-center gap-3">
                    {getStateIcon(nextState as string)}
                    <div className="text-left">
                      <div className="font-medium">Move to {formatStateName(nextState as string)}</div>
                      <div className="text-sm text-gray-500">
                        Transition workflow to the next stage
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {currentStateDefinition.canTransitionTo.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This is the final state. No further transitions are available.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transition Confirmation Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Confirm Workflow Transition
            </DialogTitle>
            <DialogDescription>
              Move workflow from {formatStateName(workflow.currentState as string)} to {formatStateName(selectedTransition)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transition-notes">Transition Notes (Optional)</Label>
              <Textarea
                id="transition-notes"
                placeholder="Add any notes about this transition..."
                value={transitionData.notes || ''}
                onChange={(e) => setTransitionData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Transition Impact</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This action will move the workflow to a new state and may trigger notifications to relevant staff members.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransitionDialog(false)}
              disabled={transitioning}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTransition}
              disabled={transitioning}
            >
              {transitioning ? (
                <>
                  <Timer className="h-4 w-4 mr-2 animate-spin" />
                  Transitioning...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Transition
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}