'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  StethoscopeIcon,
  PlusIcon,
  FilterIcon,
  RefreshCwIcon,
  EditIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { Appointment, AppointmentStatus, AppointmentType, UserProfile, UserRole } from '@/lib/types'

interface RoleBasedCalendarProps {
  userRole: 'admin' | 'doctor' | 'receptionist' | 'attendant' | 'patient'
  userId?: string
  onAppointmentSelect?: (appointment: Appointment) => void
  onSlotSelect?: (date: string, time: string, doctorId?: string) => void
  onBookAppointment?: () => void
  onEditAppointment?: (appointment: Appointment) => void
  onApproveAppointment?: (appointment: Appointment) => void
  onCancelAppointment?: (appointment: Appointment) => void
  selectedDoctorId?: string
  viewMode?: 'week' | 'day'
  readonly?: boolean
}

interface CalendarSlot {
  time: string
  appointment?: Appointment
  isAvailable: boolean
  doctorId?: string
}

interface CalendarDay {
  date: Date
  dayName: string
  slots: CalendarSlot[]
  isToday: boolean
  isSelected: boolean
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
]

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

export function RoleBasedCalendar({
  userRole,
  userId,
  onAppointmentSelect,
  onSlotSelect,
  onBookAppointment,
  onEditAppointment,
  onApproveAppointment,
  onCancelAppointment,
  selectedDoctorId,
  viewMode = 'week',
  readonly = false
}: RoleBasedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterDoctorId, setFilterDoctorId] = useState(selectedDoctorId || (userRole === 'doctor' ? userId : 'all'))
  const [view, setView] = useState<'week' | 'day'>(viewMode)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Role-based permissions
  const canBook = userRole === 'admin' || userRole === 'receptionist'
  const canEdit = userRole === 'admin' || userRole === 'receptionist'
  const canApprove = userRole === 'admin'
  const canViewAll = userRole === 'admin' || userRole === 'receptionist'
  const isPatientView = userRole === 'patient'
  const isDoctorView = userRole === 'doctor'

  // Fetch doctors
  const fetchDoctors = useCallback(async (): Promise<UserProfile[]> => {
    const supabase = createAuthenticatedClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('full_name')
    
    if (error) {
      console.error('Error fetching doctors:', error)
      return []
    }
    
    interface DatabaseDoctor {
      id: string
      full_name: string
      role: UserRole
      department: string | null
      specialization: string | null
      email: string | null
      phone: string | null
      is_active: boolean
      password_hash: string
      created_at: string
      updated_at: string
    }
    
    return (data as DatabaseDoctor[]).map((doctor) => ({
      id: doctor.id,
      full_name: doctor.full_name,
      role: doctor.role,
      department: doctor.department || 'general',
      specialization: doctor.specialization || null,
      email: doctor.email,
      phone: doctor.phone || null,
      password_hash: 'hashed_password',
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at
    }))
  }, [])

  // Fetch appointments with role-based filtering
  const fetchAppointments = useCallback(async (startDate?: Date, endDate?: Date): Promise<Appointment[]> => {
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
    
    if (startDate && endDate) {
      query = query
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0])
    }
    
    query = query
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
      created_by: apt.created_by,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient: apt.patients ? {
        id: apt.patients.id,
        name: apt.patients.full_name,
        mobile: apt.patients.phone,
        dob: apt.patients.date_of_birth,
        gender: apt.patients.gender as 'male' | 'female' | 'other' | null,
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
        department: apt.users.department,
        specialization: apt.users.specialization || null,
        password_hash: 'hashed_password',
        is_active: true,
        created_at: apt.users.created_at,
        updated_at: apt.users.updated_at
      } : undefined
    }))
  }, [userRole, userId])

  // Load data callback
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - 7)
      const endDate = new Date(currentDate)
      endDate.setDate(currentDate.getDate() + 14)

      const [fetchedAppointments, fetchedDoctors] = await Promise.all([
        fetchAppointments(startDate, endDate),
        canViewAll ? fetchDoctors() : []
      ])

      setAppointments(fetchedAppointments)
      setDoctors(fetchedDoctors)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading calendar data:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [currentDate, fetchAppointments, fetchDoctors, canViewAll])

  // Load data on mount and date changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Debug appointment data (can be removed in production)
  useEffect(() => {
    console.log('📅 RoleBasedCalendar - useEffect triggered with appointments:', appointments.length)
    if (appointments.length > 0) {
      console.log('📅 RoleBasedCalendar - All appointments:', appointments.map(a => ({
        id: a.id,
        patient: a.patient?.name,
        doctor: a.doctor?.full_name,
        date: a.scheduled_date,
        time: a.scheduled_time,
        normalizedTime: normalizeTime(a.scheduled_time),
        status: a.status,
        type: a.appointment_type,
        department: a.department,
        doctor_id: a.doctor_id,
        priority: a.priority
      })))
      
      const today = new Date().toDateString()
      console.log('📅 Today is:', today)
      
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_date)
        console.log('📅 Comparing dates:', apt.scheduled_date, 'vs', today, '=', aptDate.toDateString() === today)
        return aptDate.toDateString() === today
      })
      console.log('📅 Today appointments:', todayAppointments.length)
      console.log('📅 Today appointments details:', todayAppointments.map(a => ({
        id: a.id,
        patient: a.patient?.name,
        time: a.scheduled_time,
        normalizedTime: normalizeTime(a.scheduled_time),
        date: a.scheduled_date,
        status: a.status
      })))
      console.log('📅 Available time slots:', timeSlots)
    } else {
      console.log('📅 RoleBasedCalendar - No appointments loaded yet')
    }
  }, [appointments])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    loadData()
  }, [loadData])

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'requested': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'arrived': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in_progress': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no_show': return 'bg-stone-100 text-stone-800 border-stone-200'
      case 'rescheduled': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getWeekDays = (date: Date): CalendarDay[] => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const days: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek)
      currentDay.setDate(startOfWeek.getDate() + i)
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_date)
        const dateMatch = aptDate.toDateString() === currentDay.toDateString()
        const doctorMatch = (filterDoctorId === 'all' || apt.doctor_id === filterDoctorId)
        
        // Debug for today's filtering
        if (currentDay.toDateString() === new Date().toDateString()) {
          console.log(`🔍 Filtering appointment ${apt.patient?.name}: date=${dateMatch}, doctor=${doctorMatch} (filterDoctorId=${filterDoctorId}, apt.doctor_id=${apt.doctor_id})`)
        }
        
        return dateMatch && doctorMatch
      })

      const slots: CalendarSlot[] = timeSlots.map(time => {
        const matchingAppointments = dayAppointments.filter(apt => {
          const normalizedAptTime = normalizeTime(apt.scheduled_time)
          const normalizedSlotTime = normalizeTime(time)
          return normalizedAptTime === normalizedSlotTime
        })
        
        // Debug: Log all appointments for today if it's today
        if (currentDay.toDateString() === new Date().toDateString()) {
          if (matchingAppointments.length > 0) {
            console.log(`🔍 Time ${time}: Found ${matchingAppointments.length} appointments`, matchingAppointments.map(a => `${a.patient?.name} (${a.scheduled_time})`))
          }
          // Also log when checking appointments to see the matching process
          if (dayAppointments.length > 0) {
            console.log(`🕐 Checking time slot ${time} against ${dayAppointments.length} today appointments:`, dayAppointments.map(a => `${a.patient?.name} ${a.scheduled_time} -> ${normalizeTime(a.scheduled_time)} (matches: ${normalizeTime(a.scheduled_time) === normalizeTime(time)})`))
          }
        }
        
        // For now, just take the first appointment, but we could enhance this to show multiple
        const appointment = matchingAppointments[0]
        
        return {
          time,
          appointment,
          isAvailable: !appointment,
          doctorId: filterDoctorId !== 'all' ? filterDoctorId : undefined,
          // Add extra appointments info for potential future enhancement
          extraAppointments: matchingAppointments.length > 1 ? matchingAppointments.slice(1) : undefined
        }
      })

      days.push({
        date: currentDay,
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        slots,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        isSelected: currentDay.toDateString() === selectedDate.toDateString()
      })
    }
    return days
  }

  const getSingleDay = (date: Date): CalendarDay => {
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_date)
      return aptDate.toDateString() === date.toDateString() &&
             (filterDoctorId === 'all' || apt.doctor_id === filterDoctorId)
    })

    const slots: CalendarSlot[] = timeSlots.map(time => {
      const appointment = dayAppointments.find(apt => {
        const normalizedAptTime = normalizeTime(apt.scheduled_time)
        const normalizedSlotTime = normalizeTime(time)
        return normalizedAptTime === normalizedSlotTime
      })
      return {
        time,
        appointment,
        isAvailable: !appointment,
        doctorId: filterDoctorId !== 'all' ? filterDoctorId : undefined
      }
    })

    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      slots,
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: date.toDateString() === selectedDate.toDateString()
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
    setSelectedDate(newDate)
  }

  const handleSlotClick = (day: CalendarDay, slot: CalendarSlot) => {
    if (slot.appointment && onAppointmentSelect) {
      onAppointmentSelect(slot.appointment)
    } else if (slot.isAvailable && onSlotSelect && (canBook || !readonly)) {
      onSlotSelect(
        day.date.toISOString().split('T')[0],
        slot.time,
        slot.doctorId
      )
    }
  }

  const handleAppointmentAction = (action: string, appointment: Appointment, event?: React.MouseEvent) => {
    event?.stopPropagation()
    
    switch (action) {
      case 'view':
        onAppointmentSelect?.(appointment)
        break
      case 'edit':
        onEditAppointment?.(appointment)
        break
      case 'approve':
        onApproveAppointment?.(appointment)
        break
      case 'cancel':
        onCancelAppointment?.(appointment)
        break
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
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

  const calendarData = view === 'week' ? getWeekDays(currentDate) : [getSingleDay(currentDate)]

  const getWeekRange = () => {
    const weekDays = getWeekDays(currentDate)
    const firstDay = weekDays[0].date
    const lastDay = weekDays[6].date
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${firstDay.getDate()} - ${lastDay.getDate()} ${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    } else {
      return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
  }

  const getRoleTitle = () => {
    switch (userRole) {
      case 'admin': return 'Admin Calendar - All Appointments'
      case 'doctor': return 'My Schedule'
      case 'receptionist': return 'Appointment Calendar'
      case 'attendant': return 'Procedure Schedule'
      case 'patient': return 'My Appointments'
      default: return 'Calendar'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {getRoleTitle()}
              <div className="flex items-center gap-2 ml-4">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span>
                {view === 'week' ? getWeekRange() : currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="text-xs">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {canViewAll && doctors.length > 0 && (
              <Select value={filterDoctorId} onValueChange={setFilterDoctorId}>
                <SelectTrigger className="w-48">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center gap-1 border rounded-md">
              <Button 
                variant={view === 'day' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button 
                variant={view === 'week' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => view === 'week' ? navigateWeek('prev') : navigateDay('prev')}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date())
                  setSelectedDate(new Date())
                }}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => view === 'week' ? navigateWeek('next') : navigateDay('next')}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

            {onBookAppointment && canBook && (
              <Button onClick={onBookAppointment} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4" style={{ gridTemplateColumns: view === 'week' ? 'repeat(7, 1fr)' : '1fr' }}>
          {calendarData.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-2">
              {/* Day Header */}
              <div className={`text-center p-2 rounded-lg border ${
                day.isToday ? 'bg-blue-50 border-blue-200 text-blue-900' : 
                day.isSelected ? 'bg-gray-100 border-gray-300' : 
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="font-medium">{day.dayName}</div>
                <div className="text-sm text-muted-foreground">
                  {day.date.getDate()}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                {day.slots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className={`p-2 rounded border text-xs cursor-pointer transition-colors min-h-[3.5rem] relative ${
                      slot.appointment 
                        ? `${getStatusColor(slot.appointment.status)} hover:opacity-80` 
                        : canBook && !readonly 
                          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleSlotClick(day, slot)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        <span className="font-medium">{slot.time}</span>
                      </div>
                      
                      {/* Action buttons for appointments */}
                      {slot.appointment && (
                        <div className="flex items-center gap-1">
                          {onAppointmentSelect && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => handleAppointmentAction('view', slot.appointment!, e)}
                            >
                              <EyeIcon className="h-3 w-3" />
                            </Button>
                          )}
                          {onEditAppointment && canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => handleAppointmentAction('edit', slot.appointment!, e)}
                            >
                              <EditIcon className="h-3 w-3" />
                            </Button>
                          )}
                          {onApproveAppointment && canApprove && (slot.appointment.status === 'pending' || slot.appointment.status === 'requested') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => handleAppointmentAction('approve', slot.appointment!, e)}
                            >
                              <CheckIcon className="h-3 w-3" />
                            </Button>
                          )}
                          {onCancelAppointment && (canEdit || canApprove) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => handleAppointmentAction('cancel', slot.appointment!, e)}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {slot.appointment ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span className="font-medium truncate">
                            {isPatientView ? slot.appointment.doctor?.full_name : slot.appointment.patient?.name}
                          </span>
                        </div>
                        {!isDoctorView && !isPatientView && (
                          <div className="flex items-center gap-1">
                            <StethoscopeIcon className="h-3 w-3" />
                            <span className="truncate">
                              {doctors.find(d => d.id === slot.appointment?.doctor_id)?.full_name}
                            </span>
                          </div>
                        )}
                        <div className="text-xs opacity-80 truncate">
                          {slot.appointment.appointment_type} • {slot.appointment.department}
                        </div>
                        <div className="flex items-center gap-1">
                          {slot.appointment.priority && (
                            <AlertTriangleIcon className="h-3 w-3 text-red-500" />
                          )}
                          <Badge variant="outline" className="text-xs py-0">
                            {slot.appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Available
                        {filterDoctorId !== 'all' && (
                          <div className="text-xs mt-1">
                            {doctors.find(d => d.id === filterDoctorId)?.full_name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Status Legend:</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
              <span>Arrived</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}