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
  Clipboard, 
  Bell, 
  UserCog,
  Save,
  Activity,
  Timer
} from 'lucide-react'

interface AttendantSettings {
  id?: string
  user_id: string
  default_procedure_duration: number
  auto_complete_procedures: boolean
  require_procedure_notes: boolean
  enable_procedure_reminders: boolean
  notification_new_procedures: boolean
  notification_overdue_procedures: boolean
  queue_sorting_preference: string
  max_concurrent_procedures: number
  working_hours_start: string
  working_hours_end: string
  break_time_start: string
  break_time_end: string
  procedure_templates: string
  equipment_check_required: boolean
  sterilization_check_required: boolean
  patient_consent_required: boolean
  signature: string
  created_at?: string
  updated_at?: string
}

export default function AttendantSettingsPage() {
  const [settings, setSettings] = useState<AttendantSettings>({
    user_id: '',
    default_procedure_duration: 45,
    auto_complete_procedures: false,
    require_procedure_notes: true,
    enable_procedure_reminders: true,
    notification_new_procedures: true,
    notification_overdue_procedures: true,
    queue_sorting_preference: 'priority',
    max_concurrent_procedures: 3,
    working_hours_start: '08:30',
    working_hours_end: '17:30',
    break_time_start: '13:00',
    break_time_end: '14:00',
    procedure_templates: '',
    equipment_check_required: true,
    sterilization_check_required: true,
    patient_consent_required: true,
    signature: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('procedures')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const tabs = [
    { id: 'procedures', label: 'Procedure Settings', icon: Clipboard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'safety', label: 'Safety Protocols', icon: Activity },
    { id: 'profile', label: 'Professional Profile', icon: UserCog }
  ]

  const queueSortingOptions = [
    { value: 'priority', label: 'Priority Order' },
    { value: 'appointment_time', label: 'Appointment Time' },
    { value: 'duration', label: 'Procedure Duration' },
    { value: 'patient_arrival', label: 'Patient Arrival Time' }
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
        .from('attendant_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data
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
        .from('attendant_settings')
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
          <h1 className="text-3xl font-bold tracking-tight">Service Attendant Settings</h1>
          <p className="text-muted-foreground">Configure procedure execution, safety protocols, and workflow preferences</p>
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

      {/* Procedure Settings */}
      {activeTab === 'procedures' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              Procedure Execution Settings
            </CardTitle>
            <CardDescription>Configure procedure workflow and queue management preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_procedure_duration">Default Procedure Duration (minutes)</Label>
                <Input
                  id="default_procedure_duration"
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={settings.default_procedure_duration}
                  onChange={(e) => setSettings({...settings, default_procedure_duration: parseInt(e.target.value) || 45})}
                />
                <p className="text-sm text-gray-600 mt-1">Default time allocation for procedures</p>
              </div>
              <div>
                <Label htmlFor="max_concurrent_procedures">Max Concurrent Procedures</Label>
                <Input
                  id="max_concurrent_procedures"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_concurrent_procedures}
                  onChange={(e) => setSettings({...settings, max_concurrent_procedures: parseInt(e.target.value) || 3})}
                />
                <p className="text-sm text-gray-600 mt-1">Maximum procedures you can handle simultaneously</p>
              </div>
            </div>

            <div>
              <Label htmlFor="queue_sorting_preference">Queue Sorting Preference</Label>
              <select
                id="queue_sorting_preference"
                value={settings.queue_sorting_preference}
                onChange={(e) => setSettings({...settings, queue_sorting_preference: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {queueSortingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">How you prefer your procedure queue to be sorted</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="working_hours_start">Service Hours Start</Label>
                <Input
                  id="working_hours_start"
                  type="time"
                  value={settings.working_hours_start}
                  onChange={(e) => setSettings({...settings, working_hours_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="working_hours_end">Service Hours End</Label>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-complete Procedures</Label>
                  <p className="text-sm text-gray-600">Automatically mark procedures as complete when duration expires</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_complete_procedures}
                  onChange={(e) => setSettings({...settings, auto_complete_procedures: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Procedure Notes</Label>
                  <p className="text-sm text-gray-600">Make procedure notes mandatory before completion</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_procedure_notes}
                  onChange={(e) => setSettings({...settings, require_procedure_notes: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Procedure Reminders</Label>
                  <p className="text-sm text-gray-600">Get reminders for upcoming and overdue procedures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_procedure_reminders}
                  onChange={(e) => setSettings({...settings, enable_procedure_reminders: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="procedure_templates">Standard Procedure Templates</Label>
              <Textarea
                id="procedure_templates"
                value={settings.procedure_templates}
                onChange={(e) => setSettings({...settings, procedure_templates: e.target.value})}
                placeholder="Standard procedure steps and checklists...\n\nExample:\n- Pre-procedure safety check\n- Equipment verification\n- Patient consent confirmation\n- Procedure execution\n- Post-procedure monitoring\n- Documentation completion"
                rows={6}
              />
              <p className="text-sm text-gray-600 mt-1">
                Standard templates and checklists for common procedures
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
            <CardDescription>Configure notification settings for procedure management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Procedure Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified when new procedures are assigned to you</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_new_procedures}
                  onChange={(e) => setSettings({...settings, notification_new_procedures: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Overdue Procedure Alerts</Label>
                  <p className="text-sm text-gray-600">Get alerted about procedures that are running behind schedule</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_overdue_procedures}
                  onChange={(e) => setSettings({...settings, notification_overdue_procedures: e.target.checked})}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Protocols */}
      {activeTab === 'safety' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Safety Protocols & Compliance
            </CardTitle>
            <CardDescription>Configure safety and compliance requirements for procedures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Equipment Check Required</Label>
                  <p className="text-sm text-gray-600">Require equipment verification before starting procedures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.equipment_check_required}
                  onChange={(e) => setSettings({...settings, equipment_check_required: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sterilization Check Required</Label>
                  <p className="text-sm text-gray-600">Require sterilization verification before procedures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sterilization_check_required}
                  onChange={(e) => setSettings({...settings, sterilization_check_required: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Patient Consent Required</Label>
                  <p className="text-sm text-gray-600">Require patient consent confirmation before procedures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.patient_consent_required}
                  onChange={(e) => setSettings({...settings, patient_consent_required: e.target.checked})}
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
              <UserCog className="h-5 w-5" />
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
                placeholder="Service Attendant [Your Name]\n[Certification/License Number]\n[Clinic Name]"
                rows={3}
              />
              <p className="text-sm text-gray-600 mt-1">
                This signature will appear on procedure completion reports and documentation
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}