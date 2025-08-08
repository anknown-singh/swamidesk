'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Calendar,
  Timer,
  AlertCircle,
  Play,
  Activity,
  MapPin,
  TrendingUp,
  BarChart3,
  Eye,
  ExternalLink
} from 'lucide-react'
import {
  workflowEngine,
  type WorkflowInstance,
  type WorkflowTransition,
  PatientWorkflowState
} from '@/lib/workflow/workflow-engine'

interface WorkflowTimelineProps {
  workflowId: string
  className?: string
  showAnalytics?: boolean
  maxHeight?: number
}

interface TimelineEvent {
  id: string
  type: 'transition' | 'action' | 'milestone'
  timestamp: string
  title: string
  description: string
  fromState?: string
  toState?: string
  userId?: string
  userName?: string
  duration?: number
  data?: any
}

export function WorkflowTimeline({ 
  workflowId, 
  className = '', 
  showAnalytics = false,
  maxHeight = 400
}: WorkflowTimelineProps) {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)

  useEffect(() => {
    loadWorkflowData()
  }, [workflowId])

  const loadWorkflowData = async () => {
    try {
      const workflowData = workflowEngine.getWorkflow(workflowId)
      if (workflowData) {
        setWorkflow(workflowData)
        const events = await buildTimelineEvents(workflowData)
        setTimelineEvents(events)
      } else {
        setError('Workflow not found')
      }
    } catch (err) {
      setError('Failed to load workflow data')
      console.error('Timeline loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const buildTimelineEvents = async (workflowData: WorkflowInstance): Promise<TimelineEvent[]> => {
    const events: TimelineEvent[] = []

    // Add workflow start event
    events.push({
      id: 'start',
      type: 'milestone',
      timestamp: workflowData.startedAt,
      title: 'Workflow Started',
      description: `${formatWorkflowType(workflowData.type)} workflow initiated`,
      data: { workflowType: workflowData.type, entityId: workflowData.entityId }
    })

    // Add transition events
    workflowData.transitions.forEach((transition, index) => {
      events.push({
        id: `transition_${index}`,
        type: 'transition',
        timestamp: transition.timestamp,
        title: `${formatStateName(transition.from)} → ${formatStateName(transition.to)}`,
        description: `Workflow transitioned from ${formatStateName(transition.from)} to ${formatStateName(transition.to)}`,
        fromState: transition.from as string,
        toState: transition.to as string,
        userId: transition.userId,
        userName: 'Unknown User', // TODO: Implement getUserName properly
        duration: transition.duration,
        data: transition.data
      })
    })

    // Add completion event if workflow is completed
    if (workflowData.actualCompletion) {
      events.push({
        id: 'completion',
        type: 'milestone',
        timestamp: workflowData.actualCompletion,
        title: 'Workflow Completed',
        description: `${formatWorkflowType(workflowData.type)} workflow successfully completed`,
        data: { completionTime: workflowData.actualCompletion }
      })
    }

    // Sort events by timestamp
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const getUserName = async (userId: string): Promise<string> => {
    // In a real app, this would fetch user data from the API
    // For now, we'll return a placeholder
    return `User ${userId.slice(-4)}`
  }

  const formatWorkflowType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatStateName = (state: string) => {
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'milestone':
        return event.title.includes('Started') 
          ? <Play className="h-4 w-4 text-blue-500" />
          : <CheckCircle className="h-4 w-4 text-green-500" />
      case 'transition':
        return <ArrowRight className="h-4 w-4 text-orange-500" />
      case 'action':
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'milestone':
        return event.title.includes('Started') ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
      case 'transition':
        return 'border-orange-200 bg-orange-50'
      case 'action':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const calculateWorkflowAnalytics = () => {
    if (!workflow || !timelineEvents.length) return null

    const startTime = new Date(workflow.startedAt).getTime()
    const endTime = workflow.actualCompletion 
      ? new Date(workflow.actualCompletion).getTime()
      : new Date().getTime()
    
    const totalDuration = Math.floor((endTime - startTime) / 1000 / 60) // minutes
    const averageStateTime = workflow.transitions.length > 0 
      ? totalDuration / workflow.transitions.length 
      : 0

    const slowestTransition = workflow.transitions.reduce((slowest, transition) => {
      return (transition.duration || 0) > (slowest?.duration || 0) ? transition : slowest
    }, workflow.transitions[0])

    return {
      totalDuration,
      averageStateTime,
      transitionCount: workflow.transitions.length,
      slowestTransition,
      completionRate: workflow.progress,
      currentState: formatStateName(workflow.currentState as string)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return time.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !workflow) {
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

  const analytics = calculateWorkflowAnalytics()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Overview */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Workflow Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(analytics.totalDuration)}
                </div>
                <div className="text-sm text-blue-700">Total Duration</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.transitionCount}
                </div>
                <div className="text-sm text-green-700">Transitions</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(analytics.averageStateTime)}
                </div>
                <div className="text-sm text-orange-700">Avg. State Time</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.completionRate}%
                </div>
                <div className="text-sm text-purple-700">Progress</div>
              </div>
            </div>

            {analytics.slowestTransition && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Timer className="h-4 w-4" />
                  <span className="font-medium">Slowest Transition:</span>
                  <span>
                    {formatStateName(analytics.slowestTransition.from as string)} → {formatStateName(analytics.slowestTransition.to as string)}
                  </span>
                  <Badge variant="outline" className="bg-yellow-100 border-yellow-300">
                    {formatDuration(analytics.slowestTransition.duration)}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Workflow Timeline
          </CardTitle>
          <CardDescription>
            Complete history of {formatWorkflowType(workflow.type)} workflow events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="space-y-4 overflow-y-auto pr-2"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline connector line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-4 top-8 w-px h-12 bg-gray-200"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Event icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                    {getEventIcon(event)}
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${getEventColor(event)}`}
                      onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2">
                          {event.duration && (
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(event.duration)}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                        
                        {event.userName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.userName}
                          </div>
                        )}
                        
                        {event.type === 'transition' && (
                          <Badge variant="secondary" className="text-xs">
                            Transition
                          </Badge>
                        )}
                      </div>

                      {/* Expanded event details */}
                      {selectedEvent?.id === event.id && event.data && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium text-xs text-gray-700 mb-2">Event Details:</h5>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Current state indicator */}
            {!workflow.actualCompletion && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-blue-900">
                        Currently in {formatStateName(workflow.currentState as string)}
                      </h4>
                      <Badge className="bg-blue-500">Active</Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      Workflow is actively progressing through the {formatStateName(workflow.currentState as string)} stage
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        {workflow.progress}% complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {timelineEvents.length} events • Started {formatTimeAgo(workflow.startedAt)}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadWorkflowData()}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export timeline data
                  const exportData = {
                    workflow,
                    events: timelineEvents,
                    analytics
                  }
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                    type: 'application/json' 
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `workflow-timeline-${workflowId}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default WorkflowTimeline;
