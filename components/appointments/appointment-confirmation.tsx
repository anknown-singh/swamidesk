'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PhoneIcon,
  MessageSquareIcon,
  MailIcon,
  BellIcon,
  AlertCircleIcon,
  UserIcon,
  CalendarIcon,
  SendIcon
} from 'lucide-react'
import type { Appointment, AppointmentReminder } from '@/lib/types'

interface AppointmentConfirmationProps {
  appointments?: Appointment[]
  onSendConfirmation?: (appointmentId: string, method: 'sms' | 'email' | 'call', message?: string) => void
  onBulkConfirmation?: (appointmentIds: string[], method: 'sms' | 'email', message?: string) => void
  onScheduleReminder?: (appointmentId: string, scheduledAt: string, method: 'sms' | 'email', message?: string) => void
}

interface ConfirmationTemplate {
  id: string
  name: string
  method: 'sms' | 'email'
  subject?: string
  message: string
}

const confirmationTemplates: ConfirmationTemplate[] = [
  {
    id: 'sms_confirmation',
    name: 'SMS Confirmation',
    method: 'sms',
    message: 'Dear {{patient_name}}, your appointment with {{doctor_name}} is scheduled for {{date}} at {{time}}. Please reply YES to confirm or call us to reschedule. - SwamIDesk'
  },
  {
    id: 'email_confirmation',
    name: 'Email Confirmation',
    method: 'email',
    subject: 'Appointment Confirmation - {{date}}',
    message: `Dear {{patient_name}},

This is to confirm your appointment with {{doctor_name}} scheduled for:

Date: {{date}}
Time: {{time}}
Duration: {{duration}} minutes
Department: {{department}}

Please click the link below to confirm your appointment:
{{confirmation_link}}

If you need to reschedule or cancel, please call us at {{clinic_phone}}.

Best regards,
SwamIDesk Clinic`
  },
  {
    id: 'sms_reminder',
    name: 'SMS Reminder',
    method: 'sms',
    message: 'Reminder: You have an appointment with {{doctor_name}} tomorrow at {{time}}. Please arrive 15 minutes early. Call us if you need to reschedule. - SwamIDesk'
  },
  {
    id: 'email_reminder',
    name: 'Email Reminder',
    method: 'email',
    subject: 'Appointment Reminder - Tomorrow {{time}}',
    message: `Dear {{patient_name}},

This is a friendly reminder about your appointment tomorrow:

Doctor: {{doctor_name}}
Date: {{date}}
Time: {{time}}
Location: {{clinic_address}}

Please arrive 15 minutes early and bring:
- Valid ID
- Insurance card (if applicable)
- Previous medical records (if first visit)

If you need to reschedule, please call us at {{clinic_phone}} at least 2 hours before your appointment.

Thank you,
SwamIDesk Clinic`
  }
]

