'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/pharmacy/inventory-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  ShoppingBag, 
  Package, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  CreditCard,
  X
} from 'lucide-react'

interface SellOrder {
  id: string
  order_number: string
  customer_name: string
  customer_contact: string
  customer_address: string
  sale_date: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  gst_amount: number
  total_amount: number
  discount_amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
  sell_order_items: SellOrderItem[]
}

interface SellOrderItem {
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


export default function SellOrdersPage() {
  const router = useRouter()
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSellOrders = useCallback(async () => {
    try {
      // Try to fetch real sell orders from database
      const { data, error } = await supabase
        .from('sell_orders')
        .select(`
          *,
          sell_order_items (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching sell orders:', error)
        throw error
      }
      
      setSellOrders(data || [])
    } catch (error) {
      console.error('Error fetching sell orders:', error)
      setError('Failed to load sell orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSellOrders()
  }, [fetchSellOrders])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Order Placed', icon: Clock }
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', label: 'Ready for Dispensing', icon: Package }
      case 'shipped':
        return { color: 'bg-green-100 text-green-800', label: 'Dispensed', icon: CheckCircle }
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', label: 'Dispensed', icon: CheckCircle }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: AlertCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: FileText }
    }
  }


  const updateOrderStatus = async (orderId: string, newStatus: SellOrder['status']) => {
    try {
      setError(null)
      setSuccessMessage(null)

      // Find the order in our current state
      const order = sellOrders.find(o => o.id === orderId)
      if (!order) {
        setError('Order not found')
        return
      }

      console.log(`Updating sell order ${orderId} status from ${order.status} to ${newStatus}`)

      // If marking as dispensed, process inventory deductions using the inventory manager
      if ((newStatus === 'delivered' || newStatus === 'shipped') && order.status !== 'delivered' && order.status !== 'shipped') {
        console.log('Processing sell order for inventory deduction:', orderId)
        
        // Process the sell order through inventory manager for automatic stock deduction
        try {
          await inventoryManager.processSellOrder(orderId, order.sell_order_items.map(item => ({
            medicine_name: item.medicine_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            batch_number: item.batch_number || undefined
          })))

          setSuccessMessage(`Order ${order.order_number} dispensed and inventory automatically updated!`)
        } catch (inventoryError) {
          console.error('Inventory deduction failed:', inventoryError)
          setError('Order status updated but inventory deduction failed: ' + (inventoryError as Error).message)
        }
      } else {
        const statusLabel = newStatus === 'confirmed' ? 'ready for dispensing' : 
                           newStatus === 'pending' ? 'placed' : 
                           newStatus === 'cancelled' ? 'cancelled' : newStatus
        setSuccessMessage(`Order ${order.order_number} marked as ${statusLabel}`)
      }

      // Update the order status in the database
      const { error: updateError } = await supabase
        .from('sell_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (updateError) {
        throw updateError
      }

      // Update local state to reflect the change
      setSellOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId 
            ? { ...o, status: newStatus, updated_at: new Date().toISOString() }
            : o
        )
      )

    } catch (error) {
      console.error('Error updating order status:', error)
      setError('Failed to update order status: ' + (error as Error).message)
    }
  }


  const filteredOrders = sellOrders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalOrders = sellOrders.length
  const pendingCount = sellOrders.filter(o => o.status === 'pending').length
  const confirmedCount = sellOrders.filter(o => o.status === 'confirmed').length
  const dispensedCount = sellOrders.filter(o => o.status === 'delivered' || o.status === 'shipped').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading sell orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicine Dispensing</h1>
          <p className="text-muted-foreground">Manage medicine orders and dispensing workflow</p>
        </div>
        <Button onClick={() => window.location.href = '/pharmacy/sell-orders/create'} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
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
              <ShoppingBag className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm text-gray-600">Ready to Dispense</p>
                <p className="text-2xl font-bold text-blue-600">{confirmedCount}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
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
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by customer name or order number..."
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
              <option value="pending">Order Placed</option>
              <option value="confirmed">Ready to Dispense</option>
              <option value="shipped">Dispensed</option>
              <option value="delivered">Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length} orders found
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Sell Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Medicine Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <div key={order.id} className="border rounded-lg p-6">
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
                          <User className="h-4 w-4" />
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.sale_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {order.payment_method}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₹{order.total_amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{order.sell_order_items.length} items</div>
                      
                      {/* Order Action Buttons */}
                      <div className="flex gap-2 mt-3 justify-end">
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Ready for Dispensing
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel Order
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Dispense Medicine
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel Order
                            </Button>
                          </>
                        )}
                        {(order.status === 'delivered' || order.status === 'shipped') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/pharmacy/invoices/${order.id}`)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Show Invoice
                            </Button>
                            <div className="text-xs text-green-600 mt-1">
                              ✅ Dispensed & Inventory Updated
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.sell_order_items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Items:</h4>
                      <div className="space-y-2">
                        {order.sell_order_items.slice(0, 3).map((item) => (
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
                        {order.sell_order_items.length > 3 && (
                          <div className="text-center text-gray-600 text-sm">
                            +{order.sell_order_items.length - 3} more items
                          </div>
                        )}
                      </div>
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
                        <div className="font-medium">₹{((order.subtotal - (order.discount_amount || 0)) * 0.12).toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <div className="font-semibold text-lg">₹{order.total_amount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <p className="text-gray-600">{order.customer_contact}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <p className="text-gray-600">{order.customer_address}</p>
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
                {searchTerm ? 'No medicine orders found matching your search' : 'No medicine orders created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}