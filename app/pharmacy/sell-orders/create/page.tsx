'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/pharmacy/inventory-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  ShoppingBag, 
  Plus,
  Minus,
  X,
  User,
  Pill,
  Calculator,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  phone: string
  email: string | null
  date_of_birth: string
  address: string | null
}

interface Medicine {
  id: string
  name: string
  generic_name: string | null
  brand_name: string | null
  strength: string | null
  dosage_form: string | null
  unit_price: number
  stock_quantity: number
  minimum_stock: number
  manufacturer: string | null
  batch_number: string | null
  expiry_date: string | null
  is_active: boolean
}

interface OrderItem {
  medicine: Medicine
  quantity: number
  unit_price: number
  subtotal: number
  gst_percentage: number
  gst_amount: number
  total: number
}

interface CustomerInfo {
  type: 'registered' | 'new'
  patient_id?: string
  name: string
  phone: string
  email: string
  address: string
}

export default function CreateSellOrderPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPatient, setSearchPatient] = useState('')
  const [searchMedicine, setSearchMedicine] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Customer Information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    type: 'registered',
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  
  // Order Items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  
  // Order Details
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, full_name, phone, email, date_of_birth, address')
        .order('full_name')

      if (patientsError) throw patientsError

      // Fetch active medicines with stock
      const { data: medicinesData, error: medicinesError } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name')

      if (medicinesError) throw medicinesError

      setPatients(patientsData || [])
      setMedicines(medicinesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const selectPatient = (patient: Patient) => {
    setCustomerInfo({
      type: 'registered',
      patient_id: patient.id,
      name: patient.full_name,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || ''
    })
    setSearchPatient(patient.full_name)
    setShowPatientDropdown(false)
  }

  const selectMedicine = (medicine: Medicine) => {
    // Check if medicine already exists in order
    const existingItemIndex = orderItems.findIndex(item => item.medicine.id === medicine.id)
    
    if (existingItemIndex >= 0) {
      // Increase quantity if already exists
      updateQuantity(existingItemIndex, orderItems[existingItemIndex].quantity + 1)
    } else {
      // Add new medicine with quantity 1
      const gstPercentage = 18 // Default GST
      const subtotal = medicine.unit_price * 1
      const gstAmount = (subtotal * gstPercentage) / 100
      const total = subtotal + gstAmount

      const newItem: OrderItem = {
        medicine,
        quantity: 1,
        unit_price: medicine.unit_price,
        subtotal,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount,
        total
      }

      setOrderItems(prev => [...prev, newItem])
    }
    
    setSearchMedicine('')
    setShowMedicineDropdown(false)
    setError(null)
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setOrderItems(prev => 
      prev.map((item, i) => {
        if (i === index) {
          const subtotal = item.unit_price * newQuantity
          const gstAmount = (subtotal * item.gst_percentage) / 100
          const total = subtotal + gstAmount
          
          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            gst_amount: gstAmount,
            total
          }
        }
        return item
      })
    )
  }

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const gstTotal = orderItems.reduce((sum, item) => sum + item.gst_amount, 0)
    const discountAmount = (subtotal * discount) / 100
    const grandTotal = subtotal + gstTotal - discountAmount

    return {
      subtotal: subtotal.toFixed(2),
      gstTotal: gstTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    patient.phone.includes(searchPatient)
  )

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchMedicine.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(searchMedicine.toLowerCase()) ||
    medicine.brand_name?.toLowerCase().includes(searchMedicine.toLowerCase())
  )

  const createOrder = async () => {
    if (!customerInfo.name.trim()) {
      setError('Please select a patient or enter customer information')
      return
    }

    if (orderItems.length === 0) {
      setError('Please add at least one medicine to the order')
      return
    }

    try {
      setError(null)
      const totals = calculateTotals()
      
      // Generate order number
      const orderNumber = `SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
      
      // Create sell order
      const sellOrder = {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_contact: customerInfo.phone || 'N/A',
        customer_address: customerInfo.address || 'N/A',
        customer_email: customerInfo.email || null,
        patient_id: customerInfo.type === 'registered' ? customerInfo.patient_id : null,
        subtotal: parseFloat(totals.subtotal),
        gst_amount: parseFloat(totals.gstTotal),
        discount_amount: parseFloat(totals.discountAmount),
        total_amount: parseFloat(totals.grandTotal),
        payment_method: paymentMethod,
        notes: notes || null,
        status: 'pending'
      }
      
      console.log('Creating sell order:', sellOrder)
      
      const { data: createdOrder, error: orderError } = await supabase
        .from('sell_orders')
        .insert([sellOrder])
        .select()
        .single()
      
      if (orderError) {
        console.error('Error creating sell order:', orderError)
        throw orderError
      }
      
      console.log('Sell order created successfully:', createdOrder)
      
      // Create sell order items
      const sellOrderItems = orderItems.map(item => ({
        sell_order_id: createdOrder.id,
        medicine_name: item.medicine.name,
        salt_content: item.medicine.generic_name || item.medicine.strength || 'N/A',
        company_name: item.medicine.manufacturer || 'Unknown',
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_number: item.medicine.batch_number || null,
        expiry_date: item.medicine.expiry_date || null,
        scheme_offer: 'No offer',
        gst_percentage: item.gst_percentage,
        gst_amount: parseFloat(item.gst_amount.toFixed(2)),
        total_price: parseFloat(item.total.toFixed(2))
      }))
      
      console.log('Creating sell order items:', sellOrderItems.length, 'items')
      
      const { error: itemsError } = await supabase
        .from('sell_order_items')
        .insert(sellOrderItems)
      
      if (itemsError) {
        console.error('Error creating sell order items:', itemsError)
        throw itemsError
      }
      
      console.log('Sell order items created successfully')
      
      setSuccess(`Sell order ${orderNumber} created successfully for ${customerInfo.name}! Total: ₹${totals.grandTotal}`)
      
      // Reset form after successful creation
      setTimeout(() => {
        router.push('/pharmacy/sell-orders')
      }, 2000)

    } catch (error) {
      console.error('Error creating sell order:', error)
      setError('Failed to create sell order: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/pharmacy/sell-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Sell Order</h1>
          <p className="text-muted-foreground">Add medicines and create a new customer order</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Information & Medicine Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={customerInfo.type === 'registered' ? 'default' : 'outline'}
                  onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'registered' }))}
                >
                  Registered Patient
                </Button>
                <Button
                  variant={customerInfo.type === 'new' ? 'default' : 'outline'}
                  onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'new' }))}
                >
                  New Customer
                </Button>
              </div>

              {customerInfo.type === 'registered' ? (
                <div className="relative">
                  <Input
                    placeholder="Search registered patients..."
                    value={searchPatient}
                    onChange={(e) => {
                      setSearchPatient(e.target.value)
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                  />
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredPatients.slice(0, 10).map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                          onClick={() => selectPatient(patient)}
                        >
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-gray-600">
                            {patient.phone} • {patient.email || 'No email'}
                          </div>
                          {patient.address && (
                            <div className="text-xs text-gray-500 mt-1">{patient.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Customer phone number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Customer email (optional)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Customer address"
                    />
                  </div>
                </div>
              )}

              {customerInfo.name && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-medium text-green-800">{customerInfo.name}</div>
                  <div className="text-sm text-green-600">
                    {customerInfo.phone} • {customerInfo.email}
                  </div>
                  {customerInfo.address && (
                    <div className="text-xs text-green-600 mt-1">{customerInfo.address}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicine Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Add Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, generic name, or brand..."
                  value={searchMedicine}
                  onChange={(e) => {
                    setSearchMedicine(e.target.value)
                    setShowMedicineDropdown(true)
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  className="pl-10"
                />
                {showMedicineDropdown && filteredMedicines.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredMedicines.slice(0, 10).map((medicine) => (
                      <div
                        key={medicine.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => selectMedicine(medicine)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-gray-600">
                              {medicine.generic_name && `${medicine.generic_name} • `}
                              {medicine.strength && `${medicine.strength} • `}
                              {medicine.dosage_form}
                            </div>
                            <div className="text-xs text-gray-500">
                              {medicine.manufacturer} • Stock: {medicine.stock_quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{medicine.unit_price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">per unit</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={item.medicine.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.medicine.name}</h4>
                            <Badge variant="outline">{item.medicine.manufacturer}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.medicine.generic_name && `${item.medicine.generic_name} • `}
                            {item.medicine.strength && `${item.medicine.strength} • `}
                            {item.medicine.dosage_form}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Stock Available: {item.medicine.stock_quantity} units
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              disabled={item.quantity >= item.medicine.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Price Info */}
                          <div className="text-right min-w-[100px]">
                            <div className="font-medium">₹{item.total.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} × ₹{item.unit_price.toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Billing Summary */}
        <div className="lg:col-span-1">
          {orderItems.length > 0 && (
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="online">Online Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Discount (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Order notes or special instructions"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Amount:</span>
                      <span>₹{totals.gstTotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>-₹{totals.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Grand Total:</span>
                      <span>₹{totals.grandTotal}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={createOrder}
                      disabled={!customerInfo.name || orderItems.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Create Sell Order
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/pharmacy/sell-orders')}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}