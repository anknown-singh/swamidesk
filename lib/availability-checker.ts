import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
// import type { DoctorAvailability, DoctorLeave, Appointment } from '@/lib/types'

export interface AvailabilitySlot {
  start_time: string
  end_time: string
  is_available: boolean
  reason?: string
  appointment_id?: string
}

export interface AvailabilityCheckResult {
  available: boolean
  message: string
  available_slots?: AvailabilitySlot[]
  conflicts?: string[]
}

/**
 * Check if a doctor is available at a specific date and time
 */
export async function checkDoctorAvailability(
  doctorId: string,
  date: string,
  startTime: string,
  duration: number = 30,
  excludeAppointmentId?: string
): Promise<AvailabilityCheckResult> {
  try {
    const supabase = createAuthenticatedClient()
    const dayOfWeek = new Date(date).getDay()
    
    // 1. Check if doctor has availability configured for this day
    const { data: availability, error: availabilityError } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    if (availabilityError || !availability) {
      return {
        available: false,
        message: 'Doctor is not available on this day of the week',
        conflicts: ['No availability schedule configured']
      }
    }

    // 2. Check if requested time is within doctor's working hours
    const requestedStartMinutes = timeToMinutes(startTime)
    const requestedEndMinutes = requestedStartMinutes + duration
    const workingStartMinutes = timeToMinutes(availability.start_time)
    const workingEndMinutes = timeToMinutes(availability.end_time)

    if (requestedStartMinutes < workingStartMinutes || requestedEndMinutes > workingEndMinutes) {
      return {
        available: false,
        message: `Doctor is only available from ${availability.start_time} to ${availability.end_time}`,
        conflicts: ['Outside working hours']
      }
    }

    // 3. Check if requested time conflicts with break time
    if (availability.break_start_time && availability.break_end_time) {
      const breakStartMinutes = timeToMinutes(availability.break_start_time)
      const breakEndMinutes = timeToMinutes(availability.break_end_time)
      
      if (
        (requestedStartMinutes >= breakStartMinutes && requestedStartMinutes < breakEndMinutes) ||
        (requestedEndMinutes > breakStartMinutes && requestedEndMinutes <= breakEndMinutes) ||
        (requestedStartMinutes <= breakStartMinutes && requestedEndMinutes >= breakEndMinutes)
      ) {
        return {
          available: false,
          message: `Doctor has a break from ${availability.break_start_time} to ${availability.break_end_time}`,
          conflicts: ['During break time']
        }
      }
    }

    // 4. Check for approved leave requests
    const { data: leaves, error: leavesError } = await supabase
      .from('doctor_leaves')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('approved', true)
      .lte('start_date', date)
      .gte('end_date', date)

    if (leavesError) {
      console.error('Error checking doctor leaves:', leavesError)
    }

    if (leaves && leaves.length > 0) {
      for (const leave of leaves) {
        // Check if it's a full day leave or conflicts with requested time
        if (!leave.start_time || !leave.end_time) {
          // Full day leave
          return {
            available: false,
            message: `Doctor is on ${leave.leave_type} leave`,
            conflicts: [`${leave.leave_type} leave`]
          }
        } else {
          // Partial day leave
          const leaveStartMinutes = timeToMinutes(leave.start_time)
          const leaveEndMinutes = timeToMinutes(leave.end_time)
          
          if (
            (requestedStartMinutes >= leaveStartMinutes && requestedStartMinutes < leaveEndMinutes) ||
            (requestedEndMinutes > leaveStartMinutes && requestedEndMinutes <= leaveEndMinutes) ||
            (requestedStartMinutes <= leaveStartMinutes && requestedEndMinutes >= leaveEndMinutes)
          ) {
            return {
              available: false,
              message: `Doctor is on ${leave.leave_type} leave from ${leave.start_time} to ${leave.end_time}`,
              conflicts: [`${leave.leave_type} leave`]
            }
          }
        }
      }
    }

    // 5. Check for existing appointments (conflicts)
    let appointmentQuery = supabase
      .from('appointments')
      .select('id, scheduled_time, duration, status, title')
      .eq('doctor_id', doctorId)
      .eq('scheduled_date', date)
      .not('status', 'in', '(cancelled,no_show,completed)')

    if (excludeAppointmentId) {
      appointmentQuery = appointmentQuery.neq('id', excludeAppointmentId)
    }

    const { data: existingAppointments, error: appointmentsError } = await appointmentQuery

    if (appointmentsError) {
      console.error('Error checking existing appointments:', appointmentsError)
      return {
        available: false,
        message: 'Error checking existing appointments',
        conflicts: ['Database error']
      }
    }

    const conflicts: string[] = []
    if (existingAppointments && existingAppointments.length > 0) {
      for (const appointment of existingAppointments) {
        const appointmentStartMinutes = timeToMinutes(appointment.scheduled_time)
        const appointmentEndMinutes = appointmentStartMinutes + (appointment.duration || 30)
        
        // Add buffer time if configured
        const bufferMinutes = availability.buffer_time || 0
        const bufferedStartMinutes = appointmentStartMinutes - bufferMinutes
        const bufferedEndMinutes = appointmentEndMinutes + bufferMinutes
        
        if (
          (requestedStartMinutes >= bufferedStartMinutes && requestedStartMinutes < bufferedEndMinutes) ||
          (requestedEndMinutes > bufferedStartMinutes && requestedEndMinutes <= bufferedEndMinutes) ||
          (requestedStartMinutes <= bufferedStartMinutes && requestedEndMinutes >= bufferedEndMinutes)
        ) {
          conflicts.push(`Appointment at ${appointment.scheduled_time}${bufferMinutes > 0 ? ` (with ${bufferMinutes}min buffer)` : ''}`)
        }
      }
    }

    if (conflicts.length > 0) {
      return {
        available: false,
        message: 'Doctor has conflicting appointments at this time',
        conflicts
      }
    }

    // 6. Check appointment limits if configured
    if (availability.max_appointments && existingAppointments) {
      const appointmentsOnDay = existingAppointments.length
      if (appointmentsOnDay >= availability.max_appointments) {
        return {
          available: false,
          message: `Doctor has reached the maximum appointments limit for this day (${availability.max_appointments})`,
          conflicts: ['Maximum appointments reached']
        }
      }
    }

    return {
      available: true,
      message: 'Doctor is available at this time'
    }

  } catch (error) {
    console.error('Error checking doctor availability:', error)
    return {
      available: false,
      message: 'Error checking availability. Please try again.',
      conflicts: ['System error']
    }
  }
}

