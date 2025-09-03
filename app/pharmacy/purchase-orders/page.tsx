'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/pharmacy/inventory-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Package, 
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  Edit,
  Save,
  Truck
} from 'lucide-react'

interface PurchaseOrder {
  id: string
  order_number: string
  supplier_name: string
  supplier_contact: string
  order_date: string
  expected_delivery_date: string | null
  actual_delivery_date: string | null
  status: 'pending' | 'confirmed' | 'received' | 'cancelled'
  subtotal: number
  gst_amount: number
  total_amount: number
  notes: string | null
  created_at: string
  purchase_order_items: PurchaseOrderItem[]
}

interface PurchaseOrderItem {
  id: string
  medicine_name: string
  salt_content: string
  company_name: string
  quantity: number
  batch_number: string | null
  expiry_date: string | null
  scheme_offer: string | null
  unit_price: number
  gst_percentage: number
  gst_amount: number
  total_price: number
}

interface NewPurchaseOrder {
  supplier_name: string
  supplier_contact: string
  expected_delivery_date: string
  notes: string
  items: NewPurchaseOrderItem[]
}

interface NewPurchaseOrderItem {
  medicine_name: string
  salt_content: string
  company_name: string
  quantity: number
  batch_number: string
  expiry_date: string
  scheme_offer: string
  unit_price: number
  gst_percentage: number
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [newOrder, setNewOrder] = useState<NewPurchaseOrder>({
    supplier_name: '',
    supplier_contact: '',
    expected_delivery_date: '',
    notes: '',
    items: []
  })
  const [newItem, setNewItem] = useState<NewPurchaseOrderItem>({
    medicine_name: '',
    salt_content: '',
    company_name: '',
    quantity: 1,
    batch_number: '',
    expiry_date: '',
    scheme_offer: '',
    unit_price: 0,
    gst_percentage: 18
  })

