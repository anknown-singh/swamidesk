'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pill, Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PharmacyStats {
  pendingPrescriptions: number
  totalInventoryItems: number
  lowStockAlerts: number
  expiringSoon: number
}

interface PrescriptionQueueItem {
  id: string
  patient_name: string
  medicine_count: number
  doctor_name: string
  priority: boolean
  created_at: string
}

interface LowStockItem {
  id: string
  medicine_name: string
  current_stock: number
  min_level: number
  is_critical: boolean
}

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<PharmacyStats>({
    pendingPrescriptions: 0,
    totalInventoryItems: 0,
    lowStockAlerts: 0,
    expiringSoon: 0
  })
  const [prescriptionQueue, setPrescriptionQueue] = useState<PrescriptionQueueItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPharmacyData = useCallback(async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      
      // Fetch pharmacy statistics
      const [prescriptionsResult, inventoryResult, lowStockResult, expiringResult] = await Promise.all([
        // Pending prescriptions
        supabase
          .from('prescriptions')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        
        // Total inventory items
        supabase
          .from('inventory')
          .select('id', { count: 'exact' })
          .gt('quantity', 0),
        
        // Low stock alerts
        supabase
          .from('inventory')
          .select('id', { count: 'exact' })
          .filter('quantity', 'lt', 'min_level'),
        
        // Expiring soon (30 days)
        supabase
          .from('inventory')
          .select('id', { count: 'exact' })
          .lt('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ])

      setStats({
        pendingPrescriptions: prescriptionsResult.count || 0,
        totalInventoryItems: inventoryResult.count || 0,
        lowStockAlerts: lowStockResult.count || 0,
        expiringSoon: expiringResult.count || 0
      })

      // Fetch prescription queue data
      const { data: queueData } = await supabase
        .from('prescriptions')
        .select(`
          id,
          priority,
          created_at,
          patients(full_name),
          users(full_name),
          prescription_items(id)
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(4)

      if (queueData) {
        interface QueueDataItem {
          id: string
          priority?: boolean
          created_at: string
          patients?: { full_name: string } | null
          users?: { full_name: string } | null
          prescription_items?: { id: string }[] | null
        }
        const mappedQueue = (queueData as QueueDataItem[]).map((item: QueueDataItem) => ({
          id: item.id,
          patient_name: item.patients?.full_name || 'Unknown Patient',
          medicine_count: item.prescription_items?.length || 0,
          doctor_name: item.users?.full_name || 'Unknown Doctor',
          priority: item.priority || false,
          created_at: item.created_at
        }))
        setPrescriptionQueue(mappedQueue)
      }

      // Fetch low stock items
      const { data: stockData } = await supabase
        .from('inventory')
        .select(`
          id,
          medicines(name),
          quantity,
          min_level
        `)
        .filter('quantity', 'lt', 'min_level')
        .order('quantity', { ascending: true })
        .limit(4)

      if (stockData) {
        interface StockDataItem {
          id: string
          quantity: number
          min_level: number
          medicines?: { name: string } | null
        }
        const mappedStock = (stockData as StockDataItem[]).map((item: StockDataItem) => ({
          id: item.id,
          medicine_name: item.medicines?.name || 'Unknown Medicine',
          current_stock: item.quantity || 0,
          min_level: item.min_level || 0,
          is_critical: item.quantity <= (item.min_level * 0.3)
        }))
        setLowStockItems(mappedStock)
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPharmacyData()
  }, [fetchPharmacyData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Loading pharmacy data...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">
          Manage prescriptions and inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              Pending dispensing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventoryItems}</div>
            <p className="text-xs text-muted-foreground">
              Total medicines in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Items need reordering
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Expiring in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prescription Queue</CardTitle>
            <CardDescription>
              Pending prescriptions for dispensing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptionQueue.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.patient_name}
                      {item.priority && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.medicine_count} medicines • {item.doctor_name}
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Dispense
                  </button>
                </div>
              ))}
              {prescriptionQueue.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No pending prescriptions
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              Medicines requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.medicine_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {item.current_stock} / Min: {item.min_level}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_critical 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.is_critical ? 'Critical' : 'Low'}
                    </span>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  All medicines adequately stocked
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Pharmacy management shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <button className="text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Dispense Medicines</div>
                  <div className="text-sm text-muted-foreground">Process prescription queue</div>
                </div>
              </div>
            </button>
            <button className="text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Update Inventory</div>
                  <div className="text-sm text-muted-foreground">Add new stock arrivals</div>
                </div>
              </div>
            </button>
            <button className="text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Stock Alerts</div>
                  <div className="text-sm text-muted-foreground">Manage reorder points</div>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}