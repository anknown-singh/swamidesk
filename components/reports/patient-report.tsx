'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  PrinterIcon, 
  Download, 
  FileText, 
  Pill, 
  TestTube, 
  Calendar,
  User,
  Stethoscope
} from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  address: string
  created_at: string
}

interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  visit_time: string
  chief_complaint: string
  symptoms: string
  diagnosis: string
  examination_notes: string
  vital_signs: string
  status: string
  created_at: string
  users?: {
    id: string
    full_name: string
    email: string
  }
  prescriptions?: Array<{
    id: string
    medicine_id: string
    quantity: number
    dosage: string
    frequency: string
    duration: string
    instructions: string
    medicines: {
      name: string
      category: string
    }
  }>
  visit_services?: Array<{
    id: string
    service_id: string
    notes: string
    status: string
    price: number
    services: {
      name: string
      category: string
    }
  }>
}

interface PatientReportProps {
  patient: Patient
  visits: Visit[]
  reportType?: 'complete' | 'summary' | 'prescriptions' | 'latest'
  className?: string
}

type ReportTemplate = {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'complete',
    name: 'Complete History',
    description: 'Full consultation history with all details',
    icon: FileText
  },
  {
    id: 'summary',
    name: 'Medical Summary',
    description: 'Summary of key medical information',
    icon: Stethoscope
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions Only',
    description: 'All prescribed medications',
    icon: Pill
  },
  {
    id: 'latest',
    name: 'Latest Visit',
    description: 'Most recent consultation details',
    icon: Calendar
  }
]

