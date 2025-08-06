'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { createClient } from '@/lib/supabase/client'

// Dynamic data fetching - no more mock data needed

export default function AppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [activeView, setActiveView] = useState<'status' | 'confirmations'>('status')
  const [loading, setLoading] = useState(true)
  
  // Fetch appointments from database
  const fetchAppointments = useCallback(async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
          users(id, full_name, email, phone, department, specialization, created_at, updated_at)
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
        appointment_type: apt.appointment_type,
        status: apt.status,
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
          gender: apt.patients.gender,
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
          name: apt.users.full_name,
          email: apt.users.email,
          phone: apt.users.phone,
          department: apt.users.department,
          specialization: apt.users.specialization,
          is_active: true,
          created_at: apt.users.created_at,
          updated_at: apt.users.updated_at
        } : undefined
      }))

      setAppointments(mappedAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
      
      console.log('Reminder sent:', { appointmentId, type })
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
      
      console.log('Confirmation sent:', { appointmentId, method, message })
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
      
      console.log('Bulk confirmation sent:', { appointmentIds, method, message })
    } catch (error) {
      console.error('Error sending bulk confirmations:', error)
    }
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
                  <Select value={statusFilter} onValueChange={(value: AppointmentStatus | 'all') => setStatusFilter(value)}>
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