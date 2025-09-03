'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, User, Calendar, Phone, MapPin, FileText } from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  blood_group: string
  allergies: string[]
  medical_history: string
  insurance_provider: string
  insurance_number: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPatients()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPatient = () => {
    router.push('/receptionist/patients/new')
  }

  const handlePatientClick = (patientId: string) => {
    router.push(`/receptionist/patients/${patientId}`)
  }

  const filteredPatients = patients.filter(patient =>
    (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.phone || '').includes(searchTerm) ||
    (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">Manage patient registrations</p>
        </div>
        <Button onClick={handleNewPatient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Patient
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground flex items-center">
              Found {filteredPatients.length} patients
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registered Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <Card 
                key={patient.id} 
                className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer hover:bg-gray-50"
                onClick={() => handlePatientClick(patient.id)}
              >
                <CardContent className="p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 rounded-full p-1">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-gray-900">
                          {patient.full_name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">
                          ID: {patient.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Info Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      <span className="text-gray-600">
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'DOB not provided'}
                        {patient.date_of_birth && (
                          <span className="text-gray-500 ml-1">
                            ({Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 3600 * 24 * 365))}y)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span className="text-gray-900 font-medium">
                        {patient.phone || 'No phone'}
                      </span>
                    </div>

                    {patient.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-red-600" />
                        <span className="text-gray-600 text-xs truncate">
                          {patient.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Medical Alerts */}
                  {(patient.medical_history || patient.allergies) && (
                    <div className="border-t mt-2 pt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-800">Medical</span>
                      </div>
                      <div className="space-y-1">
                        {patient.allergies && patient.allergies.length > 0 && (
                          <div className="bg-red-50 border-l-2 border-red-200 pl-2 py-1">
                            <p className="text-xs text-red-800">
                              <span className="font-medium">Allergies:</span> {patient.allergies.join(', ')}
                            </p>
                          </div>
                        )}
                        {patient.medical_history && (
                          <div className="bg-orange-50 border-l-2 border-orange-200 pl-2 py-1">
                            <p className="text-xs text-orange-800">
                              <span className="font-medium">History:</span> 
                              <span className="line-clamp-1 ml-1">{patient.medical_history}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredPatients.length === 0 && (
              <div className="col-span-full text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No patients found' : 'No patients registered yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Click "New Patient" to register your first patient'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}