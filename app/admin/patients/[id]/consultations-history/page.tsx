'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  History, 
  Calendar,
  User,
  FileText,
  Stethoscope,
  Pill,
  TestTube,
  PrinterIcon,
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { PatientReport } from '@/components/reports/patient-report'

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
  status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'cancelled'
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

export default function PatientConsultationHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPatientAndHistory = useCallback(async () => {
    try {
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      // Fetch consultation history with related data
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          users!visits_doctor_id_fkey (
            id,
            full_name,
            email
          ),
          prescriptions (
            id,
            medicine_id,
            quantity,
            dosage,
            frequency,
            duration,
            instructions,
            medicines (
              name,
              category
            )
          ),
          visit_services (
            id,
            service_id,
            notes,
            status,
            price,
            services (
              name,
              category
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .order('visit_time', { ascending: false })

      if (visitsError) throw visitsError
      setVisits(visitsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load patient consultation history')
    } finally {
      setLoading(false)
    }
  }, [patientId, supabase])

  useEffect(() => {
    fetchPatientAndHistory()
  }, [fetchPatientAndHistory])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting' }
      case 'in_consultation':
        return { color: 'bg-blue-100 text-blue-800', label: 'In Consultation' }
      case 'services_pending':
        return { color: 'bg-orange-100 text-orange-800', label: 'Services Pending' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed' }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status }
    }
  }

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter
    
    let matchesDate = true
    if (dateFilter === 'this_month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(visit.visit_date) >= monthAgo
    } else if (dateFilter === 'this_year') {
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      matchesDate = new Date(visit.visit_date) >= yearAgo
    } else if (dateFilter === 'completed_only') {
      matchesDate = visit.status === 'completed'
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const printAllHistory = () => {
    // Create a new window for printing complete history
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generateHistoryPrintContent()
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const generateHistoryPrintContent = () => {
    if (!patient) return ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Consultation History - ${patient.full_name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .clinic-details { font-size: 14px; color: #6b7280; }
          .patient-info { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .patient-name { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .consultation { break-inside: avoid; page-break-inside: avoid; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
          .consultation-header { background-color: #1e40af; color: white; padding: 10px 15px; border-radius: 5px; margin-bottom: 15px; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; color: #374151; margin-bottom: 5px; }
          .prescription { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 5px 0; }
          @media print {
            body { margin: 20px; font-size: 12px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">SwamIDesk Medical Center</div>
          <div class="clinic-details">Complete Patient Consultation History Report</div>
        </div>
        
        <div class="patient-info">
          <div class="patient-name">${patient.full_name}</div>
          <div><strong>Patient ID:</strong> ${patient.id.slice(0, 8)}...</div>
          <div><strong>Phone:</strong> ${patient.phone || 'Not provided'}</div>
          <div><strong>Email:</strong> ${patient.email || 'Not provided'}</div>
          <div><strong>Date of Birth:</strong> ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}</div>
          <div><strong>Age:</strong> ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'Unknown'} years</div>
          <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>

        ${filteredVisits.map(visit => `
          <div class="consultation">
            <div class="consultation-header">
              <strong>Consultation on ${new Date(visit.visit_date).toLocaleDateString()} at ${visit.visit_time || 'N/A'}</strong>
              <span style="float: right;">Dr. ${visit.users?.full_name || 'Unknown'}</span>
            </div>
            
            ${visit.chief_complaint ? `
              <div class="section">
                <div class="section-title">Chief Complaint:</div>
                <div>${visit.chief_complaint}</div>
              </div>
            ` : ''}
            
            ${visit.symptoms ? `
              <div class="section">
                <div class="section-title">Symptoms:</div>
                <div>${visit.symptoms}</div>
              </div>
            ` : ''}
            
            ${visit.diagnosis ? `
              <div class="section">
                <div class="section-title">Diagnosis:</div>
                <div>${visit.diagnosis}</div>
              </div>
            ` : ''}
            
            ${visit.vital_signs ? `
              <div class="section">
                <div class="section-title">Vital Signs:</div>
                <div>${visit.vital_signs}</div>
              </div>
            ` : ''}
            
            ${visit.examination_notes ? `
              <div class="section">
                <div class="section-title">Examination Notes:</div>
                <div>${visit.examination_notes}</div>
              </div>
            ` : ''}
            
            ${visit.prescriptions && visit.prescriptions.length > 0 ? `
              <div class="section">
                <div class="section-title">Prescribed Medications:</div>
                ${visit.prescriptions.map(prescription => `
                  <div class="prescription">
                    <strong>${prescription.medicines.name}</strong><br>
                    <strong>Dosage:</strong> ${prescription.dosage} | 
                    <strong>Frequency:</strong> ${prescription.frequency} | 
                    <strong>Duration:</strong> ${prescription.duration}<br>
                    <strong>Quantity:</strong> ${prescription.quantity}
                    ${prescription.instructions ? `<br><strong>Instructions:</strong> ${prescription.instructions}` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${visit.visit_services && visit.visit_services.length > 0 ? `
              <div class="section">
                <div class="section-title">Procedures/Services:</div>
                ${visit.visit_services.map(service => `
                  <div>• ${service.services.name} (${service.status}) - ₹${service.price}</div>
                  ${service.notes ? `<div style="margin-left: 20px; font-style: italic;">Notes: ${service.notes}</div>` : ''}
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is a computer-generated report from SwamIDesk Medical Center</p>
          <p>Report contains ${filteredVisits.length} consultation(s) for patient ${patient.full_name}</p>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading consultation history...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Patient not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Consultation History: {patient.full_name}
          </h1>
          <p className="text-muted-foreground">
            Complete medical consultation history and records
          </p>
        </div>
        <PatientReport 
          patient={patient} 
          visits={filteredVisits}
          className="flex items-center gap-2"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Patient Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg font-semibold">{patient.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p>{patient.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Age</label>
              <p>{patient.date_of_birth ? 
                new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() 
                : 'N/A'} years</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Consultations</label>
              <p className="text-lg font-semibold text-blue-600">{visits.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by diagnosis, complaint, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="services_pending">Services Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="completed_only">Completed Only</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredVisits.length} consultations found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Consultation History ({filteredVisits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredVisits.map((visit) => {
              const statusConfig = getStatusConfig(visit.status)
              
              return (
                <div key={visit.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </h3>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {visit.visit_time && `at ${visit.visit_time}`}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Doctor:</strong> Dr. {visit.users?.full_name || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/consultations/${visit.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Print individual consultation
                          const printWindow = window.open('', '_blank')
                          if (!printWindow) return
                          
                          const singleConsultationContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Consultation Report - ${patient.full_name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
                                .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; }
                                .patient-info { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                                .section { margin-bottom: 15px; }
                                .section-title { font-weight: bold; color: #374151; margin-bottom: 5px; }
                                .prescription { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 5px 0; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="clinic-name">SwamIDesk Medical Center</div>
                                <p>Patient Consultation Report</p>
                              </div>
                              
                              <div class="patient-info">
                                <h2>${patient.full_name}</h2>
                                <p><strong>Date:</strong> ${new Date(visit.visit_date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> ${visit.visit_time || 'N/A'}</p>
                                <p><strong>Doctor:</strong> Dr. ${visit.users?.full_name || 'Unknown'}</p>
                              </div>

                              ${visit.chief_complaint ? `
                                <div class="section">
                                  <div class="section-title">Chief Complaint:</div>
                                  <div>${visit.chief_complaint}</div>
                                </div>
                              ` : ''}
                              
                              ${visit.diagnosis ? `
                                <div class="section">
                                  <div class="section-title">Diagnosis:</div>
                                  <div>${visit.diagnosis}</div>
                                </div>
                              ` : ''}
                              
                              ${visit.prescriptions && visit.prescriptions.length > 0 ? `
                                <div class="section">
                                  <div class="section-title">Prescribed Medications:</div>
                                  ${visit.prescriptions.map(prescription => `
                                    <div class="prescription">
                                      <strong>${prescription.medicines.name}</strong><br>
                                      Dosage: ${prescription.dosage} | Frequency: ${prescription.frequency} | Duration: ${prescription.duration}
                                      ${prescription.instructions ? `<br>Instructions: ${prescription.instructions}` : ''}
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                            </body>
                            </html>
                          `
                          printWindow.document.write(singleConsultationContent)
                          printWindow.document.close()
                          printWindow.focus()
                          printWindow.print()
                        }}
                      >
                        <PrinterIcon className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>

                  {/* Consultation Details */}
                  <div className="space-y-4">
                    {visit.chief_complaint && (
                      <div>
                        <span className="font-medium text-gray-700">Chief Complaint:</span>
                        <p className="text-gray-600 mt-1">{visit.chief_complaint}</p>
                      </div>
                    )}

                    {visit.diagnosis && (
                      <div>
                        <span className="font-medium text-gray-700">Diagnosis:</span>
                        <p className="text-gray-600 mt-1">{visit.diagnosis}</p>
                      </div>
                    )}

                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-700">Prescribed Medications:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {visit.prescriptions.map(prescription => (
                            <div key={prescription.id} className="bg-blue-50 p-3 rounded-md">
                              <div className="font-medium">{prescription.medicines.name}</div>
                              <div className="text-sm text-gray-600">
                                {prescription.dosage} | {prescription.frequency} | {prescription.duration}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {visit.visit_services && visit.visit_services.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-gray-700">Procedures/Services:</span>
                        </div>
                        <div className="space-y-1">
                          {visit.visit_services.map(service => (
                            <div key={service.id} className="text-sm bg-green-50 p-2 rounded">
                              {service.services.name} ({service.status}) - ₹{service.price}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredVisits.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No consultations found</p>
                <p className="text-sm">
                  {searchTerm ? 'Try adjusting your search criteria' : 'This patient has no consultation history yet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}