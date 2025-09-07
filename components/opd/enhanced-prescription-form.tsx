'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types
import { Prescription } from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MedicationAutocomplete } from '@/components/consultation/medication-autocomplete'
import { 
  Pill, 
  Plus, 
  X, 
  AlertTriangle, 
  Info, 
  Clock, 
  Calculator, 
  Heart,
  Shield,
  Zap,
  CheckCircle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced prescription interface with clinical data
interface EnhancedPrescription extends Prescription {
  medication_name: string
  medication_data?: any // Clinical data from medicine_master
  dosage_form?: string
  strength?: string
  route?: string
  clinical_warnings?: string[]
  drug_interactions?: string[]
  contraindications?: string[]
  side_effects?: string[]
  monitoring_requirements?: string[]
}

// Form data structure
interface PrescriptionFormData {
  prescriptions: EnhancedPrescription[]
}

interface EnhancedPrescriptionFormProps {
  visitId: string
  existingPrescriptions?: Prescription[]
  onSave?: (prescriptions: EnhancedPrescription[]) => void
  onCancel?: () => void
}

// Common dosage options
const COMMON_FREQUENCIES = [
  { value: 'once_daily', label: 'Once Daily', short: 'OD' },
  { value: 'twice_daily', label: 'Twice Daily', short: 'BD' },
  { value: 'three_times_daily', label: 'Three Times Daily', short: 'TDS' },
  { value: 'four_times_daily', label: 'Four Times Daily', short: 'QID' },
  { value: 'every_6_hours', label: 'Every 6 Hours', short: 'Q6H' },
  { value: 'every_8_hours', label: 'Every 8 Hours', short: 'Q8H' },
  { value: 'every_12_hours', label: 'Every 12 Hours', short: 'Q12H' },
  { value: 'as_needed', label: 'As Needed', short: 'PRN' },
  { value: 'before_meals', label: 'Before Meals', short: 'AC' },
  { value: 'after_meals', label: 'After Meals', short: 'PC' },
  { value: 'at_bedtime', label: 'At Bedtime', short: 'HS' }
]

const COMMON_DURATIONS = [
  { value: '3_days', label: '3 Days' },
  { value: '5_days', label: '5 Days' },
  { value: '7_days', label: '1 Week' },
  { value: '10_days', label: '10 Days' },
  { value: '14_days', label: '2 Weeks' },
  { value: '21_days', label: '3 Weeks' },
  { value: '30_days', label: '1 Month' },
  { value: '60_days', label: '2 Months' },
  { value: '90_days', label: '3 Months' },
  { value: 'ongoing', label: 'Ongoing' }
]

export function EnhancedPrescriptionForm({ 
  visitId, 
  existingPrescriptions = [], 
  onSave, 
  onCancel 
}: EnhancedPrescriptionFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<PrescriptionFormData>({
    prescriptions: existingPrescriptions.length > 0 
      ? existingPrescriptions.map(p => ({
          ...p,
          medication_name: p.medicine?.name || '',
          status: 'prescribed' as const
        }))
      : [{
          id: '',
          visit_id: visitId,
          medicine_id: '',
          medication_name: '',
          quantity: 1,
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          created_at: new Date().toISOString(),
          status: 'prescribed' as const
        }]
  })

  // Helper functions
  const addPrescription = useCallback(() => {
    setFormData(prev => ({
      prescriptions: [...prev.prescriptions, {
        id: '',
        visit_id: visitId,
        medicine_id: '',
        medication_name: '',
        quantity: 1,
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        created_at: new Date().toISOString(),
        status: 'prescribed' as const
      }]
    }))
  }, [visitId])

  const removePrescription = useCallback((index: number) => {
    if (formData.prescriptions.length > 1) {
      setFormData(prev => ({
        prescriptions: prev.prescriptions.filter((_, i) => i !== index)
      }))
    }
  }, [formData.prescriptions.length])

  const updatePrescription = useCallback((index: number, field: keyof EnhancedPrescription, value: any) => {
    setFormData(prev => ({
      prescriptions: prev.prescriptions.map((prescription, i) => 
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }))
  }, [])

  // Handle medication selection with clinical data integration
  const handleMedicationSelect = useCallback((index: number, medicationName: string, medicineData?: any) => {
    updatePrescription(index, 'medication_name', medicationName)
    
    if (medicineData) {
      updatePrescription(index, 'medicine_id', medicineData.id)
      updatePrescription(index, 'medication_data', medicineData)
      updatePrescription(index, 'dosage_form', medicineData.dosage_forms?.[0] || '')
      updatePrescription(index, 'strength', medicineData.strengths?.[0] || '')
      updatePrescription(index, 'route', medicineData.routes?.[0] || 'oral')
      
      // Auto-populate dosage if available
      if (medicineData.standard_dosage_adult) {
        updatePrescription(index, 'dosage', medicineData.standard_dosage_adult)
      }

      // Auto-populate frequency if available
      if (medicineData.frequencies?.[0]) {
        const matchingFrequency = COMMON_FREQUENCIES.find(f => 
          f.label.toLowerCase().includes(medicineData.frequencies[0].toLowerCase())
        )
        if (matchingFrequency) {
          updatePrescription(index, 'frequency', matchingFrequency.value)
        }
      }

      // Set clinical warnings and monitoring requirements
      updatePrescription(index, 'clinical_warnings', medicineData.warnings || [])
      updatePrescription(index, 'drug_interactions', medicineData.drug_interactions || [])
      updatePrescription(index, 'contraindications', medicineData.contraindications || [])
      updatePrescription(index, 'side_effects', medicineData.side_effects || [])
      updatePrescription(index, 'monitoring_requirements', medicineData.monitoring_requirements || [])
    }
  }, [updatePrescription])

  // Calculate total quantity based on dosage and duration
  const calculateQuantity = useCallback((dosage: string, frequency: string, duration: string) => {
    try {
      // Extract number of doses per day from frequency
      let dosesPerDay = 1
      const freq = COMMON_FREQUENCIES.find(f => f.value === frequency)
      if (freq) {
        if (freq.value === 'twice_daily') dosesPerDay = 2
        else if (freq.value === 'three_times_daily') dosesPerDay = 3
        else if (freq.value === 'four_times_daily') dosesPerDay = 4
        else if (freq.value.includes('6_hours')) dosesPerDay = 4
        else if (freq.value.includes('8_hours')) dosesPerDay = 3
        else if (freq.value.includes('12_hours')) dosesPerDay = 2
      }

      // Extract number of days from duration
      let days = 1
      const dur = COMMON_DURATIONS.find(d => d.value === duration)
      if (dur) {
        if (dur.value.includes('3_days')) days = 3
        else if (dur.value.includes('5_days')) days = 5
        else if (dur.value.includes('7_days')) days = 7
        else if (dur.value.includes('10_days')) days = 10
        else if (dur.value.includes('14_days')) days = 14
        else if (dur.value.includes('21_days')) days = 21
        else if (dur.value.includes('30_days')) days = 30
        else if (dur.value.includes('60_days')) days = 60
        else if (dur.value.includes('90_days')) days = 90
      }

      // Calculate total quantity (add 10% buffer)
      return Math.ceil(dosesPerDay * days * 1.1)
    } catch (error) {
      return 1
    }
  }, [])

  // Auto-calculate quantity when dosage, frequency, or duration changes
  useEffect(() => {
    formData.prescriptions.forEach((prescription, index) => {
      if (prescription.dosage && prescription.frequency && prescription.duration) {
        const calculatedQuantity = calculateQuantity(
          prescription.dosage, 
          prescription.frequency, 
          prescription.duration
        )
        if (calculatedQuantity !== prescription.quantity) {
          updatePrescription(index, 'quantity', calculatedQuantity)
        }
      }
    })
  }, [formData.prescriptions, calculateQuantity, updatePrescription])

  // Save prescriptions
  const handleSave = async () => {
    // Validate required fields
    const validPrescriptions = formData.prescriptions.filter(p => 
      p.medication_name.trim() !== '' && p.medicine_id !== ''
    )

    if (validPrescriptions.length === 0) {
      return
    }

    try {
      setSaving(true)
      setErrors({})

      // Save prescriptions to database
      const prescriptionsToSave = validPrescriptions.map(p => ({
        visit_id: visitId,
        medicine_id: p.medicine_id,
        quantity: p.quantity,
        dosage: p.dosage || null,
        frequency: p.frequency || null,
        duration: p.duration || null,
        instructions: p.instructions || null
      }))

      // If updating existing prescriptions, delete old ones first
      if (existingPrescriptions.length > 0) {
        await supabase
          .from('prescriptions')
          .delete()
          .eq('visit_id', visitId)
      }

      // Insert new prescriptions
      const { error } = await supabase
        .from('prescriptions')
        .insert(prescriptionsToSave)

      if (error) throw error

      onSave?.(validPrescriptions)

    } catch (err) {
      console.error('Error saving prescriptions:', err)
    } finally {
      setSaving(false)
    }
  }

  // Clinical safety alerts component
  const ClinicalAlerts = ({ prescription, index }: { prescription: EnhancedPrescription; index: number }) => {
    const hasWarnings = prescription.clinical_warnings?.length > 0
    const hasInteractions = prescription.drug_interactions?.length > 0
    const hasContraindications = prescription.contraindications?.length > 0
    const requiresMonitoring = prescription.monitoring_requirements?.length > 0

    if (!hasWarnings && !hasInteractions && !hasContraindications && !requiresMonitoring) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>No clinical alerts</span>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {hasContraindications && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Contraindications:</strong> {prescription.contraindications?.slice(0, 2).join(', ')}
              {prescription.contraindications && prescription.contraindications.length > 2 && '...'}
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warnings:</strong> {prescription.clinical_warnings?.slice(0, 2).join(', ')}
              {prescription.clinical_warnings && prescription.clinical_warnings.length > 2 && '...'}
            </AlertDescription>
          </Alert>
        )}

        {hasInteractions && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Drug Interactions:</strong> {prescription.drug_interactions?.slice(0, 2).join(', ')}
              {prescription.drug_interactions && prescription.drug_interactions.length > 2 && '...'}
            </AlertDescription>
          </Alert>
        )}

        {requiresMonitoring && (
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription>
              <strong>Monitoring Required:</strong> {prescription.monitoring_requirements?.slice(0, 2).join(', ')}
              {prescription.monitoring_requirements && prescription.monitoring_requirements.length > 2 && '...'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Enhanced Prescription Management</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Clinical Decision Support Enabled
        </div>
      </div>

      {formData.prescriptions.map((prescription, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medication {index + 1}
                {prescription.medication_data?.controlled_substance && (
                  <Badge variant="destructive" className="text-xs">
                    Controlled
                  </Badge>
                )}
                {prescription.medication_data?.prescription_required && (
                  <Badge variant="default" className="text-xs">
                    Prescription Only
                  </Badge>
                )}
              </CardTitle>
              {formData.prescriptions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrescription(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Medication Selection with Clinical Integration */}
            <div className="space-y-2">
              <Label>Medication <span className="text-destructive">*</span></Label>
              <MedicationAutocomplete
                value={prescription.medication_name}
                onChange={(name, data) => handleMedicationSelect(index, name, data)}
                placeholder="Search medications from clinical database..."
                className="w-full"
              />
              {prescription.medication_data && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>
                    {prescription.medication_data.generic_name && 
                      `Generic: ${prescription.medication_data.generic_name} • `
                    }
                    {prescription.dosage_form} • {prescription.strength}
                  </span>
                </div>
              )}
            </div>

            {/* Clinical Alerts */}
            {prescription.medication_data && (
              <ClinicalAlerts prescription={prescription} index={index} />
            )}

            {/* Dosage, Frequency, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  value={prescription.dosage || ''}
                  onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                  placeholder="e.g., 500mg, 1 tablet"
                />
                {prescription.medication_data?.standard_dosage_adult && (
                  <div className="text-xs text-muted-foreground">
                    Standard: {prescription.medication_data.standard_dosage_adult}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={prescription.frequency || ''}
                  onValueChange={(value) => updatePrescription(index, 'frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{freq.label}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {freq.short}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={prescription.duration || ''}
                  onValueChange={(value) => updatePrescription(index, 'duration', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DURATIONS.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {prescription.medication_data?.duration_guidelines && (
                  <div className="text-xs text-muted-foreground">
                    Guidelines: {prescription.medication_data.duration_guidelines}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity with Auto-calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Quantity
                  {prescription.dosage && prescription.frequency && prescription.duration && (
                    <Calculator className="w-4 h-4 text-blue-500" />
                  )}
                </Label>
                <Input
                  type="number"
                  value={prescription.quantity}
                  onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                />
                {prescription.dosage && prescription.frequency && prescription.duration && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Auto-calculated (includes 10% buffer)
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Route</Label>
                <Input
                  value={prescription.route || 'oral'}
                  onChange={(e) => updatePrescription(index, 'route', e.target.value)}
                  placeholder="e.g., oral, topical, IV"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Instructions to Patient</Label>
              <Textarea
                value={prescription.instructions || ''}
                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                placeholder="e.g., Take with food, avoid alcohol, complete the course..."
                className="min-h-[80px]"
              />
            </div>

            {/* Side Effects Information */}
            {prescription.side_effects && prescription.side_effects.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Common Side Effects
                </Label>
                <div className="flex flex-wrap gap-1">
                  {prescription.side_effects.slice(0, 6).map((effect, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {effect}
                    </Badge>
                  ))}
                  {prescription.side_effects.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{prescription.side_effects.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add Another Prescription */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addPrescription}
          className="w-full max-w-xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Medication
        </Button>
      </div>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Prescriptions'
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please check the prescription form for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}