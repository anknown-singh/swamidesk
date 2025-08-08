'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pill, Package, Calendar, DollarSign, AlertTriangle, Plus, Minus, BarChart3, FileText } from 'lucide-react'
import type { Medicine } from '@/lib/types'

interface MedicineWithDetails extends Medicine {
  prescriptions?: Array<{
    id: string
    dosage: string
    frequency: string
    duration: string
    created_at: string
    patients?: {
      full_name: string
    }
    users?: {
      full_name: string
    }
  }>
}

export default function MedicineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState<MedicineWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const medicineId = params.id as string

  useEffect(() => {
    const fetchMedicineDetails = async () => {
      try {
        const { data: medicineData, error: medicineError } = await supabase
          .from('medicines')
          .select(`
            *,
            prescriptions(
              id, dosage, frequency, duration, created_at,
              patients(full_name),
              users(full_name)
            )
          `)
          .eq('id', medicineId)
          .single()

        if (medicineError) {
          setError('Medicine not found')
          return
        }

        setMedicine(medicineData)
      } catch (err) {
        setError('Failed to load medicine details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (medicineId) {
      fetchMedicineDetails()
    }
  }, [medicineId])

  const getStockStatus = () => {
    if (!medicine) return { status: 'unknown', color: 'gray' }
    
    if (medicine.stock_quantity === 0) {
      return { status: 'Out of Stock', color: 'red' }
    } else if (medicine.stock_quantity <= medicine.minimum_stock) {
      return { status: 'Low Stock', color: 'orange' }
    } else {
      return { status: 'In Stock', color: 'green' }
    }
  }

  const updateStock = async (change: number) => {
    if (!medicine) return

    const newStock = Math.max(0, medicine.stock_quantity + change)
    
    try {
      const { error } = await supabase
        .from('medicines')
        .update({ stock_quantity: newStock })
        .eq('id', medicineId)

      if (error) {
        console.error('Failed to update stock:', error)
        return
      }

      setMedicine(prev => prev ? { ...prev, stock_quantity: newStock } : null)
    } catch (err) {
      console.error('Error updating stock:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !medicine) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || 'Medicine not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stockStatus = getStockStatus()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Medicine Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={stockStatus.color === 'red' ? 'destructive' : stockStatus.color === 'orange' ? 'secondary' : 'default'}
          >
            {stockStatus.status}
          </Badge>
          {medicine.stock_quantity <= medicine.minimum_stock && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Reorder
            </Badge>
          )}
        </div>
      </div>

      {/* Medicine Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{medicine.name}</CardTitle>
              <CardDescription>
                {medicine.generic_name && `Generic: ${medicine.generic_name}`}
                {medicine.brand && ` • Brand: ${medicine.brand}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Package className="h-4 w-4 text-gray-500" />
              <span>{medicine.dosage_form}</span>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>₹{medicine.unit_price} per {medicine.unit_type}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline">{medicine.category}</Badge>
            </div>
          </div>

          {/* Stock Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Stock Management</h4>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateStock(-1)}
                  disabled={medicine.stock_quantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[3rem] text-center">
                  {medicine.stock_quantity}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateStock(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Current Stock</p>
                <p className="font-medium">{medicine.stock_quantity} units</p>
              </div>
              <div>
                <p className="text-gray-600">Minimum Stock Level</p>
                <p className="font-medium">{medicine.minimum_stock} units</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(medicine.batch_number || medicine.expiry_date || medicine.supplier) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {medicine.batch_number && (
                <div>
                  <p className="text-sm text-gray-600">Batch Number</p>
                  <p className="font-medium">{medicine.batch_number}</p>
                </div>
              )}
              {medicine.expiry_date && (
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">
                    {new Date(medicine.expiry_date).toLocaleDateString()}
                  </p>
                  {new Date(medicine.expiry_date) < new Date() && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Expired
                    </Badge>
                  )}
                </div>
              )}
              {medicine.supplier && (
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-medium">{medicine.supplier}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription History */}
      {medicine.prescriptions && medicine.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>
              This medicine has been prescribed {medicine.prescriptions.length} times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicine.prescriptions.slice(0, 10).map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{prescription.patients?.full_name || 'Unknown Patient'}</p>
                    <p className="text-sm text-gray-600">
                      Prescribed by: {prescription.users?.full_name || 'Unknown Doctor'}
                    </p>
                    <div className="text-xs text-gray-500 space-x-4 mt-1">
                      <span>Dosage: {prescription.dosage}</span>
                      <span>Frequency: {prescription.frequency}</span>
                      <span>Duration: {prescription.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/stock`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Update Stock
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/expiry`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Check Expiry
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/pricing`)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Update Price
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={!medicine.is_active || medicine.stock_quantity <= 0}
              onClick={() => router.push(`/pharmacy/dispense?medicine_id=${medicine.id}`)}
            >
              <Pill className="h-4 w-4 mr-2" />
              Dispense
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/edit`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Edit Medicine
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/pharmacy/reports?medicine_id=${medicine.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.print()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Print Label
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}