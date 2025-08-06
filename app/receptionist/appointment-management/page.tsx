'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  MessageSquareIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react'
import { AppointmentStatusManager } from '@/components/appointments/appointment-status-manager'
import { AppointmentConfirmation } from '@/components/appointments/appointment-confirmation'
import type { Appointment, AppointmentStatus } from '@/lib/types'

// Mock data - same as in other components for consistency
const mockAppointments: Appointment[] = [
  {
    id: 'apt1',
    patient_id: 'pat1',
    doctor_id: 'doc1',
    department: 'general',
    appointment_type: 'consultation',
    status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0],
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
      name: 'Dr. Sarah Smith',
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
    status: 'confirmed',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '14:30',
    duration: 45,
    title: 'Cardiology Follow-up',
    priority: true,
    is_recurring: false,
    reminder_sent: false,
    confirmation_sent: true,
    confirmed_at: new Date().toISOString(),
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
      name: 'Dr. John Brown',
      email: 'john.brown@swamidesk.com',
      phone: '+91-9876543221',
      department: 'cardiology',
      specialization: 'Cardiology',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'apt3',
    patient_id: 'pat3',
    doctor_id: 'doc1',
    department: 'general',
    appointment_type: 'procedure',
    status: 'arrived',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '16:00',
    duration: 60,
    title: 'Medical Procedure',
    priority: false,
    is_recurring: false,
    reminder_sent: true,
    confirmation_sent: true,
    confirmed_at: new Date(Date.now() - 3600000).toISOString(),
    arrived_at: new Date(Date.now() - 900000).toISOString(),
    created_by: 'rec1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient: {
      id: 'pat3',
      name: 'Mike Wilson',
      mobile: '+91-9876543212',
      dob: '1990-12-05',
      gender: 'male',
      address: '789 Pine St',
      email: 'mike.wilson@email.com',
      emergency_contact: '+91-9876543213',
      created_by: 'rec1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    doctor: {
      id: 'doc1',
      role: 'doctor',
      name: 'Dr. Sarah Smith',
      email: 'sarah.smith@swamidesk.com',
      phone: '+91-9876543220',
      department: 'general',
      specialization: 'Internal Medicine',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
]

export default function AppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [activeView, setActiveView] = useState<'status' | 'confirmations'>('status')

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = (appointmentId: string, status: AppointmentStatus, data?: any) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status, ...data, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Status updated:', { appointmentId, status, data })
  }

  const handleSendReminder = (appointmentId: string, type: 'sms' | 'email' | 'call') => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, reminder_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Reminder sent:', { appointmentId, type })
  }

  const handleSendConfirmation = (appointmentId: string, method: 'sms' | 'email' | 'call', message?: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Confirmation sent:', { appointmentId, method, message })
  }

  const handleBulkConfirmation = (appointmentIds: string[], method: 'sms' | 'email', message?: string) => {
    setAppointments(prev => prev.map(apt => 
      appointmentIds.includes(apt.id)
        ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Bulk confirmation sent:', { appointmentIds, method, message })
  }

  const handleScheduleReminder = (appointmentId: string, scheduledAt: string, method: 'sms' | 'email', message?: string) => {
    console.log('Reminder scheduled:', { appointmentId, scheduledAt, method, message })
  }

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

  // Count appointments by status
  const statusCounts = {
    total: appointments.length,
    scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    arrived: appointments.filter(apt => apt.status === 'arrived').length,
    in_progress: appointments.filter(apt => apt.status === 'in_progress').length,
    unconfirmed: appointments.filter(apt => !apt.confirmation_sent && ['scheduled', 'confirmed'].includes(apt.status)).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointment Management</h1>
          <p className="text-muted-foreground">
            Manage appointment status and confirmations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Appointments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.scheduled}</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.arrived}</div>
            <div className="text-sm text-muted-foreground">Arrived</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.unconfirmed}</div>
            <div className="text-sm text-muted-foreground">Unconfirmed</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeView === 'status' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('status')}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Status Management
        </Button>
        <Button
          variant={activeView === 'confirmations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('confirmations')}
        >
          <MessageSquareIcon className="h-4 w-4 mr-2" />
          Confirmations
        </Button>
      </div>

      {activeView === 'confirmations' ? (
        <AppointmentConfirmation
          appointments={appointments}
          onSendConfirmation={handleSendConfirmation}
          onBulkConfirmation={handleBulkConfirmation}
          onScheduleReminder={handleScheduleReminder}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointment List */}
          <div className="space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <FilterIcon className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="arrived">Arrived</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
                <CardDescription>Click on an appointment to manage its status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAppointments.map((appointment) => {
                    const statusInfo = getStatusInfo(appointment.status)
                    return (
                      <div
                        key={appointment.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAppointment?.id === appointment.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{appointment.patient?.name}</h3>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                              {appointment.priority && (
                                <Badge variant="outline">Priority</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <UserIcon className="h-3 w-3 inline mr-1" />
                              {appointment.doctor?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 inline mr-1" />
                              {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No appointments found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Management Panel */}
          <div>
            {selectedAppointment ? (
              <AppointmentStatusManager
                appointment={selectedAppointment}
                onStatusUpdate={handleStatusUpdate}
                onSendReminder={handleSendReminder}
                canModify={true}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Appointment</h3>
                  <p className="text-muted-foreground">
                    Choose an appointment from the list to manage its status and send confirmations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}