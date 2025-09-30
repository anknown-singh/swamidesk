'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Calendar,
  Clock,
  User,
  Target,
  AlertCircle,
  CheckCircle2,
  Printer,
  Download,
  Activity
} from 'lucide-react'
import { BaseStepComponentProps } from '../shared/base-consultation-workflow'

interface ConsultationSummaryData {
  patientInfo: {
    name: string
    age: string
    phone: string
    email: string
  }
  consultationDate: string
  duration: string
  chiefComplaints: {
    primary: string
    complaints: Array<{
      complaint: string
      duration: string
      severity: string
      location: string
    }>
    painLevel: string
    emergencyVisit: boolean
  }
  examinationFindings: {
    oralHygiene: string
    significantFindings: string[]
    dentalChart: any[]
    diagnosticImaging: string[]
  }
  diagnosis: {
    primary: Array<{
      condition: string
      location: string
      severity: string
      confidence: number
    }>
    differential: Array<{
      condition: string
      confidence: number
    }>
    riskFactors: string[]
  }
  treatmentPlan: {
    selectedTreatments: Array<{
      procedure: string
      tooth: string
      priority: string
      cost: string
    }>
    totalCost: string
    totalTime: string
    phases: Array<{
      phase: number
      title: string
      procedures: string[]
      duration: string
    }>
  }
  followUp: {
    nextAppointment: string
    urgency: string
    instructions: string[]
  }
  consent: {
    obtained: boolean
    date: string
  }
  doctorNotes: string
}

