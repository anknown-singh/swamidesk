'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
 
  ClockIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  StethoscopeIcon,
  CalendarOffIcon,
  SaveIcon,
  XIcon
} from 'lucide-react'
import type { 
  DoctorAvailability, 
  DoctorLeave, 
  UserProfile,
  DoctorAvailabilityForm,
  DoctorLeaveForm 
} from '@/lib/types'

interface DoctorAvailabilityManagementProps {
  doctorId?: string
  doctors?: UserProfile[]
  onSave?: (availability: DoctorAvailabilityForm | DoctorLeaveForm) => void
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const leaveTypes = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'conference', label: 'Conference' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
]

const mockDoctors: UserProfile[] = [
  { 
    id: 'doc1', 
    role: 'doctor',
    full_name: 'Dr. Sarah Smith', 
    email: 'sarah.smith@swamidesk.com', 
    phone: '+91-9876543210',
    department: 'general',
    specialization: 'Internal Medicine',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'doc2', 
    role: 'doctor',
    full_name: 'Dr. John Brown', 
    email: 'john.brown@swamidesk.com', 
    phone: '+91-9876543211',
    department: 'cardiology',
    specialization: 'Cardiology',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'doc3', 
    role: 'doctor',
    full_name: 'Dr. Emily Davis', 
    email: 'emily.davis@swamidesk.com', 
    phone: '+91-9876543212',
    department: 'dermatology',
    specialization: 'Dermatology',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
]

const mockAvailability: DoctorAvailability[] = [
  {
    id: 'avail1',
    doctor_id: 'doc1',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    break_start_time: '13:00',
    break_end_time: '14:00',
    is_available: true,
    max_appointments: 16,
    appointment_duration: 30,
    buffer_time: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'avail2',
    doctor_id: 'doc1',
    day_of_week: 2,
    start_time: '09:00',
    end_time: '17:00',
    break_start_time: '13:00',
    break_end_time: '14:00',
    is_available: true,
    max_appointments: 16,
    appointment_duration: 30,
    buffer_time: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
]

const mockLeaves: DoctorLeave[] = [
  {
    id: 'leave1',
    doctor_id: 'doc1',
    leave_type: 'vacation',
    start_date: '2024-12-25',
    end_date: '2024-12-31',
    reason: 'Year-end vacation',
    is_recurring: false,
    approved: true,
    approved_by: 'admin1',
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function DoctorAvailabilityManagement({
  doctorId,
  doctors = mockDoctors,
  onSave
}: DoctorAvailabilityManagementProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || doctors[0]?.id || '')
  const [availability, setAvailability] = useState<DoctorAvailability[]>(mockAvailability)
  const [leaves, setLeaves] = useState<DoctorLeave[]>(mockLeaves)
  const [activeTab, setActiveTab] = useState<'schedule' | 'leave'>('schedule')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  // Form states
  const [availabilityForm, setAvailabilityForm] = useState<DoctorAvailabilityForm>({
    doctor_id: selectedDoctorId,
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    appointment_duration: 30,
    buffer_time: 5
  })

  const [leaveForm, setLeaveForm] = useState<DoctorLeaveForm>({
    doctor_id: selectedDoctorId,
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    is_recurring: false
  })

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)
  const doctorAvailability = availability.filter(a => a.doctor_id === selectedDoctorId)
  const doctorLeaves = leaves.filter(l => l.doctor_id === selectedDoctorId)

  const handleAvailabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingItem) {
      // Update existing
      setAvailability(prev => prev.map(item => 
        item.id === editingItem 
          ? { ...item, ...availabilityForm, updated_at: new Date().toISOString() }
          : item
      ))
    } else {
      // Add new
      const newAvailability: DoctorAvailability = {
        id: `avail_${Date.now()}`,
        ...availabilityForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setAvailability(prev => [...prev, newAvailability])
    }

    onSave?.(availabilityForm)
    setShowAddForm(false)
    setEditingItem(null)
    resetAvailabilityForm()
  }

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingItem) {
      // Update existing
      setLeaves(prev => prev.map(item => 
        item.id === editingItem 
          ? { ...item, ...leaveForm, updated_at: new Date().toISOString() }
          : item
      ))
    } else {
      // Add new
      const newLeave: DoctorLeave = {
        id: `leave_${Date.now()}`,
        ...leaveForm,
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setLeaves(prev => [...prev, newLeave])
    }

    onSave?.(leaveForm)
    setShowAddForm(false)
    setEditingItem(null)
    resetLeaveForm()
  }

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      doctor_id: selectedDoctorId,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      appointment_duration: 30,
      buffer_time: 5
    })
  }

  const resetLeaveForm = () => {
    setLeaveForm({
      doctor_id: selectedDoctorId,
      leave_type: 'vacation',
      start_date: '',
      end_date: '',
      is_recurring: false
    })
  }

  const handleEdit = (item: DoctorAvailability | DoctorLeave) => {
    setEditingItem(item.id)
    setShowAddForm(true)
    
    if ('day_of_week' in item) {
      // It's availability
      setAvailabilityForm({
        doctor_id: item.doctor_id,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        break_start_time: item.break_start_time,
        break_end_time: item.break_end_time,
        is_available: item.is_available,
        max_appointments: item.max_appointments,
        appointment_duration: item.appointment_duration,
        buffer_time: item.buffer_time
      })
    } else {
      // It's leave
      setLeaveForm({
        doctor_id: item.doctor_id,
        leave_type: item.leave_type,
        start_date: item.start_date,
        end_date: item.end_date,
        start_time: item.start_time,
        end_time: item.end_time,
        reason: item.reason,
        is_recurring: item.is_recurring
      })
    }
  }

  const handleDelete = (id: string, type: 'availability' | 'leave') => {
    if (type === 'availability') {
      setAvailability(prev => prev.filter(item => item.id !== id))
    } else {
      setLeaves(prev => prev.filter(item => item.id !== id))
    }
  }

  const getDayName = (dayOfWeek: number) => {
    return daysOfWeek.find(d => d.value === dayOfWeek)?.label || 'Unknown'
  }

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypes.find(t => t.value === type)?.label || type
  }

  const getLeaveStatusColor = (leave: DoctorLeave) => {
    if (leave.approved) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Doctor Availability</h2>
          <p className="text-muted-foreground">Manage doctor schedules and leave requests</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add {activeTab === 'schedule' ? 'Schedule' : 'Leave'}
        </Button>
      </div>

      {/* Doctor Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Select Doctor:</Label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="w-64">
                <StethoscopeIcon className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div>
                      <div className="font-medium">{doctor.full_name}</div>
                      <div className="text-sm text-muted-foreground">{doctor.specialization}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('schedule')}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Schedule
        </Button>
        <Button
          variant={activeTab === 'leave' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('leave')}
        >
          <CalendarOffIcon className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'schedule' ? 'Schedule' : 'Leave'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'schedule' ? (
              <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="day_of_week">Day of Week *</Label>
                    <Select 
                      value={availabilityForm.day_of_week?.toString()} 
                      onValueChange={(value) => setAvailabilityForm({...availabilityForm, day_of_week: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_available"
                      checked={availabilityForm.is_available}
                      onCheckedChange={(checked) => setAvailabilityForm({...availabilityForm, is_available: !!checked})}
                    />
                    <Label htmlFor="is_available">Available</Label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={availabilityForm.start_time}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={availabilityForm.end_time}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="break_start_time">Break Start</Label>
                    <Input
                      id="break_start_time"
                      type="time"
                      value={availabilityForm.break_start_time || ''}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, break_start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="break_end_time">Break End</Label>
                    <Input
                      id="break_end_time"
                      type="time"
                      value={availabilityForm.break_end_time || ''}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, break_end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="appointment_duration">Appointment Duration (min) *</Label>
                    <Input
                      id="appointment_duration"
                      type="number"
                      value={availabilityForm.appointment_duration}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, appointment_duration: parseInt(e.target.value)})}
                      required
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buffer_time">Buffer Time (min) *</Label>
                    <Input
                      id="buffer_time"
                      type="number"
                      value={availabilityForm.buffer_time}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, buffer_time: parseInt(e.target.value)})}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_appointments">Max Appointments</Label>
                    <Input
                      id="max_appointments"
                      type="number"
                      value={availabilityForm.max_appointments || ''}
                      onChange={(e) => setAvailabilityForm({...availabilityForm, max_appointments: parseInt(e.target.value) || undefined})}
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update' : 'Add'} Schedule
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false)
                    setEditingItem(null)
                    resetAvailabilityForm()
                  }}>
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="leave_type">Leave Type *</Label>
                    <Select 
                      value={leaveForm.leave_type} 
                      onValueChange={(value: string) => setLeaveForm({...leaveForm, leave_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_recurring"
                      checked={leaveForm.is_recurring}
                      onCheckedChange={(checked) => setLeaveForm({...leaveForm, is_recurring: !!checked})}
                    />
                    <Label htmlFor="is_recurring">Recurring</Label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="start_time">Start Time (optional)</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={leaveForm.start_time || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time (optional)</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={leaveForm.end_time || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={leaveForm.reason || ''}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    placeholder="Brief reason for leave..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update' : 'Add'} Leave
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false)
                    setEditingItem(null)
                    resetLeaveForm()
                  }}>
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'schedule' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Weekly Schedule - {selectedDoctor?.full_name}
            </CardTitle>
            <CardDescription>
              Manage weekly availability and working hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctorAvailability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No schedule configured for this doctor
                </div>
              ) : (
                doctorAvailability.map((avail) => (
                  <div key={avail.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <h3 className="font-medium">{getDayName(avail.day_of_week)}</h3>
                        <Badge variant={avail.is_available ? 'default' : 'secondary'}>
                          {avail.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {avail.start_time} - {avail.end_time}
                        {avail.break_start_time && avail.break_end_time && (
                          ` • Break: ${avail.break_start_time} - ${avail.break_end_time}`
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {avail.appointment_duration}min appointments • {avail.buffer_time}min buffer
                        {avail.max_appointments && ` • Max: ${avail.max_appointments} appointments`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(avail)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(avail.id, 'availability')}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarOffIcon className="h-5 w-5" />
              Leave Requests - {selectedDoctor?.full_name}
            </CardTitle>
            <CardDescription>
              Manage leave requests and time off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctorLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leave requests for this doctor
                </div>
              ) : (
                doctorLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <h3 className="font-medium">{getLeaveTypeLabel(leave.leave_type)}</h3>
                        <Badge className={getLeaveStatusColor(leave)}>
                          {leave.approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        {leave.start_time && leave.end_time && (
                          ` • ${leave.start_time} - ${leave.end_time}`
                        )}
                      </div>
                      {leave.reason && (
                        <div className="text-sm text-muted-foreground">
                          {leave.reason}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(leave)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(leave.id, 'leave')}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}