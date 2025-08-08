'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, FileText, Activity, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/use-user'
import { WorkflowStatusIndicator } from '@/components/workflow/workflow-status-indicator'

interface DoctorStats {
  todayPatients: {
    total: number
    completed: number
    pending: number
  }
  queueLength: number
  prescriptionsToday: number
  servicesAssigned: number
}

interface QueuePatient {
  id: string
  token_number: number
  patient_name: string
  patient_mobile: string
  checked_in_at: string
  priority: boolean
  status: string
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DoctorStats | null>(null)
  const [queue, setQueue] = useState<QueuePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useUser()

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        setError('User not authenticated')
        return
      }

      // Fetch all data in parallel
      const [
        todayVisitsResult,
        queueResult,
        prescriptionsResult,
        servicesResult
      ] = await Promise.all([
        // Today's visits for this doctor
        supabase
          .from('visits')
          .select('id, status')
          .eq('doctor_id', user.id)
          .eq('visit_date', new Date().toISOString().split('T')[0]),
        
        // Current queue for this doctor
        supabase
          .from('visits')
          .select(`
            id,
            token_number,
            priority,
            status,
            checked_in_at,
            patients!inner(name, mobile)
          `)
          .eq('doctor_id', user.id)
          .eq('visit_date', new Date().toISOString().split('T')[0])
          .in('status', ['waiting', 'in_consultation'])
          .order('priority', { ascending: false })
          .order('checked_in_at', { ascending: true }),
        
        // Prescriptions written today by this doctor
        supabase
          .from('prescriptions')
          .select(`
            id,
            visits!inner(
              doctor_id,
              visit_date
            )
          `)
          .eq('visits.doctor_id', user.id)
          .eq('visits.visit_date', new Date().toISOString().split('T')[0]),
        
        // Services assigned to this doctor's patients today
        supabase
          .from('visit_services')
          .select(`
            id,
            visits!inner(
              doctor_id,
              visit_date
            )
          `)
          .eq('visits.doctor_id', user.id)
          .eq('visits.visit_date', new Date().toISOString().split('T')[0])
      ])

      // Process today's visits
      const todayVisits = todayVisitsResult.data || []
      const completed = todayVisits.filter(v => v.status === 'completed').length
      const pending = todayVisits.filter(v => ['waiting', 'in_consultation', 'services_pending'].includes(v.status)).length

      setStats({
        todayPatients: {
          total: todayVisits.length,
          completed,
          pending
        },
        queueLength: queueResult.data?.length || 0,
        prescriptionsToday: prescriptionsResult.data?.length || 0,
        servicesAssigned: servicesResult.data?.length || 0
      })

      // Process queue
      const queuePatients: QueuePatient[] = queueResult.data?.map(visit => ({
        id: visit.id,
        token_number: visit.token_number,
        patient_name: visit.patients?.[0]?.name || 'Unknown',
        patient_mobile: visit.patients?.[0]?.mobile || '',
        checked_in_at: visit.checked_in_at,
        priority: visit.priority,
        status: visit.status
      })) || []

      setQueue(queuePatients.slice(0, 4))

    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    return `${Math.floor(diffInMinutes / 60)} hr ago`
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage consultations and patient care
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.todayPatients.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 w-32" />
              ) : (
                `${stats?.todayPatients.completed || 0} completed, ${stats?.todayPatients.pending || 0} pending`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.queueLength || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.prescriptionsToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Written today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedures</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.servicesAssigned || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Services assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Queue</CardTitle>
            <CardDescription>
              Patients waiting for consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {queue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No patients waiting</p>
                ) : (
                  queue.map((patient) => (
                    <div key={patient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {patient.patient_name}
                          {patient.priority && (
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                              Priority
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Token #{patient.token_number} • {getTimeAgo(patient.checked_in_at)}
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {patient.status === 'in_consultation' ? 'Resume' : 'Start'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common consultation tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Start Next Consultation</div>
                <div className="text-sm text-muted-foreground">Begin consultation with next patient</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">View Treatment Plans</div>
                <div className="text-sm text-muted-foreground">Manage ongoing treatment plans</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Prescription History</div>
                <div className="text-sm text-muted-foreground">Review recent prescriptions</div>
              </button>
              <a href="/doctor/documentation" className="text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-between">
                <div>
                  <div className="font-medium">Help & Documentation</div>
                  <div className="text-sm text-muted-foreground">Patient workflow guides & OPD help</div>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <ExternalLink className="h-3 w-3 text-amber-600" />
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Status */}
      <div className="mt-6">
        <WorkflowStatusIndicator compact={true} />
      </div>
    </div>
  )
}