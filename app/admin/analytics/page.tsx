'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RevenueForecasting } from '@/components/analytics/revenue-forecasting'
import { PatientFlowAnalytics } from '@/components/analytics/patient-flow-analytics'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  Users, 
  DollarSign, 
  Activity, 
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Clock
} from 'lucide-react'

interface DashboardOverview {
  totalRevenue: number
  totalPatients: number
  averageBillAmount: number
  completionRate: number
  noShowRate: number
  growthRate: number
  peakHours: string[]
  topServices: Array<{
    name: string
    count: number
    revenue: number
  }>
  departmentPerformance: Array<{
    department: string
    patients: number
    revenue: number
    efficiency: number
  }>
  weeklyTrends: Array<{
    week: string
    patients: number
    revenue: number
  }>
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  // const [isMobile, setIsMobile] = useState(false)
  // const [timeRange, setTimeRange] = useState('30')

  // Check if mobile (disabled for now)
  // useEffect(() => {
  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth < 1024)
  //   }
  //   checkMobile()
  //   window.addEventListener('resize', checkMobile)
  //   return () => window.removeEventListener('resize', checkMobile)
  // }, [])

  useEffect(() => {
    fetchDashboardOverview()
  }, [])

  const fetchDashboardOverview = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createAuthenticatedClient()
      
      // Get date ranges
      const now = new Date()
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      // Fetch revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('invoices')
        .select('total_amount, created_at, bill_items')
        .eq('payment_status', 'completed')
        .gte('created_at', last60Days.toISOString())

      if (revenueError) throw revenueError

      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('opd_records')
        .select(`
          created_at,
          opd_status,
          patient_id,
          consultation_completed_at,
          procedures_completed_at,
          pharmacy_completed_at
        `)
        .gte('created_at', last30Days.toISOString())

      if (patientError) throw patientError

      // Fetch appointment data for no-show analysis
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('status, created_at')
        .gte('created_at', last30Days.toISOString())

      if (appointmentError) throw appointmentError

      // Fetch service data
      const { data: serviceData, error: serviceError } = await supabase
        .from('visit_services')
        .select(`
          service_id,
          status,
          total_price,
          created_at,
          services(name, category)
        `)
        .gte('created_at', last30Days.toISOString())
        .eq('status', 'completed')

      if (serviceError) throw serviceError

      // Process overview data
      const processedOverview = processOverviewData(
        revenueData || [],
        patientData || [],
        appointmentData || [],
        serviceData || []
      )

      setOverview(processedOverview)

    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      setError('Failed to load analytics dashboard')
    } finally {
      setLoading(false)
    }
  }

  const processOverviewData = (
    revenueData: Array<{ 
      created_at: string; 
      total_amount: number; 
      bill_items?: Array<{ category: string; total: number }> 
    }>,
    patientData: Array<{ 
      created_at: string; 
      opd_status?: string; 
      procedures_completed_at?: string;
      pharmacy_completed_at?: string;
    }>,
    appointmentData: Array<{ created_at: string; status: string }>,
    serviceData: Array<{ 
      service_id: string; 
      status: string; 
      total_price: number; 
      created_at: string; 
      services: { name: string; category: string } | { name: string; category: string }[] | null 
    }>
  ): DashboardOverview => {
    
    // Calculate revenue metrics
    const last30DaysRevenue = revenueData
      .filter(r => new Date(r.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const previous30DaysRevenue = revenueData
      .filter(r => {
        const date = new Date(r.created_at)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        return date >= sixtyDaysAgo && date < thirtyDaysAgo
      })
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const growthRate = previous30DaysRevenue > 0 
      ? ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100 
      : 0

    // Calculate patient metrics
    const totalPatients = patientData.length
    const completedPatients = patientData.filter(p => 
      p.opd_status === 'completed' || p.opd_status === 'billed'
    ).length
    const completionRate = totalPatients > 0 ? (completedPatients / totalPatients) * 100 : 0

    // Calculate no-show rate
    const noShows = appointmentData.filter(a => a.status === 'no_show').length
    const noShowRate = appointmentData.length > 0 ? (noShows / appointmentData.length) * 100 : 0

    // Calculate average bill amount
    const last30DaysInvoices = revenueData.filter(r => 
      new Date(r.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const averageBillAmount = last30DaysInvoices.length > 0 
      ? last30DaysRevenue / last30DaysInvoices.length 
      : 0

    // Identify peak hours
    const hourlyActivity: { [hour: number]: number } = {}
    patientData.forEach(patient => {
      const hour = new Date(patient.created_at).getHours()
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
    })

    const peakHours = Object.entries(hourlyActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    // Top services by revenue
    const serviceRevenue: { [serviceName: string]: { count: number; revenue: number } } = {}
    serviceData.forEach(service => {
      const services = service.services
      const serviceName = Array.isArray(services) 
        ? services[0]?.name || 'Unknown Service'
        : services?.name || 'Unknown Service'
      if (!serviceRevenue[serviceName]) {
        serviceRevenue[serviceName] = { count: 0, revenue: 0 }
      }
      serviceRevenue[serviceName].count++
      serviceRevenue[serviceName].revenue += service.total_price || 0
    })

    const topServices = Object.entries(serviceRevenue)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue
      }))

    // Department performance
    const departments: { [dept: string]: { patients: number; revenue: number } } = {
      'General Medicine': { patients: 0, revenue: 0 },
      'Procedures': { patients: 0, revenue: 0 },
      'Pharmacy': { patients: 0, revenue: 0 }
    }

    // Simplified department calculation
    patientData.forEach(patient => {
      departments['General Medicine']!.patients++
      if (patient.procedures_completed_at) {
        departments['Procedures']!.patients++
      }
      if (patient.pharmacy_completed_at) {
        departments['Pharmacy']!.patients++
      }
    })

    // Add revenue to departments (simplified)
    revenueData
      .filter(r => new Date(r.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .forEach(invoice => {
        if (invoice.bill_items && Array.isArray(invoice.bill_items)) {
          invoice.bill_items.forEach((item: { category: string; total: number }) => {
            switch (item.category) {
              case 'consultation':
                departments['General Medicine']!.revenue += item.total || 0
                break
              case 'procedure':
                departments['Procedures']!.revenue += item.total || 0
                break
              case 'medicine':
                departments['Pharmacy']!.revenue += item.total || 0
                break
            }
          })
        }
      })

    const departmentPerformance = Object.entries(departments).map(([department, data]) => ({
      department,
      patients: data.patients,
      revenue: data.revenue,
      efficiency: data.patients > 0 ? data.revenue / data.patients : 0
    }))

    // Weekly trends (simplified)
    const weeklyTrends = Array.from({ length: 4 }, (_, index) => {
      const weekStart = new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000)
      
      const weekPatients = patientData.filter(p => {
        const date = new Date(p.created_at)
        return date >= weekStart && date < weekEnd
      }).length

      const weekRevenue = revenueData.filter(r => {
        const date = new Date(r.created_at)
        return date >= weekStart && date < weekEnd
      }).reduce((sum, r) => sum + (r.total_amount || 0), 0)

      return {
        week: `Week ${index + 1}`,
        patients: weekPatients,
        revenue: weekRevenue
      }
    }).reverse()

    return {
      totalRevenue: last30DaysRevenue,
      totalPatients,
      averageBillAmount,
      completionRate,
      noShowRate,
      growthRate,
      peakHours,
      topServices,
      departmentPerformance,
      weeklyTrends
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardOverview()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  const exportAnalytics = () => {
    // Placeholder for export functionality
    console.log('Exporting analytics data...')
  }

  // Mobile optimization - use mobile component if screen is small
  // TODO: Implement mobile analytics component
  // if (isMobile) {
  //   return <div>Mobile analytics view coming soon</div>
  // }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading comprehensive analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Forecasting</TabsTrigger>
          <TabsTrigger value="patient-flow">Patient Flow</TabsTrigger>
          <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overview && (
            <>
              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(overview.totalRevenue)}
                    </div>
                    <p className={`text-xs ${overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.growthRate >= 0 ? '+' : ''}{overview.growthRate.toFixed(1)}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{overview.totalPatients}</div>
                    <p className="text-xs text-muted-foreground">last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
                    <Target className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(overview.averageBillAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">per patient</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {overview.completionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">patient journey completion</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {overview.noShowRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">missed appointments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
                    <Clock className="h-4 w-4 text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-indigo-600">
                      {overview.peakHours[0]}
                    </div>
                    <p className="text-xs text-muted-foreground">busiest time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Department Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Revenue and patient volume by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {overview.departmentPerformance.map((dept, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg">{dept.department}</h3>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Patients:</span>
                            <span className="font-medium">{dept.patients}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue:</span>
                            <span className="font-medium">{formatCurrency(dept.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue/Patient:</span>
                            <span className="font-medium">{formatCurrency(dept.efficiency)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Revenue Generating Services</CardTitle>
                  <CardDescription>Most profitable services in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overview.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">{service.count} procedures completed</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(service.revenue)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(service.revenue / service.count)} avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Performance Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview.growthRate > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Badge variant="default">Growth</Badge>
                        <span className="text-sm">Revenue growing at {overview.growthRate.toFixed(1)}%</span>
                      </div>
                    )}
                    {overview.completionRate > 85 && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Badge variant="default">Efficiency</Badge>
                        <span className="text-sm">High completion rate ({overview.completionRate.toFixed(1)}%)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Badge variant="secondary">Peak Time</Badge>
                      <span className="text-sm">Busiest hours: {overview.peakHours.join(', ')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview.noShowRate > 10 && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <Badge variant="destructive">No-Shows</Badge>
                        <span className="text-sm">{overview.noShowRate.toFixed(1)}% no-show rate needs attention</span>
                      </div>
                    )}
                    {overview.completionRate < 80 && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <Badge variant="destructive">Completion</Badge>
                        <span className="text-sm">Patient journey completion rate low</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <Badge variant="secondary">Opportunity</Badge>
                      <span className="text-sm">Consider expanding high-revenue services</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueForecasting />
        </TabsContent>

        <TabsContent value="patient-flow">
          <PatientFlowAnalytics />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics Reports</CardTitle>
              <CardDescription>Comprehensive business intelligence reports and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-32 flex-col p-6">
                  <BarChart3 className="h-8 w-8 mb-2 text-blue-500" />
                  <span className="font-medium">Revenue Deep Dive</span>
                  <span className="text-xs text-muted-foreground">Detailed revenue analysis</span>
                </Button>
                
                <Button variant="outline" className="h-32 flex-col p-6">
                  <PieChart className="h-8 w-8 mb-2 text-green-500" />
                  <span className="font-medium">Service Mix Analysis</span>
                  <span className="text-xs text-muted-foreground">Service portfolio insights</span>
                </Button>
                
                <Button variant="outline" className="h-32 flex-col p-6">
                  <LineChart className="h-8 w-8 mb-2 text-purple-500" />
                  <span className="font-medium">Trend Analysis</span>
                  <span className="text-xs text-muted-foreground">Long-term trend insights</span>
                </Button>
                
                <Button variant="outline" className="h-32 flex-col p-6">
                  <Users className="h-8 w-8 mb-2 text-orange-500" />
                  <span className="font-medium">Patient Demographics</span>
                  <span className="text-xs text-muted-foreground">Patient analysis report</span>
                </Button>
                
                <Button variant="outline" className="h-32 flex-col p-6">
                  <Activity className="h-8 w-8 mb-2 text-red-500" />
                  <span className="font-medium">Operational Efficiency</span>
                  <span className="text-xs text-muted-foreground">Workflow optimization</span>
                </Button>
                
                <Button variant="outline" className="h-32 flex-col p-6">
                  <Calendar className="h-8 w-8 mb-2 text-indigo-500" />
                  <span className="font-medium">Seasonal Analysis</span>
                  <span className="text-xs text-muted-foreground">Seasonal trends report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}