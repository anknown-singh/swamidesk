'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Star, FileText, Clock, Target } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TreatmentReview {
  id: string
  reviewDate: string
  reviewType: 'periodic' | 'milestone' | 'completion' | 'emergency'
  overallProgress: number
  treatmentEffectiveness: 'excellent' | 'good' | 'satisfactory' | 'poor'
  patientCompliance: number
  goalsAchieved: number
  goalsCurrent: number
  goalsTotal: number
  sideEffects: string[]
  complications: string
  patientSatisfaction: number
  clinicianNotes: string
  recommendations: string[]
  nextReviewDate: string
  treatmentModifications: string
  continueCurrentPlan: boolean
  dischargePlanning: boolean
}

interface TreatmentReviewFormProps {
  treatmentId: string
  onNext: () => void
  onPrevious: () => void
}

export function TreatmentReviewForm({ treatmentId, onNext, onPrevious }: TreatmentReviewFormProps) {
  const [reviews, setReviews] = useState<TreatmentReview[]>([])
  const [newReview, setNewReview] = useState({
    reviewDate: new Date().toISOString().split('T')[0],
    reviewType: 'periodic' as const,
    overallProgress: 70,
    treatmentEffectiveness: 'good' as const,
    patientCompliance: 80,
    goalsAchieved: 3,
    goalsCurrent: 5,
    goalsTotal: 8,
    sideEffects: [] as string[],
    complications: '',
    patientSatisfaction: 8,
    clinicianNotes: '',
    recommendations: [] as string[],
    nextReviewDate: '',
    treatmentModifications: '',
    continueCurrentPlan: true,
    dischargePlanning: false
  })
  const [saving, setSaving] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const reviewTypes = [
    { value: 'periodic', label: 'Periodic Review', description: 'Regular scheduled review' },
    { value: 'milestone', label: 'Milestone Review', description: 'Achievement of specific milestone' },
    { value: 'completion', label: 'Treatment Completion', description: 'End of treatment review' },
    { value: 'emergency', label: 'Emergency Review', description: 'Urgent treatment assessment' }
  ]

  const effectivenessLevels = [
    { value: 'excellent', label: 'Excellent', description: 'Outstanding treatment response', color: 'bg-green-100 text-green-800' },
    { value: 'good', label: 'Good', description: 'Positive treatment response', color: 'bg-blue-100 text-blue-800' },
    { value: 'satisfactory', label: 'Satisfactory', description: 'Adequate treatment response', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'poor', label: 'Poor', description: 'Limited treatment response', color: 'bg-red-100 text-red-800' }
  ]

  const commonSideEffects = [
    'Fatigue', 'Nausea', 'Dizziness', 'Headache', 'Sleep disturbances',
    'Appetite changes', 'Mood changes', 'Muscle soreness', 'Skin irritation',
    'Digestive issues', 'Anxiety', 'Depression symptoms'
  ]

  const standardRecommendations = [
    'Continue current treatment plan',
    'Increase treatment frequency',
    'Decrease treatment intensity',
    'Add complementary therapy',
    'Modify medication dosage',
    'Extend treatment duration',
    'Add patient education',
    'Schedule more frequent follow-ups',
    'Consider specialist consultation',
    'Plan discharge preparation',
    'Involve family in treatment',
    'Add home exercises'
  ]

  const addReview = () => {
    if (!newReview.clinicianNotes.trim()) return

    const review: TreatmentReview = {
      id: Date.now().toString(),
      ...newReview
    }

    setReviews(prev => [review, ...prev].sort((a, b) => 
      new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
    ))

    setNewReview({
      reviewDate: new Date().toISOString().split('T')[0],
      reviewType: 'periodic',
      overallProgress: 70,
      treatmentEffectiveness: 'good',
      patientCompliance: 80,
      goalsAchieved: 3,
      goalsCurrent: 5,
      goalsTotal: 8,
      sideEffects: [],
      complications: '',
      patientSatisfaction: 8,
      clinicianNotes: '',
      recommendations: [],
      nextReviewDate: '',
      treatmentModifications: '',
      continueCurrentPlan: true,
      dischargePlanning: false
    })

    setShowReviewForm(false)
  }

  const getEffectivenessColor = (effectiveness: TreatmentReview['treatmentEffectiveness']) => {
    const config = effectivenessLevels.find(e => e.value === effectiveness)
    return config?.color || 'bg-gray-100 text-gray-800'
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleSubmit = async () => {
    setSaving(true)
    
    try {
      // Simulate API call to save treatment reviews
      console.log('Saving treatment reviews:', reviews)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving treatment reviews:', error)
    } finally {
      setSaving(false)
    }
  }

  const calculateGoalProgress = (achieved: number, current: number, total: number) => {
    const completedGoals = achieved + current
    return Math.round((completedGoals / total) * 100)
  }

  useEffect(() => {
    // Calculate next review date based on review type
    const today = new Date()
    const nextDate = new Date(today)
    
    switch (newReview.reviewType) {
      case 'periodic':
        nextDate.setDate(today.getDate() + 14) // 2 weeks
        break
      case 'milestone':
        nextDate.setDate(today.getDate() + 30) // 1 month
        break
      case 'completion':
        nextDate.setDate(today.getDate() + 90) // 3 months
        break
      case 'emergency':
        nextDate.setDate(today.getDate() + 7) // 1 week
        break
    }
    
    setNewReview(prev => ({
      ...prev,
      nextReviewDate: nextDate.toISOString().split('T')[0]
    }))
  }, [newReview.reviewType])

  return (
    <div className="space-y-6">
      {/* Treatment Review Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {reviews.length > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.overallProgress, 0) / reviews.length) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.patientSatisfaction, 0) / reviews.length).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {reviews.filter(r => r.nextReviewDate && new Date(r.nextReviewDate) <= new Date()).length}
                </div>
                <div className="text-sm text-muted-foreground">Due Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Review Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Treatment Reviews
            </span>
            <Button onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? 'Cancel' : 'Add Review'}
            </Button>
          </CardTitle>
          <CardDescription>
            Document treatment progress, effectiveness, and patient outcomes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add New Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Treatment Review</CardTitle>
            <CardDescription>
              Complete comprehensive treatment review and assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewDate">Review Date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={newReview.reviewDate}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewType">Review Type *</Label>
                <Select 
                  value={newReview.reviewType} 
                  onValueChange={(value: TreatmentReview['reviewType']) => 
                    setNewReview(prev => ({ ...prev, reviewType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewTypes.map((type) => (
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
                <Label htmlFor="effectiveness">Treatment Effectiveness *</Label>
                <Select 
                  value={newReview.treatmentEffectiveness} 
                  onValueChange={(value: TreatmentReview['treatmentEffectiveness']) => 
                    setNewReview(prev => ({ ...prev, treatmentEffectiveness: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {effectivenessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overallProgress">Overall Progress (%)</Label>
                <div className="space-y-2">
                  <Input
                    id="overallProgress"
                    type="number"
                    min="0"
                    max="100"
                    value={newReview.overallProgress}
                    onChange={(e) => setNewReview(prev => ({ ...prev, overallProgress: parseInt(e.target.value) || 0 }))}
                  />
                  <Progress value={newReview.overallProgress} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientCompliance">Patient Compliance (%)</Label>
                <div className="space-y-2">
                  <Input
                    id="patientCompliance"
                    type="number"
                    min="0"
                    max="100"
                    value={newReview.patientCompliance}
                    onChange={(e) => setNewReview(prev => ({ ...prev, patientCompliance: parseInt(e.target.value) || 0 }))}
                  />
                  <Progress value={newReview.patientCompliance} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientSatisfaction">Patient Satisfaction (1-10)</Label>
                <Input
                  id="patientSatisfaction"
                  type="number"
                  min="1"
                  max="10"
                  value={newReview.patientSatisfaction}
                  onChange={(e) => setNewReview(prev => ({ ...prev, patientSatisfaction: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalsAchieved">Goals Achieved</Label>
                <Input
                  id="goalsAchieved"
                  type="number"
                  min="0"
                  value={newReview.goalsAchieved}
                  onChange={(e) => setNewReview(prev => ({ ...prev, goalsAchieved: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalsCurrent">Goals In Progress</Label>
                <Input
                  id="goalsCurrent"
                  type="number"
                  min="0"
                  value={newReview.goalsCurrent}
                  onChange={(e) => setNewReview(prev => ({ ...prev, goalsCurrent: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalsTotal">Total Goals</Label>
                <Input
                  id="goalsTotal"
                  type="number"
                  min="1"
                  value={newReview.goalsTotal}
                  onChange={(e) => setNewReview(prev => ({ ...prev, goalsTotal: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {/* Side Effects */}
            <div className="space-y-3">
              <Label>Side Effects Reported</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {commonSideEffects.map((effect) => (
                  <div key={effect} className="flex items-center space-x-2">
                    <Checkbox
                      id={effect}
                      checked={newReview.sideEffects.includes(effect)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewReview(prev => ({
                            ...prev,
                            sideEffects: [...prev.sideEffects, effect]
                          }))
                        } else {
                          setNewReview(prev => ({
                            ...prev,
                            sideEffects: prev.sideEffects.filter(e => e !== effect)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={effect} className="text-sm font-normal">
                      {effect}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <Label>Recommendations</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {standardRecommendations.map((rec) => (
                  <div key={rec} className="flex items-center space-x-2">
                    <Checkbox
                      id={rec}
                      checked={newReview.recommendations.includes(rec)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewReview(prev => ({
                            ...prev,
                            recommendations: [...prev.recommendations, rec]
                          }))
                        } else {
                          setNewReview(prev => ({
                            ...prev,
                            recommendations: prev.recommendations.filter(r => r !== rec)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={rec} className="text-sm font-normal">
                      {rec}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicianNotes">Clinical Notes & Assessment *</Label>
              <Textarea
                id="clinicianNotes"
                placeholder="Document detailed clinical observations, treatment response, and professional assessment..."
                value={newReview.clinicianNotes}
                onChange={(e) => setNewReview(prev => ({ ...prev, clinicianNotes: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complications">Complications & Concerns</Label>
              <Textarea
                id="complications"
                placeholder="Document any complications, adverse events, or concerns that arose during treatment..."
                value={newReview.complications}
                onChange={(e) => setNewReview(prev => ({ ...prev, complications: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentModifications">Treatment Modifications</Label>
              <Textarea
                id="treatmentModifications"
                placeholder="Describe any modifications made to the treatment plan..."
                value={newReview.treatmentModifications}
                onChange={(e) => setNewReview(prev => ({ ...prev, treatmentModifications: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="continueCurrentPlan"
                    checked={newReview.continueCurrentPlan}
                    onCheckedChange={(checked) => 
                      setNewReview(prev => ({ ...prev, continueCurrentPlan: !!checked }))
                    }
                  />
                  <Label htmlFor="continueCurrentPlan">Continue Current Treatment Plan</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dischargePlanning"
                    checked={newReview.dischargePlanning}
                    onCheckedChange={(checked) => 
                      setNewReview(prev => ({ ...prev, dischargePlanning: !!checked }))
                    }
                  />
                  <Label htmlFor="dischargePlanning">Initiate Discharge Planning</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextReviewDate">Next Review Date</Label>
                <Input
                  id="nextReviewDate"
                  type="date"
                  value={newReview.nextReviewDate}
                  onChange={(e) => setNewReview(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={addReview}
              disabled={!newReview.clinicianNotes.trim()}
              className="w-full"
            >
              Add Treatment Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Treatment Review History ({reviews.length} reviews)</CardTitle>
            <CardDescription>
              Chronological record of treatment reviews and assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {reviewTypes.find(t => t.value === review.reviewType)?.label}
                    </Badge>
                    <Badge variant="outline" className={getEffectivenessColor(review.treatmentEffectiveness)}>
                      {effectivenessLevels.find(e => e.value === review.treatmentEffectiveness)?.label}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{review.overallProgress}% Progress</div>
                    <div className="text-xs text-muted-foreground">
                      Satisfaction: {review.patientSatisfaction}/10
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium">Goals Progress</Label>
                    <p className="font-medium">
                      {review.goalsAchieved} achieved, {review.goalsCurrent} in progress
                    </p>
                    <Progress 
                      value={calculateGoalProgress(review.goalsAchieved, review.goalsCurrent, review.goalsTotal)} 
                      className="h-1 mt-1" 
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Patient Compliance</Label>
                    <p className="font-medium">{review.patientCompliance}%</p>
                    <Progress value={review.patientCompliance} className="h-1 mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Next Review</Label>
                    <p className="text-muted-foreground">
                      {review.nextReviewDate ? new Date(review.nextReviewDate).toLocaleDateString() : 'Not scheduled'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Clinical Assessment:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{review.clinicianNotes}</p>
                  </div>

                  {review.recommendations.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Recommendations:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {review.recommendations.map((rec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.sideEffects.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Side Effects:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {review.sideEffects.map((effect, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {effect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.complications && (
                    <div>
                      <Label className="text-sm font-medium">Complications:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{review.complications}</p>
                    </div>
                  )}

                  {review.treatmentModifications && (
                    <div>
                      <Label className="text-sm font-medium">Treatment Modifications:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{review.treatmentModifications}</p>
                    </div>
                  )}

                  <div className="flex gap-4 text-sm">
                    {review.continueCurrentPlan && (
                      <Badge variant="outline">Continue Treatment</Badge>
                    )}
                    {review.dischargePlanning && (
                      <Badge variant="outline">Discharge Planning</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous: Treatment Monitoring
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Next: Treatment Summary'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}