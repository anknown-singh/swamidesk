'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  PlusIcon,
  IndianRupeeIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { toast } from '@/lib/toast'

interface Service {
  id: string
  name: string
  description: string
  category: string
  department: string
  duration: number
}

interface ProcedureQuote {
  id?: string
  service_id: string
  service_name: string
  diagnosis_reason: string
  custom_price: number
  estimated_duration: number
  doctor_notes: string
  urgency: 'low' | 'medium' | 'high'
  status: 'quoted' | 'admin_review' | 'approved' | 'rejected'
}

interface ProcedureQuotingProps {
  diagnosis: string
  selectedProcedures: ProcedureQuote[]
  onProceduresChange: (procedures: ProcedureQuote[]) => void
  patientName: string
  doctorRole: boolean
  readonly?: boolean
}

export function ProcedureQuoting({
  diagnosis,
  selectedProcedures,
  onProceduresChange,
  patientName,
  doctorRole,
  readonly = false
}: ProcedureQuotingProps) {
  const [services, setServices] = useState<Service[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProcedure, setNewProcedure] = useState<Partial<ProcedureQuote>>({
    service_id: '',
    service_name: '',
    diagnosis_reason: '',
    custom_price: 0,
    estimated_duration: 30,
    doctor_notes: '',
    urgency: 'medium',
    status: 'quoted'
  })

  // Fetch available services
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, category, department, duration')
        .eq('is_active', true)
        .in('category', ['procedure', 'therapy'])
        .order('department', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setNewProcedure(prev => ({
        ...prev,
        service_id: service.id,
        service_name: service.name,
        estimated_duration: service.duration
      }))
    }
  }

  const handleAddProcedure = () => {
    if (!newProcedure.service_id || !newProcedure.diagnosis_reason || !newProcedure.custom_price) {
      toast.error('Please fill all required fields')
      return
    }

    const procedure: ProcedureQuote = {
      id: `temp_${Date.now()}`, // Temporary ID for frontend
      service_id: newProcedure.service_id!,
      service_name: newProcedure.service_name!,
      diagnosis_reason: newProcedure.diagnosis_reason!,
      custom_price: newProcedure.custom_price!,
      estimated_duration: newProcedure.estimated_duration!,
      doctor_notes: newProcedure.doctor_notes || '',
      urgency: newProcedure.urgency!,
      status: 'quoted'
    }

    onProceduresChange([...selectedProcedures, procedure])
    
    // Reset form
    setNewProcedure({
      service_id: '',
      service_name: '',
      diagnosis_reason: '',
      custom_price: 0,
      estimated_duration: 30,
      doctor_notes: '',
      urgency: 'medium',
      status: 'quoted'
    })
    setShowAddForm(false)
    toast.success('Procedure quote added')
  }

  const handleRemoveProcedure = (index: number) => {
    const updated = selectedProcedures.filter((_, i) => i !== index)
    onProceduresChange(updated)
    toast.success('Procedure removed')
  }

  const handleUpdateProcedure = (index: number, updates: Partial<ProcedureQuote>) => {
    const updated = selectedProcedures.map((proc, i) => 
      i === index ? { ...proc, ...updates } : proc
    )
    onProceduresChange(updated)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quoted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'admin_review': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTotalQuote = () => {
    return selectedProcedures.reduce((sum, proc) => sum + proc.custom_price, 0)
  }

  const getTotalDuration = () => {
    return selectedProcedures.reduce((sum, proc) => sum + proc.estimated_duration, 0)
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}m`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Header with diagnosis context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupeeIcon className="h-5 w-5" />
            Procedure Quoting & Billing
          </CardTitle>
          <CardDescription>
            Custom pricing based on diagnosis: <strong>&quot;{diagnosis}&quot;</strong> for patient: <strong>{patientName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Diagnosis-Based Pricing Workflow:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Doctor identifies procedures needed based on diagnosis</li>
                  <li>Doctor provides custom quotes considering patient&apos;s condition severity</li>
                  <li>Admin reviews and approves final pricing for billing</li>
                  <li>Approved procedures are added to patient&apos;s bill</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Procedures */}
      {selectedProcedures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quoted Procedures ({selectedProcedures.length})</CardTitle>
            <CardDescription>
              Procedures recommended based on diagnosis with custom pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProcedures.map((procedure, index) => (
                <div key={procedure.id || index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{procedure.service_name}</h4>
                        <Badge variant="outline" className={getUrgencyColor(procedure.urgency)}>
                          {procedure.urgency} priority
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(procedure.status)}>
                          {procedure.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div><strong>Diagnosis Reason:</strong> {procedure.diagnosis_reason}</div>
                        {procedure.doctor_notes && (
                          <div><strong>Doctor Notes:</strong> {procedure.doctor_notes}</div>
                        )}
                      </div>
                    </div>
                    {!readonly && doctorRole && procedure.status === 'quoted' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveProcedure(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <IndianRupeeIcon className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">
                        ₹{procedure.custom_price.toLocaleString('en-IN')}
                      </span>
                      {!readonly && doctorRole && procedure.status === 'quoted' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newPrice = prompt('Enter new price:', procedure.custom_price.toString())
                            if (newPrice && !isNaN(Number(newPrice))) {
                              handleUpdateProcedure(index, { custom_price: Number(newPrice) })
                            }
                          }}
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">
                        {formatDuration(procedure.estimated_duration)}
                      </span>
                    </div>
                  </div>

                  {/* Admin can modify pricing */}
                  {!readonly && !doctorRole && procedure.status === 'admin_review' && (
                    <div className="mt-4 p-3 bg-orange-50 rounded border">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Final Price (Admin)</Label>
                          <Input
                            type="number"
                            value={procedure.custom_price}
                            onChange={(e) => handleUpdateProcedure(index, { 
                              custom_price: Number(e.target.value) || 0 
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateProcedure(index, { status: 'approved' })}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateProcedure(index, { status: 'rejected' })}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Total Quote */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Estimate:</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600">₹{getTotalQuote().toLocaleString('en-IN')}</span>
                    <span className="text-blue-600">{formatDuration(getTotalDuration())}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  *Final pricing subject to admin approval and may vary based on actual treatment complexity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Procedure (Doctor Only) */}
      {!readonly && doctorRole && (
        <Card>
          <CardHeader>
            <CardTitle>Add Procedure Quote</CardTitle>
            <CardDescription>
              Select procedure and provide custom quote based on patient&apos;s diagnosis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Procedure Quote
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Service Selection */}
                <div>
                  <Label>Select Procedure</Label>
                  <Select 
                    value={newProcedure.service_id} 
                    onValueChange={handleServiceSelect}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a procedure..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span>{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {service.department} • {service.category}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Diagnosis-based reason */}
                <div>
                  <Label>Why is this procedure needed? (Based on diagnosis)</Label>
                  <Textarea
                    placeholder="Explain how this procedure addresses the patient&apos;s specific condition..."
                    value={newProcedure.diagnosis_reason}
                    onChange={(e) => setNewProcedure(prev => ({ 
                      ...prev, diagnosis_reason: e.target.value 
                    }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Custom Price */}
                  <div>
                    <Label>Custom Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newProcedure.custom_price}
                      onChange={(e) => setNewProcedure(prev => ({ 
                        ...prev, custom_price: Number(e.target.value) || 0 
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider patient&apos;s condition severity and complexity
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label>Estimated Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={newProcedure.estimated_duration}
                      onChange={(e) => setNewProcedure(prev => ({ 
                        ...prev, estimated_duration: Number(e.target.value) || 30 
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Urgency */}
                  <div>
                    <Label>Priority Level</Label>
                    <Select 
                      value={newProcedure.urgency} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setNewProcedure(prev => ({ ...prev, urgency: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Can be scheduled later</SelectItem>
                        <SelectItem value="medium">Medium - Should be done soon</SelectItem>
                        <SelectItem value="high">High - Urgent treatment needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Doctor Notes */}
                <div>
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional considerations for this procedure..."
                    value={newProcedure.doctor_notes}
                    onChange={(e) => setNewProcedure(prev => ({ 
                      ...prev, doctor_notes: e.target.value 
                    }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddProcedure}>
                    Add Quote
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false)
                      setNewProcedure({
                        service_id: '',
                        service_name: '',
                        diagnosis_reason: '',
                        custom_price: 0,
                        estimated_duration: 30,
                        doctor_notes: '',
                        urgency: 'medium',
                        status: 'quoted'
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedProcedures.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <IndianRupeeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No procedures quoted yet</p>
              <p className="text-sm mb-4">
                Based on the diagnosis, add procedure quotes with custom pricing
              </p>
              {!readonly && doctorRole && !showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Procedure Quote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}