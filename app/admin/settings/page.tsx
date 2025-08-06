'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Building, Clock, Bell, Palette } from 'lucide-react'

interface ClinicSettings {
  id?: string
  clinic_name: string
  clinic_address: string
  clinic_phone: string
  clinic_email: string
  clinic_website: string
  clinic_logo: string
  working_hours_start: string
  working_hours_end: string
  working_days: string[]
  appointment_duration: number
  max_appointments_per_day: number
  notification_email: boolean
  notification_sms: boolean
  auto_backup: boolean
  theme_color: string
  currency: string
  timezone: string
  created_at?: string
  updated_at?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings>({
    clinic_name: '',
    clinic_address: '',
    clinic_phone: '',
    clinic_email: '',
    clinic_website: '',
    clinic_logo: '',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    appointment_duration: 30,
    max_appointments_per_day: 50,
    notification_email: true,
    notification_sms: false,
    auto_backup: true,
    theme_color: '#3b82f6',
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  // const router = useRouter()

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Settings }
  ]

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  const timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles'
  ]

  const currencies = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'AED', label: 'UAE Dirham (AED)' }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSettings({
          ...settings,
          ...data,
          working_days: Array.isArray(data.working_days) ? data.working_days : []
        })
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

      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const currentUser = userData ? JSON.parse(userData) : null

      const settingsData = {
        ...settings,
        updated_by: currentUser?.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('clinic_settings')
        .upsert(settingsData, { onConflict: 'id' })
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

  const handleWorkingDayToggle = (day: string) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
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
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure clinic settings and preferences</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
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

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Clinic Information
            </CardTitle>
            <CardDescription>Basic clinic details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_name">Clinic Name *</Label>
                <Input
                  id="clinic_name"
                  value={settings.clinic_name}
                  onChange={(e) => setSettings({...settings, clinic_name: e.target.value})}
                  placeholder="Your Clinic Name"
                />
              </div>
              <div>
                <Label htmlFor="clinic_phone">Phone Number</Label>
                <Input
                  id="clinic_phone"
                  value={settings.clinic_phone}
                  onChange={(e) => setSettings({...settings, clinic_phone: e.target.value})}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_email">Email Address</Label>
                <Input
                  id="clinic_email"
                  type="email"
                  value={settings.clinic_email}
                  onChange={(e) => setSettings({...settings, clinic_email: e.target.value})}
                  placeholder="clinic@example.com"
                />
              </div>
              <div>
                <Label htmlFor="clinic_website">Website</Label>
                <Input
                  id="clinic_website"
                  value={settings.clinic_website}
                  onChange={(e) => setSettings({...settings, clinic_website: e.target.value})}
                  placeholder="https://www.yourclinic.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinic_address">Address</Label>
              <textarea
                id="clinic_address"
                value={settings.clinic_address}
                onChange={(e) => setSettings({...settings, clinic_address: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md h-20"
                placeholder="Full clinic address..."
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
              Working Hours & Schedule
            </CardTitle>
            <CardDescription>Configure working hours and appointment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="working_hours_start">Opening Time</Label>
                <Input
                  id="working_hours_start"
                  type="time"
                  value={settings.working_hours_start}
                  onChange={(e) => setSettings({...settings, working_hours_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="working_hours_end">Closing Time</Label>
                <Input
                  id="working_hours_end"
                  type="time"
                  value={settings.working_hours_end}
                  onChange={(e) => setSettings({...settings, working_hours_end: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Working Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {weekDays.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings.working_days.includes(day.value)}
                      onChange={() => handleWorkingDayToggle(day.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_duration">Default Appointment Duration (minutes)</Label>
                <Input
                  id="appointment_duration"
                  type="number"
                  value={settings.appointment_duration}
                  onChange={(e) => setSettings({...settings, appointment_duration: parseInt(e.target.value) || 30})}
                  min="15"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="max_appointments_per_day">Max Appointments Per Day</Label>
                <Input
                  id="max_appointments_per_day"
                  type="number"
                  value={settings.max_appointments_per_day}
                  onChange={(e) => setSettings({...settings, max_appointments_per_day: parseInt(e.target.value) || 50})}
                  min="10"
                  max="200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Configure notification settings for appointments and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Send email notifications for appointments and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_email}
                  onChange={(e) => setSettings({...settings, notification_email: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Send SMS notifications for appointments (requires SMS service)</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_sms}
                  onChange={(e) => setSettings({...settings, notification_sms: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance & Branding
            </CardTitle>
            <CardDescription>Customize the look and feel of your clinic system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme_color">Primary Theme Color</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="theme_color"
                  type="color"
                  value={settings.theme_color}
                  onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.theme_color}
                  onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinic_logo">Clinic Logo URL</Label>
              <Input
                id="clinic_logo"
                value={settings.clinic_logo}
                onChange={(e) => setSettings({...settings, clinic_logo: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload your logo to a cloud service and paste the URL here
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>System-wide settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {timezones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic Backup</Label>
                  <p className="text-sm text-gray-600">Enable automatic daily backups of clinic data</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_backup}
                  onChange={(e) => setSettings({...settings, auto_backup: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {saving ? 'Saving Changes...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}