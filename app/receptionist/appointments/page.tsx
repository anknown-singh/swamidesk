'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, PlusIcon, FilterIcon, SearchIcon } from 'lucide-react'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentBookingForm } from '@/components/appointments/appointment-booking-form'
import type { Appointment, AppointmentBookingForm as AppointmentBookingFormData } from '@/lib/types'

export default function AppointmentsPage() {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string, doctorId?: string } | null>(null)

  const handleBookAppointment = () => {
    setShowBookingForm(true)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    setSelectedSlot({ date, time, doctorId })
    setShowBookingForm(true)
  }

  const handleAppointmentSelect = (appointment: Appointment) => {
    // Could open appointment details modal here
    console.log('Selected appointment:', appointment)
  }

  const handleBookingSubmit = (formData: AppointmentBookingFormData) => {
    console.log('Booking appointment:', formData)
    // Here you would typically submit to your API
    setShowBookingForm(false)
    setSelectedSlot(null)
  }

  const handleBookingCancel = () => {
    setShowBookingForm(false)
    setSelectedSlot(null)
  }

  const getInitialBookingData = () => {
    if (selectedSlot) {
      return {
        scheduled_date: selectedSlot.date,
        scheduled_time: selectedSlot.time,
        doctor_id: selectedSlot.doctorId || '',
      }
    }
    return {}
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and scheduling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleBookAppointment} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              67% confirmation rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              8% cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Booking Form */}
      {showBookingForm && (
        <AppointmentBookingForm
          onSubmit={handleBookingSubmit}
          onCancel={handleBookingCancel}
          initialData={getInitialBookingData()}
        />
      )}

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar/Schedule View */}
        <div className="md:col-span-2">
          <AppointmentCalendar
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            onBookAppointment={handleBookAppointment}
          />
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleBookAppointment} className="w-full justify-start" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <SearchIcon className="h-4 w-4 mr-2" />
                Find Available Slots
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next 3 appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Tomorrow, 9:00 AM</span>
                  <span className="text-muted-foreground">Dr. Smith</span>
                </div>
                <div className="text-muted-foreground">Emma Davis - Consultation</div>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Tomorrow, 11:30 AM</span>
                  <span className="text-muted-foreground">Dr. Brown</span>
                </div>
                <div className="text-muted-foreground">Robert Chen - Follow-up</div>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Wed, 10:00 AM</span>
                  <span className="text-muted-foreground">Dr. Davis</span>
                </div>
                <div className="text-muted-foreground">Lisa Park - Procedure</div>
              </div>
            </CardContent>
          </Card>

          {/* Waitlist */}
          <Card>
            <CardHeader>
              <CardTitle>Waitlist</CardTitle>
              <CardDescription>Patients waiting for appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Alex Thompson</span>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                <div className="text-muted-foreground">Preferred: Dr. Smith, This week</div>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Maria Garcia</span>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                <div className="text-muted-foreground">Preferred: Any doctor, Next week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}