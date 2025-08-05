'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Search, UserPlus, Phone, Mail, Calendar, MapPin, Activity } from 'lucide-react'

interface Patient {
  id: string
  patient_id: string
  full_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_history: string
  allergies: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGender, setFilterGender] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPatients()
  }, [])

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

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone?.includes(searchTerm) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGender = filterGender === 'all' || patient.gender === filterGender
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && patient.is_active) ||
                         (filterStatus === 'inactive' && !patient.is_active)
    
    return matchesSearch && matchesGender && matchesStatus
  })

  const totalPatients = patients.length
  const activePatients = patients.filter(p => p.is_active).length
  const inactivePatients = patients.filter(p => !p.is_active).length
  const malePatients = patients.filter(p => p.gender === 'male').length
  const femalePatients = patients.filter(p => p.gender === 'female').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
          <p className="text-muted-foreground">Administrative view of all registered patients</p>
        </div>
        <Button onClick={() => window.location.href = '/receptionist/patients'} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Register New Patient
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activePatients}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{inactivePatients}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Male</p>
                <p className="text-2xl font-bold text-blue-600">{malePatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Female</p>
                <p className="text-2xl font-bold text-pink-600">{femalePatients}</p>
              </div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, ID, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredPatients.length} patients found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Directory ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                        <p className="text-sm text-gray-600">ID: {patient.patient_id}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                        {patient.gender}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-700">DOB:</span>
                          <p>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <p>{patient.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <p>{patient.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-700">Address:</span>
                          <p className="truncate">{patient.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Emergency Contact:</span>
                        <p>{patient.emergency_contact_name || 'Not provided'} 
                           {patient.emergency_contact_phone && ` - ${patient.emergency_contact_phone}`}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Registered:</span>
                        <p>{new Date(patient.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {(patient.allergies || patient.medical_history) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {patient.allergies && (
                          <div>
                            <span className="font-medium text-gray-700">Allergies:</span>
                            <p className="text-red-600">{patient.allergies}</p>
                          </div>
                        )}
                        {patient.medical_history && (
                          <div>
                            <span className="font-medium text-gray-700">Medical History:</span>
                            <p className="truncate">{patient.medical_history}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}