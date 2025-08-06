'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MessageSquareIcon,
  BellIcon,
  AlertTriangleIcon,
  RotateCcwIcon
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/lib/types'

interface AppointmentStatusManagerProps {
  appointment: Appointment
  onStatusUpdate?: (appointmentId: string, status: AppointmentStatus, data?: Record<string, unknown>) => void
  onSendReminder?: (appointmentId: string, type: 'sms' | 'email' | 'call') => void
  canModify?: boolean
}

interface StatusAction {
  status: AppointmentStatus
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  requiresReason?: boolean
}

const statusActions: StatusAction[] = [
  {
    status: 'confirmed',
    label: 'Confirm',
    description: 'Confirm the appointment',
    icon: CheckCircleIcon,
    color: 'bg-green-600 hover:bg-green-700',
    requiresReason: false
  },
  {
    status: 'arrived',
    label: 'Mark Arrived',
    description: 'Patient has arrived',
    icon: UserIcon,
    color: 'bg-blue-600 hover:bg-blue-700',
    requiresReason: false
  },
  {
    status: 'in_progress',
    label: 'Start Consultation',
    description: 'Begin consultation',
    icon: ClockIcon,
    color: 'bg-purple-600 hover:bg-purple-700',
    requiresReason: false
  },
  {
    status: 'completed',
    label: 'Complete',
    description: 'Appointment completed',
    icon: CheckCircleIcon,
    color: 'bg-green-600 hover:bg-green-700',
    requiresReason: false
  },
  {
    status: 'no_show',
    label: 'No Show',
    description: 'Patient did not arrive',
    icon: AlertTriangleIcon,
    color: 'bg-yellow-600 hover:bg-yellow-700',
    requiresReason: true
  },
  {
    status: 'cancelled',
    label: 'Cancel',
    description: 'Cancel appointment',
    icon: XCircleIcon,
    color: 'bg-red-600 hover:bg-red-700',
    requiresReason: true
  },
  {
    status: 'rescheduled',
    label: 'Reschedule',
    description: 'Reschedule appointment',
    icon: RotateCcwIcon,
    color: 'bg-indigo-600 hover:bg-indigo-700',
    requiresReason: true
  }
]

