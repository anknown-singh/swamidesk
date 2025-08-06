'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, User, Calendar, Phone, MapPin, FileText } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_history: string
  allergies: string
  created_at: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const { data, error } = await supabase
        .from('patients')
        .insert([{
          ...formData,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      setSuccess(`Patient registered successfully! Patient ID: ${data[0].patient_number}`)
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_history: '',
        allergies: ''
      })
      setShowForm(false)
      fetchPatients()
    } catch (error) {
      console.error('Error registering patient:', error)
      setError('Failed to register patient')
    }
  }

  const filteredPatients = patients.filter(patient =>
    (patient.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.patient_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.phone || '').includes(searchTerm)
  )

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
          <h1 className="text-3xl font-bold tracking-tight">Patient Registration</h1>
          <p className="text-muted-foreground">Manage patient information and registrations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Patient
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
            <Button size="sm" onClick={() => router.push('/receptionist/queue')}>
              Add to Queue
            </Button>
          </AlertDescription>
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
              placeholder="Search by name, patient number, or phone..."
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

      {/* Registration Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Patient</CardTitle>
            <CardDescription>Enter patient information to create a new record</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="medical_history">Medical History</Label>
                <textarea
                  id="medical_history"
                  value={formData.medical_history}
                  onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Previous medical conditions, surgeries, etc."
                />
              </div>

              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Known allergies and reactions"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Register Patient</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registered Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                          {patient.patient_number}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor((new Date().getTime() - new Date(patient.created_at).getTime()) / (1000 * 3600 * 24))} days ago
                    </div>
                  </div>
                  
                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 gap-3 mb-3">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-gray-600 uppercase">Address</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {patient.address || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Alerts */}
                  {(patient.medical_history || patient.allergies) && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-semibold text-orange-800 uppercase">Medical Information</span>
                      </div>
                      <div className="space-y-2">
                        {patient.allergies && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <p className="text-xs font-medium text-red-800">Allergies:</p>
                            <p className="text-sm text-red-900">{patient.allergies}</p>
                          </div>
                        )}
                        {patient.medical_history && (
                          <div className="bg-orange-50 border border-orange-200 rounded p-2">
                            <p className="text-xs font-medium text-orange-800">Medical History:</p>
                            <p className="text-sm text-orange-900 line-clamp-2">{patient.medical_history}</p>
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