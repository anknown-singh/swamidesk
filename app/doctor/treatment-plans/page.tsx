'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Plus, Search, Stethoscope, FileText } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  phone: string
}

interface Visit {
  id: string
  visit_number: string
  visit_date: string
  diagnosis: string
  patients: Patient
}

interface TreatmentPlan {
  id: string
  visit_id: string
  patient_id: string
  plan_name: string
  description: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  instructions: string
  follow_up_frequency: string
  created_at: string
  visits: Visit
  patients: Patient
}

export default function TreatmentPlansPage() {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVisit, setSelectedVisit] = useState('')
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    start_date: '',
    end_date: '',
    instructions: '',
    follow_up_frequency: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchTreatmentPlans()
    fetchRecentVisits()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTreatmentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          visits (
            id,
            visit_number,
            visit_date,
            diagnosis,
            patients (
              id,
              patient_number,
              first_name,
              last_name,
              phone
            )
          ),
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTreatmentPlans(data || [])
    } catch (error) {
      console.error('Error fetching treatment plans:', error)
      setError('Failed to load treatment plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentVisits = async () => {
    try {
      // Get completed visits from last 30 days
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          diagnosis,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          )
        `)
        .gte('visit_date', monthAgo.toISOString().split('T')[0])
        .eq('status', 'completed')
        .not('diagnosis', 'is', null)
        .order('visit_date', { ascending: false })

      if (error) throw error
      
      // Map the data to the correct Visit structure
      interface VisitData {
        id: string
        patient_id: string
        visit_number: string
        visit_date: string
        diagnosis: string
        created_at: string
        patients?: { id: string; full_name: string; phone: string }[]
      }
      const mappedVisits = (data as any[] || []).map((visit: any) => ({
        ...visit,
        patient: visit.patients?.[0] // Convert patients array to single patient
      })) as Visit[]
      
      setRecentVisits(mappedVisits)
    } catch (error) {
      console.error('Error fetching recent visits:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedVisit || !formData.plan_name.trim()) {
      setError('Please select a visit and enter a plan name')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      // Get patient ID from selected visit
      const visit = recentVisits.find(v => v.id === selectedVisit)
      if (!visit) {
        setError('Selected visit not found')
        return
      }

      const { error } = await supabase
        .from('treatment_plans')
        .insert([{
          visit_id: selectedVisit,
          patient_id: visit.patients.id,
          plan_name: formData.plan_name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: 'active',
          instructions: formData.instructions,
          follow_up_frequency: formData.follow_up_frequency,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess('Treatment plan created successfully!')
      setFormData({
        plan_name: '',
        description: '',
        start_date: '',
        end_date: '',
        instructions: '',
        follow_up_frequency: ''
      })
      setSelectedVisit('')
      setShowForm(false)
      fetchTreatmentPlans()
    } catch (error) {
      console.error('Error creating treatment plan:', error)
      setError('Failed to create treatment plan')
    }
  }

  const updatePlanStatus = async (planId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({ status: newStatus })
        .eq('id', planId)

      if (error) throw error
      
      setSuccess('Treatment plan status updated')
      fetchTreatmentPlans()
    } catch (error) {
      console.error('Error updating treatment plan status:', error)
      setError('Failed to update treatment plan status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPlans = treatmentPlans.filter(plan =>
    plan.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activePlans = filteredPlans.filter(p => p.status === 'active').length
  const completedPlans = filteredPlans.filter(p => p.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading treatment plans...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treatment Plans</h1>
          <p className="text-muted-foreground">Manage ongoing patient treatment plans and schedules</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Treatment Plan
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-green-600">{activePlans}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Plans</p>
                <p className="text-2xl font-bold text-blue-600">{completedPlans}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold">{treatmentPlans.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search treatment plans by patient name, ID, or plan name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">
              {filteredPlans.length} treatment plans found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Treatment Plan Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Treatment Plan</CardTitle>
            <CardDescription>Create a comprehensive treatment plan for patient care</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="visit_select">Select Patient Visit *</Label>
                <select
                  id="visit_select"
                  value={selectedVisit}
                  onChange={(e) => setSelectedVisit(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a recent visit...</option>
                  {recentVisits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.patients.first_name} {visit.patients.last_name} - {visit.visit_number} 
                      ({new Date(visit.visit_date).toLocaleDateString()}) - {visit.diagnosis}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_name">Treatment Plan Name *</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                    placeholder="e.g., Hypertension Management Plan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="follow_up_frequency">Follow-up Frequency</Label>
                  <Input
                    id="follow_up_frequency"
                    value={formData.follow_up_frequency}
                    onChange={(e) => setFormData({...formData, follow_up_frequency: e.target.value})}
                    placeholder="e.g., Weekly, Monthly, Every 3 months"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Expected End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Brief description of the treatment plan..."
                />
              </div>

              <div>
                <Label htmlFor="instructions">Treatment Instructions</Label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                  placeholder="Detailed treatment instructions, medication regimen, lifestyle changes, etc."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Treatment Plan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Active Treatment Plans ({filteredPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                        <p className="text-sm text-gray-600">
                          {plan.patients.first_name} {plan.patients.last_name} • {plan.patients.patient_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status.toUpperCase()}
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-gray-700">{plan.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p>
                          {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'Not set'} - 
                          {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Ongoing'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Follow-up:</span>
                        <p>{plan.follow_up_frequency || 'As needed'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p>{new Date(plan.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {plan.instructions && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">Instructions:</span>
                        <p className="text-sm text-gray-600 mt-1">{plan.instructions}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {plan.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePlanStatus(plan.id, 'paused')}
                        >
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updatePlanStatus(plan.id, 'completed')}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                    {plan.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updatePlanStatus(plan.id, 'active')}
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredPlans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No treatment plans found matching your search' : 'No treatment plans created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}