  const supabase = createClient()

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      // Fetch real purchase orders from database
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching purchase orders:', error)
        throw error
      }
      
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: CheckCircle }
      case 'received':
        return { color: 'bg-green-100 text-green-800', label: 'Received', icon: Package }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: AlertCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: FileText }
    }
  }

  const calculateItemTotal = (item: NewPurchaseOrderItem) => {
    const subtotal = item.quantity * item.unit_price
    const gstAmount = (subtotal * item.gst_percentage) / 100
    return subtotal + gstAmount
  }

  const calculateOrderTotals = () => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const gstAmount = newOrder.items.reduce((sum, item) => sum + ((item.quantity * item.unit_price * item.gst_percentage) / 100), 0)
    const total = subtotal + gstAmount
    return { subtotal, gstAmount, total }
  }

  const addItemToOrder = () => {
    if (!newItem.medicine_name.trim()) {
      setError('Please enter medicine name')
      return
    }
    if (!newItem.company_name.trim()) {
      setError('Please enter company name')
      return
    }
    if (newItem.unit_price <= 0) {
      setError('Please enter a valid unit price greater than 0')
      return
    }

    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }))
    
    setNewItem({
      medicine_name: '',
      salt_content: '',
      company_name: '',
      quantity: 1,
      batch_number: '',
      expiry_date: '',
      scheme_offer: '',
      unit_price: 0,
      gst_percentage: 18
    })
    setError(null)
  }

  const removeItemFromOrder = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateOrderStatus = async (orderId: string, newStatus: PurchaseOrder['status']) => {
    setUpdatingOrderId(orderId)
    setError(null)
    setSuccess(null)
    
    try {
      const order = purchaseOrders.find(o => o.id === orderId)
      if (!order) {
        setError('Order not found')
        return
      }

      // If marking as received, process inventory updates using the inventory manager
      if (newStatus === 'received' && order.status !== 'received') {
        console.log('Processing purchase order for inventory update:', orderId)
        
        // Process the purchase order through inventory manager
        try {
          await inventoryManager.processPurchaseOrder(orderId, order.purchase_order_items.map(item => ({
            medicine_name: item.medicine_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            ...(item.batch_number && { batch_number: item.batch_number }),
            ...(item.expiry_date && { expiry_date: item.expiry_date }),
            company_name: item.company_name,
            supplier_name: order.supplier_name
          })))
          
          setSuccess(`Purchase order ${order.order_number} marked as received and inventory updated!`)
        } catch (inventoryError) {
          console.error('Inventory update failed:', inventoryError)
          setError('Order status updated but inventory update failed: ' + (inventoryError as Error).message)
        }
      } else {
        setSuccess(`Purchase order ${order.order_number} status updated to ${newStatus}!`)
      }
      
      // Update the order status in the database
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          actual_delivery_date: newStatus === 'received' ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      if (updateError) {
        throw updateError
      }
      
      // Update local state to reflect the change
      setPurchaseOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              status: newStatus,
              actual_delivery_date: newStatus === 'received' ? new Date().toISOString().split('T')[0] : (o.actual_delivery_date || null)
            }
          : o
      ))
      
    } catch (error) {
      console.error('Error updating order status:', error)
      setError('Failed to update order status: ' + (error as Error).message)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const createPurchaseOrder = async () => {
    if (!newOrder.supplier_name || newOrder.items.length === 0) {
      setError('Please fill in supplier details and add at least one item')
      return
    }

    try {
      setError(null)
      
      // Calculate totals
      const totals = calculateOrderTotals()
      
      // Generate order number
      const orderNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
      
      // Create purchase order
      const purchaseOrder = {
        order_number: orderNumber,
        supplier_name: newOrder.supplier_name,
        supplier_contact: newOrder.supplier_contact,
        expected_delivery_date: newOrder.expected_delivery_date || null,
        subtotal: parseFloat(totals.subtotal.toFixed(2)),
        gst_amount: parseFloat(totals.gstAmount.toFixed(2)),
        total_amount: parseFloat(totals.total.toFixed(2)),
        notes: newOrder.notes || null,
        status: 'pending'
      }
      
      const { data: createdOrder, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([purchaseOrder])
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // Create purchase order items
      const orderItems = newOrder.items.map(item => ({
        purchase_order_id: createdOrder.id,
        medicine_name: item.medicine_name,
        salt_content: item.salt_content,
        company_name: item.company_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        scheme_offer: item.scheme_offer || null,
        gst_percentage: item.gst_percentage,
        gst_amount: parseFloat(((item.quantity * item.unit_price * item.gst_percentage) / 100).toFixed(2)),
        total_price: parseFloat((item.quantity * item.unit_price * (1 + item.gst_percentage / 100)).toFixed(2))
      }))
      
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      setSuccess(`Purchase order ${orderNumber} created successfully!`)
      setShowNewOrderForm(false)
      setNewOrder({
        supplier_name: '',
        supplier_contact: '',
        expected_delivery_date: '',
        notes: '',
        items: []
      })
      
      // Refresh the orders list
      fetchPurchaseOrders()
      
    } catch (error) {
      console.error('Error creating purchase order:', error)
      setError('Failed to create purchase order: ' + (error as Error).message)
    }
  }

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalOrders = purchaseOrders.length
  const pendingCount = purchaseOrders.filter(o => o.status === 'pending').length
  const confirmedCount = purchaseOrders.filter(o => o.status === 'confirmed').length
  const receivedCount = purchaseOrders.filter(o => o.status === 'received').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading purchase orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage medicine procurement and supplier orders</p>
        </div>
        <Button onClick={() => window.location.href = '/pharmacy/purchase-orders/create'} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">{confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-2xl font-bold text-green-600">{receivedCount}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
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
              placeholder="Search by supplier name or order number..."
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
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length} orders found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Purchase Order Form */}
      {showNewOrderForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Purchase Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Supplier Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Supplier Name *</label>
                <Input
                  value={newOrder.supplier_name}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, supplier_name: e.target.value }))}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact</label>
                <Input
                  value={newOrder.supplier_contact}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, supplier_contact: e.target.value }))}
                  placeholder="Phone/Email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Delivery</label>
                <Input
                  type="date"
                  value={newOrder.expected_delivery_date}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newOrder.notes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Order notes or special instructions"
                rows={2}
              />
            </div>

            {/* Add Item Form */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Add Medicine Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Medicine Name *</label>
                  <Input
                    value={newItem.medicine_name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, medicine_name: e.target.value }))}
                    placeholder="Enter medicine name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Salt/Content</label>
                  <Input
                    value={newItem.salt_content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, salt_content: e.target.value }))}
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input
                    value={newItem.company_name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Manufacturer company"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity *</label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Batch Number</label>
                  <Input
                    value={newItem.batch_number}
                    onChange={(e) => setNewItem(prev => ({ ...prev, batch_number: e.target.value }))}
                    placeholder="Batch number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    type="date"
                    value={newItem.expiry_date}
                    onChange={(e) => setNewItem(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Price *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">GST %</label>
                  <select
                    value={newItem.gst_percentage}
                    onChange={(e) => setNewItem(prev => ({ ...prev, gst_percentage: parseFloat(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Scheme Offer</label>
                  <Input
                    value={newItem.scheme_offer}
                    onChange={(e) => setNewItem(prev => ({ ...prev, scheme_offer: e.target.value }))}
                    placeholder="e.g., Buy 10 Get 1 Free"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Item Total: ₹{calculateItemTotal(newItem).toFixed(2)}
                </div>
                <Button onClick={addItemToOrder} type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Order Items List */}
            {newOrder.items.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Order Items ({newOrder.items.length})</h3>
                <div className="space-y-3">
                  {newOrder.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <h4 className="font-medium">{item.medicine_name}</h4>
                            <Badge variant="outline">{item.company_name}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>Salt: {item.salt_content || 'N/A'}</div>
                            <div>Qty: {item.quantity}</div>
                            <div>Unit: ₹{item.unit_price}</div>
                            <div>GST: {item.gst_percentage}%</div>
                            <div>Batch: {item.batch_number || 'N/A'}</div>
                            <div>Expiry: {item.expiry_date || 'N/A'}</div>
                            <div>Offer: {item.scheme_offer || 'None'}</div>
                            <div className="font-medium">Total: ₹{calculateItemTotal(item).toFixed(2)}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromOrder(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateOrderTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Amount:</span>
                      <span>₹{calculateOrderTotals().gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total Amount:</span>
                      <span>₹{calculateOrderTotals().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={createPurchaseOrder} disabled={newOrder.items.length === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
              <Button variant="outline" onClick={() => setShowNewOrderForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <div 
                  key={order.id} 
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">{order.order_number}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {order.supplier_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                        {order.expected_delivery_date && (
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₹{order.total_amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{order.purchase_order_items.length} items</div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.purchase_order_items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Items:</h4>
                      <div className="space-y-2">
                        {order.purchase_order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                            <div>
                              <div className="font-medium">{item.medicine_name}</div>
                              <div className="text-sm text-gray-600">
                                {item.company_name} • {item.salt_content} • Qty: {item.quantity}
                              </div>
                              {item.scheme_offer && item.scheme_offer !== 'No offer' && (
                                <div className="text-xs text-green-600">🎁 {item.scheme_offer}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">₹{item.total_price.toFixed(2)}</div>
                              <div className="text-xs text-gray-600">GST: {item.gst_percentage}%</div>
                            </div>
                          </div>
                        ))}
                        {order.purchase_order_items.length > 3 && (
                          <div className="text-center text-gray-600 text-sm">
                            +{order.purchase_order_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Status Update Actions */}
                  {order.status !== 'cancelled' && (
                    <div className="border-t mt-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700">Order Actions:</h4>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? 'Updating...' : 'Confirm Order'}
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateOrderStatus(order.id, 'received')}
                              disabled={updatingOrderId === order.id}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              {updatingOrderId === order.id ? 'Processing...' : 'Mark as Received'}
                            </Button>
                          )}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              disabled={updatingOrderId === order.id}
                            >
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                      {order.status === 'received' && order.actual_delivery_date && (
                        <div className="mt-2 text-sm text-green-600">
                          ✅ Delivered on {new Date(order.actual_delivery_date).toLocaleDateString()} - Inventory updated
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cost Breakdown */}
                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subtotal:</span>
                        <div className="font-medium">₹{order.subtotal.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">GST:</span>
                        <div className="font-medium">₹{order.gst_amount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <div className="font-semibold text-lg">₹{order.total_amount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="border-t mt-4 pt-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <p className="text-gray-600 mt-1">{order.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No purchase orders found matching your search' : 'No purchase orders created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}