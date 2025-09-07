'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import { createSellOrderFromTreatmentPlan } from '@/lib/services/sell-order-service'

// Types
import { ConsultationTreatmentPlan } from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Plus, X, ArrowLeft, ArrowRight, Pill, Activity, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'
import { MedicationAutocomplete } from './medication-autocomplete'

// Form data types (updated for medicine_master integration)
type MedicationData = {
  medication_name: string
  generic_name?: string
  medicine_id?: string
  brand_names?: string[]
  category?: string
  subcategory?: string
  therapeutic_class?: string
  dosage_forms?: string[]
  strengths?: string[]
  routes?: string[]
  standard_dosage_adult?: string
  indications?: string[]
  contraindications?: string[]
  warnings?: string[]
  prescription_required?: boolean
  controlled_substance?: boolean
  // Treatment plan specific fields
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
  is_critical: boolean
}

type InterventionData = {
  intervention_type: string
  description: string
  frequency: string
  duration: string
  instructions: string
}

type LifestyleModificationData = {
  category: string
  modification: string
  target: string
  timeline: string
}

type FollowUpData = {
  follow_up_date: string
  follow_up_instructions: string
  warning_signs: string
  emergency_contact_needed: boolean
}

type TreatmentPlanFormData = {
  medications: MedicationData[]
  non_pharmacological: InterventionData[]
  lifestyle_modifications: LifestyleModificationData[]
  follow_up: FollowUpData
}

interface TreatmentPlanFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

// Treatment options
const MEDICATION_ROUTES = ['Oral', 'Topical', 'Injection (IM)', 'Injection (IV)', 'Injection (SC)', 'Inhaled', 'Rectal', 'Sublingual', 'Transdermal']

const MEDICATION_FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 
  'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
  'As needed (PRN)', 'Before meals', 'After meals', 'At bedtime'
]

const INTERVENTION_TYPES = [
  'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Counseling',
  'Wound Care', 'Breathing Exercises', 'Exercise Program', 'Heat Therapy',
  'Cold Therapy', 'Massage Therapy', 'Acupuncture', 'Meditation'
]

const LIFESTYLE_CATEGORIES = [
  'Diet', 'Exercise', 'Sleep', 'Stress Management', 'Smoking Cessation',
  'Alcohol Reduction', 'Weight Management', 'Posture', 'Ergonomics', 'Hydration'
]

// Helper function to suggest route based on dosage form
const getSuggestedRoute = (dosageForm: string): string => {
  const formLower = dosageForm.toLowerCase()
  
  if (formLower.includes('tablet') || formLower.includes('capsule') || 
      formLower.includes('syrup') || formLower.includes('suspension') ||
      formLower.includes('liquid') || formLower.includes('powder')) {
    return 'Oral'
  } else if (formLower.includes('injection') || formLower.includes('injectable')) {
    return 'Injection (IM)'
  } else if (formLower.includes('inhaler') || formLower.includes('inhalation')) {
    return 'Inhaled'
  } else if (formLower.includes('cream') || formLower.includes('ointment') || 
             formLower.includes('gel') || formLower.includes('lotion')) {
    return 'Topical'
  } else if (formLower.includes('suppository')) {
    return 'Rectal'
  } else if (formLower.includes('patch')) {
    return 'Transdermal'
  } else if (formLower.includes('sublingual') || formLower.includes('buccal')) {
    return 'Sublingual'
  }
  
  return 'Oral' // Default to oral
}

