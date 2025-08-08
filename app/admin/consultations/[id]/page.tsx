'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  Stethoscope,
  Pill,
  TestTube,
  ClipboardList,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  visit_time: string
  chief_complaint: string
  symptoms: string
  diagnosis: string
  examination_notes: string
  vital_signs: string
  status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'cancelled'
  created_at: string
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

interface Prescription {
  id: string
  medicine_id: string
  quantity: number
  dosage: string
  frequency: string
  duration: string
  instructions: string
  status: string
  medicines: {
    name: string
    category: string
    unit_price: number
  }
}

interface Treatment {
  id: string
  service_id: string
  notes: string
  status: string
  price: number
  services: {
    name: string
    category: string
  }
}

interface Medicine {
  id: string
  name: string
  category: string
  unit_price: number
  stock_quantity: number
}

interface Service {
  id: string
  name: string
  category: string
  price: number
  is_active: boolean
}

export default function ConsultationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const visitId = params.id as string
  
  const [visit, setVisit] = useState<Visit | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([])
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Form states for editing
  const [editedVisit, setEditedVisit] = useState<Partial<Visit>>({})
  const [newPrescription, setNewPrescription] = useState({
    medicine_id: '',
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  })
  const [newTreatment, setNewTreatment] = useState({
    service_id: '',
    notes: '',
    status: 'planned'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchConsultationDetails()
    fetchAvailableMedicines()
    fetchAvailableServices()
  }, [visitId])

  const fetchConsultationDetails = async () => {
    try {
      // Fetch visit details
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
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
        `)
        .eq('id', visitId)
        .single()

      if (visitError) throw visitError
      
      setVisit(visitData as Visit)
      setEditedVisit(visitData)

      // Fetch prescriptions for this visit
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medicines (
            name,
            category,
            unit_price
          )
        `)
        .eq('visit_id', visitId)

      if (prescriptionsError) throw prescriptionsError
      setPrescriptions(prescriptionsData || [])

      // Fetch treatments/services for this visit
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('visit_services')
        .select(`
          *,
          services (
            name,
            category
          )
        `)
        .eq('visit_id', visitId)

      if (treatmentsError) throw treatmentsError
      setTreatments(treatmentsData || [])

    } catch (error) {
      console.error('Error fetching consultation details:', error)
      setError('Failed to load consultation details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, category, unit_price, stock_quantity')
        .gt('stock_quantity', 0)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAvailableMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
    }
  }

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category, price, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAvailableServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const saveVisitDetails = async () => {
    if (!visit) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          chief_complaint: editedVisit.chief_complaint,
          symptoms: editedVisit.symptoms,
          diagnosis: editedVisit.diagnosis,
          examination_notes: editedVisit.examination_notes,
          vital_signs: editedVisit.vital_signs,
          status: editedVisit.status
        })
        .eq('id', visitId)

      if (error) throw error
      
      setVisit(prev => prev ? { ...prev, ...editedVisit } : null)
      setError(null)
      alert('Consultation updated successfully!')
    } catch (error) {
      console.error('Error saving visit:', error)
      setError('Failed to save consultation details')
    } finally {
      setSaving(false)
    }
  }

  const addPrescription = async () => {
    if (!newPrescription.medicine_id) {
      setError('Please select a medicine')
      return
    }

    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([{
          visit_id: visitId,
          medicine_id: newPrescription.medicine_id,
          quantity: newPrescription.quantity,
          dosage: newPrescription.dosage,
          frequency: newPrescription.frequency,
          duration: newPrescription.duration,
          instructions: newPrescription.instructions,
          status: 'pending'
        }])
        .select(`
          *,
          medicines (
            name,
            category,
            unit_price
          )
        `)

      if (error) throw error
      
      setPrescriptions(prev => [...prev, ...(data as Prescription[])])
      setNewPrescription({
        medicine_id: '',
        quantity: 1,
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      })
      setError(null)
    } catch (error) {
      console.error('Error adding prescription:', error)
      setError('Failed to add prescription')
    }
  }

  const addTreatment = async () => {
    if (!newTreatment.service_id) {
      setError('Please select a service')
      return
    }

    const selectedService = availableServices.find(s => s.id === newTreatment.service_id)
    if (!selectedService) return

    try {
      const { data, error } = await supabase
        .from('visit_services')
        .insert([{
          visit_id: visitId,
          service_id: newTreatment.service_id,
          notes: newTreatment.notes,
          status: newTreatment.status,
          price: selectedService.price
        }])
        .select(`
          *,
          services (
            name,
            category
          )
        `)

      if (error) throw error
      
      setTreatments(prev => [...prev, ...(data as Treatment[])])
      setNewTreatment({
        service_id: '',
        notes: '',
        status: 'planned'
      })
      setError(null)
    } catch (error) {
      console.error('Error adding treatment:', error)
      setError('Failed to add treatment')
    }
  }

  const deletePrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to remove this prescription?')) return

    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId)

      if (error) throw error
      
      setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId))
    } catch (error) {
      console.error('Error deleting prescription:', error)
      setError('Failed to delete prescription')
    }
  }

  const deleteTreatment = async (treatmentId: string) => {
    if (!confirm('Are you sure you want to remove this treatment?')) return

    try {
      const { error } = await supabase
        .from('visit_services')
        .delete()
        .eq('id', treatmentId)

      if (error) throw error
      
      setTreatments(prev => prev.filter(t => t.id !== treatmentId))
    } catch (error) {
      console.error('Error deleting treatment:', error)
      setError('Failed to delete treatment')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'in_consultation': return 'bg-blue-100 text-blue-800'
      case 'services_pending': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading consultation details...</div>
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Consultation not found</div>
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
            Consultation: {visit.patients.full_name}
          </h1>
          <p className="text-muted-foreground">
            {new Date(visit.visit_date).toLocaleDateString()} at {visit.visit_time}
          </p>
        </div>
        <Badge className={getStatusColor(visit.status)}>
          {visit.status.replace('_', ' ').toUpperCase()}
        </Badge>
        <Button onClick={saveVisitDetails} disabled={saving}>
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

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-lg">{visit.patients.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <p>{visit.patients.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Age</label>
              <p>{visit.patients.date_of_birth ? 
                new Date().getFullYear() - new Date(visit.patients.date_of_birth).getFullYear() 
                : 'N/A'} years</p>
            </div>
            <div>
              <label className="text-sm font-medium">Doctor</label>
              <p>{visit.users?.full_name || 'Not assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Stethoscope className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            <Pill className="h-4 w-4 mr-2" />
            Medicines
          </TabsTrigger>
          <TabsTrigger value="treatments">
            <TestTube className="h-4 w-4 mr-2" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Clinical Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Chief Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedVisit.chief_complaint || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, chief_complaint: e.target.value }))}
                  placeholder="Patient's main concern or reason for visit..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedVisit.symptoms || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Patient's reported symptoms..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedVisit.diagnosis || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Medical diagnosis..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedVisit.vital_signs || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, vital_signs: e.target.value }))}
                  placeholder="BP: 120/80, Temp: 98.6°F, Pulse: 72 bpm, etc."
                  rows={2}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Examination Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedVisit.examination_notes || ''}
                onChange={(e) => setEditedVisit(prev => ({ ...prev, examination_notes: e.target.value }))}
                placeholder="Detailed examination findings and clinical observations..."
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visit Status</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={editedVisit.status || 'waiting'}
                onChange={(e) => setEditedVisit(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="waiting">Waiting</option>
                <option value="in_consultation">In Consultation</option>
                <option value="services_pending">Services Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          {/* Add New Prescription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Medicine Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Medicine</label>
                  <select
                    value={newPrescription.medicine_id}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, medicine_id: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select medicine...</option>
                    {availableMedicines.map(medicine => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name} - ₹{medicine.unit_price} (Stock: {medicine.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={newPrescription.quantity}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dosage</label>
                  <Input
                    value={newPrescription.dosage}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <Input
                    value={newPrescription.frequency}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Input
                    value={newPrescription.duration}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addPrescription} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prescription
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Special Instructions</label>
                <Textarea
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Take after meals, avoid alcohol, etc."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Current Prescriptions ({prescriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prescriptions.map(prescription => (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{prescription.medicines.name}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Quantity:</span> {prescription.quantity}
                          </div>
                          <div>
                            <span className="font-medium">Dosage:</span> {prescription.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Frequency:</span> {prescription.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {prescription.duration}
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="text-sm">
                            <span className="font-medium">Instructions:</span>
                            <p className="text-gray-600 mt-1">{prescription.instructions}</p>
                          </div>
                        )}
                        <Badge variant="outline">{prescription.status}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePrescription(prescription.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No prescriptions added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-6">
          {/* Add New Treatment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Treatment/Procedure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service/Procedure</label>
                  <select
                    value={newTreatment.service_id}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, service_id: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select service...</option>
                    {availableServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ₹{service.price} ({service.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={newTreatment.status}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Treatment Notes</label>
                <Textarea
                  value={newTreatment.notes}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Treatment plan, special instructions, expected outcomes..."
                  rows={3}
                />
              </div>
              <Button onClick={addTreatment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Treatment
              </Button>
            </CardContent>
          </Card>

          {/* Current Treatments */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Treatments ({treatments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {treatments.map(treatment => (
                  <div key={treatment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{treatment.services.name}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Category:</span> {treatment.services.category}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> ₹{treatment.price}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge variant="outline" className="ml-2">{treatment.status}</Badge>
                          </div>
                        </div>
                        {treatment.notes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes:</span>
                            <p className="text-gray-600 mt-1">{treatment.notes}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTreatment(treatment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {treatments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No treatments planned yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Clinical Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Examination Findings</label>
                <Textarea
                  value={editedVisit.examination_notes || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, examination_notes: e.target.value }))}
                  placeholder="Detailed physical examination findings, observations, and clinical assessments..."
                  rows={8}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Vital Signs Record</label>
                <Textarea
                  value={editedVisit.vital_signs || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, vital_signs: e.target.value }))}
                  placeholder="Blood Pressure, Temperature, Heart Rate, Respiratory Rate, Oxygen Saturation, Height, Weight, BMI..."
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Treatment Plan</label>
                  <Textarea
                    placeholder="Overall treatment strategy, follow-up plans, referrals..."
                    rows={5}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Patient Education</label>
                  <Textarea
                    placeholder="Instructions given to patient, lifestyle recommendations, precautions..."
                    rows={5}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/opd')}
        >
          Go to OPD Workflow
        </Button>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to billing/invoice
              router.push(`/admin/billing?visit=${visitId}`)
            }}
          >
            Generate Bill
          </Button>
          <Button onClick={saveVisitDetails} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}