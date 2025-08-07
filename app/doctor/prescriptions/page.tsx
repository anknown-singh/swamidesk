'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Pill, Calendar, Trash2, FileText } from 'lucide-react'

interface Medicine {
  id: string
  name: string
  generic_name: string
  strength: string
  dosage_form: string
  unit_price: number
  stock_quantity: number
}

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
}

interface Visit {
  id: string
  visit_number: string
  visit_date: string
  patients: Patient
}

interface Prescription {
  id: string
  visit_id: string
  medicine_id: string
  quantity: number
  dosage: string
  duration: string
  instructions: string
  created_at: string
  medicines: Medicine
  visits: Visit
}

interface PrescriptionItem {
  medicine_id: string
  quantity: number
  dosage: string
  duration: string
  instructions: string
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState('')
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [medicineSearch, setMedicineSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPrescriptions()
    fetchMedicines()
    fetchRecentVisits()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medicines (
            id,
            name,
            generic_name,
            strength,
            dosage_form,
            unit_price,
            stock_quantity
          ),
          visits (
            id,
            visit_number,
            visit_date,
            patients (
              id,
              patient_number,
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
    }
  }

  const fetchRecentVisits = async () => {
    try {
      // Get visits from last 7 days that are completed or in consultation
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          patients (
            id,
            patient_number,
            first_name,
            last_name
          )
        `)
        .gte('visit_date', weekAgo.toISOString().split('T')[0])
        .in('status', ['in_consultation', 'services_pending', 'completed'])
        .order('visit_date', { ascending: false })

      if (error) throw error
      
      // Map the data to the correct Visit structure  
      interface VisitData {
        id: string
        patient_id: string
        visit_number: string
        visit_date: string
        created_at: string
        patients?: { id: string; full_name: string; phone: string }[]
      }
      interface RawVisit {
        id: string
        patient_id: string
        doctor_id: string
        visit_date: string
        created_at: string
        patients?: { id: string; full_name: string; phone: string }[]
      }
      const mappedVisits = (data as unknown as RawVisit[] || []).map((visit: RawVisit) => ({
        ...visit,
        patient: visit.patients?.[0] // Convert patients array to single patient
      })) as unknown as Visit[]
      
      setRecentVisits(mappedVisits)
    } catch (error) {
      console.error('Error fetching recent visits:', error)
    }
  }

  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, {
      medicine_id: '',
      quantity: 1,
      dosage: '',
      duration: '',
      instructions: ''
    }])
  }

  const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    const updated = [...prescriptionItems]
    updated[index] = { ...updated[index], [field]: value }
    setPrescriptionItems(updated)
  }

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index))
  }

  const savePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedVisit || prescriptionItems.length === 0) {
      setError('Please select a visit and add at least one medicine')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const prescriptionsToInsert = prescriptionItems.map(item => ({
        visit_id: selectedVisit,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        dosage: item.dosage,
        duration: item.duration,
        instructions: item.instructions,
        prescribed_by: user?.id
      }))

      const { error } = await supabase
        .from('prescriptions')
        .insert(prescriptionsToInsert)

      if (error) throw error

      setSuccess('Prescription saved successfully! Ready for billing.')
      setSelectedVisit('')
      setPrescriptionItems([])
      setShowForm(false)
      fetchPrescriptions()
    } catch (error) {
      console.error('Error saving prescription:', error)
      setError('Failed to save prescription')
    }
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(medicineSearch.toLowerCase())
  )

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.visits.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.visits.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.visits.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.medicines.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading prescriptions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Manage patient prescriptions and medications</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>{success}</span>
            {success.includes('billing') && (
              <Button size="sm" onClick={() => router.push('/receptionist/billing')}>
                Go to Billing
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search prescriptions by patient name, ID, or medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">
              {filteredPrescriptions.length} prescriptions found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Prescription Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Prescription</CardTitle>
            <CardDescription>Select a patient visit and add medications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePrescription} className="space-y-6">
              {/* Visit Selection */}
              <div>
                <Label htmlFor="visit_select">Select Patient Visit *</Label>
                <select
                  id="visit_select"
                  value={selectedVisit}
                  onChange={(e) => setSelectedVisit(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a recent visit...</option>
                  {recentVisits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.patients.first_name} {visit.patients.last_name} - {visit.visit_number} ({new Date(visit.visit_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prescription Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Medications</Label>
                  <Button type="button" onClick={addPrescriptionItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>

                {prescriptionItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                    No medications added yet. Click &quot;Add Medicine&quot; to start.
                  </div>
                )}

                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Medicine #{index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removePrescriptionItem(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>Medicine *</Label>
                          <div className="space-y-2">
                            <Input
                              placeholder="Search medicines..."
                              value={medicineSearch}
                              onChange={(e) => setMedicineSearch(e.target.value)}
                            />
                            <select
                              value={item.medicine_id}
                              onChange={(e) => updatePrescriptionItem(index, 'medicine_id', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="">Select medicine...</option>
                              {filteredMedicines.map((medicine) => (
                                <option key={medicine.id} value={medicine.id}>
                                  {medicine.name} - {medicine.strength} ({medicine.dosage_form}) - Stock: {medicine.stock_quantity}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value))}
                            required
                          />
                        </div>

                        <div>
                          <Label>Duration</Label>
                          <Input
                            placeholder="e.g., 7 days, 2 weeks"
                            value={item.duration}
                            onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Dosage</Label>
                          <Input
                            placeholder="e.g., 1 tablet twice daily"
                            value={item.dosage}
                            onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Instructions</Label>
                          <Input
                            placeholder="e.g., Take after meals"
                            value={item.instructions}
                            onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save Prescription</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Recent Prescriptions ({filteredPrescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {prescription.visits.patients.first_name} {prescription.visits.patients.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {prescription.visits.patients.patient_number} • {prescription.visits.visit_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{prescription.medicines.name}</p>
                        <p className="text-xs text-gray-500">{prescription.medicines.strength} {prescription.medicines.dosage_form}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <p>{prescription.quantity}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dosage:</span>
                        <p>{prescription.dosage || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p>{prescription.duration || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Instructions:</span>
                        <p>{prescription.instructions || 'None'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Visit: {new Date(prescription.visits.visit_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        prescription.medicines.stock_quantity > 10 
                          ? 'bg-green-100 text-green-800' 
                          : prescription.medicines.stock_quantity > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {prescription.medicines.stock_quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No prescriptions found matching your search' : 'No prescriptions yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}