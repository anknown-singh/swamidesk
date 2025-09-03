'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Plus, X, Calendar, Clock } from 'lucide-react'

interface TreatmentSession {
  id: string
  date: string
  time: string
  duration: number
  sessionType: string
  location: string
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
}

interface SessionSchedulingFormProps {
  treatmentId: string
  onNext: () => void
  onPrevious: () => void
}

export function SessionSchedulingForm({ treatmentId, onNext, onPrevious }: SessionSchedulingFormProps) {
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [scheduleType, setScheduleType] = useState<'manual' | 'recurring'>('manual')
  const [recurringSettings, setRecurringSettings] = useState({
    frequency: 'weekly',
    numberOfSessions: 8,
    startDate: '',
    time: '',
    duration: 60,
    sessionType: '',
    location: '',
    daysOfWeek: []
  })
  const [newSession, setNewSession] = useState({
    date: '',
    time: '',
    duration: 60,
    sessionType: '',
    location: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const sessionTypes = [
    'Initial Assessment',
    'Individual Therapy',
    'Group Therapy',
    'Follow-up Session',
    'Progress Evaluation',
    'Family Session',
    'Maintenance Session',
    'Discharge Planning'
  ]

  const locations = [
    'Clinic Room 1',
    'Clinic Room 2',
    'Therapy Room',
    'Group Room',
    'Telehealth',
    'Patient Home',
    'Community Center',
    'Hospital Ward'
  ]

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ]

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  const addManualSession = () => {
    if (!newSession.date || !newSession.time || !newSession.sessionType) return

    const session: TreatmentSession = {
      id: Date.now().toString(),
      date: newSession.date,
      time: newSession.time,
      duration: newSession.duration,
      sessionType: newSession.sessionType,
      location: newSession.location,
      notes: newSession.notes,
      status: 'scheduled'
    }

    setSessions(prev => [...prev, session].sort((a, b) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    ))

    setNewSession({
      date: '',
      time: '',
      duration: 60,
      sessionType: '',
      location: '',
      notes: ''
    })
  }

  const generateRecurringSessions = () => {
    if (!recurringSettings.startDate || !recurringSettings.time || !recurringSettings.sessionType) return

    const startDate = new Date(recurringSettings.startDate)
    const generatedSessions: TreatmentSession[] = []

    for (let i = 0; i < recurringSettings.numberOfSessions; i++) {
      const sessionDate = new Date(startDate)

      if (recurringSettings.frequency === 'daily') {
        sessionDate.setDate(startDate.getDate() + i)
      } else if (recurringSettings.frequency === 'weekly') {
        sessionDate.setDate(startDate.getDate() + (i * 7))
      } else if (recurringSettings.frequency === 'bi-weekly') {
        sessionDate.setDate(startDate.getDate() + (i * 14))
      }

      const session: TreatmentSession = {
        id: `recurring-${i}-${Date.now()}`,
        date: sessionDate.toISOString().split('T')[0],
        time: recurringSettings.time,
        duration: recurringSettings.duration,
        sessionType: recurringSettings.sessionType,
        location: recurringSettings.location,
        notes: `Session ${i + 1} of ${recurringSettings.numberOfSessions}`,
        status: 'scheduled'
      }

      generatedSessions.push(session)
    }

    setSessions(prev => [...prev, ...generatedSessions].sort((a, b) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    ))
  }

  const removeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId))
  }

  const handleSubmit = async () => {
    if (sessions.length === 0) return

    setSaving(true)
    
    try {
      // Simulate API call to save session schedule
      console.log('Saving treatment sessions:', sessions)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving treatment sessions:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Schedule Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Scheduling
          </CardTitle>
          <CardDescription>
            Schedule treatment sessions for this patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={scheduleType === 'manual' ? 'default' : 'outline'}
              onClick={() => setScheduleType('manual')}
            >
              Manual Scheduling
            </Button>
            <Button
              variant={scheduleType === 'recurring' ? 'default' : 'outline'}
              onClick={() => setScheduleType('recurring')}
            >
              Recurring Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Session Scheduling */}
      {scheduleType === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Individual Session</CardTitle>
            <CardDescription>
              Schedule sessions one at a time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDate">Date *</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTime">Time *</Label>
                <Select 
                  value={newSession.time} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Duration (minutes)</Label>
                <Select 
                  value={newSession.duration.toString()} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select 
                  value={newSession.sessionType} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, sessionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionLocation">Location</Label>
                <Select 
                  value={newSession.location} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionNotes">Session Notes</Label>
              <Input
                id="sessionNotes"
                placeholder="Any specific notes or instructions for this session"
                value={newSession.notes}
                onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Button 
              onClick={addManualSession}
              disabled={!newSession.date || !newSession.time || !newSession.sessionType}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recurring Session Scheduling */}
      {scheduleType === 'recurring' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Recurring Schedule</CardTitle>
            <CardDescription>
              Create multiple sessions with a regular pattern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={recurringSettings.frequency} 
                  onValueChange={(value) => 
                    setRecurringSettings(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfSessions">Number of Sessions</Label>
                <Input
                  id="numberOfSessions"
                  type="number"
                  min="1"
                  max="20"
                  value={recurringSettings.numberOfSessions}
                  onChange={(e) => setRecurringSettings(prev => ({ 
                    ...prev, 
                    numberOfSessions: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={recurringSettings.startDate}
                  onChange={(e) => setRecurringSettings(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurringTime">Time</Label>
                <Select 
                  value={recurringSettings.time} 
                  onValueChange={(value) => setRecurringSettings(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurringDuration">Duration</Label>
                <Select 
                  value={recurringSettings.duration.toString()} 
                  onValueChange={(value) => setRecurringSettings(prev => ({ 
                    ...prev, 
                    duration: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurringSessionType">Session Type</Label>
                <Select 
                  value={recurringSettings.sessionType} 
                  onValueChange={(value) => setRecurringSettings(prev => ({ ...prev, sessionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurringLocation">Location</Label>
                <Select 
                  value={recurringSettings.location} 
                  onValueChange={(value) => setRecurringSettings(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateRecurringSessions}
              disabled={!recurringSettings.startDate || !recurringSettings.time || !recurringSettings.sessionType}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate {recurringSettings.numberOfSessions} Sessions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Sessions List */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scheduled Sessions ({sessions.length})</span>
              <Badge variant="secondary">
                Total: {sessions.reduce((total, session) => total + session.duration, 0)} min
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and modify scheduled sessions as needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session, index) => (
              <div key={session.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Session {index + 1}</Badge>
                    <span className="font-medium">{session.sessionType}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.time} ({session.duration} min)
                  </div>
                  <div>Location: {session.location || 'TBD'}</div>
                  <div>Status: {session.status}</div>
                </div>
                
                {session.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Notes: {session.notes}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous: Goals Setting
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={sessions.length === 0 || saving}
        >
          {saving ? 'Saving...' : 'Next: Progress Tracking'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}