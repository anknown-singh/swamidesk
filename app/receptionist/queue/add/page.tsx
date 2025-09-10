'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, Search, Calendar, User, UserPlus, Clock, Stethoscope, AlertCircle } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

interface Patient {
  id: string
  full_name: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: string
  address?: string
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_date: string
  scheduled_time: string
  title: string
  status: string
  patients: Patient
  users: {
    id: string
    full_name: string
    department: string
  }
}

interface Doctor {
  id: string
  full_name: string
  department: string
}

export default function AddToQueuePage() {
  const router = useRouter()
  const { user } = useUser()
  
  // State
  const [activeTab, setActiveTab] = useState('appointments')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  
  // Search and filters
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  
  // Selected items
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  
  // Form data
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [priority, setPriority] = useState(false)
  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: ''
  })

  // Load initial data
  const loadData = useCallback(async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      setError(null)

      const today = new Date().toISOString().split('T')[0]

      // Load appointments for today that aren't in queue yet
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          scheduled_date,
          scheduled_time,
          title,
          status,
          patients!inner(id, full_name, phone, email, date_of_birth),
          users!appointments_doctor_id_fkey(id, full_name, user_profiles(department))
        `)
        .eq('scheduled_date', today)
        .in('status', ['scheduled', 'confirmed'])
        .order('scheduled_time')

      if (appointmentsError) throw appointmentsError

      // Filter out appointments already in queue
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('patient_id')
        .eq('visit_date', today)

      const existingPatientIds = new Set(existingVisits?.map(v => v.patient_id) || [])
      const availableAppointments = appointmentsData?.filter(
        apt => !existingPatientIds.has(apt.patient_id)
      ) || []

      setAppointments(availableAppointments)

      // Load all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, full_name, phone, email, date_of_birth, gender, address')
        .order('full_name')

      if (patientsError) throw patientsError
      setPatients(patientsData || [])

      // Load doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('users')
        .select('id, full_name, department')
        .eq('role', 'doctor')
        .order('full_name')

      if (doctorsError) throw doctorsError
      setDoctors(doctorsData || [])

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Add appointments to queue
  const addAppointmentsToQueue = async () => {
    if (selectedAppointments.length === 0) {
      return
    }

    if (!chiefComplaint.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()
      
      // Get next token numbers
      const { data: lastVisit } = await supabase
        .from('visits')
        .select('token_number')
        .eq('visit_date', new Date().toISOString().split('T')[0])
        .order('token_number', { ascending: false })
        .limit(1)

      let nextTokenNumber = lastVisit && lastVisit.length > 0 ? lastVisit[0].token_number + 1 : 1

      // Create visits for selected appointments
      const visits = selectedAppointments.map(appointmentId => {
        const appointment = appointments.find(a => a.id === appointmentId)
        if (!appointment) return null

        const visit = {
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          appointment_id: appointmentId,
          visit_date: new Date().toISOString().split('T')[0],
          status: 'waiting' as const,
          chief_complaint: chiefComplaint,
          token_number: nextTokenNumber++,
          priority: priority,
          checked_in_at: new Date().toISOString(),
          created_by: user?.profile?.id
        }
        
        return visit
      }).filter(Boolean)

      const { error: insertError } = await supabase
        .from('visits')
        .insert(visits)

      if (insertError) throw insertError

      // Update appointment statuses
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'checked_in' })
        .in('id', selectedAppointments)

      if (updateError) throw updateError

      router.push('/receptionist/queue')

    } catch (error) {
      console.error('Error adding appointments to queue:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Add existing patient to queue
  const addPatientToQueue = async () => {
    if (!selectedPatient) {
      return
    }

    if (!selectedDoctor) {
      return
    }

    if (!chiefComplaint.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()
      
      // Get next token number
      const { data: lastVisit } = await supabase
        .from('visits')
        .select('token_number')
        .eq('visit_date', new Date().toISOString().split('T')[0])
        .order('token_number', { ascending: false })
        .limit(1)

      const nextTokenNumber = lastVisit && lastVisit.length > 0 ? lastVisit[0].token_number + 1 : 1

      const { error } = await supabase
        .from('visits')
        .insert([{
          patient_id: selectedPatient,
          doctor_id: selectedDoctor,
          visit_date: new Date().toISOString().split('T')[0],
          status: 'waiting',
          chief_complaint: chiefComplaint,
          token_number: nextTokenNumber,
          priority: priority,
          checked_in_at: new Date().toISOString(),
          created_by: user?.profile?.id
        }])

      if (error) throw error

      const selectedPatientData = patients.find(p => p.id === selectedPatient)
      router.push('/receptionist/queue')

    } catch (error) {
      console.error('Error adding patient to queue:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Register new patient and add to queue
  const registerAndAddToQueue = async () => {
    if (!newPatientForm.full_name.trim() || !newPatientForm.phone.trim()) {
      return
    }

    if (!selectedDoctor) {
      return
    }

    if (!chiefComplaint.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()
      
      // Register new patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert([{
          ...newPatientForm,
          created_by: user?.profile?.id,
          registration_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (patientError) throw patientError

      // Get next token number
      const { data: lastVisit } = await supabase
        .from('visits')
        .select('token_number')
        .eq('visit_date', new Date().toISOString().split('T')[0])
        .order('token_number', { ascending: false })
        .limit(1)

      const nextTokenNumber = lastVisit && lastVisit.length > 0 ? lastVisit[0].token_number + 1 : 1

      // Add to queue
      const { error: visitError } = await supabase
        .from('visits')
        .insert([{
          patient_id: newPatient.id,
          doctor_id: selectedDoctor,
          visit_date: new Date().toISOString().split('T')[0],
          status: 'waiting',
          chief_complaint: chiefComplaint,
          token_number: nextTokenNumber,
          priority: priority,
          checked_in_at: new Date().toISOString(),
          created_by: user?.profile?.id
        }])

      if (visitError) throw visitError

      router.push('/receptionist/queue')

    } catch (error) {
      console.error('Error registering patient:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter functions
  const filteredAppointments = appointments.filter(apt =>
    apt.patients.full_name.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
    apt.patients.phone?.includes(appointmentSearch) ||
    apt.users.full_name.toLowerCase().includes(appointmentSearch.toLowerCase())
  )

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.phone?.includes(patientSearch)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push('/receptionist/queue')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add to Queue</h1>
          <p className="text-muted-foreground text-sm">
            Add patients to today's consultation queue
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">From</span> Appointments
                {appointments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {appointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Existing</span> Patients
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                New Patient
              </TabsTrigger>
            </TabsList>

            {/* From Appointments Tab */}
            <TabsContent value="appointments" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search appointments..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {filteredAppointments.length} found
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-base font-medium mb-1">No appointments available</p>
                  <p className="text-sm">All today's appointments are in queue</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`border rounded-md p-3 cursor-pointer transition-colors ${
                        selectedAppointments.includes(appointment.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedAppointments.includes(appointment.id)) {
                          setSelectedAppointments(selectedAppointments.filter(id => id !== appointment.id))
                        } else {
                          setSelectedAppointments([...selectedAppointments, appointment.id])
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedAppointments.includes(appointment.id)}
                            onChange={() => {}}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{appointment.patients.full_name}</div>
                            <div className="text-sm text-gray-600">
                              {appointment.patients.phone} • Dr. {appointment.users.full_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.scheduled_time}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.users.department}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedAppointments.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Chief Complaint *</Label>
                      <Textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Main reason for visit..."
                        className="mt-1 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={priority}
                          onCheckedChange={(checked) => setPriority(checked as boolean)}
                        />
                        <Label className="text-sm">Priority</Label>
                      </div>
                      <Button
                        onClick={addAppointmentsToQueue}
                        disabled={submitting}
                        size="sm"
                      >
                        {submitting ? 'Adding...' : `Add ${selectedAppointments.length} to Queue`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Existing Patients Tab */}
            <TabsContent value="existing" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {filteredPatients.length} found
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Select Patient *</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                          selectedPatient === patient.id ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                        onClick={() => setSelectedPatient(patient.id)}
                      >
                        <div className="font-medium text-gray-900">{patient.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {patient.phone} {patient.email && `• ${patient.email}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Doctor *</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Chief Complaint *</Label>
                    <Textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Main reason for visit..."
                      className="mt-1 text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={priority}
                      onCheckedChange={(checked) => setPriority(checked as boolean)}
                    />
                    <Label className="text-sm">Priority</Label>
                  </div>

                  <Button
                    onClick={addPatientToQueue}
                    disabled={submitting || !selectedPatient || !selectedDoctor}
                    className="w-full"
                    size="sm"
                  >
                    {submitting ? 'Adding...' : 'Add to Queue'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* New Patient Tab */}
            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Patient Details</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Full Name *</Label>
                      <Input
                        value={newPatientForm.full_name}
                        onChange={(e) => setNewPatientForm({...newPatientForm, full_name: e.target.value})}
                        placeholder="Patient name"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Phone *</Label>
                      <Input
                        value={newPatientForm.phone}
                        onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                        placeholder="Phone number"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input
                        type="email"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})}
                        placeholder="Email address"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Gender</Label>
                      <Select 
                        value={newPatientForm.gender} 
                        onValueChange={(value) => setNewPatientForm({...newPatientForm, gender: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Date of Birth</Label>
                    <Input
                      type="date"
                      value={newPatientForm.date_of_birth}
                      onChange={(e) => setNewPatientForm({...newPatientForm, date_of_birth: e.target.value})}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Queue Details</Label>

                  <div>
                    <Label className="text-sm">Doctor *</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Chief Complaint *</Label>
                    <Textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Main reason for visit..."
                      className="mt-1 text-sm"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Address</Label>
                    <Textarea
                      value={newPatientForm.address}
                      onChange={(e) => setNewPatientForm({...newPatientForm, address: e.target.value})}
                      placeholder="Patient address"
                      className="mt-1 text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={priority}
                        onCheckedChange={(checked) => setPriority(checked as boolean)}
                      />
                      <Label className="text-sm">Priority</Label>
                    </div>

                    <Button
                      onClick={registerAndAddToQueue}
                      disabled={submitting || !newPatientForm.full_name || !newPatientForm.phone || !selectedDoctor}
                      size="sm"
                    >
                      {submitting ? 'Registering...' : 'Register & Add'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}