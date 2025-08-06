'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, FileText, Download, Calendar, Users, DollarSign, Activity, TrendingUp } from 'lucide-react'

interface ReportData {
  totalPatients: number
  totalVisits: number
  totalRevenue: number
  totalPrescriptions: number
  dailyVisits: Array<{ date: string; count: number }>
  topDoctors: Array<{ name: string; visits: number }>
  revenueByMonth: Array<{ month: string; revenue: number }>
  popularMedicines: Array<{ name: string; quantity: number }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedReport, setSelectedReport] = useState('overview')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  // const router = useRouter()

  const reportTypes = [
    { value: 'overview', label: 'Overview Report', icon: BarChart3 },
    { value: 'patients', label: 'Patient Report', icon: Users },
    { value: 'revenue', label: 'Revenue Report', icon: DollarSign },
    { value: 'visits', label: 'Visit Report', icon: Activity },
    { value: 'prescriptions', label: 'Prescription Report', icon: FileText },
    { value: 'doctors', label: 'Doctor Performance', icon: TrendingUp }
  ]

  useEffect(() => {
    fetchReportData()
  }, [dateRange])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch various statistics
      const [
        patientsResult,
        visitsResult,
        invoicesResult,
        prescriptionsResult
      ] = await Promise.all([
        // Total patients
        supabase
          .from('patients')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        
        // Visits in date range
        supabase
          .from('visits')
          .select('id, visit_date, doctor_id, users!visits_doctor_id_fkey(full_name)', { count: 'exact' })
          .gte('visit_date', dateRange.startDate)
          .lte('visit_date', dateRange.endDate),
        
        // Revenue in date range
        supabase
          .from('invoices')
          .select('total_amount, created_at')
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate)
          .eq('payment_status', 'paid'),
        
        // Prescriptions in date range
        supabase
          .from('prescriptions')
          .select('id, prescription_items(medicine_id, quantity, medicines(name))')
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate)
      ])

      if (patientsResult.error) throw patientsResult.error
      if (visitsResult.error) throw visitsResult.error
      if (invoicesResult.error) throw invoicesResult.error
      if (prescriptionsResult.error) throw prescriptionsResult.error

      // Process data
      const totalRevenue = invoicesResult.data?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0
      
      // Daily visits data
      const visitsByDate: { [key: string]: number } = {}
      visitsResult.data?.forEach(visit => {
        const date = visit.visit_date
        visitsByDate[date] = (visitsByDate[date] || 0) + 1
      })
      
      const dailyVisits = Object.entries(visitsByDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date))

      // Top doctors
      const doctorVisits: { [key: string]: { name: string; visits: number } } = {}
      visitsResult.data?.forEach(visit => {
        if (visit.users?.full_name) {
          const doctorName = visit.users.full_name
          if (!doctorVisits[doctorName]) {
            doctorVisits[doctorName] = { name: doctorName, visits: 0 }
          }
          doctorVisits[doctorName].visits++
        }
      })
      
      const topDoctors = Object.values(doctorVisits)
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5)

      // Revenue by month
      const revenueByMonth: { [key: string]: number } = {}
      invoicesResult.data?.forEach(invoice => {
        const month = new Date(invoice.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (invoice.total_amount || 0)
      })
      
      const monthlyRevenue = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue
      }))

      // Popular medicines
      const medicineCount: { [key: string]: { name: string; quantity: number } } = {}
      prescriptionsResult.data?.forEach(prescription => {
        prescription.prescription_items?.forEach(item => {
          const medicineName = item.medicines?.name
          if (medicineName) {
            if (!medicineCount[medicineName]) {
              medicineCount[medicineName] = { name: medicineName, quantity: 0 }
            }
            medicineCount[medicineName].quantity += item.quantity || 0
          }
        })
      })
      
      const popularMedicines = Object.values(medicineCount)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      setReportData({
        totalPatients: patientsResult.count || 0,
        totalVisits: visitsResult.count || 0,
        totalRevenue,
        totalPrescriptions: prescriptionsResult.data?.length || 0,
        dailyVisits,
        topDoctors,
        revenueByMonth: monthlyRevenue,
        popularMedicines
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (format: 'csv' | 'pdf') => {
    // This would implement actual export functionality
    setSuccess(`Report exported as ${format.toUpperCase()} (Feature coming soon)`)
  }

  const generateCSV = (data: unknown[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">No report data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate business reports and insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportReport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Date Range Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate">From:</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate">To:</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-auto"
              />
            </div>
            <Button onClick={fetchReportData} size="sm">
              Update Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <Button
                  key={report.value}
                  variant={selectedReport === report.value ? "default" : "outline"}
                  onClick={() => setSelectedReport(report.value)}
                  className="flex items-center gap-2 p-4 h-auto"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{report.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{reportData.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold">{reportData.totalVisits}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{reportData.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prescriptions</p>
                <p className="text-2xl font-bold">{reportData.totalPrescriptions}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content Based on Selection */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Visits Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Visits</CardTitle>
              <CardDescription>Visit count by date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.dailyVisits.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-blue-500 h-2 rounded" 
                        style={{ width: `${Math.max(day.count * 20, 20)}px` }}
                      />
                      <span className="text-sm font-medium w-8">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Doctors</CardTitle>
              <CardDescription>By number of visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topDoctors.map((doctor, index) => (
                  <div key={doctor.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm">{doctor.name}</span>
                    </div>
                    <span className="text-sm font-medium">{doctor.visits} visits</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'revenue' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.revenueByMonth.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{month.month}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-green-500 h-3 rounded" 
                        style={{ 
                          width: `${Math.max((month.revenue / Math.max(...reportData.revenueByMonth.map(m => m.revenue))) * 200, 20)}px` 
                        }}
                      />
                      <span className="text-sm font-medium">₹{month.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'prescriptions' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Medicines</CardTitle>
              <CardDescription>Most prescribed medicines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.popularMedicines.map((medicine, index) => (
                  <div key={medicine.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm">{medicine.name}</span>
                    </div>
                    <span className="text-sm font-medium">{medicine.quantity} units</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Download reports in different formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedReport === 'overview') {
                  generateCSV(reportData.dailyVisits, 'daily_visits_report')
                } else if (selectedReport === 'revenue') {
                  generateCSV(reportData.revenueByMonth, 'revenue_report')
                } else if (selectedReport === 'prescriptions') {
                  generateCSV(reportData.popularMedicines, 'medicines_report')
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Current View as CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => generateCSV(reportData.topDoctors, 'doctors_performance')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Doctor Performance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}