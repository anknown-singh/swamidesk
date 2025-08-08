'use client'

import React, { Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, TrendingUp, UserCheck, Package, BarChart3, BookOpen, ExternalLink } from 'lucide-react'
import { 
  DashboardSkeleton, 
  MetricCardSkeleton, 
  SkeletonCard, 
  ProgressiveLoading,
  RefreshButton,
  ErrorState,
  LazyLoad
} from '@/components/ui/enhanced-loading'
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/error/error-boundary'
import { 
  useDashboardStats, 
  useDepartmentStats, 
  useRecentActivities,
  useCacheManagement 
} from '@/hooks/use-dashboard-data'
import { useEffect, useState, useCallback } from 'react'

// Lazy load heavy components
const VersionInfo = lazy(() => import('@/components/admin/version-info').then(module => ({
  default: module.VersionInfo
})))

const ReleaseNotes = lazy(() => import('@/components/admin/release-notes').then(module => ({
  default: module.ReleaseNotes
})))

const WorkflowStatusIndicator = lazy(() => import('@/components/workflow/workflow-status-indicator').then(module => ({
  default: module.WorkflowStatusIndicator
})))

// Memoized metric card component for better performance
const MetricCard = React.memo(function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  isLoading = false
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<any>
  isLoading?: boolean
}) {
  if (isLoading) {
    return <MetricCardSkeleton />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
})

