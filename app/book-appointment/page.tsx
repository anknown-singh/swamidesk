'use client'

import { useState } from 'react'
import { PatientAppointmentBooking } from '@/components/appointments/patient-appointment-booking'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircleIcon, CalendarIcon } from 'lucide-react'
import type { AppointmentBookingForm } from '@/lib/types'

export default function BookAppointmentPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<AppointmentBookingForm | null>(null)

  const handleSubmit = (data: AppointmentBookingForm) => {
    console.log('Appointment booking submitted:', data)
    
    // Here you would typically submit to your API
    // For now, we'll just simulate success
    setSubmittedData(data)
    setIsSubmitted(true)
    
    // In a real app, you'd make an API call like:
    // try {
    //   const response = await fetch('/api/appointments/book', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    //   })
    //   if (response.ok) {
    //     setIsSubmitted(true)
    //   }
    // } catch (error) {
    //   console.error('Booking failed:', error)
    // }
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
              <h1 className="text-2xl font-bold text-green-900">Appointment Booked Successfully!</h1>
              <p className="text-muted-foreground">
                Your appointment request has been submitted and is being processed.
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
                <p>✓ You will receive a confirmation SMS and email shortly</p>
                <p>✓ Our team will contact you within 2 hours to confirm your appointment</p>
                <p>✓ Please arrive 15 minutes before your scheduled time</p>
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