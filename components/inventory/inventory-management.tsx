'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Plus,
  Minus,
  Edit,
  Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Medicine {
  id: string
  name: string
  generic_name: string
  manufacturer: string
  category: string
  dosage_form: string
  strength: string
  unit_price: number
  stock_quantity: number
  minimum_stock: number
  expiry_date: string | null
  batch_number: string | null
  is_active: boolean
}

interface StockAlert {
  medicine: Medicine
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon'
  message: string
}

export function InventoryManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const supabase = createClient()

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      
      const medicinesData = data as Medicine[]
      setMedicines(medicinesData)
      
      // Generate stock alerts
      const alerts: StockAlert[] = []
      medicinesData.forEach(medicine => {
        if (medicine.stock_quantity === 0) {
          alerts.push({
            medicine,
            type: 'out_of_stock',
            message: `${medicine.name} is out of stock`
          })
        } else if (medicine.stock_quantity <= medicine.minimum_stock) {
          alerts.push({
            medicine,
            type: 'low_stock', 
            message: `${medicine.name} is running low (${medicine.stock_quantity} left)`
          })
        }
        
        if (medicine.expiry_date) {
          const expiryDate = new Date(medicine.expiry_date)
          const now = new Date()
          const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            alerts.push({
              medicine,
              type: 'expiring_soon',
              message: `${medicine.name} expires in ${daysToExpiry} days`
            })
          }
        }
      })
      
      setStockAlerts(alerts)
    } catch (error) {
      console.error('Error fetching medicines:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateStock = async (medicineId: string, change: number) => {
    try {
      const medicine = medicines.find(m => m.id === medicineId)
      if (!medicine) return

      const newQuantity = Math.max(0, medicine.stock_quantity + change)
      
      const { error } = await supabase
        .from('medicines')
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', medicineId)

      if (error) throw error

      // Update local state
      setMedicines(prev => prev.map(m => 
        m.id === medicineId 
          ? { ...m, stock_quantity: newQuantity }
          : m
      ))

      // Refresh alerts
      fetchMedicines()
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock_quantity === 0) {
      return { status: 'out_of_stock', color: 'bg-red-500', text: 'Out of Stock' }
    } else if (medicine.stock_quantity <= medicine.minimum_stock) {
      return { status: 'low_stock', color: 'bg-yellow-500', text: 'Low Stock' }
    } else {
      return { status: 'in_stock', color: 'bg-green-500', text: 'In Stock' }
    }
  }

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(medicines.map(m => m.category))).sort()

  useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Package className="h-8 w-8 mx-auto mb-4 text-blue-500 animate-pulse" />
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts ({stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.type === 'out_of_stock' ? 'bg-red-500' :
                      alert.type === 'low_stock' ? 'bg-yellow-500' : 'bg-orange-500'
                    }`} />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                  <Badge variant={
                    alert.type === 'out_of_stock' ? 'destructive' :
                    alert.type === 'low_stock' ? 'secondary' : 'outline'
                  }>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
              {stockAlerts.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  +{stockAlerts.length - 5} more alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, generic name, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMedicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine)
          return (
            <Card key={medicine.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{medicine.name}</CardTitle>
                    <CardDescription>{medicine.generic_name}</CardDescription>
                    <div className="text-xs text-gray-500 mt-1">
                      {medicine.manufacturer} • {medicine.dosage_form}
                    </div>
                  </div>
                  <Badge className={`${stockStatus.color} text-white text-xs`}>
                    {stockStatus.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Stock:</span>
                      <div className="text-lg font-bold text-blue-600">
                        {medicine.stock_quantity}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Min Level:</span>
                      <div className="text-sm text-gray-600">
                        {medicine.minimum_stock}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <div className="text-sm">₹{medicine.unit_price}</div>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <div className="text-xs text-gray-600">{medicine.category}</div>
                    </div>
                  </div>

                  {medicine.expiry_date && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(medicine.expiry_date).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Quick Actions:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStock(medicine.id, -10)}
                        disabled={medicine.stock_quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStock(medicine.id, 10)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMedicines.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No medicines found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No medicines match your search criteria.' : 'No medicines in inventory.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}