'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  PlusIcon, 
  UsersIcon, 
  ClockIcon,
  StethoscopeIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  CheckCircleIcon
} from 'lucide-react'
import { RoleBasedCalendar } from '@/components/appointments/role-based-calendar'
import { ProperCalendar } from '@/components/appointments/proper-calendar'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment } from '@/lib/types'

interface CalendarStats {
  totalAppointments: number
  pendingApprovals: number
  todayAppointments: number
  weekAppointments: number
  utilizationRate: number
  mostBookedDoctor: string
}

export default function AdminCalendarPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [, setShowAppointmentForm] = useState(false)
  const [calendarType, setCalendarType] = useState<'existing' | 'proper'>('existing')
  const [stats, setStats] = useState<CalendarStats>({
    totalAppointments: 0,
    pendingApprovals: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    utilizationRate: 0,
    mostBookedDoctor: ''
  })
  const [loading, setLoading] = useState(true)

  // Fetch calendar statistics
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createAuthenticatedClient()
      try {
        const today = new Date().toISOString().split('T')[0]
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        // Get today's appointments
        const { data: todayAppointments } = await supabase
          .from('appointments')
          .select('id, status')
          .eq('scheduled_date', today)

        // Get this week's appointments
        interface WeekAppointmentData {
          id: string
          doctor_id: string
          users: {
            full_name: string
          } | null
        }
        
        const { data: weekAppointmentsData } = await supabase
          .from('appointments')
          .select('id, doctor_id, users!appointments_doctor_id_fkey(full_name)')
          .gte('scheduled_date', weekStart.toISOString().split('T')[0])
          .lte('scheduled_date', weekEnd.toISOString().split('T')[0]) as { data: WeekAppointmentData[] | null }

        // Get pending approvals
        const { data: pendingAppointments } = await supabase
          .from('appointments')
          .select('id')
          .in('status', ['pending', 'requested'])

        const totalAppointments = weekAppointmentsData?.length || 0
        const todayTotal = todayAppointments?.length || 0
        const pendingApprovals = pendingAppointments?.length || 0

        // Calculate utilization rate (appointments vs available slots)
        const availableSlots = 7 * 8 * 3 // 7 days, 8 time slots, assume 3 doctors on average
        const utilizationRate = totalAppointments > 0 ? Math.round((totalAppointments / availableSlots) * 100) : 0

        // Find most booked doctor
        const doctorCounts: Record<string, { count: number, name: string }> = {}
        weekAppointmentsData?.forEach((apt) => {
          if (apt.users?.full_name) {
            const doctorName = apt.users.full_name
            if (!doctorCounts[apt.doctor_id]) {
              doctorCounts[apt.doctor_id] = { count: 0, name: doctorName }
            }
            doctorCounts[apt.doctor_id]!.count++
          }
        })

        const mostBookedDoctor = Object.values(doctorCounts).reduce((max, current) => 
          current.count > max.count ? current : max, { count: 0, name: 'None' }
        ).name

        setStats({
          totalAppointments,
          pendingApprovals,
          todayAppointments: todayTotal,
          weekAppointments: totalAppointments,
          utilizationRate,
          mostBookedDoctor
        })
      } catch (error) {
        console.error('Error fetching calendar stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    // Could open a detailed modal here
    console.log('Selected appointment:', appointment)
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    console.log('Selected slot:', { date, time, doctorId })
    setShowAppointmentForm(true)
  }

  const handleBookAppointment = () => {
    setShowAppointmentForm(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    console.log('Edit appointment:', appointment)
    // Navigate to edit form or open modal
  }

  const handleApproveAppointment = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'scheduled' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Appointment approved:', appointment.id)
      // Refresh calendar data
    } catch (error) {
      console.error('Error approving appointment:', error)
    }
  }

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm(`Cancel appointment for ${appointment.patients?.full_name}?`)) return
    
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Appointment cancelled:', appointment.id)
      // Refresh calendar data
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Calendar</h1>
          <p className="text-muted-foreground">
            Comprehensive appointment management and scheduling oversight
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleBookAppointment}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
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
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{loading ? '...' : stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">need approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">capacity used</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Doctor</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">{loading ? '...' : stats.mostBookedDoctor}</div>
            <p className="text-xs text-muted-foreground">most appointments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Live</div>
            <p className="text-xs text-muted-foreground">system active</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Type Selector */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={calendarType === 'existing' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCalendarType('existing')}
        >
          Time Slots View
        </Button>
        <Button
          variant={calendarType === 'proper' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCalendarType('proper')}
        >
          Traditional Calendar
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Calendar */}
        <div className="md:col-span-3">
          {calendarType === 'existing' ? (
            <RoleBasedCalendar
              userRole="admin"
              onAppointmentSelect={handleAppointmentSelect}
              onSlotSelect={handleSlotSelect}
              onBookAppointment={handleBookAppointment}
              onEditAppointment={handleEditAppointment}
              onApproveAppointment={handleApproveAppointment}
              onCancelAppointment={handleCancelAppointment}
              viewMode="week"
            />
          ) : (
            <ProperCalendar
              userRole="admin"
              onAppointmentSelect={handleAppointmentSelect}
              onDateSelect={(date) => {
                console.log('Selected date:', date)
                setShowAppointmentForm(true)
              }}
              onBookAppointment={handleBookAppointment}
              viewMode="month"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Administrative controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleBookAppointment} className="w-full justify-start" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                Manage Doctors
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Doctor Availability
              </Button>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {stats.pendingApprovals > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>{stats.pendingApprovals} appointments need approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Patient requests</span>
                    <Badge variant="outline">{stats.pendingApprovals}</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Review All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Database</span>
                <Badge variant="outline" className="text-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Real-time sync</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Notifications</span>
                <Badge variant="outline" className="text-green-600">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Appointment Details */}
      {selectedAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              {selectedAppointment.scheduled_date} at {selectedAppointment.scheduled_time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">Patient</h4>
                <p className="text-sm">{selectedAppointment.patient?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.patient?.mobile}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Doctor</h4>
                <p className="text-sm">{selectedAppointment.doctor?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.doctor?.department}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Details</h4>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedAppointment.status}</Badge>
                  <Badge variant="outline">{selectedAppointment.appointment_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Duration: {selectedAppointment.duration}min</p>
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