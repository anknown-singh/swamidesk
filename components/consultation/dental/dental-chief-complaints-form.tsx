'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, AlertTriangle, Clock, Thermometer } from 'lucide-react'
import { BaseStepComponentProps } from '../shared/base-consultation-workflow'

// Common dental complaints
const COMMON_DENTAL_COMPLAINTS = [
  'Toothache',
  'Tooth sensitivity',
  'Bleeding gums',
  'Swollen gums',
  'Bad breath',
  'Loose tooth',
  'Broken/chipped tooth',
  'Jaw pain',
  'Grinding teeth',
  'Dry mouth',
  'White spots on teeth',
  'Dental emergency'
]

// Pain scale descriptors
const PAIN_SCALE = [
  { value: '0', label: 'No pain' },
  { value: '1-2', label: 'Mild discomfort' },
  { value: '3-4', label: 'Moderate pain' },
  { value: '5-6', label: 'Severe pain' },
  { value: '7-8', label: 'Very severe pain' },
  { value: '9-10', label: 'Extreme pain' }
]

interface DentalComplaint {
  complaint: string
  duration: string
  severity: string
  triggers: string[]
  location: string
  description: string
}

interface DentalChiefComplaintsData {
  primaryComplaint: string
  complaints: DentalComplaint[]
  painLevel: string
  painCharacter: string
  painTriggers: string[]
  previousDentalWork: string
  lastDentalVisit: string
  dentalAnxiety: string
  emergencyVisit: boolean
  additionalConcerns: string
}

