'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  SearchIcon,
  ClockIcon,
  IndianRupeeIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'

interface Service {
  id: string
  name: string
  description: string
  category: string
  department: string
  duration: number
  price: number
  is_active: boolean
}

interface ServiceSelectorProps {
  selectedServices: string[]
  onServicesChange: (serviceIds: string[]) => void
  departmentFilter?: string
  multiSelect?: boolean
  showPricing?: boolean
  className?: string
}

export function ServiceSelector({
  selectedServices,
  onServicesChange,
  departmentFilter,
  multiSelect = true,
  showPricing = true,
  className = ''
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>(departmentFilter || 'all')

  // Get unique departments and categories
  const departments = Array.from(new Set(services.map(s => s.department))).sort()
  const categories = Array.from(new Set(services.map(s => s.category))).sort()

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('department')
        .order('name')

      if (departmentFilter) {
        query = query.eq('department', departmentFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }, [departmentFilter])

  // Filter services
  useEffect(() => {
    let filtered = services

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(service => service.department === selectedDepartment)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, selectedDepartment, selectedCategory])

  // Load services on mount
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleServiceToggle = (serviceId: string) => {
    if (multiSelect) {
      const newSelection = selectedServices.includes(serviceId)
        ? selectedServices.filter(id => id !== serviceId)
        : [...selectedServices, serviceId]
      onServicesChange(newSelection)
    } else {
      onServicesChange(selectedServices.includes(serviceId) ? [] : [serviceId])
    }
  }

  const getSelectedServicesInfo = () => {
    const selected = services.filter(s => selectedServices.includes(s.id))
    const totalPrice = selected.reduce((sum, s) => sum + s.price, 0)
    const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0)
    return { selected, totalPrice, totalDuration }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'procedure': return 'bg-green-100 text-green-800 border-green-200'
      case 'test': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'therapy': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'ENT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Dental': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'Cosmetic': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'General': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}m`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Services...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="text-muted-foreground">Loading available services...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { selected, totalPrice, totalDuration } = getSelectedServicesInfo()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Selected Services ({selected.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {selected.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="font-medium">{service.name}</span>
                  <div className="flex items-center gap-2">
                    {showPricing && (
                      <>
                        <span className="text-sm">{formatPrice(service.price)}</span>
                        <span className="text-sm text-muted-foreground">{formatDuration(service.duration)}</span>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleServiceToggle(service.id)}
                      className="h-6 w-6 p-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {showPricing && (
              <div className="flex items-center justify-between pt-3 border-t font-semibold">
                <span>Total:</span>
                <div className="flex items-center gap-4">
                  <span>{formatPrice(totalPrice)}</span>
                  <span className="text-muted-foreground">{formatDuration(totalDuration)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Services</CardTitle>
          <CardDescription>
            Choose the services needed for this appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {!departmentFilter && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.includes(service.id)
              return (
                <div
                  key={service.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(service.category)}`}
                      >
                        {service.category}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getDepartmentColor(service.department)}`}
                      >
                        {service.department}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.description}
                    </p>
                    {showPricing && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatPrice(service.price)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDuration(service.duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-5 w-5 text-blue-600 ml-2" />
                  )}
                </div>
              )
            })}

            {filteredServices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No services found matching your criteria.</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}