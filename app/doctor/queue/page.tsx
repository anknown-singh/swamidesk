'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, AlertTriangle, RefreshCw, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/use-user'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QueuePatient {
  id: string
  token_number: number
  patient_name: string
  patient_mobile: string
  checked_in_at: string
  priority: boolean
  status: string
  visit_date: string
  department?: string
}

export default function PatientQueuePage() {
  const router = useRouter()
  const { user } = useUser()
  const [queue, setQueue] = useState<QueuePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQueueData = useCallback(async () => {
    const supabase = createClient()
    try {
      setError(null)

      if (!user || !user.profile) {
        setError('User not authenticated')
        return
      }

      // Fetch current queue for this doctor
      const { data: queueResult, error: queueError } = await supabase
        .from('visits')
        .select(`
          id,
          token_number,
          priority,
          status,
          checked_in_at,
          visit_date,
          patients!inner(full_name, phone)
        `)
        .eq('doctor_id', user.profile.id)
        .eq('visit_date', new Date().toISOString().split('T')[0])
        .in('status', ['waiting', 'in_consultation'])
        .order('priority', { ascending: false })
        .order('checked_in_at', { ascending: true })

      if (queueError) throw queueError

      // Process queue data
      const queuePatients: QueuePatient[] = queueResult?.map(visit => ({
        id: visit.id,
        token_number: visit.token_number,
        patient_name: visit.patients?.[0]?.full_name || 'Unknown',
        patient_mobile: visit.patients?.[0]?.phone || '',
        checked_in_at: visit.checked_in_at,
        priority: visit.priority,
        status: visit.status,
        visit_date: visit.visit_date
      })) || []

      setQueue(queuePatients)

    } catch (error) {
      console.error('Error fetching queue data:', error)
      setError('Failed to load queue data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

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

  const startNextConsultation = () => {
    const nextPatient = queue.find(p => p.status === 'waiting')
    if (nextPatient) {
      router.push(`/doctor/consultations/${nextPatient.id}`)
    } else {
      toast.error('No patients waiting for consultation')
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Queue</h1>
          <p className="text-muted-foreground">
            Manage your patient consultation queue
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Queue</h1>
          <p className="text-muted-foreground">
            Manage your patient consultation queue
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={startNextConsultation}
            disabled={queue.filter(p => p.status === 'waiting').length === 0}
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Start Next
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{queue.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {queue.filter(p => p.status === 'waiting').length}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Ready for consultation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {queue.filter(p => p.status === 'in_consultation').length}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently consulting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Queue</CardTitle>
          <CardDescription>
            Patients waiting for consultation - ordered by priority and check-in time
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          ) : queue.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No patients in queue</p>
              <p className="text-sm text-muted-foreground">
                All patients have been seen or no appointments scheduled for today.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((patient, index) => (
                <div 
                  key={patient.id} 
                  className={`flex justify-between items-center p-4 border rounded-lg transition-colors ${
                    patient.status === 'in_consultation' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{patient.token_number}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        Token
                      </span>
                    </div>
                    
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {patient.patient_name}
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
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>📞 {patient.patient_mobile || 'No phone'}</span>
                        <span>⏰ Checked in {getTimeAgo(patient.checked_in_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/doctor/consultations/${patient.id}`)}
                      variant={patient.status === 'in_consultation' ? 'default' : 'outline'}
                      size="sm"
                    >
                      {patient.status === 'in_consultation' ? 'Resume' : 'Start'} Consultation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}