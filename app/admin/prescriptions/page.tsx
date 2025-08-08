'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Search, Users, Pill, Calendar, User, Clock, CheckCircle } from 'lucide-react'

interface Prescription {
  id: string
  visit_id: string
  medicine_id: string
  quantity: number
  dosage: string | null
  duration: string | null
  instructions: string | null
  status: 'pending' | 'dispensed' | 'cancelled'
  created_at: string
  medicines: {
    id: string
    name: string
    unit_price: number
    dosage_form: string
    category: string
  }
  visits: {
    id: string
    visit_date: string
    chief_complaint: string
    diagnosis: string
    doctor_id: string
    patients: {
      id: string
      full_name: string
      phone: string
      date_of_birth: string
    }
  }
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDoctor, setFilterDoctor] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchPrescriptions = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medicines (
            id,
            name,
            unit_price,
            dosage_form,
            category
          ),
          visits (
            id,
            visit_date,
            chief_complaint,
            diagnosis,
            doctor_id,
            patients (
              id,
              full_name,
              phone,
              date_of_birth
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
  }, [])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

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
    const matchesSearch = prescription.visits?.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.visits?.patients?.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.visits?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.medicines.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus
    const matchesDoctor = filterDoctor === 'all' || prescription.visits?.doctor_id === filterDoctor
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = prescription.visits?.visit_date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = prescription.visits?.visit_date ? new Date(prescription.visits.visit_date) >= weekAgo : false
    } else if (dateFilter === 'this_month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = prescription.visits?.visit_date ? new Date(prescription.visits.visit_date) >= monthAgo : false
    }
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate
  })

  const totalPrescriptions = prescriptions.length
  const pendingCount = prescriptions.filter(p => p.status === 'pending').length
  const dispensedCount = prescriptions.filter(p => p.status === 'dispensed').length
  const cancelledCount = prescriptions.filter(p => p.status === 'cancelled').length
  const todayPrescriptions = prescriptions.filter(p => 
    p.visits?.visit_date === new Date().toISOString().split('T')[0]
  ).length

  // Get unique doctors for filter (simplified - no doctor names without relationships)
  const doctors: any[] = []

  const totalRevenue = prescriptions
    .filter(p => p.status === 'dispensed')
    .reduce((sum, p) => sum + (p.quantity * p.medicines.unit_price), 0)

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
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
              </div>
              <Pill className="h-8 w-8 text-red-600" />
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
                <div 
                  key={prescription.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => window.location.href = `/admin/prescriptions/${prescription.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{prescription.visits?.patients?.full_name || 'Unknown Patient'}</h3>
                          <p className="text-sm text-gray-600">
                            ID: {prescription.visits?.patients?.id?.slice(0, 8)}...
                            {prescription.visits?.patients?.phone && ` • ${prescription.visits.patients.phone}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">₹{(prescription.quantity * prescription.medicines.unit_price).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Qty: {prescription.quantity}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p>Dr. {prescription.visits?.doctor_id ? prescription.visits.doctor_id.slice(0, 8) + '...' : 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Medicine:</span>
                            <p>{prescription.medicines.name} ({prescription.medicines.dosage_form})</p>
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
                            <p>{prescription.visits?.patients?.date_of_birth ? 
                                new Date().getFullYear() - new Date(prescription.visits.patients.date_of_birth).getFullYear() 
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

                      {prescription.dosage && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Dosage:</span>
                          <p className="text-gray-600 mt-1">{prescription.dosage}</p>
                        </div>
                      )}

                      {prescription.duration && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-600 mt-1">{prescription.duration}</p>
                        </div>
                      )}

                      {prescription.instructions && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Instructions:</span>
                          <p className="text-gray-600 mt-1">{prescription.instructions}</p>
                        </div>
                      )}

                      {/* Medicine Details */}
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Medicine Details:</span>
                        <div className="mt-2">
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{prescription.medicines.name} ({prescription.medicines.dosage_form})</p>
                                <p className="text-gray-600 text-sm">
                                  Category: {prescription.medicines.category} • Quantity: {prescription.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{(prescription.quantity * prescription.medicines.unit_price).toFixed(2)}</p>
                                <p className="text-sm text-gray-600">₹{prescription.medicines.unit_price}/unit</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/admin/prescriptions/${prescription.id}`
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