export function TreatmentPlanForm({ consultationId, onNext, onPrevious }: TreatmentPlanFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingTreatmentPlan, setExistingTreatmentPlan] = useState<ConsultationTreatmentPlan | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<TreatmentPlanFormData>({
    medications: [],
    non_pharmacological: [],
    lifestyle_modifications: [],
    follow_up: {
      follow_up_date: '',
      follow_up_instructions: '',
      warning_signs: '',
      emergency_contact_needed: false
    }
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    formData,
    'consultation_treatment_plans',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: TreatmentPlanFormData) => {
        // Custom save logic for treatment plans
        const validMedications = data.medications.filter(med => med.medication_name.trim() !== '')
        
        const treatmentPlanData = {
          consultation_id: consultationId,
          treatment_type: 'comprehensive',
          primary_treatment: validMedications.length > 0 ? validMedications[0]?.medication_name || 'Non-pharmacological treatment' : 'Non-pharmacological treatment',
          treatment_goals: ['Symptom relief', 'Functional improvement'],
          plan_details: {
            medications: validMedications,
            non_pharmacological: data.non_pharmacological,
            lifestyle_modifications: data.lifestyle_modifications
          },
          medications: validMedications,
          lifestyle_modifications: data.lifestyle_modifications.map(mod => mod.modification),
          follow_up_required: data.follow_up.follow_up_date !== '',
          follow_up_days: data.follow_up.follow_up_date ? 
            Math.ceil((new Date(data.follow_up.follow_up_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          follow_up_instructions: data.follow_up.follow_up_instructions,
          warning_signs: data.follow_up.warning_signs ? data.follow_up.warning_signs.split(',').map(s => s.trim()) : [],
          estimated_cost: 100.00
        }

        let treatmentPlanId: string | null = null

        if (existingTreatmentPlan) {
          console.log("🔄 AUTO-SAVE: Updating existing treatment plan ID:", existingTreatmentPlan.id);
          const { data: updatedPlan, error } = await supabase
            .from('consultation_treatment_plans')
            .update(treatmentPlanData)
            .eq('id', existingTreatmentPlan.id)  // Update specific record by ID
            .select('id')
            .single()
          if (error) {
            console.error("❌ AUTO-SAVE: Update failed:", error);
            throw error;
          }
          treatmentPlanId = updatedPlan?.id || existingTreatmentPlan.id
          console.log("✅ AUTO-SAVE: Successfully updated treatment plan:", treatmentPlanId);
        } else {
          console.log("🆕 AUTO-SAVE: Creating new treatment plan for consultation:", consultationId);
          const { data: newPlan, error } = await supabase
            .from('consultation_treatment_plans')
            .insert([treatmentPlanData])
            .select('id')
            .single()
          if (error) {
            console.error("❌ AUTO-SAVE: Insert failed:", error);
            throw error;
          }
          treatmentPlanId = newPlan?.id
          console.log("✅ AUTO-SAVE: Successfully created treatment plan:", treatmentPlanId);
        }

        // Create sell order if there are valid medications
        if (validMedications.length > 0 && treatmentPlanId) {
          try {
            // Get consultation session details for patient and doctor info
            const { data: consultationSession, error: sessionError } = await supabase
              .from('consultation_sessions')
              .select(`
                patient_id,
                doctor_id,
                patients(full_name, phone),
                users(full_name)
              `)
              .eq('id', consultationId)
              .single()

            if (!sessionError && consultationSession) {
              console.log('Creating sell order for treatment plan:', treatmentPlanId)
              
              // Transform medications to the required format
              const transformedMedications = validMedications
                .filter(med => med.medicine_id) // Only include medications with medicine_id
                .map(med => ({
                  ...med,
                  medicine_id: med.medicine_id!
                }))

              if (transformedMedications.length === 0) {
                console.log('No medications with medicine_id found, skipping sell order creation')
                return
              }

              const sellOrderResult = await createSellOrderFromTreatmentPlan({
                consultationId,
                treatmentPlanId,
                patientId: consultationSession.patient_id,
                doctorId: consultationSession.doctor_id,
                medications: transformedMedications,
                patientName: Array.isArray(consultationSession.patients) 
                  ? consultationSession.patients[0]?.full_name || 'Unknown Patient'
                  : consultationSession.patients?.full_name || 'Unknown Patient',
                patientContact: Array.isArray(consultationSession.patients) 
                  ? consultationSession.patients[0]?.phone
                  : consultationSession.patients?.phone,
                estimatedCost: treatmentPlanData.estimated_cost
              })

              if (sellOrderResult.success) {
                console.log('✅ Sell order created successfully:', sellOrderResult.sellOrder?.order_number)
              } else {
                console.error('❌ Failed to create sell order:', sellOrderResult.error)
              }
            }
          } catch (sellOrderError) {
            console.error('Error creating sell order:', sellOrderError)
          }
        }
      },
      onError: (error) => {
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Load existing treatment plan
  useEffect(() => {
    const loadExistingTreatmentPlan = async () => {
      console.log("🚀 TREATMENT FORM: Starting to load treatment plan for consultationId:", consultationId);
      try {
        // Get all treatment plans for this consultation, then select the best one
        const { data: treatmentPlans, error } = await supabase
          .from('consultation_treatment_plans')
          .select('*')
          .eq('consultation_id', consultationId)
          .order('updated_at', { ascending: false })

        console.log("📊 TREATMENT FORM: Query result - treatmentPlans:", treatmentPlans, "error:", error);

        if (error) {
          console.error("❌ TREATMENT FORM: Query error:", error);
          throw error;
        }

        // Select the treatment plan with medications, or the most recent one
        let data = null;
        if (treatmentPlans && treatmentPlans.length > 0) {
          // First try to find a plan with medications
          const planWithMedications = treatmentPlans.find(plan => 
            (plan.medications && Array.isArray(plan.medications) && plan.medications.length > 0) ||
            (plan.plan_details && plan.plan_details.medications && Array.isArray(plan.plan_details.medications) && plan.plan_details.medications.length > 0)
          );
          
          // Use the plan with medications, or fall back to the most recent one
          data = planWithMedications || treatmentPlans[0];
          console.log("🎯 TREATMENT FORM: Selected treatment plan:", data.id, "has medications:", !!((data.medications && data.medications.length > 0) || (data.plan_details?.medications && data.plan_details.medications.length > 0)));
        }

        console.log("📊 TREATMENT FORM: Final selected data:", data);

        if (data) {
          console.log("🔍 TREATMENT FORM: LOADING EXISTING TREATMENT PLAN:", JSON.stringify(data, null, 2));
          
          setExistingTreatmentPlan(data)
          
          // Try to extract medications from different possible locations
          let existingMedications = [];
          
          console.log("🔍 TREATMENT FORM: Checking data.medications:", data.medications, "type:", typeof data.medications, "isArray:", Array.isArray(data.medications));
          console.log("🔍 TREATMENT FORM: Checking data.plan_details:", data.plan_details);
          if (data.plan_details) {
            console.log("🔍 TREATMENT FORM: plan_details.medications:", data.plan_details.medications, "type:", typeof data.plan_details.medications, "isArray:", Array.isArray(data.plan_details.medications));
          }
          
          if (data.medications && Array.isArray(data.medications)) {
            existingMedications = data.medications;
            console.log("✅ TREATMENT FORM: Found medications in data.medications:", existingMedications);
          } else if (data.plan_details && data.plan_details.medications && Array.isArray(data.plan_details.medications)) {
            existingMedications = data.plan_details.medications;
            console.log("✅ TREATMENT FORM: Found medications in data.plan_details.medications:", existingMedications);
          } else if (data.medications && typeof data.medications === 'string') {
            try {
              const parsed = JSON.parse(data.medications);
              if (Array.isArray(parsed)) {
                existingMedications = parsed;
                console.log("✅ TREATMENT FORM: Found medications as JSON string:", existingMedications);
              }
            } catch (e) {
              console.log("❌ TREATMENT FORM: Failed to parse medications JSON string:", data.medications);
            }
          } else {
            console.log("⚠️ TREATMENT FORM: No medications found in any expected location");
          }
          
          console.log("📝 TREATMENT FORM: Final medications for form:", existingMedications);
          
          // Pre-populate form with existing data
          setFormData({
            medications: existingMedications,
            non_pharmacological: data.non_pharmacological || [],
            lifestyle_modifications: data.lifestyle_modifications || [],
            follow_up: data.follow_up || {
              follow_up_date: '',
              follow_up_instructions: '',
              warning_signs: '',
              emergency_contact_needed: false
            }
          })
        }
      } catch (err) {
        console.error('Error loading treatment plan:', err)
      } finally {
        setLoading(false)
      }
    }

    loadExistingTreatmentPlan()
  }, [consultationId, supabase])

  // Helper functions for managing form state
  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: '',
        instructions: '',
        is_critical: false
      }]
    }))
  }

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      }))
    }
  }

  const updateMedication = (index: number, field: keyof MedicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const updateMedicationWithData = (index: number, medicationName: string, medicineData?: any) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? {
          ...med,
          medication_name: medicationName,
          generic_name: medicineData?.generic_name || '',
          medicine_id: medicineData?.id || '',
          brand_names: medicineData?.brand_names || [],
          category: medicineData?.category || '',
          subcategory: medicineData?.subcategory || '',
          therapeutic_class: medicineData?.therapeutic_class || '',
          dosage_forms: medicineData?.dosage_forms || [],
          strengths: medicineData?.strengths || [],
          routes: medicineData?.routes || [],
          standard_dosage_adult: medicineData?.standard_dosage_adult || '',
          indications: medicineData?.indications || [],
          contraindications: medicineData?.contraindications || [],
          warnings: medicineData?.warnings || [],
          prescription_required: medicineData?.prescription_required || false,
          controlled_substance: medicineData?.controlled_substance || false,
          // Auto-suggest route based on dosage forms
          route: med.route || (medicineData?.dosage_forms?.[0] ? getSuggestedRoute(medicineData.dosage_forms[0]) : ''),
          // Auto-suggest dosage from standard adult dosage
          dosage: med.dosage || medicineData?.standard_dosage_adult || ''
        } : med
      )
    }))
  }

  const addIntervention = () => {
    setFormData(prev => ({
      ...prev,
      non_pharmacological: [...prev.non_pharmacological, {
        intervention_type: '',
        description: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]
    }))
  }

  const removeIntervention = (index: number) => {
    setFormData(prev => ({
      ...prev,
      non_pharmacological: prev.non_pharmacological.filter((_, i) => i !== index)
    }))
  }

  const updateIntervention = (index: number, field: keyof InterventionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      non_pharmacological: prev.non_pharmacological.map((intervention, i) => 
        i === index ? { ...intervention, [field]: value } : intervention
      )
    }))
  }

  const addLifestyleModification = () => {
    setFormData(prev => ({
      ...prev,
      lifestyle_modifications: [...prev.lifestyle_modifications, {
        category: '',
        modification: '',
        target: '',
        timeline: ''
      }]
    }))
  }

  const removeLifestyleModification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lifestyle_modifications: prev.lifestyle_modifications.filter((_, i) => i !== index)
    }))
  }

  const updateLifestyleModification = (index: number, field: keyof LifestyleModificationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      lifestyle_modifications: prev.lifestyle_modifications.map((mod, i) => 
        i === index ? { ...mod, [field]: value } : mod
      )
    }))
  }

  const updateFollowUp = (field: keyof FollowUpData, value: any) => {
    setFormData(prev => ({
      ...prev,
      follow_up: { ...prev.follow_up, [field]: value }
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const validMedications = formData.medications.filter(med => med.medication_name.trim() !== '')
    
    try {
      setSaving(true)
      setErrors({})
      await forceSave() // Force save current data
      
      // Note: Follow-up appointment creation would be handled separately
      // to avoid complications with data access during treatment plan saving

      onNext()
    } catch (err) {
      console.error('Error saving treatment plan:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (!errorMessage.includes('relation') && !errorMessage.includes('does not exist')) {
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading treatment plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Treatment Plan</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Create a comprehensive treatment plan including medications, interventions, and lifestyle modifications. Changes are automatically saved as you type.
        </p>
      </div>

      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medication Prescriptions
              </CardTitle>
              <CardDescription>
                Prescribe medications with dosage, frequency, and administration instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.medications.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex flex-col items-center gap-3">
                    <Pill className="w-12 h-12 text-gray-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">No medications added</p>
                      <p className="text-xs text-gray-500">Click "Add Medication" to prescribe medications for this patient</p>
                    </div>
                  </div>
                </div>
              ) : (
                formData.medications.map((medication, medicationIndex) => (
                <Card key={medicationIndex} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Medication {medicationIndex + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`critical-${medicationIndex}`}
                            checked={medication.is_critical}
                            onCheckedChange={(checked) => 
                              updateMedication(medicationIndex, 'is_critical', checked as boolean)
                            }
                          />
                          <Label htmlFor={`critical-${medicationIndex}`} className="text-xs">
                            Critical
                          </Label>
                        </div>
                        {formData.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(medicationIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Medication Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`medication_name_${medicationIndex}`}>
                        Medication Name <span className="text-destructive">*</span>
                      </Label>
                      <MedicationAutocomplete
                        value={medication.medication_name}
                        onChange={(medicationName, medicineData) => 
                          updateMedicationWithData(medicationIndex, medicationName, medicineData)
                        }
                        placeholder="Search medicines... (e.g., Paracetamol, Amoxicillin)"
                      />
                      {medication.generic_name && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              Generic: {medication.generic_name}
                            </Badge>
                            {medication.category && (
                              <Badge variant="secondary" className="text-xs">
                                {medication.category}
                              </Badge>
                            )}
                            {medication.prescription_required && (
                              <Badge variant={medication.controlled_substance ? "destructive" : "default"} className="text-xs">
                                {medication.controlled_substance ? 'Controlled' : 'Prescription'}
                              </Badge>
                            )}
                          </div>
                          {medication.indications && medication.indications.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Used for:</strong> {medication.indications.slice(0, 3).join(', ')}
                              {medication.indications.length > 3 && '...'}
                            </div>
                          )}
                          {medication.contraindications && medication.contraindications.length > 0 && (
                            <div className="text-xs text-red-600">
                              <strong>Contraindications:</strong> {medication.contraindications.slice(0, 2).join(', ')}
                              {medication.contraindications.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                      {errors[`medication_${medicationIndex}_name`] && (
                        <p className="text-sm text-destructive">
                          {errors[`medication_${medicationIndex}_name`]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Dosage */}
                      <div className="space-y-2">
                        <Label htmlFor={`dosage_${medicationIndex}`}>
                          Dosage <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(medicationIndex, 'dosage', e.target.value)}
                          placeholder={
                            medication.standard_dosage_adult ? `e.g., ${medication.standard_dosage_adult}` :
                            medication.strengths?.[0] ? `e.g., ${medication.strengths[0]}` :
                            "e.g., 500mg, 10ml"
                          }
                        />
                        {(medication.standard_dosage_adult || (medication.strengths && medication.strengths.length > 0)) && !medication.dosage && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {medication.standard_dosage_adult && (
                              <p><strong>Standard Adult Dose:</strong> {medication.standard_dosage_adult}</p>
                            )}
                            {medication.strengths && medication.strengths.length > 0 && (
                              <p><strong>Available Strengths:</strong> {medication.strengths.slice(0, 3).join(', ')}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Frequency */}
                      <div className="space-y-2">
                        <Label>Frequency <span className="text-destructive">*</span></Label>
                        <Select
                          value={medication.frequency}
                          onValueChange={(value) => updateMedication(medicationIndex, 'frequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {MEDICATION_FREQUENCIES.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {freq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label htmlFor={`duration_${medicationIndex}`}>
                          Duration <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(medicationIndex, 'duration', e.target.value)}
                          placeholder="e.g., 7 days, 2 weeks"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Route */}
                      <div className="space-y-2">
                        <Label>Route <span className="text-destructive">*</span></Label>
                        <Select
                          value={medication.route}
                          onValueChange={(value) => updateMedication(medicationIndex, 'route', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              medication.dosage_forms?.[0] 
                                ? `Suggested: ${getSuggestedRoute(medication.dosage_forms[0])}` 
                                : "Select route"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Show medicine-specific routes first if available */}
                            {medication.routes && medication.routes.length > 0 && (
                              <>
                                {medication.routes.map((route) => (
                                  <SelectItem key={route} value={route}>
                                    {route} <span className="ml-2 text-xs text-green-600">(Medicine specific)</span>
                                  </SelectItem>
                                ))}
                                <div className="px-2 py-1 text-xs text-muted-foreground border-t">Other routes:</div>
                              </>
                            )}
                            {MEDICATION_ROUTES.filter(route => !(medication.routes || []).includes(route)).map((route) => (
                              <SelectItem key={route} value={route}>
                                {route}
                                {medication.dosage_forms?.[0] && getSuggestedRoute(medication.dosage_forms[0]) === route && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Suggested)</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {medication.dosage_forms && medication.dosage_forms.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Available Forms: {medication.dosage_forms.slice(0, 3).join(', ')}
                            {medication.dosage_forms.length > 3 && '...'}
                          </p>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="space-y-2">
                        <Label htmlFor={`instructions_${medicationIndex}`}>Instructions</Label>
                        <Input
                          value={medication.instructions}
                          onChange={(e) => updateMedication(medicationIndex, 'instructions', e.target.value)}
                          placeholder="e.g., Take with food, Before meals"
                        />
                      </div>
                    </div>

                    {medication.is_critical && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          This medication is marked as critical. Ensure patient understands the importance of compliance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )))}

              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Medication
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Non-pharmacological Interventions Tab */}
        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Non-pharmacological Interventions
              </CardTitle>
              <CardDescription>
                Physical therapy, counseling, and other non-drug treatments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.non_pharmacological.map((intervention, interventionIndex) => (
                <Card key={interventionIndex} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Intervention {interventionIndex + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntervention(interventionIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Intervention Type</Label>
                        <Select
                          value={intervention.intervention_type}
                          onValueChange={(value) => 
                            updateIntervention(interventionIndex, 'intervention_type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {INTERVENTION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`intervention_frequency_${interventionIndex}`}>Frequency</Label>
                        <Input
                          value={intervention.frequency}
                          onChange={(e) => updateIntervention(interventionIndex, 'frequency', e.target.value)}
                          placeholder="e.g., 3 times per week, Daily"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`intervention_description_${interventionIndex}`}>Description</Label>
                      <Textarea
                        value={intervention.description}
                        onChange={(e) => updateIntervention(interventionIndex, 'description', e.target.value)}
                        placeholder="Detailed description of the intervention..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`intervention_duration_${interventionIndex}`}>Duration</Label>
                        <Input
                          value={intervention.duration}
                          onChange={(e) => updateIntervention(interventionIndex, 'duration', e.target.value)}
                          placeholder="e.g., 4 weeks, 3 months"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`intervention_instructions_${interventionIndex}`}>Instructions</Label>
                        <Input
                          value={intervention.instructions}
                          onChange={(e) => updateIntervention(interventionIndex, 'instructions', e.target.value)}
                          placeholder="Special instructions for the patient"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addIntervention}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Intervention
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifestyle Modifications Tab */}
        <TabsContent value="lifestyle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Lifestyle Modifications
              </CardTitle>
              <CardDescription>
                Diet, exercise, and lifestyle changes to improve health outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.lifestyle_modifications.map((modification, lifestyleIndex) => (
                <Card key={lifestyleIndex} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Modification {lifestyleIndex + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLifestyleModification(lifestyleIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={modification.category}
                          onValueChange={(value) => 
                            updateLifestyleModification(lifestyleIndex, 'category', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIFESTYLE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`target_${lifestyleIndex}`}>Target/Goal</Label>
                        <Input
                          value={modification.target}
                          onChange={(e) => updateLifestyleModification(lifestyleIndex, 'target', e.target.value)}
                          placeholder="e.g., Lose 5kg, Walk 30min daily"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`modification_${lifestyleIndex}`}>Modification Details</Label>
                      <Textarea
                        value={modification.modification}
                        onChange={(e) => updateLifestyleModification(lifestyleIndex, 'modification', e.target.value)}
                        placeholder="Specific lifestyle changes recommended..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`timeline_${lifestyleIndex}`}>Timeline</Label>
                      <Input
                        value={modification.timeline}
                        onChange={(e) => updateLifestyleModification(lifestyleIndex, 'timeline', e.target.value)}
                        placeholder="e.g., Start immediately, Within 2 weeks"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addLifestyleModification}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lifestyle Modification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Follow-up Plan
              </CardTitle>
              <CardDescription>
                Schedule follow-up appointments and provide patient instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    value={formData.follow_up.follow_up_date}
                    onChange={(e) => updateFollowUp('follow_up_date', e.target.value)}
                    type="date"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="emergency_contact"
                    checked={formData.follow_up.emergency_contact_needed || false}
                    onCheckedChange={(checked) => 
                      updateFollowUp('emergency_contact_needed', checked as boolean)
                    }
                  />
                  <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Emergency contact needed
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_instructions">Follow-up Instructions</Label>
                <Textarea
                  value={formData.follow_up.follow_up_instructions}
                  onChange={(e) => updateFollowUp('follow_up_instructions', e.target.value)}
                  placeholder="Instructions for the patient regarding follow-up care..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning_signs">Warning Signs</Label>
                <Textarea
                  value={formData.follow_up.warning_signs}
                  onChange={(e) => updateFollowUp('warning_signs', e.target.value)}
                  placeholder="Symptoms that require immediate medical attention..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} type="button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back: Investigations
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? 'Saving...' : (
            <>
              Complete Consultation
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <Pill className="h-4 w-4" />
          <AlertDescription>
            Please check the treatment plan for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}