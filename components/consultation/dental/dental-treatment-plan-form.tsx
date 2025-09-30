'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle, ChevronDown, Check } from 'lucide-react'
import { BaseStepComponentProps } from '../shared/base-consultation-workflow'

interface TreatmentOption {
  id: string
  category: 'immediate' | 'short_term' | 'long_term'
  procedure: string
  tooth: string
  priority: 'emergency' | 'urgent' | 'routine' | 'elective'
  description: string
  duration: string
  cost: string
  alternatives: string[]
  risks: string[]
  benefits: string[]
  prerequisites: string[]
  isSelected: boolean
  notes: string
}

interface AppointmentPhase {
  id: string
  phase: number
  title: string
  procedures: string[]
  duration: string
  estimatedCost: string
  notes: string
}

interface DentalTreatmentPlanData {
  treatmentOptions: TreatmentOption[]
  selectedTreatments: TreatmentOption[]
  treatmentSequence: AppointmentPhase[]
  patientConsent: {
    treatmentExplained: boolean
    risksDiscussed: boolean
    alternativesDiscussed: boolean
    costsDiscussed: boolean
    patientQuestions: string
    consentGiven: boolean
    consentDate?: string
  }
  followUpPlan: {
    immediateFollowUp: string
    routineFollowUp: string
    emergencyInstructions: string
    homeCareInstructions: string[]
  }
  referrals: {
    required: boolean
    specialists: { specialty: string; reason: string; urgency: 'routine' | 'urgent' | 'stat' }[]
  }
  medications: {
    preOperative: { medication: string; dosage: string; instructions: string }[]
    postOperative: { medication: string; dosage: string; instructions: string }[]
  }
  totalEstimatedCost: string
  totalTreatmentTime: string
  treatmentGoals: string[]
  contraindications: string[]
  planNotes: string
}

const DENTAL_PROCEDURES = [
  { category: 'Restorative', procedures: ['Composite Filling', 'Amalgam Filling', 'Porcelain Inlay', 'Crown', 'Bridge', 'Veneer'] },
  { category: 'Endodontic', procedures: ['Root Canal Therapy', 'Pulpotomy', 'Apicoectomy', 'Root Canal Retreatment'] },
  { category: 'Periodontal', procedures: ['Scaling & Root Planing', 'Gingivectomy', 'Flap Surgery', 'Bone Grafting', 'Guided Tissue Regeneration'] },
  { category: 'Oral Surgery', procedures: ['Simple Extraction', 'Surgical Extraction', 'Wisdom Tooth Removal', 'Biopsy', 'Implant Placement'] },
  { category: 'Preventive', procedures: ['Prophylaxis', 'Fluoride Treatment', 'Sealants', 'Oral Hygiene Instruction'] },
  { category: 'Prosthodontic', procedures: ['Complete Denture', 'Partial Denture', 'Implant Crown', 'Overdenture'] },
  { category: 'Orthodontic', procedures: ['Braces', 'Clear Aligners', 'Retainer', 'Space Maintainer'] },
  { category: 'Cosmetic', procedures: ['Teeth Whitening', 'Bonding', 'Smile Makeover', 'Gum Contouring'] }
]

// Flattened procedures list for easy searching
const ALL_PROCEDURES = DENTAL_PROCEDURES.flatMap(category =>
  category.procedures.map(procedure => ({
    value: procedure,
    label: procedure,
    category: category.category
  }))
)

const SPECIALISTS = [
  'Endodontist',
  'Periodontist',
  'Oral Surgeon',
  'Orthodontist',
  'Prosthodontist',
  'Pediatric Dentist',
  'Oral Pathologist',
  'Oral Medicine Specialist'
]

const HOME_CARE_INSTRUCTIONS = [
  'Brush twice daily with fluoride toothpaste',
  'Floss daily before bedtime',
  'Use antimicrobial mouthwash',
  'Avoid hard foods for 24-48 hours',
  'Apply ice packs for swelling (10-15 minutes)',
  'Take prescribed medications as directed',
  'Avoid smoking/tobacco products',
  'Eat soft foods for first few days',
  'Rinse with warm salt water',
  'Avoid drinking through straws'
]

