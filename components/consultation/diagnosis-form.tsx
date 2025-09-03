'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { useAutoSave } from '@/lib/hooks/useAutoSave'

// Types
import { ConsultationDiagnosis, DiagnosisType } from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, X, ArrowLeft, ArrowRight, Stethoscope, Search, Target, Star, AlertTriangle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

// Form data types
type DiagnosisData = {
  diagnosis_type: DiagnosisType
  diagnosis_text: string
  icd10_code: string
  icd10_description: string
  confidence_level: number
  is_primary: boolean
  supporting_evidence: string[]
  ruling_out_evidence: string[]
  clinical_notes: string
}

type DiagnosisFormData = {
  diagnoses: DiagnosisData[]
}

interface DiagnosisFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

// Common diagnosis options organized by specialty
const COMMON_DIAGNOSES: Record<string, Array<{
  text: string
  icd10: string
  description: string
}>> = {
  'General': [
    { text: 'Viral upper respiratory tract infection', icd10: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
    { text: 'Essential hypertension', icd10: 'I10', description: 'Essential (primary) hypertension' },
    { text: 'Type 2 diabetes mellitus', icd10: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { text: 'Gastroesophageal reflux disease', icd10: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
    { text: 'Tension-type headache', icd10: 'G44.2', description: 'Tension-type headache' },
    { text: 'Lower back pain', icd10: 'M54.5', description: 'Low back pain' },
    { text: 'Acute bronchitis', icd10: 'J20.9', description: 'Acute bronchitis, unspecified' },
    { text: 'Urinary tract infection', icd10: 'N39.0', description: 'Urinary tract infection, site not specified' }
  ],
  'Cardiology': [
    { text: 'Atrial fibrillation', icd10: 'I48.9', description: 'Atrial fibrillation, unspecified' },
    { text: 'Coronary artery disease', icd10: 'I25.9', description: 'Chronic ischemic heart disease, unspecified' },
    { text: 'Heart failure', icd10: 'I50.9', description: 'Heart failure, unspecified' },
    { text: 'Chest pain', icd10: 'R06.02', description: 'Shortness of breath' }
  ],
  'Respiratory': [
    { text: 'Asthma', icd10: 'J45.9', description: 'Asthma, unspecified' },
    { text: 'Chronic obstructive pulmonary disease', icd10: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation' },
    { text: 'Pneumonia', icd10: 'J18.9', description: 'Pneumonia, unspecified organism' },
    { text: 'Dyspnea', icd10: 'R06.02', description: 'Shortness of breath' }
  ],
  'Gastrointestinal': [
    { text: 'Irritable bowel syndrome', icd10: 'K58.9', description: 'Irritable bowel syndrome without diarrhea' },
    { text: 'Peptic ulcer disease', icd10: 'K27.9', description: 'Peptic ulcer, site unspecified, unspecified as acute or chronic, without hemorrhage or perforation' },
    { text: 'Gastritis', icd10: 'K29.70', description: 'Gastritis, unspecified, without bleeding' },
    { text: 'Constipation', icd10: 'K59.00', description: 'Constipation, unspecified' }
  ],
  'Endocrine': [
    { text: 'Hypothyroidism', icd10: 'E03.9', description: 'Hypothyroidism, unspecified' },
    { text: 'Hyperthyroidism', icd10: 'E05.90', description: 'Thyrotoxicosis, unspecified without thyrotoxic crisis or storm' },
    { text: 'Metabolic syndrome', icd10: 'E88.81', description: 'Metabolic syndrome' },
    { text: 'Obesity', icd10: 'E66.9', description: 'Obesity, unspecified' }
  ]
}

const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Very Low', description: 'Uncertain diagnosis', color: 'text-red-600' },
  { value: 2, label: 'Low', description: 'Possible diagnosis', color: 'text-orange-600' },
  { value: 3, label: 'Moderate', description: 'Probable diagnosis', color: 'text-yellow-600' },
  { value: 4, label: 'High', description: 'Likely diagnosis', color: 'text-blue-600' },
  { value: 5, label: 'Very High', description: 'Definite diagnosis', color: 'text-green-600' }
]

const DIAGNOSIS_TYPES: Array<{ value: DiagnosisType; label: string; description: string }> = [
  { value: 'provisional', label: 'Provisional', description: 'Working diagnosis based on current findings' },
  { value: 'differential', label: 'Differential', description: 'Alternative diagnosis to consider' },
  { value: 'final', label: 'Final', description: 'Confirmed diagnosis with supporting evidence' }
]

export function DiagnosisForm({ consultationId, onNext, onPrevious }: DiagnosisFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingDiagnoses, setExistingDiagnoses] = useState<ConsultationDiagnosis[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('General')
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<DiagnosisFormData>({
    diagnoses: [{
      diagnosis_type: 'provisional' as DiagnosisType,
      diagnosis_text: '',
      icd10_code: '',
      icd10_description: '',
      confidence_level: 3,
      is_primary: true,
      supporting_evidence: [],
      ruling_out_evidence: [],
      clinical_notes: ''
    }]
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    formData,
    'consultation_diagnoses',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: DiagnosisFormData) => {
        // Custom save logic for diagnoses
        const validDiagnoses = data.diagnoses.filter(diagnosis => 
          diagnosis.diagnosis_text.trim() !== ''
        )
        
        if (validDiagnoses.length === 0) {
          return // Don't save empty diagnoses
        }

        // Delete existing diagnoses first
        await supabase
          .from('consultation_diagnoses')
          .delete()
          .eq('consultation_id', consultationId)

        // Insert new diagnoses
        const diagnosesToInsert = validDiagnoses.map(diagnosis => ({
          consultation_id: consultationId,
          diagnosis_type: diagnosis.diagnosis_type,
          diagnosis_text: diagnosis.diagnosis_text,
          icd10_code: diagnosis.icd10_code || null,
          icd10_description: diagnosis.icd10_description || null,
          confidence_level: diagnosis.confidence_level,
          is_primary: diagnosis.is_primary,
          supporting_evidence: diagnosis.supporting_evidence,
          ruling_out_evidence: diagnosis.ruling_out_evidence,
          clinical_notes: diagnosis.clinical_notes || null
        }))

        const { error } = await supabase
          .from('consultation_diagnoses')
          .insert(diagnosesToInsert)

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

  // Load existing diagnoses
  useEffect(() => {
    const loadExistingDiagnoses = async () => {
      try {
        const { data, error } = await supabase
          .from('consultation_diagnoses')
          .select('*')
          .eq('consultation_id', consultationId)
          .order('created_at', { ascending: true })

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data && data.length > 0) {
          setExistingDiagnoses(data)
          
          // Pre-populate form with existing data
          const diagnoses = data.map(diagnosis => ({
            diagnosis_type: diagnosis.diagnosis_type,
            diagnosis_text: diagnosis.diagnosis_text,
            icd10_code: diagnosis.icd10_code || '',
            icd10_description: diagnosis.icd10_description || '',
            confidence_level: diagnosis.confidence_level || 3,
            is_primary: diagnosis.is_primary || false,
            supporting_evidence: diagnosis.supporting_evidence || [],
            ruling_out_evidence: diagnosis.ruling_out_evidence || [],
            clinical_notes: diagnosis.clinical_notes || ''
          }))
          
          setFormData({ diagnoses })
        }
      } catch (err) {
        console.error('Error loading diagnoses:', err)
        toast.error('Failed to load existing diagnoses')
      } finally {
        setLoading(false)
      }
    }

    loadExistingDiagnoses()
  }, [consultationId, supabase])

  // Helper functions
  const addDiagnosis = () => {
    setFormData(prev => ({
      diagnoses: [...prev.diagnoses, {
        diagnosis_type: 'differential' as DiagnosisType,
        diagnosis_text: '',
        icd10_code: '',
        icd10_description: '',
        confidence_level: 3,
        is_primary: false,
        supporting_evidence: [],
        ruling_out_evidence: [],
        clinical_notes: ''
      }]
    }))
  }

  const removeDiagnosis = (index: number) => {
    if (formData.diagnoses.length > 1) {
      setFormData(prev => ({
        diagnoses: prev.diagnoses.filter((_, i) => i !== index)
      }))
    }
  }

  const updateDiagnosis = (index: number, field: keyof DiagnosisData, value: any) => {
    setFormData(prev => ({
      diagnoses: prev.diagnoses.map((diagnosis, i) => 
        i === index ? { ...diagnosis, [field]: value } : diagnosis
      )
    }))
  }

  const selectCommonDiagnosis = (index: number, diagnosis: typeof COMMON_DIAGNOSES['General'][0]) => {
    updateDiagnosis(index, 'diagnosis_text', diagnosis.text)
    updateDiagnosis(index, 'icd10_code', diagnosis.icd10)
    updateDiagnosis(index, 'icd10_description', diagnosis.description)
  }

  const addEvidence = (index: number, type: 'supporting' | 'ruling_out', evidence: string) => {
    const field = type === 'supporting' ? 'supporting_evidence' : 'ruling_out_evidence'
    const currentEvidence = formData.diagnoses[index][field]
    if (evidence.trim() && !currentEvidence.includes(evidence)) {
      updateDiagnosis(index, field, [...currentEvidence, evidence])
    }
  }

  const removeEvidence = (index: number, type: 'supporting' | 'ruling_out', evidence: string) => {
    const field = type === 'supporting' ? 'supporting_evidence' : 'ruling_out_evidence'
    const currentEvidence = formData.diagnoses[index][field]
    updateDiagnosis(index, field, currentEvidence.filter(e => e !== evidence))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const validDiagnoses = formData.diagnoses.filter(diagnosis => 
      diagnosis.diagnosis_text.trim() !== ''
    )
    
    if (validDiagnoses.length === 0) {
      toast.error('At least one diagnosis is required')
      return
    }

    try {
      setSaving(true)
      setErrors({})
      await forceSave() // Force save current data
      toast.success('Diagnoses saved successfully')
      onNext()
    } catch (err) {
      console.error('Error saving diagnoses:', err)
      toast.error('Failed to save diagnoses')
    } finally {
      setSaving(false)
    }
  }

  // Filter common diagnoses based on search
  const filteredDiagnoses = COMMON_DIAGNOSES[selectedCategory]?.filter(diagnosis =>
    diagnosis.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diagnosis.icd10.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading diagnoses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold">Clinical Diagnosis</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Formulate provisional, differential, and final diagnoses with ICD-10 codes and evidence. Changes are automatically saved as you type.
        </p>
      </div>

      {/* Final Diagnosis Requirement Alert */}
      {(() => {
        const hasFinalDiagnosis = formData.diagnoses.some(
          diagnosis => diagnosis.diagnosis_type === 'final' && diagnosis.is_primary
        )
        
        if (!hasFinalDiagnosis) {
          return (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required:</strong> At least one final diagnosis must be marked as primary to complete the consultation. 
                Provisional and differential diagnoses are helpful for clinical reasoning but are not sufficient for completion.
              </AlertDescription>
            </Alert>
          )
        }
        
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Complete:</strong> Final diagnosis requirement satisfied. The consultation can be completed.
            </AlertDescription>
          </Alert>
        )
      })()}

      {formData.diagnoses.map((diagnosis, diagnosisIndex) => (
        <Card key={diagnosisIndex} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Diagnosis {diagnosisIndex + 1}
                {diagnosis.is_primary && <Badge variant="default" className="ml-2">Primary</Badge>}
              </CardTitle>
              {formData.diagnoses.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDiagnosis(diagnosisIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Diagnosis Type and Primary Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Diagnosis Type</Label>
                <Select
                  value={diagnosis.diagnosis_type}
                  onValueChange={(value: DiagnosisType) => 
                    updateDiagnosis(diagnosisIndex, 'diagnosis_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select
                  value={diagnosis.confidence_level.toString()}
                  onValueChange={(value) => 
                    updateDiagnosis(diagnosisIndex, 'confidence_level', parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span className={level.color}>{level.label}</span>
                          <span className="text-xs text-muted-foreground">({level.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Diagnosis</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`primary_${diagnosisIndex}`}
                    checked={diagnosis.is_primary}
                    onCheckedChange={(checked) => {
                      // If setting as primary, unset others
                      if (checked) {
                        setFormData(prev => ({
                          diagnoses: prev.diagnoses.map((d, i) => ({
                            ...d,
                            is_primary: i === diagnosisIndex
                          }))
                        }))
                      } else {
                        updateDiagnosis(diagnosisIndex, 'is_primary', false)
                      }
                    }}
                  />
                  <Label htmlFor={`primary_${diagnosisIndex}`}>
                    Mark as primary diagnosis
                  </Label>
                </div>
              </div>
            </div>

            {/* Diagnosis Text and ICD-10 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diagnosis <span className="text-destructive">*</span></Label>
                <Textarea
                  value={diagnosis.diagnosis_text}
                  onChange={(e) => updateDiagnosis(diagnosisIndex, 'diagnosis_text', e.target.value)}
                  placeholder="Enter the diagnosis..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>ICD-10 Code</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={diagnosis.icd10_code}
                    onChange={(e) => updateDiagnosis(diagnosisIndex, 'icd10_code', e.target.value)}
                    placeholder="E.g., J06.9"
                  />
                  <Input
                    value={diagnosis.icd10_description}
                    onChange={(e) => updateDiagnosis(diagnosisIndex, 'icd10_description', e.target.value)}
                    placeholder="ICD-10 description"
                  />
                </div>
              </div>
            </div>

            {/* Supporting and Ruling Out Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supporting Evidence</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {diagnosis.supporting_evidence.map((evidence, index) => (
                    <Badge key={index} variant="default" className="cursor-pointer bg-green-100 text-green-800">
                      {evidence}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-green-800"
                        onClick={() => removeEvidence(diagnosisIndex, 'supporting', evidence)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add supporting evidence (press Enter)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addEvidence(diagnosisIndex, 'supporting', e.currentTarget.value.trim())
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Ruling Out Evidence</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {diagnosis.ruling_out_evidence.map((evidence, index) => (
                    <Badge key={index} variant="destructive" className="cursor-pointer">
                      {evidence}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-destructive"
                        onClick={() => removeEvidence(diagnosisIndex, 'ruling_out', evidence)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add ruling out evidence (press Enter)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addEvidence(diagnosisIndex, 'ruling_out', e.currentTarget.value.trim())
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-2">
              <Label>Clinical Notes</Label>
              <Textarea
                value={diagnosis.clinical_notes}
                onChange={(e) => updateDiagnosis(diagnosisIndex, 'clinical_notes', e.target.value)}
                placeholder="Additional clinical notes, reasoning, or follow-up considerations..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Another Diagnosis */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addDiagnosis}
          className="w-full max-w-xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Differential Diagnosis
        </Button>
      </div>

      {/* Common Diagnoses Quick Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Common Diagnoses</CardTitle>
          <CardDescription>
            Quick select from common diagnoses with ICD-10 codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(COMMON_DIAGNOSES).map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search diagnoses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {filteredDiagnoses.map((commonDx, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start h-auto p-3 text-left"
                onClick={() => selectCommonDiagnosis(0, commonDx)}
              >
                <div>
                  <div className="font-medium text-xs">{commonDx.text}</div>
                  <div className="text-xs text-muted-foreground">
                    {commonDx.icd10} - {commonDx.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} type="button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back: Examination
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? 'Saving...' : (
            <>
              Next: Investigations
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <Stethoscope className="h-4 w-4" />
          <AlertDescription>
            Please check the diagnosis form for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}