export function DentalConsultationSummary({
  consultationId,
  patientId,
  onNext,
  onSave,
  isReadOnly = true
}: BaseStepComponentProps) {
  const [summaryData, setSummaryData] = useState<ConsultationSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)

  // Mock data - in real implementation, this would fetch from the consultation session
  useEffect(() => {
    const mockData: ConsultationSummaryData = {
      patientInfo: {
        name: "John Doe",
        age: "45",
        phone: "(555) 123-4567",
        email: "john.doe@email.com"
      },
      consultationDate: new Date().toLocaleDateString(),
      duration: "45 minutes",
      chiefComplaints: {
        primary: "Tooth pain",
        complaints: [
          {
            complaint: "Toothache",
            duration: "3 days",
            severity: "severe",
            location: "Upper right molar"
          }
        ],
        painLevel: "7-8",
        emergencyVisit: false
      },
      examinationFindings: {
        oralHygiene: "fair",
        significantFindings: [
          "Large carious lesion on tooth #14",
          "Mild gingivitis in posterior regions",
          "Calculus deposits on lower anteriors"
        ],
        dentalChart: [],
        diagnosticImaging: ["Bitewing X-rays", "Periapical X-ray #14"]
      },
      diagnosis: {
        primary: [
          {
            condition: "Dental Caries",
            location: "Tooth #14",
            severity: "severe",
            confidence: 95
          }
        ],
        differential: [
          {
            condition: "Reversible Pulpitis",
            confidence: 80
          }
        ],
        riskFactors: ["Poor oral hygiene", "Irregular dental visits", "High sugar diet"]
      },
      treatmentPlan: {
        selectedTreatments: [
          {
            procedure: "Crown",
            tooth: "#14",
            priority: "urgent",
            cost: "$1,200"
          },
          {
            procedure: "Prophylaxis",
            tooth: "Full mouth",
            priority: "routine",
            cost: "$150"
          }
        ],
        totalCost: "$1,350",
        totalTime: "2 appointments over 3 weeks",
        phases: [
          {
            phase: 1,
            title: "Emergency Treatment",
            procedures: ["Root canal therapy", "Temporary crown"],
            duration: "90 minutes"
          },
          {
            phase: 2,
            title: "Final Restoration",
            procedures: ["Permanent crown placement", "Prophylaxis"],
            duration: "60 minutes"
          }
        ]
      },
      followUp: {
        nextAppointment: "Within 1 week",
        urgency: "urgent",
        instructions: [
          "Take prescribed antibiotics as directed",
          "Avoid chewing on right side",
          "Use warm salt water rinses"
        ]
      },
      consent: {
        obtained: true,
        date: new Date().toLocaleDateString()
      },
      doctorNotes: "Patient presents with acute pain secondary to deep carious lesion. Pulp vitality testing indicates likely reversible pulpitis. Immediate treatment recommended to prevent progression to irreversible pulpitis."
    }

    setTimeout(() => {
      setSummaryData(mockData)
      setIsLoading(false)
    }, 1000)
  }, [consultationId])

  const handlePrint = () => {
    setIsPrinting(true)
    window.print()
    setTimeout(() => setIsPrinting(false), 1000)
  }

  const handleExport = () => {
    // Implementation for exporting as PDF or other formats
    console.log('Export functionality would be implemented here')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Generating consultation summary...</p>
        </CardContent>
      </Card>
    )
  }

  if (!summaryData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load consultation summary</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Dental Consultation Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete consultation record and treatment plan
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Patient & Consultation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="h-4 w-4 mr-2" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Patient Name:</span>
                <span>{summaryData.patientInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Age:</span>
                <span>{summaryData.patientInfo.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{summaryData.patientInfo.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{summaryData.patientInfo.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Consultation Date:</span>
                <span>{summaryData.consultationDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Duration:</span>
                <span>{summaryData.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Consultation Type:</span>
                <span>Dental Examination</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Emergency Visit:</span>
                <span>{summaryData.chiefComplaints.emergencyVisit ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
            Chief Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Primary Complaint: </span>
              <span>{summaryData.chiefComplaints.primary}</span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Detailed Complaints:</h4>
              <div className="space-y-2">
                {summaryData.chiefComplaints.complaints.map((complaint, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><strong>Issue:</strong> {complaint.complaint}</div>
                      <div><strong>Duration:</strong> {complaint.duration}</div>
                      <div><strong>Severity:</strong> {complaint.severity}</div>
                      <div><strong>Location:</strong> {complaint.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {summaryData.chiefComplaints.painLevel && (
              <div>
                <span className="font-medium">Pain Level: </span>
                <Badge variant="outline" className="text-red-600">
                  {summaryData.chiefComplaints.painLevel}/10
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Examination Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            Examination Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Oral Hygiene Status: </span>
              <Badge variant="outline" className={
                summaryData.examinationFindings.oralHygiene === 'excellent' ? 'text-green-600' :
                summaryData.examinationFindings.oralHygiene === 'good' ? 'text-blue-600' :
                summaryData.examinationFindings.oralHygiene === 'fair' ? 'text-orange-600' :
                'text-red-600'
              }>
                {summaryData.examinationFindings.oralHygiene}
              </Badge>
            </div>

            <div>
              <h4 className="font-medium mb-2">Significant Findings:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {summaryData.examinationFindings.significantFindings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>

            {summaryData.examinationFindings.diagnosticImaging.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Diagnostic Imaging:</h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.examinationFindings.diagnosticImaging.map((imaging, index) => (
                    <Badge key={index} variant="secondary">{imaging}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Target className="h-4 w-4 mr-2 text-purple-500" />
            Clinical Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Primary Diagnosis:</h4>
              <div className="space-y-2">
                {summaryData.diagnosis.primary.map((diag, index) => (
                  <div key={index} className="bg-purple-50 border-l-4 border-l-purple-500 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-purple-700">{diag.condition}</span>
                      <Badge variant="outline" className="text-purple-600">
                        {diag.confidence}% confidence
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Location:</strong> {diag.location}</div>
                      <div><strong>Severity:</strong> {diag.severity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {summaryData.diagnosis.differential.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Differential Diagnosis:</h4>
                <div className="space-y-1">
                  {summaryData.diagnosis.differential.map((diag, index) => (
                    <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded">
                      <span>{diag.condition}</span>
                      <Badge variant="outline" className="text-orange-600 text-xs">
                        {diag.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summaryData.diagnosis.riskFactors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Risk Factors:</h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.diagnosis.riskFactors.map((factor, index) => (
                    <Badge key={index} variant="outline" className="text-red-600">{factor}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-500" />
            Treatment Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
              <div>
                <span className="font-medium">Total Estimated Cost: </span>
                <span className="text-green-600 font-semibold">{summaryData.treatmentPlan.totalCost}</span>
              </div>
              <div>
                <span className="font-medium">Treatment Duration: </span>
                <span>{summaryData.treatmentPlan.totalTime}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Selected Treatments:</h4>
              <div className="space-y-2">
                {summaryData.treatmentPlan.selectedTreatments.map((treatment, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{treatment.procedure}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          treatment.priority === 'emergency' ? 'text-red-600' :
                          treatment.priority === 'urgent' ? 'text-orange-600' :
                          treatment.priority === 'routine' ? 'text-blue-600' :
                          'text-gray-600'
                        }>
                          {treatment.priority}
                        </Badge>
                        <Badge variant="outline" className="text-green-600">
                          {treatment.cost}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tooth/Area: {treatment.tooth}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Treatment Phases:</h4>
              <div className="space-y-2">
                {summaryData.treatmentPlan.phases.map((phase, index) => (
                  <div key={index} className="border-l-4 border-l-blue-500 bg-blue-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Phase {phase.phase}: {phase.title}</span>
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                    <div className="text-sm">
                      <strong>Procedures:</strong> {phase.procedures.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up & Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-4 w-4 mr-2 text-blue-500" />
            Follow-up & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Next Appointment: </span>
                <span>{summaryData.followUp.nextAppointment}</span>
              </div>
              <div>
                <span className="font-medium">Urgency: </span>
                <Badge variant="outline" className={
                  summaryData.followUp.urgency === 'urgent' ? 'text-red-600' :
                  summaryData.followUp.urgency === 'routine' ? 'text-blue-600' :
                  'text-gray-600'
                }>
                  {summaryData.followUp.urgency}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Patient Instructions:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {summaryData.followUp.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-l-yellow-500 p-3">
              <h4 className="font-medium text-yellow-800 mb-1">Important Note:</h4>
              <p className="text-sm text-yellow-700">
                Please contact our office immediately if you experience severe pain, swelling,
                or any concerning symptoms before your next appointment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent & Doctor Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Patient Consent:</h4>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Informed consent obtained on {summaryData.consent.date}
                </span>
              </div>
            </div>

            {summaryData.doctorNotes && (
              <div>
                <h4 className="font-medium mb-2">Doctor's Notes:</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  {summaryData.doctorNotes}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Consultation completed on {summaryData.consultationDate}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/appointments'}>
                Schedule Follow-up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}