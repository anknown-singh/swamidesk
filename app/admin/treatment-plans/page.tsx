'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Search, Users, FileText, CheckCircle, AlertCircle, PlayCircle, PauseCircle, XCircle, User, Clock } from 'lucide-react'

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
  visits: {
    id: string
    visit_date: string
    doctor_id: string
    chief_complaint: string
    diagnosis: string
    users: {
      id: string
      full_name: string
      email: string
    }
  }
  patients: {
    id: string
    patient_id: string
    full_name: string
    phone: string
    date_of_birth: string
  }
}

export default function AdminTreatmentPlansPage() {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDoctor, setFilterDoctor] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchTreatmentPlans()
  }, [])

  const fetchTreatmentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          visits (
            id,
            visit_date,
            doctor_id,
            chief_complaint,
            diagnosis,
            users!visits_doctor_id_fkey (
              id,
              full_name,
              email
            )
          ),
          patients (
            id,
            patient_id,
            full_name,
            phone,
            date_of_birth
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTreatmentPlans(data || [])
    } catch (error) {
      console.error('Error fetching treatment plans:', error)
      setError('Failed to load treatment plans')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', label: 'Active', icon: PlayCircle }
      case 'completed':
        return { color: 'bg-blue-100 text-blue-800', label: 'Completed', icon: CheckCircle }
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: PauseCircle }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: AlertCircle }
    }
  }

  const filteredTreatmentPlans = treatmentPlans.filter(plan => {
    const matchesSearch = plan.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.patients.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.visits?.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.visits?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus
    const matchesDoctor = filterDoctor === 'all' || plan.visits?.doctor_id === filterDoctor
    
    let matchesDate = true
    if (dateFilter === 'active') {
      const now = new Date()
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      matchesDate = startDate <= now && now <= endDate && plan.status === 'active'
    } else if (dateFilter === 'upcoming') {
      matchesDate = new Date(plan.start_date) > new Date()
    } else if (dateFilter === 'expired') {
      matchesDate = new Date(plan.end_date) < new Date()
    }
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate
  })

  const totalPlans = treatmentPlans.length
  const activeCount = treatmentPlans.filter(p => p.status === 'active').length
  const completedCount = treatmentPlans.filter(p => p.status === 'completed').length
  const pausedCount = treatmentPlans.filter(p => p.status === 'paused').length
  const expiredCount = treatmentPlans.filter(p => {
    return new Date(p.end_date) < new Date() && p.status === 'active'
  }).length

  // Get unique doctors for filter
  const doctors = Array.from(new Set(treatmentPlans.map(p => p.visits?.users?.id).filter(Boolean)))
    .map(doctorId => treatmentPlans.find(p => p.visits?.users?.id === doctorId)?.visits?.users)
    .filter(Boolean)

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
          <h1 className="text-3xl font-bold tracking-tight">Treatment Plan Management</h1>
          <p className="text-muted-foreground">Administrative view of all patient treatment plans</p>
        </div>
        <Button onClick={() => window.location.href = '/doctor/treatment-plans'} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          New Treatment Plan
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold">{totalPlans}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{pausedCount}</p>
              </div>
              <PauseCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, doctor, plan name, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor?.id} value={doctor?.id}>
                  {doctor?.full_name}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Periods</option>
              <option value="active">Currently Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredTreatmentPlans.length} treatment plans found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Treatment Plans ({filteredTreatmentPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTreatmentPlans.map((plan) => {
              const statusConfig = getStatusConfig(plan.status)
              const StatusIcon = statusConfig.icon
              const isExpired = new Date(plan.end_date) < new Date()
              const daysRemaining = Math.ceil((new Date(plan.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                          <p className="text-sm text-gray-600">{plan.patients.full_name} • ID: {plan.patients.patient_id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>
                        {isExpired && plan.status === 'active' && (
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            EXPIRED
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p>{plan.visits?.users?.full_name || 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Start Date:</span>
                            <p>{new Date(plan.start_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">End Date:</span>
                            <p>{new Date(plan.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Duration:</span>
                            <p>{isExpired ? 'Expired' : daysRemaining > 0 ? `${daysRemaining} days left` : 'Ending today'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Follow-up Frequency:</span>
                          <p className="text-gray-600">{plan.follow_up_frequency || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Visit Date:</span>
                          <p className="text-gray-600">{plan.visits?.visit_date ? 
                              new Date(plan.visits.visit_date).toLocaleDateString() 
                              : 'N/A'}</p>
                        </div>
                      </div>

                      {plan.visits?.diagnosis && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Related Diagnosis:</span>
                          <p className="text-gray-600 mt-1">{plan.visits.diagnosis}</p>
                        </div>
                      )}

                      {plan.description && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="text-gray-600 mt-1">{plan.description}</p>
                        </div>
                      )}

                      {plan.instructions && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Instructions:</span>
                          <p className="text-gray-600 mt-1">{plan.instructions}</p>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        Created: {new Date(plan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredTreatmentPlans.length === 0 && (
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