'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'

const PatientAppointmentBooking = dynamic(
  () => import('@/components/appointments/patient-appointment-booking').then(mod => ({ default: mod.PatientAppointmentBooking })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading appointment booking...</div>
  }
)
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircleIcon, CalendarIcon } from 'lucide-react'
import type { AppointmentBookingForm } from '@/lib/types'

export default function BookAppointmentPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<AppointmentBookingForm | null>(null)

  const handleSubmit = async (data: AppointmentBookingForm) => {
    console.log('Appointment booking submitted:', data)
    
    try {
      const supabase = createAuthenticatedClient()
      
      // Save appointment with 'pending' status for admin approval
      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: data.patient_id || null,
          doctor_id: data.doctor_id,
          department: data.department,
          appointment_type: data.appointment_type,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          duration: data.duration || 30,
          title: data.title || 'Patient Appointment Request',
          priority: data.priority || false,
          status: 'pending', // Set to pending for admin approval
          patient_notes: data.patient_notes || null,
          estimated_cost: data.estimated_cost || null
        }])

      if (error) {
        console.error('❌ Error creating appointment:', error)
        console.error('Error submitting appointment request. Please try again.')
        return
      }

      console.log('✅ Patient appointment request submitted successfully')
      setSubmittedData(data)
      setIsSubmitted(true)

    } catch (error) {
      console.error('Error booking appointment:', error)
      console.error('Error submitting appointment request. Please try again.')
    }
  }

  const handleCancel = () => {
    // Redirect back or show confirmation
    window.history.back()
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-green-900">Appointment Request Submitted!</h1>
              <p className="text-muted-foreground">
                Your appointment request has been submitted and is pending approval from our team.
              </p>
            </div>

            {submittedData && (
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-green-900">Appointment Details</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{submittedData.appointment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">
                      {new Date(submittedData.scheduled_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{submittedData.scheduled_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="font-medium">{submittedData.department}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium">What&apos;s Next?</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>⏳ Your request is being reviewed by our medical team</p>
                <p>✓ We will contact you within 4 hours to confirm your appointment</p>
                <p>✓ You will receive confirmation via SMS and email once approved</p>
                <p>✓ Please arrive 15 minutes before your confirmed appointment time</p>
                <p>✓ Bring a valid ID and any relevant medical documents</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need to make changes? Call us at{' '}
                <a href="tel:+919876543200" className="text-primary hover:underline font-medium">
                  +91-9876543200
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Book Your Appointment
        </h1>
        <p className="text-muted-foreground mt-2">
          Schedule your visit with our healthcare professionals
        </p>
      </div>

      <PatientAppointmentBooking
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}