// Memoized department performance component
const DepartmentPerformance = React.memo(function DepartmentPerformance() {
  const { departments, loading, error, refresh } = useDepartmentStats()

  const formatCurrency = useCallback((amount: number) => {
    return `₹${amount.toLocaleString()}`
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Today's activity by department</CardDescription>
        </div>
        <RefreshButton 
          onRefresh={refresh} 
          isRefreshing={loading}
          size="sm"
        />
      </CardHeader>
      <CardContent>
        <ProgressiveLoading
          isLoading={loading}
          hasData={departments.length > 0}
          fallback={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          }
          emptyState={
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No department data for today</p>
            </div>
          }
        >
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.department} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{dept.department} Department</div>
                  <div className="text-sm text-muted-foreground">
                    {dept.patientCount} patients • {formatCurrency(dept.revenue)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${dept.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dept.growth >= 0 ? '+' : ''}{dept.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ProgressiveLoading>
        
        {error && (
          <ErrorState
            message={error}
            onRetry={refresh}
            className="py-4"
          />
        )}
      </CardContent>
    </Card>
  )
})

// Memoized recent activities component
const RecentActivities = React.memo(function RecentActivities() {
  const { activities, loading, error, refresh } = useRecentActivities(5)

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and transactions</CardDescription>
        </div>
        <RefreshButton 
          onRefresh={refresh} 
          isRefreshing={loading}
          size="sm"
        />
      </CardHeader>
      <CardContent>
        <ProgressiveLoading
          isLoading={loading}
          hasData={activities.length > 0}
          fallback={
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          }
          emptyState={
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No recent activities</p>
            </div>
          }
        >
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-2">
                <div className="bg-gray-100 p-2 rounded-full">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.activity}</div>
                  <div className="text-xs text-muted-foreground">
                    {getTimeAgo(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ProgressiveLoading>

        {error && (
          <ErrorState
            message={error}
            onRetry={refresh}
            className="py-4"
          />
        )}
      </CardContent>
    </Card>
  )
})

export default function OptimizedAdminDashboard() {
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useDashboardStats()
  const { clearCache, getCacheStats } = useCacheManagement()
  const [isMobile, setIsMobile] = useState(false)
  const [showCacheStats, setShowCacheStats] = useState(false)

  // Mobile detection with debouncing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 100)
    }
    
    checkMobile()
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return `₹${amount.toLocaleString()}`
  }, [])

  const getGrowthText = useCallback((current: number, previous: number) => {
    if (previous === 0) return '+0%'
    const growth = Math.round(((current - previous) / previous) * 100)
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${growth}%`
  }, [])

  const refreshAllData = useCallback(() => {
    refreshStats()
    clearCache()
  }, [refreshStats, clearCache])

  // Mobile optimization - use mobile component if screen is small
  if (isMobile) {
    return (
      <AsyncErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          {React.lazy(() => import('@/components/mobile/mobile-optimized-admin-dashboard').then(module => ({
            default: module.MobileOptimizedAdminDashboard
          })))}
        </Suspense>
      </AsyncErrorBoundary>
    )
  }

  if (statsError) {
    return (
      <ErrorState
        title="Dashboard Error"
        message={statsError}
        onRetry={refreshStats}
        className="min-h-[400px] flex items-center justify-center"
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete clinic management and analytics overview - Optimized Performance
            </p>
          </div>
          <div className="flex gap-2">
            <RefreshButton 
              onRefresh={refreshAllData} 
              isRefreshing={statsLoading}
            >
              Refresh All
            </RefreshButton>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowCacheStats(!showCacheStats)}
                className="px-3 py-2 text-xs border rounded-md hover:bg-gray-50"
              >
                Cache Stats
              </button>
            )}
          </div>
        </div>

        {/* Development cache stats */}
        {showCacheStats && process.env.NODE_ENV === 'development' && (
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">Cache Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {Object.entries(getCacheStats()).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            subtitle={`${(stats?.monthlyGrowth ?? 0) >= 0 ? '+' : ''}${stats?.monthlyGrowth ?? 0}% from last month`}
            icon={Users}
            isLoading={statsLoading}
          />
          
          <MetricCard
            title="Today's Revenue"
            value={formatCurrency(stats?.todayRevenue || 0)}
            subtitle={`${getGrowthText(stats?.todayRevenue || 0, stats?.yesterdayRevenue || 0)} from yesterday`}
            icon={CreditCard}
            isLoading={statsLoading}
          />
          
          <MetricCard
            title="Active Staff"
            value={stats?.activeStaff.total || 0}
            subtitle={`${stats?.activeStaff.doctors || 0} doctors, ${stats?.activeStaff.others || 0} staff`}
            icon={UserCheck}
            isLoading={statsLoading}
          />
          
          <MetricCard
            title="Monthly Growth"
            value={`${(stats?.monthlyGrowth ?? 0) >= 0 ? '+' : ''}${stats?.monthlyGrowth ?? 0}%`}
            subtitle="Patient visits growth"
            icon={TrendingUp}
            isLoading={statsLoading}
          />
        </div>

        {/* Workflow Status - Lazy loaded */}
        <LazyLoad
          fallback={<SkeletonCard className="h-32" />}
          threshold={0.2}
        >
          <AsyncErrorBoundary>
            <Suspense fallback={<SkeletonCard className="h-32" />}>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <WorkflowStatusIndicator />
                </div>
                <div>
                  <WorkflowStatusIndicator compact={true} showDetails={false} />
                </div>
              </div>
            </Suspense>
          </AsyncErrorBoundary>
        </LazyLoad>

        {/* Department Performance & Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AsyncErrorBoundary>
            <DepartmentPerformance />
          </AsyncErrorBoundary>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Real-time system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Authentication</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Backup System</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Running</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">API Services</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Synchronized</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Administrative shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Generate Reports</div>
                    <div className="text-sm text-muted-foreground">Financial & operational reports</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-muted-foreground">Add/edit staff accounts</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Inventory Alerts</div>
                    <div className="text-sm text-muted-foreground">View low stock items</div>
                  </div>
                </div>
              </button>
              <a href="/admin/documentation" className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors block">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Help & Documentation</div>
                    <div className="text-sm text-muted-foreground">System guides & release notes</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-amber-600 ml-auto" />
                </div>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & System Info */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AsyncErrorBoundary>
              <RecentActivities />
            </AsyncErrorBoundary>
          </div>
          
          <div className="space-y-6">
            <LazyLoad
              fallback={<SkeletonCard className="h-48" />}
              threshold={0.1}
            >
              <AsyncErrorBoundary>
                <Suspense fallback={<SkeletonCard className="h-48" />}>
                  <VersionInfo />
                </Suspense>
              </AsyncErrorBoundary>
            </LazyLoad>
          </div>
        </div>

        {/* Release Notes Section - Lazy loaded */}
        <LazyLoad
          fallback={<SkeletonCard className="h-64" />}
          threshold={0.1}
        >
          <AsyncErrorBoundary>
            <Suspense fallback={<SkeletonCard className="h-64" />}>
              <ReleaseNotes />
            </Suspense>
          </AsyncErrorBoundary>
        </LazyLoad>
      </div>
    </ErrorBoundary>
  )
}