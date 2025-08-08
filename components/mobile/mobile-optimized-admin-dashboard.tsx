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
import { Button } from '@/components/ui/button'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  UserCheck, 
  Activity, 
  Package,
  AlertTriangle,
  BarChart3,
  Download,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalPatients: number
  todayRevenue: number
  yesterdayRevenue: number
  activeStaff: {
    total: number
    doctors: number
    others: number
  }
  monthlyGrowth: number
  todayPatients: number
  pendingTasks: number
  systemHealth: 'good' | 'warning' | 'critical'
}

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  color: string
  onClick: () => void
}

interface RecentActivity {
  id: string
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info' | 'error'
}

export function MobileOptimizedAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Simulate API calls with simplified data structure
      const [
        patientsResult,
        todayRevenueResult,
        yesterdayRevenueResult,
        staffResult
      ] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]),
        supabase
          .from('users')
          .select('role')
          .eq('is_active', true)
      ])

      // Process results
      const totalPatients = patientsResult.count || 0
      const todayRevenue = todayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      const yesterdayRevenue = yesterdayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      
      const staffData = staffResult.data || []
      const doctors = staffData.filter(s => s.role === 'doctor').length
      const totalStaff = staffData.length
      
      // Calculate growth
      const monthlyGrowth = Math.floor(Math.random() * 20) - 5 // Simplified for demo

      setStats({
        totalPatients,
        todayRevenue,
        yesterdayRevenue,
        activeStaff: {
          total: totalStaff,
          doctors,
          others: totalStaff - doctors
        },
        monthlyGrowth,
        todayPatients: Math.floor(Math.random() * 50) + 10,
        pendingTasks: Math.floor(Math.random() * 10) + 2,
        systemHealth: 'good'
      })

      // Mock recent activities
      setActivities([
        {
          id: '1',
          title: 'New Patient Registration',
          description: 'Rajesh Kumar registered for consultation',
          time: '5 min ago',
          type: 'success'
        },
        {
          id: '2',
          title: 'Payment Received',
          description: 'Invoice #INV-2024-001 paid - ₹2,500',
          time: '12 min ago',
          type: 'success'
        },
        {
          id: '3',
          title: 'Low Stock Alert',
          description: 'Paracetamol running low (5 units remaining)',
          time: '25 min ago',
          type: 'warning'
        },
        {
          id: '4',
          title: 'System Backup',
          description: 'Daily backup completed successfully',
          time: '1 hr ago',
          type: 'info'
        }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const getGrowthText = (current: number, previous: number) => {
    if (previous === 0) return '+0%'
    const growth = Math.round(((current - previous) / previous) * 100)
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${growth}%`
  }

  const quickActions: QuickAction[] = [
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      color: 'blue',
      onClick: () => window.location.href = '/admin/analytics'
    },
    {
      id: 'users',
      label: 'Users',
      description: 'Manage staff accounts',
      icon: UserCheck,
      color: 'green',
      onClick: () => window.location.href = '/admin/users'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      description: 'Check stock levels',
      icon: Package,
      color: 'purple',
      onClick: () => window.location.href = '/admin/inventory'
    },
    {
      id: 'export',
      label: 'Export',
      description: 'Download reports',
      icon: Download,
      color: 'orange',
      onClick: () => alert('Export feature coming soon!')
    }
  ]

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  if (error) {
    return (
      <MobileDashboardLayout
        title="Admin Dashboard"
        subtitle="Complete clinic management overview"
      >
        <MobileCard>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </MobileCard>
      </MobileDashboardLayout>
    )
  }

  return (
    <MobileDashboardLayout
      title="Admin Dashboard"
      subtitle="Complete clinic management overview"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/analytics'}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      }
    >
      {/* Key Metrics */}
      <MobileSection title="Key Metrics">
        <MobileStatsGrid>
          <MobileMetricCard
            title="Total Patients"
            value={loading ? '---' : stats?.totalPatients.toLocaleString() || '0'}
            subtitle="All time"
            icon={Users}
            color="blue"
            trend={stats ? {
              value: `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}%`,
              positive: stats.monthlyGrowth >= 0
            } : undefined}
            onClick={() => window.location.href = '/admin/users'}
          />
          
          <MobileMetricCard
            title="Today's Revenue"
            value={loading ? '---' : formatCurrency(stats?.todayRevenue || 0)}
            subtitle="Today"
            icon={CreditCard}
            color="green"
            trend={stats ? {
              value: getGrowthText(stats.todayRevenue, stats.yesterdayRevenue),
              positive: stats.todayRevenue >= stats.yesterdayRevenue
            } : undefined}
          />
          
          <MobileMetricCard
            title="Active Staff"
            value={loading ? '---' : stats?.activeStaff.total.toString() || '0'}
            subtitle={`${stats?.activeStaff.doctors || 0} doctors`}
            icon={UserCheck}
            color="purple"
          />
          
          <MobileMetricCard
            title="Growth Rate"
            value={loading ? '---' : `${stats?.monthlyGrowth >= 0 ? '+' : ''}${stats?.monthlyGrowth || 0}%`}
            subtitle="This month"
            icon={TrendingUp}
            color={stats && stats.monthlyGrowth >= 0 ? 'green' : 'red'}
          />
        </MobileStatsGrid>
      </MobileSection>

      <MobileContent
        sidebar={
          <div className="space-y-4">
            {/* System Status */}
            <MobileCard title="System Status" icon={Activity} compact>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">API Services</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm">Backup System</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Running</span>
                </div>
              </div>
            </MobileCard>

            {/* Quick Actions */}
            <MobileCard title="Quick Actions" compact>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors active:scale-95"
                    >
                      <Icon className="h-5 w-5 text-blue-600 mb-2" />
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </button>
                  )
                })}
              </div>
            </MobileCard>
          </div>
        }
      >
        {/* Recent Activity */}
        <MobileListCard
          title="Recent Activity"
          items={loading ? [] : activities.map(activity => ({
            id: activity.id,
            primary: activity.title,
            secondary: activity.description,
            tertiary: activity.time,
            status: activity.type
          }))}
          emptyMessage="No recent activity"
          maxItems={4}
          onViewAll={() => alert('View all activity coming soon!')}
        />

        {/* Today's Overview */}
        <MobileCard title="Today's Overview" icon={Clock}>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {stats?.todayPatients || 0}
                </div>
                <div className="text-xs text-muted-foreground">Patients</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(stats?.todayRevenue || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {stats?.pendingTasks || 0}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          )}
        </MobileCard>

        {/* Performance Highlights */}
        <MobileCard title="Performance Highlights" icon={CheckCircle}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">High patient satisfaction rate</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Revenue growth this month</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm">System performing optimally</span>
            </div>
          </div>
        </MobileCard>
      </MobileContent>
    </MobileDashboardLayout>
  )
}