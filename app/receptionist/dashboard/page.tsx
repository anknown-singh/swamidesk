'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, Calendar, CreditCard, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

interface ReceptionistStats {
  todayPatients: number
  queueLength: number
  appointments: number
  todayRevenue: number
  yesterdayPatients: number
}

interface DepartmentQueue {
  department: string
  waiting: number
}

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState<ReceptionistStats | null>(null)
  const [departments, setDepartments] = useState<DepartmentQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        todayVisitsResult,
        queueResult,
        todayRevenueResult,
        yesterdayVisitsResult,
        departmentQueueResult
      ] = await Promise.all([
        // Today's total visits
        supabase
          .from('visits')
          .select('id', { count: 'exact', head: true })
          .eq('visit_date', new Date().toISOString().split('T')[0]),
        
        // Current queue length
        supabase
          .from('visits')
          .select('id', { count: 'exact', head: true })
          .eq('visit_date', new Date().toISOString().split('T')[0])
          .in('status', ['waiting', 'in_consultation']),
        
        // Today's revenue
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Yesterday's visits for growth calculation
        supabase
          .from('visits')
          .select('id', { count: 'exact', head: true })
          .eq('visit_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Queue by doctor (since department column doesn't exist)
        supabase
          .from('visits')
          .select('doctor_id, users!visits_doctor_id_fkey(full_name)')
          .eq('visit_date', new Date().toISOString().split('T')[0])
          .in('status', ['waiting', 'in_consultation'])
      ])

      // Process results with null safety
      const todayPatients = todayVisitsResult?.count ?? 0
      const yesterdayPatients = yesterdayVisitsResult?.count ?? 0
      const queueLength = queueResult?.count ?? 0
      const todayRevenue = todayRevenueResult?.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) ?? 0

      setStats({
        todayPatients,
        queueLength,
        appointments: todayPatients, // Using visits as appointments for now
        todayRevenue,
        yesterdayPatients
      })

      // Process doctor queue data (since department column doesn't exist)
      const doctorMap = new Map<string, number>()
      departmentQueueResult.data?.forEach(visit => {
        const doctorName = visit.users?.full_name || 'Unassigned'
        doctorMap.set(doctorName, (doctorMap.get(doctorName) || 0) + 1)
      })

      const departmentQueues: DepartmentQueue[] = Array.from(doctorMap.entries()).map(([doctor, count]) => ({
        department: `Dr. ${doctor}`,
        waiting: count
      }))

      setDepartments(departmentQueues.slice(0, 3))

    } catch (error) {
      console.error('Error fetching receptionist dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    document.title = 'Receptionist Dashboard - SwamiCare'
  }, [])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const getGrowthText = (today: number, yesterday: number) => {
    if (yesterday === 0) return '+0%'
    const growth = Math.round(((today - yesterday) / yesterday) * 100)
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${growth}%`
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
        <h1 className="text-3xl font-bold tracking-tight">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">
          Manage patient registration and queue operations
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
              <div className="text-2xl font-bold">{stats?.todayPatients || 0}</div>
            )}
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                `${getGrowthText(stats?.todayPatients || 0, stats?.yesterdayPatients || 0)} from yesterday`
              )}
            </div>
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
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.appointments || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Scheduled today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Today&apos;s collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for patient management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Register New Patient</div>
                <div className="text-sm text-muted-foreground">Add patient details and generate OPD token</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Search Existing Patient</div>
                <div className="text-sm text-muted-foreground">Find and update patient information</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Queue Status</div>
                <div className="text-sm text-muted-foreground">Monitor doctor queues and waiting times</div>
              </button>
              <a href="/documentation" className="text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-between">
                <div>
                  <div className="font-medium">Help & Documentation</div>
                  <div className="text-sm text-muted-foreground">Registration guides & queue management</div>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <ExternalLink className="h-3 w-3 text-amber-600" />
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor Queue</CardTitle>
            <CardDescription>
              Current waiting patients by doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {departments.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No patients currently waiting</p>
                    <p className="text-xs text-muted-foreground">Queue will update automatically</p>
                  </div>
                ) : (
                  departments.map((dept) => {
                    const colors = ['blue', 'green', 'purple', 'orange', 'red']
                    const colorIndex = Math.abs(dept.department.charCodeAt(0)) % colors.length
                    const color = colors[colorIndex]
                    
                    return (
                      <div key={dept.department} className="flex justify-between items-center">
                        <span className="font-medium">{dept.department}</span>
                        <span className={`bg-${color}-100 text-${color}-800 px-2 py-1 rounded-full text-sm`}>
                          {dept.waiting} waiting
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}