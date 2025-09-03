'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  MobileDashboardLayout, 
  MobileGrid, 
  MobileStatsGrid, 
  MobileContent,
  MobileSection 
} from './mobile-dashboard-layout'
import { MobileCard, MobileMetricCard, MobileListCard } from './mobile-card'
import { TouchButton } from './mobile-touch-interactions'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  Clock, 
  FileText, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Play,
  CheckCircle,
  Timer
} from 'lucide-react'

interface DoctorStats {
  todayPatients: {
    total: number
    completed: number
    pending: number
  }
  queueLength: number
  prescriptionsToday: number
  servicesAssigned: number
  averageConsultationTime: number
}

interface QueuePatient {
  id: string
  token_number: number
  patient_name: string
  patient_mobile: string
  checked_in_at: string
  priority: boolean
  status: string
  waitTime: number
}

export function MobileOptimizedDoctorDashboard() {
  const [stats, setStats] = useState<DoctorStats | null>(null)
  const [queue, setQueue] = useState<QueuePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = createClient()

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      if (!user) {
        setError('User not authenticated')
        return
      }

      // Fetch all data in parallel with individual error handling
      const [
        todayVisitsResult,
        queueResult,
        prescriptionsResult,
        servicesResult
      ] = await Promise.allSettled([
        supabase
          .from('visits')
          .select('id, status')
          .eq('doctor_id', user.id)
          .eq('visit_date', new Date().toISOString().split('T')[0]),
        
        supabase
          .from('visits')
          .select(`
            id,
            token_number,
            priority,
            status,
            checked_in_at,
            patients!inner(full_name, phone)
          `)
          .eq('doctor_id', user.id)
          .eq('visit_date', new Date().toISOString().split('T')[0])
          .in('status', ['waiting', 'in_consultation'])
          .order('priority', { ascending: false })
          .order('checked_in_at', { ascending: true }),
        
        supabase
          .from('prescriptions')
          .select('id')
          .eq('doctor_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        supabase
          .from('visit_services')
          .select('id')
          .eq('assigned_by', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0])
      ])

      // Process data with error handling and validation
      const todayVisits = (todayVisitsResult.status === 'fulfilled' ? todayVisitsResult.value.data : []) || []
      const validVisits = Array.isArray(todayVisits) ? todayVisits.filter(v => v && typeof v.status === 'string') : []
      const completed = validVisits.filter(v => v.status === 'completed').length
      const pending = validVisits.filter(v => ['waiting', 'in_consultation', 'services_pending'].includes(v.status)).length

      // Validate and set stats with type safety  
      const queueLength = (queueResult.status === 'fulfilled' ? queueResult.value.data?.length : 0) || 0
      const prescriptionsCount = (prescriptionsResult.status === 'fulfilled' ? prescriptionsResult.value.data?.length : 0) || 0
      const servicesCount = (servicesResult.status === 'fulfilled' ? servicesResult.value.data?.length : 0) || 0

      setStats({
        todayPatients: {
          total: Math.max(0, validVisits.length),
          completed: Math.max(0, completed),
          pending: Math.max(0, pending)
        },
        queueLength: Math.max(0, Number(queueLength) || 0),
        prescriptionsToday: Math.max(0, Number(prescriptionsCount) || 0),
        servicesAssigned: Math.max(0, Number(servicesCount) || 0),
        averageConsultationTime: 18 // Mock data
      })

      // Process queue with error handling, validation, and wait times
      const queueData = (queueResult.status === 'fulfilled' ? queueResult.value.data : []) || []
      const validQueueData = Array.isArray(queueData) ? queueData.filter(visit => 
        visit && 
        visit.id && 
        typeof visit.token_number === 'number' &&
        typeof visit.status === 'string'
      ) : []
      
      const queuePatients: QueuePatient[] = validQueueData.map(visit => {
        const checkedInTime = new Date(visit.checked_in_at || new Date())
        const now = new Date()
        const waitTime = Math.max(0, Math.floor((now.getTime() - checkedInTime.getTime()) / (1000 * 60)))
        
        return {
          id: String(visit.id),
          token_number: Number(visit.token_number) || 0,
          patient_name: visit.patients?.[0]?.full_name || 'Unknown Patient',
          patient_mobile: visit.patients?.[0]?.phone || '',
          checked_in_at: visit.checked_in_at || new Date().toISOString(),
          priority: Boolean(visit.priority),
          status: String(visit.status || 'waiting'),
          waitTime: Math.min(waitTime, 999) // Cap wait time at 999 minutes
        }
      })

      setQueue(queuePatients)

      // Log any failed queries for debugging
      const failedQueries = [
        { name: 'todayVisits', result: todayVisitsResult },
        { name: 'queue', result: queueResult },
        { name: 'prescriptions', result: prescriptionsResult },
        { name: 'services', result: servicesResult }
      ].filter(({ result }) => result.status === 'rejected')

      if (failedQueries.length > 0) {
        console.warn('Some mobile dashboard queries failed:', failedQueries.map(q => ({
          name: q.name,
          error: q.result.status === 'rejected' ? q.result.reason : null
        })))
      }

    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id]) // Fixed: Only depend on user.id, not entire user or supabase objects

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
      // Auto-refresh every 45 seconds (increased from 30s to reduce glitching)
      const interval = setInterval(() => {
        fetchDashboardData(true)
      }, 45000)
      return () => clearInterval(interval)
    }
  }, [user?.id, fetchDashboardData]) // Removed refreshing and loading dependencies to prevent infinite loop

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    return `${Math.floor(diffInMinutes / 60)} hr ago`
  }

  const startConsultation = (patientId: string) => {
    // Mock function - would navigate to consultation page
    alert(`Starting consultation for patient ${patientId}`)
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  if (error) {
    return (
      <MobileDashboardLayout
        title="Doctor Dashboard"
        subtitle="Manage consultations and patient care"
      >
        <MobileCard>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <TouchButton onClick={handleRefresh} variant="primary">
              Try Again
            </TouchButton>
          </div>
        </MobileCard>
      </MobileDashboardLayout>
    )
  }

  return (
    <MobileDashboardLayout
      title="Doctor Dashboard"
      subtitle="Manage consultations and patient care"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* Key Metrics */}
      <MobileSection title="Today's Overview">
        <MobileStatsGrid>
          <MobileMetricCard
            title="Total Patients"
            value={loading ? '---' : stats?.todayPatients.total.toString() || '0'}
            subtitle={`${stats?.todayPatients.completed || 0} completed`}
            icon={Users}
            color="blue"
            onClick={() => alert('View all patients')}
          />
          
          <MobileMetricCard
            title="Queue Length"
            value={loading ? '---' : stats?.queueLength.toString() || '0'}
            subtitle="Patients waiting"
            icon={Clock}
            color="orange"
            onClick={() => alert('View queue details')}
          />
          
          <MobileMetricCard
            title="Prescriptions"
            value={loading ? '---' : stats?.prescriptionsToday.toString() || '0'}
            subtitle="Written today"
            icon={FileText}
            color="green"
            onClick={() => alert('View prescriptions')}
          />
          
          <MobileMetricCard
            title="Procedures"
            value={loading ? '---' : stats?.servicesAssigned.toString() || '0'}
            subtitle="Assigned today"
            icon={Activity}
            color="purple"
            onClick={() => alert('View procedures')}
          />
        </MobileStatsGrid>
      </MobileSection>

      {/* Current Patient & Queue */}
      <MobileContent
        sidebar={
          <div className="space-y-4">
            {/* Performance Stats */}
            <MobileCard title="Performance" compact>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {stats?.averageConsultationTime || 0}m
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Consultation</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {stats ? Math.round((stats.todayPatients.completed / Math.max(stats.todayPatients.total, 1)) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </MobileCard>

            {/* Quick Actions */}
            <MobileCard title="Quick Actions" compact>
              <div className="space-y-2">
                <TouchButton
                  onClick={() => alert('Opening consultation workflow')}
                  variant="primary"
                  className="w-full"
                  size="sm"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Start Consultation
                </TouchButton>
                <TouchButton
                  onClick={() => alert('Opening prescription pad')}
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Write Prescription
                </TouchButton>
                <TouchButton
                  onClick={() => alert('Opening patient history')}
                  variant="default"
                  className="w-full"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Patient History
                </TouchButton>
              </div>
            </MobileCard>
          </div>
        }
      >
        {/* Patient Queue */}
        <MobileListCard
          title={`Patient Queue (${queue.length})`}
          items={loading ? [] : queue.map(patient => ({
            id: patient.id,
            primary: `Token #${patient.token_number} - ${patient.patient_name}`,
            secondary: patient.patient_mobile,
            tertiary: `Waiting: ${patient.waitTime}m ${patient.priority ? '• PRIORITY' : ''}`,
            status: patient.priority ? 'warning' : patient.status === 'in_consultation' ? 'info' : 'success',
            action: {
              label: patient.status === 'in_consultation' ? 'Resume' : 'Start',
              onClick: () => startConsultation(patient.id)
            }
          }))}
          emptyMessage={loading ? "Loading patients..." : "No patients in queue"}
          maxItems={8}
          onViewAll={() => alert('View all patients in queue')}
        />

        {/* Today's Activity Summary */}
        <MobileCard title="Today's Activity" icon={CheckCircle}>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>{stats?.todayPatients.total || 0}</strong> patients scheduled
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <strong>{stats?.todayPatients.completed || 0}</strong> consultations completed
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  <strong>{stats?.todayPatients.pending || 0}</strong> still in progress
                </span>
              </div>
              {stats?.queueLength > 0 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <Timer className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    Next patient waiting <strong>{queue[0]?.waitTime || 0}m</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </MobileCard>
      </MobileContent>
    </MobileDashboardLayout>
  )
}