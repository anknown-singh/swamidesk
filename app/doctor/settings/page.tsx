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
  User, 
  Clock, 
  FileText, 
  Bell, 
  Stethoscope,
  Save
} from 'lucide-react'

interface DoctorSettings {
  id?: string
  user_id: string
  specialization: string
  consultation_fee: number
  consultation_duration: number
  prescription_template: string
  consultation_notes_template: string
  notification_appointments: boolean
  notification_emergencies: boolean
  auto_save_consultations: boolean
  signature: string
  qualifications: string
  experience_years: number
  languages_spoken: string[]
  preferred_appointment_types: string[]
  working_hours_start: string
  working_hours_end: string
  break_time_start: string
  break_time_end: string
  created_at?: string
  updated_at?: string
}

export default function DoctorSettingsPage() {
  const [settings, setSettings] = useState<DoctorSettings>({
    user_id: '',
    specialization: '',
    consultation_fee: 500,
    consultation_duration: 30,
    prescription_template: '',
    consultation_notes_template: '',
    notification_appointments: true,
    notification_emergencies: true,
    auto_save_consultations: true,
    signature: '',
    qualifications: '',
    experience_years: 0,
    languages_spoken: ['English', 'Hindi'],
    preferred_appointment_types: ['consultation', 'follow-up'],
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    break_time_start: '13:00',
    break_time_end: '14:00'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const tabs = [
    { id: 'profile', label: 'Professional Profile', icon: User },
    { id: 'consultation', label: 'Consultation Settings', icon: Stethoscope },
    { id: 'schedule', label: 'Schedule & Availability', icon: Clock },
    { id: 'templates', label: 'Templates & Notes', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow-up', label: 'Follow-up Visit' },
    { value: 'emergency', label: 'Emergency Consultation' },
    { value: 'procedure', label: 'Procedure/Treatment' },
    { value: 'checkup', label: 'Routine Checkup' }
  ]

  const commonLanguages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 
    'Urdu', 'Kannada', 'Punjabi', 'Malayalam', 'Arabic'
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
        .from('doctor_settings')
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
          languages_spoken: Array.isArray(data.languages_spoken) ? data.languages_spoken : prev.languages_spoken,
          preferred_appointment_types: Array.isArray(data.preferred_appointment_types) ? data.preferred_appointment_types : prev.preferred_appointment_types
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
        .from('doctor_settings')
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

  const handleLanguageToggle = (language: string) => {
    setSettings(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(language)
        ? prev.languages_spoken.filter(l => l !== language)
        : [...prev.languages_spoken, language]
    }))
  }

  const handleAppointmentTypeToggle = (type: string) => {
    setSettings(prev => ({
      ...prev,
      preferred_appointment_types: prev.preferred_appointment_types.includes(type)
        ? prev.preferred_appointment_types.filter(t => t !== type)
        : [...prev.preferred_appointment_types, type]
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
          <h1 className="text-3xl font-bold tracking-tight">Doctor Settings</h1>
          <p className="text-muted-foreground">Configure your professional preferences and consultation settings</p>
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

      {/* Professional Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Professional Profile
            </CardTitle>
            <CardDescription>Your professional information and qualifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={settings.specialization}
                  onChange={(e) => setSettings({...settings, specialization: e.target.value})}
                  placeholder="e.g., General Medicine, Cardiology"
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={settings.experience_years}
                  onChange={(e) => setSettings({...settings, experience_years: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications & Degrees</Label>
              <Textarea
                id="qualifications"
                value={settings.qualifications}
                onChange={(e) => setSettings({...settings, qualifications: e.target.value})}
                placeholder="e.g., MBBS, MD (Internal Medicine), Fellowship in Cardiology"
                rows={3}
              />
            </div>

            <div>
              <Label>Languages Spoken</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {commonLanguages.map((language) => (
                  <label
                    key={language}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings.languages_spoken.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="rounded"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature</Label>
              <Textarea
                id="signature"
                value={settings.signature}
                onChange={(e) => setSettings({...settings, signature: e.target.value})}
                placeholder="Dr. [Your Name], [Qualifications]"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation Settings */}
      {activeTab === 'consultation' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Consultation Settings
            </CardTitle>
            <CardDescription>Configure your consultation preferences and fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  min="0"
                  step="50"
                  value={settings.consultation_fee}
                  onChange={(e) => setSettings({...settings, consultation_fee: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="consultation_duration">Default Consultation Duration (minutes)</Label>
                <Input
                  id="consultation_duration"
                  type="number"
                  min="15"
                  max="120"
                  step="5"
                  value={settings.consultation_duration}
                  onChange={(e) => setSettings({...settings, consultation_duration: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>

            <div>
              <Label>Preferred Appointment Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {appointmentTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings.preferred_appointment_types.includes(type.value)}
                      onChange={() => handleAppointmentTypeToggle(type.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Consultations</Label>
                <p className="text-sm text-gray-600">Automatically save consultation notes as you type</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_save_consultations}
                onChange={(e) => setSettings({...settings, auto_save_consultations: e.target.checked})}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Settings */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule & Availability
            </CardTitle>
            <CardDescription>Configure your working hours and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="working_hours_start">Working Hours Start</Label>
                <Input
                  id="working_hours_start"
                  type="time"
                  value={settings.working_hours_start}
                  onChange={(e) => setSettings({...settings, working_hours_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="working_hours_end">Working Hours End</Label>
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
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates & Notes
            </CardTitle>
            <CardDescription>Create templates for prescriptions and consultation notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prescription_template">Prescription Template</Label>
              <Textarea
                id="prescription_template"
                value={settings.prescription_template}
                onChange={(e) => setSettings({...settings, prescription_template: e.target.value})}
                placeholder="Standard prescription format and instructions..."
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                Create a default template for your prescriptions
              </p>
            </div>

            <div>
              <Label htmlFor="consultation_notes_template">Consultation Notes Template</Label>
              <Textarea
                id="consultation_notes_template"
                value={settings.consultation_notes_template}
                onChange={(e) => setSettings({...settings, consultation_notes_template: e.target.value})}
                placeholder="Chief Complaint: &#10;History: &#10;Examination: &#10;Diagnosis: &#10;Treatment Plan:"
                rows={6}
              />
              <p className="text-sm text-gray-600 mt-1">
                Standard format for consultation notes
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
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Appointment Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about upcoming appointments</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_appointments}
                  onChange={(e) => setSettings({...settings, notification_appointments: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Emergency Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about emergency consultations</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_emergencies}
                  onChange={(e) => setSettings({...settings, notification_emergencies: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}