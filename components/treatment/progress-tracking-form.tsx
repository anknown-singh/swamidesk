'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, ArrowLeft, Plus, TrendingUp, Activity, Target } from 'lucide-react'

interface ProgressMetric {
  id: string
  metric: string
  category: string
  unit: string
  baseline: number
  current: number
  target: number
  measurementDate: string
  notes: string
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  completionDate?: string
  notes: string
}

interface ProgressTrackingFormProps {
  treatmentId: string
  onNext: () => void
  onPrevious: () => void
}

export function ProgressTrackingForm({ treatmentId, onNext, onPrevious }: ProgressTrackingFormProps) {
  const [metrics, setMetrics] = useState<ProgressMetric[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMetric, setNewMetric] = useState({
    metric: '',
    category: '',
    unit: '',
    baseline: 0,
    current: 0,
    target: 0,
    measurementDate: '',
    notes: ''
  })
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: '',
    notes: ''
  })
  const [activeTab, setActiveTab] = useState<'metrics' | 'milestones'>('metrics')
  const [saving, setSaving] = useState(false)

  const metricCategories = [
    'Pain Level',
    'Range of Motion',
    'Strength',
    'Functional Assessment',
    'Quality of Life',
    'Mobility',
    'Endurance',
    'Balance',
    'Cognitive Function',
    'Psychological Well-being'
  ]

  const commonMetrics = {
    'Pain Level': ['Pain Score (0-10)', 'Pain Duration', 'Pain Frequency'],
    'Range of Motion': ['Flexion Degrees', 'Extension Degrees', 'Rotation Degrees'],
    'Strength': ['Grip Strength', 'Muscle Strength Grade', 'Lift Capacity'],
    'Functional Assessment': ['Walking Distance', 'Climbing Stairs', 'Daily Activities Score'],
    'Quality of Life': ['QoL Score', 'Sleep Quality', 'Energy Level'],
    'Mobility': ['Walking Speed', 'Balance Score', 'Coordination Score']
  }

  const units = [
    'Scale (0-10)',
    'Degrees',
    'Kilograms',
    'Meters',
    'Minutes',
    'Percentage',
    'Score',
    'Count',
    'Level'
  ]

  const addMetric = () => {
    if (!newMetric.metric || !newMetric.category) return

    const metric: ProgressMetric = {
      id: Date.now().toString(),
      metric: newMetric.metric,
      category: newMetric.category,
      unit: newMetric.unit,
      baseline: newMetric.baseline,
      current: newMetric.current,
      target: newMetric.target,
      measurementDate: newMetric.measurementDate || new Date().toISOString().split('T')[0],
      notes: newMetric.notes
    }

    setMetrics(prev => [...prev, metric])
    setNewMetric({
      metric: '',
      category: '',
      unit: '',
      baseline: 0,
      current: 0,
      target: 0,
      measurementDate: '',
      notes: ''
    })
  }

  const addMilestone = () => {
    if (!newMilestone.title || !newMilestone.targetDate) return

    const milestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      status: 'pending',
      notes: newMilestone.notes
    }

    setMilestones(prev => [...prev, milestone].sort((a, b) => 
      new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    ))

    setNewMilestone({
      title: '',
      description: '',
      targetDate: '',
      notes: ''
    })
  }

  const calculateProgress = (baseline: number, current: number, target: number) => {
    if (target === baseline) return 100
    return Math.round(((current - baseline) / (target - baseline)) * 100)
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
      // Simulate API call to save progress tracking data
      console.log('Saving progress tracking:', { metrics, milestones })
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving progress tracking:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('metrics')}
          className="flex-1"
        >
          <Activity className="w-4 h-4 mr-2" />
          Progress Metrics
        </Button>
        <Button
          variant={activeTab === 'milestones' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('milestones')}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-2" />
          Milestones
        </Button>
      </div>

      {/* Progress Metrics Tab */}
      {activeTab === 'metrics' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Add Progress Metric
              </CardTitle>
              <CardDescription>
                Track measurable indicators of treatment progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metricCategory">Category</Label>
                  <Select 
                    value={newMetric.category} 
                    onValueChange={(value) => {
                      setNewMetric(prev => ({ ...prev, category: value, metric: '' }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {metricCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metricName">Specific Metric</Label>
                  <Select 
                    value={newMetric.metric} 
                    onValueChange={(value) => setNewMetric(prev => ({ ...prev, metric: value }))}
                    disabled={!newMetric.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {newMetric.category && commonMetrics[newMetric.category]?.map((metric) => (
                        <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newMetric.metric === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customMetric">Custom Metric Name</Label>
                  <Input
                    id="customMetric"
                    placeholder="Enter custom metric name"
                    onChange={(e) => setNewMetric(prev => ({ ...prev, metric: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Select 
                    value={newMetric.unit} 
                    onValueChange={(value) => setNewMetric(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseline">Baseline Value</Label>
                  <Input
                    id="baseline"
                    type="number"
                    step="0.1"
                    value={newMetric.baseline}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, baseline: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current">Current Value</Label>
                  <Input
                    id="current"
                    type="number"
                    step="0.1"
                    value={newMetric.current}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, current: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target Value</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.1"
                    value={newMetric.target}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="measurementDate">Measurement Date</Label>
                  <Input
                    id="measurementDate"
                    type="date"
                    value={newMetric.measurementDate}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, measurementDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metricNotes">Notes</Label>
                  <Input
                    id="metricNotes"
                    placeholder="Any notes about this measurement"
                    value={newMetric.notes}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={addMetric}
                disabled={!newMetric.metric || !newMetric.category}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Metric
              </Button>
            </CardContent>
          </Card>

          {/* Metrics List */}
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Metrics ({metrics.length})</CardTitle>
                <CardDescription>
                  Current progress tracking measurements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.map((metric) => {
                  const progress = calculateProgress(metric.baseline, metric.current, metric.target)
                  return (
                    <div key={metric.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{metric.metric}</h4>
                          <Badge variant="secondary">{metric.category}</Badge>
                        </div>
                        <Badge variant={progress >= 80 ? 'default' : progress >= 60 ? 'secondary' : 'destructive'}>
                          {progress}% Progress
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs">Baseline</Label>
                          <p className="font-medium">{metric.baseline} {metric.unit}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Current</Label>
                          <p className="font-medium">{metric.current} {metric.unit}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Target</Label>
                          <p className="font-medium">{metric.target} {metric.unit}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                          />
                        </div>
                      </div>

                      {metric.notes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {metric.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Add Treatment Milestone
              </CardTitle>
              <CardDescription>
                Set key milestones to track treatment progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="milestoneTitle">Milestone Title *</Label>
                <Input
                  id="milestoneTitle"
                  placeholder="e.g., Complete first phase of therapy"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milestoneDescription">Description</Label>
                <Textarea
                  id="milestoneDescription"
                  placeholder="Describe what needs to be achieved for this milestone"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="milestoneNotes">Notes</Label>
                  <Input
                    id="milestoneNotes"
                    placeholder="Additional notes or requirements"
                    value={newMilestone.notes}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={addMilestone}
                disabled={!newMilestone.title || !newMilestone.targetDate}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </CardContent>
          </Card>

          {/* Milestones List */}
          {milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Treatment Milestones ({milestones.length})</CardTitle>
                <CardDescription>
                  Key milestones for tracking treatment progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Milestone {index + 1}</Badge>
                        <h4 className="font-medium">{milestone.title}</h4>
                      </div>
                      <Badge variant="secondary">{milestone.status}</Badge>
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span>Target Date: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                      {milestone.completionDate && (
                        <span>Completed: {new Date(milestone.completionDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    {milestone.notes && (
                      <p className="text-sm text-muted-foreground">
                        Notes: {milestone.notes}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous: Session Scheduling
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Next: Treatment Monitoring'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}