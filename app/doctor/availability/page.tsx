'use client'

import { useState, useEffect } from 'react'
import { DoctorAvailabilityManagement } from '@/components/appointments/doctor-availability'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import type { DoctorAvailabilityForm, DoctorLeaveForm } from '@/lib/types'

export default function DoctorAvailabilityPage() {
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('')

  useEffect(() => {
    // Get current logged-in doctor's ID
    const userData = localStorage.getItem('swamicare_user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.role === 'doctor') {
        setCurrentDoctorId(user.id)
      }
    }
  }, [])

  const handleSave = async (data: DoctorAvailabilityForm | DoctorLeaveForm) => {
    console.log('Saving doctor availability/leave data:', data)
    
    try {
      const supabase = createAuthenticatedClient()
      
      if ('day_of_week' in data) {
        // It's availability data
        const availabilityData = data as DoctorAvailabilityForm
        
        const { error } = await supabase
          .from('doctor_availability')
          .upsert([{
            doctor_id: availabilityData.doctor_id,
            day_of_week: availabilityData.day_of_week,
            start_time: availabilityData.start_time,
            end_time: availabilityData.end_time,
            break_start_time: availabilityData.break_start_time,
            break_end_time: availabilityData.break_end_time,
            is_available: availabilityData.is_available,
            max_appointments: availabilityData.max_appointments,
            appointment_duration: availabilityData.appointment_duration,
            buffer_time: availabilityData.buffer_time
          }], {
            onConflict: 'doctor_id,day_of_week'
          })

        if (error) {
          console.error('❌ Error saving availability:', error)
          console.error('Error saving availability. Please try again.')
          return
        }

        console.log('✅ Doctor availability saved successfully')
        console.log('Availability updated successfully!')
        
      } else {
        // It's leave data
        const leaveData = data as DoctorLeaveForm
        
        const { error } = await supabase
          .from('doctor_leaves')
          .insert([{
            doctor_id: leaveData.doctor_id,
            leave_type: leaveData.leave_type,
            start_date: leaveData.start_date,
            end_date: leaveData.end_date,
            start_time: leaveData.start_time,
            end_time: leaveData.end_time,
            reason: leaveData.reason,
            is_recurring: leaveData.is_recurring || false,
            approved: false // Needs admin approval
          }])

        if (error) {
          console.error('❌ Error saving leave request:', error)
          console.error('Error saving leave request. Please try again.')
          return
        }

        console.log('✅ Leave request submitted successfully')
        console.log('Leave request submitted for approval!')
      }
      
    } catch (error) {
      console.error('Error saving data:', error)
      console.error('Error saving data. Please try again.')
    }
  }

  if (!currentDoctorId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading your availability settings...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <DoctorAvailabilityManagement 
        doctorId={currentDoctorId} 
        onSave={handleSave}
      />
    </div>
  )
}