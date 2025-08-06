'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pill, Search, Clock, CheckCircle, Package, AlertTriangle } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  phone: string
}

interface Medicine {
  id: string
  name: string
  generic_name: string
  brand_name: string
  strength: string
  stock_quantity: number
  unit_price: number
}

interface PrescriptionItem {
  id: string
  medicine_id: string
  quantity: number
  dosage: string
  frequency: string
  duration: string
  medicines: Medicine
}

interface Prescription {
  id: string
  patient_id: string
  total_amount: number
  status: string
  created_at: string
  patients: Patient
  prescription_items: PrescriptionItem[]
}

interface PharmacyQueue {
  id: string
  prescription_id: string
  patient_id: string
  status: 'pending' | 'preparing' | 'ready' | 'dispensed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  queue_number: string
  total_amount: number
  dispensed_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  notes: string
  dispensed_at: string | null
  created_at: string
  prescriptions: Prescription
  patients: Patient
}

export default function PharmacyQueuePage() {
  const [queueItems, setQueueItems] = useState<PharmacyQueue[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPharmacyQueue()
    fetchPendingPrescriptions()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPharmacyQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_queue')
        .select(`
          *,
          prescriptions (
            id,
            total_amount,
            status,
            created_at,
            patients (
              id,
              patient_number,
              first_name,
              last_name,
              phone
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
                generic_name,
                brand_name,
                strength,
                stock_quantity,
                unit_price
              )
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
      setQueueItems(data || [])
    } catch (error) {
      console.error('Error fetching pharmacy queue:', error)
      setError('Failed to load pharmacy queue')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name,
            phone
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
              generic_name,
              brand_name,
              strength,
              stock_quantity,
              unit_price
            )
          )
        `)
        .eq('status', 'pending')
        .not('id', 'in', `(${queueItems.map(q => q.prescription_id).join(',') || 'NULL'})`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error fetching pending prescriptions:', error)
    }
  }

  const addToQueue = async (prescriptionId: string) => {
    try {
      // Get prescription details
      const prescription = prescriptions.find(p => p.id === prescriptionId)
      if (!prescription) {
        setError('Prescription not found')
        return
      }

      // Generate queue number
      const queueNumber = `PQ${Date.now().toString().slice(-6)}`

      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const { data, error } = await supabase
        .from('pharmacy_queue')
        .insert([{
          prescription_id: prescriptionId,
          patient_id: prescription.patient_id,
          status: 'pending',
          priority: 'medium',
          queue_number: queueNumber,
          total_amount: prescription.total_amount,
          dispensed_amount: 0,
          payment_status: 'unpaid',
          notes: '',
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess(`Prescription added to pharmacy queue with number ${queueNumber}`)
      
      // Update prescription status
      await supabase
        .from('prescriptions')
        .update({ status: 'in_pharmacy' })
        .eq('id', prescriptionId)

      fetchPharmacyQueue()
      fetchPendingPrescriptions()
    } catch (error) {
      console.error('Error adding to queue:', error)
      setError('Failed to add prescription to queue')
    }
  }

  const updateQueueStatus = async (queueId: string, newStatus: string) => {
    try {
      const updateData: { status: string; dispensed_at?: string; payment_status?: string } = { status: newStatus }
      
      if (newStatus === 'dispensed') {
        updateData.dispensed_at = new Date().toISOString()
        updateData.payment_status = 'paid'
        
        // Also update prescription status
        const queueItem = queueItems.find(q => q.id === queueId)
        if (queueItem) {
          await supabase
            .from('prescriptions')
            .update({ status: 'dispensed' })
            .eq('id', queueItem.prescription_id)
        }
      }

      const { error } = await supabase
        .from('pharmacy_queue')
        .update(updateData)
        .eq('id', queueId)

      if (error) throw error
      
      setSuccess(`Queue item ${newStatus} successfully`)
      fetchPharmacyQueue()
    } catch (error) {
      console.error('Error updating queue status:', error)
      setError('Failed to update queue status')
    }
  }

  const updatePaymentStatus = async (queueId: string, paymentStatus: string, paidAmount?: number) => {
    try {
      const updateData: { payment_status: string; dispensed_amount?: number } = { payment_status: paymentStatus }
      
      if (paidAmount !== undefined) {
        updateData.dispensed_amount = paidAmount
      }

      const { error } = await supabase
        .from('pharmacy_queue')
        .update(updateData)
        .eq('id', queueId)

      if (error) throw error
      
      setSuccess('Payment status updated successfully')
      fetchPharmacyQueue()
    } catch (error) {
      console.error('Error updating payment status:', error)
      setError('Failed to update payment status')
    }
  }

  const updatePriority = async (queueId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('pharmacy_queue')
        .update({ priority })
        .eq('id', queueId)

      if (error) throw error
      
      setSuccess('Priority updated successfully')
      fetchPharmacyQueue()
    } catch (error) {
      console.error('Error updating priority:', error)
      setError('Failed to update priority')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'dispensed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'unpaid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredQueue = queueItems.filter(item => {
    const matchesSearch = item.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.queue_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesPayment = filterPayment === 'all' || item.payment_status === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const pendingCount = filteredQueue.filter(q => q.status === 'pending').length
  const preparingCount = filteredQueue.filter(q => q.status === 'preparing').length
  const readyCount = filteredQueue.filter(q => q.status === 'ready').length
  const dispensedToday = queueItems.filter(q => {
    if (!q.dispensed_at) return false
    const dispensedDate = new Date(q.dispensed_at).toDateString()
    const today = new Date().toDateString()
    return dispensedDate === today
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading pharmacy queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Queue</h1>
          <p className="text-muted-foreground">Manage pharmacy queue and medicine dispensing</p>
        </div>
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
                <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-yellow-600">{preparingCount}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-green-600">{readyCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispensed Today</p>
                <p className="text-2xl font-bold text-gray-600">{dispensedToday}</p>
              </div>
              <Pill className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Prescriptions */}
      {prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Prescriptions ({prescriptions.length})
            </CardTitle>
            <CardDescription>Prescriptions waiting to be added to pharmacy queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.slice(0, 5).map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {prescription.patients.first_name} {prescription.patients.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {prescription.patients.patient_number} • {prescription.prescription_items.length} items • ₹{prescription.total_amount?.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToQueue(prescription.id)}
                  >
                    Add to Queue
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, or queue number..."
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
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredQueue.length} items in queue
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmacy Queue ({filteredQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQueue.map((queueItem) => (
              <div key={queueItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">Queue #{queueItem.queue_number}</h3>
                        <p className="text-sm text-gray-600">
                          {queueItem.patients.first_name} {queueItem.patients.last_name} • {queueItem.patients.patient_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(queueItem.status)}`}>
                        {queueItem.status.toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(queueItem.priority)}`}>
                        {queueItem.priority.toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentColor(queueItem.payment_status)}`}>
                        {queueItem.payment_status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Total Amount:</span>
                        <p>₹{queueItem.total_amount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Paid Amount:</span>
                        <p>₹{queueItem.dispensed_amount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Items:</span>
                        <p>{queueItem.prescriptions?.prescription_items?.length || 0} medicines</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p>{queueItem.patients.phone}</p>
                      </div>
                    </div>

                    {queueItem.prescriptions?.prescription_items && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">Medicines:</span>
                        <div className="mt-1 space-y-1">
                          {queueItem.prescriptions.prescription_items.map((item) => (
                            <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                              <span>
                                {item.medicines.name} ({item.medicines.strength}) - {item.quantity} units
                              </span>
                              <span>₹{(item.medicines.unit_price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {queueItem.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Notes: </span>
                        <span className="text-gray-600">{queueItem.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {queueItem.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateQueueStatus(queueItem.id, 'preparing')}
                        >
                          Start Preparing
                        </Button>
                        <select
                          value={queueItem.priority}
                          onChange={(e) => updatePriority(queueItem.id, e.target.value)}
                          className="text-xs p-1 border border-gray-300 rounded"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </>
                    )}
                    {queueItem.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => updateQueueStatus(queueItem.id, 'ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {queueItem.status === 'ready' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            const paidAmount = prompt(`Enter payment amount (Total: ₹${queueItem.total_amount}):`)
                            if (paidAmount !== null) {
                              const amount = parseFloat(paidAmount)
                              if (amount >= queueItem.total_amount) {
                                updatePaymentStatus(queueItem.id, 'paid', amount)
                                updateQueueStatus(queueItem.id, 'dispensed')
                              } else if (amount > 0) {
                                updatePaymentStatus(queueItem.id, 'partial', amount)
                              }
                            }
                          }}
                        >
                          Dispense
                        </Button>
                      </>
                    )}
                    {(queueItem.status === 'pending' || queueItem.status === 'preparing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQueueStatus(queueItem.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredQueue.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No queue items found matching your search' : 'No items in pharmacy queue yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}