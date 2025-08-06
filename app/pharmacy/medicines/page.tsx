'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShoppingCart, Plus, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react'

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
  description: string
  is_active: boolean
  created_at: string
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand_name: '',
    strength: '',
    dosage_form: '',
    unit_price: '',
    stock_quantity: '',
    minimum_stock: '',
    expiry_date: '',
    batch_number: '',
    manufacturer: '',
    supplier: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchMedicines()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMedicines = async () => {
    try {
      const { error } = await supabase
        .from('medicines')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
      setError('Failed to load medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const { error } = await supabase
        .from('medicines')
        .insert([{
          ...formData,
          unit_price: parseFloat(formData.unit_price) || 0,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          minimum_stock: parseInt(formData.minimum_stock) || 0,
          is_active: true,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess('Medicine added to database successfully!')
      setFormData({
        name: '',
        generic_name: '',
        brand_name: '',
        strength: '',
        dosage_form: '',
        unit_price: '',
        stock_quantity: '',
        minimum_stock: '',
        expiry_date: '',
        batch_number: '',
        manufacturer: '',
        supplier: '',
        description: ''
      })
      setShowForm(false)
      fetchMedicines()
    } catch (error) {
      console.error('Error adding medicine:', error)
      setError('Failed to add medicine')
    }
  }

  const toggleMedicineStatus = async (medicineId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .update({ is_active: !currentStatus })
        .eq('id', medicineId)

      if (error) throw error
      
      setSuccess(`Medicine ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchMedicines()
    } catch (error) {
      console.error('Error updating medicine status:', error)
      setError('Failed to update medicine status')
    }
  }

  const updateStock = async (medicineId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .update({ stock_quantity: newStock })
        .eq('id', medicineId)

      if (error) throw error
      
      setSuccess('Stock updated successfully')
      fetchMedicines()
    } catch (error) {
      console.error('Error updating stock:', error)
      setError('Failed to update stock')
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
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && medicine.is_active) ||
                         (filterStatus === 'inactive' && !medicine.is_active) ||
                         (filterStatus === 'low_stock' && medicine.stock_quantity <= medicine.minimum_stock) ||
                         (filterStatus === 'out_of_stock' && medicine.stock_quantity === 0)
    
    return matchesSearch && matchesFilter
  })

  const totalMedicines = medicines.length
  const activeMedicines = medicines.filter(m => m.is_active).length
  const lowStockMedicines = medicines.filter(m => m.stock_quantity <= m.minimum_stock).length
  const outOfStockMedicines = medicines.filter(m => m.stock_quantity === 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading medicines...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicine Master</h1>
          <p className="text-muted-foreground">Manage medicine database and inventory</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Medicine
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-2xl font-bold">{totalMedicines}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeMedicines}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockMedicines}</p>
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
                <p className="text-2xl font-bold text-red-600">{outOfStockMedicines}</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search medicines by name, generic name, brand, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Medicines</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredMedicines.length} medicines found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Medicine Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Medicine</CardTitle>
            <CardDescription>Add a new medicine to the database</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="strength">Strength</Label>
                  <Input
                    id="strength"
                    value={formData.strength}
                    onChange={(e) => setFormData({...formData, strength: e.target.value})}
                    placeholder="e.g., 500mg, 250ml"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage_form">Dosage Form</Label>
                  <Input
                    id="dosage_form"
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({...formData, dosage_form: e.target.value})}
                    placeholder="e.g., Tablet, Capsule, Syrup"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Unit Price (₹)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="minimum_stock">Minimum Stock Level</Label>
                  <Input
                    id="minimum_stock"
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({...formData, minimum_stock: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Additional information about the medicine..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Medicine</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Medicines List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Medicine Database ({filteredMedicines.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMedicines.map((medicine) => {
              const stockStatus = getStockStatus(medicine)
              return (
                <div key={medicine.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{medicine.name}</h3>
                          <p className="text-sm text-gray-600">
                            {medicine.generic_name && `Generic: ${medicine.generic_name}`}
                            {medicine.brand_name && ` • Brand: ${medicine.brand_name}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </div>
                        {!medicine.is_active && (
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            INACTIVE
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Strength:</span>
                          <p>{medicine.strength || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Form:</span>
                          <p>{medicine.dosage_form || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Price:</span>
                          <p>₹{medicine.unit_price?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Stock:</span>
                          <p>{medicine.stock_quantity} (Min: {medicine.minimum_stock})</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Manufacturer:</span>
                          <p>{medicine.manufacturer || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Batch:</span>
                          <p>{medicine.batch_number || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Expiry:</span>
                          <p>{medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                      </div>

                      {medicine.description && (
                        <p className="text-sm text-gray-600">{medicine.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMedicineStatus(medicine.id, medicine.is_active)}
                      >
                        {medicine.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newStock = prompt('Enter new stock quantity:', medicine.stock_quantity.toString())
                          if (newStock !== null) {
                            updateStock(medicine.id, parseInt(newStock))
                          }
                        }}
                      >
                        Update Stock
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredMedicines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No medicines found matching your search' : 'No medicines in database yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}