'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, Plus, Search, Clock, FileText, Stethoscope } from 'lucide-react'

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
  patients: Patient
}

interface Procedure {
  id: string
  patient_id: string
  visit_id: string | null
  procedure_name: string
  procedure_type: string
  category: string
  description: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  scheduled_date: string
  performed_date: string | null
  duration_minutes: number
  cost: number
  notes: string
  results: string
  complications: string
  created_at: string
  patients: Patient
  visits?: Visit
}

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedVisit, setSelectedVisit] = useState('')
  const [formData, setFormData] = useState({
    procedure_name: '',
    procedure_type: '',
    category: '',
    description: '',
    scheduled_date: '',
    duration_minutes: '',
    cost: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [procedureCategories, setProcedureCategories] = useState<string[]>([])
  const [procedureTypes, setProcedureTypes] = useState<string[]>([])

  const fetchProcedureConfiguration = useCallback(async () => {
    const supabase = createClient()
    try {
      // Try to fetch procedure categories from configuration
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('procedure_categories')
        .select('name')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) {
        console.log('Procedure categories table not found, using default values')
        setProcedureCategories([
          'Diagnostic',
          'Therapeutic',
          'Surgical',
          'Laboratory',
          'Imaging',
          'Cardiology',
          'Dermatology',
          'Orthopedic',
          'Gynecology',
          'Pediatric',
          'Emergency',
          'Other'
        ])
      } else {
        setProcedureCategories(categoriesData.map(item => item.name))
      }

      // Try to fetch procedure types from configuration  
      const { data: typesData, error: typesError } = await supabase
        .from('procedure_types')
        .select('name')
        .eq('is_active', true)
        .order('name')

      if (typesError) {
        console.log('Procedure types table not found, using default values')
        setProcedureTypes([
          'Blood Test',
          'X-Ray',
          'Ultrasound',
          'CT Scan',
          'MRI',
          'ECG/EKG',
          'Endoscopy',
          'Biopsy',
          'Vaccination',
          'Injection',
          'Wound Care',
          'Physical Therapy',
          'Other'
        ])
      } else {
        setProcedureTypes(typesData.map(item => item.name))
      }
    } catch (error) {
      console.error('Error fetching procedure configuration:', error)
      // Fallback to default values
      setProcedureCategories(['Diagnostic', 'Therapeutic', 'Surgical', 'Laboratory', 'Other'])
      setProcedureTypes(['Blood Test', 'X-Ray', 'Ultrasound', 'Minor Surgery', 'Other'])
    }
  }, [])

  useEffect(() => {
    fetchProcedures()
    fetchPatients()
    fetchProcedureConfiguration()
  }, [fetchProcedures, fetchPatients, fetchProcedureConfiguration])

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientVisits(selectedPatient)
    }
  }, [selectedPatient, fetchPatientVisits])

  const fetchProcedures = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          ),
          visits (
            id,
            visit_number,
            visit_date,
            patients (
              id,
              patient_number,
              first_name,
              last_name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setProcedures(data || [])
    } catch (error) {
      console.error('Error fetching procedures:', error)
      setError('Failed to load procedures')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPatients = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_number, first_name, last_name, phone')
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }, [])

  const fetchPatientVisits = useCallback(async (patientId: string) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error('Error fetching patient visits:', error)
      setVisits([])
    }
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedPatient || !formData.procedure_name || !formData.category) {
      setError('Please select a patient and fill in required procedure details')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const { error } = await supabase
        .from('procedures')
        .insert([{
          patient_id: selectedPatient,
          visit_id: selectedVisit || null,
          procedure_name: formData.procedure_name,
          procedure_type: formData.procedure_type,
          category: formData.category,
          description: formData.description,
          status: 'scheduled',
          scheduled_date: formData.scheduled_date || new Date().toISOString(),
          duration_minutes: parseInt(formData.duration_minutes) || 30,
          cost: parseFloat(formData.cost) || 0,
          notes: formData.notes,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess('Procedure scheduled successfully!')
      setFormData({
        procedure_name: '',
        procedure_type: '',
        category: '',
        description: '',
        scheduled_date: '',
        duration_minutes: '',
        cost: '',
        notes: ''
      })
      setSelectedPatient('')
      setSelectedVisit('')
      setShowForm(false)
      fetchProcedures()
    } catch (error) {
      console.error('Error scheduling procedure:', error)
      setError('Failed to schedule procedure')
    }
  }

  const updateProcedureStatus = async (procedureId: string, newStatus: string) => {
    try {
      const updateData: { status: string; performed_date?: string } = { status: newStatus }
      
      if (newStatus === 'completed') {
        updateData.performed_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('procedures')
        .update(updateData)
        .eq('id', procedureId)

      if (error) throw error
      
      setSuccess(`Procedure ${newStatus} successfully`)
      fetchProcedures()
    } catch (error) {
      console.error('Error updating procedure status:', error)
      setError('Failed to update procedure status')
    }
  }

  const updateProcedureResults = async (procedureId: string, results: string, complications?: string) => {
    try {
      const { error } = await supabase
        .from('procedures')
        .update({ results, complications: complications || '', status: 'completed', performed_date: new Date().toISOString() })
        .eq('id', procedureId)

      if (error) throw error
      
      setSuccess('Procedure results updated successfully')
      fetchProcedures()
    } catch (error) {
      console.error('Error updating procedure results:', error)
      setError('Failed to update procedure results')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'postponed': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProcedures = procedures.filter(procedure => {
    const matchesSearch = procedure.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.procedure_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || procedure.status === filterStatus
    const matchesCategory = filterCategory === 'all' || procedure.category === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const scheduledCount = filteredProcedures.filter(p => p.status === 'scheduled').length
  const inProgressCount = filteredProcedures.filter(p => p.status === 'in_progress').length
  const completedToday = procedures.filter(p => {
    if (!p.performed_date) return false
    const performedDate = new Date(p.performed_date).toDateString()
    const today = new Date().toDateString()
    return performedDate === today
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading procedures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedures</h1>
          <p className="text-muted-foreground">Track and manage medical procedures</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Procedure
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
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
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{completedToday}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Procedures</p>
                <p className="text-2xl font-bold">{procedures.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, or procedure..."
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
              <option value="postponed">Postponed</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Categories</option>
              {procedureCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredProcedures.length} procedures found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Procedure Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Procedure</CardTitle>
            <CardDescription>Schedule a medical procedure for a patient</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patient_select">Select Patient *</Label>
                <select
                  id="patient_select"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.patient_number} ({patient.phone})
                    </option>
                  ))}
                </select>
              </div>

              {visits.length > 0 && (
                <div>
                  <Label htmlFor="visit_select">Link to Visit (Optional)</Label>
                  <select
                    id="visit_select"
                    value={selectedVisit}
                    onChange={(e) => setSelectedVisit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a visit...</option>
                    {visits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.visit_number} - {new Date(visit.visit_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="procedure_name">Procedure Name *</Label>
                  <Input
                    id="procedure_name"
                    value={formData.procedure_name}
                    onChange={(e) => setFormData({...formData, procedure_name: e.target.value})}
                    placeholder="e.g., Chest X-Ray, Blood Test"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="procedure_type">Procedure Type</Label>
                  <select
                    id="procedure_type"
                    value={formData.procedure_type}
                    onChange={(e) => setFormData({...formData, procedure_type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select type...</option>
                    {procedureTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select category...</option>
                    {procedureCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="scheduled_date">Scheduled Date & Time</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Detailed description of the procedure..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-16"
                  placeholder="Additional notes or special instructions..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Schedule Procedure</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Procedures List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Procedures List ({filteredProcedures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProcedures.map((procedure) => (
              <div key={procedure.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{procedure.procedure_name}</h3>
                        <p className="text-sm text-gray-600">
                          {procedure.patients.first_name} {procedure.patients.last_name} • {procedure.patients.patient_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(procedure.status)}`}>
                        {procedure.status.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {procedure.category}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p>{procedure.procedure_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p>{procedure.duration_minutes} minutes</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Cost:</span>
                        <p>₹{procedure.cost?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Scheduled:</span>
                        <p>{new Date(procedure.scheduled_date).toLocaleString()}</p>
                      </div>
                    </div>

                    {procedure.description && (
                      <p className="text-sm text-gray-600">{procedure.description}</p>
                    )}

                    {procedure.results && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Results: </span>
                        <span className="text-gray-600">{procedure.results}</span>
                      </div>
                    )}

                    {procedure.complications && (
                      <div className="text-sm">
                        <span className="font-medium text-red-700">Complications: </span>
                        <span className="text-red-600">{procedure.complications}</span>
                      </div>
                    )}

                    {procedure.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Notes: </span>
                        <span className="text-gray-600">{procedure.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {procedure.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateProcedureStatus(procedure.id, 'in_progress')}
                        >
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProcedureStatus(procedure.id, 'postponed')}
                        >
                          Postpone
                        </Button>
                      </>
                    )}
                    {procedure.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const results = prompt('Enter procedure results:')
                          if (results !== null) {
                            const complications = prompt('Any complications? (Leave empty if none):')
                            updateProcedureResults(procedure.id, results, complications || undefined)
                          }
                        }}
                      >
                        Complete
                      </Button>
                    )}
                    {(procedure.status === 'scheduled' || procedure.status === 'postponed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProcedureStatus(procedure.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredProcedures.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No procedures found matching your search' : 'No procedures scheduled yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}