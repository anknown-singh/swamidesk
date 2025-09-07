'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  Pill,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'

interface Prescription {
  id: string
  visit_id: string
  medicine_id: string
  quantity: number
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  status: 'pending' | 'dispensed' | 'cancelled' | 'partially_dispensed'
  created_at: string
  medicines: {
    id: string
    name: string
    unit_price: number
    dosage_form: string
    category: string
    stock_quantity: number
  }
  visits: {
    id: string
    visit_date: string
    chief_complaint: string
    diagnosis: string
    doctor_id: string
    patients: {
      id: string
      full_name: string
      phone: string
      date_of_birth: string
      email?: string
    }
    users?: {
      id: string
      full_name: string
      email: string
    }
  }
}

export default function PrescriptionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string
  
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states for editing
  const [editedPrescription, setEditedPrescription] = useState<Partial<Prescription>>({})

  const supabase = createClient()

  const fetchPrescriptionDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medicines (
            id,
            name,
            unit_price,
            dosage_form,
            category,
            stock_quantity
          ),
          visits (
            id,
            visit_date,
            chief_complaint,
            diagnosis,
            doctor_id,
            patients (
              id,
              full_name,
              phone,
              date_of_birth,
              email
            ),
            users!visits_doctor_id_fkey (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('id', prescriptionId)
        .single()

      if (error) throw error
      
      setPrescription(data as Prescription)
      setEditedPrescription(data)
    } catch (error) {
      console.error('Error fetching prescription details:', error)
      setError('Failed to load prescription details')
    } finally {
      setLoading(false)
    }
  }, [prescriptionId, supabase])

  useEffect(() => {
    fetchPrescriptionDetails()
  }, [fetchPrescriptionDetails])

  const savePrescriptionDetails = async () => {
    if (!prescription) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          quantity: editedPrescription.quantity,
          dosage: editedPrescription.dosage,
          frequency: editedPrescription.frequency,
          duration: editedPrescription.duration,
          instructions: editedPrescription.instructions,
          status: editedPrescription.status
        })
        .eq('id', prescriptionId)

      if (error) throw error
      
      setPrescription(prev => prev ? { ...prev, ...editedPrescription } : null)
      setError(null)
      console.log('Prescription updated successfully!')
    } catch (error) {
      console.error('Error saving prescription:', error)
      setError('Failed to save prescription details')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: Prescription['status']) => {
    if (!prescription) return

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus })
        .eq('id', prescriptionId)

      if (error) throw error
      
      setPrescription(prev => prev ? { ...prev, status: newStatus } : null)
      setEditedPrescription(prev => ({ ...prev, status: newStatus }))
      setError(null)
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update prescription status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'dispensed': return 'bg-green-100 text-green-800'
      case 'partially_dispensed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading prescription details...</div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Prescription not found</div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Prescription: {prescription.medicines.name}
          </h1>
          <p className="text-muted-foreground">
            Patient: {prescription.visits.patients.full_name} • {new Date(prescription.visits.visit_date).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getStatusColor(prescription.status)}>
          {prescription.status.replace('_', ' ').toUpperCase()}
        </Badge>
        <Button onClick={savePrescriptionDetails} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient & Visit Info */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{prescription.visits.patients.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p>{prescription.visits.patients.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <p>{prescription.visits.patients.date_of_birth ? 
                    new Date().getFullYear() - new Date(prescription.visits.patients.date_of_birth).getFullYear() 
                    : 'N/A'} years</p>
                </div>
                {prescription.visits.patients.email && (
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p>{prescription.visits.patients.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p>{new Date(prescription.visits.visit_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Doctor</label>
                  <p>{prescription.visits.users?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Chief Complaint</label>
                  <p className="text-sm">{prescription.visits.chief_complaint || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Diagnosis</label>
                  <p className="text-sm">{prescription.visits.diagnosis || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Status</label>
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('pending')}
                    disabled={prescription.status === 'pending'}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as Pending
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('partially_dispensed')}
                    disabled={prescription.status === 'partially_dispensed'}
                    className="justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Partially Dispensed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus('dispensed')}
                    disabled={prescription.status === 'dispensed'}
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Dispensed
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus('cancelled')}
                    disabled={prescription.status === 'cancelled'}
                    className="justify-start"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Cancel Prescription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Prescription Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medicine Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medicine Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Medicine Name</label>
                    <p className="text-xl font-semibold">{prescription.medicines.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Form</label>
                    <p>{prescription.medicines.dosage_form}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <p>{prescription.medicines.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price</label>
                    <p className="text-lg font-semibold text-green-600">₹{prescription.medicines.unit_price}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Stock Available</label>
                    <p className={`text-lg font-semibold ${prescription.medicines.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {prescription.medicines.stock_quantity} units
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prescribed Quantity</label>
                    <Input
                      type="number"
                      value={editedPrescription.quantity || 0}
                      onChange={(e) => setEditedPrescription(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max={prescription.medicines.stock_quantity}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Cost</label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{((editedPrescription.quantity || prescription.quantity) * prescription.medicines.unit_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Dosage</label>
                  <Input
                    value={editedPrescription.dosage || ''}
                    onChange={(e) => setEditedPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <Input
                    value={editedPrescription.frequency || ''}
                    onChange={(e) => setEditedPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="e.g., Twice daily"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <Input
                  value={editedPrescription.duration || ''}
                  onChange={(e) => setEditedPrescription(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 7 days"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Special Instructions</label>
                <Textarea
                  value={editedPrescription.instructions || ''}
                  onChange={(e) => setEditedPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Take after meals, avoid alcohol, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>₹{prescription.medicines.unit_price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{editedPrescription.quantity || prescription.quantity} units</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total Cost:</span>
                  <span className="text-green-600">
                    ₹{((editedPrescription.quantity || prescription.quantity) * prescription.medicines.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/consultations/${prescription.visit_id}`)}
        >
          View Consultation
        </Button>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/pharmacy')}
          >
            Send to Pharmacy
          </Button>
          <Button onClick={savePrescriptionDetails} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}