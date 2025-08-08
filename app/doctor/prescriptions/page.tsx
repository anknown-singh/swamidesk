'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Pill, Calendar, FileText } from 'lucide-react'
import { EnhancedPrescriptionForm } from '@/components/prescription/enhanced-prescription-form'

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


export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPrescriptions()
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


  const handlePrescriptionSuccess = (message: string) => {
    setSuccess(message)
    setShowForm(false)
    fetchPrescriptions()
  }

  const handlePrescriptionError = (message: string) => {
    setError(message)
  }

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

      {/* Enhanced Prescription Form */}
      {showForm && (
        <EnhancedPrescriptionForm
          onSuccess={handlePrescriptionSuccess}
          onError={handlePrescriptionError}
          onCancel={() => setShowForm(false)}
        />
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
                  
                  <div className="flex flex-wrap gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/doctor/prescriptions/${prescription.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/doctor/patients/${prescription.visits.patients.id}`)}
                    >
                      View Patient
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/doctor/prescriptions/${prescription.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/pharmacy/dispense?prescription_id=${prescription.id}`)}
                    >
                      Send to Pharmacy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      Print
                    </Button>
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