export function DentalTreatmentPlanForm({
  consultationId,
  patientId,
  onNext,
  onSave,
  isReadOnly = false
}: BaseStepComponentProps) {
  const [formData, setFormData] = useState<DentalTreatmentPlanData>({
    treatmentOptions: [],
    selectedTreatments: [],
    treatmentSequence: [],
    patientConsent: {
      treatmentExplained: false,
      risksDiscussed: false,
      alternativesDiscussed: false,
      costsDiscussed: false,
      patientQuestions: '',
      consentGiven: false
    },
    followUpPlan: {
      immediateFollowUp: '',
      routineFollowUp: '',
      emergencyInstructions: '',
      homeCareInstructions: []
    },
    referrals: {
      required: false,
      specialists: []
    },
    medications: {
      preOperative: [],
      postOperative: []
    },
    totalEstimatedCost: '',
    totalTreatmentTime: '',
    treatmentGoals: [],
    contraindications: [],
    planNotes: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [newTreatment, setNewTreatment] = useState<Partial<TreatmentOption>>({
    category: 'immediate',
    priority: 'routine'
  })
  const [newPhase, setNewPhase] = useState<Partial<AppointmentPhase>>({
    phase: 1
  })
  const [procedureComboboxOpen, setProcedureComboboxOpen] = useState(false)

  // Add new treatment option
  const addTreatmentOption = () => {
    if (!newTreatment.procedure || !newTreatment.tooth) return

    const treatment: TreatmentOption = {
      id: Date.now().toString(),
      category: newTreatment.category as 'immediate' | 'short_term' | 'long_term',
      procedure: newTreatment.procedure,
      tooth: newTreatment.tooth,
      priority: newTreatment.priority as 'emergency' | 'urgent' | 'routine' | 'elective',
      description: newTreatment.description || '',
      duration: newTreatment.duration || '',
      cost: newTreatment.cost || '',
      alternatives: [],
      risks: [],
      benefits: [],
      prerequisites: [],
      isSelected: false,
      notes: newTreatment.notes || ''
    }

    setFormData(prev => ({
      ...prev,
      treatmentOptions: [...prev.treatmentOptions, treatment]
    }))

    setNewTreatment({
      category: 'immediate',
      priority: 'routine'
    })
  }

  // Toggle treatment selection
  const toggleTreatmentSelection = (id: string) => {
    setFormData(prev => ({
      ...prev,
      treatmentOptions: prev.treatmentOptions.map(t =>
        t.id === id ? { ...t, isSelected: !t.isSelected } : t
      ),
      selectedTreatments: prev.treatmentOptions
        .map(t => t.id === id ? { ...t, isSelected: !t.isSelected } : t)
        .filter(t => t.isSelected)
    }))
  }

  // Add appointment phase
  const addAppointmentPhase = () => {
    if (!newPhase.title || !newPhase.procedures?.length) return

    const phase: AppointmentPhase = {
      id: Date.now().toString(),
      phase: newPhase.phase || 1,
      title: newPhase.title,
      procedures: newPhase.procedures || [],
      duration: newPhase.duration || '',
      estimatedCost: newPhase.estimatedCost || '',
      notes: newPhase.notes || ''
    }

    setFormData(prev => ({
      ...prev,
      treatmentSequence: [...prev.treatmentSequence, phase].sort((a, b) => a.phase - b.phase)
    }))

    setNewPhase({
      phase: (formData.treatmentSequence.length + 2)
    })
  }

  // Add referral
  const addReferral = (specialist: string, reason: string, urgency: 'routine' | 'urgent' | 'stat') => {
    if (!specialist || !reason) return

    setFormData(prev => ({
      ...prev,
      referrals: {
        ...prev.referrals,
        specialists: [...prev.referrals.specialists, { specialty: specialist, reason, urgency }]
      }
    }))
  }

  // Add medication
  const addMedication = (
    category: 'preOperative' | 'postOperative',
    medication: string,
    dosage: string,
    instructions: string
  ) => {
    if (!medication || !dosage) return

    setFormData(prev => ({
      ...prev,
      medications: {
        ...prev.medications,
        [category]: [...prev.medications[category], { medication, dosage, instructions }]
      }
    }))
  }

  // Toggle home care instruction
  const toggleHomeCareInstruction = (instruction: string) => {
    setFormData(prev => ({
      ...prev,
      followUpPlan: {
        ...prev.followUpPlan,
        homeCareInstructions: prev.followUpPlan.homeCareInstructions.includes(instruction)
          ? prev.followUpPlan.homeCareInstructions.filter((i: string) => i !== instruction)
          : [...prev.followUpPlan.homeCareInstructions, instruction]
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
      console.error('Error saving treatment plan:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    await handleSave()
    if (onNext) onNext()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'routine': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'elective': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Treatment Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive treatment planning and sequencing
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Treatment Option */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Add Treatment Option</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newTreatment.category}
                  onValueChange={(value: 'immediate' | 'short_term' | 'long_term') =>
                    setNewTreatment(prev => ({ ...prev, category: value }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="short_term">Short-term</SelectItem>
                    <SelectItem value="long_term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Procedure</Label>
                <Popover open={procedureComboboxOpen} onOpenChange={setProcedureComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={procedureComboboxOpen}
                      className="w-full justify-between"
                      disabled={isReadOnly}
                    >
                      {newTreatment.procedure
                        ? ALL_PROCEDURES.find((procedure) => procedure.value === newTreatment.procedure)?.label
                        : "Search procedure..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                      <CommandInput placeholder="Search procedures..." className="h-9" />
                      <CommandEmpty>No procedure found.</CommandEmpty>
                      <CommandList>
                        {DENTAL_PROCEDURES.map((category) => (
                          <CommandGroup key={category.category} heading={category.category}>
                            {category.procedures.map((procedure) => (
                              <CommandItem
                                key={procedure}
                                value={procedure}
                                onSelect={(currentValue) => {
                                  setNewTreatment(prev => ({
                                    ...prev,
                                    procedure: currentValue === newTreatment.procedure ? "" : currentValue
                                  }))
                                  setProcedureComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newTreatment.procedure === procedure ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {procedure}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={newTreatment.priority}
                  onValueChange={(value: 'emergency' | 'urgent' | 'routine' | 'elective') =>
                    setNewTreatment(prev => ({ ...prev, priority: value }))
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tooth/Area</Label>
                <Input
                  value={newTreatment.tooth}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, tooth: e.target.value }))}
                  placeholder="e.g., #14, Upper right"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Duration</Label>
                <Input
                  value={newTreatment.duration}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 60 minutes, 2 visits"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label>Estimated Cost</Label>
                <Input
                  value={newTreatment.cost}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="e.g., $350, $500-750"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newTreatment.description}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <Button
              onClick={addTreatmentOption}
              disabled={isReadOnly || !newTreatment.procedure || !newTreatment.tooth}
              size="sm"
            >
              Add Treatment Option
            </Button>
          </div>

          {/* Treatment Options List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Treatment Options</h4>
              <Badge variant="secondary">
                {formData.treatmentOptions.length} option{formData.treatmentOptions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {formData.treatmentOptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No treatment options added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.treatmentOptions.map((treatment) => (
                  <Card key={treatment.id} className={`border-l-4 ${
                    treatment.isSelected ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={treatment.isSelected}
                            onCheckedChange={() => toggleTreatmentSelection(treatment.id)}
                            disabled={isReadOnly}
                          />
                          <h5 className="font-medium">{treatment.procedure}</h5>
                          <Badge variant="outline" className={getPriorityColor(treatment.priority)}>
                            {treatment.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {treatment.category}
                          </Badge>
                        </div>
                        {treatment.cost && (
                          <Badge variant="outline" className="text-green-600">
                            {treatment.cost}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <p><strong>Tooth/Area:</strong> {treatment.tooth}</p>
                        {treatment.duration && <p><strong>Duration:</strong> {treatment.duration}</p>}
                        {treatment.description && <p><strong>Description:</strong> {treatment.description}</p>}
                      </div>
                      {treatment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{treatment.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Treatment Sequence */}
          <div>
            <h4 className="font-medium mb-4 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Treatment Sequence & Appointments
            </h4>

            {/* Add Phase */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <h5 className="font-medium mb-3">Add Appointment Phase</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label>Phase Number</Label>
                  <Input
                    type="number"
                    value={newPhase.phase}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, phase: parseInt(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Phase Title</Label>
                  <Input
                    value={newPhase.title}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Initial Treatment"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={newPhase.duration}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 90 minutes"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Estimated Cost</Label>
                  <Input
                    value={newPhase.estimatedCost}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    placeholder="e.g., $500"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Procedures (comma-separated)</Label>
                <Input
                  value={newPhase.procedures?.join(', ')}
                  onChange={(e) => setNewPhase(prev => ({
                    ...prev,
                    procedures: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                  }))}
                  placeholder="e.g., Scaling, Root planing, Fluoride treatment"
                  disabled={isReadOnly}
                />
              </div>
              <Button
                onClick={addAppointmentPhase}
                disabled={isReadOnly || !newPhase.title}
                size="sm"
              >
                Add Phase
              </Button>
            </div>

            {/* Treatment Phases List */}
            {formData.treatmentSequence.length > 0 && (
              <div className="space-y-3">
                {formData.treatmentSequence.map((phase) => (
                  <Card key={phase.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Phase {phase.phase}</Badge>
                          <h5 className="font-medium">{phase.title}</h5>
                        </div>
                        {phase.estimatedCost && (
                          <Badge variant="outline" className="text-green-600">
                            {phase.estimatedCost}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><strong>Procedures:</strong> {phase.procedures.join(', ')}</p>
                        {phase.duration && <p><strong>Duration:</strong> {phase.duration}</p>}
                      </div>
                      {phase.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{phase.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Patient Consent */}
          <div>
            <h4 className="font-medium mb-4 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Patient Consent & Communication
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="treatment-explained"
                  checked={formData.patientConsent.treatmentExplained}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, treatmentExplained: checked === true }
                  }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="treatment-explained">Treatment plan explained to patient</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="risks-discussed"
                  checked={formData.patientConsent.risksDiscussed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, risksDiscussed: checked === true }
                  }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="risks-discussed">Risks and complications discussed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alternatives-discussed"
                  checked={formData.patientConsent.alternativesDiscussed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, alternativesDiscussed: checked === true }
                  }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="alternatives-discussed">Alternative treatments discussed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="costs-discussed"
                  checked={formData.patientConsent.costsDiscussed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, costsDiscussed: checked === true }
                  }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="costs-discussed">Treatment costs discussed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent-given"
                  checked={formData.patientConsent.consentGiven}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, consentGiven: checked === true }
                  }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="consent-given">Patient consent obtained</Label>
              </div>

              <div>
                <Label htmlFor="patient-questions">Patient Questions/Concerns</Label>
                <Textarea
                  id="patient-questions"
                  value={formData.patientConsent.patientQuestions}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    patientConsent: { ...prev.patientConsent, patientQuestions: e.target.value }
                  }))}
                  placeholder="Document any questions or concerns raised by the patient..."
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Home Care Instructions */}
          <div>
            <h4 className="font-medium mb-4">Home Care Instructions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {HOME_CARE_INSTRUCTIONS.map((instruction) => (
                <div key={instruction} className="flex items-center space-x-2">
                  <Checkbox
                    id={instruction}
                    checked={formData.followUpPlan.homeCareInstructions.includes(instruction)}
                    onCheckedChange={() => toggleHomeCareInstruction(instruction)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={instruction} className="text-sm">{instruction}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total-cost">Total Estimated Cost</Label>
              <Input
                id="total-cost"
                value={formData.totalEstimatedCost}
                onChange={(e) => setFormData(prev => ({ ...prev, totalEstimatedCost: e.target.value }))}
                placeholder="e.g., $2,500 - $3,200"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="total-time">Total Treatment Time</Label>
              <Input
                id="total-time"
                value={formData.totalTreatmentTime}
                onChange={(e) => setFormData(prev => ({ ...prev, totalTreatmentTime: e.target.value }))}
                placeholder="e.g., 4-6 appointments over 2 months"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plan-notes">Treatment Plan Notes</Label>
            <Textarea
              id="plan-notes"
              value={formData.planNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, planNotes: e.target.value }))}
              placeholder="Additional notes about the treatment plan..."
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
            disabled={isSaving || formData.selectedTreatments.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Consultation
          </Button>
        </div>
      )}
    </div>
  )
}