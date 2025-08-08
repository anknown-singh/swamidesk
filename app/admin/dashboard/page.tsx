'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, TrendingUp, UserCheck, Package, BarChart3, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { VersionInfo } from '@/components/admin/version-info'
import { ReleaseNotes } from '@/components/admin/release-notes'
import { WorkflowStatusIndicator } from '@/components/workflow/workflow-status-indicator'
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
}

interface DepartmentStats {
  department: string
  patientCount: number
  revenue: number
  growth: number
}

interface RecentActivity {
  id: string
  activity: string
  type: string
  created_at: string
  user_name?: string
  amount?: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [departments, setDepartments] = useState<DepartmentStats[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        patientsResult,
        todayRevenueResult,
        yesterdayRevenueResult,
        staffResult,
        lastMonthPatientsResult,
        departmentsResult,
        activitiesResult
      ] = await Promise.all([
        // Total patients
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        
        // Today's revenue
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Yesterday's revenue
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lt('created_at', new Date().toISOString().split('T')[0]),
        
        // Active staff by role
        supabase
          .from('users')
          .select('role')
          .eq('is_active', true),
        
        // Last month patients for growth calculation
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Department performance today
        supabase
          .from('visits')
          .select(`
            department,
            invoices!inner(total_amount)
          `)
          .gte('visit_date', new Date().toISOString().split('T')[0])
          .lt('visit_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Recent activities (from invoices, prescriptions, etc.)
        supabase
          .from('invoices')
          .select(`
            id,
            total_amount,
            created_at,
            visits!inner(
              patients!inner(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Process results
      const totalPatients = patientsResult.count || 0
      const todayRevenue = todayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      const yesterdayRevenue = yesterdayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      
      // Staff counts
      const staffData = staffResult.data || []
      const doctors = staffData.filter(s => s.role === 'doctor').length
      const totalStaff = staffData.length
      
      // Growth calculation
      const lastMonthPatients = lastMonthPatientsResult.count || 0
      const monthlyGrowth = lastMonthPatients > 0 
        ? Math.round(((totalPatients - lastMonthPatients) / lastMonthPatients) * 100)
        : 0

      setStats({
        totalPatients,
        todayRevenue,
        yesterdayRevenue,
        activeStaff: {
          total: totalStaff,
          doctors,
          others: totalStaff - doctors
        },
        monthlyGrowth
      })

      // Process department data
      const deptMap = new Map<string, { patients: number, revenue: number }>()
      departmentsResult.data?.forEach(visit => {
        const dept = visit.department || 'General'
        const current = deptMap.get(dept) || { patients: 0, revenue: 0 }
        deptMap.set(dept, {
          patients: current.patients + 1,
          revenue: current.revenue + (visit.invoices?.[0]?.total_amount || 0)
        })
      })

      const departmentStats: DepartmentStats[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
        department: dept,
        patientCount: data.patients,
        revenue: data.revenue,
        growth: Math.floor(Math.random() * 20) - 5 // Random growth for demo
      }))

      setDepartments(departmentStats.slice(0, 3))

      // Process recent activities
      const recentActivities: RecentActivity[] = activitiesResult.data?.map(invoice => ({
        id: invoice.id,
        activity: `Invoice generated for ${invoice.visits?.[0]?.patients?.[0]?.name || 'Patient'} - ₹${invoice.total_amount?.toLocaleString()}`,
        type: 'billing',
        created_at: invoice.created_at,
        amount: invoice.total_amount
      })) || []

      setActivities(recentActivities)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Complete clinic management and analytics overview - Dynamic Data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalPatients.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                `${(stats?.monthlyGrowth ?? 0) >= 0 ? '+' : ''}${stats?.monthlyGrowth ?? 0}% from last month`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                `${getGrowthText(stats?.todayRevenue || 0, stats?.yesterdayRevenue || 0)} from yesterday`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeStaff.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 w-28" />
              ) : (
                `${stats?.activeStaff.doctors} doctors, ${stats?.activeStaff.others} staff`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.monthlyGrowth ?? 0) >= 0 ? '+' : ''}{stats?.monthlyGrowth ?? 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Patient visits growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkflowStatusIndicator />
        </div>
        <div>
          <WorkflowStatusIndicator compact={true} showDetails={false} />
        </div>
      </div>

      {/* Department Performance & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Today&apos;s activity by department</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No department data for today</p>
                ) : (
                  departments.map((dept) => (
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
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  ) : (
                    activities.map((activity) => (
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
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <VersionInfo />
        </div>
      </div>

      {/* Release Notes Section */}
      <div className="mt-6">
        <ReleaseNotes />
      </div>
    </div>
  )
}