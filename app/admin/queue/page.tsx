'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Search, Users, UserCheck, AlertCircle, CheckCircle, Calendar, Phone, RefreshCw, Stethoscope, Filter } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

interface QueuePatient {
  id: string
  token_number: number
  patient_name: string
  patient_mobile: string
  doctor_name: string
  doctor_id: string
  checked_in_at: string
  priority: boolean
  status: string
  visit_date: string
  department?: string
}

interface Doctor {
  id: string
  full_name: string
  department: string
}

export default function AdminPatientQueuePage() {
  const router = useRouter()
  const { user } = useUser()
  const [queue, setQueue] = useState<QueuePatient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchQueueData = useCallback(async () => {
    const supabase = createClient()
    try {
      setError(null)

      // Fetch doctors first
      const { data: doctorsResult, error: doctorsError } = await supabase
        .from('users')
        .select('id, full_name, department')
        .eq('role', 'doctor')
        .order('full_name')

      if (doctorsError) throw doctorsError
      setDoctors(doctorsResult || [])

      // Build query conditions
      let query = supabase
        .from('visits')
        .select(`
          id,
          token_number,
          priority,
          status,
          checked_in_at,
          visit_date,
          doctor_id,
          patients(full_name, phone),
          users!visits_doctor_id_fkey(full_name, department)
        `)
        .eq('visit_date', new Date().toISOString().split('T')[0])
        .in('status', ['waiting', 'in_consultation'])
        .order('priority', { ascending: false })
        .order('checked_in_at', { ascending: true })

      // Filter by doctor if selected
      if (selectedDoctor !== 'all') {
        query = query.eq('doctor_id', selectedDoctor)
      }

      const { data: queueResult, error: queueError } = await query

      if (queueError) throw queueError

      // Process queue data
      const queuePatients: QueuePatient[] = queueResult?.map((visit: any) => ({
        id: visit.id,
        token_number: visit.token_number,
        patient_name: visit.patients?.full_name || 'Unknown',
        patient_mobile: visit.patients?.phone || '',
        doctor_name: visit.users?.full_name || 'Unknown Doctor',
        doctor_id: visit.doctor_id,
        checked_in_at: visit.checked_in_at,
        priority: visit.priority,
        status: visit.status,
        visit_date: visit.visit_date,
        department: visit.users?.department
      })) || []

      setQueue(queuePatients)

    } catch (error) {
      console.error('Error fetching queue data:', error)
      setError('Failed to load queue data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedDoctor])

  useEffect(() => {
    if (user) {
      fetchQueueData()
    }
  }, [user, fetchQueueData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchQueueData()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    return `${Math.floor(diffInMinutes / 60)} hr ago`
  }

  const getStatusCounts = () => {
    const total = queue.length
    const waiting = queue.filter(p => p.status === 'waiting').length
    const inProgress = queue.filter(p => p.status === 'in_consultation').length
    const highPriority = queue.filter(p => p.priority).length
    
    return { total, waiting, inProgress, highPriority }
  }

  const filteredQueue = queue.filter(item => {
    return (item.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (item.patient_mobile?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (item.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           item.token_number.toString().includes(searchTerm)
  })

  const { total, waiting, inProgress, highPriority } = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Administrative view of patient queue across all departments</p>
        </div>
        <Button onClick={() => window.location.href = '/receptionist/queue'} className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Queue
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total in Queue</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{waiting}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{highPriority}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by patient name, phone, doctor, or token number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="text-sm text-muted-foreground ml-auto">
              {filteredQueue.length} patients in queue
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Patient Queue ({filteredQueue.length})
          </CardTitle>
          <CardDescription>
            System-wide view of patient queue across all departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No patients in queue</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'No patients found matching your search criteria' : 'All patients have been seen or no appointments scheduled for today'}
                </p>
              </div>
            ) : (
              filteredQueue.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        #{patient.token_number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{patient.patient_name}</h3>
                          {patient.priority && (
                            <Badge variant="destructive" className="text-xs">
                              Priority
                            </Badge>
                          )}
                          <Badge 
                            variant={patient.status === 'in_consultation' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {patient.status === 'in_consultation' ? 'Consulting' : 'Waiting'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{patient.patient_mobile || 'No phone'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Checked in {getTimeAgo(patient.checked_in_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            <span>Dr. {patient.doctor_name}</span>
                          </div>
                          {patient.department && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{patient.department}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => router.push(`/admin/patients/${patient.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => router.push(`/doctor/consultations/${patient.id}`)}
                        variant={patient.status === 'in_consultation' ? 'default' : 'outline'}
                        size="sm"
                      >
                        {patient.status === 'in_consultation' ? 'Monitor' : 'View'} Consultation
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}