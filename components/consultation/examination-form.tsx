'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { useAutoSave } from '@/lib/hooks/useAutoSave'

// Types
import { ExaminationFinding, ConsultationVitals, ExaminationType } from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, X, ArrowLeft, ArrowRight, Search, Heart, Stethoscope, Activity, Calculator } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

// Form data types
type VitalsData = {
  temperature: number | null
  pulse_rate: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  respiratory_rate: number | null
  oxygen_saturation: number | null
  height_cm: number | null
  weight_kg: number | null
  bmi: number | null
  pain_score: number | null
}

type ExaminationData = {
  examination_type: ExaminationType
  findings: Record<string, any>
  normal_findings: string[]
  abnormal_findings: string[]
  clinical_significance: string
  examination_order: number
}

type ExaminationFormData = {
  vitals: VitalsData
  examinations: ExaminationData[]
}

interface ExaminationFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

// Examination system options
const EXAMINATION_SYSTEMS: Array<{
  type: ExaminationType
  label: string
  icon: string
  color: string
  commonFindings: string[]
  normalFindings: string[]
}> = [
  {
    type: 'general',
    label: 'General Examination',
    icon: 'Search',
    color: 'text-blue-600',
    commonFindings: ['Well-nourished', 'Alert and oriented', 'No distress', 'Good hygiene', 'Cooperative'],
    normalFindings: ['Afebrile', 'Well-appearing', 'No acute distress', 'Good nutritional status', 'Appropriate mood and affect']
  },
  {
    type: 'cardiovascular',
    label: 'Cardiovascular System',
    icon: 'Heart',
    color: 'text-red-600',
    commonFindings: ['Regular rhythm', 'No murmur', 'Normal S1 S2', 'Good peripheral pulses', 'No edema'],
    normalFindings: ['Heart rate regular', 'Normal heart sounds', 'No gallop or murmur', 'Good peripheral circulation', 'No cyanosis']
  },
  {
    type: 'respiratory',
    label: 'Respiratory System', 
    icon: 'Activity',
    color: 'text-cyan-600',
    commonFindings: ['Clear lungs', 'Equal air entry', 'No wheeze', 'Normal respiratory effort', 'No cough'],
    normalFindings: ['Clear to auscultation bilaterally', 'Good air entry', 'No adventitious sounds', 'Normal respiratory pattern']
  },
  {
    type: 'abdominal',
    label: 'Abdominal Examination',
    icon: 'Circle',
    color: 'text-orange-600',
    commonFindings: ['Soft abdomen', 'No tenderness', 'Normal bowel sounds', 'No masses', 'No organomegaly'],
    normalFindings: ['Soft and non-tender', 'Normal bowel sounds', 'No palpable masses', 'No hepatosplenomegaly']
  },
  {
    type: 'neurological',
    label: 'Neurological Examination',
    icon: 'Brain',
    color: 'text-purple-600',
    commonFindings: ['Alert and oriented', 'Normal reflexes', 'Normal motor function', 'Normal sensation', 'Stable gait'],
    normalFindings: ['Cranial nerves intact', 'Motor strength 5/5', 'Deep tendon reflexes 2+ bilaterally', 'Intact sensation']
  },
  {
    type: 'musculoskeletal',
    label: 'Musculoskeletal System',
    icon: 'Bone',
    color: 'text-green-600',
    commonFindings: ['Normal range of motion', 'No joint swelling', 'Normal muscle strength', 'No deformity', 'Good mobility'],
    normalFindings: ['Full range of motion', 'No joint tenderness', 'Normal muscle bulk and tone', 'No skeletal deformity']
  }
]

