'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Pill, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Calculator
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/inventory-manager'
import { workflowManager } from '@/lib/workflow-manager'

interface Prescription {
  id: string
  medicine_id: string
  quantity: number
  dosage: string
  duration: string
  instructions: string
  created_at: string
  visits: {
    id: string
    visit_number: string
    visit_date: string
    patients: {
      id: string
      patient_number: string
      first_name: string
      last_name: string
      allergies?: string
    }
  }
  medicines: {
    id: string
    name: string
    generic_name: string
    strength: string
    dosage_form: string
    unit_price: number
    stock_quantity: number
    manufacturer: string
    batch_number?: string
    expiry_date?: string
  }
}

interface PharmacyIssue {
  id: string
  prescription_id: string
  issued_quantity: number
  unit_price: number
  total_price: number
  status: string
  issued_at: string
  notes?: string
}

interface DispensingItem {
  prescriptionId: string
  medicineId: string
  issuedQuantity: number
  unitPrice: number
  totalPrice: number
  notes: string
}

export function MedicineDispensing() {
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([])
  const [dispensedToday, setDispensedToday] = useState<PharmacyIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [dispensingItems, setDispensingItems] = useState<Record<string, DispensingItem>>({})
  const [totalCost, setTotalCost] = useState(0)
  const [processingBatch, setProcessingBatch] = useState(false)

  const supabase = createClient()

  const fetchPendingPrescriptions = useCallback(async () => {
    try {
      // Get prescriptions that haven't been dispensed yet
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          visits!inner (
            id,
            visit_number,
            visit_date,
            patients!inner (
              id,
              patient_number,
              first_name,
              last_name,
              allergies
            )
          ),
          medicines!inner (
            id,
            name,
            generic_name,
            strength,
            dosage_form,
            unit_price,
            stock_quantity,
            manufacturer
          )
        `)
        .not('id', 'in', `(SELECT prescription_id FROM pharmacy_issues WHERE status = 'dispensed')`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setPendingPrescriptions(prescriptions || [])
    } catch (error) {
      console.error('Error fetching pending prescriptions:', error)
    }
  }, [supabase])

  const fetchDispensedToday = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('pharmacy_issues')
        .select('*')
        .gte('issued_at', today)
        .eq('status', 'dispensed')
        .order('issued_at', { ascending: false })

      if (error) throw error
      setDispensedToday(data || [])
    } catch (error) {
      console.error('Error fetching dispensed prescriptions:', error)
    }
  }, [supabase])

  const preparePrescription = (prescription: Prescription) => {
    const key = prescription.id
    setDispensingItems(prev => ({
      ...prev,
      [key]: {
        prescriptionId: prescription.id,
        medicineId: prescription.medicine_id,
        issuedQuantity: prescription.quantity,
        unitPrice: prescription.medicines.unit_price,
        totalPrice: prescription.medicines.unit_price * prescription.quantity,
        notes: ''
      }
    }))
  }

  const updateDispensingItem = (prescriptionId: string, field: keyof DispensingItem, value: string | number) => {
    setDispensingItems(prev => {
      const updated = { ...prev }
      if (updated[prescriptionId]) {
        updated[prescriptionId] = { ...updated[prescriptionId], [field]: value }
        
        // Recalculate total price when quantity or unit price changes
        if (field === 'issuedQuantity' || field === 'unitPrice') {
          const item = updated[prescriptionId]
          item.totalPrice = Number(item.issuedQuantity) * Number(item.unitPrice)
        }
      }
      return updated
    })
  }

  const calculateTotalBatchCost = () => {
    const total = Object.values(dispensingItems).reduce((sum, item) => sum + item.totalPrice, 0)
    setTotalCost(total)
  }

  const dispenseSinglePrescription = async (prescription: Prescription) => {
    const item = dispensingItems[prescription.id]
    if (!item) return

    try {
      // Check stock availability
      const stockCheck = await inventoryManager.checkStock(item.medicineId, item.issuedQuantity)
      
      if (!stockCheck.available) {
        alert(`Cannot dispense: ${stockCheck.message}`)
        return
      }

      // Get current user
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      // Create pharmacy issue record
      const { error: issueError } = await supabase
        .from('pharmacy_issues')
        .insert({
          prescription_id: prescription.id,
          issued_quantity: item.issuedQuantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          batch_number: prescription.medicines.batch_number,
          expiry_date: prescription.medicines.expiry_date,
          issued_by: user?.id,
          status: 'dispensed',
          notes: item.notes
        })

      if (issueError) throw issueError

      // Deduct stock
      const stockResult = await inventoryManager.deductStock([{
        medicineId: item.medicineId,
        quantity: item.issuedQuantity,
        type: 'deduction',
        reference: `Prescription ${prescription.id}`,
        notes: `Dispensed to ${prescription.visits.patients.first_name} ${prescription.visits.patients.last_name}`
      }])

      if (!stockResult.success) {
        console.error('Stock deduction errors:', stockResult.errors)
        alert('Warning: Medicine dispensed but stock may not have been updated properly')
      }

      // Remove from dispensing items
      setDispensingItems(prev => {
        const updated = { ...prev }
        delete updated[prescription.id]
        return updated
      })

      // Check if all prescriptions for this patient have been dispensed
      const patientId = prescription.visits.patients.id
      const { data: remainingPrescriptions } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('visit_id', prescription.visits.id)
        .not('id', 'in', `(SELECT prescription_id FROM pharmacy_issues WHERE status = 'dispensed')`)

      // If this was the last prescription for this patient, complete pharmacy workflow
      if (!remainingPrescriptions || remainingPrescriptions.length === 0) {
        const workflowResult = await workflowManager.completePharmacy(patientId)
        if (workflowResult.success) {
          alert(`Successfully dispensed ${prescription.medicines.name} to ${prescription.visits.patients.first_name} ${prescription.visits.patients.last_name}. ${workflowResult.message}`)
        } else {
          alert(`Successfully dispensed ${prescription.medicines.name}, but workflow update failed: ${workflowResult.message}`)
        }
      } else {
        alert(`Successfully dispensed ${prescription.medicines.name} to ${prescription.visits.patients.first_name} ${prescription.visits.patients.last_name}`)
      }

      // Refresh data
      fetchPendingPrescriptions()
      fetchDispensedToday()
    } catch (error) {
      console.error('Error dispensing prescription:', error)
      alert('Failed to dispense prescription')
    }
  }

  const dispenseBatch = async () => {
    if (Object.keys(dispensingItems).length === 0) return

    setProcessingBatch(true)
    try {
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      // Process each item
      for (const [prescriptionId, item] of Object.entries(dispensingItems)) {
        const prescription = pendingPrescriptions.find(p => p.id === prescriptionId)
        if (!prescription) continue

        // Check stock
        const stockCheck = await inventoryManager.checkStock(item.medicineId, item.issuedQuantity)
        if (!stockCheck.available) {
          alert(`Skipping ${prescription.medicines.name}: ${stockCheck.message}`)
          continue
        }

        // Create pharmacy issue record
        await supabase
          .from('pharmacy_issues')
          .insert({
            prescription_id: prescriptionId,
            issued_quantity: item.issuedQuantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            issued_by: user?.id,
            status: 'dispensed',
            notes: item.notes
          })

        // Deduct stock
        await inventoryManager.deductStock([{
          medicineId: item.medicineId,
          quantity: item.issuedQuantity,
          type: 'deduction',
          reference: `Prescription ${prescriptionId}`,
          notes: `Batch dispensing - ${prescription.visits.patients.first_name} ${prescription.visits.patients.last_name}`
        }])
      }

      // Check for workflow completions for each patient
      const uniquePatients = [...new Set(Object.keys(dispensingItems).map(prescriptionId => {
        const prescription = pendingPrescriptions.find(p => p.id === prescriptionId)
        return prescription?.visits.patients.id
      }).filter(Boolean))]

      for (const patientId of uniquePatients) {
        if (!patientId) continue
        
        // Check if all prescriptions for this patient have been dispensed
        const patientPrescriptions = pendingPrescriptions.filter(p => p.visits.patients.id === patientId)
        const completedCount = patientPrescriptions.filter(p => dispensingItems[p.id]).length
        
        if (completedCount === patientPrescriptions.length) {
          await workflowManager.completePharmacy(patientId)
        }
      }

      setDispensingItems({})
      fetchPendingPrescriptions()
      fetchDispensedToday()
      alert(`Successfully dispensed batch of ${Object.keys(dispensingItems).length} prescriptions`)
    } catch (error) {
      console.error('Error processing batch:', error)
      alert('Some prescriptions may not have been dispensed properly')
    } finally {
      setProcessingBatch(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchPendingPrescriptions(),
        fetchDispensedToday()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchPendingPrescriptions, fetchDispensedToday])

  useEffect(() => {
    calculateTotalBatchCost()
  }, [dispensingItems]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPrescriptions.length}</div>
            <p className="text-xs text-muted-foreground">awaiting dispensing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Queue</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Object.keys(dispensingItems).length}</div>
            <p className="text-xs text-muted-foreground">being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dispensedToday.length}</div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Total</CardTitle>
            <Calculator className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">ready to dispense</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      {Object.keys(dispensingItems).length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Package className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>{Object.keys(dispensingItems).length} prescriptions ready for batch dispensing</strong>
                <div className="text-sm text-blue-700 mt-1">Total cost: ₹{totalCost.toFixed(2)}</div>
              </div>
              <Button onClick={dispenseBatch} disabled={processingBatch}>
                {processingBatch ? 'Processing...' : 'Dispense All'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pending Prescriptions ({pendingPrescriptions.length})
          </CardTitle>
          <CardDescription>
            Review and dispense prescribed medications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingPrescriptions.map((prescription) => {
              const isPrepared = !!dispensingItems[prescription.id]
              const item = dispensingItems[prescription.id]
              
              return (
                <div key={prescription.id} className={`border rounded-lg p-4 ${isPrepared ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                  <div className="space-y-4">
                    {/* Patient and Prescription Info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {prescription.visits.patients.first_name} {prescription.visits.patients.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {prescription.visits.patients.patient_number} • Visit: {prescription.visits.visit_number}
                            </p>
                          </div>
                        </div>
                        
                        {prescription.visits.patients.allergies && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <strong>Allergies:</strong> {prescription.visits.patients.allergies}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <Badge className={isPrepared ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}>
                          {isPrepared ? 'Prepared' : 'Pending'}
                        </Badge>
                      </div>
                    </div>

                    {/* Medicine Details */}
                    <div className="grid md:grid-cols-2 gap-4 bg-white p-4 rounded border">
                      <div>
                        <h4 className="font-medium text-gray-900">{prescription.medicines.name}</h4>
                        <p className="text-sm text-gray-600">
                          {prescription.medicines.generic_name} • {prescription.medicines.strength} • {prescription.medicines.dosage_form}
                        </p>
                        <p className="text-xs text-gray-500">Manufacturer: {prescription.medicines.manufacturer}</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><strong>Quantity:</strong> {prescription.quantity}</div>
                        <div><strong>Dosage:</strong> {prescription.dosage || 'As prescribed'}</div>
                        <div><strong>Duration:</strong> {prescription.duration || 'As needed'}</div>
                        <div><strong>Instructions:</strong> {prescription.instructions || 'Follow doctor\'s advice'}</div>
                      </div>
                    </div>

                    {/* Stock and Pricing Info */}
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span>
                          Stock: 
                          <Badge className={`ml-1 ${
                            prescription.medicines.stock_quantity === 0 ? 'bg-red-500' :
                            prescription.medicines.stock_quantity < prescription.quantity ? 'bg-yellow-500' :
                            'bg-green-500'
                          } text-white text-xs`}>
                            {prescription.medicines.stock_quantity}
                          </Badge>
                        </span>
                      </div>
                      <div>
                        <strong>Unit Price:</strong> ₹{prescription.medicines.unit_price}
                      </div>
                      <div>
                        <strong>Total Cost:</strong> ₹{(prescription.medicines.unit_price * prescription.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Dispensing Controls */}
                    {isPrepared ? (
                      <div className="space-y-3 bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-medium">Dispensed Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={prescription.medicines.stock_quantity}
                              value={item.issuedQuantity}
                              onChange={(e) => updateDispensingItem(prescription.id, 'issuedQuantity', parseInt(e.target.value) || 1)}
                              className="w-full p-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateDispensingItem(prescription.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full p-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Total: ₹{item.totalPrice.toFixed(2)}</label>
                          </div>
                        </div>
                        
                        <Textarea
                          placeholder="Dispensing notes (optional)"
                          value={item.notes}
                          onChange={(e) => updateDispensingItem(prescription.id, 'notes', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => dispenseSinglePrescription(prescription)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Dispense Now
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDispensingItems(prev => {
                              const updated = { ...prev }
                              delete updated[prescription.id]
                              return updated
                            })}
                          >
                            Remove from Queue
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => preparePrescription(prescription)}
                          disabled={prescription.medicines.stock_quantity === 0}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Prepare for Dispensing
                        </Button>
                        {prescription.medicines.stock_quantity === 0 && (
                          <Alert className="flex-1">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-red-600 text-sm">
                              Out of stock - cannot dispense
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {pendingPrescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No pending prescriptions</h3>
                <p>All prescriptions have been dispensed.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Dispensed */}
      {dispensedToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Dispensed Today ({dispensedToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dispensedToday.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                  <div className="text-sm">
                    <strong>Prescription ID:</strong> {issue.prescription_id.substring(0, 8)}...
                  </div>
                  <div className="text-sm">
                    <strong>Quantity:</strong> {issue.issued_quantity}
                  </div>
                  <div className="text-sm">
                    <strong>Amount:</strong> ₹{issue.total_price.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(issue.issued_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}