export function DentalChiefComplaintsForm({
  consultationId,
  patientId,
  onNext,
  onSave,
  isReadOnly = false
}: BaseStepComponentProps) {
  const [formData, setFormData] = useState<DentalChiefComplaintsData>({
    primaryComplaint: '',
    complaints: [],
    painLevel: '0',
    painCharacter: '',
    painTriggers: [],
    previousDentalWork: '',
    lastDentalVisit: '',
    dentalAnxiety: 'none',
    emergencyVisit: false,
    additionalConcerns: ''
  })

  const [isSaving, setIsSaving] = useState(false)

  // Add a new complaint
  const addComplaint = (complaint: string) => {
    if (!formData.complaints.find(c => c.complaint === complaint)) {
      const newComplaint: DentalComplaint = {
        complaint,
        duration: '',
        severity: 'mild',
        triggers: [],
        location: '',
        description: ''
      }
      setFormData(prev => ({
        ...prev,
        complaints: [...prev.complaints, newComplaint],
        primaryComplaint: prev.primaryComplaint || complaint
      }))
    }
  }

  // Update complaint details
  const updateComplaint = (index: number, field: keyof DentalComplaint, value: any) => {
    setFormData(prev => ({
      ...prev,
      complaints: prev.complaints.map((complaint, i) =>
        i === index ? { ...complaint, [field]: value } : complaint
      )
    }))
  }

  // Remove complaint
  const removeComplaint = (index: number) => {
    setFormData(prev => {
      const newComplaints = prev.complaints.filter((_, i) => i !== index)
      return {
        ...prev,
        complaints: newComplaints,
        primaryComplaint: newComplaints.length > 0 ? newComplaints[0].complaint : ''
      }
    })
  }

  // Toggle pain trigger
  const togglePainTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      painTriggers: prev.painTriggers.includes(trigger)
        ? prev.painTriggers.filter(t => t !== trigger)
        : [...prev.painTriggers, trigger]
    }))
  }

  // Save form data
  const handleSave = async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      await onSave(formData)
    } catch (error) {
      console.error('Error saving chief complaints:', error)
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
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Chief Complaints</CardTitle>
            <p className="text-sm text-muted-foreground">
              What brings you to the dental office today?
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Complaint Selection */}
        <div>
          <Label className="text-base font-medium">Common Dental Issues</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select any that apply to your current situation
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_DENTAL_COMPLAINTS.map((complaint) => (
              <Button
                key={complaint}
                variant="outline"
                size="sm"
                onClick={() => addComplaint(complaint)}
                disabled={isReadOnly || formData.complaints.some(c => c.complaint === complaint)}
                className={`justify-start text-left h-auto py-2 px-3 ${
                  formData.complaints.some(c => c.complaint === complaint)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : ''
                }`}
              >
                {complaint}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Detailed Complaints */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-medium">Detailed Complaints</Label>
            <Badge variant="secondary">
              {formData.complaints.length} complaint{formData.complaints.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {formData.complaints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select a complaint above to add details</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.complaints.map((complaint, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-blue-700">{complaint.complaint}</h4>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeComplaint(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`duration-${index}`} className="text-sm">
                          How long have you had this issue?
                        </Label>
                        <Input
                          id={`duration-${index}`}
                          value={complaint.duration}
                          onChange={(e) => updateComplaint(index, 'duration', e.target.value)}
                          placeholder="e.g., 3 days, 1 week, 2 months"
                          disabled={isReadOnly}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`severity-${index}`} className="text-sm">
                          Severity
                        </Label>
                        <Select
                          value={complaint.severity}
                          onValueChange={(value) => updateComplaint(index, 'severity', value)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="mt-1">
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
                        <Label htmlFor={`location-${index}`} className="text-sm">
                          Location (which tooth/area?)
                        </Label>
                        <Input
                          id={`location-${index}`}
                          value={complaint.location}
                          onChange={(e) => updateComplaint(index, 'location', e.target.value)}
                          placeholder="e.g., upper left molar, front teeth, gums"
                          disabled={isReadOnly}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`description-${index}`} className="text-sm">
                          Additional Details
                        </Label>
                        <Textarea
                          id={`description-${index}`}
                          value={complaint.description}
                          onChange={(e) => updateComplaint(index, 'description', e.target.value)}
                          placeholder="Describe the problem in more detail..."
                          disabled={isReadOnly}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pain Assessment */}
        {formData.complaints.some(c => c.complaint.toLowerCase().includes('pain') || c.complaint.toLowerCase().includes('ache')) && (
          <>
            <Separator />
            <div>
              <Label className="text-base font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Pain Assessment
              </Label>

              <div className="mt-4 space-y-4">
                <div>
                  <Label>Current Pain Level (0-10)</Label>
                  <RadioGroup
                    value={formData.painLevel}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, painLevel: value }))}
                    disabled={isReadOnly}
                    className="mt-2"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {PAIN_SCALE.map((scale) => (
                        <div key={scale.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={scale.value} id={scale.value} />
                          <Label htmlFor={scale.value} className="text-sm">
                            {scale.value}: {scale.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Pain Character</Label>
                  <Select
                    value={formData.painCharacter}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, painCharacter: value }))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Describe the type of pain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharp">Sharp/stabbing</SelectItem>
                      <SelectItem value="dull">Dull ache</SelectItem>
                      <SelectItem value="throbbing">Throbbing</SelectItem>
                      <SelectItem value="shooting">Shooting</SelectItem>
                      <SelectItem value="burning">Burning</SelectItem>
                      <SelectItem value="pressure">Pressure/tight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pain Triggers (select all that apply)</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['Hot foods/drinks', 'Cold foods/drinks', 'Sweet foods', 'Chewing', 'Pressure', 'Lying down'].map((trigger) => (
                      <div key={trigger} className="flex items-center space-x-2">
                        <Checkbox
                          id={trigger}
                          checked={formData.painTriggers.includes(trigger)}
                          onCheckedChange={() => togglePainTrigger(trigger)}
                          disabled={isReadOnly}
                        />
                        <Label htmlFor={trigger} className="text-sm">
                          {trigger}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Additional Information */}
        <Separator />
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-500" />
            Additional Information
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lastVisit">When was your last dental visit?</Label>
              <Input
                id="lastVisit"
                value={formData.lastDentalVisit}
                onChange={(e) => setFormData(prev => ({ ...prev, lastDentalVisit: e.target.value }))}
                placeholder="e.g., 6 months ago, 2 years ago"
                disabled={isReadOnly}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="previousWork">Recent dental work?</Label>
              <Input
                id="previousWork"
                value={formData.previousDentalWork}
                onChange={(e) => setFormData(prev => ({ ...prev, previousDentalWork: e.target.value }))}
                placeholder="e.g., filling, crown, cleaning"
                disabled={isReadOnly}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="anxiety">Dental Anxiety Level</Label>
            <RadioGroup
              value={formData.dentalAnxiety}
              onValueChange={(value) => setFormData(prev => ({ ...prev, dentalAnxiety: value }))}
              disabled={isReadOnly}
              className="mt-2"
            >
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="anxiety-none" />
                  <Label htmlFor="anxiety-none">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mild" id="anxiety-mild" />
                  <Label htmlFor="anxiety-mild">Mild</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="anxiety-moderate" />
                  <Label htmlFor="anxiety-moderate">Moderate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="anxiety-high" />
                  <Label htmlFor="anxiety-high">High</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergency"
              checked={formData.emergencyVisit}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emergencyVisit: checked === true }))}
              disabled={isReadOnly}
            />
            <Label htmlFor="emergency" className="text-sm">
              This is an emergency visit
            </Label>
          </div>

          <div>
            <Label htmlFor="additional">Any other concerns or questions?</Label>
            <Textarea
              id="additional"
              value={formData.additionalConcerns}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalConcerns: e.target.value }))}
              placeholder="Any other dental concerns, questions, or information you'd like to share..."
              disabled={isReadOnly}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              Save Progress
            </Button>

            <Button
              onClick={handleSaveAndContinue}
              disabled={isSaving || formData.complaints.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue to Examination
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}