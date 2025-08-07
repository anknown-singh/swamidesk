'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon,
  MapPinIcon,
  UserCheckIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react'
import { AppointmentStatusManager } from '@/components/appointments/appointment-status-manager'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus, AppointmentType } from '@/lib/types'

export default function AttendantAppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [activeView, setActiveView] = useState<'queue' | 'arrived' | 'completed'>('queue')
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

      setAppointments(mappedAppointments)
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
      
      console.log('Attendant reminder sent:', { appointmentId, type })
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const handleMarkArrived = async (appointmentId: string) => {
    await handleStatusUpdate(appointmentId, 'arrived')
  }

  const handleMarkCompleted = async (appointmentId: string) => {
    await handleStatusUpdate(appointmentId, 'completed')
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

  // Filter appointments based on search, status, and view
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter

    let matchesView = true
    const today = new Date().toISOString().split('T')[0]
    
    switch (activeView) {
      case 'queue':
        matchesView = appointment.scheduled_date === today && 
                     ['scheduled', 'confirmed'].includes(appointment.status)
        break
      case 'arrived':
        matchesView = ['arrived', 'in_progress'].includes(appointment.status)
        break
      case 'completed':
        matchesView = appointment.status === 'completed'
        break
    }
    
    return matchesSearch && matchesStatus && matchesView
  })

  // Calculate stats for attendant view
  const stats = {
    queue: appointments.filter(apt => 
      apt.scheduled_date === new Date().toISOString().split('T')[0] && 
      ['scheduled', 'confirmed'].includes(apt.status)
    ).length,
    arrived: appointments.filter(apt => ['arrived', 'in_progress'].includes(apt.status)).length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    priority: appointments.filter(apt => 
      apt.priority && 
      ['scheduled', 'confirmed', 'arrived', 'in_progress'].includes(apt.status)
    ).length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Queue</h1>
            <p className="text-muted-foreground">Loading service queue...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Service Queue</h1>
          <p className="text-muted-foreground">
            Manage patient arrivals and service coordination
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Queue: {stats.queue}
          </Badge>
          {stats.priority > 0 && (
            <Badge variant="destructive">
              {stats.priority} Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.queue}</div>
            <div className="text-sm text-muted-foreground">In Queue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.arrived}</div>
            <div className="text-sm text-muted-foreground">Arrived</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.priority}</div>
            <div className="text-sm text-muted-foreground">Priority Cases</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeView === 'queue' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('queue')}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Queue
        </Button>
        <Button
          variant={activeView === 'arrived' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('arrived')}
        >
          <UserCheckIcon className="h-4 w-4 mr-2" />
          Arrived
        </Button>
        <Button
          variant={activeView === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('completed')}
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Completed
        </Button>
      </div>

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
                    placeholder="Search patients, doctors, departments..."
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeView === 'queue' && 'Today\'s Queue'}
                {activeView === 'arrived' && 'Arrived Patients'}
                {activeView === 'completed' && 'Completed Services'}
                {' '}({filteredAppointments.length})
              </CardTitle>
              <CardDescription>Click on an appointment to manage service details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAppointments.map((appointment) => {
                  const statusInfo = getStatusInfo(appointment.status)
                  return (
                    <div
                      key={appointment.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAppointment?.id === appointment.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{appointment.patient?.name}</h3>
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                            {appointment.priority && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-3 w-3" />
                              Dr. {appointment.doctor?.full_name} • {appointment.department}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-3 w-3" />
                              {appointment.appointment_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm text-muted-foreground">
                            {appointment.duration} min
                          </div>
                          {activeView === 'queue' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkArrived(appointment.id)
                              }}
                            >
                              Mark Arrived
                            </Button>
                          )}
                          {activeView === 'arrived' && appointment.status === 'arrived' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkCompleted(appointment.id)
                              }}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredAppointments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No appointments found for this view</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Management Panel */}
        <div>
          {selectedAppointment ? (
            <div className="space-y-4">
              {/* Patient Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Patient Name</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.mobile}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Doctor</p>
                        <p className="text-sm text-muted-foreground">Dr. {selectedAppointment.doctor?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.department}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Service Type</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.appointment_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.duration} minutes</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Scheduled Time</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedAppointment.scheduled_date).toLocaleDateString()} at {selectedAppointment.scheduled_time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {selectedAppointment.status === 'confirmed' && (
                      <Button onClick={() => handleMarkArrived(selectedAppointment.id)}>
                        Mark as Arrived
                      </Button>
                    )}
                    {selectedAppointment.status === 'arrived' && (
                      <Button onClick={() => handleMarkCompleted(selectedAppointment.id)}>
                        Mark as Completed
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Assign Room
                    </Button>
                    <Button variant="outline" size="sm">
                      Call Patient
                    </Button>
                    <Button variant="outline" size="sm">
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Manager */}
              <AppointmentStatusManager
                appointment={selectedAppointment}
                onStatusUpdate={handleStatusUpdate}
                onSendReminder={handleSendReminder}
                canModify={true}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheckIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Appointment</h3>
                <p className="text-muted-foreground">
                  Choose an appointment from the queue to manage service coordination and patient flow
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}