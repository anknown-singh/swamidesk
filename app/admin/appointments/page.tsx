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
  PlusIcon,
  SearchIcon,
  ClockIcon,
  StethoscopeIcon,
  UsersIcon,
  AlertTriangleIcon,
  FileTextIcon,
  MoreHorizontalIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus, AppointmentType } from '@/lib/types'
import { getCurrentUserIdOrFallback } from '@/lib/utils/uuid'

interface Doctor {
  id: string
  full_name: string
  department: string
  specialization: string
}

interface Patient {
  id: string
  full_name: string
  phone: string
  email: string
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [doctorFilter, setDoctorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'create'>('list')
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Form state for creating appointments
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    doctor_id: '',
    department: '',
    appointment_type: 'consultation' as AppointmentType,
    scheduled_date: '',
    scheduled_time: '',
    duration: 30,
    title: '',
    priority: false,
    notes: ''
  })
  
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

  // Fetch doctors and patients for form dropdowns
  const fetchDoctorsAndPatients = useCallback(async () => {
    try {
      const [doctorsResult, patientsResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, department, specialization')
          .eq('role', 'doctor')
          .eq('is_active', true),
        supabase
          .from('patients')
          .select('id, full_name, phone, email')
          .limit(100)
      ])

      if (doctorsResult.data) setDoctors(doctorsResult.data)
      if (patientsResult.data) setPatients(patientsResult.data)
    } catch (error) {
      console.error('Error fetching doctors and patients:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchAppointments()
    fetchDoctorsAndPatients()
  }, [fetchAppointments, fetchDoctorsAndPatients])

  // Create new appointment
  const handleCreateAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.scheduled_date || !newAppointment.scheduled_time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Get current authenticated user with proper UUID handling
      const currentUserId = await getCurrentUserIdOrFallback(supabase)

      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: newAppointment.patient_id,
          doctor_id: newAppointment.doctor_id,
          department: newAppointment.department,
          appointment_type: newAppointment.appointment_type,
          scheduled_date: newAppointment.scheduled_date,
          scheduled_time: newAppointment.scheduled_time,
          duration: newAppointment.duration,
          title: newAppointment.title || 'Consultation',
          priority: newAppointment.priority,
          status: 'scheduled',
          created_by: currentUserId
        }])

      if (error) throw error

      // Reset form and refresh appointments
      setNewAppointment({
        patient_id: '',
        doctor_id: '',
        department: '',
        appointment_type: 'consultation',
        scheduled_date: '',
        scheduled_time: '',
        duration: 30,
        title: '',
        priority: false,
        notes: ''
      })
      setShowCreateForm(false)
      fetchAppointments()
      
      alert('Appointment created successfully!')
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error creating appointment. Please try again.')
    }
  }

  // Handle bulk operations
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])

  const handleBulkCancel = async () => {
    if (selectedAppointments.length === 0) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedAppointments)

      if (error) throw error
      
      setSelectedAppointments([])
      fetchAppointments()
      alert('Appointments cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling appointments:', error)
    }
  }

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDoctor = doctorFilter === 'all' || appointment.doctor_id === doctorFilter
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || appointment.department === departmentFilter
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = appointment.scheduled_date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      matchesDate = appointment.scheduled_date <= weekFromNow.toISOString().split('T')[0]
    } else if (dateFilter === 'month') {
      const monthFromNow = new Date()
      monthFromNow.setMonth(monthFromNow.getMonth() + 1)
      matchesDate = appointment.scheduled_date <= monthFromNow.toISOString().split('T')[0]
    }
    
    return matchesSearch && matchesDoctor && matchesStatus && matchesDepartment && matchesDate
  })

  // Calculate statistics
  const stats = {
    total: appointments.length,
    today: appointments.filter(apt => apt.scheduled_date === new Date().toISOString().split('T')[0]).length,
    pending: appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length,
    conflicts: appointments.filter(apt => {
      // Simple conflict detection - same doctor, same date/time
      return appointments.some(other => 
        other.id !== apt.id &&
        other.doctor_id === apt.doctor_id &&
        other.scheduled_date === apt.scheduled_date &&
        other.scheduled_time === apt.scheduled_time &&
        ['scheduled', 'confirmed', 'arrived', 'in_progress'].includes(other.status)
      )
    }).length,
    departments: [...new Set(appointments.map(apt => apt.department))].length
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
            Comprehensive appointment scheduling and administrative oversight
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            New Appointment
          </Button>
          {selectedAppointments.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBulkCancel}>
                Cancel Selected ({selectedAppointments.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today&apos;s Schedule</p>
              </div>
              <ClockIcon className="h-8 w-8 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Confirmation</p>
              </div>
              <UsersIcon className="h-8 w-8 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-600">{stats.conflicts}</p>
                <p className="text-sm text-muted-foreground">Potential Conflicts</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-500 ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeView === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('list')}
        >
          <FileTextIcon className="h-4 w-4 mr-2" />
          List View
        </Button>
        <Button
          variant={activeView === 'calendar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('calendar')}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button
          variant={activeView === 'create' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('create')}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Appointment
        </Button>
      </div>

      {/* Create Appointment Form */}
      {(showCreateForm || activeView === 'create') && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Appointment</CardTitle>
            <CardDescription>Schedule a new appointment for a patient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Patient *</label>
                <Select value={newAppointment.patient_id} onValueChange={(value) => setNewAppointment(prev => ({...prev, patient_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name} - {patient.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Doctor *</label>
                <Select value={newAppointment.doctor_id} onValueChange={(value) => {
                  const doctor = doctors.find(d => d.id === value)
                  setNewAppointment(prev => ({
                    ...prev, 
                    doctor_id: value,
                    department: doctor?.department || ''
                  }))
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.full_name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Appointment Type</label>
                <Select value={newAppointment.appointment_type} onValueChange={(value: AppointmentType) => setNewAppointment(prev => ({...prev, appointment_type: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Date *</label>
                <Input
                  type="date"
                  value={newAppointment.scheduled_date}
                  onChange={(e) => setNewAppointment(prev => ({...prev, scheduled_date: e.target.value}))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Time *</label>
                <Input
                  type="time"
                  value={newAppointment.scheduled_time}
                  onChange={(e) => setNewAppointment(prev => ({...prev, scheduled_time: e.target.value}))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                <Select value={newAppointment.duration.toString()} onValueChange={(value) => setNewAppointment(prev => ({...prev, duration: parseInt(value)}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Title/Notes</label>
                <Input
                  placeholder="Appointment title or notes"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="priority"
                  checked={newAppointment.priority}
                  onChange={(e) => setNewAppointment(prev => ({...prev, priority: e.target.checked}))}
                />
                <label htmlFor="priority" className="text-sm font-medium">Priority Appointment</label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreateAppointment}>
                Create Appointment
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false)
                setActiveView('list')
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {activeView === 'list' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(value: AppointmentStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {[...new Set(appointments.map(apt => apt.department))].map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {activeView === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
            <CardDescription>Manage and oversee all clinic appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => {
                const statusInfo = getStatusInfo(appointment.status)
                const isSelected = selectedAppointments.includes(appointment.id)
                
                return (
                  <div
                    key={appointment.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAppointments([...selectedAppointments, appointment.id])
                            } else {
                              setSelectedAppointments(selectedAppointments.filter(id => id !== appointment.id))
                            }
                          }}
                        />
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
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.scheduled_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <StethoscopeIcon className="h-3 w-3" />
                                Dr. {appointment.doctor?.full_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                {appointment.department}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{appointment.appointment_type}</span>
                              <span>{appointment.duration} minutes</span>
                              <span>{appointment.patient?.mobile}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('View details for:', appointment.id)}
                        >
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View Placeholder */}
      {activeView === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Calendar view will be implemented with appointment scheduling interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Calendar View Coming Soon</h3>
              <p className="text-muted-foreground">
                Interactive calendar with drag-and-drop scheduling, conflict detection, and doctor availability integration
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}