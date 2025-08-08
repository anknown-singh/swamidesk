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
import { useUser } from '@/hooks/use-user'
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
  
  const { user } = useUser()
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

      // Simplified data fetching for mobile
      const [
        todayVisitsResult,
        queueResult,
        prescriptionsResult,
        servicesResult
      ] = await Promise.all([
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
            patients!inner(name, mobile)
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

      // Process data
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
        servicesAssigned: servicesResult.data?.length || 0,
        averageConsultationTime: 18 // Mock data
      })

      // Process queue with wait times
      const queuePatients: QueuePatient[] = queueResult.data?.map(visit => {
        const checkedInTime = new Date(visit.checked_in_at)
        const now = new Date()
        const waitTime = Math.floor((now.getTime() - checkedInTime.getTime()) / (1000 * 60))
        
        return {
          id: visit.id,
          token_number: visit.token_number,
          patient_name: visit.patients?.[0]?.name || 'Unknown',
          patient_mobile: visit.patients?.[0]?.mobile || '',
          checked_in_at: visit.checked_in_at,
          priority: visit.priority,
          status: visit.status,
          waitTime
        }
      }) || []

      setQueue(queuePatients)

    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => fetchDashboardData(true), 30000)
      return () => clearInterval(interval)
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