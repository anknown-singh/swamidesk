'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  EditIcon, 
  SaveIcon, 
  XIcon, 
  ClockIcon, 
  IndianRupeeIcon,
  StethoscopeIcon,
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
  created_at: string
  updated_at: string
}

interface ServiceViewEditModalProps {
  service: Service | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedService: Service) => void
  mode: 'view' | 'edit'
}

const CATEGORIES = ['consultation', 'procedure', 'test', 'therapy']
const DEPARTMENTS = ['ENT', 'Dental', 'Cosmetic', 'General', 'Cardiology', 'Orthopedics', 'Pediatrics']

export function ServiceViewEditModal({
  service,
  isOpen,
  onClose,
  onUpdate,
  mode: initialMode
}: ServiceViewEditModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [loading, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Service>>({})

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setFormData(service)
      setMode(initialMode)
    }
  }, [service, initialMode])

  const handleSave = async () => {
    if (!service || !formData) return

    setSaving(true)
    try {
      const supabase = createAuthenticatedClient()
      
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', service.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data)
      setMode('view')

    } catch (error) {
      console.error('Error updating service:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(service || {})
    setMode('view')
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
    if (duration < 60) return `${duration} minutes`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  if (!service) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StethoscopeIcon className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Service' : 'Service Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Service Name</Label>
            {mode === 'edit' ? (
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                placeholder="Enter service name"
              />
            ) : (
              <div className="mt-1 text-lg font-semibold">{service.name}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            {mode === 'edit' ? (
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                placeholder="Enter service description"
                rows={3}
              />
            ) : (
              <div className="mt-1 text-muted-foreground">{service.description}</div>
            )}
          </div>

          {/* Category and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              {mode === 'edit' ? (
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <Badge variant="outline" className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Department</Label>
              {mode === 'edit' ? (
                <Select 
                  value={formData.department || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <Badge variant="outline" className={getDepartmentColor(service.department)}>
                    {service.department}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
                <IndianRupeeIcon className="h-4 w-4" />
                Price
              </Label>
              {mode === 'edit' ? (
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  placeholder="Enter price"
                />
              ) : (
                <div className="mt-1 text-lg font-medium text-green-600">
                  {formatPrice(service.price)}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Duration
              </Label>
              {mode === 'edit' ? (
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  placeholder="Duration in minutes"
                />
              ) : (
                <div className="mt-1 text-lg font-medium text-blue-600">
                  {formatDuration(service.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Service Status */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Service Status</Label>
            {mode === 'edit' ? (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <span className="text-sm">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ) : (
              <Badge variant={service.is_active ? 'default' : 'secondary'}>
                {service.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>

          {/* Timestamps (View only) */}
          {mode === 'view' && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Created: {new Date(service.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(service.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {mode === 'view' ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <XIcon className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button onClick={() => setMode('edit')}>
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Service
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <SaveIcon className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}