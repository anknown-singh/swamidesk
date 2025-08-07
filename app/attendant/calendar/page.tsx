'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  PlusIcon, 
  ActivityIcon,
  TimerIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClipboardListIcon,
  StethoscopeIcon,
} from 'lucide-react'
import { RoleBasedCalendar } from '@/components/appointments/role-based-calendar'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment } from '@/lib/types'

interface AttendantStats {
  todayProcedures: number
  inProgress: number
  completed: number
  scheduled: number
  averageTime: number
  roomUtilization: number
  nextProcedure: Appointment | null
}

interface ProcedureRoom {
  id: string
  name: string
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance'
  currentPatient?: string
  currentProcedure?: string
  estimatedFinish?: string
}

export default function AttendantCalendarPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [stats, setStats] = useState<AttendantStats>({
    todayProcedures: 0,
    inProgress: 0,
    completed: 0,
    scheduled: 0,
    averageTime: 45,
    roomUtilization: 75,
    nextProcedure: null
  })
  const [procedureRooms, setProcedureRooms] = useState<ProcedureRoom[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize procedure rooms data
  useEffect(() => {
    const mockRooms: ProcedureRoom[] = [
      {
        id: 'room1',
        name: 'Procedure Room 1',
        status: 'occupied',
        currentPatient: 'John Smith',
        currentProcedure: 'Minor Surgery',
        estimatedFinish: '14:30'
      },
      {
        id: 'room2',
        name: 'Procedure Room 2',
        status: 'available'
      },
      {
        id: 'room3',
        name: 'Procedure Room 3',
        status: 'cleaning'
      },
      {
        id: 'room4',
        name: 'Treatment Room A',
        status: 'occupied',
        currentPatient: 'Maria Garcia',
        currentProcedure: 'Wound Dressing',
        estimatedFinish: '13:45'
      },
      {
        id: 'room5',
        name: 'Treatment Room B',
        status: 'available'
      }
    ]
    setProcedureRooms(mockRooms)
  }, [])

  // Fetch attendant-specific statistics
  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createAuthenticatedClient()
      try {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)

        // Get today's procedure appointments
        const { data: todayProcedures } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(id, full_name, phone),
            users!appointments_doctor_id_fkey(id, full_name, department)
          `)
          .eq('scheduled_date', today)
          .eq('appointment_type', 'procedure')
          .order('scheduled_time')

        const todayTotal = todayProcedures?.length || 0
        const inProgress = todayProcedures?.filter(apt => apt.status === 'in_progress').length || 0
        const completed = todayProcedures?.filter(apt => apt.status === 'completed').length || 0
        const scheduled = todayProcedures?.filter(apt => ['scheduled', 'confirmed', 'arrived'].includes(apt.status)).length || 0

        // Find next procedure
        const nextProcedure = todayProcedures?.find(apt => 
          apt.scheduled_time > currentTime && ['scheduled', 'confirmed', 'arrived'].includes(apt.status)
        ) || null

        // Calculate average procedure time
        const completedProcedures = todayProcedures?.filter(apt => apt.status === 'completed') || []
        const avgTime = completedProcedures.length > 0 
          ? Math.round(completedProcedures.reduce((sum, apt) => sum + (apt.duration || 45), 0) / completedProcedures.length)
          : 45

        // Calculate room utilization
        const occupiedRooms = procedureRooms.filter(room => room.status === 'occupied').length
        const roomUtilization = procedureRooms.length > 0 
          ? Math.round((occupiedRooms / procedureRooms.length) * 100)
          : 0

        setStats({
          todayProcedures: todayTotal,
          inProgress,
          completed,
          scheduled,
          averageTime: avgTime,
          roomUtilization,
          nextProcedure: nextProcedure ? {
            ...nextProcedure,
            patient: nextProcedure.patients ? {
              id: nextProcedure.patients.id,
              name: nextProcedure.patients.full_name,
              mobile: nextProcedure.patients.phone,
              dob: null,
              gender: null,
              address: null,
              email: null,
              emergency_contact: null,
              created_by: nextProcedure.created_by,
              created_at: nextProcedure.created_at,
              updated_at: nextProcedure.updated_at
            } : undefined,
            doctor: nextProcedure.users ? {
              id: nextProcedure.users.id,
              role: 'doctor' as const,
              full_name: nextProcedure.users.full_name,
              email: '',
              phone: null,
              department: nextProcedure.users.department,
              specialization: null,
              password_hash: '',
              is_active: true,
              created_at: nextProcedure.created_at,
              updated_at: nextProcedure.updated_at
            } : undefined
          } : null
        })
      } catch (error) {
        console.error('Error fetching attendant stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [procedureRooms])

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    console.log('Selected procedure:', appointment)
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    console.log('Selected slot for procedure:', { date, time, doctorId })
    // Could open procedure scheduling form
  }

  const handleStartProcedure = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Procedure started:', appointment.id)
    } catch (error) {
      console.error('Error starting procedure:', error)
    }
  }

  const handleCompleteProcedure = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient()
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id)

      if (error) throw error
      
      console.log('Procedure completed:', appointment.id)
    } catch (error) {
      console.error('Error completing procedure:', error)
    }
  }

  const handlePrepareRoom = (roomId: string) => {
    setProcedureRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, status: 'cleaning' as const }
        : room
    ))
    console.log('Preparing room:', roomId)
    
    // Simulate cleaning time
    setTimeout(() => {
      setProcedureRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, status: 'available' as const }
          : room
      ))
    }, 10000) // 10 seconds for demo
  }

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedure Schedule</h1>
          <p className="text-muted-foreground">
            Medical procedure coordination and room management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ClipboardListIcon className="h-4 w-4 mr-2" />
            Procedure Checklist
          </Button>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Procedure
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
            <div className="text-2xl font-bold">{loading ? '...' : stats.todayProcedures}</div>
            <p className="text-xs text-muted-foreground">procedures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircleIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">ongoing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.completed}</div>
            <p className="text-xs text-muted-foreground">finished</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <TimerIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{loading ? '...' : stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">upcoming</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.averageTime}m</div>
            <p className="text-xs text-muted-foreground">per procedure</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Usage</CardTitle>
            <div className={`h-4 w-4 rounded-full ${stats.roomUtilization > 80 ? 'bg-red-500' : stats.roomUtilization > 60 ? 'bg-orange-500' : 'bg-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.roomUtilization}%</div>
            <p className="text-xs text-muted-foreground">utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Calendar */}
        <div className="md:col-span-3">
          <RoleBasedCalendar
            userRole="attendant"
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            viewMode="week"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Procedure */}
          {stats.nextProcedure && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TimerIcon className="h-5 w-5" />
                  Next Procedure
                </CardTitle>
                <CardDescription>
                  Today at {stats.nextProcedure.scheduled_time}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{stats.nextProcedure.patient?.name}</h4>
                  <p className="text-sm text-muted-foreground">{stats.nextProcedure.doctor?.full_name}</p>
                  <p className="text-sm text-muted-foreground">Duration: {stats.nextProcedure.duration}min</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{stats.nextProcedure.status}</Badge>
                    <Badge variant="outline">{stats.nextProcedure.appointment_type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleStartProcedure(stats.nextProcedure!)}
                  >
                    <PlayCircleIcon className="h-4 w-4 mr-2" />
                    Start Procedure
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <ClipboardListIcon className="h-4 w-4 mr-2" />
                    Pre-procedure Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Room Status */}
          <Card>
            <CardHeader>
              <CardTitle>Room Status</CardTitle>
              <CardDescription>Real-time room availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {procedureRooms.map((room) => (
                  <div key={room.id} className={`p-3 border rounded-lg ${getRoomStatusColor(room.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{room.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {room.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {room.currentPatient && (
                      <div className="text-xs space-y-1">
                        <p>Patient: {room.currentPatient}</p>
                        <p>Procedure: {room.currentProcedure}</p>
                        {room.estimatedFinish && (
                          <p>Est. finish: {room.estimatedFinish}</p>
                        )}
                      </div>
                    )}
                    
                    {room.status === 'occupied' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2 text-xs"
                        onClick={() => handlePrepareRoom(room.id)}
                      >
                        Prepare for Next
                      </Button>
                    )}
                  </div>
                ))}
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
              <Button className="w-full justify-start" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Schedule Procedure
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ClipboardListIcon className="h-4 w-4 mr-2" />
                Equipment Checklist
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <StethoscopeIcon className="h-4 w-4 mr-2" />
                Procedure Notes
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <AlertCircleIcon className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Procedure Details */}
      {selectedAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Procedure Details</CardTitle>
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
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleStartProcedure(selectedAppointment)}
                    disabled={selectedAppointment.status === 'in_progress'}
                  >
                    <PlayCircleIcon className="h-4 w-4 mr-1" />
                    {selectedAppointment.status === 'in_progress' ? 'In Progress' : 'Start'}
                  </Button>
                  {selectedAppointment.status === 'in_progress' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCompleteProcedure(selectedAppointment)}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Doctor</h4>
                <p className="text-sm">{selectedAppointment.doctor?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedAppointment.doctor?.department}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Procedure Info</h4>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedAppointment.status}</Badge>
                  <Badge variant="outline">{selectedAppointment.appointment_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration: {selectedAppointment.duration}min
                </p>
                {selectedAppointment.priority && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircleIcon className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">Priority Procedure</span>
                  </div>
                )}
              </div>
            </div>
            {selectedAppointment.patient_notes && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-1">Procedure Notes</h4>
                <p className="text-sm text-blue-900">{selectedAppointment.patient_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}