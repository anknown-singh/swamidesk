'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, Activity, Thermometer, Heart, Weight, Gauge } from 'lucide-react'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

interface VitalsFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

export function VitalsForm({ consultationId, onNext, onPrevious }: VitalsFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingVitals, setExistingVitals] = useState(null)
  
  // Updated to match database schema exactly
  const [vitals, setVitals] = useState({
    temperature: '',
    pulse_rate: '', // Database uses pulse_rate, not heart_rate
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    height_cm: '', // Database uses height_cm
    weight_kg: '', // Database uses weight_kg
    pain_score: ''
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    vitals,
    'consultation_vitals',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: typeof vitals) => {
        // Custom save logic for vitals - using correct database field names
        const vitalsData = {
          consultation_id: consultationId,
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          pulse_rate: data.pulse_rate ? parseInt(data.pulse_rate) : null,
          blood_pressure_systolic: data.blood_pressure_systolic ? parseInt(data.blood_pressure_systolic) : null,
          blood_pressure_diastolic: data.blood_pressure_diastolic ? parseInt(data.blood_pressure_diastolic) : null,
          respiratory_rate: data.respiratory_rate ? parseInt(data.respiratory_rate) : null,
          oxygen_saturation: data.oxygen_saturation ? parseInt(data.oxygen_saturation) : null,
          height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
          weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
          bmi: calculateBMI() !== '--' ? parseFloat(calculateBMI()) : null,
          pain_score: data.pain_score ? parseInt(data.pain_score) : null,
          recorded_at: new Date().toISOString()
        }

        if (existingVitals) {
          // Update existing record
          const { error } = await supabase
            .from('consultation_vitals')
            .update(vitalsData)
            .eq('id', existingVitals.id)

          if (error) throw error
        } else {
          // Insert new record
          const { error } = await supabase
            .from('consultation_vitals')
            .insert([vitalsData])

          if (error) throw error
        }
      },
      onError: (error) => {
        // Only show error toast if it's not a missing table error
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Load existing vitals on component mount
  useEffect(() => {
    const loadExistingVitals = async () => {
      try {
        const { data, error } = await supabase
          .from('consultation_vitals')
          .select('*')
          .eq('consultation_id', consultationId)
          .single()

        // Handle missing table gracefully
        if (error && error.code === 'PGRST116') {
          console.log('Vitals table not found - starting with empty form')
          setExistingVitals(null)
          setLoading(false)
          return
        }

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setExistingVitals(data)
          // Pre-populate form with existing data
          setVitals({
            temperature: data.temperature?.toString() || '',
            heart_rate: data.heart_rate?.toString() || '',
            blood_pressure_systolic: data.blood_pressure_systolic?.toString() || '',
            blood_pressure_diastolic: data.blood_pressure_diastolic?.toString() || '',
            respiratory_rate: data.respiratory_rate?.toString() || '',
            oxygen_saturation: data.oxygen_saturation?.toString() || '',
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
            pain_score: data.pain_score?.toString() || ''
          })
        }
      } catch (err) {
        console.error('Error loading vitals:', err)
        if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
          toast.error('Failed to load existing vitals')
        }
      } finally {
        setLoading(false)
      }
    }

    loadExistingVitals()
  }, [consultationId, supabase])

  const calculateBMI = () => {
    const height = parseFloat(vitals.height)
    const weight = parseFloat(vitals.weight)
    if (height && weight) {
      const bmi = weight / ((height / 100) ** 2)
      return bmi.toFixed(1)
    }
    return '--'
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await forceSave() // Force save current data
      toast.success('Vital signs saved successfully')
      onNext()
    } catch (err) {
      console.error('Error saving vitals:', err)
      toast.error('Failed to save vital signs')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vital signs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Vital Signs</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Record patient's vital signs and basic measurements. Changes are automatically saved as you type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Basic Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature (°C)
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="36.5"
                value={vitals.temperature}
                onChange={(e) => setVitals(prev => ({ ...prev, temperature: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
              <Input
                id="heart_rate"
                type="number"
                placeholder="72"
                value={vitals.heart_rate}
                onChange={(e) => setVitals(prev => ({ ...prev, heart_rate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Blood Pressure (mmHg)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="120"
                  value={vitals.blood_pressure_systolic}
                  onChange={(e) => setVitals(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
                />
                <span className="self-center text-muted-foreground">/</span>
                <Input
                  type="number"
                  placeholder="80"
                  value={vitals.blood_pressure_diastolic}
                  onChange={(e) => setVitals(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratory_rate">Respiratory Rate (breaths/min)</Label>
              <Input
                id="respiratory_rate"
                type="number"
                placeholder="16"
                value={vitals.respiratory_rate}
                onChange={(e) => setVitals(prev => ({ ...prev, respiratory_rate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
              <Input
                id="oxygen_saturation"
                type="number"
                min="0"
                max="100"
                placeholder="98"
                value={vitals.oxygen_saturation}
                onChange={(e) => setVitals(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Anthropometric Measurements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-blue-500" />
              Physical Measurements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="170.0"
                value={vitals.height}
                onChange={(e) => setVitals(prev => ({ ...prev, height: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.0"
                value={vitals.weight}
                onChange={(e) => setVitals(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>BMI</Label>
              <div className="p-3 bg-muted rounded-md">
                <span className="text-2xl font-bold">{calculateBMI()}</span>
                <span className="text-sm text-muted-foreground ml-2">kg/m²</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pain_score" className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Pain Score (0-10)
              </Label>
              <Input
                id="pain_score"
                type="number"
                min="0"
                max="10"
                placeholder="0"
                value={vitals.pain_score}
                onChange={(e) => setVitals(prev => ({ ...prev, pain_score: e.target.value }))}
              />
              <div className="text-xs text-muted-foreground">
                0 = No pain, 10 = Worst pain imaginable
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Normal Ranges (Adults)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Temperature</div>
              <div className="text-muted-foreground">36.1-37.2°C</div>
            </div>
            <div>
              <div className="font-medium">Pulse Rate</div>
              <div className="text-muted-foreground">60-100 bpm</div>
            </div>
            <div>
              <div className="font-medium">Blood Pressure</div>
              <div className="text-muted-foreground">120/80 mmHg</div>
            </div>
            <div>
              <div className="font-medium">Respiratory Rate</div>
              <div className="text-muted-foreground">12-20 breaths/min</div>
            </div>
            <div>
              <div className="font-medium">Oxygen Saturation</div>
              <div className="text-muted-foreground">95-100%</div>
            </div>
            <div>
              <div className="font-medium">BMI</div>
              <div className="text-muted-foreground">18.5-24.9 kg/m²</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back: History
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (
            <>
              Next: Examination
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}