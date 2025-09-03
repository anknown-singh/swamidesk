'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, PlusIcon, FilterIcon, SearchIcon, ClockIcon } from 'lucide-react'
import { RoleBasedCalendar } from '@/components/appointments/role-based-calendar'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface AppointmentStats {
  todayTotal: number
  confirmed: number
  pending: number
  cancelled: number
  completionRate: number
  avgDuration: number
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AppointmentStats>({
    todayTotal: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completionRate: 0,
    avgDuration: 30
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch appointment statistics
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createAuthenticatedClient()
      try {
        // Get today's appointments
        const { data: todayAppointments, error } = await supabase
          .from('appointments')
          .select('id, status, duration')
          .eq('scheduled_date', new Date().toISOString().split('T')[0])

        if (error) throw error

        const todayTotal = todayAppointments?.length || 0
        const confirmed = todayAppointments?.filter(apt => apt.status === 'confirmed').length || 0
        const pending = todayAppointments?.filter(apt => apt.status === 'scheduled').length || 0
        const cancelled = todayAppointments?.filter(apt => apt.status === 'cancelled').length || 0
        const completed = todayAppointments?.filter(apt => apt.status === 'completed').length || 0
        const completionRate = todayTotal > 0 ? Math.round((completed / todayTotal) * 100) : 0
        const avgDuration = todayAppointments?.reduce((sum, apt) => sum + (apt.duration || 30), 0) / Math.max(todayTotal, 1)

        setStats({
          todayTotal,
          confirmed,
          pending,
          cancelled,
          completionRate,
          avgDuration: Math.round(avgDuration)
        })

        // Get upcoming appointments (next 3)
        const { data: upcoming, error: upcomingError } = await supabase
          .from('appointments')
          .select(`
            *,
            patients!inner(id, full_name, phone),
            users!appointments_doctor_id_fkey(
              id, 
              full_name,
              user_profiles!inner(department, specialization)
            )
          `)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed'])
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(3)

        if (upcomingError) {
          console.error('Error fetching upcoming appointments:', upcomingError) // Debug error
        }
        
        if (!upcomingError && upcoming) {
          console.log('Raw upcoming appointments data:', upcoming) // Debug log
          console.log('Number of appointments found:', upcoming.length) // Debug log
          
          // Check for the specific appointment the user mentioned
          const userAppointment = upcoming.find(apt => apt.id === '9738ea52-6d32-4056-a472-b8f4501bf416')
          if (userAppointment) {
            console.log('Found user appointment:', userAppointment)
          } else {
            console.log('User appointment not found in results')
          }
          
          const mappedUpcoming = upcoming.map(apt => ({
            id: apt.id,
            appointment_number: apt.appointment_number,
            patient_id: apt.patient_id,
            doctor_id: apt.doctor_id,
            department: apt.department,
            appointment_type: apt.appointment_type,
            status: apt.status,
            scheduled_date: apt.scheduled_date,
            scheduled_time: apt.scheduled_time,
            duration: apt.duration || 30,
            estimated_end_time: null,
            title: apt.title,
            description: apt.description,
            chief_complaint: null,
            notes: apt.notes,
            patient_notes: apt.patient_notes,
            priority: apt.priority || false,
            is_recurring: apt.is_recurring || false,
            recurrence_type: null,
            recurrence_end_date: null,
            parent_appointment_id: null,
            reminder_sent: apt.reminder_sent || false,
            confirmation_sent: apt.confirmation_sent || false,
            confirmed_at: null,
            estimated_cost: null,
            actual_cost: null,
            arrived_at: null,
            started_at: null,
            completed_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            created_by: apt.created_by,
            created_at: apt.created_at,
            updated_at: apt.updated_at,
            patients: apt.patients ? {
              id: apt.patients.id,
              full_name: apt.patients.full_name,
              phone: apt.patients.phone,
              date_of_birth: apt.patients.date_of_birth || null,
              gender: apt.patients.gender as 'male' | 'female' | 'other' | null,
              address: apt.patients.address || null,
              email: apt.patients.email || null,
              emergency_contact_name: null,
              emergency_contact_phone: apt.patients.emergency_contact_phone || null,
              medical_history: null,
              allergies: null,
              notes: null,
              created_by: apt.created_by,
              created_at: apt.patients.created_at || apt.created_at,
              updated_at: apt.patients.updated_at || apt.updated_at
            } : undefined,
            users: apt.users ? {
              id: apt.users.id,
              role: 'doctor' as const,
              full_name: apt.users.full_name,
              email: apt.users.email || '',
              phone: apt.users.phone,
              department: apt.users.user_profiles[0]?.department || null,
              specialization: apt.users.user_profiles[0]?.specialization || null,
              password_hash: '',
              is_active: true,
              created_at: apt.users.created_at || apt.created_at,
              updated_at: apt.users.updated_at || apt.updated_at
            } : undefined
          })) as Appointment[]
          setUpcomingAppointments(mappedUpcoming)
        }
      } catch (error) {
        console.error('Error fetching appointment stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleBookAppointment = () => {
    router.push('/receptionist/appointments/new')
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    const params = new URLSearchParams({
      date,
      time,
      ...(doctorId && { doctorId })
    })
    router.push(`/receptionist/appointments/new?${params.toString()}`)
  }

  const handleAppointmentSelect = (appointment: Appointment) => {
    // Navigate to appointment details for receptionist workflow
    router.push(`/receptionist/appointments/${appointment.id}`)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    router.push(`/receptionist/appointments/${appointment.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and scheduling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleBookAppointment} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.todayTotal}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${stats.completionRate}% completion rate`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${stats.todayTotal > 0 ? Math.round((stats.confirmed / stats.todayTotal) * 100) : 0}% confirmed`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{loading ? '...' : stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : 'Awaiting confirmation'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.avgDuration}m</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : 'Average appointment time'}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar/Schedule View */}
        <div className="md:col-span-2">
          <RoleBasedCalendar
            userRole="receptionist"
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            onBookAppointment={handleBookAppointment}
            onEditAppointment={handleEditAppointment}
            viewMode="week"
          />
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleBookAppointment} className="w-full justify-start" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <SearchIcon className="h-4 w-4 mr-2" />
                Find Available Slots
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next {upcomingAppointments.length} appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="text-sm border-l-2 border-blue-200 pl-3 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {appointment.scheduled_date === new Date().toISOString().split('T')[0] ? 'Today' : 
                         new Date(appointment.scheduled_date).toLocaleDateString('en-US', { 
                           weekday: 'short', 
                           month: 'short', 
                           day: 'numeric' 
                         })}, {appointment.scheduled_time}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-500' : 
                        appointment.status === 'scheduled' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="text-muted-foreground">
                      {appointment.patients?.full_name} - {appointment.users?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {appointment.appointment_type} • {appointment.duration}min
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6"
                        onClick={() => window.location.href = `/receptionist/appointments/${appointment.id}`}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6"
                        onClick={() => window.location.href = `/receptionist/appointments/${appointment.id}/edit`}
                      >
                        Edit
                      </Button>
                      {appointment.patients && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-6"
                          onClick={() => {
                            if (appointment.patients?.phone) {
                              window.open(`tel:${appointment.patients.phone}`)
                            }
                          }}
                          disabled={!appointment.patients?.phone}
                        >
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No upcoming appointments scheduled
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waitlist */}
          <Card>
            <CardHeader>
              <CardTitle>Waitlist</CardTitle>
              <CardDescription>Patients waiting for appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Alex Thompson</span>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                <div className="text-muted-foreground">Preferred: Dr. Smith, This week</div>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Maria Garcia</span>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                <div className="text-muted-foreground">Preferred: Any doctor, Next week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}