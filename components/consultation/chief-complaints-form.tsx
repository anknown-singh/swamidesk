'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAutoSave } from '@/lib/hooks/useAutoSave'

// Types
import { ConsultationChiefComplaint } from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
// import { Slider } from '@/components/ui/slider' // Using number input instead
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, X, AlertTriangle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

// Form data types
type ComplaintData = {
  complaint: string
  duration: string
  severity: number
  associated_symptoms: string[]
  onset: string
  character: string
  location: string
  radiation: string
  aggravating_factors: string[]
  relieving_factors: string[]
  timing: string
}

type FormData = {
  complaints: ComplaintData[]
}

interface ChiefComplaintsFormProps {
  consultationId: string
  visitData?: {
    chief_complaint?: string
    [key: string]: any
  }
  onNext: () => void
}

// Common medical options
const ONSET_OPTIONS = ['Sudden', 'Gradual', 'Acute', 'Chronic', 'Progressive', 'Intermittent']

const TIMING_OPTIONS = [
  'Morning', 'Afternoon', 'Evening', 'Night', 
  'After meals', 'Before meals', 'During sleep',
  'With activity', 'At rest', 'Continuous'
]

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Nausea', 'Vomiting', 'Dizziness',
  'Fatigue', 'Weight loss', 'Weight gain', 'Night sweats',
  'Shortness of breath', 'Chest pain', 'Palpitations',
  'Abdominal pain', 'Diarrhea', 'Constipation',
  'Joint pain', 'Muscle weakness', 'Skin rash'
]

const COMMON_AGGRAVATING_FACTORS = [
  'Physical activity', 'Stress', 'Cold weather', 'Hot weather',
  'Certain foods', 'Lying down', 'Standing', 'Walking',
  'Deep breathing', 'Coughing', 'Movement'
]

const COMMON_RELIEVING_FACTORS = [
  'Rest', 'Medication', 'Heat application', 'Cold application',
  'Position change', 'Deep breathing', 'Distraction',
  'Sleep', 'Food', 'Avoiding triggers'
]

