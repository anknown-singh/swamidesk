'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Users, 
  Calendar, 
  Bell, 
  UserCheck,
  Save,
  Phone
} from 'lucide-react'

interface ReceptionistSettings {
  id?: string
  user_id: string
  default_appointment_duration: number
  auto_assign_patient_numbers: boolean
  require_patient_phone: boolean
  require_patient_address: boolean
  appointment_reminder_enabled: boolean
  sms_notifications_enabled: boolean
  email_notifications_enabled: boolean
  queue_auto_advance: boolean
  max_walk_in_appointments: number
  registration_form_template: string
  appointment_booking_lead_time: number
  patient_search_fields: string[]
  default_payment_method: string
  working_hours_start: string
  working_hours_end: string
  break_time_start: string
  break_time_end: string
  signature: string
  created_at?: string
  updated_at?: string
}

export default function ReceptionistSettingsPage() {
  const [settings, setSettings] = useState<ReceptionistSettings>({
    user_id: '',
    default_appointment_duration: 30,
    auto_assign_patient_numbers: true,
    require_patient_phone: true,
    require_patient_address: false,
    appointment_reminder_enabled: true,
    sms_notifications_enabled: false,
    email_notifications_enabled: true,
    queue_auto_advance: false,
    max_walk_in_appointments: 10,
    registration_form_template: '',
    appointment_booking_lead_time: 15,
    patient_search_fields: ['name', 'phone', 'patient_id'],
    default_payment_method: 'cash',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    break_time_start: '13:00',
    break_time_end: '14:00',
    signature: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const tabs = [
    { id: 'queue', label: 'Queue Management', icon: Users },
    { id: 'appointments', label: 'Appointment Settings', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Professional Profile', icon: UserCheck }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ]

  const searchFields = [
    { value: 'name', label: 'Patient Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'patient_id', label: 'Patient ID' },
    { value: 'email', label: 'Email Address' },
    { value: 'address', label: 'Address' }
  ]

  useEffect(() => {
    fetchSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      // Get current user
      const userData = localStorage.getItem('swamicare_user')
      const currentUser = userData ? JSON.parse(userData) : null
      
      if (!currentUser) {
        setError('Please log in to access settings')
        return
      }

      setSettings(prev => ({ ...prev, user_id: currentUser.id }))

      const { data, error } = await supabase
        .from('receptionist_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          patient_search_fields: Array.isArray(data.patient_search_fields) ? data.patient_search_fields : prev.patient_search_fields
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const settingsData = {
        ...settings,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('receptionist_settings')
        .upsert(settingsData, { onConflict: 'user_id' })
        .select()

      if (error) throw error

      setSuccess('Settings saved successfully!')
      
      if (data && data.length > 0) {
        setSettings(prev => ({ ...prev, id: data[0].id }))
      }
    } catch (error: unknown) {
      console.error('Error saving settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSearchFieldToggle = (field: string) => {
    setSettings(prev => ({
      ...prev,
      patient_search_fields: prev.patient_search_fields.includes(field)
        ? prev.patient_search_fields.filter(f => f !== field)
        : [...prev.patient_search_fields, field]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reception Settings</h1>
          <p className="text-muted-foreground">Configure appointment booking, queue management, and patient registration preferences</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Queue Management */}
      {activeTab === 'queue' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Queue & Patient Management
            </CardTitle>
            <CardDescription>Configure queue management and patient flow settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_walk_in_appointments">Max Walk-in Appointments per Day</Label>
                <Input
                  id="max_walk_in_appointments"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.max_walk_in_appointments}
                  onChange={(e) => setSettings({...settings, max_walk_in_appointments: parseInt(e.target.value) || 10})}
                />
                <p className="text-sm text-gray-600 mt-1">Maximum number of walk-in patients allowed per day</p>
              </div>
              <div>
                <Label htmlFor="appointment_booking_lead_time">Appointment Booking Lead Time (minutes)</Label>
                <Input
                  id="appointment_booking_lead_time"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.appointment_booking_lead_time}
                  onChange={(e) => setSettings({...settings, appointment_booking_lead_time: parseInt(e.target.value) || 15})}
                />
                <p className="text-sm text-gray-600 mt-1">Minimum time required before an appointment can be booked</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-assign Patient Numbers</Label>
                  <p className="text-sm text-gray-600">Automatically assign sequential patient numbers during registration</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_assign_patient_numbers}
                  onChange={(e) => setSettings({...settings, auto_assign_patient_numbers: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Queue Auto-advance</Label>
                  <p className="text-sm text-gray-600">Automatically move to next patient when consultation is marked complete</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.queue_auto_advance}
                  onChange={(e) => setSettings({...settings, queue_auto_advance: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Patient Phone</Label>
                  <p className="text-sm text-gray-600">Make phone number mandatory during patient registration</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_patient_phone}
                  onChange={(e) => setSettings({...settings, require_patient_phone: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Patient Address</Label>
                  <p className="text-sm text-gray-600">Make address mandatory during patient registration</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_patient_address}
                  onChange={(e) => setSettings({...settings, require_patient_address: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>

            <div>
              <Label>Patient Search Fields</Label>
              <p className="text-sm text-gray-600 mb-2">Select which fields to include in patient search functionality</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {searchFields.map((field) => (
                  <label
                    key={field.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings.patient_search_fields.includes(field.value)}
                      onChange={() => handleSearchFieldToggle(field.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Settings */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment & Scheduling Settings
            </CardTitle>
            <CardDescription>Configure appointment booking and scheduling preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_appointment_duration">Default Appointment Duration (minutes)</Label>
                <Input
                  id="default_appointment_duration"
                  type="number"
                  min="15"
                  max="120"
                  step="5"
                  value={settings.default_appointment_duration}
                  onChange={(e) => setSettings({...settings, default_appointment_duration: parseInt(e.target.value) || 30})}
                />
              </div>
              <div>
                <Label htmlFor="default_payment_method">Default Payment Method</Label>
                <select
                  id="default_payment_method"
                  value={settings.default_payment_method}
                  onChange={(e) => setSettings({...settings, default_payment_method: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="working_hours_start">Reception Hours Start</Label>
                <Input
                  id="working_hours_start"
                  type="time"
                  value={settings.working_hours_start}
                  onChange={(e) => setSettings({...settings, working_hours_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="working_hours_end">Reception Hours End</Label>
                <Input
                  id="working_hours_end"
                  type="time"
                  value={settings.working_hours_end}
                  onChange={(e) => setSettings({...settings, working_hours_end: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="break_time_start">Break Time Start</Label>
                <Input
                  id="break_time_start"
                  type="time"
                  value={settings.break_time_start}
                  onChange={(e) => setSettings({...settings, break_time_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="break_time_end">Break Time End</Label>
                <Input
                  id="break_time_end"
                  type="time"
                  value={settings.break_time_end}
                  onChange={(e) => setSettings({...settings, break_time_end: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="registration_form_template">Patient Registration Form Template</Label>
              <Textarea
                id="registration_form_template"
                value={settings.registration_form_template}
                onChange={(e) => setSettings({...settings, registration_form_template: e.target.value})}
                placeholder="Standard questions or instructions for patient registration..."
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                Custom instructions or questions to include in patient registration forms
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Configure notification settings for appointments and patient updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Appointment Reminder Notifications</Label>
                  <p className="text-sm text-gray-600">Send reminders to patients about upcoming appointments</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.appointment_reminder_enabled}
                  onChange={(e) => setSettings({...settings, appointment_reminder_enabled: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Enable SMS notifications for appointment confirmations and reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms_notifications_enabled}
                  onChange={(e) => setSettings({...settings, sms_notifications_enabled: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Enable email notifications for appointments and patient updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) => setSettings({...settings, email_notifications_enabled: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Professional Profile
            </CardTitle>
            <CardDescription>Your professional information and signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signature">Digital Signature</Label>
              <Textarea
                id="signature"
                value={settings.signature}
                onChange={(e) => setSettings({...settings, signature: e.target.value})}
                placeholder="Receptionist [Your Name]\n[Clinic Name]\n[Contact Information]"
                rows={3}
              />
              <p className="text-sm text-gray-600 mt-1">
                This signature will appear on appointment confirmations and patient communications
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}