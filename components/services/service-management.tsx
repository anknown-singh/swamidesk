'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  SearchIcon, 
  FilterIcon, 
  PlusIcon, 
  EditIcon, 
  EyeIcon,
  ClockIcon,
  IndianRupeeIcon,
  StethoscopeIcon,
  ActivityIcon,
  TrendingUpIcon
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { ServiceViewEditModal } from './service-view-edit-modal'

interface Service {
  id: string
  name: string
  description: string
  category: string
  department: string
  duration: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceStats {
  totalServices: number
  activeServices: number
  departments: number
  categories: number
  avgPrice: number
  avgDuration: number
}

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    activeServices: 0,
    departments: 0,
    categories: 0,
    avgPrice: 0,
    avgDuration: 0
  })

  // Get unique departments and categories
  const departments = Array.from(new Set(services.map(s => s.department))).sort()
  const categories = Array.from(new Set(services.map(s => s.category))).sort()

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) throw error

      setServices(data || [])
      
      // Calculate stats
      const activeServices = data?.filter(s => s.is_active) || []
      const uniqueDepts = new Set(data?.map(s => s.department) || [])
      const uniqueCats = new Set(data?.map(s => s.category) || [])
      const avgPrice = data?.reduce((sum, s) => sum + s.price, 0) / (data?.length || 1)
      const avgDuration = data?.reduce((sum, s) => sum + s.duration, 0) / (data?.length || 1)

      setStats({
        totalServices: data?.length || 0,
        activeServices: activeServices.length,
        departments: uniqueDepts.size,
        categories: uniqueCats.size,
        avgPrice: Math.round(avgPrice),
        avgDuration: Math.round(avgDuration)
      })

    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter services based on search and filters
  useEffect(() => {
    let filtered = services

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(service => service.department === selectedDepartment)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, selectedDepartment, selectedCategory])

  // Load data on component mount
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

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

  const handleViewService = (service: Service) => {
    setSelectedService(service)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleServiceUpdate = (updatedService: Service) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s))
    // Refresh stats after update
    fetchServices()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedService(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Services...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading clinic services...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
          <p className="text-muted-foreground">
            Manage all clinic services, pricing, and availability
          </p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeServices} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
            <p className="text-xs text-muted-foreground">
              service areas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">
              service types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              per service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              per service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.activeServices / stats.totalServices) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              services active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Services</CardTitle>
          <CardDescription>Search and filter clinic services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
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
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
          <CardDescription>
            Comprehensive list of all clinic services and procedures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(service.category)}
                    >
                      {service.category}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={getDepartmentColor(service.department)}
                    >
                      {service.department}
                    </Badge>
                    {!service.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    {service.description}
                  </p>
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
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewService(service)}
                    title="View Service Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditService(service)}
                    title="Edit Service"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

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

      {/* Service View/Edit Modal */}
      <ServiceViewEditModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleServiceUpdate}
        mode={modalMode}
      />
    </div>
  )
}