'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pill, Package, Calendar, DollarSign, AlertTriangle, Plus, Minus, BarChart3, FileText, Building2, Beaker, Shield, Clock, TrendingUp, Edit, Trash2, RefreshCw, ShoppingCart, Factory } from 'lucide-react'
interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  supplier: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  unit_price: string;
  stock_quantity: number;
  minimum_stock: number;
  dosage_form: string;
  strength: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Using Medicine interface directly for now

export default function MedicineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createAuthenticatedClient()
  const medicineId = params.id as string

  useEffect(() => {
    const fetchMedicineDetails = async () => {
      try {
        const { data: medicineData, error: medicineError } = await supabase
          .from('medicines')
          .select('*')
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
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Medicine Details</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            className={`px-2 py-1 text-xs ${
              stockStatus.color === 'red' 
                ? 'bg-red-100 text-red-800' 
                : stockStatus.color === 'orange' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}
          >
            {stockStatus.status}
          </Badge>
          {medicine.stock_quantity <= medicine.minimum_stock && (
            <Badge className="bg-red-100 text-red-700 px-2 py-1 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Reorder
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column - Medicine Details */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Main Medicine Card */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <Pill className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{medicine.name}</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      Category: {medicine.category}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">₹{medicine.unit_price}</div>
                  <div className="text-gray-500 text-xs">per unit</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Building2 className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">From</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{medicine.supplier || 'Not specified'}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Package className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Form</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{medicine.dosage_form || 'Not specified'}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Beaker className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Strength</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{medicine.strength || 'Not specified'}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Factory className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Manufacturer</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{medicine.manufacturer || 'Not specified'}</p>
                </div>
              </div>

              {/* Stock Management Section */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Stock Management
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStock(-1)}
                      disabled={medicine.stock_quantity <= 0}
                      className="h-7 w-7 rounded-full p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">
                      {medicine.stock_quantity}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStock(1)}
                      className="h-7 w-7 rounded-full p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="text-xl font-bold text-blue-700">{medicine.stock_quantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Minimum</p>
                    <p className="text-xl font-bold text-orange-600">{medicine.minimum_stock}</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      medicine.stock_quantity <= medicine.minimum_stock 
                        ? 'bg-red-500' 
                        : medicine.stock_quantity <= medicine.minimum_stock * 1.5 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (medicine.stock_quantity / Math.max(medicine.minimum_stock * 2, medicine.stock_quantity)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Additional Information */}
              {(medicine.batch_number || medicine.expiry_date) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Additional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medicine.batch_number && (
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-600">Batch Number</p>
                          <p className="text-sm font-medium text-gray-900">{medicine.batch_number}</p>
                        </div>
                      </div>
                    )}
                    
                    {medicine.expiry_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-600">Expiry Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(medicine.expiry_date).toLocaleDateString()}
                          </p>
                          {new Date(medicine.expiry_date) < new Date() && (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Primary Actions Card */}
          <Card className="border border-gray-200 shadow-sm sticky top-4">
            <CardHeader className="border-b border-gray-200 py-3">
              <CardTitle className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wide">
                <BarChart3 className="h-4 w-4 mr-2 text-gray-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Primary Actions */}
              <div className="p-4 space-y-2">
                <div 
                  className="group flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/stock`)}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Update Stock</p>
                    <p className="text-sm text-gray-500">Adjust inventory levels</p>
                  </div>
                </div>

                <div 
                  className={`group flex items-center p-3 rounded-lg cursor-pointer transition-all border ${
                    (!medicine.is_active || medicine.stock_quantity <= 0) 
                      ? 'opacity-50 cursor-not-allowed border-gray-100' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    if (medicine.is_active && medicine.stock_quantity > 0) {
                      router.push(`/pharmacy/dispense?medicine_id=${medicine.id}`)
                    }
                  }}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    (!medicine.is_active || medicine.stock_quantity <= 0) 
                      ? 'bg-gray-100' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <ShoppingCart className={`h-5 w-5 ${
                      (!medicine.is_active || medicine.stock_quantity <= 0) 
                        ? 'text-gray-400' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className={`font-semibold ${
                      (!medicine.is_active || medicine.stock_quantity <= 0) 
                        ? 'text-gray-400' 
                        : 'text-gray-900'
                    }`}>Dispense Medicine</p>
                    <p className={`text-sm ${
                      (!medicine.is_active || medicine.stock_quantity <= 0) 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                    }`}>Issue to patients</p>
                  </div>
                </div>

                <div 
                  className="group flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/edit`)}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <Edit className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Edit Medicine</p>
                    <p className="text-sm text-gray-500">Update details</p>
                  </div>
                </div>

                <div 
                  className="group flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  onClick={() => window.print()}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Print Label</p>
                    <p className="text-sm text-gray-500">Generate barcode</p>
                  </div>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="border-t border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Management</p>
                <div className="space-y-1">
                  <div 
                    className="group flex items-center p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/expiry`)}
                  >
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Check Expiry</span>
                  </div>
                  <div 
                    className="group flex items-center p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    onClick={() => router.push(`/pharmacy/medicines/${medicine.id}/pricing`)}
                  >
                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Update Price</span>
                  </div>
                  <div 
                    className="group flex items-center p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    onClick={() => router.push(`/pharmacy/reports?medicine_id=${medicine.id}`)}
                  >
                    <BarChart3 className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Usage Report</span>
                  </div>
                </div>
              </div>
              
              {/* Warning Actions */}
              {medicine.is_active && (
                <div className="border-t border-red-100 p-4 bg-red-50/50">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Danger Zone</p>
                  <div 
                    className="group flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-red-100 border border-red-200"
                    onClick={() => {
                      if (confirm(`Are you sure you want to deactivate ${medicine.name}?`)) {
                        console.log('Deactivate medicine:', medicine.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-lg group-hover:bg-red-300 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-700" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-red-700 group-hover:text-red-800">Deactivate Medicine</p>
                      <p className="text-xs text-red-600">This action cannot be undone</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}