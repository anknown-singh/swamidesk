'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  CheckCircle,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Activity
} from 'lucide-react'

interface TreatmentPlan {
  id: string
  patient_id: string
  visit_id: string
  title: string
  description: string | null
  total_sessions: number
  completed_sessions: number
  estimated_cost: number | null
  status: 'planned' | 'active' | 'completed' | 'paused'
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  created_at: string
  updated_at: string
  patients: {
    id: string
    full_name: string
    phone: string
    date_of_birth: string
    email?: string
  }
}

export default function TreatmentPlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string
  
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states for editing
  const [editedPlan, setEditedPlan] = useState<Partial<TreatmentPlan>>({})

  const supabase = createClient()

  const fetchTreatmentPlanDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          patients (
            id,
            full_name,
            phone,
            date_of_birth,
            email
          )
        `)
        .eq('id', planId)
        .single()

      if (error) throw error
      
      setTreatmentPlan(data as TreatmentPlan)
      setEditedPlan(data)
    } catch (error) {
      console.error('Error fetching treatment plan details:', error)
      setError('Failed to load treatment plan details')
    } finally {
      setLoading(false)
    }
  }, [planId, supabase])

  useEffect(() => {
    fetchTreatmentPlanDetails()
  }, [fetchTreatmentPlanDetails])

  const saveTreatmentPlanDetails = async () => {
    if (!treatmentPlan) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({
          title: editedPlan.title,
          description: editedPlan.description,
          total_sessions: editedPlan.total_sessions,
          completed_sessions: editedPlan.completed_sessions,
          estimated_cost: editedPlan.estimated_cost,
          status: editedPlan.status,
          start_date: editedPlan.start_date,
          expected_end_date: editedPlan.expected_end_date,
          actual_end_date: editedPlan.actual_end_date
        })
        .eq('id', planId)

      if (error) throw error
      
      setTreatmentPlan(prev => prev ? { ...prev, ...editedPlan } : null)
      setError(null)
      alert('Treatment plan updated successfully!')
    } catch (error) {
      console.error('Error saving treatment plan:', error)
      setError('Failed to save treatment plan details')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: TreatmentPlan['status']) => {
    if (!treatmentPlan) return

    try {
      const updateData: Partial<TreatmentPlan> = { status: newStatus }
      
      // If marking as completed, set the actual end date
      if (newStatus === 'completed' && !treatmentPlan.actual_end_date) {
        updateData.actual_end_date = new Date().toISOString().split('T')[0]
      }
      
      // If starting a plan, set the start date if not already set
      if (newStatus === 'active' && !treatmentPlan.start_date) {
        updateData.start_date = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('treatment_plans')
        .update(updateData)
        .eq('id', planId)

      if (error) throw error
      
      setTreatmentPlan(prev => prev ? { ...prev, ...updateData } : null)
      setEditedPlan(prev => ({ ...prev, ...updateData }))
      setError(null)
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update treatment plan status')
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'planned': return { color: 'bg-blue-100 text-blue-800', label: 'Planned', icon: Calendar }
      case 'active': return { color: 'bg-green-100 text-green-800', label: 'Active', icon: PlayCircle }
      case 'completed': return { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: CheckCircle }
      case 'paused': return { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: PauseCircle }
      default: return { color: 'bg-gray-100 text-gray-800', label: status, icon: AlertCircle }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading treatment plan details...</div>
      </div>
    )
  }

  if (!treatmentPlan) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Treatment plan not found</div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(treatmentPlan.status)
  const StatusIcon = statusConfig.icon
  const progressPercentage = treatmentPlan.total_sessions > 0 
    ? ((treatmentPlan.completed_sessions || 0) / treatmentPlan.total_sessions) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Treatment Plan: {treatmentPlan.title}
          </h1>
          <p className="text-muted-foreground">
            Patient: {treatmentPlan.patients.full_name} • Progress: {treatmentPlan.completed_sessions || 0}/{treatmentPlan.total_sessions} sessions
          </p>
        </div>
        <Badge className={`${statusConfig.color} flex items-center gap-1`}>
          <StatusIcon className="h-4 w-4" />
          {statusConfig.label}
        </Badge>
        <Button onClick={saveTreatmentPlanDetails} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient & Plan Info */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{treatmentPlan.patients.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p>{treatmentPlan.patients.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <p>{treatmentPlan.patients.date_of_birth ? 
                    new Date().getFullYear() - new Date(treatmentPlan.patients.date_of_birth).getFullYear() 
                    : 'N/A'} years</p>
                </div>
                {treatmentPlan.patients.email && (
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p>{treatmentPlan.patients.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sessions Completed</span>
                    <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{treatmentPlan.completed_sessions || 0} completed</span>
                    <span>{treatmentPlan.total_sessions} total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-medium">Completed Sessions</label>
                    <Input
                      type="number"
                      value={editedPlan.completed_sessions || 0}
                      onChange={(e) => setEditedPlan(prev => ({ ...prev, completed_sessions: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max={editedPlan.total_sessions || 0}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Sessions</label>
                    <Input
                      type="number"
                      value={editedPlan.total_sessions || 0}
                      onChange={(e) => setEditedPlan(prev => ({ ...prev, total_sessions: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Status</label>
                  <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                    <StatusIcon className="h-4 w-4" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('planned')}
                    disabled={treatmentPlan.status === 'planned'}
                    className="justify-start"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mark as Planned
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('active')}
                    disabled={treatmentPlan.status === 'active'}
                    className="justify-start"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Treatment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('paused')}
                    disabled={treatmentPlan.status === 'paused'}
                    className="justify-start"
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause Treatment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('completed')}
                    disabled={treatmentPlan.status === 'completed'}
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Treatment Plan Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Treatment Plan Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plan Title</label>
                  <Input
                    value={editedPlan.title || ''}
                    onChange={(e) => setEditedPlan(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Treatment plan title..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editedPlan.description || ''}
                    onChange={(e) => setEditedPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed treatment plan description, goals, and methodology..."
                    rows={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editedPlan.start_date || ''}
                    onChange={(e) => setEditedPlan(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected End Date</label>
                  <Input
                    type="date"
                    value={editedPlan.expected_end_date || ''}
                    onChange={(e) => setEditedPlan(prev => ({ ...prev, expected_end_date: e.target.value }))}
                  />
                </div>
              </div>
              {treatmentPlan.status === 'completed' && (
                <div>
                  <label className="text-sm font-medium">Actual End Date</label>
                  <Input
                    type="date"
                    value={editedPlan.actual_end_date || ''}
                    onChange={(e) => setEditedPlan(prev => ({ ...prev, actual_end_date: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Estimated Total Cost</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">₹</span>
                    <Input
                      type="number"
                      value={editedPlan.estimated_cost || ''}
                      onChange={(e) => setEditedPlan(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || null }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                {editedPlan.estimated_cost && editedPlan.total_sessions && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Cost per session:</span> ₹{(editedPlan.estimated_cost / editedPlan.total_sessions).toFixed(2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Plan ID:</span>
                  <span className="font-mono text-gray-600">{treatmentPlan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Visit ID:</span>
                  <span className="font-mono text-gray-600">{treatmentPlan.visit_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(treatmentPlan.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Last Updated:</span>
                  <span>{new Date(treatmentPlan.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/consultations/${treatmentPlan.visit_id}`)}
        >
          View Related Consultation
        </Button>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/treatment-plans')}
          >
            Back to Treatment Plans
          </Button>
          <Button onClick={saveTreatmentPlanDetails} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}