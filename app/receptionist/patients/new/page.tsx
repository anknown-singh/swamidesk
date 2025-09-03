'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, User } from 'lucide-react'

export default function NewPatientPage() {
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
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Clean up form data to match actual database schema
      const cleanedData = {
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        phone: formData.phone.trim(), // Required field
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        medical_history: formData.medical_history?.trim() || null,
        allergies: formData.allergies?.trim() ? [formData.allergies.trim()] : null // Convert to array format
      }

      // Try inserting without specifying patient_number to let the trigger handle it
      const { data, error } = await supabase
        .from('patients')
        .insert([cleanedData])
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error hint:', error.hint)
        console.error('Data being sent:', cleanedData)
        
        // Provide more specific error messages based on error type
        if (error.code === '42501') {
          throw new Error('Permission denied. Please check if you have the correct role to register patients.')
        } else if (error.code === '23502') {
          throw new Error('Required field missing. Please fill in all required fields.')
        } else if (error.code === '23505') {
          throw new Error('Patient already exists or duplicate data detected.')
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from insert operation')
      }

      setSuccess(`Patient registered successfully! Patient ID: ${data[0].id}`)
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
    } catch (error) {
      console.error('Error registering patient:', error)
      setError(error instanceof Error ? error.message : 'Failed to register patient')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/receptionist/patients')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/receptionist/patients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Patient</h1>
          <p className="text-sm text-muted-foreground">Enter patient information</p>
        </div>
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
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push('/receptionist/queue')}>
                Add to Queue
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push('/receptionist/patients')}>
                View Patients
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Patient Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal & Contact Information in one grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="first_name" className="text-xs">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-xs">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  className="h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="date_of_birth" className="text-xs">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  aria-label="Select gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full h-8 px-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-xs">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="h-8"
              />
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-3">
              <h3 className="text-sm font-medium mb-2 text-gray-700">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="emergency_contact_name" className="text-xs">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone" className="text-xs">Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-t pt-3">
              <h3 className="text-sm font-medium mb-2 text-gray-700">Medical Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="medical_history" className="text-xs">Medical History</Label>
                  <textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-16 text-sm"
                    placeholder="Previous conditions, surgeries..."
                  />
                </div>
                <div>
                  <Label htmlFor="allergies" className="text-xs">Allergies & Reactions</Label>
                  <textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-16 text-sm"
                    placeholder="Drug allergies, food allergies..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading} className="flex-1 h-9">
                {loading ? 'Registering...' : 'Register Patient'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 h-9">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}