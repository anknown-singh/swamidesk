'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, FileText, Target, Lightbulb } from 'lucide-react'
import { BaseStepComponentProps } from '../shared/base-consultation-workflow'

interface DiagnosticCriteria {
  clinical: string[]
  radiographic: string[]
  laboratory: string[]
  histological: string[]
}

interface Diagnosis {
  id: string
  type: 'primary' | 'secondary' | 'differential'
  condition: string
  icdCode?: string
  severity: 'mild' | 'moderate' | 'severe'
  location: string
  notes: string
  confidence: number
  criteria: DiagnosticCriteria
}

interface DentalDiagnosisData {
  primaryDiagnosis: Diagnosis[]
  differentialDiagnosis: Diagnosis[]
  riskFactors: {
    systemic: string[]
    local: string[]
    behavioral: string[]
  }
  prognosis: {
    shortTerm: 'excellent' | 'good' | 'fair' | 'poor'
    longTerm: 'excellent' | 'good' | 'fair' | 'poor'
    factors: string[]
    notes: string
  }
  complications: {
    potential: string[]
    immediate: string[]
    longTerm: string[]
  }
  diagnosticUncertainty: {
    level: 'none' | 'minimal' | 'moderate' | 'high'
    factors: string[]
    additionalTestsNeeded: string[]
    consultationNeeded: boolean
    referralSpecialty?: string
  }
  clinicalNotes: string
}

const COMMON_DENTAL_DIAGNOSES = [
  { value: 'dental_caries', label: 'Dental Caries', icd: 'K02' },
  { value: 'pulpitis', label: 'Pulpitis', icd: 'K04.0' },
  { value: 'periodontitis', label: 'Periodontitis', icd: 'K05.3' },
  { value: 'gingivitis', label: 'Gingivitis', icd: 'K05.0' },
  { value: 'dental_abscess', label: 'Dental Abscess', icd: 'K04.7' },
  { value: 'tooth_fracture', label: 'Tooth Fracture', icd: 'S02.5' },
  { value: 'periapical_granuloma', label: 'Periapical Granuloma', icd: 'K04.5' },
  { value: 'root_resorption', label: 'Root Resorption', icd: 'K03.3' },
  { value: 'dental_erosion', label: 'Dental Erosion', icd: 'K03.2' },
  { value: 'bruxism', label: 'Bruxism', icd: 'F45.8' },
  { value: 'tmj_disorder', label: 'TMJ Disorder', icd: 'K07.6' },
  { value: 'oral_leukoplakia', label: 'Oral Leukoplakia', icd: 'K13.2' }
]

const SYSTEMIC_RISK_FACTORS = [
  'Diabetes mellitus',
  'Cardiovascular disease',
  'Immunocompromised status',
  'Osteoporosis',
  'Pregnancy',
  'Autoimmune disorders',
  'Cancer treatment',
  'Blood disorders',
  'Endocrine disorders',
  'Genetic predisposition'
]

const LOCAL_RISK_FACTORS = [
  'Poor oral hygiene',
  'Plaque accumulation',
  'Calculus deposits',
  'Malocclusion',
  'Crowded teeth',
  'Deep pockets',
  'Furcation involvement',
  'Tooth mobility',
  'Inadequate restorations',
  'Trauma/injury'
]

const BEHAVIORAL_RISK_FACTORS = [
  'Smoking/tobacco use',
  'Poor dietary habits',
  'Excessive sugar consumption',
  'Alcohol consumption',
  'Teeth grinding/clenching',
  'Nail biting',
  'Ice chewing',
  'Poor compliance',
  'Irregular dental visits',
  'Medication non-compliance'
]

