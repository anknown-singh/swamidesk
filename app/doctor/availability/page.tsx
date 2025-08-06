'use client'

import { useState, useEffect } from 'react'
import { DoctorAvailabilityManagement } from '@/components/appointments/doctor-availability'

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

  const handleSave = (data: Record<string, unknown>) => {
    console.log('Saving doctor availability/leave data:', data)
    // Here you would typically save to your database
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