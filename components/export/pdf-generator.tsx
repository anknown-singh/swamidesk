'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  Activity,
  Pill,
  BarChart3,
  Loader2
} from 'lucide-react'

interface PDFExportOptions {
  dateRange: string
  includeAnalytics: boolean
  includePatientData: boolean
  includeBillingData: boolean
  includeInventoryData: boolean
  format: 'summary' | 'detailed'
}

interface ReportData {
  title: string
  dateRange: string
  generatedAt: string
  clinicInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
  summary: {
    totalPatients: number
    totalRevenue: number
    completedConsultations: number
    dispensedMedicines: number
    completedProcedures: number
  }
  analytics?: any
  patients?: any[]
  billing?: any[]
  inventory?: any[]
}

export function PDFGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [options, setOptions] = useState<PDFExportOptions>({
    dateRange: '30',
    includeAnalytics: true,
    includePatientData: true,
    includeBillingData: true,
    includeInventoryData: false,
    format: 'summary'
  })

  const generatePDFReport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Gather data based on options
      const reportData = await gatherReportData()
      
      // Generate PDF content
      const pdfContent = generatePDFContent(reportData)
      
      // Create and download PDF
      await createAndDownloadPDF(pdfContent, `SwamIDesk_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      
      setSuccess('PDF report generated and downloaded successfully!')

    } catch (error) {
      console.error('Error generating PDF:', error)
      setError('Failed to generate PDF report')
    } finally {
      setLoading(false)
    }
  }

  const gatherReportData = async (): Promise<ReportData> => {
    const supabase = createAuthenticatedClient()
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(options.dateRange))

    const reportData: ReportData = {
      title: `SwamIDesk Healthcare Report`,
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      generatedAt: new Date().toLocaleString(),
      clinicInfo: {
        name: 'SwamIDesk Clinic',
        address: 'Healthcare Excellence Center',
        phone: '+91 9876543210',
        email: 'admin@swamidesk.com'
      },
      summary: {
        totalPatients: 0,
        totalRevenue: 0,
        completedConsultations: 0,
        dispensedMedicines: 0,
        completedProcedures: 0
      }
    }

    // Fetch patient data
    if (options.includePatientData) {
      const { data: patients, error: patientError } = await supabase
        .from('opd_records')
        .select(`
          *,
          patients(full_name, phone, patient_id),
          doctors:users!doctor_id(full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (patientError) throw patientError

      reportData.patients = patients
      reportData.summary.totalPatients = patients?.length || 0
      reportData.summary.completedConsultations = patients?.filter(p => p.consultation_completed_at).length || 0
    }

    // Fetch billing data
    if (options.includeBillingData) {
      const { data: invoices, error: billingError } = await supabase
        .from('invoices')
        .select(`
          *,
          patients(full_name, patient_id)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (billingError) throw billingError

      reportData.billing = invoices
      reportData.summary.totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    }

    // Fetch procedure data
    const { data: procedures, error: procedureError } = await supabase
      .from('visit_services')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (procedureError) throw procedureError
    reportData.summary.completedProcedures = procedures?.length || 0

    // Fetch pharmacy data - count dispensed prescriptions instead of pharmacy issues
    const { data: dispensedPrescriptions, error: pharmacyError } = await supabase
      .from('prescriptions')
      .select('id')
      .gte('dispensed_at', startDate.toISOString())
      .lte('dispensed_at', endDate.toISOString())
      .eq('status', 'dispensed')

    if (pharmacyError) throw pharmacyError
    reportData.summary.dispensedMedicines = dispensedPrescriptions?.length || 0

    // Fetch inventory data if requested
    if (options.includeInventoryData) {
      const { data: inventory, error: inventoryError } = await supabase
        .from('medicines')
        .select('*')

      if (inventoryError) throw inventoryError
      reportData.inventory = inventory
    }

    return reportData
  }

  const generatePDFContent = (data: ReportData): string => {
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
    
    return `
      <html>
        <head>
          <title>${data.title}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 40px; 
              line-height: 1.6; 
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #3B82F6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #3B82F6;
              margin-bottom: 10px;
              font-size: 28px;
            }
            .info-box {
              background-color: #F8FAFC;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #3B82F6;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .metric-card {
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .metric-value {
              font-size: 32px;
              font-weight: bold;
              color: #10B981;
              margin-bottom: 5px;
            }
            .metric-label {
              color: #6B7280;
              font-size: 14px;
            }
            .section {
              margin: 40px 0;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #1F2937;
              border-bottom: 2px solid #E5E7EB;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #E5E7EB;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #F9FAFB;
              font-weight: 600;
              color: #374151;
            }
            tr:nth-child(even) {
              background-color: #F9FAFB;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-completed { background-color: #D1FAE5; color: #065F46; }
            .status-pending { background-color: #FEF3C7; color: #92400E; }
            .status-cancelled { background-color: #FEE2E2; color: #991B1B; }
            @media print {
              body { margin: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>${data.title}</h1>
            <div class="info-box">
              <strong>Clinic:</strong> ${data.clinicInfo.name}<br>
              <strong>Period:</strong> ${data.dateRange}<br>
              <strong>Generated:</strong> ${data.generatedAt}
            </div>
          </div>

          <!-- Executive Summary -->
          <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="summary-grid">
              <div class="metric-card">
                <div class="metric-value">${data.summary.totalPatients}</div>
                <div class="metric-label">Total Patients</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #10B981;">${formatCurrency(data.summary.totalRevenue)}</div>
                <div class="metric-label">Total Revenue</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.summary.completedConsultations}</div>
                <div class="metric-label">Consultations</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.summary.completedProcedures}</div>
                <div class="metric-label">Procedures</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.summary.dispensedMedicines}</div>
                <div class="metric-label">Medicines Dispensed</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.summary.totalRevenue > 0 ? formatCurrency(data.summary.totalRevenue / data.summary.totalPatients) : '₹0'}</div>
                <div class="metric-label">Avg Revenue/Patient</div>
              </div>
            </div>
          </div>

          ${options.includePatientData && data.patients ? `
          <!-- Patient Report -->
          <div class="section">
            <h2>👥 Patient Activity Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Patient ID</th>
                  <th>Visit Date</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                ${data.patients.slice(0, 50).map(patient => `
                  <tr>
                    <td>${patient.patients?.full_name || 'N/A'}</td>
                    <td>${patient.patients?.patient_id || 'N/A'}</td>
                    <td>${new Date(patient.visit_date).toLocaleDateString()}</td>
                    <td>${patient.doctors?.full_name || 'N/A'}</td>
                    <td>
                      <span class="status-badge status-${patient.opd_status === 'completed' ? 'completed' : patient.opd_status === 'cancelled' ? 'cancelled' : 'pending'}">
                        ${patient.opd_status || 'pending'}
                      </span>
                    </td>
                    <td>${patient.diagnosis || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${data.patients.length > 50 ? `<p><em>Showing first 50 patients. Total: ${data.patients.length}</em></p>` : ''}
          </div>
          ` : ''}

          ${options.includeBillingData && data.billing ? `
          <!-- Billing Report -->
          <div class="section">
            <h2>💰 Billing & Revenue Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                ${data.billing.slice(0, 50).map(invoice => `
                  <tr>
                    <td>${invoice.invoice_number}</td>
                    <td>${invoice.patients?.full_name || 'N/A'}</td>
                    <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
                    <td>${formatCurrency(invoice.total_amount || 0)}</td>
                    <td>
                      <span class="status-badge status-${invoice.payment_status === 'completed' ? 'completed' : invoice.payment_status === 'cancelled' ? 'cancelled' : 'pending'}">
                        ${invoice.payment_status || 'pending'}
                      </span>
                    </td>
                    <td>${invoice.payment_method || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${data.billing.length > 50 ? `<p><em>Showing first 50 invoices. Total: ${data.billing.length}</em></p>` : ''}
          </div>
          ` : ''}

          ${options.includeInventoryData && data.inventory ? `
          <!-- Inventory Report -->
          <div class="section">
            <h2>💊 Inventory Status Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.inventory.slice(0, 100).map(medicine => {
                  const status = medicine.stock_quantity === 0 ? 'Out of Stock' : 
                                medicine.stock_quantity <= (medicine.minimum_stock || 10) ? 'Low Stock' : 'In Stock'
                  const statusClass = medicine.stock_quantity === 0 ? 'cancelled' : 
                                    medicine.stock_quantity <= (medicine.minimum_stock || 10) ? 'pending' : 'completed'
                  return `
                    <tr>
                      <td>${medicine.name}</td>
                      <td>${medicine.category}</td>
                      <td>${medicine.stock_quantity}</td>
                      <td>${formatCurrency(medicine.unit_price || 0)}</td>
                      <td>${formatCurrency((medicine.stock_quantity || 0) * (medicine.unit_price || 0))}</td>
                      <td>
                        <span class="status-badge status-${statusClass}">
                          ${status}
                        </span>
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            ${data.inventory.length > 100 ? `<p><em>Showing first 100 medicines. Total: ${data.inventory.length}</em></p>` : ''}
          </div>
          ` : ''}

          <!-- Key Insights -->
          <div class="section">
            <h2>💡 Key Insights & Recommendations</h2>
            <div class="info-box">
              <h3>Performance Highlights:</h3>
              <ul>
                <li><strong>Patient Volume:</strong> ${data.summary.totalPatients} patients served in ${options.dateRange} days</li>
                <li><strong>Revenue Performance:</strong> ${formatCurrency(data.summary.totalRevenue)} total revenue generated</li>
                <li><strong>Service Delivery:</strong> ${data.summary.completedConsultations} consultations and ${data.summary.completedProcedures} procedures completed</li>
                <li><strong>Pharmacy Operations:</strong> ${data.summary.dispensedMedicines} medicines dispensed</li>
              </ul>
              
              <h3>Operational Recommendations:</h3>
              <ul>
                <li>Continue monitoring patient flow to optimize scheduling</li>
                <li>Review high-revenue services for potential expansion</li>
                <li>Maintain inventory levels to avoid stockouts</li>
                <li>Focus on maintaining high completion rates</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This report was generated by SwamIDesk Healthcare Management System</p>
            <p>For questions about this report, contact: ${data.clinicInfo.email}</p>
            <p>© ${new Date().getFullYear()} SwamIDesk. All rights reserved.</p>
          </div>
        </body>
      </html>
    `
  }

  const createAndDownloadPDF = async (htmlContent: string, filename: string) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.')
    }

    // Write the HTML content
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const presetReports = [
    {
      name: 'Daily Summary',
      description: 'Quick daily overview with key metrics',
      options: { ...options, dateRange: '1', format: 'summary' as const }
    },
    {
      name: 'Weekly Report',
      description: 'Comprehensive weekly performance report',
      options: { ...options, dateRange: '7', format: 'detailed' as const }
    },
    {
      name: 'Monthly Analytics',
      description: 'Full monthly report with all data',
      options: { ...options, dateRange: '30', format: 'detailed' as const, includeInventoryData: true }
    },
    {
      name: 'Revenue Report',
      description: 'Focus on billing and revenue data',
      options: { 
        ...options, 
        dateRange: '30', 
        includeAnalytics: false,
        includePatientData: false,
        includeBillingData: true,
        includeInventoryData: false,
        format: 'detailed' as const 
      }
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive PDF reports with customizable data sections
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

          {/* Preset Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <h3 className="col-span-full font-semibold mb-2">Quick Report Templates</h3>
            {presetReports.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => {
                  setOptions(preset.options)
                  generatePDFReport()
                }}
                disabled={loading}
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-muted-foreground">{preset.description}</div>
              </Button>
            ))}
          </div>

          {/* Custom Report Options */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold">Custom Report Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={options.dateRange}
                  onChange={(e) => setOptions({ ...options, dateRange: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="1">Last 1 day</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 365 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Report Format</label>
                <select
                  value={options.format}
                  onChange={(e) => setOptions({ ...options, format: e.target.value as 'summary' | 'detailed' })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="summary">Summary</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Include Data Sections</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeAnalytics}
                    onChange={(e) => setOptions({ ...options, includeAnalytics: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Analytics</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includePatientData}
                    onChange={(e) => setOptions({ ...options, includePatientData: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Patient Data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeBillingData}
                    onChange={(e) => setOptions({ ...options, includeBillingData: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Billing Data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeInventoryData}
                    onChange={(e) => setOptions({ ...options, includeInventoryData: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Inventory Data</span>
                </label>
              </div>
            </div>

            <Button
              onClick={generatePDFReport}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Custom PDF Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}