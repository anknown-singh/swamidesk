'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus, AppointmentType } from '@/lib/types'

// Dynamic data fetching - no more mock data needed

export default function AdminAppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'status' | 'confirmations'>('overview')
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Fetch appointments from database
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
          users!appointments_doctor_id_fkey(id, full_name, email, phone, department, specialization, created_at, updated_at)
        `)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      if (error) throw error

      interface DatabaseAppointment {
        id: string
        patient_id: string
        doctor_id: string
        department: string
        appointment_type: string
        status: string
        scheduled_date: string
        scheduled_time: string
        duration?: number
        title?: string
        priority?: boolean
        is_recurring?: boolean
        reminder_sent?: boolean
        confirmation_sent?: boolean
        confirmed_at?: string
        created_by: string
        created_at: string
        updated_at: string
        patients?: {
          id: string
          full_name: string
          phone: string
          email: string
          date_of_birth: string
          gender: string
          address: string
          emergency_contact_phone: string
          created_at: string
          updated_at: string
        }
        users?: {
          id: string
          full_name: string
          email: string
          phone: string
          department: string
          specialization: string
          created_at: string
          updated_at: string
        }
      }

      const mappedAppointments = (data as DatabaseAppointment[]).map((apt: DatabaseAppointment) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        doctor_id: apt.doctor_id,
        department: apt.department,
        appointment_type: apt.appointment_type as AppointmentType,
        status: apt.status as AppointmentStatus,
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        duration: apt.duration || 30,
        title: apt.title || 'Appointment',
        priority: apt.priority || false,
        is_recurring: apt.is_recurring || false,
        reminder_sent: apt.reminder_sent || false,
        confirmation_sent: apt.confirmation_sent || false,
        confirmed_at: apt.confirmed_at,
        created_by: apt.created_by,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        patient: apt.patients ? {
          id: apt.patients.id,
          name: apt.patients.full_name,
          mobile: apt.patients.phone,
          dob: apt.patients.date_of_birth,
          gender: apt.patients.gender as 'male' | 'female' | 'other',
          address: apt.patients.address,
          email: apt.patients.email,
          emergency_contact: apt.patients.emergency_contact_phone,
          created_by: apt.created_by,
          created_at: apt.patients.created_at,
          updated_at: apt.patients.updated_at,
        } : undefined,
        doctor: apt.users ? {
          id: apt.users.id,
          role: 'doctor' as const,
          full_name: apt.users.full_name,
          email: apt.users.email,
          phone: apt.users.phone,
          department: apt.users.department,
          specialization: apt.users.specialization,
          password_hash: 'hashed_password',
          is_active: true,
          created_at: apt.users.created_at,
          updated_at: apt.users.updated_at
        } : undefined
      }))

      setAppointments(mappedAppointments as Appointment[])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])


  const handleStatusUpdate = async (appointmentId: string, status: AppointmentStatus, data?: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status, 
          ...data, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', appointmentId)

      if (error) throw error

      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status, ...data, updated_at: new Date().toISOString() }
          : apt
      ))
    } catch (error) {
      console.error('Error updating appointment status:', error)
    }
  }

  const handleSendReminder = async (appointmentId: string, type: 'sms' | 'email' | 'call') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          reminder_sent: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', appointmentId)

      if (error) throw error

      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, reminder_sent: true, updated_at: new Date().toISOString() }
          : apt
      ))
      
      console.log('Admin reminder sent:', { appointmentId, type })
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const handleSendConfirmation = async (appointmentId: string, method: 'sms' | 'email' | 'call', message?: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          confirmation_sent: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', appointmentId)

      if (error) throw error

      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
          : apt
      ))
      
      console.log('Admin confirmation sent:', { appointmentId, method, message })
    } catch (error) {
      console.error('Error sending confirmation:', error)
    }
  }

  const handleBulkConfirmation = async (appointmentIds: string[], method: 'sms' | 'email', message?: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          confirmation_sent: true, 
          updated_at: new Date().toISOString() 
        })
        .in('id', appointmentIds)

      if (error) throw error

      setAppointments(prev => prev.map(apt => 
        appointmentIds.includes(apt.id)
          ? { ...apt, confirmation_sent: true, updated_at: new Date().toISOString() }
          : apt
      ))
      
      console.log('Admin bulk confirmation:', { appointmentIds, method, message })
    } catch (error) {
      console.error('Error sending bulk confirmations:', error)
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointment Management</h1>
            <p className="text-muted-foreground">Loading appointment data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading appointments...</div>
        </div>
      </div>
    )
  }

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
                    <p className="text-sm text-muted-foreground">Today&apos;s Appointments</p>
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
                          {appointment.doctor?.full_name} • {appointment.scheduled_time}
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