export function ChiefComplaintsForm({ consultationId, visitData, onNext }: ChiefComplaintsFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingComplaints, setExistingComplaints] = useState<ConsultationChiefComplaint[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<FormData>({
    complaints: [{
      complaint: visitData?.chief_complaint || '',
      duration: '',
      severity: 5,
      associated_symptoms: [],
      onset: '',
      character: '',
      location: '',
      radiation: '',
      aggravating_factors: [],
      relieving_factors: [],
      timing: ''
    }]
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    formData,
    'consultation_chief_complaints',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: FormData) => {
        // Custom save logic for chief complaints
        const validComplaints = data.complaints.filter(c => c.complaint.trim() !== '')
        
        if (validComplaints.length === 0) {
          return // Don't save empty complaints
        }

        // Delete existing complaints first
        await supabase
          .from('consultation_chief_complaints')
          .delete()
          .eq('consultation_id', consultationId)

        // Insert new complaints
        const complaintsToInsert = validComplaints.map(complaint => ({
          consultation_id: consultationId,
          ...complaint
        }))

        const { error } = await supabase
          .from('consultation_chief_complaints')
          .insert(complaintsToInsert)

        if (error) throw error
      },
      onError: (error) => {
        // Only show error toast if it's not a missing table error
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Load existing complaints
  useEffect(() => {
    const loadExistingComplaints = async () => {
      try {
        const { data, error } = await supabase
          .from('consultation_chief_complaints')
          .select('*')
          .eq('consultation_id', consultationId)

        // Handle missing table gracefully
        if (error && error.code === 'PGRST116') {
          // Table doesn't exist yet - start with clean form
          console.log('Chief complaints table not found - starting with empty form')
          setExistingComplaints([])
          setLoading(false)
          return
        }

        if (error) throw error

        if (data && data.length > 0) {
          setExistingComplaints(data)
          
          // Pre-populate form with existing data
          const complaints = data.map(complaint => ({
            complaint: complaint.complaint,
            duration: complaint.duration || '',
            severity: complaint.severity || 5,
            associated_symptoms: complaint.associated_symptoms || [],
            onset: complaint.onset || '',
            character: complaint.character || '',
            location: complaint.location || '',
            radiation: complaint.radiation || '',
            aggravating_factors: complaint.aggravating_factors || [],
            relieving_factors: complaint.relieving_factors || [],
            timing: complaint.timing || ''
          }))
          
          setFormData({ complaints })
        } else if (visitData?.chief_complaint) {
          // No existing consultation data, but visit has chief complaint from receptionist
          setFormData({
            complaints: [{
              complaint: visitData.chief_complaint,
              duration: '',
              severity: 5,
              associated_symptoms: [],
              onset: '',
              character: '',
              location: '',
              radiation: '',
              aggravating_factors: [],
              relieving_factors: [],
              timing: ''
            }]
          })
        }
      } catch (err) {
        console.error('Error loading complaints:', err)
        // Don't show error toast for missing table - it's expected during initial setup
        if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
        }
      } finally {
        setLoading(false)
      }
    }

    loadExistingComplaints()
  }, [consultationId, visitData, supabase])

  const handleSubmit = async () => {
    // Validate required fields
    const validComplaints = formData.complaints.filter(c => c.complaint.trim() !== '')
    if (validComplaints.length === 0) {
      return
    }

    try {
      setSaving(true)
      await forceSave() // Force save current data
      onNext()
    } catch (err) {
      console.error('Error saving complaints:', err)
    } finally {
      setSaving(false)
    }
  }

  const addComplaint = () => {
    setFormData(prev => ({
      complaints: [...prev.complaints, {
        complaint: '',
        duration: '',
        severity: 5,
        associated_symptoms: [],
        onset: '',
        character: '',
        location: '',
        radiation: '',
        aggravating_factors: [],
        relieving_factors: [],
        timing: ''
      }]
    }))
  }

  const removeComplaint = (index: number) => {
    if (formData.complaints.length > 1) {
      setFormData(prev => ({
        complaints: prev.complaints.filter((_, i) => i !== index)
      }))
    }
  }

  const addSymptom = (complaintIndex: number, symptom: string) => {
    setFormData(prev => {
      const newComplaints = [...prev.complaints]
      const currentSymptoms = newComplaints[complaintIndex].associated_symptoms
      if (!currentSymptoms.includes(symptom)) {
        newComplaints[complaintIndex] = {
          ...newComplaints[complaintIndex],
          associated_symptoms: [...currentSymptoms, symptom]
        }
      }
      return { complaints: newComplaints }
    })
  }

  const removeSymptom = (complaintIndex: number, symptom: string) => {
    setFormData(prev => {
      const newComplaints = [...prev.complaints]
      newComplaints[complaintIndex] = {
        ...newComplaints[complaintIndex],
        associated_symptoms: newComplaints[complaintIndex].associated_symptoms.filter(s => s !== symptom)
      }
      return { complaints: newComplaints }
    })
  }

  const addFactor = (complaintIndex: number, factor: string, type: 'aggravating_factors' | 'relieving_factors') => {
    setFormData(prev => {
      const newComplaints = [...prev.complaints]
      const currentFactors = newComplaints[complaintIndex][type]
      if (!currentFactors.includes(factor)) {
        newComplaints[complaintIndex] = {
          ...newComplaints[complaintIndex],
          [type]: [...currentFactors, factor]
        }
      }
      return { complaints: newComplaints }
    })
  }

  const removeFactor = (complaintIndex: number, factor: string, type: 'aggravating_factors' | 'relieving_factors') => {
    setFormData(prev => {
      const newComplaints = [...prev.complaints]
      newComplaints[complaintIndex] = {
        ...newComplaints[complaintIndex],
        [type]: newComplaints[complaintIndex][type].filter(f => f !== factor)
      }
      return { complaints: newComplaints }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chief complaints...</p>
        </div>
      </div>
    )
  }

  const updateComplaint = (index: number, field: keyof ComplaintData, value: any) => {
    setFormData(prev => {
      const newComplaints = [...prev.complaints]
      newComplaints[index] = { ...newComplaints[index], [field]: value }
      return { complaints: newComplaints }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Chief Complaints</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Document the patient's primary concerns and symptoms that brought them to seek medical care.
          Changes are automatically saved as you type.
        </p>
      </div>

      {formData.complaints.map((complaint, complaintIndex) => (
        <Card key={complaintIndex} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Complaint {complaintIndex + 1}
              </CardTitle>
              {formData.complaints.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeComplaint(complaintIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Complaint */}
            <div className="space-y-2">
              <Label htmlFor={`complaints.${complaintIndex}.complaint`}>
                Chief Complaint <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={complaint.complaint}
                onChange={(e) => updateComplaint(complaintIndex, 'complaint', e.target.value)}
                placeholder="Describe the main symptom or concern..."
                className="min-h-[80px]"
              />
              {errors[`complaint_${complaintIndex}`] && (
                <p className="text-sm text-destructive">
                  {errors[`complaint_${complaintIndex}`]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor={`complaints.${complaintIndex}.duration`}>Duration</Label>
                <Input
                  value={complaint.duration}
                  onChange={(e) => updateComplaint(complaintIndex, 'duration', e.target.value)}
                  placeholder="e.g., 2 days, 1 week, 3 months"
                />
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label htmlFor={`severity_${complaintIndex}`}>
                  Severity (1-10 scale)
                </Label>
                <Input
                  value={complaint.severity}
                  onChange={(e) => updateComplaint(complaintIndex, 'severity', parseInt(e.target.value) || 5)}
                  type="number"
                  min="1"
                  max="10"
                  placeholder="5"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild (1)</span>
                  <span>Severe (10)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Onset */}
              <div className="space-y-2">
                <Label>Onset</Label>
                <Select
                  value={complaint.onset}
                  onValueChange={(value) => updateComplaint(complaintIndex, 'onset', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select onset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ONSET_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character */}
              <div className="space-y-2">
                <Label htmlFor={`complaints.${complaintIndex}.character`}>Character</Label>
                <Input
                  value={complaint.character}
                  onChange={(e) => updateComplaint(complaintIndex, 'character', e.target.value)}
                  placeholder="e.g., sharp, dull, burning, cramping"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor={`complaints.${complaintIndex}.location`}>Location</Label>
                <Input
                  value={complaint.location}
                  onChange={(e) => updateComplaint(complaintIndex, 'location', e.target.value)}
                  placeholder="e.g., chest, abdomen, head"
                />
              </div>

              {/* Radiation */}
              <div className="space-y-2">
                <Label htmlFor={`complaints.${complaintIndex}.radiation`}>Radiation</Label>
                <Input
                  value={complaint.radiation}
                  onChange={(e) => updateComplaint(complaintIndex, 'radiation', e.target.value)}
                  placeholder="Where does the symptom spread to?"
                />
              </div>
            </div>

            {/* Timing */}
            <div className="space-y-2">
              <Label>Timing</Label>
              <Select
                value={complaint.timing}
                onValueChange={(value) => updateComplaint(complaintIndex, 'timing', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When does it occur?" />
                </SelectTrigger>
                <SelectContent>
                  {TIMING_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Associated Symptoms */}
            <div className="space-y-2">
              <Label>Associated Symptoms</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {complaint.associated_symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {symptom}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSymptom(complaintIndex, symptom)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <Button
                    key={symptom}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSymptom(complaintIndex, symptom)}
                    disabled={complaint.associated_symptoms.includes(symptom)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {symptom}
                  </Button>
                ))}
              </div>
            </div>

            {/* Aggravating Factors */}
            <div className="space-y-2">
              <Label>Aggravating Factors</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {complaint.aggravating_factors.map((factor, index) => (
                  <Badge key={index} variant="destructive" className="cursor-pointer">
                    {factor}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-destructive"
                      onClick={() => removeFactor(complaintIndex, factor, 'aggravating_factors')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_AGGRAVATING_FACTORS.map((factor) => (
                  <Button
                    key={factor}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFactor(complaintIndex, factor, 'aggravating_factors')}
                    disabled={complaint.aggravating_factors.includes(factor)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {factor}
                  </Button>
                ))}
              </div>
            </div>

            {/* Relieving Factors */}
            <div className="space-y-2">
              <Label>Relieving Factors</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {complaint.relieving_factors.map((factor, index) => (
                  <Badge key={index} variant="default" className="cursor-pointer bg-green-100 text-green-800">
                    {factor}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-green-800"
                      onClick={() => removeFactor(complaintIndex, factor, 'relieving_factors')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_RELIEVING_FACTORS.map((factor) => (
                  <Button
                    key={factor}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFactor(complaintIndex, factor, 'relieving_factors')}
                    disabled={complaint.relieving_factors.includes(factor)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {factor}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Another Complaint */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addComplaint}
          className="w-full max-w-xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Complaint
        </Button>
      </div>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? 'Saving...' : (
            <>
              Next: History
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please check the form for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}