'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntegratedBilling } from '@/components/billing/integrated-billing'
import { BillingAnalytics } from '@/components/billing/billing-analytics'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react'

interface DashboardStats {
  todayRevenue: number
  todayBills: number
  pendingBills: number
  overduePayments: number
  totalPatients: number
  averageBillAmount: number
  monthlyRevenue: number
  revenueGrowth: number
}

export default function BillingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayBills: 0,
    pendingBills: 0,
    overduePayments: 0,
    totalPatients: 0,
    averageBillAmount: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchDashboardStats()
  }, [refreshTrigger])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createAuthenticatedClient()
      
      // Get today's date range
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)
      
      // Get this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      // Get last month's date range for growth calculation
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

      // Fetch today's invoices
      const { data: todayInvoices, error: todayError } = await supabase
        .from('invoices')
        .select('total_amount, payment_status')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString())

      if (todayError) throw todayError

      // Fetch this month's invoices
      const { data: monthInvoices, error: monthError } = await supabase
        .from('invoices')
        .select('total_amount, payment_status')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      if (monthError) throw monthError

      // Fetch last month's revenue for growth calculation
      const { data: lastMonthInvoices, error: lastMonthError } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('payment_status', 'completed')

      if (lastMonthError) throw lastMonthError

      // Fetch pending and overdue bills
      const { data: pendingInvoices, error: pendingError } = await supabase
        .from('invoices')
        .select('total_amount, due_date, payment_status')
        .in('payment_status', ['pending', 'partially_paid'])

      if (pendingError) throw pendingError

      // Fetch billable patients count (completed consultations)
      const { data: billablePatients, error: patientsError } = await supabase
        .from('opd_records')
        .select('patient_id')
        .eq('opd_status', 'completed')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString())

      if (patientsError) throw patientsError

      // Calculate stats
      const todayPaidInvoices = todayInvoices?.filter(inv => inv.payment_status === 'completed') || []
      const todayRevenue = todayPaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      const monthPaidInvoices = monthInvoices?.filter(inv => inv.payment_status === 'completed') || []
      const monthlyRevenue = monthPaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      const lastMonthRevenue = lastMonthInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
      
      const pendingBills = pendingInvoices?.length || 0
      const overduePayments = pendingInvoices?.filter(inv => 
        new Date(inv.due_date) < new Date() && inv.payment_status === 'pending'
      ).length || 0
      
      const totalPatients = billablePatients?.length || 0
      const averageBillAmount = todayPaidInvoices.length > 0 ? todayRevenue / todayPaidInvoices.length : 0

      setStats({
        todayRevenue,
        todayBills: todayPaidInvoices.length,
        pendingBills,
        overduePayments,
        totalPatients,
        averageBillAmount,
        monthlyRevenue,
        revenueGrowth
      })

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading && refreshTrigger === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading billing dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive billing management and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayBills} bills processed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className={`text-xs ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBills}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overduePayments} overdue payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.averageBillAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients} patients billed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards for Important Information */}
      {stats.overduePayments > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.overduePayments} overdue payment{stats.overduePayments !== 1 ? 's' : ''} that require attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common billing tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('billing')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Patient Billing
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('analytics')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Revenue Analytics
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleRefresh}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Refresh Dashboard Data
                </Button>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>Key metrics for {new Date().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Patients Billed</span>
                    <Badge variant="secondary">{stats.totalPatients}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Bills Processed</span>
                    <Badge variant="secondary">{stats.todayBills}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue Generated</span>
                    <Badge className="bg-green-100 text-green-800">
                      {formatCurrency(stats.todayRevenue)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Bill Size</span>
                    <Badge variant="outline">
                      {formatCurrency(stats.averageBillAmount)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Status Overview</CardTitle>
              <CardDescription>Current billing queue and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Completed Today</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.todayBills}</div>
                  <div className="text-sm text-green-700">Bills processed & paid</div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingBills}</div>
                  <div className="text-sm text-yellow-700">Awaiting payment</div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Overdue</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
                  <div className="text-sm text-red-700">Require attention</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <IntegratedBilling />
        </TabsContent>

        <TabsContent value="analytics">
          <BillingAnalytics />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Billing Reports</CardTitle>
              <CardDescription>Generate and export billing reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <FileText className="h-8 w-8 mb-2" />
                  Daily Revenue Report
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Users className="h-8 w-8 mb-2" />
                  Patient Billing Summary
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  Monthly Analytics
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Calendar className="h-8 w-8 mb-2" />
                  Payment Collections
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}