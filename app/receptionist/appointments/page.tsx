'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, PlusIcon, FilterIcon, SearchIcon, ClockIcon } from 'lucide-react'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentBookingForm } from '@/components/appointments/appointment-booking-form'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentBookingForm as AppointmentBookingFormData } from '@/lib/types'

interface AppointmentStats {
  todayTotal: number
  confirmed: number
  pending: number
  cancelled: number
  completionRate: number
  avgDuration: number
}

export default function AppointmentsPage() {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string, doctorId?: string } | null>(null)
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
      const supabase = createClient()
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
            patients!inner(id, first_name, last_name, phone),
            users!inner(id, full_name, department)
          `)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed'])
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(3)

        if (!upcomingError && upcoming) {
          const mappedUpcoming = upcoming.map(apt => ({
            id: apt.id,
            patient_id: apt.patient_id,
            doctor_id: apt.doctor_id,
            department: apt.department,
            appointment_type: apt.appointment_type,
            status: apt.status,
            scheduled_date: apt.scheduled_date,
            scheduled_time: apt.scheduled_time,
            duration: apt.duration || 30,
            title: apt.title,
            description: apt.description,
            notes: apt.notes,
            patient_notes: apt.patient_notes,
            priority: apt.priority || false,
            is_recurring: apt.is_recurring || false,
            reminder_sent: apt.reminder_sent || false,
            confirmation_sent: apt.confirmation_sent || false,
            created_by: apt.created_by,
            created_at: apt.created_at,
            updated_at: apt.updated_at,
            patient: apt.patients ? {
              id: apt.patients.id,
              name: `${apt.patients.first_name} ${apt.patients.last_name}`,
              mobile: apt.patients.phone,
              dob: null,
              gender: null,
              address: null,
              email: null,
              emergency_contact: null,
              created_by: apt.created_by,
              created_at: apt.patients.created_at || apt.created_at,
              updated_at: apt.patients.updated_at || apt.updated_at
            } : undefined,
            doctor: apt.users ? {
              id: apt.users.id,
              role: 'doctor' as const,
              full_name: apt.users.full_name,
              email: '',
              phone: null,
              department: apt.users.department,
              specialization: null,
              password_hash: '',
              is_active: true,
              created_at: apt.users.created_at || apt.created_at,
              updated_at: apt.users.updated_at || apt.updated_at
            } : undefined
          }))
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
    setShowBookingForm(true)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    setSelectedSlot({ date, time, doctorId })
    setShowBookingForm(true)
  }

  const handleAppointmentSelect = (appointment: Appointment) => {
    // Could open appointment details modal here
    console.log('Selected appointment:', appointment)
  }

  const handleBookingSubmit = (formData: AppointmentBookingFormData) => {
    console.log('Booking appointment:', formData)
    // Here you would typically submit to your API
    setShowBookingForm(false)
    setSelectedSlot(null)
  }

  const handleBookingCancel = () => {
    setShowBookingForm(false)
    setSelectedSlot(null)
  }

  const getInitialBookingData = () => {
    if (selectedSlot) {
      return {
        scheduled_date: selectedSlot.date,
        scheduled_time: selectedSlot.time,
        doctor_id: selectedSlot.doctorId || '',
      }
    }
    return {}
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

      {/* Appointment Booking Form */}
      {showBookingForm && (
        <AppointmentBookingForm
          onSubmit={handleBookingSubmit}
          onCancel={handleBookingCancel}
          initialData={getInitialBookingData()}
        />
      )}

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar/Schedule View */}
        <div className="md:col-span-2">
          <AppointmentCalendar
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            onBookAppointment={handleBookAppointment}
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
                  <div key={appointment.id} className="text-sm border-l-2 border-blue-200 pl-3">
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
                      {appointment.patient?.name} - {appointment.doctor?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {appointment.appointment_type} • {appointment.duration}min
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