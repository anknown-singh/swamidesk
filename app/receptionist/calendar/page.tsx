'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  CalendarIcon, 
  PlusIcon, 
  SearchIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UsersIcon,
  DollarSignIcon
} from 'lucide-react'
import { RoleBasedCalendar } from '@/components/appointments/role-based-calendar'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment } from '@/lib/types'

interface ReceptionistStats {
  todayAppointments: number
  checkedIn: number
  waitingPatients: number
  completedToday: number
  noShows: number
  totalRevenue: number
  nextAppointment: Appointment | null
}

interface WaitingPatient {
  id: string
  name: string
  appointmentTime: string
  doctor: string
  status: string
  waitTime: number
}

export default function ReceptionistCalendarPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [, setShowBookingForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<ReceptionistStats>({
    todayAppointments: 0,
    checkedIn: 0,
    waitingPatients: 0,
    completedToday: 0,
    noShows: 0,
    totalRevenue: 0,
    nextAppointment: null
  })
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch receptionist-specific statistics
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createAuthenticatedClient()
      try {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)

        // Get today's appointments
        const { data: todayAppointments } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(id, full_name, phone),
            users!appointments_doctor_id_fkey(id, full_name, department)
          `)
          .eq('scheduled_date', today)
          .order('scheduled_time')

        const todayTotal = todayAppointments?.length || 0
        const checkedIn = todayAppointments?.filter(apt => ['arrived', 'in_progress'].includes(apt.status)).length || 0
        const completedToday = todayAppointments?.filter(apt => apt.status === 'completed').length || 0
        const noShows = todayAppointments?.filter(apt => apt.status === 'no_show').length || 0

        // Find next appointment
        const nextAppointment = todayAppointments?.find(apt => 
          apt.scheduled_time > currentTime && ['scheduled', 'confirmed'].includes(apt.status)
        ) || null

        // Calculate waiting patients and wait times
        const waiting: WaitingPatient[] = (todayAppointments || [])
          .filter(apt => apt.status === 'arrived')
          .map(apt => {
            const appointmentTime = new Date(`${today}T${apt.scheduled_time}`)
            const waitMinutes = Math.max(0, Math.floor((now.getTime() - appointmentTime.getTime()) / (1000 * 60)))
            
            return {
              id: apt.id,
              name: apt.patients?.full_name || 'Unknown Patient',
              appointmentTime: apt.scheduled_time,
              doctor: apt.users?.full_name || 'Unknown Doctor',
              status: apt.status,
              waitTime: waitMinutes
            }
          })

        // Mock revenue calculation (in real app, this would come from billing data)
        const totalRevenue = completedToday * 500 // Assuming average 500 per appointment

        setStats({
          todayAppointments: todayTotal,
          checkedIn,
          waitingPatients: waiting.length,
          completedToday,
          noShows,
          totalRevenue,
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
            } : undefined,
            doctor: nextAppointment.users ? {
              id: nextAppointment.users.id,
              role: 'doctor' as const,
              full_name: nextAppointment.users.full_name,
              email: '',
              phone: null,
              department: nextAppointment.users.department,
              specialization: null,
              password_hash: '',
              is_active: true,
              created_at: nextAppointment.created_at,
              updated_at: nextAppointment.updated_at
            } : undefined
          } : null
        })
        
        setWaitingPatients(waiting)
      } catch (error) {
        console.error('Error fetching receptionist stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    console.log('Selected appointment:', appointment)
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    console.log('Selected slot:', { date, time, doctorId })
    setShowBookingForm(true)
  }

  const handleBookAppointment = () => {
    setShowBookingForm(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    console.log('Edit appointment:', appointment)
    // Navigate to edit form
  }

  const handleCheckIn = async (appointmentId: string) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointmentId)

      if (error) throw error
      
      console.log('Patient checked in:', appointmentId)
    } catch (error) {
      console.error('Error checking in patient:', error)
    }
  }

  const handleMarkNoShow = async (appointmentId: string) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId)

      if (error) throw error
      
      console.log('Marked as no-show:', appointmentId)
    } catch (error) {
      console.error('Error marking no-show:', error)
    }
  }

  const handleCallPatient = (phone: string, name: string) => {
    // In a real app, this might integrate with a phone system
    window.open(`tel:${phone}`)
    console.log(`Calling ${name} at ${phone}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Front Desk Calendar</h1>
          <p className="text-muted-foreground">
            Patient check-in, appointment management, and front desk operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={handleBookAppointment}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Appointment
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
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <UserIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">patients arrived</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <ClockIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{loading ? '...' : stats.waitingPatients}</div>
            <p className="text-xs text-muted-foreground">in queue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">finished</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{loading ? '...' : stats.noShows}</div>
            <p className="text-xs text-muted-foreground">missed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{loading ? '...' : stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Calendar */}
        <div className="md:col-span-3">
          <RoleBasedCalendar
            userRole="receptionist"
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            onBookAppointment={handleBookAppointment}
            onEditAppointment={handleEditAppointment}
            viewMode="week"
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
                  Today at {stats.nextAppointment.scheduled_time}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{stats.nextAppointment.patient?.name}</h4>
                  <p className="text-sm text-muted-foreground">{stats.nextAppointment.doctor?.full_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{stats.nextAppointment.status}</Badge>
                    <Badge variant="outline">{stats.nextAppointment.appointment_type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCheckIn(stats.nextAppointment!.id)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Check In Patient
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCallPatient(
                      stats.nextAppointment!.patient?.mobile || '',
                      stats.nextAppointment!.patient?.name || ''
                    )}
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Call Patient
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Waiting Patients Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Waiting Queue
              </CardTitle>
              <CardDescription>
                {waitingPatients.length} patients waiting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waitingPatients.length > 0 ? waitingPatients.map((patient) => (
                  <div key={patient.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{patient.name}</h4>
                        <p className="text-xs text-muted-foreground">{patient.doctor}</p>
                        <p className="text-xs text-muted-foreground">
                          Apt: {patient.appointmentTime} • Wait: {patient.waitTime}min
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant="outline" 
                          className={patient.waitTime > 30 ? 'text-red-600' : 'text-orange-600'}
                        >
                          {patient.waitTime}min
                        </Badge>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients waiting</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleBookAppointment} className="w-full justify-start" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <SearchIcon className="h-4 w-4 mr-2" />
                Find Patient
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call Waiting List
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Print Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Appointment Details */}
      {selectedAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Management</CardTitle>
            <CardDescription>
              {selectedAppointment.scheduled_date} at {selectedAppointment.scheduled_time}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">Patient Details</h4>
                <p className="text-sm">{selectedAppointment.patient?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.patient?.mobile}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleCheckIn(selectedAppointment.id)}>
                    Check In
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkNoShow(selectedAppointment.id)}>
                    No Show
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Doctor</h4>
                <p className="text-sm">{selectedAppointment.doctor?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.doctor?.department}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedAppointment.status}</Badge>
                  <Badge variant="outline">{selectedAppointment.appointment_type}</Badge>
                  {selectedAppointment.priority && (
                    <Badge variant="destructive">Priority</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Duration: {selectedAppointment.duration}min
                </p>
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