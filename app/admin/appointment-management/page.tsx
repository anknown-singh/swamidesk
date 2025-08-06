'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  MessageSquareIcon,
  StethoscopeIcon,
  TrendingUpIcon
} from 'lucide-react'
import { AppointmentStatusManager } from '@/components/appointments/appointment-status-manager'
import { AppointmentConfirmation } from '@/components/appointments/appointment-confirmation'
import type { Appointment, AppointmentStatus } from '@/lib/types'

// Extended mock data with more appointments for admin view
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
  }
  // More mock data would be here in a real implementation
]

export default function AdminAppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'status' | 'confirmations'>('overview')

  const handleStatusUpdate = (appointmentId: string, status: AppointmentStatus, data?: any) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status, ...data, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Admin status update:', { appointmentId, status, data })
  }

  const handleSendReminder = (appointmentId: string, type: 'sms' | 'email' | 'call') => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, reminder_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Admin reminder sent:', { appointmentId, type })
  }

  const handleSendConfirmation = (appointmentId: string, method: 'sms' | 'email' | 'call', message?: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Admin confirmation sent:', { appointmentId, method, message })
  }

  const handleBulkConfirmation = (appointmentIds: string[], method: 'sms' | 'email', message?: string) => {
    setAppointments(prev => prev.map(apt => 
      appointmentIds.includes(apt.id)
        ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
        : apt
    ))
    console.log('Admin bulk confirmation:', { appointmentIds, method, message })
  }

  const handleScheduleReminder = (appointmentId: string, scheduledAt: string, method: 'sms' | 'email', message?: string) => {
    console.log('Admin reminder scheduled:', { appointmentId, scheduledAt, method, message })
  }

  // Calculate comprehensive stats for admin view
  const stats = {
    total: appointments.length,
    today: appointments.filter(apt => apt.scheduled_date === new Date().toISOString().split('T')[0]).length,
    scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    arrived: appointments.filter(apt => apt.status === 'arrived').length,
    in_progress: appointments.filter(apt => apt.status === 'in_progress').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    no_show: appointments.filter(apt => apt.status === 'no_show').length,
    unconfirmed: appointments.filter(apt => !apt.confirmation_sent && ['scheduled', 'confirmed'].includes(apt.status)).length,
    priority: appointments.filter(apt => apt.priority).length
  }

  const confirmationRate = appointments.length > 0 ? (stats.confirmed / appointments.length * 100).toFixed(1) : '0'
  const showRate = appointments.length > 0 ? ((appointments.length - stats.no_show) / appointments.length * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointment Management</h1>
          <p className="text-muted-foreground">
            Administrative oversight of all appointment operations
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {stats.total}
          </Badge>
          <Badge variant={stats.unconfirmed > 0 ? 'destructive' : 'secondary'}>
            {stats.unconfirmed} Unconfirmed
          </Badge>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeView === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('overview')}
        >
          <TrendingUpIcon className="h-4 w-4 mr-2" />
          Overview
        </Button>
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

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{confirmationRate}%</p>
                    <p className="text-sm text-muted-foreground">Confirmation Rate</p>
                  </div>
                  <MessageSquareIcon className="h-8 w-8 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{showRate}%</p>
                    <p className="text-sm text-muted-foreground">Show-up Rate</p>
                  </div>
                  <UserIcon className="h-8 w-8 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stats.priority}</p>
                    <p className="text-sm text-muted-foreground">Priority Appointments</p>
                  </div>
                  <StethoscopeIcon className="h-8 w-8 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Status Breakdown</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.scheduled}</span>
                      <Badge variant="secondary">{((stats.scheduled / stats.total) * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.confirmed}</span>
                      <Badge variant="secondary">{((stats.confirmed / stats.total) * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Arrived</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.arrived}</span>
                      <Badge variant="secondary">{((stats.arrived / stats.total) * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.in_progress}</span>
                      <Badge variant="secondary">{((stats.in_progress / stats.total) * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.completed}</span>
                      <Badge variant="secondary">{((stats.completed / stats.total) * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
                <CardDescription>Items needing immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">Unconfirmed Appointments</p>
                      <p className="text-sm text-red-700">Require confirmation calls/messages</p>
                    </div>
                    <Badge variant="destructive">{stats.unconfirmed}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-900">No-Show Appointments</p>
                      <p className="text-sm text-yellow-700">May need follow-up or rescheduling</p>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">{stats.no_show}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">Cancelled Appointments</p>
                      <p className="text-sm text-red-700">May need rescheduling offers</p>
                    </div>
                    <Badge variant="outline" className="border-red-500 text-red-700">{stats.cancelled}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Priority Appointments</p>
                      <p className="text-sm text-blue-700">High priority cases</p>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-700">{stats.priority}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'status' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointment List - simplified for admin */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Click to manage status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointments.slice(0, 10).map((appointment) => (
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
                          <Badge>{appointment.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.doctor?.name} • {appointment.scheduled_time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                    Choose an appointment to manage its status
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeView === 'confirmations' && (
        <AppointmentConfirmation
          appointments={appointments}
          onSendConfirmation={handleSendConfirmation}
          onBulkConfirmation={handleBulkConfirmation}
          onScheduleReminder={handleScheduleReminder}
        />
      )}
    </div>
  )
}