const mockAppointments: Appointment[] = [
  {
    id: 'apt1',
    patient_id: 'pat1',
    doctor_id: 'doc1',
    department: 'general',
    appointment_type: 'consultation',
    status: 'scheduled',
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    scheduled_time: '10:00',
    duration: 30,
    title: 'Routine Check-up',
    priority: false,
    is_recurring: false,
    reminder_sent: false,
    confirmation_sent: false,
    created_by: 'rec1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient: {
      id: 'pat1',
      name: 'John Doe',
      mobile: '+91-9876543210',
      dob: '1985-06-15',
      gender: 'male',
      address: '123 Main St',
      email: 'john.doe@email.com',
      emergency_contact: '+91-9876543211',
      created_by: 'rec1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    doctor: {
      id: 'doc1',
      role: 'doctor',
      full_name: 'Dr. Sarah Smith',
      email: 'sarah.smith@swamidesk.com',
      phone: '+91-9876543220',
      department: 'general',
      specialization: 'Internal Medicine',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'apt2',
    patient_id: 'pat2',
    doctor_id: 'doc2',
    department: 'cardiology',
    appointment_type: 'follow_up',
    status: 'scheduled',
    scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
    scheduled_time: '14:30',
    duration: 45,
    title: 'Cardiology Follow-up',
    priority: true,
    is_recurring: false,
    reminder_sent: false,
    confirmation_sent: false,
    created_by: 'rec1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient: {
      id: 'pat2',
      name: 'Sarah Johnson',
      mobile: '+91-9876543211',
      dob: '1978-09-12',
      gender: 'female',
      address: '456 Oak Ave',
      email: 'sarah.johnson@email.com',
      emergency_contact: '+91-9876543212',
      created_by: 'rec1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    doctor: {
      id: 'doc2',
      role: 'doctor',
      full_name: 'Dr. John Brown',
      email: 'john.brown@swamidesk.com',
      phone: '+91-9876543221',
      department: 'cardiology',
      specialization: 'Cardiology',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
]

export function AppointmentConfirmation({
  appointments = mockAppointments,
  onSendConfirmation,
  onBulkConfirmation,
  onScheduleReminder
}: AppointmentConfirmationProps) {
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ConfirmationTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk' | 'reminders'>('individual')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unconfirmed' | 'confirmed'>('unconfirmed')

  // Filter appointments based on current tab and status
  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'unconfirmed' && apt.confirmation_sent) return false
    if (filterStatus === 'confirmed' && !apt.confirmation_sent) return false
    
    // Only show future appointments for confirmations
    const appointmentDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
    return appointmentDate > new Date()
  })

  const unconfirmedCount = filteredAppointments.filter(apt => !apt.confirmation_sent).length
  const reminderDueCount = filteredAppointments.filter(apt => {
    const appointmentDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return appointmentDate.toDateString() === tomorrow.toDateString() && !apt.reminder_sent
  }).length

  const handleIndividualConfirmation = async (appointment: Appointment, method: 'sms' | 'email' | 'call') => {
    setIsProcessing(true)
    try {
      const message = selectedTemplate ? interpolateTemplate(selectedTemplate.message, appointment) : undefined
      onSendConfirmation?.(appointment.id, method, message)
    } catch (error) {
      console.error('Error sending confirmation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkConfirmation = async () => {
    if (selectedAppointments.length === 0 || !selectedTemplate) return
    
    setIsProcessing(true)
    try {
      const message = customMessage || selectedTemplate.message
      onBulkConfirmation?.(selectedAppointments, selectedTemplate.method, message)
      setSelectedAppointments([])
    } catch (error) {
      console.error('Error sending bulk confirmations:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScheduleReminder = async (appointment: Appointment) => {
    if (!selectedTemplate || !scheduledTime) return
    
    setIsProcessing(true)
    try {
      const message = interpolateTemplate(selectedTemplate.message, appointment)
      onScheduleReminder?.(appointment.id, scheduledTime, selectedTemplate.method, message)
    } catch (error) {
      console.error('Error scheduling reminder:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const interpolateTemplate = (template: string, appointment: Appointment): string => {
    return template
      .replace(/\{\{patient_name\}\}/g, appointment.patient?.name || 'Patient')
      .replace(/\{\{doctor_name\}\}/g, appointment.doctor?.full_name || 'Doctor')
      .replace(/\{\{date\}\}/g, new Date(appointment.scheduled_date).toLocaleDateString())
      .replace(/\{\{time\}\}/g, appointment.scheduled_time)
      .replace(/\{\{duration\}\}/g, appointment.duration.toString())
      .replace(/\{\{department\}\}/g, appointment.department)
      .replace(/\{\{clinic_phone\}\}/g, '+91-9876543200')
      .replace(/\{\{clinic_address\}\}/g, '123 Healthcare Street, Medical District')
      .replace(/\{\{confirmation_link\}\}/g, `https://swamidesk.com/confirm/${appointment.id}`)
  }

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    setSelectedAppointments(prev => 
      checked 
        ? [...prev, appointmentId]
        : prev.filter(id => id !== appointmentId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedAppointments(
      checked ? filteredAppointments.map(apt => apt.id) : []
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appointment Confirmations</h2>
          <p className="text-muted-foreground">Send confirmations and reminders to patients</p>
        </div>
        <div className="flex gap-4">
          <Badge variant={unconfirmedCount > 0 ? 'destructive' : 'secondary'}>
            {unconfirmedCount} Unconfirmed
          </Badge>
          <Badge variant={reminderDueCount > 0 ? 'default' : 'secondary'}>
            {reminderDueCount} Reminders Due
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'individual' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('individual')}
        >
          <UserIcon className="h-4 w-4 mr-2" />
          Individual
        </Button>
        <Button
          variant={activeTab === 'bulk' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('bulk')}
        >
          <SendIcon className="h-4 w-4 mr-2" />
          Bulk Send
        </Button>
        <Button
          variant={activeTab === 'reminders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('reminders')}
        >
          <BellIcon className="h-4 w-4 mr-2" />
          Reminders
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filter:</Label>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Appointments</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed Only</SelectItem>
                <SelectItem value="confirmed">Confirmed Only</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredAppointments.length} appointments
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Confirmations</CardTitle>
            <CardDescription>Send confirmation messages to individual patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{appointment.patient?.name}</h3>
                      <Badge variant={appointment.confirmation_sent ? 'default' : 'secondary'}>
                        {appointment.confirmation_sent ? 'Confirmed' : 'Pending'}
                      </Badge>
                      {appointment.priority && (
                        <Badge variant="outline">Priority</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.doctor?.full_name} • {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.patient?.mobile} • {appointment.patient?.email}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleIndividualConfirmation(appointment, 'sms')}
                      disabled={isProcessing}
                    >
                      <MessageSquareIcon className="h-4 w-4 mr-2" />
                      SMS
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleIndividualConfirmation(appointment, 'email')}
                      disabled={isProcessing}
                    >
                      <MailIcon className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleIndividualConfirmation(appointment, 'call')}
                      disabled={isProcessing}
                    >
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments found for the selected filter
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'bulk' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Appointments</CardTitle>
              <CardDescription>Choose appointments for bulk confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedAppointments.length === filteredAppointments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All ({filteredAppointments.length})</Label>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedAppointments.includes(appointment.id)}
                        onCheckedChange={(checked) => handleSelectAppointment(appointment.id, !!checked)}
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{appointment.patient?.name}</div>
                        <div className="text-muted-foreground">
                          {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template and Send */}
          <Card>
            <CardHeader>
              <CardTitle>Message Template</CardTitle>
              <CardDescription>Choose template and customize message</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Template</Label>
                  <Select 
                    value={selectedTemplate?.id || ''} 
                    onValueChange={(value) => {
                      const template = confirmationTemplates.find(t => t.id === value)
                      setSelectedTemplate(template || null)
                      setCustomMessage(template?.message || '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {confirmationTemplates.filter(t => ['sms_confirmation', 'email_confirmation'].includes(t.id)).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Alert>
                      <AlertCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Use placeholders like {'{{patient_name}}'}, {'{{doctor_name}}'}, {'{{date}}'}, {'{{time}}'} for personalization.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={handleBulkConfirmation}
                      disabled={selectedAppointments.length === 0 || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <SendIcon className="h-4 w-4 mr-2" />
                          Send to {selectedAppointments.length} Patients
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reminders' && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Reminders</CardTitle>
            <CardDescription>Send appointment reminders to patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Reminder Template</Label>
                  <Select 
                    value={selectedTemplate?.id || ''} 
                    onValueChange={(value) => {
                      const template = confirmationTemplates.find(t => t.id === value)
                      setSelectedTemplate(template || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reminder template" />
                    </SelectTrigger>
                    <SelectContent>
                      {confirmationTemplates.filter(t => ['sms_reminder', 'email_reminder'].includes(t.id)).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Send Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Appointments List */}
              <div className="space-y-4">
                {filteredAppointments.filter(apt => {
                  const appointmentDate = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`)
                  return appointmentDate > new Date()
                }).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{appointment.patient?.name}</h3>
                        <Badge variant={appointment.reminder_sent ? 'default' : 'secondary'}>
                          {appointment.reminder_sent ? 'Reminder Sent' : 'No Reminder'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.doctor?.full_name} • {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleScheduleReminder(appointment)}
                      disabled={!selectedTemplate || !scheduledTime || isProcessing}
                    >
                      <BellIcon className="h-4 w-4 mr-2" />
                      Schedule Reminder
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}