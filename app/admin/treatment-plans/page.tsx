'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Search, CheckCircle, AlertCircle, PlayCircle, PauseCircle, User, Clock } from 'lucide-react'

interface TreatmentPlan {
  id: string
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
  visits?: {
    id: string
    visit_date: string
    doctor_id: string
    chief_complaint: string
    diagnosis: string
    patients: {
      id: string
      full_name: string
      phone: string
      date_of_birth: string
    }
    users: {
      id: string
      full_name: string
      email: string
    }
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

  const fetchTreatmentPlans = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTreatmentPlans(data || [])
    } catch (error) {
      console.error('Error fetching treatment plans:', error)
      setError('Failed to load treatment plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTreatmentPlans()
  }, [fetchTreatmentPlans])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'planned':
        return { color: 'bg-blue-100 text-blue-800', label: 'Planned', icon: Calendar }
      case 'active':
        return { color: 'bg-green-100 text-green-800', label: 'Active', icon: PlayCircle }
      case 'completed':
        return { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: CheckCircle }
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: PauseCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: AlertCircle }
    }
  }

  const filteredTreatmentPlans = treatmentPlans.filter(plan => {
    const matchesSearch = plan.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.visit_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus
    const matchesDoctor = filterDoctor === 'all' // Simplified since we don't have doctor relation
    
    let matchesDate = true
    if (dateFilter === 'active') {
      const now = new Date()
      const startDate = plan.start_date ? new Date(plan.start_date) : null
      const endDate = plan.expected_end_date ? new Date(plan.expected_end_date) : null
      matchesDate = plan.status === 'active' && 
                   (!startDate || startDate <= now) && 
                   (!endDate || now <= endDate)
    } else if (dateFilter === 'upcoming') {
      matchesDate = plan.start_date ? new Date(plan.start_date) > new Date() : false
    } else if (dateFilter === 'completed') {
      matchesDate = plan.status === 'completed'
    }
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate
  })

  const totalPlans = treatmentPlans.length
  const plannedCount = treatmentPlans.filter(p => p.status === 'planned').length
  const activeCount = treatmentPlans.filter(p => p.status === 'active').length
  const completedCount = treatmentPlans.filter(p => p.status === 'completed').length
  const pausedCount = treatmentPlans.filter(p => p.status === 'paused').length

  // Simplified doctor filter (empty for now since no relationships)
  const doctors: Array<{ id: string; full_name: string }> = []

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
                <p className="text-sm text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-red-600">{plannedCount}</p>
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
              const isExpired = plan.expected_end_date ? new Date(plan.expected_end_date) < new Date() : false
              
              return (
                <div 
                  key={plan.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => window.location.href = `/admin/treatment-plans/${plan.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.title}</h3>
                          <p className="text-sm text-gray-600">Plan ID: {plan.id.slice(0, 8)}...</p>
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
                            <span className="font-medium text-gray-700">Sessions:</span>
                            <p>{plan.completed_sessions || 0} / {plan.total_sessions || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Start Date:</span>
                            <p>{plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">End Date:</span>
                            <p>{plan.expected_end_date ? new Date(plan.expected_end_date).toLocaleDateString() : 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Cost:</span>
                            <p>{plan.estimated_cost ? `₹${plan.estimated_cost.toFixed(2)}` : 'Not estimated'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <p className="text-gray-600">{plan.status}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Visit ID:</span>
                          <p className="text-gray-600">{plan.visit_id?.slice(0, 8) || 'N/A'}...</p>
                        </div>
                      </div>

                      {plan.description && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="text-gray-600 mt-1">{plan.description}</p>
                        </div>
                      )}


                      <div className="text-sm text-gray-500">
                        Created: {new Date(plan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/admin/treatment-plans/${plan.id}`
                        }}
                        className="whitespace-nowrap"
                      >
                        View Details
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Click to manage
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