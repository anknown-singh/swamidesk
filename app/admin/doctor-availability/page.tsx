'use client'

import { DoctorAvailabilityManagement } from '@/components/appointments/doctor-availability'

export default function DoctorAvailabilityPage() {
  const handleSave = (data: any) => {
    console.log('Saving availability/leave data:', data)
    // Here you would typically save to your database
  }

  return (
    <div className="container mx-auto py-6">
      <DoctorAvailabilityManagement onSave={handleSave} />
    </div>
  )
}