'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Plus, X, Target } from 'lucide-react'

interface TreatmentGoal {
  id: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  targetDate: string
  measurementCriteria: string
  status: 'pending' | 'in_progress' | 'achieved' | 'modified'
}

interface TreatmentGoalsFormProps {
  treatmentId: string
  onNext: () => void
  onPrevious: () => void
}

export function TreatmentGoalsForm({ treatmentId, onNext, onPrevious }: TreatmentGoalsFormProps) {
  const [goals, setGoals] = useState<TreatmentGoal[]>([])
  const [newGoal, setNewGoal] = useState({
    description: '',
    category: '',
    priority: 'medium' as const,
    targetDate: '',
    measurementCriteria: ''
  })
  const [saving, setSaving] = useState(false)

  const goalCategories = [
    'Pain Management',
    'Mobility & Function',
    'Strength & Conditioning',
    'Balance & Coordination',
    'Cardiovascular Health',
    'Mental Health',
    'Quality of Life',
    'Activities of Daily Living',
    'Work & Occupation',
    'Social & Recreation'
  ]

  const addGoal = () => {
    if (!newGoal.description.trim()) return

    const goal: TreatmentGoal = {
      id: Date.now().toString(),
      description: newGoal.description,
      category: newGoal.category,
      priority: newGoal.priority,
      targetDate: newGoal.targetDate,
      measurementCriteria: newGoal.measurementCriteria,
      status: 'pending'
    }

    setGoals(prev => [...prev, goal])
    setNewGoal({
      description: '',
      category: '',
      priority: 'medium',
      targetDate: '',
      measurementCriteria: ''
    })
  }

  const removeGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
  }

  const updateGoal = (goalId: string, updates: Partial<TreatmentGoal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ))
  }

  const handleSubmit = async () => {
    if (goals.length === 0) return

    setSaving(true)
    
    try {
      // Simulate API call to save treatment goals
      console.log('Saving treatment goals:', goals)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving treatment goals:', error)
    } finally {
      setSaving(false)
    }
  }

  const getPriorityColor = (priority: TreatmentGoal['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Goal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Add Treatment Goal
          </CardTitle>
          <CardDescription>
            Define specific, measurable goals for this treatment plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalCategory">Goal Category</Label>
              <Select 
                value={newGoal.category} 
                onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {goalCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={newGoal.priority} 
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setNewGoal(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalDescription">Goal Description *</Label>
            <Textarea
              id="goalDescription"
              placeholder="Describe the specific goal to be achieved..."
              value={newGoal.description}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurementCriteria">How will success be measured?</Label>
            <Input
              id="measurementCriteria"
              placeholder="e.g., Reduce pain from 7/10 to 3/10, Increase range of motion by 20 degrees"
              value={newGoal.measurementCriteria}
              onChange={(e) => setNewGoal(prev => ({ ...prev, measurementCriteria: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Achievement Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
            />
          </div>

          <Button 
            onClick={addGoal}
            disabled={!newGoal.description.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </CardContent>
      </Card>

      {/* Goals List */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Treatment Goals ({goals.length})</CardTitle>
            <CardDescription>
              Review and modify goals as needed before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal, index) => (
              <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Goal {index + 1}</Badge>
                    <Badge variant={getPriorityColor(goal.priority)}>
                      {goal.priority} priority
                    </Badge>
                    {goal.category && (
                      <Badge variant="secondary">{goal.category}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Description:</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  </div>

                  {goal.measurementCriteria && (
                    <div>
                      <Label className="text-sm font-medium">Success Criteria:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.measurementCriteria}
                      </p>
                    </div>
                  )}

                  {goal.targetDate && (
                    <div>
                      <Label className="text-sm font-medium">Target Date:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
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
          Previous: Treatment Plan
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={goals.length === 0 || saving}
        >
          {saving ? 'Saving...' : 'Next: Session Scheduling'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}