export function ExaminationForm({ consultationId, onNext, onPrevious }: ExaminationFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingVitals, setExistingVitals] = useState<ConsultationVitals[]>([])
  const [existingExaminations, setExistingExaminations] = useState<ExaminationFinding[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ExaminationFormData>({
    vitals: {
      temperature: null,
      pulse_rate: null,
      blood_pressure_systolic: null,
      blood_pressure_diastolic: null,
      respiratory_rate: null,
      oxygen_saturation: null,
      height_cm: null,
      weight_kg: null,
      bmi: null,
      pain_score: null
    },
    examinations: EXAMINATION_SYSTEMS.slice(0, 3).map((system, index) => ({
      examination_type: system.type,
      findings: {},
      normal_findings: [],
      abnormal_findings: [],
      clinical_significance: '',
      examination_order: index + 1
    }))
  })

  // Auto-save functionality
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    formData,
    'examination_data',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: ExaminationFormData) => {
        // Save vitals if any vital signs are provided
        const hasVitals = Object.values(data.vitals).some(value => value !== null && value !== undefined)
        if (hasVitals) {
          // Delete existing vitals first
          await supabase
            .from('consultation_vitals')
            .delete()
            .eq('consultation_id', consultationId)

          // Insert new vitals
          const { error: vitalsError } = await supabase
            .from('consultation_vitals')
            .insert([{
              consultation_id: consultationId,
              ...data.vitals,
              recorded_at: new Date().toISOString()
            }])

          if (vitalsError) throw vitalsError
        }

        // Save examination findings
        const validExaminations = data.examinations.filter(exam => 
          exam.normal_findings.length > 0 || exam.abnormal_findings.length > 0 || exam.clinical_significance.trim() !== ''
        )

        if (validExaminations.length > 0) {
          // Delete existing examinations first
          await supabase
            .from('examination_findings')
            .delete()
            .eq('consultation_id', consultationId)

          // Insert new examinations
          const examsToInsert = validExaminations.map(exam => ({
            consultation_id: consultationId,
            examination_type: exam.examination_type,
            findings: exam.findings,
            normal_findings: exam.normal_findings,
            abnormal_findings: exam.abnormal_findings,
            clinical_significance: exam.clinical_significance,
            examination_order: exam.examination_order
          }))

          const { error: examsError } = await supabase
            .from('examination_findings')
            .insert(examsToInsert)

          if (examsError) throw examsError
        }
      },
      onError: (error) => {
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Auto-calculate BMI
  useEffect(() => {
    const { height_cm, weight_kg } = formData.vitals
    if (height_cm && weight_kg && height_cm > 0) {
      const heightInM = height_cm / 100
      const bmi = weight_kg / (heightInM * heightInM)
      setFormData(prev => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          bmi: Math.round(bmi * 10) / 10
        }
      }))
    }
  }, [formData.vitals.height_cm, formData.vitals.weight_kg])

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Load vitals
        const { data: vitalsData, error: vitalsError } = await supabase
          .from('consultation_vitals')
          .select('*')
          .eq('consultation_id', consultationId)
          .order('recorded_at', { ascending: false })

        if (vitalsError && vitalsError.code !== 'PGRST116') {
          throw vitalsError
        }

        if (vitalsData && vitalsData.length > 0) {
          setExistingVitals(vitalsData)
          const latestVitals = vitalsData[0]
          setFormData(prev => ({
            ...prev,
            vitals: {
              temperature: latestVitals.temperature,
              pulse_rate: latestVitals.pulse_rate,
              blood_pressure_systolic: latestVitals.blood_pressure_systolic,
              blood_pressure_diastolic: latestVitals.blood_pressure_diastolic,
              respiratory_rate: latestVitals.respiratory_rate,
              oxygen_saturation: latestVitals.oxygen_saturation,
              height_cm: latestVitals.height_cm,
              weight_kg: latestVitals.weight_kg,
              bmi: latestVitals.bmi,
              pain_score: latestVitals.pain_score
            }
          }))
        }

        // Load examination findings
        const { data: examsData, error: examsError } = await supabase
          .from('examination_findings')
          .select('*')
          .eq('consultation_id', consultationId)
          .order('examination_order', { ascending: true })

        if (examsError && examsError.code !== 'PGRST116') {
          throw examsError
        }

        if (examsData && examsData.length > 0) {
          setExistingExaminations(examsData)
          const examinations = examsData.map(exam => ({
            examination_type: exam.examination_type,
            findings: exam.findings || {},
            normal_findings: exam.normal_findings || [],
            abnormal_findings: exam.abnormal_findings || [],
            clinical_significance: exam.clinical_significance || '',
            examination_order: exam.examination_order
          }))
          setFormData(prev => ({ ...prev, examinations }))
        }
      } catch (err) {
        console.error('Error loading examination data:', err)
        toast.error('Failed to load existing examination data')
      } finally {
        setLoading(false)
      }
    }

    loadExistingData()
  }, [consultationId, supabase])

  // Helper functions
  const updateVitals = (field: keyof VitalsData, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value
      }
    }))
  }

  const updateExamination = (index: number, field: keyof ExaminationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      examinations: prev.examinations.map((exam, i) => 
        i === index ? { ...exam, [field]: value } : exam
      )
    }))
  }

  const addNormalFinding = (examIndex: number, finding: string) => {
    const exam = formData.examinations[examIndex]
    if (!exam.normal_findings.includes(finding)) {
      updateExamination(examIndex, 'normal_findings', [...exam.normal_findings, finding])
    }
  }

  const removeNormalFinding = (examIndex: number, finding: string) => {
    const exam = formData.examinations[examIndex]
    updateExamination(examIndex, 'normal_findings', exam.normal_findings.filter(f => f !== finding))
  }

  const addAbnormalFinding = (examIndex: number, finding: string) => {
    const exam = formData.examinations[examIndex]
    if (!exam.abnormal_findings.includes(finding)) {
      updateExamination(examIndex, 'abnormal_findings', [...exam.abnormal_findings, finding])
    }
  }

  const removeAbnormalFinding = (examIndex: number, finding: string) => {
    const exam = formData.examinations[examIndex]
    updateExamination(examIndex, 'abnormal_findings', exam.abnormal_findings.filter(f => f !== finding))
  }

  const addExaminationSystem = (systemType: ExaminationType) => {
    const system = EXAMINATION_SYSTEMS.find(s => s.type === systemType)
    if (system && !formData.examinations.some(e => e.examination_type === systemType)) {
      const newExam: ExaminationData = {
        examination_type: systemType,
        findings: {},
        normal_findings: [],
        abnormal_findings: [],
        clinical_significance: '',
        examination_order: formData.examinations.length + 1
      }
      setFormData(prev => ({
        ...prev,
        examinations: [...prev.examinations, newExam]
      }))
    }
  }

  const removeExaminationSystem = (index: number) => {
    if (formData.examinations.length > 1) {
      setFormData(prev => ({
        ...prev,
        examinations: prev.examinations.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setErrors({})
      await forceSave() // Force save current data
      toast.success('Examination findings saved successfully')
      onNext()
    } catch (err) {
      console.error('Error saving examination:', err)
      toast.error('Failed to save examination findings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading examination data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Physical Examination</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Record vital signs and systematic physical examination findings. Changes are automatically saved as you type.
        </p>
      </div>

      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Vital Signs
          </TabsTrigger>
          <TabsTrigger value="examination" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Physical Examination
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Vital Signs
              </CardTitle>
              <CardDescription>
                Record patient's vital signs and basic measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vitals.temperature || ''}
                    onChange={(e) => updateVitals('temperature', parseFloat(e.target.value) || null)}
                    placeholder="36.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={formData.vitals.pulse_rate || ''}
                    onChange={(e) => updateVitals('pulse_rate', parseInt(e.target.value) || null)}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Blood Pressure (mmHg)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.vitals.blood_pressure_systolic || ''}
                      onChange={(e) => updateVitals('blood_pressure_systolic', parseInt(e.target.value) || null)}
                      placeholder="120"
                    />
                    <span className="flex items-center">/</span>
                    <Input
                      type="number"
                      value={formData.vitals.blood_pressure_diastolic || ''}
                      onChange={(e) => updateVitals('blood_pressure_diastolic', parseInt(e.target.value) || null)}
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Respiratory Rate (per min)</Label>
                  <Input
                    type="number"
                    value={formData.vitals.respiratory_rate || ''}
                    onChange={(e) => updateVitals('respiratory_rate', parseInt(e.target.value) || null)}
                    placeholder="16"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Oxygen Saturation (%)</Label>
                  <Input
                    type="number"
                    max="100"
                    value={formData.vitals.oxygen_saturation || ''}
                    onChange={(e) => updateVitals('oxygen_saturation', parseInt(e.target.value) || null)}
                    placeholder="98"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pain Score (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.vitals.pain_score || ''}
                    onChange={(e) => updateVitals('pain_score', parseInt(e.target.value) || null)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vitals.height_cm || ''}
                    onChange={(e) => updateVitals('height_cm', parseFloat(e.target.value) || null)}
                    placeholder="170"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vitals.weight_kg || ''}
                    onChange={(e) => updateVitals('weight_kg', parseFloat(e.target.value) || null)}
                    placeholder="70"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    BMI
                    <Calculator className="w-3 h-3" />
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vitals.bmi || ''}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-calculated"
                  />
                  {formData.vitals.bmi && (
                    <p className="text-xs text-muted-foreground">
                      {formData.vitals.bmi < 18.5 ? 'Underweight' : 
                       formData.vitals.bmi < 25 ? 'Normal weight' : 
                       formData.vitals.bmi < 30 ? 'Overweight' : 'Obese'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examination" className="space-y-4">
          {formData.examinations.map((examination, examIndex) => {
            const system = EXAMINATION_SYSTEMS.find(s => s.type === examination.examination_type)
            if (!system) return null

            return (
              <Card key={examIndex} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {system.label}
                    </CardTitle>
                    {formData.examinations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExaminationSystem(examIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Normal Findings */}
                  <div className="space-y-2">
                    <Label>Normal Findings</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {examination.normal_findings.map((finding, index) => (
                        <Badge key={index} variant="default" className="cursor-pointer bg-green-100 text-green-800">
                          {finding}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-green-800"
                            onClick={() => removeNormalFinding(examIndex, finding)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {system.normalFindings.map((finding) => (
                        <Button
                          key={finding}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addNormalFinding(examIndex, finding)}
                          disabled={examination.normal_findings.includes(finding)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {finding}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Abnormal Findings */}
                  <div className="space-y-2">
                    <Label>Abnormal Findings</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {examination.abnormal_findings.map((finding, index) => (
                        <Badge key={index} variant="destructive" className="cursor-pointer">
                          {finding}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0 hover:bg-white hover:text-destructive"
                            onClick={() => removeAbnormalFinding(examIndex, finding)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add custom abnormal finding..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addAbnormalFinding(examIndex, e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>

                  {/* Clinical Significance */}
                  <div className="space-y-2">
                    <Label>Clinical Significance</Label>
                    <Textarea
                      value={examination.clinical_significance}
                      onChange={(e) => updateExamination(examIndex, 'clinical_significance', e.target.value)}
                      placeholder="Clinical interpretation and significance of findings..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Add System */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Examination System</CardTitle>
              <CardDescription>
                Add additional body systems to examine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXAMINATION_SYSTEMS.filter(system => 
                  !formData.examinations.some(e => e.examination_type === system.type)
                ).map((system) => (
                  <Button
                    key={system.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3"
                    onClick={() => addExaminationSystem(system.type)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-xs">{system.label}</div>
                      <div className="text-xs text-muted-foreground">{system.type}</div>
                    </div>
                  </Button>
                ))}
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
          Back: History
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? 'Saving...' : (
            <>
              Next: Diagnosis
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <Search className="h-4 w-4" />
          <AlertDescription>
            Please check the examination form for errors and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}