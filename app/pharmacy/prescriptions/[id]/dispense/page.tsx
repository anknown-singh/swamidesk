'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Pill,
  Package
} from 'lucide-react'

interface PrescriptionDetail {
  id: string
  status: string
  priority: boolean
  created_at: string
  notes?: string
  patients?: { 
    full_name: string
    phone: string
    date_of_birth: string
  }
  users?: { full_name: string }
  prescription_items?: Array<{
    id: string
    quantity: number
    dosage: string
    frequency: string
    duration: string
    medicines: { 
      name: string
      strength: string
      stock_quantity: number
    }
  }>
}

export default function DispensePrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [dispensing, setDispensing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prescriptionId, setPrescriptionId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params
      setPrescriptionId(resolvedParams.id)
      fetchPrescription(resolvedParams.id)
    }
    initializePage()
  }, [params])

  const fetchPrescription = async (id?: string) => {
    const idToUse = id || prescriptionId
    if (!idToUse) return
    const supabase = createClient()
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          status,
          priority,
          created_at,
          notes,
          patients(
            full_name,
            phone,
            date_of_birth
          ),
          users!prescriptions_prescribed_by_fkey(full_name),
          prescription_items(
            id,
            quantity,
            dosage,
            frequency,
            duration,
            medicines(
              name,
              strength,
              stock_quantity
            )
          )
        `)
        .eq('id', idToUse)
        .single()

      if (error) throw error
      setPrescription(data)
    } catch (error) {
      console.error('Error fetching prescription:', error)
      setError('Failed to load prescription details')
    } finally {
      setLoading(false)
    }
  }

  const handleDispense = async () => {
    if (!prescription) return

    const supabase = createClient()
    try {
      setDispensing(true)
      
      // Update prescription status
      const { error } = await supabase
        .from('prescriptions')
        .update({ 
          status: 'dispensed',
          dispensed_at: new Date().toISOString(),
          dispensed_by: 'current_user_id' // This should be the actual user ID
        })
        .eq('id', prescription.id)

      if (error) throw error

      // Show success and redirect
      router.push('/pharmacy/prescriptions?success=dispensed')
    } catch (error) {
      console.error('Error dispensing prescription:', error)
      setError('Failed to dispense prescription')
    } finally {
      setDispensing(false)
    }
  }

  const checkStockAvailability = () => {
    if (!prescription?.prescription_items) return { available: true, issues: [] }
    
    const issues = prescription.prescription_items.filter(item => 
      item.medicines.stock_quantity < item.quantity
    )
    
    return {
      available: issues.length === 0,
      issues: issues.map(item => ({
        medicine: item.medicines.name,
        required: item.quantity,
        available: item.medicines.stock_quantity
      }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispensing Prescription</h1>
          <p className="text-muted-foreground">Loading prescription details...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Prescription not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stockCheck = checkStockAvailability()
  const patientName = prescription.patients?.full_name || 'Unknown Patient'
  const doctorName = prescription.users?.full_name || 'Unknown Doctor'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispense Prescription</h1>
        <p className="text-muted-foreground">
          Review and dispense medicines for {patientName}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stock Availability Alert */}
      {!stockCheck.available && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Stock Issue:</strong> Some medicines are not available in sufficient quantities.
            <ul className="mt-2 ml-4 list-disc">
              {stockCheck.issues.map((issue, index) => (
                <li key={index}>
                  {issue.medicine}: Need {issue.required}, have {issue.available}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Name:</span> {patientName}
            </div>
            {prescription.patients?.phone && (
              <div>
                <span className="font-medium">Phone:</span> {prescription.patients.phone}
              </div>
            )}
            {prescription.patients?.date_of_birth && (
              <div>
                <span className="font-medium">DOB:</span> {new Date(prescription.patients.date_of_birth).toLocaleDateString()}
              </div>
            )}
            <div>
              <span className="font-medium">Prescribed by:</span> Dr. {doctorName}
            </div>
            <div>
              <span className="font-medium">Date:</span> {new Date(prescription.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={
                prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }>
                {prescription.status}
              </Badge>
              {prescription.priority && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Dispensing Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              Total medicines: {prescription.prescription_items?.length || 0}
            </div>
            
            {prescription.status === 'pending' ? (
              <Button 
                onClick={handleDispense}
                disabled={dispensing || !stockCheck.available}
                className="w-full"
                size="lg"
              >
                {dispensing ? 'Dispensing...' : 'Dispense All Medicines'}
              </Button>
            ) : (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  This prescription has already been dispensed
                </p>
              </div>
            )}

            {prescription.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-800">Notes:</span>
                <p className="text-yellow-700 text-sm mt-1">{prescription.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medicine Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescribed Medicines
          </CardTitle>
          <CardDescription>
            Review all medicines before dispensing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prescription.prescription_items?.map((item) => {
              const isStockSufficient = item.medicines.stock_quantity >= item.quantity
              
              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div>
                        <h3 className="font-semibold text-lg">{item.medicines.name}</h3>
                        <p className="text-sm text-gray-600">
                          {item.medicines.strength}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span>
                          <p>{item.quantity}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Dosage:</span>
                          <p>{item.dosage || 'As prescribed'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Frequency:</span>
                          <p>{item.frequency || 'As prescribed'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p>{item.duration || 'As prescribed'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Stock: {item.medicines.stock_quantity}
                      </span>
                      <Badge className={isStockSufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {isStockSufficient ? 'Available' : 'Insufficient'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}

            {(!prescription.prescription_items || prescription.prescription_items.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No medicines found for this prescription
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}