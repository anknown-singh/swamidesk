'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  ClockIcon,
  UserCheckIcon,
  StethoscopeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  ClipboardListIcon
} from 'lucide-react'
import { RoleBasedCalendar } from '@/components/appointments/role-based-calendar'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment } from '@/lib/types'

interface DoctorStats {
  todayAppointments: number
  upcomingAppointments: number
  completedToday: number
  averageConsultationTime: number
  nextAppointment: Appointment | null
  patientsSeen: number
}

export default function DoctorCalendarPage() {
  const [doctorId, setDoctorId] = useState<string>('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [stats, setStats] = useState<DoctorStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    averageConsultationTime: 30,
    nextAppointment: null,
    patientsSeen: 0
  })
  const [loading, setLoading] = useState(true)

  // Get current doctor ID from localStorage/auth
  useEffect(() => {
    const userData = localStorage.getItem('swamicare_user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.role === 'doctor') {
        setDoctorId(user.id)
      }
    }
  }, [])

  // Fetch doctor-specific statistics
  useEffect(() => {
    if (!doctorId) return

    const fetchStats = async () => {
      const supabase = createAuthenticatedClient()
      try {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)

        // Get today's appointments for this doctor
        const { data: todayAppointments } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(id, full_name, phone)
          `)
          .eq('doctor_id', doctorId)
          .eq('scheduled_date', today)
          .order('scheduled_time')

        // Get upcoming appointments (next 7 days)
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        const { data: upcomingAppointments } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(id, full_name, phone)
          `)
          .eq('doctor_id', doctorId)
          .gte('scheduled_date', today)
          .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed', 'arrived'])
          .order('scheduled_date')
          .order('scheduled_time')

        const todayTotal = todayAppointments?.length || 0
        const upcomingTotal = upcomingAppointments?.length || 0
        const completedToday = todayAppointments?.filter(apt => apt.status === 'completed').length || 0
        
        // Find next appointment
        const nextAppointment = todayAppointments?.find(apt => 
          apt.scheduled_time > currentTime && ['scheduled', 'confirmed', 'arrived'].includes(apt.status)
        ) || upcomingAppointments?.find(apt => 
          apt.scheduled_date > today && ['scheduled', 'confirmed', 'arrived'].includes(apt.status)
        ) || null

        // Calculate average consultation time for completed appointments
        const completedAppointments = todayAppointments?.filter(apt => apt.status === 'completed') || []
        const avgTime = completedAppointments.length > 0 
          ? Math.round(completedAppointments.reduce((sum, apt) => sum + (apt.duration || 30), 0) / completedAppointments.length)
          : 30

        // Count unique patients seen today
        const uniquePatients = new Set(
          todayAppointments
            ?.filter(apt => ['completed', 'in_progress'].includes(apt.status))
            .map(apt => apt.patient_id)
        ).size

        setStats({
          todayAppointments: todayTotal,
          upcomingAppointments: upcomingTotal,
          completedToday,
          averageConsultationTime: avgTime,
          nextAppointment: nextAppointment ? {
            ...nextAppointment,
            patient: nextAppointment.patients ? {
              id: nextAppointment.patients.id,
              name: nextAppointment.patients.full_name,
              mobile: nextAppointment.patients.phone,
              dob: null,
              gender: null,
              address: null,
              email: null,
              emergency_contact: null,
              created_by: nextAppointment.created_by,
              created_at: nextAppointment.created_at,
              updated_at: nextAppointment.updated_at
            } : undefined
          } : null,
          patientsSeen: uniquePatients
        })
      } catch (error) {
        console.error('Error fetching doctor stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 2 minutes
    const interval = setInterval(fetchStats, 120000)
    return () => clearInterval(interval)
  }, [doctorId])

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    console.log('Selected appointment:', appointment)
  }

  const handleStartConsultation = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Consultation started:', appointment.id)
      // Could redirect to consultation interface
    } catch (error) {
      console.error('Error starting consultation:', error)
    }
  }

  const handleCompleteAppointment = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          // Could add completion timestamp, notes, etc.
        })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Appointment completed:', appointment.id)
      // Could redirect to prescription/summary form
    } catch (error) {
      console.error('Error completing appointment:', error)
    }
  }

  const handleMarkArrived = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Patient marked as arrived:', appointment.id)
    } catch (error) {
      console.error('Error marking patient as arrived:', error)
    }
  }

  if (!doctorId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground">Please log in as a doctor to view this calendar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            Personal appointment calendar and patient management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.nextAppointment && (
            <Button 
              onClick={() => handleStartConsultation(stats.nextAppointment!)}
              disabled={stats.nextAppointment.status === 'in_progress'}
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {stats.nextAppointment.status === 'in_progress' ? 'In Progress' : 'Start Next'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.patientsSeen}</div>
            <p className="text-xs text-muted-foreground">seen today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.averageConsultationTime}m</div>
            <p className="text-xs text-muted-foreground">per patient</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-4 w-4 rounded-full ${stats.nextAppointment ? 'bg-green-500' : 'bg-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.nextAppointment ? 'Ready' : 'Free'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.nextAppointment ? 'next patient' : 'no pending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Calendar */}
        <div className="md:col-span-3">
          <RoleBasedCalendar
            userRole="doctor"
            userId={doctorId}
            onAppointmentSelect={handleAppointmentSelect}
            viewMode="week"
            readonly={true}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Appointment */}
          {stats.nextAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Next Appointment
                </CardTitle>
                <CardDescription>
                  {stats.nextAppointment.scheduled_date === new Date().toISOString().split('T')[0] 
                    ? 'Today' 
                    : new Date(stats.nextAppointment.scheduled_date).toLocaleDateString()
                  } at {stats.nextAppointment.scheduled_time}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{stats.nextAppointment.patient?.name}</h4>
                  <p className="text-sm text-muted-foreground">{stats.nextAppointment.patient?.mobile}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{stats.nextAppointment.status}</Badge>
                    <Badge variant="outline">{stats.nextAppointment.appointment_type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {stats.nextAppointment.status === 'scheduled' && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleMarkArrived(stats.nextAppointment!)}
                    >
                      <UserCheckIcon className="h-4 w-4 mr-2" />
                      Mark as Arrived
                    </Button>
                  )}
                  
                  {stats.nextAppointment.status === 'arrived' && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartConsultation(stats.nextAppointment!)}
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Start Consultation
                    </Button>
                  )}
                  
                  {stats.nextAppointment.status === 'in_progress' && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCompleteAppointment(stats.nextAppointment!)}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View Patient History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ClipboardListIcon className="h-4 w-4 mr-2" />
                View Prescriptions
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                My Availability
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <UserCheckIcon className="h-4 w-4 mr-2" />
                Patient Records
              </Button>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Summary</CardTitle>
              <CardDescription>Performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <Badge variant="outline">
                  {stats.todayAppointments > 0 
                    ? Math.round((stats.completedToday / stats.todayAppointments) * 100)
                    : 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>On-time Performance</span>
                <Badge variant="outline" className="text-green-600">95%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Patient Satisfaction</span>
                <Badge variant="outline" className="text-blue-600">4.8/5</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Appointment Details */}
      {selectedAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Appointment</CardTitle>
            <CardDescription>
              {selectedAppointment.scheduled_date} at {selectedAppointment.scheduled_time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Patient Information</h4>
                <p className="text-sm">{selectedAppointment.patient?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.patient?.mobile}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedAppointment.status}</Badge>
                  <Badge variant="outline">{selectedAppointment.appointment_type}</Badge>
                  {selectedAppointment.priority && (
                    <Badge variant="destructive">Priority</Badge>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Appointment Details</h4>
                <p className="text-sm">Duration: {selectedAppointment.duration} minutes</p>
                <p className="text-sm">Type: {selectedAppointment.appointment_type}</p>
                <p className="text-sm">Department: {selectedAppointment.department}</p>
              </div>
            </div>
            {selectedAppointment.patient_notes && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-1">Patient Notes</h4>
                <p className="text-sm text-blue-900">{selectedAppointment.patient_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}