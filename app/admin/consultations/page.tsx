'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Stethoscope, Search, Users, FileText, Clock, Calendar, User } from 'lucide-react'

interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  visit_time: string
  chief_complaint: string
  symptoms: string
  diagnosis: string
  examination_notes: string
  vital_signs: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  patients: {
    id: string
    patient_id: string
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

export default function AdminConsultationsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDoctor, setFilterDoctor] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchVisits()
  }, [])

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (
            id,
            patient_id,
            full_name,
            phone,
            date_of_birth
          ),
          users!visits_doctor_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('visit_date', { ascending: false })
        .order('visit_time', { ascending: false })

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error('Error fetching visits:', error)
      setError('Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' }
      case 'in_progress':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed' }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status }
    }
  }

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.patients.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || visit.status === filterStatus
    const matchesDoctor = filterDoctor === 'all' || visit.doctor_id === filterDoctor
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = visit.visit_date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(visit.visit_date) >= weekAgo
    } else if (dateFilter === 'this_month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(visit.visit_date) >= monthAgo
    }
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate
  })

  const totalVisits = visits.length
  const scheduledCount = visits.filter(v => v.status === 'scheduled').length
  const inProgressCount = visits.filter(v => v.status === 'in_progress').length
  const completedCount = visits.filter(v => v.status === 'completed').length
  const todayVisits = visits.filter(v => v.visit_date === new Date().toISOString().split('T')[0]).length

  // Get unique doctors for filter
  const doctors = Array.from(new Set(visits.map(v => v.users?.id).filter(Boolean)))
    .map(doctorId => visits.find(v => v.users?.id === doctorId)?.users)
    .filter(Boolean)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading consultations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation Management</h1>
          <p className="text-muted-foreground">Administrative view of all patient consultations</p>
        </div>
        <Button onClick={() => window.location.href = '/doctor/consultations'} className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          New Consultation
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
                <p className="text-sm text-gray-600">Total Consultations</p>
                <p className="text-2xl font-bold">{totalVisits}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Visits</p>
                <p className="text-2xl font-bold text-purple-600">{todayVisits}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
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
              placeholder="Search by patient name, doctor, complaint, or diagnosis..."
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
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredVisits.length} consultations found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Consultations ({filteredVisits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVisits.map((visit) => {
              const statusConfig = getStatusConfig(visit.status)
              
              return (
                <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{visit.patients.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            ID: {visit.patients.patient_id}
                            {visit.patients.phone && ` • ${visit.patients.phone}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p>{visit.users?.full_name || 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Date:</span>
                            <p>{new Date(visit.visit_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Time:</span>
                            <p>{visit.visit_time || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Age:</span>
                            <p>{visit.patients.date_of_birth ? 
                                new Date().getFullYear() - new Date(visit.patients.date_of_birth).getFullYear() 
                                : 'N/A'} years</p>
                          </div>
                        </div>
                      </div>

                      {visit.chief_complaint && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Chief Complaint:</span>
                          <p className="text-gray-600 mt-1">{visit.chief_complaint}</p>
                        </div>
                      )}

                      {visit.diagnosis && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Diagnosis:</span>
                          <p className="text-gray-600 mt-1">{visit.diagnosis}</p>
                        </div>
                      )}

                      {visit.symptoms && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Symptoms:</span>
                          <p className="text-gray-600 mt-1">{visit.symptoms}</p>
                        </div>
                      )}

                      {visit.vital_signs && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Vital Signs:</span>
                          <p className="text-gray-600 mt-1">{visit.vital_signs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredVisits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No consultations found matching your search' : 'No consultations scheduled yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}