const getStatusInfo = (status: AppointmentStatus) => {
  switch (status) {
    case 'scheduled':
      return { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' }
    case 'confirmed':
      return { color: 'bg-green-100 text-green-800', label: 'Confirmed' }
    case 'arrived':
      return { color: 'bg-purple-100 text-purple-800', label: 'Arrived' }
    case 'in_progress':
      return { color: 'bg-orange-100 text-orange-800', label: 'In Progress' }
    case 'completed':
      return { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
    case 'cancelled':
      return { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    case 'no_show':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'No Show' }
    case 'rescheduled':
      return { color: 'bg-indigo-100 text-indigo-800', label: 'Rescheduled' }
    default:
      return { color: 'bg-gray-100 text-gray-800', label: status }
  }
}

const getAvailableActions = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
  switch (currentStatus) {
    case 'scheduled':
      return ['confirmed', 'cancelled', 'rescheduled', 'no_show']
    case 'confirmed':
      return ['arrived', 'cancelled', 'rescheduled', 'no_show']
    case 'arrived':
      return ['in_progress', 'cancelled', 'no_show']
    case 'in_progress':
      return ['completed', 'cancelled']
    case 'completed':
      return [] // No further actions typically needed
    case 'cancelled':
      return ['scheduled'] // Can potentially reschedule
    case 'no_show':
      return ['scheduled'] // Can potentially reschedule
    case 'rescheduled':
      return ['confirmed', 'cancelled']
    default:
      return []
  }
}

export function AppointmentStatusManager({
  appointment,
  onStatusUpdate,
  onSendReminder,
  canModify = true
}: AppointmentStatusManagerProps) {
  const [selectedAction, setSelectedAction] = useState<StatusAction | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReminderOptions, setShowReminderOptions] = useState(false)

  const statusInfo = getStatusInfo(appointment.status)
  const availableActions = getAvailableActions(appointment.status)
  const availableStatusActions = statusActions.filter(action => 
    availableActions.includes(action.status)
  )

  const handleStatusUpdate = async () => {
    if (!selectedAction || isProcessing) return

    setIsProcessing(true)
    
    try {
      const updateData: Record<string, unknown> = {
        status: selectedAction.status,
        [`${selectedAction.status}_at`]: new Date().toISOString()
      }

      if (selectedAction.requiresReason && reason.trim()) {
        if (selectedAction.status === 'cancelled') {
          updateData.cancellation_reason = reason.trim()
        } else if (selectedAction.status === 'rescheduled') {
          updateData.rescheduled_reason = reason.trim()
        }
      }

      if (notes.trim()) {
        updateData.notes = notes.trim()
      }

      onStatusUpdate?.(appointment.id, selectedAction.status, updateData)
      
      // Reset form
      setSelectedAction(null)
      setReason('')
      setNotes('')
    } catch (error) {
      console.error('Error updating appointment status:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendReminder = (type: 'sms' | 'email' | 'call') => {
    onSendReminder?.(appointment.id, type)
    setShowReminderOptions(false)
  }

  const formatDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(`${date}T${time}`)
    return appointmentDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Appointment Status
            </CardTitle>
            <CardDescription>
              Manage appointment confirmation and status updates
            </CardDescription>
          </div>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Appointment Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Patient</Label>
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.patient?.name || 'Unknown Patient'}</span>
            </div>
            {appointment.patient?.mobile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="h-4 w-4" />
                <span>{appointment.patient.mobile}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Appointment Time</Label>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Duration: {appointment.duration} minutes
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        {(appointment.title || appointment.description) && (
          <div className="space-y-2">
            {appointment.title && (
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <div className="text-sm">{appointment.title}</div>
              </div>
            )}
            {appointment.description && (
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="text-sm text-muted-foreground">{appointment.description}</div>
              </div>
            )}
          </div>
        )}

        {/* Status Timeline */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status History</Label>
          <div className="space-y-2 text-sm">
            {appointment.created_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(appointment.created_at).toLocaleString()}</span>
              </div>
            )}
            {appointment.confirmed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmed:</span>
                <span>{new Date(appointment.confirmed_at).toLocaleString()}</span>
              </div>
            )}
            {appointment.arrived_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrived:</span>
                <span>{new Date(appointment.arrived_at).toLocaleString()}</span>
              </div>
            )}
            {appointment.started_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{new Date(appointment.started_at).toLocaleString()}</span>
              </div>
            )}
            {appointment.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(appointment.completed_at).toLocaleString()}</span>
              </div>
            )}
            {appointment.cancelled_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled:</span>
                <span>{new Date(appointment.cancelled_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reminder Section */}
        {canModify && ['scheduled', 'confirmed'].includes(appointment.status) && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Send Reminder</Label>
            {!showReminderOptions ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowReminderOptions(true)}
              >
                <BellIcon className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSendReminder('sms')}
                >
                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                  SMS
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendReminder('email')}
                >
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendReminder('call')}
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowReminderOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Status Update Actions */}
        {canModify && availableStatusActions.length > 0 && !selectedAction && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Update Status</Label>
            <div className="flex flex-wrap gap-2">
              {availableStatusActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.status}
                    size="sm"
                    className={action.color}
                    onClick={() => setSelectedAction(action)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Status Update Form */}
        {selectedAction && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedAction.label} Appointment</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedAction(null)
                  setReason('')
                  setNotes('')
                }}
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {selectedAction.description}
            </p>

            {selectedAction.requiresReason && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleStatusUpdate}
                disabled={isProcessing || (selectedAction.requiresReason && !reason.trim())}
                className={selectedAction.color}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <selectedAction.icon className="h-4 w-4 mr-2" />
                    {selectedAction.label}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedAction(null)
                  setReason('')
                  setNotes('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Cancellation/Rescheduling Reasons */}
        {(appointment.cancellation_reason || appointment.rescheduled_reason) && (
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              {appointment.cancellation_reason && (
                <div><strong>Cancellation Reason:</strong> {appointment.cancellation_reason}</div>
              )}
              {appointment.rescheduled_reason && (
                <div><strong>Reschedule Reason:</strong> {appointment.rescheduled_reason}</div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}