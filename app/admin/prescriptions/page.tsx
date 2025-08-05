'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Search, Users, Pill, Calendar, User, Clock, CheckCircle } from 'lucide-react'

interface Prescription {
  id: string
  visit_id: string
  patient_id: string
  doctor_id: string
  prescription_date: string
  instructions: string
  status: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled'
  total_amount: number
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
  visits: {
    id: string
    visit_date: string
    chief_complaint: string
    diagnosis: string
  }
  prescription_items: Array<{
    id: string
    medicine_id: string
    quantity: number
    dosage: string
    frequency: string
    duration: string
    medicines: {
      id: string
      name: string
      strength: string
      unit_price: number
    }
  }>
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDoctor, setFilterDoctor] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            id,
            patient_id,
            full_name,
            phone,
            date_of_birth
          ),
          users!prescriptions_doctor_id_fkey (
            id,
            full_name,
            email
          ),
          visits (
            id,
            visit_date,
            chief_complaint,
            diagnosis
          ),
          prescription_items (
            id,
            medicine_id,
            quantity,
            dosage,
            frequency,
            duration,
            medicines (
              id,
              name,
              strength,
              unit_price
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
      case 'dispensed':
        return { color: 'bg-green-100 text-green-800', label: 'Dispensed' }
      case 'partially_dispensed':
        return { color: 'bg-blue-100 text-blue-800', label: 'Partially Dispensed' }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status }
    }
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.patients.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.visits?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.prescription_items.some(item => 
                           item.medicines.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus
    const matchesDoctor = filterDoctor === 'all' || prescription.doctor_id === filterDoctor
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = prescription.prescription_date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(prescription.prescription_date) >= weekAgo
    } else if (dateFilter === 'this_month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(prescription.prescription_date) >= monthAgo
    }
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate
  })

  const totalPrescriptions = prescriptions.length
  const pendingCount = prescriptions.filter(p => p.status === 'pending').length
  const dispensedCount = prescriptions.filter(p => p.status === 'dispensed').length
  const partiallyDispensedCount = prescriptions.filter(p => p.status === 'partially_dispensed').length
  const todayPrescriptions = prescriptions.filter(p => 
    p.prescription_date === new Date().toISOString().split('T')[0]
  ).length

  // Get unique doctors for filter
  const doctors = Array.from(new Set(prescriptions.map(p => p.users?.id).filter(Boolean)))
    .map(doctorId => prescriptions.find(p => p.users?.id === doctorId)?.users)
    .filter(Boolean)

  const totalRevenue = prescriptions
    .filter(p => p.status === 'dispensed')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading prescriptions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescription Management</h1>
          <p className="text-muted-foreground">Administrative view of all patient prescriptions</p>
        </div>
        <Button onClick={() => window.location.href = '/doctor/prescriptions'} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold">{totalPrescriptions}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispensed</p>
                <p className="text-2xl font-bold text-green-600">{dispensedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial</p>
                <p className="text-2xl font-bold text-blue-600">{partiallyDispensedCount}</p>
              </div>
              <Pill className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-purple-600">{todayPrescriptions}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
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
              placeholder="Search by patient name, doctor, medicine, or diagnosis..."
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
              <option value="pending">Pending</option>
              <option value="dispensed">Dispensed</option>
              <option value="partially_dispensed">Partially Dispensed</option>
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
              {filteredPrescriptions.length} prescriptions found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescriptions ({filteredPrescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => {
              const statusConfig = getStatusConfig(prescription.status)
              
              return (
                <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{prescription.patients.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            ID: {prescription.patients.patient_id}
                            {prescription.patients.phone && ` • ${prescription.patients.phone}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">₹{prescription.total_amount?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">{prescription.prescription_items.length} items</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p>{prescription.users?.full_name || 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Date:</span>
                            <p>{new Date(prescription.prescription_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Visit Date:</span>
                            <p>{prescription.visits?.visit_date ? 
                                new Date(prescription.visits.visit_date).toLocaleDateString() 
                                : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Age:</span>
                            <p>{prescription.patients.date_of_birth ? 
                                new Date().getFullYear() - new Date(prescription.patients.date_of_birth).getFullYear() 
                                : 'N/A'} years</p>
                          </div>
                        </div>
                      </div>

                      {prescription.visits?.diagnosis && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Diagnosis:</span>
                          <p className="text-gray-600 mt-1">{prescription.visits.diagnosis}</p>
                        </div>
                      )}

                      {prescription.instructions && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Instructions:</span>
                          <p className="text-gray-600 mt-1">{prescription.instructions}</p>
                        </div>
                      )}

                      {/* Prescription Items */}
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Medicines:</span>
                        <div className="mt-2 space-y-2">
                          {prescription.prescription_items.map((item, index) => (
                            <div key={item.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{item.medicines.name} ({item.medicines.strength})</p>
                                  <p className="text-gray-600 text-sm">
                                    Qty: {item.quantity} • Dosage: {item.dosage} • 
                                    Frequency: {item.frequency} • Duration: {item.duration}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{(item.quantity * item.medicines.unit_price).toFixed(2)}</p>
                                  <p className="text-sm text-gray-600">₹{item.medicines.unit_price}/unit</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No prescriptions found matching your search' : 'No prescriptions created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}