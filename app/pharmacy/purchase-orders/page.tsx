'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/pharmacy/inventory-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  unit_category: string
  purchase_unit: string
  sale_unit: string
  units_per_purchase_pack: number
  quantity: number
  batch_number: string | null
  expiry_date: string | null
  scheme_offer: string | null
  unit_price: number
  mrp: number
  gst_percentage: number
  gst_amount: number
  total_price: number
}


export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

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
            salt_content: item.salt_content,
            company_name: item.company_name,
            unit_category: item.unit_category,
            purchase_unit: item.purchase_unit,
            sale_unit: item.sale_unit,
            units_per_purchase_pack: item.units_per_purchase_pack,
            quantity: item.quantity,
            unit_price: item.unit_price,
            mrp: item.mrp,
            ...(item.batch_number && { batch_number: item.batch_number }),
            ...(item.expiry_date && { expiry_date: item.expiry_date }),
            scheme_offer: item.scheme_offer,
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
                              <div className="text-xs text-gray-600">
                                Unit: ₹{item.unit_price} • MRP: ₹{item.mrp}
                                {item.mrp > 0 && item.unit_price > 0 && (
                                  <span className="text-green-600 ml-2">
                                    • Margin: {(((item.mrp - item.unit_price) / item.unit_price) * 100).toFixed(1)}%
                                  </span>
                                )}
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