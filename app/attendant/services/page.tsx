'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClipboardList, Plus, Search, Clock, User, CheckCircle, XCircle } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  phone: string
}

interface ServiceRequest {
  id: string
  patient_id: string
  service_type: string
  service_name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimated_duration: number
  scheduled_time: string
  completed_at: string | null
  notes: string
  created_at: string
  patients: Patient
}

export default function ServiceQueuePage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [formData, setFormData] = useState({
    service_type: '',
    service_name: '',
    description: '',
    priority: 'medium',
    estimated_duration: '',
    scheduled_time: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [serviceTypes, setServiceTypes] = useState<string[]>([])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchServiceRequests()
    fetchPatients()
    fetchServiceTypes()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchServiceTypes = async () => {
    try {
      // Try to fetch service types from a configuration table
      const { data, error } = await supabase
        .from('service_types')
        .select('name')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.log('Service types table not found, using default values')
        // Fallback to default service types
        setServiceTypes([
          'Laboratory Test',
          'Diagnostic Imaging',
          'Physical Therapy',
          'Vaccination',
          'Health Screening',
          'Wound Care',
          'Injection',
          'Blood Collection',
          'ECG',
          'X-Ray',
          'Ultrasound',
          'Other'
        ])
      } else {
        setServiceTypes(data.map(item => item.name))
      }
    } catch (error) {
      console.error('Error fetching service types:', error)
      // Fallback to default service types
      setServiceTypes([
        'Laboratory Test',
        'Diagnostic Imaging', 
        'Physical Therapy',
        'Vaccination',
        'Health Screening',
        'Wound Care',
        'Injection',
        'Blood Collection',
        'ECG',
        'X-Ray',
        'Ultrasound',
        'Other'
      ])
    }
  }


  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
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
      setServiceRequests(data || [])
    } catch (error) {
      console.error('Error fetching service requests:', error)
      setError('Failed to load service requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedPatient || !formData.service_type || !formData.service_name) {
      setError('Please select a patient and fill in required service details')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const { data, error } = await supabase
        .from('service_requests')
        .insert([{
          patient_id: selectedPatient,
          service_type: formData.service_type,
          service_name: formData.service_name,
          description: formData.description,
          priority: formData.priority,
          status: 'pending',
          estimated_duration: parseInt(formData.estimated_duration) || 30,
          scheduled_time: formData.scheduled_time || new Date().toISOString(),
          notes: formData.notes,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess('Service request added to queue successfully!')
      setFormData({
        service_type: '',
        service_name: '',
        description: '',
        priority: 'medium',
        estimated_duration: '',
        scheduled_time: '',
        notes: ''
      })
      setSelectedPatient('')
      setShowForm(false)
      fetchServiceRequests()
    } catch (error) {
      console.error('Error adding service request:', error)
      setError('Failed to add service request')
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const updateData: { status: string; completed_at?: string } = { status: newStatus }
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error
      
      setSuccess(`Service request ${newStatus} successfully`)
      fetchServiceRequests()
    } catch (error) {
      console.error('Error updating service request status:', error)
      setError('Failed to update service request status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = request.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.service_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length
  const inProgressRequests = filteredRequests.filter(r => r.status === 'in_progress').length
  const completedToday = serviceRequests.filter(r => {
    if (!r.completed_at) return false
    const completedDate = new Date(r.completed_at).toDateString()
    const today = new Date().toDateString()
    return completedDate === today
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading service queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Queue</h1>
          <p className="text-muted-foreground">Manage non-consultation services and procedures</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Service Request
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{pendingRequests}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{inProgressRequests}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-yellow-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{serviceRequests.length}</p>
              </div>
              <User className="h-8 w-8 text-gray-600" />
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
              placeholder="Search by patient name, ID, or service type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredRequests.length} requests found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Service Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service Request</CardTitle>
            <CardDescription>Schedule a non-consultation service for a patient</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <select
                    id="service_type"
                    value={formData.service_type}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select service type...</option>
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="service_name">Service Name *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                    placeholder="e.g., Blood Test - CBC, Chest X-Ray"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Est. Duration (minutes)</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Scheduled Time</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
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
                  placeholder="Additional details about the service..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-16"
                  placeholder="Internal notes or special instructions..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add to Queue</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Service Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Service Queue ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{request.service_name}</h3>
                        <p className="text-sm text-gray-600">
                          {request.patients.first_name} {request.patients.last_name} • {request.patients.patient_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Service Type:</span>
                        <p>{request.service_type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p>{request.estimated_duration} minutes</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Scheduled:</span>
                        <p>{new Date(request.scheduled_time).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p>{request.patients.phone}</p>
                      </div>
                    </div>

                    {request.description && (
                      <p className="text-sm text-gray-600">{request.description}</p>
                    )}

                    {request.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Notes: </span>
                        <span className="text-gray-600">{request.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'in_progress')}
                        >
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {request.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No service requests found matching your search' : 'No service requests in queue yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}