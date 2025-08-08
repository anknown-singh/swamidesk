'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Pill, 
  Calendar,
  Target
} from 'lucide-react'

interface BillingAnalytics {
  totalRevenue: number
  consultationRevenue: number
  procedureRevenue: number
  medicineRevenue: number
  averageBillAmount: number
  totalPatientsBilled: number
  paymentMethodBreakdown: Array<{
    method: string
    amount: number
    count: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    consultations: number
    procedures: number
    medicines: number
  }>
  departmentRevenue: Array<{
    department: string
    revenue: number
    percentage: number
  }>
  dailyStats: Array<{
    date: string
    revenue: number
    bills: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function BillingAnalytics() {
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createAuthenticatedClient()
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      // Fetch invoice data
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          bill_items,
          patients(full_name, patient_id)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'completed')

      if (invoiceError) throw invoiceError

      // Process analytics
      const processedAnalytics = processInvoiceData(invoices || [])
      setAnalytics(processedAnalytics)

    } catch (error) {
      console.error('Error fetching billing analytics:', error)
      setError('Failed to load billing analytics')
    } finally {
      setLoading(false)
    }
  }

  const processInvoiceData = (invoices: any[]): BillingAnalytics => {
    let totalRevenue = 0
    let consultationRevenue = 0
    let procedureRevenue = 0
    let medicineRevenue = 0
    const paymentMethods: { [key: string]: { amount: number; count: number } } = {}
    const monthlyData: { [key: string]: any } = {}
    const departmentData: { [key: string]: number } = {}
    const dailyData: { [key: string]: { revenue: number; bills: number } } = {}

    invoices.forEach(invoice => {
      const amount = invoice.total_amount || 0
      totalRevenue += amount

      // Process bill items
      if (invoice.bill_items && Array.isArray(invoice.bill_items)) {
        invoice.bill_items.forEach((item: any) => {
          switch (item.category) {
            case 'consultation':
              consultationRevenue += item.total
              break
            case 'procedure':
              procedureRevenue += item.total
              break
            case 'medicine':
              medicineRevenue += item.total
              break
          }
        })
      }

      // Payment method breakdown
      const method = invoice.payment_method || 'Unknown'
      if (!paymentMethods[method]) {
        paymentMethods[method] = { amount: 0, count: 0 }
      }
      paymentMethods[method].amount += amount
      paymentMethods[method].count += 1

      // Monthly data
      const month = new Date(invoice.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          revenue: 0,
          consultations: 0,
          procedures: 0,
          medicines: 0
        }
      }
      monthlyData[month].revenue += amount

      // Daily data
      const date = new Date(invoice.created_at).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, bills: 0 }
      }
      dailyData[date].revenue += amount
      dailyData[date].bills += 1
    })

    return {
      totalRevenue,
      consultationRevenue,
      procedureRevenue,
      medicineRevenue,
      averageBillAmount: invoices.length > 0 ? totalRevenue / invoices.length : 0,
      totalPatientsBilled: invoices.length,
      paymentMethodBreakdown: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count
      })),
      monthlyRevenue: Object.values(monthlyData),
      departmentRevenue: [
        { department: 'Consultation', revenue: consultationRevenue, percentage: (consultationRevenue / totalRevenue) * 100 },
        { department: 'Procedures', revenue: procedureRevenue, percentage: (procedureRevenue / totalRevenue) * 100 },
        { department: 'Pharmacy', revenue: medicineRevenue, percentage: (medicineRevenue / totalRevenue) * 100 }
      ].filter(dept => dept.revenue > 0),
      dailyStats: Object.entries(dailyData).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        bills: data.bills
      })).sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Analytics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Analyzing billing data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Billing Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalPatientsBilled} patients billed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics.averageBillAmount)}
            </div>
            <p className="text-xs text-muted-foreground">per patient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultation Revenue</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analytics.consultationRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((analytics.consultationRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacy Revenue</CardTitle>
            <Pill className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.medicineRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((analytics.medicineRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Revenue Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
            <CardDescription>Distribution of revenue across different services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.departmentRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ department, percentage }) => `${department}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {analytics.departmentRevenue.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.paymentMethodBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
          <CardDescription>Revenue and billing volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: any, name: string) => 
                  name === 'revenue' ? formatCurrency(value) : value
                }
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">Consultation Services</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.consultationRevenue)}</p>
              <p className="text-sm text-blue-600">
                {((analytics.consultationRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">Procedure Revenue</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.procedureRevenue)}</p>
              <p className="text-sm text-green-600">
                {((analytics.procedureRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800">Pharmacy Sales</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.medicineRevenue)}</p>
              <p className="text-sm text-purple-600">
                {((analytics.medicineRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}