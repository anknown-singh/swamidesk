'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  Activity,
  Pill,
  Database,
  Loader2
} from 'lucide-react'

interface ExportOptions {
  dateRange: string
  format: 'csv' | 'excel'
  dataType: 'patients' | 'billing' | 'inventory' | 'analytics' | 'all'
}

interface ExportData {
  fileName: string
  data: any[]
  headers: string[]
}

export function CSVExcelExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    dateRange: '30',
    format: 'csv',
    dataType: 'patients'
  })

  const exportData = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const exportData = await gatherExportData()
      await downloadFile(exportData)
      setSuccess(`${options.format.toUpperCase()} file downloaded successfully!`)

    } catch (error) {
      console.error('Error exporting data:', error)
      setError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const gatherExportData = async (): Promise<ExportData> => {
    const supabase = createAuthenticatedClient()
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(options.dateRange))

    const dateFilter = {
      gte: startDate.toISOString(),
      lte: endDate.toISOString()
    }

    switch (options.dataType) {
      case 'patients':
        return await exportPatientData(supabase, dateFilter)
      case 'billing':
        return await exportBillingData(supabase, dateFilter)
      case 'inventory':
        return await exportInventoryData(supabase)
      case 'analytics':
        return await exportAnalyticsData(supabase, dateFilter)
      case 'all':
        return await exportAllData(supabase, dateFilter)
      default:
        throw new Error('Invalid data type selected')
    }
  }

  const exportPatientData = async (supabase: any, dateFilter: any): Promise<ExportData> => {
    const { data, error } = await supabase
      .from('opd_records')
      .select(`
        *,
        patients(
          patient_id,
          full_name,
          phone,
          email,
          date_of_birth,
          gender,
          address
        ),
        doctors:users!doctor_id(full_name, email)
      `)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)

    if (error) throw error

    const processedData = data?.map(record => ({
      'Patient ID': record.patients?.patient_id || '',
      'Patient Name': record.patients?.full_name || '',
      'Phone': record.patients?.phone || '',
      'Email': record.patients?.email || '',
      'Gender': record.patients?.gender || '',
      'Date of Birth': record.patients?.date_of_birth || '',
      'Address': record.patients?.address || '',
      'Visit Date': record.visit_date || '',
      'Doctor': record.doctors?.full_name || '',
      'Chief Complaint': record.chief_complaint || '',
      'Diagnosis': record.diagnosis || '',
      'Treatment Plan': record.treatment_plan || '',
      'Status': record.opd_status || '',
      'Consultation Fee': record.consultation_fee || 0,
      'Created At': record.created_at || '',
      'Consultation Completed': record.consultation_completed_at || '',
      'Procedures Completed': record.procedures_completed_at || '',
      'Pharmacy Completed': record.pharmacy_completed_at || ''
    })) || []

    return {
      fileName: `patients_${options.dateRange}days_${new Date().toISOString().split('T')[0]}`,
      data: processedData,
      headers: Object.keys(processedData[0] || {})
    }
  }

  const exportBillingData = async (supabase: any, dateFilter: any): Promise<ExportData> => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients(
          patient_id,
          full_name,
          phone,
          email
        )
      `)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)

    if (error) throw error

    const processedData = data?.map(invoice => ({
      'Invoice Number': invoice.invoice_number || '',
      'Patient ID': invoice.patients?.patient_id || '',
      'Patient Name': invoice.patients?.full_name || '',
      'Phone': invoice.patients?.phone || '',
      'Email': invoice.patients?.email || '',
      'Invoice Date': invoice.invoice_date || '',
      'Due Date': invoice.due_date || '',
      'Subtotal': invoice.subtotal || 0,
      'Tax Amount': invoice.tax_amount || 0,
      'Discount Amount': invoice.discount_amount || 0,
      'Total Amount': invoice.total_amount || 0,
      'Payment Status': invoice.payment_status || '',
      'Payment Method': invoice.payment_method || '',
      'Payment Reference': invoice.payment_reference || '',
      'Payment Date': invoice.payment_date || '',
      'Notes': invoice.notes || '',
      'Created At': invoice.created_at || '',
      'Bill Items': JSON.stringify(invoice.bill_items || [])
    })) || []

    return {
      fileName: `billing_${options.dateRange}days_${new Date().toISOString().split('T')[0]}`,
      data: processedData,
      headers: Object.keys(processedData[0] || {})
    }
  }

  const exportInventoryData = async (supabase: any): Promise<ExportData> => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')

    if (error) throw error

    const processedData = data?.map(medicine => ({
      'Medicine ID': medicine.id || '',
      'Name': medicine.name || '',
      'Generic Name': medicine.generic_name || '',
      'Category': medicine.category || '',
      'Dosage Form': medicine.dosage_form || '',
      'Strength': medicine.strength || '',
      'Unit Price': medicine.unit_price || 0,
      'Stock Quantity': medicine.stock_quantity || 0,
      'Minimum Stock': medicine.minimum_stock || 0,
      'Expiry Date': medicine.expiry_date || '',
      'Batch Number': medicine.batch_number || '',
      'Supplier': medicine.supplier || '',
      'Total Value': (medicine.unit_price || 0) * (medicine.stock_quantity || 0),
      'Status': medicine.stock_quantity === 0 ? 'Out of Stock' : 
                medicine.stock_quantity <= (medicine.minimum_stock || 10) ? 'Low Stock' : 'In Stock',
      'Created At': medicine.created_at || '',
      'Updated At': medicine.updated_at || ''
    })) || []

    return {
      fileName: `inventory_${new Date().toISOString().split('T')[0]}`,
      data: processedData,
      headers: Object.keys(processedData[0] || {})
    }
  }

  const exportAnalyticsData = async (supabase: any, dateFilter: any): Promise<ExportData> => {
    // Fetch various analytics data
    const [patientsResult, billingResult, servicesResult] = await Promise.all([
      supabase
        .from('opd_records')
        .select('created_at, opd_status')
        .gte('created_at', dateFilter.gte)
        .lte('created_at', dateFilter.lte),
      
      supabase
        .from('invoices')
        .select('created_at, total_amount, payment_status')
        .gte('created_at', dateFilter.gte)
        .lte('created_at', dateFilter.lte),
      
      supabase
        .from('visit_services')
        .select('created_at, total_price, status, services(name, category)')
        .gte('created_at', dateFilter.gte)
        .lte('created_at', dateFilter.lte)
    ])

    if (patientsResult.error) throw patientsResult.error
    if (billingResult.error) throw billingResult.error
    if (servicesResult.error) throw servicesResult.error

    // Process daily analytics
    const dailyStats: { [key: string]: any } = {}
    
    // Process patients by day
    patientsResult.data?.forEach(patient => {
      const date = patient.created_at.split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          patients: 0,
          completed_patients: 0,
          revenue: 0,
          services: 0,
          service_revenue: 0
        }
      }
      dailyStats[date].patients++
      if (patient.opd_status === 'completed' || patient.opd_status === 'billed') {
        dailyStats[date].completed_patients++
      }
    })

    // Process billing by day
    billingResult.data?.forEach(invoice => {
      const date = invoice.created_at.split('T')[0]
      if (dailyStats[date] && invoice.payment_status === 'completed') {
        dailyStats[date].revenue += invoice.total_amount || 0
      }
    })

    // Process services by day
    servicesResult.data?.forEach(service => {
      const date = service.created_at.split('T')[0]
      if (dailyStats[date] && service.status === 'completed') {
        dailyStats[date].services++
        dailyStats[date].service_revenue += service.total_price || 0
      }
    })

    const processedData = Object.values(dailyStats).map((day: any) => ({
      'Date': day.date,
      'Total Patients': day.patients,
      'Completed Patients': day.completed_patients,
      'Completion Rate %': day.patients > 0 ? ((day.completed_patients / day.patients) * 100).toFixed(2) : 0,
      'Total Revenue': day.revenue,
      'Services Performed': day.services,
      'Service Revenue': day.service_revenue,
      'Average Revenue per Patient': day.patients > 0 ? (day.revenue / day.patients).toFixed(2) : 0
    }))

    return {
      fileName: `analytics_${options.dateRange}days_${new Date().toISOString().split('T')[0]}`,
      data: processedData,
      headers: Object.keys(processedData[0] || {})
    }
  }

  const exportAllData = async (supabase: any, dateFilter: any): Promise<ExportData> => {
    // This would create multiple sheets/files, for now we'll create a summary
    const [patients, billing, services, medicines] = await Promise.all([
      exportPatientData(supabase, dateFilter),
      exportBillingData(supabase, dateFilter),
      exportAnalyticsData(supabase, dateFilter),
      exportInventoryData(supabase)
    ])

    // Create a comprehensive summary
    const summaryData = [
      { 'Metric': 'Total Patients', 'Value': patients.data.length },
      { 'Metric': 'Total Invoices', 'Value': billing.data.length },
      { 'Metric': 'Total Revenue', 'Value': billing.data.reduce((sum: number, inv: any) => sum + (parseFloat(inv['Total Amount']) || 0), 0) },
      { 'Metric': 'Total Medicines', 'Value': medicines.data.length },
      { 'Metric': 'Low Stock Medicines', 'Value': medicines.data.filter((med: any) => med['Status'] === 'Low Stock').length },
      { 'Metric': 'Out of Stock Medicines', 'Value': medicines.data.filter((med: any) => med['Status'] === 'Out of Stock').length },
      { 'Metric': 'Total Inventory Value', 'Value': medicines.data.reduce((sum: number, med: any) => sum + (parseFloat(med['Total Value']) || 0), 0) }
    ]

    return {
      fileName: `comprehensive_report_${options.dateRange}days_${new Date().toISOString().split('T')[0]}`,
      data: summaryData,
      headers: ['Metric', 'Value']
    }
  }

  const downloadFile = async (exportData: ExportData) => {
    const { fileName, data, headers } = exportData
    
    if (options.format === 'csv') {
      downloadCSV(data, headers, fileName)
    } else {
      // For Excel, we'll create a more advanced CSV that Excel can open
      downloadAdvancedCSV(data, headers, fileName)
    }
  }

  const downloadCSV = (data: any[], headers: string[], fileName: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape quotes and wrap in quotes if contains comma
          const escapedValue = String(value).replace(/"/g, '""')
          return escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n') 
            ? `"${escapedValue}"` 
            : escapedValue
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${fileName}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadAdvancedCSV = (data: any[], headers: string[], fileName: string) => {
    // Create Excel-friendly CSV with UTF-8 BOM
    const BOM = '\uFEFF'
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          const escapedValue = String(value).replace(/"/g, '""')
          return `"${escapedValue}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${fileName}.xlsx.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const dataTypeOptions = [
    { value: 'patients', label: 'Patient Records', icon: Users },
    { value: 'billing', label: 'Billing & Invoices', icon: DollarSign },
    { value: 'inventory', label: 'Medicine Inventory', icon: Pill },
    { value: 'analytics', label: 'Analytics Summary', icon: Activity },
    { value: 'all', label: 'Comprehensive Report', icon: Database }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV/Excel Data Export
          </CardTitle>
          <CardDescription>
            Export healthcare data in CSV or Excel-compatible formats for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Data to Export</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dataTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setOptions({ ...options, dataType: option.value as any })}
                      className={`p-3 border rounded-lg flex items-center gap-2 text-left transition-colors ${
                        options.dataType === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Format and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Export Format</label>
                <select
                  value={options.format}
                  onChange={(e) => setOptions({ ...options, format: e.target.value as 'csv' | 'excel' })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="excel">Excel Compatible CSV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={options.dateRange}
                  onChange={(e) => setOptions({ ...options, dateRange: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={options.dataType === 'inventory'}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 365 days</option>
                </select>
              </div>
            </div>

            {/* Export Description */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Export Details:</h4>
              <p className="text-sm text-gray-600">
                {options.dataType === 'patients' && 'Patient records including personal info, visit details, and treatment history'}
                {options.dataType === 'billing' && 'Invoice data including amounts, payment status, and transaction details'}
                {options.dataType === 'inventory' && 'Complete medicine inventory with stock levels, prices, and status'}
                {options.dataType === 'analytics' && 'Daily analytics summary with patient flow and revenue metrics'}
                {options.dataType === 'all' && 'Comprehensive summary report with key metrics from all modules'}
              </p>
            </div>

            {/* Export Button */}
            <Button
              onClick={exportData}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {options.format.toUpperCase()} File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setOptions({ dateRange: '30', format: 'csv', dataType: 'patients' })
            exportData()
          }}
          disabled={loading}
          className="flex flex-col h-16 p-3"
        >
          <Users className="h-4 w-4 mb-1" />
          <span className="text-xs">Export Patients</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setOptions({ dateRange: '30', format: 'csv', dataType: 'billing' })
            exportData()
          }}
          disabled={loading}
          className="flex flex-col h-16 p-3"
        >
          <DollarSign className="h-4 w-4 mb-1" />
          <span className="text-xs">Export Billing</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setOptions({ dateRange: '30', format: 'csv', dataType: 'inventory' })
            exportData()
          }}
          disabled={loading}
          className="flex flex-col h-16 p-3"
        >
          <Pill className="h-4 w-4 mb-1" />
          <span className="text-xs">Export Inventory</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setOptions({ dateRange: '30', format: 'excel', dataType: 'all' })
            exportData()
          }}
          disabled={loading}
          className="flex flex-col h-16 p-3"
        >
          <Database className="h-4 w-4 mb-1" />
          <span className="text-xs">Full Report</span>
        </Button>
      </div>
    </div>
  )
}