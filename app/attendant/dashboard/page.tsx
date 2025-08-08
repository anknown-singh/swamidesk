'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, CheckCircle, AlertCircle, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/use-user'
import { WorkflowStatusIndicator } from '@/components/workflow/workflow-status-indicator'

interface AttendantStats {
  assignedServices: number
  inProgress: number
  completed: number
  pending: number
}

interface ServiceItem {
  id: string
  patient_name: string
  service_name: string
  status: string
  priority: boolean
  visit_id: string
}

export default function AttendantDashboard() {
  const [stats, setStats] = useState<AttendantStats | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
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

      // Fetch services assigned to this attendant today
      const servicesResult = await supabase
        .from('visit_services')
        .select(`
          id,
          status,
          visits!inner(
            id,
            priority,
            visit_date,
            patients!inner(name)
          ),
          services!inner(name)
        `)
        .eq('attendant_id', user.id)
        .eq('visits.visit_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      if (servicesResult.error) throw servicesResult.error

      const serviceData = servicesResult.data || []
      
      // Calculate stats
      const inProgressCount = serviceData.filter(s => s.status === 'in_progress').length
      const completedCount = serviceData.filter(s => s.status === 'completed').length
      const pendingCount = serviceData.length - completedCount // All non-completed are pending

      setStats({
        assignedServices: serviceData.length,
        inProgress: inProgressCount,
        completed: completedCount,
        pending: pendingCount
      })

      // Process service queue (show only non-completed services)
      const serviceItems: ServiceItem[] = serviceData
        .filter(service => service.status !== 'completed')
        .map(service => ({
          id: service.id,
          patient_name: service.visits?.[0]?.patients?.[0]?.name || 'Unknown',
          service_name: service.services?.[0]?.name || 'Unknown Service',
          status: service.status,
          priority: service.visits?.[0]?.priority || false,
          visit_id: service.visits?.[0]?.id || ''
        }))

      setServices(serviceItems.slice(0, 3))

    } catch (error) {
      console.error('Error fetching attendant dashboard data:', error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'assigned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
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
        <h1 className="text-3xl font-bold tracking-tight">Service Attendant Dashboard</h1>
        <p className="text-muted-foreground">
          Manage assigned procedures and services
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.assignedServices || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Today&apos;s assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Services completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Queue</CardTitle>
            <CardDescription>
              Services assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services assigned</p>
                ) : (
                  services.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {item.patient_name}
                          {item.priority && (
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                              Priority
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.service_name}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {formatStatus(item.status)}
                        </span>
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Service management shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Start Next Service</div>
                <div className="text-sm text-muted-foreground">Begin next assigned procedure</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Update Service Status</div>
                <div className="text-sm text-muted-foreground">Mark procedures as completed</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Service History</div>
                <div className="text-sm text-muted-foreground">Review completed procedures</div>
              </button>
              <a href="/documentation" className="text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-between">
                <div>
                  <div className="font-medium">Help & Documentation</div>
                  <div className="text-sm text-muted-foreground">Procedure guides & service workflow</div>
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

      {/* Procedure Execution Status Warning */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">⚠️ Procedure Execution Status</CardTitle>
          </div>
          <CardDescription className="text-yellow-700">
            Procedure execution workflow is 60% complete - core functionality missing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-red-800 mb-2">🔴 Missing Features:</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• Actual procedure execution workflow</li>
                  <li>• Procedure completion tracking</li>
                  <li>• Time/duration logging</li>
                  <li>• Integration with billing system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">✅ Working Features:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Service attendant dashboard</li>
                  <li>• Patient queue viewing</li>
                  <li>• Procedure assignment tracking</li>
                  <li>• Priority indicators</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded border border-yellow-200">
              <span className="text-yellow-800 font-medium">Implementation Status: 60% Complete</span>
              <a href="/documentation/todo" className="text-yellow-600 hover:text-yellow-800 underline text-sm">
                View action items →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Workflow Status */}
      <div className="mt-6">
        <WorkflowStatusIndicator compact={true} />
      </div>
    </div>
  )
}