export function PatientReport({ patient, visits, reportType = 'complete', className }: PatientReportProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(reportType)
  const [dialogOpen, setDialogOpen] = useState(false)

  const getFilteredVisits = () => {
    switch (selectedTemplate) {
      case 'latest':
        return visits.slice(0, 1)
      case 'summary':
        return visits.filter(visit => visit.status === 'completed').slice(0, 5)
      default:
        return visits
    }
  }

  const generateReportContent = (template: string) => {
    const filteredVisits = getFilteredVisits()
    const clinicName = "SwamIDesk Medical Center"
    const reportDate = new Date().toLocaleDateString()
    const reportTime = new Date().toLocaleTimeString()

    const baseStyles = `
      <style>
        @page {
          margin: 20mm;
          size: A4;
        }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.6;
          font-size: 12px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
        }
        .clinic-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .clinic-details {
          font-size: 14px;
          opacity: 0.9;
        }
        .patient-info {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .patient-name {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          text-align: center;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-weight: 600;
          color: #4b5563;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 13px;
          color: #1f2937;
        }
        .consultation {
          break-inside: avoid;
          page-break-inside: avoid;
          margin-bottom: 35px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .consultation-header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .consultation-date {
          font-size: 16px;
          font-weight: bold;
        }
        .consultation-doctor {
          font-size: 14px;
          opacity: 0.9;
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .section-title {
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-content {
          color: #374151;
          line-height: 1.8;
        }
        .prescription {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 15px;
          border-radius: 6px;
          margin: 8px 0;
          border: 1px solid #f59e0b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .prescription-name {
          font-weight: bold;
          color: #92400e;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .prescription-details {
          font-size: 12px;
          color: #78350f;
          line-height: 1.6;
        }
        .service-item {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          padding: 12px;
          border-radius: 6px;
          margin: 5px 0;
          border: 1px solid #16a34a;
          color: #166534;
        }
        .footer {
          margin-top: 50px;
          padding: 20px;
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        @media print {
          body { font-size: 11px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      </style>
    `

    const patientAge = patient.date_of_birth 
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : 'Unknown'

    const headerContent = `
      <div class="header">
        <div class="clinic-name">${clinicName}</div>
        <div class="clinic-details">
          ${template === 'complete' ? 'Complete Patient Medical History' : 
            template === 'summary' ? 'Patient Medical Summary' :
            template === 'prescriptions' ? 'Patient Prescription History' :
            'Latest Consultation Report'}
        </div>
      </div>
    `

    const patientInfoContent = `
      <div class="patient-info">
        <div class="patient-name">${patient.full_name}</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Patient ID</div>
            <div class="info-value">${patient.id.slice(0, 8)}...</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${patient.phone || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${patient.email || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${patientAge} years</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Report Generated</div>
            <div class="info-value">${reportDate} at ${reportTime}</div>
          </div>
        </div>
      </div>
    `

    const summaryStatsContent = template === 'summary' ? `
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-number">${visits.length}</div>
          <div class="stat-label">Total Consultations</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${visits.filter(v => v.prescriptions && v.prescriptions.length > 0).length}</div>
          <div class="stat-label">Visits with Prescriptions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${visits.filter(v => v.status === 'completed').length}</div>
          <div class="stat-label">Completed Visits</div>
        </div>
      </div>
    ` : ''

    const consultationContent = filteredVisits.map(visit => {
      const showPrescriptions = template !== 'summary' || (visit.prescriptions && visit.prescriptions.length > 0)
      const showServices = template === 'complete' || template === 'latest'
      
      return `
        <div class="consultation">
          <div class="consultation-header">
            <div>
              <div class="consultation-date">${new Date(visit.visit_date).toLocaleDateString()}</div>
              <div style="font-size: 13px; opacity: 0.9;">${visit.visit_time || 'Time not recorded'}</div>
            </div>
            <div class="consultation-doctor">Dr. ${visit.users?.full_name || 'Unknown'}</div>
          </div>
          
          ${visit.chief_complaint ? `
            <div class="section">
              <div class="section-title">Chief Complaint</div>
              <div class="section-content">${visit.chief_complaint}</div>
            </div>
          ` : ''}
          
          ${visit.symptoms && template !== 'prescriptions' ? `
            <div class="section">
              <div class="section-title">Symptoms</div>
              <div class="section-content">${visit.symptoms}</div>
            </div>
          ` : ''}
          
          ${visit.diagnosis ? `
            <div class="section">
              <div class="section-title">Diagnosis</div>
              <div class="section-content">${visit.diagnosis}</div>
            </div>
          ` : ''}
          
          ${visit.vital_signs && template === 'complete' ? `
            <div class="section">
              <div class="section-title">Vital Signs</div>
              <div class="section-content">${visit.vital_signs}</div>
            </div>
          ` : ''}
          
          ${visit.examination_notes && (template === 'complete' || template === 'latest') ? `
            <div class="section">
              <div class="section-title">Examination Notes</div>
              <div class="section-content">${visit.examination_notes}</div>
            </div>
          ` : ''}
          
          ${visit.prescriptions && visit.prescriptions.length > 0 && showPrescriptions ? `
            <div class="section">
              <div class="section-title">Prescribed Medications</div>
              <div class="section-content">
                ${visit.prescriptions.map(prescription => `
                  <div class="prescription">
                    <div class="prescription-name">${prescription.medicines.name}</div>
                    <div class="prescription-details">
                      <strong>Dosage:</strong> ${prescription.dosage} |
                      <strong>Frequency:</strong> ${prescription.frequency} |
                      <strong>Duration:</strong> ${prescription.duration} |
                      <strong>Quantity:</strong> ${prescription.quantity}
                      ${prescription.instructions ? `<br><strong>Instructions:</strong> ${prescription.instructions}` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${visit.visit_services && visit.visit_services.length > 0 && showServices ? `
            <div class="section">
              <div class="section-title">Procedures & Services</div>
              <div class="section-content">
                ${visit.visit_services.map(service => `
                  <div class="service-item">
                    <strong>${service.services.name}</strong> (${service.status}) - ₹${service.price}
                    ${service.notes ? `<br><em>Notes: ${service.notes}</em>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `
    }).join('')

    const footerContent = `
      <div class="footer">
        <p><strong>This is a computer-generated medical report from ${clinicName}</strong></p>
        <p>Report contains ${filteredVisits.length} consultation(s) for patient ${patient.full_name}</p>
        <p>Generated on ${reportDate} at ${reportTime} | Report Type: ${REPORT_TEMPLATES.find(t => t.id === template)?.name}</p>
        ${template === 'prescriptions' ? '<p><strong>Note:</strong> This report contains prescription information only. For complete medical history, generate a Complete History report.</p>' : ''}
      </div>
    `

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${REPORT_TEMPLATES.find(t => t.id === template)?.name} - ${patient.full_name}</title>
        ${baseStyles}
      </head>
      <body>
        ${headerContent}
        ${patientInfoContent}
        ${summaryStatsContent}
        ${consultationContent}
        ${footerContent}
      </body>
      </html>
    `
  }

  const handlePrint = (template: string) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      console.warn('Please allow pop-ups for this site to enable printing')
      return
    }

    const content = generateReportContent(template)
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
    
    // Add a small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownload = (template: string) => {
    const content = generateReportContent(template)
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${patient.full_name.replace(/\s+/g, '_')}_${template}_report_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={className}>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Report Generator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  {patient.full_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Consultations:</span>
                    <span className="ml-2">{visits.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{patient.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Age:</span>
                    <span className="ml-2">
                      {patient.date_of_birth 
                        ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
                        : 'Unknown'} years
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{patient.email || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold mb-4">Select Report Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORT_TEMPLATES.map((template) => {
                  const Icon = template.icon
                  const isSelected = selectedTemplate === template.id
                  
                  return (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div>
                          <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {template.name}
                          </h4>
                          <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <Badge variant="outline" className="mr-2">
                  {REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </Badge>
                Will include {getFilteredVisits().length} consultation(s)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedTemplate)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download HTML
                </Button>
                <Button
                  onClick={() => {
                    handlePrint(selectedTemplate)
                    setDialogOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick action buttons */}
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePrint('latest')}
          className="flex items-center gap-1"
        >
          <PrinterIcon className="h-3 w-3" />
          Latest Visit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePrint('prescriptions')}
          className="flex items-center gap-1"
        >
          <Pill className="h-3 w-3" />
          Prescriptions
        </Button>
      </div>
    </div>
  )
}