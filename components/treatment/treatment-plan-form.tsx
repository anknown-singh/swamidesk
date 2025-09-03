'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, Save } from 'lucide-react'

interface TreatmentPlanFormProps {
  treatmentId: string
  onNext: () => void
}

export function TreatmentPlanForm({ treatmentId, onNext }: TreatmentPlanFormProps) {
  const [formData, setFormData] = useState({
    treatmentType: '',
    primaryObjective: '',
    secondaryObjectives: '',
    methodology: '',
    estimatedDuration: '',
    frequency: '',
    specialInstructions: '',
    contraindications: [],
    riskFactors: ''
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    // Simulate API call to save treatment plan
    try {
      // In a real implementation, this would save to database
      console.log('Saving treatment plan:', formData)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving treatment plan:', error)
    } finally {
      setSaving(false)
    }
  }

  const treatmentTypes = [
    'Physical Therapy',
    'Medication Management',
    'Behavioral Therapy',
    'Surgical Intervention',
    'Lifestyle Modification',
    'Pain Management',
    'Rehabilitation',
    'Monitoring & Follow-up'
  ]

  const contraindications = [
    'Pregnancy',
    'Heart Conditions',
    'Liver Disease',
    'Kidney Disease',
    'Blood Disorders',
    'Neurological Conditions',
    'Allergic Reactions',
    'Age Restrictions'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treatment Type */}
        <div className="space-y-2">
          <Label htmlFor="treatmentType">Treatment Type *</Label>
          <Select value={formData.treatmentType} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, treatmentType: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select treatment type" />
            </SelectTrigger>
            <SelectContent>
              {treatmentTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estimated Duration */}
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration</Label>
          <Input
            id="estimatedDuration"
            placeholder="e.g., 4-6 weeks"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
          />
        </div>
      </div>

      {/* Primary Objective */}
      <div className="space-y-2">
        <Label htmlFor="primaryObjective">Primary Treatment Objective *</Label>
        <Textarea
          id="primaryObjective"
          placeholder="Describe the main goal of this treatment plan..."
          value={formData.primaryObjective}
          onChange={(e) => setFormData(prev => ({ ...prev, primaryObjective: e.target.value }))}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* Secondary Objectives */}
      <div className="space-y-2">
        <Label htmlFor="secondaryObjectives">Secondary Objectives</Label>
        <Textarea
          id="secondaryObjectives"
          placeholder="List additional treatment goals and outcomes..."
          value={formData.secondaryObjectives}
          onChange={(e) => setFormData(prev => ({ ...prev, secondaryObjectives: e.target.value }))}
          className="min-h-[80px]"
        />
      </div>

      {/* Treatment Methodology */}
      <div className="space-y-2">
        <Label htmlFor="methodology">Treatment Methodology</Label>
        <Textarea
          id="methodology"
          placeholder="Describe the approach, techniques, and methods to be used..."
          value={formData.methodology}
          onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">Treatment Frequency</Label>
          <Select value={formData.frequency} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, frequency: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="twice-weekly">Twice Weekly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="as-needed">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <Label htmlFor="riskFactors">Risk Factors</Label>
          <Input
            id="riskFactors"
            placeholder="Any potential risks or concerns"
            value={formData.riskFactors}
            onChange={(e) => setFormData(prev => ({ ...prev, riskFactors: e.target.value }))}
          />
        </div>
      </div>

      {/* Contraindications */}
      <div className="space-y-3">
        <Label>Contraindications & Precautions</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contraindications.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={item}
                checked={formData.contraindications.includes(item)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({
                      ...prev,
                      contraindications: [...prev.contraindications, item]
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      contraindications: prev.contraindications.filter(c => c !== item)
                    }))
                  }
                }}
              />
              <Label htmlFor={item} className="text-sm font-normal">
                {item}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="specialInstructions">Special Instructions</Label>
        <Textarea
          id="specialInstructions"
          placeholder="Any special instructions, precautions, or notes for the treatment team..."
          value={formData.specialInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
          className="min-h-[80px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        
        <Button 
          type="submit" 
          disabled={!formData.treatmentType || !formData.primaryObjective || saving}
        >
          {saving ? 'Saving...' : 'Next: Goals Setting'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  )
}