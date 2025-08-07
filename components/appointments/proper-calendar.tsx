'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  PlusIcon,
  UserIcon,
  ClockIcon
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment, AppointmentStatus, AppointmentType } from '@/lib/types'

interface ProperCalendarProps {
  userRole: 'admin' | 'doctor' | 'receptionist' | 'attendant' | 'patient'
  userId?: string
  onAppointmentSelect?: (appointment: Appointment) => void
  onDateSelect?: (date: Date) => void
  onBookAppointment?: () => void
  viewMode?: 'month' | 'week' | 'day'
  readonly?: boolean
}

interface CalendarDay {
  date: Date
  appointments: Appointment[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

// Normalize time format to HH:MM
const normalizeTime = (time: string): string => {
  if (!time) return ''
  
  // Remove seconds if present (HH:MM:SS -> HH:MM)
  const timeParts = time.split(':')
  if (timeParts.length >= 2) {
    const hours = timeParts[0].padStart(2, '0')
    const minutes = timeParts[1].padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // Handle AM/PM format
  if (time.includes('AM') || time.includes('PM')) {
    try {
      const date = new Date(`1970-01-01 ${time}`)
      return date.toTimeString().slice(0, 5) // HH:MM format
    } catch {
      return time
    }
  }
  
  return time
}

const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'confirmed': return 'bg-green-100 text-green-700 border-green-200'
    case 'arrived': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'in_progress': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    case 'no_show': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'rescheduled': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function ProperCalendar({
  userRole,
  userId,
  onAppointmentSelect,
  onDateSelect,
  onBookAppointment,
  viewMode: initialViewMode = 'month',
  readonly = false
}: ProperCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(initialViewMode)

  // Fetch appointments
  const fetchAppointments = useCallback(async (startDate: Date, endDate: Date): Promise<Appointment[]> => {
    const supabase = createAuthenticatedClient()
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
        users!appointments_doctor_id_fkey(id, full_name, email, phone, department, specialization, created_at, updated_at)
      `)
    
    // Role-based filtering
    if (userRole === 'doctor' && userId) {
      query = query.eq('doctor_id', userId)
    } else if (userRole === 'patient' && userId) {
      query = query.eq('patient_id', userId)
    }
    
    query = query
      .gte('scheduled_date', startDate.toISOString().split('T')[0])
      .lte('scheduled_date', endDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }
    
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
    
    return (data as DatabaseAppointment[]).map((apt) => ({
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
        phone: apt.users.phone || null,
        department: apt.users.department || null,
        specialization: apt.users.specialization || null,
        password_hash: 'hashed_password',
        is_active: true,
        created_at: apt.users.created_at,
        updated_at: apt.users.updated_at
      } : undefined
    }))
  }, [userRole, userId])

  // Load appointments for current view
  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      let startDate: Date, endDate: Date

      if (viewMode === 'month') {
        // Get the full month including days from previous/next months
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday
        
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay())) // End on Saturday
      } else if (viewMode === 'week') {
        startDate = new Date(currentDate)
        startDate.setDate(currentDate.getDate() - currentDate.getDay())
        
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
      } else {
        // day view
        startDate = new Date(currentDate)
        endDate = new Date(currentDate)
      }

      const fetchedAppointments = await fetchAppointments(startDate, endDate)
      setAppointments(fetchedAppointments)
      
      console.log('🗓️ ProperCalendar - Fetched appointments:', fetchedAppointments.length)
      console.log('🗓️ ProperCalendar - Appointment details:', fetchedAppointments.map(a => ({
        id: a.id,
        patient: a.patient?.name,
        doctor: a.doctor?.full_name,
        date: a.scheduled_date,
        time: a.scheduled_time,
        type: a.appointment_type,
        status: a.status,
        department: a.department
      })))
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }, [currentDate, viewMode, fetchAppointments])

  // Load appointments when component mounts or dependencies change
  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Generate calendar days for month view
  const generateMonthDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    
    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    // Generate 42 days (6 weeks × 7 days)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_date)
        return aptDate.toDateString() === date.toDateString()
      })
      
      days.push({
        date,
        appointments: dayAppointments,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString()
      })
    }
    
    return days
  }

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date)
    // Only call onDateSelect if it's not just selecting the date for viewing
    // onDateSelect?.(day.date)
  }

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const formatHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Calendar...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading appointments...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const monthDays = generateMonthDays()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Proper Calendar - {formatHeaderTitle()}
            </CardTitle>
            <CardDescription>
              Traditional calendar view with clean appointment display
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            {onBookAppointment && !readonly && (
              <Button onClick={onBookAppointment} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Month View */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-colors ${
                  day.isCurrentMonth 
                    ? 'bg-white hover:bg-gray-50' 
                    : 'bg-gray-50 text-gray-400'
                } ${
                  day.isToday 
                    ? 'bg-blue-50 border-blue-200' 
                    : ''
                } ${
                  day.isSelected 
                    ? 'ring-2 ring-blue-500' 
                    : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {day.appointments.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {day.appointments.length}
                    </Badge>
                  )}
                </div>
                
                {/* Appointments */}
                <div className="space-y-1">
                  {day.appointments.slice(0, 3).map((appointment, aptIndex) => (
                    <div
                      key={aptIndex}
                      className={`text-xs p-1 rounded border cursor-pointer ${getStatusColor(appointment.status)}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentSelect?.(appointment)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        <span className="truncate">
                          {normalizeTime(appointment.scheduled_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <UserIcon className="h-3 w-3" />
                        <span className="truncate">
                          {userRole === 'doctor' ? appointment.patient?.name : appointment.doctor?.full_name}
                        </span>
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {appointment.appointment_type} • {appointment.department}
                      </div>
                    </div>
                  ))}
                  
                  {day.appointments.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground py-1">
                      +{day.appointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-8 gap-1">
            {/* Time column header */}
            <div className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
              Time
            </div>
            
            {/* Day headers */}
            {(() => {
              const startOfWeek = new Date(currentDate)
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
              const weekDays = []
              for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek)
                day.setDate(startOfWeek.getDate() + i)
                weekDays.push(day)
              }
              return weekDays.map(day => (
                <div key={day.toISOString()} className="p-2 text-center border-b">
                  <div className="text-sm font-medium">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg ${
                    day.toDateString() === new Date().toDateString() ? 'text-blue-600 font-bold' : ''
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))
            })()}

            {/* Time slots */}
            {(() => {
              const timeSlots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
                '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
              ]
              const startOfWeek = new Date(currentDate)
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
              
              return timeSlots.map(time => (
                <div key={time} className="contents">
                  {/* Time label */}
                  <div className="p-2 text-sm text-muted-foreground border-r">
                    {time}
                  </div>
                  
                  {/* Day columns */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(startOfWeek)
                    day.setDate(startOfWeek.getDate() + i)
                    
                    const dayAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.scheduled_date)
                      const aptTime = normalizeTime(apt.scheduled_time)
                      return aptDate.toDateString() === day.toDateString() && 
                             aptTime === time
                    })
                    
                    return (
                      <div 
                        key={i} 
                        className="min-h-[60px] p-1 border border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          // Only trigger booking on empty slots
                          if (dayAppointments.length === 0) {
                            onDateSelect?.(day)
                          }
                        }}
                      >
                        {dayAppointments.map((appointment, aptIndex) => (
                          <div
                            key={aptIndex}
                            className={`text-xs p-1 rounded border cursor-pointer mb-1 ${getStatusColor(appointment.status)}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentSelect?.(appointment)
                            }}
                          >
                            <div className="truncate">
                              {userRole === 'doctor' ? appointment.patient?.name : appointment.doctor?.full_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </h3>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const timeSlots = [
                  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
                  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
                ]
                const dayAppointments = appointments.filter(apt => {
                  const aptDate = new Date(apt.scheduled_date)
                  return aptDate.toDateString() === currentDate.toDateString()
                })
                
                return timeSlots.map(time => {
                  const slotAppointments = dayAppointments.filter(apt => 
                    normalizeTime(apt.scheduled_time) === time
                  )
                  
                  return (
                    <div key={time} className="grid grid-cols-4 gap-4 p-2 border rounded">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{time}</span>
                      </div>
                      
                      <div className="col-span-3">
                        {slotAppointments.length > 0 ? (
                          <div className="space-y-1">
                            {slotAppointments.map((appointment, aptIndex) => (
                              <div
                                key={aptIndex}
                                className={`p-2 rounded border cursor-pointer ${getStatusColor(appointment.status)}`}
                                onClick={() => onAppointmentSelect?.(appointment)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {userRole === 'doctor' ? appointment.patient?.name : appointment.doctor?.full_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {appointment.department} • {appointment.appointment_type}
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {appointment.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-center p-4 border-2 border-dashed border-gray-200 rounded cursor-pointer hover:border-gray-300"
                               onClick={() => onDateSelect?.(currentDate)}>
                            Available - Click to book
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}