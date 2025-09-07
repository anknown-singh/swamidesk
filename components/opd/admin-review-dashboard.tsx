'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  IndianRupeeIcon,
  ClockIcon,
  UserIcon,
  StethoscopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  FileTextIcon,
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { WorkflowManager } from '@/lib/workflow-manager'

interface Patient {
  id: string
  full_name: string
  phone: string
  email?: string
}

interface Doctor {
  id: string
  full_name: string
  email: string
}

interface ProcedureQuote {
  id?: string
  service_id: string
  service_name: string
  diagnosis_reason: string
  custom_price: number
  estimated_duration: number
  doctor_notes: string
  urgency: 'low' | 'medium' | 'high'
  status: 'quoted' | 'admin_review' | 'approved' | 'rejected'
}

interface OPDRecord {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  chief_complaint: string
  examination_findings: string
  diagnosis: string
  treatment_plan: string
  procedure_quotes: ProcedureQuote[]
  requires_medicines: boolean
  opd_status: 'consultation' | 'procedures_pending' | 'admin_review' | 'pharmacy_pending' | 'completed'
  created_at: string
  patients?: Patient
  doctors?: Doctor
}

export function AdminReviewDashboard() {
  const [reviewQueue, setReviewQueue] = useState<OPDRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<OPDRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchReviewQueue = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      
      const { data, error } = await supabase
        .from('opd_records')
        .select(`
          *,
          patients(id, full_name, phone, email),
          doctors:users!doctor_id(id, full_name, email)
        `)
        .eq('opd_status', 'admin_review')
        .order('created_at', { ascending: true })

      if (error) throw error

      setReviewQueue(data || [])
    } catch (error) {
      console.error('Error fetching review queue:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviewQueue()
    // Refresh every 30 seconds
    const interval = setInterval(fetchReviewQueue, 30000)
    return () => clearInterval(interval)
  }, [fetchReviewQueue])

  const handleUpdateProcedureQuote = (recordId: string, procedureIndex: number, updates: Partial<ProcedureQuote>) => {
    setReviewQueue(prev => prev.map(record => {
      if (record.id === recordId) {
        const updatedQuotes = record.procedure_quotes.map((quote, index) => 
          index === procedureIndex ? { ...quote, ...updates } : quote
        )
        return { ...record, procedure_quotes: updatedQuotes }
      }
      return record
    }))

    if (selectedRecord && selectedRecord.id === recordId) {
      const updatedQuotes = selectedRecord.procedure_quotes.map((quote, index) => 
        index === procedureIndex ? { ...quote, ...updates } : quote
      )
      setSelectedRecord({ ...selectedRecord, procedure_quotes: updatedQuotes })
    }
  }

  const handleSaveReview = async (record: OPDRecord) => {
    setUpdating(true)
    try {
      // Check if all procedures are reviewed
      const allReviewed = record.procedure_quotes.every(quote => 
        quote.status === 'approved' || quote.status === 'rejected'
      )

      if (!allReviewed) {
        return
      }

      const approvedProcedures = record.procedure_quotes.filter(quote => quote.status === 'approved')
      const hasRejectedProcedures = record.procedure_quotes.some(quote => quote.status === 'rejected')

      // Use workflow manager to handle admin approval
      const workflowManager = new WorkflowManager()
      const routingResult = await workflowManager.handleAdminApproval(
        record.patient_id,
        approvedProcedures,
        hasRejectedProcedures,
        record.requires_medicines
      )

      if (!routingResult.success) {
        throw new Error(routingResult.message)
      }

      // Update the database record
      const supabase = createAuthenticatedClient()
      const { error } = await supabase
        .from('opd_records')
        .update({
          procedure_quotes: record.procedure_quotes,
          admin_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)

      if (error) throw error

      
      // Refresh the queue
      fetchReviewQueue()
      setSelectedRecord(null)

    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admin_review': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}m`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Admin Review Dashboard...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading procedure reviews...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detail view for selected record
  if (selectedRecord) {
    const totalQuote = selectedRecord.procedure_quotes.reduce((sum, quote) => sum + quote.custom_price, 0)
    const totalDuration = selectedRecord.procedure_quotes.reduce((sum, quote) => sum + quote.estimated_duration, 0)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Review - Procedure Pricing</h1>
            <p className="text-muted-foreground">
              Review and approve final pricing for patient procedures
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedRecord(null)}>
            Back to Queue
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient & Clinical Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedRecord.patients?.full_name}</div>
                  <div><strong>Phone:</strong> {selectedRecord.patients?.phone}</div>
                  <div><strong>Visit Date:</strong> {new Date(selectedRecord.visit_date).toLocaleDateString()}</div>
                  <div><strong>Doctor:</strong> {selectedRecord.doctors?.full_name}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clinical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Chief Complaint</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRecord.chief_complaint}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Diagnosis</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRecord.diagnosis}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Treatment Plan</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRecord.treatment_plan}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Procedure Review */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Procedure Quotes for Review</CardTitle>
                <CardDescription>
                  Review doctor&apos;s quotes and set final pricing for billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedRecord.procedure_quotes.map((quote, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{quote.service_name}</h4>
                            <Badge variant="outline" className={getUrgencyColor(quote.urgency)}>
                              {quote.urgency} priority
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(quote.status)}>
                              {quote.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div><strong>Reason:</strong> {quote.diagnosis_reason}</div>
                            {quote.doctor_notes && (
                              <div><strong>Doctor Notes:</strong> {quote.doctor_notes}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pricing Review Section */}
                      <div className="bg-orange-50 p-3 rounded border">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label className="text-sm font-medium">Doctor&apos;s Quote</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <IndianRupeeIcon className="h-4 w-4 text-gray-600" />
                              <span className="text-lg font-medium text-gray-600">
                                ₹{quote.custom_price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Duration</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <ClockIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-600">{formatDuration(quote.estimated_duration)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Final Price (Admin Decision)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={quote.custom_price}
                              onChange={(e) => handleUpdateProcedureQuote(
                                selectedRecord.id, 
                                index, 
                                { custom_price: Number(e.target.value) || 0 }
                              )}
                              className="mt-1"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateProcedureQuote(
                                selectedRecord.id, 
                                index, 
                                { status: 'approved' }
                              )}
                              disabled={quote.status === 'approved'}
                              className="flex-1"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateProcedureQuote(
                                selectedRecord.id, 
                                index, 
                                { status: 'rejected' }
                              )}
                              disabled={quote.status === 'rejected'}
                              className="flex-1"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Final Quote:</span>
                      <div className="flex items-center gap-4">
                        <span className="text-green-600">₹{totalQuote.toLocaleString('en-IN')}</span>
                        <span className="text-blue-600">{formatDuration(totalDuration)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      This will be added to the patient&apos;s final bill
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Review */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={() => handleSaveReview(selectedRecord)}
                  disabled={updating || selectedRecord.procedure_quotes.some(q => q.status === 'admin_review')}
                  className="w-full"
                >
                  {updating ? 'Saving Review...' : 'Complete Review & Route Patient'}
                </Button>
                {selectedRecord.procedure_quotes.some(q => q.status === 'admin_review') && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Please approve or reject all procedures before completing review
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Review Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve procedure quotes from doctors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reviewQueue.length}</div>
            <p className="text-xs text-muted-foreground">procedures awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviewQueue.reduce((sum, record) => sum + record.procedure_quotes.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">individual procedure quotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <IndianRupeeIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{reviewQueue.reduce((sum, record) => 
                sum + record.procedure_quotes.reduce((procSum, quote) => procSum + quote.custom_price, 0), 0
              ).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">pending review value</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Procedure Review Queue</CardTitle>
          <CardDescription>
            Cases requiring admin review and final pricing approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewQueue.map((record) => {
              const totalQuote = record.procedure_quotes.reduce((sum, quote) => sum + quote.custom_price, 0)
              const procedureCount = record.procedure_quotes.length

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{record.patients?.full_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {new Date(record.visit_date).toLocaleDateString()}
                      </Badge>
                      <Badge variant="secondary">
                        {procedureCount} procedure{procedureCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Doctor: {record.doctors?.full_name}</div>
                      <div>Diagnosis: {record.diagnosis}</div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <IndianRupeeIcon className="h-3 w-3" />
                          ₹{totalQuote.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs">
                          Submitted: {new Date(record.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedRecord(record)}>
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Review Pricing
                  </Button>
                </div>
              )
            })}

            {reviewQueue.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No procedures pending review.</p>
                <p className="text-sm">Completed reviews will be automatically routed to next department.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}