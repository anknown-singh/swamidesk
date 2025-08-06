'use client'

import { useState, useEffect } from 'react'
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
  FilterIcon
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Appointment, AppointmentStatus, UserProfile } from '@/lib/types'

interface AppointmentCalendarProps {
  appointments?: Appointment[]
  doctors?: UserProfile[]
  onAppointmentSelect?: (appointment: Appointment) => void
  onSlotSelect?: (date: string, time: string, doctorId?: string) => void
  onBookAppointment?: () => void
  selectedDoctorId?: string
  viewMode?: 'week' | 'day'
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
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]

const mockDoctors = [
  { id: 'doc1', name: 'Dr. Sarah Smith', role: 'doctor' as const, department: 'general', specialization: 'Internal Medicine' },
  { id: 'doc2', name: 'Dr. John Brown', role: 'doctor' as const, department: 'cardiology', specialization: 'Cardiology' },
  { id: 'doc3', name: 'Dr. Emily Davis', role: 'doctor' as const, department: 'dermatology', specialization: 'Dermatology' },
  { id: 'doc4', name: 'Dr. Michael Wilson', role: 'doctor' as const, department: 'orthopedics', specialization: 'Orthopedics' },
]

const mockAppointments: Appointment[] = [
  {
    id: 'apt1',
    patient_id: 'pat1',
    doctor_id: 'doc1',
    department: 'general',
    appointment_type: 'consultation',
    status: 'confirmed',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:30',
    duration: 30,
    title: 'Routine Check-up',
    priority: false,
    is_recurring: false,
    reminder_sent: false,
    confirmation_sent: true,
    created_by: 'rec1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient: {
      id: 'pat1',
      name: 'John Doe',
      mobile: '+91-9876543210',
      dob: '1985-06-15',
      gender: 'male',
      address: '123 Main St',
      email: 'john.doe@email.com',
      emergency_contact: '+91-9876543211',
      created_by: 'rec1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'apt2',
    patient_id: 'pat2',
    doctor_id: 'doc1',
    department: 'general',
    appointment_type: 'follow_up',
    status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '11:00',
    duration: 30,
    title: 'Follow-up Visit',
    priority: true,
    is_recurring: false,
    reminder_sent: false,
    confirmation_sent: false,
    created_by: 'rec1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient: {
      id: 'pat2',
      name: 'Sarah Johnson',
      mobile: '+91-9876543211',
      dob: '1992-03-20',
      gender: 'female',
      address: '456 Oak Ave',
      email: 'sarah.johnson@email.com',
      emergency_contact: '+91-9876543212',
      created_by: 'rec1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
]

export function AppointmentCalendar({
  appointments = mockAppointments,
  doctors = mockDoctors,
  onAppointmentSelect,
  onSlotSelect,
  onBookAppointment,
  selectedDoctorId,
  viewMode = 'week'
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterDoctorId, setFilterDoctorId] = useState(selectedDoctorId || 'all')
  const [view, setView] = useState<'week' | 'day'>(viewMode)

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'arrived': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rescheduled': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
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
        return aptDate.toDateString() === currentDay.toDateString() &&
               (filterDoctorId === 'all' || apt.doctor_id === filterDoctorId)
      })

      const slots: CalendarSlot[] = timeSlots.map(time => {
        const appointment = dayAppointments.find(apt => apt.scheduled_time === time)
        return {
          time,
          appointment,
          isAvailable: !appointment,
          doctorId: filterDoctorId !== 'all' ? filterDoctorId : undefined
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
      const appointment = dayAppointments.find(apt => apt.scheduled_time === time)
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
    } else if (slot.isAvailable && onSlotSelect) {
      onSlotSelect(
        day.date.toISOString().split('T')[0],
        slot.time,
        slot.doctorId
      )
    }
  }

  const calendarData = view === 'week' ? getWeekDays(currentDate) : [getSingleDay(currentDate)]

  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Appointment Calendar
            </CardTitle>
            <CardDescription>
              {view === 'week' ? getWeekRange() : currentDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterDoctorId} onValueChange={setFilterDoctorId}>
              <SelectTrigger className="w-48">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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

            {onBookAppointment && (
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
                    className={`p-2 rounded border text-xs cursor-pointer transition-colors min-h-[3rem] ${
                      slot.appointment 
                        ? `${getStatusColor(slot.appointment.status)} hover:opacity-80` 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSlotClick(day, slot)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <ClockIcon className="h-3 w-3" />
                      <span className="font-medium">{slot.time}</span>
                    </div>
                    
                    {slot.appointment ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span className="font-medium truncate">
                            {slot.appointment.patient?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StethoscopeIcon className="h-3 w-3" />
                          <span className="truncate">
                            {doctors.find(d => d.id === slot.appointment?.doctor_id)?.name}
                          </span>
                        </div>
                        {slot.appointment.title && (
                          <div className="text-xs opacity-80 truncate">
                            {slot.appointment.title}
                          </div>
                        )}
                        {slot.appointment.priority && (
                          <Badge variant="outline" className="text-xs py-0">
                            Priority
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Available
                        {filterDoctorId !== 'all' && (
                          <div className="text-xs mt-1">
                            {doctors.find(d => d.id === filterDoctorId)?.name}
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
              <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
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