export function DentalDiagnosisForm({
  consultationId,
  patientId,
  onNext,
  onSave,
  isReadOnly = false
}: BaseStepComponentProps) {
  const [formData, setFormData] = useState<DentalDiagnosisData>({
    primaryDiagnosis: [],
    differentialDiagnosis: [],
    riskFactors: {
      systemic: [],
      local: [],
      behavioral: []
    },
    prognosis: {
      shortTerm: 'good',
      longTerm: 'good',
      factors: [],
      notes: ''
    },
    complications: {
      potential: [],
      immediate: [],
      longTerm: []
    },
    diagnosticUncertainty: {
      level: 'none',
      factors: [],
      additionalTestsNeeded: [],
      consultationNeeded: false,
      referralSpecialty: ''
    },
    clinicalNotes: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<Diagnosis>>({
    type: 'primary',
    severity: 'moderate',
    confidence: 80
  })

  // Add new diagnosis
  const addDiagnosis = () => {
    if (!newDiagnosis.condition || !newDiagnosis.location) return

    const diagnosis: Diagnosis = {
      id: Date.now().toString(),
      type: newDiagnosis.type as 'primary' | 'secondary' | 'differential',
      condition: newDiagnosis.condition,
      icdCode: COMMON_DENTAL_DIAGNOSES.find(d => d.value === newDiagnosis.condition)?.icd,
      severity: newDiagnosis.severity as 'mild' | 'moderate' | 'severe',
      location: newDiagnosis.location || '',
      notes: newDiagnosis.notes || '',
      confidence: newDiagnosis.confidence || 80,
      criteria: {
        clinical: [],
        radiographic: [],
        laboratory: [],
        histological: []
      }
    }

    const targetArray = diagnosis.type === 'primary' ? 'primaryDiagnosis' : 'differentialDiagnosis'

    setFormData(prev => ({
      ...prev,
      [targetArray]: [...prev[targetArray], diagnosis]
    }))

    setNewDiagnosis({
      type: 'primary',
      severity: 'moderate',
      confidence: 80
    })
  }

  // Remove diagnosis
  const removeDiagnosis = (id: string, type: 'primary' | 'differential') => {
    const targetArray = type === 'primary' ? 'primaryDiagnosis' : 'differentialDiagnosis'
    setFormData(prev => ({
      ...prev,
      [targetArray]: prev[targetArray].filter(d => d.id !== id)
    }))
  }

  // Update diagnosis
  const updateDiagnosis = (id: string, type: 'primary' | 'differential', field: keyof Diagnosis, value: any) => {
    const targetArray = type === 'primary' ? 'primaryDiagnosis' : 'differentialDiagnosis'
    setFormData(prev => ({
      ...prev,
      [targetArray]: prev[targetArray].map(d =>
        d.id === id ? { ...d, [field]: value } : d
      )
    }))
  }

  // Toggle risk factor
  const toggleRiskFactor = (category: 'systemic' | 'local' | 'behavioral', factor: string) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [category]: prev.riskFactors[category].includes(factor)
          ? prev.riskFactors[category].filter(f => f !== factor)
          : [...prev.riskFactors[category], factor]
      }
    }))
  }

  // Add complication
  const addComplication = (category: 'potential' | 'immediate' | 'longTerm', complication: string) => {
    if (!complication.trim()) return

    setFormData(prev => ({
      ...prev,
      complications: {
        ...prev.complications,
        [category]: [...prev.complications[category], complication]
      }
    }))
  }

  // Remove complication
  const removeComplication = (category: 'potential' | 'immediate' | 'longTerm', index: number) => {
    setFormData(prev => ({
      ...prev,
      complications: {
        ...prev.complications,
        [category]: prev.complications[category].filter((_, i) => i !== index)
      }
    }))
  }

  // Save form data
  const handleSave = async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      await onSave(formData)
    } catch (error) {
      console.error('Error saving diagnosis data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    await handleSave()
    if (onNext) onNext()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Clinical Diagnosis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Establish primary and differential diagnoses
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Diagnosis */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Add New Diagnosis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={newDiagnosis.type}
                  onValueChange={(value: 'primary' | 'differential') =>
                    setNewDiagnosis(prev => ({ ...prev, type: value }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="differential">Differential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Condition</Label>
                <Select
                  value={newDiagnosis.condition}
                  onValueChange={(value) => setNewDiagnosis(prev => ({ ...prev, condition: value }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DENTAL_DIAGNOSES.map((diagnosis) => (
                      <SelectItem key={diagnosis.value} value={diagnosis.value}>
                        {diagnosis.label} ({diagnosis.icd})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Severity</Label>
                <Select
                  value={newDiagnosis.severity}
                  onValueChange={(value: 'mild' | 'moderate' | 'severe') =>
                    setNewDiagnosis(prev => ({ ...prev, severity: value }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Confidence (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newDiagnosis.confidence}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    confidence: parseInt(e.target.value) || 0
                  }))}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Location/Tooth</Label>
                <Input
                  value={newDiagnosis.location}
                  onChange={(e) => setNewDiagnosis(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Tooth #14, Upper right quadrant"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Input
                  value={newDiagnosis.notes}
                  onChange={(e) => setNewDiagnosis(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional diagnostic notes"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <Button
              onClick={addDiagnosis}
              disabled={isReadOnly || !newDiagnosis.condition || !newDiagnosis.location}
              size="sm"
            >
              Add Diagnosis
            </Button>
          </div>

          {/* Primary Diagnoses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Primary Diagnoses</h4>
              <Badge variant="secondary">
                {formData.primaryDiagnosis.length} diagnos{formData.primaryDiagnosis.length !== 1 ? 'es' : 'is'}
              </Badge>
            </div>

            {formData.primaryDiagnosis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No primary diagnoses added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.primaryDiagnosis.map((diagnosis) => (
                  <Card key={diagnosis.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-purple-700">
                            {COMMON_DENTAL_DIAGNOSES.find(d => d.value === diagnosis.condition)?.label || diagnosis.condition}
                          </h5>
                          {diagnosis.icdCode && (
                            <Badge variant="outline" className="text-xs">
                              {diagnosis.icdCode}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {diagnosis.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {diagnosis.confidence}% confidence
                          </Badge>
                        </div>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDiagnosis(diagnosis.id, 'primary')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><strong>Location:</strong> {diagnosis.location}</p>
                        {diagnosis.notes && <p><strong>Notes:</strong> {diagnosis.notes}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Differential Diagnoses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Differential Diagnoses</h4>
              <Badge variant="secondary">
                {formData.differentialDiagnosis.length} diagnos{formData.differentialDiagnosis.length !== 1 ? 'es' : 'is'}
              </Badge>
            </div>

            {formData.differentialDiagnosis.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No differential diagnoses added</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.differentialDiagnosis.map((diagnosis) => (
                  <Card key={diagnosis.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-orange-700">
                            {COMMON_DENTAL_DIAGNOSES.find(d => d.value === diagnosis.condition)?.label || diagnosis.condition}
                          </h5>
                          {diagnosis.icdCode && (
                            <Badge variant="outline" className="text-xs">
                              {diagnosis.icdCode}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {diagnosis.confidence}% confidence
                          </Badge>
                        </div>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDiagnosis(diagnosis.id, 'differential')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="text-sm">
                        <p><strong>Location:</strong> {diagnosis.location}</p>
                        {diagnosis.notes && <p><strong>Notes:</strong> {diagnosis.notes}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Risk Factors */}
          <div>
            <h4 className="font-medium mb-4 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
              Risk Factors Assessment
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-medium mb-3">Systemic Risk Factors</h5>
                <div className="space-y-2">
                  {SYSTEMIC_RISK_FACTORS.map((factor) => (
                    <div key={factor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`systemic-${factor}`}
                        checked={formData.riskFactors.systemic.includes(factor)}
                        onCheckedChange={() => toggleRiskFactor('systemic', factor)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`systemic-${factor}`} className="text-sm">
                        {factor}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-3">Local Risk Factors</h5>
                <div className="space-y-2">
                  {LOCAL_RISK_FACTORS.map((factor) => (
                    <div key={factor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`local-${factor}`}
                        checked={formData.riskFactors.local.includes(factor)}
                        onCheckedChange={() => toggleRiskFactor('local', factor)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`local-${factor}`} className="text-sm">
                        {factor}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-3">Behavioral Risk Factors</h5>
                <div className="space-y-2">
                  {BEHAVIORAL_RISK_FACTORS.map((factor) => (
                    <div key={factor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`behavioral-${factor}`}
                        checked={formData.riskFactors.behavioral.includes(factor)}
                        onCheckedChange={() => toggleRiskFactor('behavioral', factor)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`behavioral-${factor}`} className="text-sm">
                        {factor}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Prognosis */}
          <div>
            <h4 className="font-medium mb-4 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
              Prognosis
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Short-term Prognosis</Label>
                <Select
                  value={formData.prognosis.shortTerm}
                  onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') =>
                    setFormData(prev => ({
                      ...prev,
                      prognosis: { ...prev.prognosis, shortTerm: value }
                    }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Long-term Prognosis</Label>
                <Select
                  value={formData.prognosis.longTerm}
                  onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') =>
                    setFormData(prev => ({
                      ...prev,
                      prognosis: { ...prev.prognosis, longTerm: value }
                    }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prognosis-notes">Prognosis Notes</Label>
              <Textarea
                id="prognosis-notes"
                value={formData.prognosis.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  prognosis: { ...prev.prognosis, notes: e.target.value }
                }))}
                placeholder="Factors affecting prognosis and expected outcomes..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Diagnostic Uncertainty */}
          <div>
            <h4 className="font-medium mb-4">Diagnostic Uncertainty</h4>

            <div className="space-y-4">
              <div>
                <Label>Uncertainty Level</Label>
                <RadioGroup
                  value={formData.diagnosticUncertainty.level}
                  onValueChange={(value: 'none' | 'minimal' | 'moderate' | 'high') =>
                    setFormData(prev => ({
                      ...prev,
                      diagnosticUncertainty: { ...prev.diagnosticUncertainty, level: value }
                    }))
                  }
                  disabled={isReadOnly}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="uncertainty-none" />
                    <Label htmlFor="uncertainty-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimal" id="uncertainty-minimal" />
                    <Label htmlFor="uncertainty-minimal">Minimal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="uncertainty-moderate" />
                    <Label htmlFor="uncertainty-moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="uncertainty-high" />
                    <Label htmlFor="uncertainty-high">High</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.diagnosticUncertainty.level !== 'none' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consultation-needed"
                      checked={formData.diagnosticUncertainty.consultationNeeded}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        diagnosticUncertainty: {
                          ...prev.diagnosticUncertainty,
                          consultationNeeded: checked === true
                        }
                      }))}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="consultation-needed">Consultation/Referral Needed</Label>
                  </div>

                  {formData.diagnosticUncertainty.consultationNeeded && (
                    <div>
                      <Label htmlFor="referral-specialty">Referral Specialty</Label>
                      <Input
                        id="referral-specialty"
                        value={formData.diagnosticUncertainty.referralSpecialty}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          diagnosticUncertainty: {
                            ...prev.diagnosticUncertainty,
                            referralSpecialty: e.target.value
                          }
                        }))}
                        placeholder="e.g., Oral surgeon, Endodontist, Periodontist"
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Clinical Notes */}
          <div>
            <Label htmlFor="clinical-notes">Clinical Notes</Label>
            <Textarea
              id="clinical-notes"
              value={formData.clinicalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
              placeholder="Additional clinical observations, diagnostic reasoning, and notes..."
              disabled={isReadOnly}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            Save Progress
          </Button>

          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving || formData.primaryDiagnosis.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Continue to Treatment Plan
          </Button>
        </div>
      )}
    </div>
  )
}