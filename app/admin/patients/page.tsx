'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const fetchPatients = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (patient.patient_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (patient.phone || '').includes(searchTerm) ||
                         (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
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
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{patient.full_name}</h3>
                        <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                          ID: {patient.patient_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                        {patient.gender || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-600 uppercase">Date of Birth</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </p>
                      {patient.date_of_birth && (
                        <p className="text-xs text-gray-500">
                          Age: {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 3600 * 24 * 365))} years
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-600 uppercase">Phone</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.phone || 'Not provided'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-600 uppercase">Email</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {patient.email || 'Not provided'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-gray-600 uppercase">Address</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {patient.address || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Emergency Contact & Registration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-800 uppercase">Emergency Contact</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.emergency_contact_name || 'Not provided'}
                      </p>
                      {patient.emergency_contact_phone && (
                        <p className="text-sm text-gray-600">{patient.emergency_contact_phone}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 uppercase">Registration</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.floor((new Date().getTime() - new Date(patient.created_at).getTime()) / (1000 * 3600 * 24))} days ago
                      </p>
                    </div>
                  </div>

                  {/* Medical Information */}
                  {(patient.allergies || patient.medical_history) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-red-500" />
                        Medical Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patient.allergies && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-red-800 uppercase">Allergies</span>
                            </div>
                            <p className="text-sm text-red-900">{patient.allergies}</p>
                          </div>
                        )}
                        {patient.medical_history && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-orange-800 uppercase">Medical History</span>
                            </div>
                            <p className="text-sm text-orange-900 line-clamp-3">{patient.medical_history}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        onClick={() => window.location.href = `/admin/patients/${patient.id}`}
                      >
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/admin/appointments/new?patient_id=${patient.id}`}
                      >
                        Book Appointment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/admin/patients/${patient.id}/edit`}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (patient.phone) {
                            window.open(`tel:${patient.phone}`)
                          }
                        }}
                        disabled={!patient.phone}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No patients found' : 'No patients registered yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms or filters' : 'Start by registering your first patient'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}