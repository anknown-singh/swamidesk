'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Bell, 
  Shield,
  Save,
  Pill
} from 'lucide-react'

interface PharmacistSettings {
  id?: string
  user_id: string
  low_stock_threshold: number
  critical_stock_threshold: number
  auto_reorder_enabled: boolean
  expiry_warning_days: number
  prescription_verification_required: boolean
  dispensing_notes_required: boolean
  patient_counseling_enabled: boolean
  drug_interaction_alerts: boolean
  allergy_check_enabled: boolean
  notification_stock_alerts: boolean
  notification_expiry_alerts: boolean
  notification_prescriptions: boolean
  default_dispensing_instructions: string
  signature: string
  license_number: string
  created_at?: string
  updated_at?: string
}

export default function PharmacySettingsPage() {
  const [settings, setSettings] = useState<PharmacistSettings>({
    user_id: '',
    low_stock_threshold: 10,
    critical_stock_threshold: 5,
    auto_reorder_enabled: false,
    expiry_warning_days: 30,
    prescription_verification_required: true,
    dispensing_notes_required: true,
    patient_counseling_enabled: true,
    drug_interaction_alerts: true,
    allergy_check_enabled: true,
    notification_stock_alerts: true,
    notification_expiry_alerts: true,
    notification_prescriptions: true,
    default_dispensing_instructions: '',
    signature: '',
    license_number: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const tabs = [
    { id: 'inventory', label: 'Inventory Settings', icon: Package },
    { id: 'safety', label: 'Safety & Compliance', icon: Shield },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
    { id: 'profile', label: 'Professional Profile', icon: Pill }
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
        .from('pharmacist_settings')
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
        .from('pharmacist_settings')
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
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Settings</h1>
          <p className="text-muted-foreground">Configure inventory, safety protocols, and dispensing preferences</p>
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

      {/* Inventory Settings */}
      {activeTab === 'inventory' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Management
            </CardTitle>
            <CardDescription>Configure stock thresholds and inventory alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="1"
                  value={settings.low_stock_threshold}
                  onChange={(e) => setSettings({...settings, low_stock_threshold: parseInt(e.target.value) || 10})}
                />
                <p className="text-sm text-gray-600 mt-1">Show warning when stock falls below this number</p>
              </div>
              <div>
                <Label htmlFor="critical_stock_threshold">Critical Stock Threshold</Label>
                <Input
                  id="critical_stock_threshold"
                  type="number"
                  min="1"
                  value={settings.critical_stock_threshold}
                  onChange={(e) => setSettings({...settings, critical_stock_threshold: parseInt(e.target.value) || 5})}
                />
                <p className="text-sm text-gray-600 mt-1">Show critical alert when stock falls below this number</p>
              </div>
            </div>

            <div>
              <Label htmlFor="expiry_warning_days">Expiry Warning Period (days)</Label>
              <Input
                id="expiry_warning_days"
                type="number"
                min="1"
                max="365"
                value={settings.expiry_warning_days}
                onChange={(e) => setSettings({...settings, expiry_warning_days: parseInt(e.target.value) || 30})}
                className="max-w-xs"
              />
              <p className="text-sm text-gray-600 mt-1">Show expiry warnings this many days before medicines expire</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Reorder System</Label>
                <p className="text-sm text-gray-600">Automatically create purchase orders when stock is low</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_reorder_enabled}
                onChange={(e) => setSettings({...settings, auto_reorder_enabled: e.target.checked})}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety & Compliance */}
      {activeTab === 'safety' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety & Compliance
            </CardTitle>
            <CardDescription>Patient safety and regulatory compliance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prescription Verification Required</Label>
                  <p className="text-sm text-gray-600">Require verification of prescription before dispensing</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.prescription_verification_required}
                  onChange={(e) => setSettings({...settings, prescription_verification_required: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Dispensing Notes Required</Label>
                  <p className="text-sm text-gray-600">Require notes when dispensing medicines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dispensing_notes_required}
                  onChange={(e) => setSettings({...settings, dispensing_notes_required: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Patient Counseling</Label>
                  <p className="text-sm text-gray-600">Enable patient counseling protocols</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.patient_counseling_enabled}
                  onChange={(e) => setSettings({...settings, patient_counseling_enabled: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Drug Interaction Alerts</Label>
                  <p className="text-sm text-gray-600">Show alerts for potential drug interactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.drug_interaction_alerts}
                  onChange={(e) => setSettings({...settings, drug_interaction_alerts: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allergy Check</Label>
                  <p className="text-sm text-gray-600">Check patient allergies before dispensing</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allergy_check_enabled}
                  onChange={(e) => setSettings({...settings, allergy_check_enabled: e.target.checked})}
                  className="rounded"
                />
              </div>
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
              Alerts & Notifications
            </CardTitle>
            <CardDescription>Configure alert preferences for pharmacy operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stock Alert Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about low and out-of-stock medicines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_stock_alerts}
                  onChange={(e) => setSettings({...settings, notification_stock_alerts: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Expiry Alert Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about medicines nearing expiry</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_expiry_alerts}
                  onChange={(e) => setSettings({...settings, notification_expiry_alerts: e.target.checked})}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>New Prescription Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about new prescriptions to dispense</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_prescriptions}
                  onChange={(e) => setSettings({...settings, notification_prescriptions: e.target.checked})}
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
              <Pill className="h-5 w-5" />
              Professional Profile
            </CardTitle>
            <CardDescription>Your professional information and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="license_number">Pharmacy License Number</Label>
              <Input
                id="license_number"
                value={settings.license_number}
                onChange={(e) => setSettings({...settings, license_number: e.target.value})}
                placeholder="e.g., PH/2023/12345"
              />
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature</Label>
              <Input
                id="signature"
                value={settings.signature}
                onChange={(e) => setSettings({...settings, signature: e.target.value})}
                placeholder="Pharmacist [Your Name], License #[Number]"
              />
            </div>

            <div>
              <Label htmlFor="default_dispensing_instructions">Default Dispensing Instructions</Label>
              <textarea
                id="default_dispensing_instructions"
                value={settings.default_dispensing_instructions}
                onChange={(e) => setSettings({...settings, default_dispensing_instructions: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md h-24"
                placeholder="Standard instructions to include with dispensed medicines..."
              />
              <p className="text-sm text-gray-600 mt-1">
                These instructions will be included with every dispensed medicine
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}