/**
 * Get all available time slots for a doctor on a specific date
 */
export async function getAvailableTimeSlots(
  doctorId: string,
  date: string,
  appointmentDuration: number = 30
): Promise<AvailabilitySlot[]> {
  try {
    const supabase = createAuthenticatedClient()
    const dayOfWeek = new Date(date).getDay()
    
    // Get doctor's availability for this day
    const { data: availability, error: availabilityError } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    if (availabilityError || !availability) {
      return []
    }

    const slots: AvailabilitySlot[] = []
    const workingStartMinutes = timeToMinutes(availability.start_time)
    const workingEndMinutes = timeToMinutes(availability.end_time)
    // const bufferMinutes = availability.buffer_time || 0 // TODO: Use buffer for slot generation
    
    // Generate 15-minute slot intervals within working hours
    for (let minutes = workingStartMinutes; minutes + appointmentDuration <= workingEndMinutes; minutes += 15) {
      const slotStartTime = minutesToTime(minutes)
      
      // Check availability for this slot
      const availabilityCheck = await checkDoctorAvailability(
        doctorId,
        date,
        slotStartTime,
        appointmentDuration
      )
      
      slots.push({
        start_time: slotStartTime,
        end_time: minutesToTime(minutes + appointmentDuration),
        is_available: availabilityCheck.available,
        reason: availabilityCheck.available ? undefined : availabilityCheck.message
      })
    }

    return slots

  } catch (error) {
    console.error('Error getting available time slots:', error)
    return []
  }
}

/**
 * Get available time slots for multiple doctors on a specific date
 */
export async function getMultipleDoctorAvailability(
  doctorIds: string[],
  date: string,
  appointmentDuration: number = 30
): Promise<{ [doctorId: string]: AvailabilitySlot[] }> {
  const result: { [doctorId: string]: AvailabilitySlot[] } = {}
  
  await Promise.all(
    doctorIds.map(async (doctorId) => {
      result[doctorId] = await getAvailableTimeSlots(doctorId, date, appointmentDuration)
    })
  )
  
  return result
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Check if a time slot overlaps with another time slot
 */
export function timeSlotOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  return (
    (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) ||
    (end1Minutes > start2Minutes && end1Minutes <= end2Minutes) ||
    (start1Minutes <= start2Minutes && end1Minutes >= end2Minutes)
  )
}