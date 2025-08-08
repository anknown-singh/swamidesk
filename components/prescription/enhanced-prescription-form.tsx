'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Package,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/inventory-manager'

interface Medicine {
  id: string
  name: string
  generic_name: string
  manufacturer: string
  strength: string
  dosage_form: string
  unit_price: number
  stock_quantity: number
  minimum_stock: number
}

interface Visit {
  id: string
  visit_number: string
  visit_date: string
  patients: {
    id: string
    patient_number: string
    first_name: string
    last_name: string
  }
}

interface PrescriptionItem {
  medicine_id: string
  quantity: number
  dosage: string
  duration: string
  instructions: string
  stockCheck?: {
    available: boolean
    currentStock: number
    message: string
    suggestedAlternatives?: Medicine[]
  }
}

interface EnhancedPrescriptionFormProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onCancel: () => void
}

export function EnhancedPrescriptionForm({ 
  onSuccess, 
  onError, 
  onCancel 
}: EnhancedPrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [medicineSearch, setMedicineSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalCost, setTotalCost] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchMedicines()
    fetchRecentVisits()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Calculate total cost whenever items change
    calculateTotalCost()
  }, [prescriptionItems]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
    }
  }

  const fetchRecentVisits = async () => {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          patients!inner (
            id,
            patient_number,
            first_name,
            last_name
          )
        `)
        .gte('visit_date', weekAgo.toISOString().split('T')[0])
        .in('status', ['in_consultation', 'services_pending', 'completed'])
        .order('visit_date', { ascending: false })

      if (error) throw error
      
      // Transform data to handle patients array from Supabase
      const transformedData = (data || []).map(visit => ({
        ...visit,
        patients: Array.isArray(visit.patients) ? visit.patients[0] : visit.patients
      }))
      
      setRecentVisits(transformedData)
    } catch (error) {
      console.error('Error fetching recent visits:', error)
    }
  }

  const calculateTotalCost = async () => {
    if (prescriptionItems.length === 0) {
      setTotalCost(0)
      return
    }

    const items = prescriptionItems
      .filter(item => item.medicine_id && item.quantity > 0)
      .map(item => ({
        medicineId: item.medicine_id,
        quantity: item.quantity
      }))

    if (items.length > 0) {
      const { totalCost } = await inventoryManager.calculatePrescriptionCost(items)
      setTotalCost(totalCost)
    }
  }

  const checkStockForItem = async (index: number) => {
    const item = prescriptionItems[index]
    if (!item.medicine_id || !item.quantity) return

    const stockCheck = await inventoryManager.checkStock(item.medicine_id, item.quantity)
    
    const updated = [...prescriptionItems]
    updated[index] = { ...updated[index], stockCheck }
    setPrescriptionItems(updated)
  }

  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, {
      medicine_id: '',
      quantity: 1,
      dosage: '',
      duration: '',
      instructions: ''
    }])
  }

  const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    const updated = [...prescriptionItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Clear stock check when medicine or quantity changes
    if (field === 'medicine_id' || field === 'quantity') {
      delete updated[index].stockCheck
    }
    
    setPrescriptionItems(updated)
    
    // Auto-check stock when both medicine and quantity are set
    if (field === 'medicine_id' || field === 'quantity') {
      setTimeout(() => checkStockForItem(index), 500)
    }
  }

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index))
  }

  const getStockStatus = (item: PrescriptionItem) => {
    if (!item.stockCheck) {
      return { icon: <Clock className="h-4 w-4 text-gray-400" />, message: 'Checking stock...', color: 'text-gray-500' }
    }
    
    if (item.stockCheck.available) {
      return { 
        icon: <CheckCircle className="h-4 w-4 text-green-600" />, 
        message: item.stockCheck.message, 
        color: 'text-green-600' 
      }
    } else {
      return { 
        icon: <XCircle className="h-4 w-4 text-red-600" />, 
        message: item.stockCheck.message, 
        color: 'text-red-600' 
      }
    }
  }

  const savePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!selectedVisit || prescriptionItems.length === 0) {
      onError('Please select a visit and add at least one medicine')
      setIsSubmitting(false)
      return
    }

    // Check if any items have stock issues
    const itemsWithStockIssues = prescriptionItems.filter(item => 
      item.stockCheck && !item.stockCheck.available
    )

    if (itemsWithStockIssues.length > 0) {
      onError('Cannot save prescription: Some medicines have insufficient stock. Please review the stock alerts.')
      setIsSubmitting(false)
      return
    }

    try {
      // Get current user
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const prescriptionsToInsert = prescriptionItems
        .filter(item => item.medicine_id && item.quantity > 0)
        .map(item => ({
          visit_id: selectedVisit,
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          dosage: item.dosage,
          duration: item.duration,
          instructions: item.instructions,
          prescribed_by: user?.id
        }))

      const { error } = await supabase
        .from('prescriptions')
        .insert(prescriptionsToInsert)

      if (error) throw error

      onSuccess(`Prescription saved successfully! Total estimated cost: ₹${totalCost.toFixed(2)}`)
    } catch (error) {
      console.error('Error saving prescription:', error)
      onError('Failed to save prescription')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    medicine.manufacturer?.toLowerCase().includes(medicineSearch.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create New Prescription with Stock Verification
        </CardTitle>
        <CardDescription>
          Select patient visit, add medications with real-time stock checking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={savePrescription} className="space-y-6">
          {/* Visit Selection */}
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
                  {visit.patients.first_name} {visit.patients.last_name} - {visit.visit_number} ({new Date(visit.visit_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Total Cost Display */}
          {totalCost > 0 && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <strong>Estimated Total Cost: ₹{totalCost.toFixed(2)}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Prescription Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Medications with Stock Verification</Label>
              <Button type="button" onClick={addPrescriptionItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>

            {prescriptionItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                No medications added yet. Click &quot;Add Medicine&quot; to start.
              </div>
            )}

            <div className="space-y-4">
              {prescriptionItems.map((item, index) => {
                const selectedMedicine = medicines.find(m => m.id === item.medicine_id)
                const stockStatus = getStockStatus(item)
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">Medicine #{index + 1}</h4>
                        {item.stockCheck && (
                          <div className={`flex items-center gap-2 text-sm ${stockStatus.color}`}>
                            {stockStatus.icon}
                            <span>{stockStatus.message}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => removePrescriptionItem(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Medicine *</Label>
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search medicines..."
                              value={medicineSearch}
                              onChange={(e) => setMedicineSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <select
                            value={item.medicine_id}
                            onChange={(e) => updatePrescriptionItem(index, 'medicine_id', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Select medicine...</option>
                            {filteredMedicines.map((medicine) => (
                              <option 
                                key={medicine.id} 
                                value={medicine.id}
                                disabled={medicine.stock_quantity === 0}
                              >
                                {medicine.name} - {medicine.strength} ({medicine.dosage_form}) 
                                - Stock: {medicine.stock_quantity}
                                {medicine.stock_quantity === 0 ? ' - OUT OF STOCK' : 
                                 medicine.stock_quantity <= medicine.minimum_stock ? ' - LOW STOCK' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Medicine Details */}
                        {selectedMedicine && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div><strong>Generic:</strong> {selectedMedicine.generic_name}</div>
                              <div><strong>Manufacturer:</strong> {selectedMedicine.manufacturer}</div>
                              <div><strong>Price:</strong> ₹{selectedMedicine.unit_price}</div>
                              <div>
                                <strong>Stock:</strong> 
                                <Badge className={`ml-1 ${
                                  selectedMedicine.stock_quantity === 0 ? 'bg-red-500' :
                                  selectedMedicine.stock_quantity <= selectedMedicine.minimum_stock ? 'bg-yellow-500' :
                                  'bg-green-500'
                                } text-white text-xs`}>
                                  {selectedMedicine.stock_quantity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stock Check Alternatives */}
                        {item.stockCheck?.suggestedAlternatives && item.stockCheck.suggestedAlternatives.length > 0 && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Suggested Alternatives:</strong>
                              <div className="mt-2 space-y-1">
                                {item.stockCheck.suggestedAlternatives.map(alt => (
                                  <div key={alt.id} className="text-xs">
                                    <button
                                      type="button"
                                      onClick={() => updatePrescriptionItem(index, 'medicine_id', alt.id)}
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {alt.name} - {alt.strength} (Stock: {alt.stock_quantity})
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                        {selectedMedicine && (
                          <div className="text-xs text-gray-500 mt-1">
                            Cost: ₹{(selectedMedicine.unit_price * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g., 7 days, 2 weeks"
                          value={item.duration}
                          onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Dosage</Label>
                        <Input
                          placeholder="e.g., 1 tablet twice daily"
                          value={item.dosage}
                          onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Instructions</Label>
                        <Input
                          placeholder="e.g., Take after meals"
                          value={item.instructions}
                          onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Prescription'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}