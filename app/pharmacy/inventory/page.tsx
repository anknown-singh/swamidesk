'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { inventoryManager } from '@/lib/pharmacy/inventory-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Activity,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  ShoppingCart
} from 'lucide-react'

interface Medicine {
  id: string
  name: string
  generic_name: string
  brand_name: string
  strength: string
  dosage_form: string
  unit_price: number
  stock_quantity: number
  minimum_stock: number
  expiry_date: string
  batch_number: string
  manufacturer: string
  supplier: string
  is_active: boolean
  created_at: string
}

interface InventoryTransaction {
  id: string
  medicine_id: string
  transaction_type: 'stock_in' | 'stock_out' | 'adjustment' | 'expired' | 'damaged'
  quantity: number
  unit_cost: number
  total_cost: number
  reference_id: string | null
  reference_type: string | null
  batch_number: string
  expiry_date: string
  supplier: string
  notes: string
  created_at: string
  medicines: Medicine
}

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showStockForm, setShowStockForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterExpiry, setFilterExpiry] = useState<string>('all')
  const [selectedMedicine, setSelectedMedicine] = useState('')
  const [stockFormData, setStockFormData] = useState({
    transaction_type: 'stock_in',
    quantity: '',
    unit_cost: '',
    batch_number: '',
    expiry_date: '',
    supplier: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lowStockAlerts, setLowStockAlerts] = useState<Medicine[]>([])

  const supabase = createClient()
  // const router = useRouter()

  useEffect(() => {
    fetchMedicines()
    fetchTransactions()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMedicines = async () => {
    try {
      // Use inventory manager for enhanced data fetching
      const inventoryStatus = await inventoryManager.getInventoryStatus()
      setMedicines(inventoryStatus.medicines || [])
      
      // Also get low stock alerts
      const lowStockMedicines = await inventoryManager.getLowStockMedicines()
      setLowStockAlerts(lowStockMedicines)
      if (lowStockMedicines.length > 0) {
        console.log(`Found ${lowStockMedicines.length} medicines with low stock`)
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
      setError('Failed to load medicines')
      
      // Fallback to direct database query
      try {
        const { data, error: dbError } = await supabase
          .from('medicines')
          .select('*')
          .order('name', { ascending: true })

        if (dbError) throw dbError
        setMedicines(data || [])
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      // Since inventory_transactions table doesn't exist yet and transactions are logged to console only,
      // we'll use mock data for now. In a full implementation, this would query a real transactions table.
      
      // For now, just set empty transactions to avoid console errors
      setTransactions([])
      
      // TODO: When inventory_transactions table is created, uncomment below:
      // const { data, error } = await supabase
      //   .from('inventory_transactions')
      //   .select(`
      //     *,
      //     medicines (
      //       id,
      //       name,
      //       generic_name,
      //       brand_name,
      //       strength
      //     )
      //   `)
      //   .order('created_at', { ascending: false })
      //   .limit(50)
      //
      // if (error) throw error
      // setTransactions(data || [])
      
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    }
  }

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedMedicine || !stockFormData.quantity) {
      setError('Please select a medicine and enter quantity')
      return
    }

    try {
      const quantity = parseInt(stockFormData.quantity)
      const unitCost = parseFloat(stockFormData.unit_cost) || 0
      const medicine = medicines.find(m => m.id === selectedMedicine)
      
      if (!medicine) {
        setError('Medicine not found')
        return
      }

      // Use inventory manager for stock adjustments
      if (stockFormData.transaction_type === 'stock_in') {
        await inventoryManager.adjustStock(
          medicine.name,
          quantity,
          'stock_in',
          stockFormData.notes || 'Manual stock addition',
          {
            batch_number: stockFormData.batch_number,
            expiry_date: stockFormData.expiry_date,
            supplier: stockFormData.supplier,
            unit_cost: unitCost
          }
        )
      } else if (stockFormData.transaction_type === 'stock_out') {
        await inventoryManager.adjustStock(
          medicine.name,
          -quantity,
          'stock_out',
          stockFormData.notes || 'Manual stock removal',
          {
            batch_number: stockFormData.batch_number,
            expiry_date: stockFormData.expiry_date
          }
        )
      } else if (stockFormData.transaction_type === 'adjustment') {
        await inventoryManager.adjustStock(
          medicine.name,
          quantity,
          'adjustment',
          stockFormData.notes || 'Stock adjustment',
          {
            batch_number: stockFormData.batch_number,
            expiry_date: stockFormData.expiry_date,
            unit_cost: unitCost
          }
        )
      } else if (stockFormData.transaction_type === 'expired') {
        await inventoryManager.adjustStock(
          medicine.name,
          -quantity,
          'expired',
          stockFormData.notes || 'Expired stock removal',
          {
            batch_number: stockFormData.batch_number,
            expiry_date: stockFormData.expiry_date
          }
        )
      } else if (stockFormData.transaction_type === 'damaged') {
        await inventoryManager.adjustStock(
          medicine.name,
          -quantity,
          'damaged',
          stockFormData.notes || 'Damaged stock removal',
          {
            batch_number: stockFormData.batch_number,
            expiry_date: stockFormData.expiry_date
          }
        )
      }

      setSuccess(`Stock ${stockFormData.transaction_type} recorded successfully`)
      setStockFormData({
        transaction_type: 'stock_in',
        quantity: '',
        unit_cost: '',
        batch_number: '',
        expiry_date: '',
        supplier: '',
        notes: ''
      })
      setSelectedMedicine('')
      setShowStockForm(false)
      fetchMedicines()
      fetchTransactions()
    } catch (error) {
      console.error('Error processing stock transaction:', error)
      setError('Failed to process stock transaction: ' + (error as Error).message)
    }
  }

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'no_expiry', color: 'bg-gray-100 text-gray-800', label: 'No Expiry' }
    
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', label: 'Expired' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' }
    } else if (daysUntilExpiry <= 90) {
      return { status: 'expiring_3months', color: 'bg-yellow-100 text-yellow-800', label: 'Expires in 3 Months' }
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', label: 'Good' }
    }
  }

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock_quantity === 0) {
      return { status: 'out_of_stock', color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
    } else if (medicine.stock_quantity <= medicine.minimum_stock) {
      return { status: 'low_stock', color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
    } else {
      return { status: 'in_stock', color: 'bg-green-100 text-green-800', label: 'In Stock' }
    }
  }

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const stockStatus = getStockStatus(medicine)
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'in_stock' && stockStatus.status === 'in_stock') ||
                         (filterStatus === 'low_stock' && stockStatus.status === 'low_stock') ||
                         (filterStatus === 'out_of_stock' && stockStatus.status === 'out_of_stock')
    
    const expiryStatus = getExpiryStatus(medicine.expiry_date)
    const matchesExpiry = filterExpiry === 'all' ||
                         (filterExpiry === 'expired' && expiryStatus.status === 'expired') ||
                         (filterExpiry === 'expiring_soon' && expiryStatus.status === 'expiring_soon') ||
                         (filterExpiry === 'good' && (expiryStatus.status === 'good' || expiryStatus.status === 'no_expiry'))
    
    return matchesSearch && matchesStatus && matchesExpiry
  })

  const totalMedicines = medicines.length
  const lowStockCount = medicines.filter(m => m.stock_quantity <= m.minimum_stock && m.stock_quantity > 0).length
  const outOfStockCount = medicines.filter(m => m.stock_quantity === 0).length
  const expiredCount = medicines.filter(m => {
    if (!m.expiry_date) return false
    return new Date(m.expiry_date) < new Date()
  }).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expiry_date) return false
    const expiry = new Date(m.expiry_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length

  const totalInventoryValue = medicines.reduce((total, medicine) => {
    return total + (medicine.stock_quantity * medicine.unit_price)
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Track medicine stock levels and manage inventory transactions</p>
        </div>
        <Button onClick={() => setShowStockForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Stock Transaction
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{totalMedicines}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringSoonCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-xl font-bold text-green-600">₹{totalInventoryValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts ({lowStockAlerts.length})
            </CardTitle>
            <CardDescription className="text-orange-700">
              Medicines requiring immediate attention for restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lowStockAlerts.slice(0, 6).map((medicine) => (
                <div key={medicine.id} className="bg-white border border-orange-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900">{medicine.name}</h4>
                      <p className="text-sm text-orange-700">{medicine.manufacturer}</p>
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-800">
                      {medicine.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Current:</span>
                      <span className="font-medium text-orange-900">{medicine.stock_quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Required:</span>
                      <span className="font-medium text-orange-900">{medicine.minimum_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Shortage:</span>
                      <span className="font-medium text-red-600">
                        {Math.max(0, medicine.minimum_stock - medicine.stock_quantity)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      setSelectedMedicine(medicine.id)
                      setStockFormData({
                        ...stockFormData,
                        transaction_type: 'stock_in',
                        quantity: String(Math.max(1, medicine.minimum_stock - medicine.stock_quantity))
                      })
                      setShowStockForm(true)
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Restock Now
                  </Button>
                </div>
              ))}
            </div>
            {lowStockAlerts.length > 6 && (
              <div className="text-center mt-4">
                <p className="text-orange-700 text-sm">
                  +{lowStockAlerts.length - 6} more medicines need restocking
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search medicines by name, brand, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <select
              value={filterExpiry}
              onChange={(e) => setFilterExpiry(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Expiry Status</option>
              <option value="expired">Expired</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="good">Good</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredMedicines.length} medicines found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Transaction Form */}
      {showStockForm && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Transaction</CardTitle>
            <CardDescription>Record stock in, stock out, or adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStockTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicine_select">Select Medicine *</Label>
                  <select
                    id="medicine_select"
                    value={selectedMedicine}
                    onChange={(e) => setSelectedMedicine(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Choose a medicine...</option>
                    {medicines.map((medicine) => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name} ({medicine.strength}) - Current: {medicine.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="transaction_type">Transaction Type *</Label>
                  <select
                    id="transaction_type"
                    value={stockFormData.transaction_type}
                    onChange={(e) => setStockFormData({...stockFormData, transaction_type: e.target.value as InventoryTransaction['transaction_type']})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="expired">Mark as Expired</option>
                    <option value="damaged">Mark as Damaged</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={stockFormData.unit_cost}
                    onChange={(e) => setStockFormData({...stockFormData, unit_cost: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input
                    id="batch_number"
                    value={stockFormData.batch_number}
                    onChange={(e) => setStockFormData({...stockFormData, batch_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={stockFormData.expiry_date}
                    onChange={(e) => setStockFormData({...stockFormData, expiry_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={stockFormData.supplier}
                    onChange={(e) => setStockFormData({...stockFormData, supplier: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={stockFormData.notes}
                  onChange={(e) => setStockFormData({...stockFormData, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Additional notes about this transaction..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Record Transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowStockForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory ({filteredMedicines.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMedicines.map((medicine) => {
              const stockStatus = getStockStatus(medicine)
              const expiryStatus = getExpiryStatus(medicine.expiry_date)
              const inventoryValue = medicine.stock_quantity * medicine.unit_price
              
              return (
                <div 
                  key={medicine.id} 
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">{medicine.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color} flex items-center gap-1`}>
                          {stockStatus.status === 'in_stock' && <CheckCircle className="h-4 w-4" />}
                          {stockStatus.status === 'low_stock' && <AlertTriangle className="h-4 w-4" />}
                          {stockStatus.status === 'out_of_stock' && <AlertCircle className="h-4 w-4" />}
                          {stockStatus.label}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${expiryStatus.color} flex items-center gap-1`}>
                          {expiryStatus.status === 'expired' && <AlertCircle className="h-4 w-4" />}
                          {(expiryStatus.status === 'expiring_soon' || expiryStatus.status === 'expiring_3months') && <Calendar className="h-4 w-4" />}
                          {expiryStatus.status === 'good' && <CheckCircle className="h-4 w-4" />}
                          {expiryStatus.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {medicine.manufacturer || 'Unknown manufacturer'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {medicine.supplier || 'Unknown supplier'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'No expiry date'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₹{inventoryValue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Current: {medicine.stock_quantity}</div>
                    </div>
                  </div>

                  {/* Inventory Details */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Stock Details:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">Current Stock</div>
                        <div className="font-medium text-lg">{medicine.stock_quantity}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">Minimum Stock</div>
                        <div className="font-medium">{medicine.minimum_stock}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">Unit Price</div>
                        <div className="font-medium">₹{medicine.unit_price?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">Batch Number</div>
                        <div className="font-medium">{medicine.batch_number || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t mt-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Inventory Actions:</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMedicine(medicine.id)
                            setStockFormData({
                              ...stockFormData,
                              transaction_type: 'stock_in'
                            })
                            setShowStockForm(true)
                          }}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Stock In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMedicine(medicine.id)
                            setStockFormData({
                              ...stockFormData,
                              transaction_type: 'stock_out'
                            })
                            setShowStockForm(true)
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Stock Out
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMedicine(medicine.id)
                            setStockFormData({
                              ...stockFormData,
                              transaction_type: 'adjustment'
                            })
                            setShowStockForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Adjust Stock
                        </Button>
                      </div>
                    </div>
                    {stockStatus.status === 'low_stock' && (
                      <div className="mt-2 text-sm text-orange-600">
                        ⚠️ Reorder recommended - {medicine.minimum_stock - medicine.stock_quantity} units needed
                      </div>
                    )}
                    {stockStatus.status === 'out_of_stock' && (
                      <div className="mt-2 text-sm text-red-600">
                        🚨 Out of stock - Immediate restocking required
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Strength:</span>
                        <div className="font-medium">{medicine.strength || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Dosage Form:</span>
                        <div className="font-medium">{medicine.dosage_form || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className="font-medium">{medicine.is_active ? 'Active' : 'Inactive'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredMedicines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No medicines found matching your search' : 'No medicines in inventory yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {transaction.medicines.name} ({transaction.medicines.strength})
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.transaction_type.replace('_', ' ').toUpperCase()} • 
                      Qty: {Math.abs(transaction.quantity)} • 
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{transaction.total_cost?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-600">{transaction.supplier || 'N/A'}</p>
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