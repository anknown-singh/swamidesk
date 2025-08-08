'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  IndianRupeeIcon, 
  PrinterIcon,
  MailIcon,
  UserIcon,
  ActivityIcon,
  PillIcon,
  FileTextIcon,
  CheckCircleIcon
} from 'lucide-react'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { toast } from '@/lib/toast'
import { workflowManager } from '@/lib/workflow-manager'

interface Patient {
  id: string
  full_name: string
  phone: string
  email?: string
}

interface Doctor {
  id: string
  full_name: string
}

interface BillablePatient {
  id: string
  patient_id: string
  appointment_id: string
  opd_status: 'completed'
  visit_date: string
  chief_complaint: string
  diagnosis: string
  treatment_plan: string
  requires_procedures: boolean
  requires_medicines: boolean
  procedure_quotes: Array<{
    status?: string
    service_name?: string
    diagnosis_reason?: string
    custom_price?: number
  }>
  prescription_notes: string
  consultation_fee: number
  created_at: string
  patients?: Patient
  doctors?: Doctor
}

interface BillItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  category: 'consultation' | 'procedure' | 'medicine' | 'other'
}

interface Invoice {
  patient_id: string
  patient_name: string
  visit_date: string
  items: BillItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_reference?: string
  notes?: string
}

const CONSULTATION_FEE = 500 // Base consultation fee
const TAX_RATE = 0.18 // 18% GST

export function IntegratedBilling() {
  const [billablePatients, setBillablePatients] = useState<BillablePatient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<BillablePatient | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')

  const fetchBillablePatients = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createAuthenticatedClient()
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('opd_records')
        .select(`
          *,
          patients(id, full_name, phone, email),
          doctors:users!doctor_id(id, full_name)
        `)
        .eq('opd_status', 'completed')
        .gte('visit_date', today)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBillablePatients(data || [])
    } catch (error) {
      console.error('Error fetching billable patients:', error)
      toast.error('Failed to load billable patients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBillablePatients()
  }, [fetchBillablePatients])

  const generateInvoice = useCallback((patient: BillablePatient): Invoice => {
    const items: BillItem[] = []

    // Add consultation fee
    items.push({
      id: 'consultation',
      description: 'Medical Consultation',
      quantity: 1,
      unit_price: CONSULTATION_FEE,
      total: CONSULTATION_FEE,
      category: 'consultation'
    })

    // Add approved procedures
    if (patient.procedure_quotes && patient.procedure_quotes.length > 0) {
      patient.procedure_quotes
        .filter(quote => quote.status === 'approved')
        .forEach((quote, index) => {
          items.push({
            id: `procedure_${index}`,
            description: `${quote.service_name} - ${quote.diagnosis_reason}`,
            quantity: 1,
            unit_price: quote.custom_price,
            total: quote.custom_price,
            category: 'procedure'
          })
        })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const discountAmount = (subtotal * discount) / 100
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * TAX_RATE
    const totalAmount = taxableAmount + taxAmount

    return {
      patient_id: patient.patient_id,
      patient_name: patient.patients?.full_name || 'Unknown Patient',
      visit_date: patient.visit_date,
      items,
      subtotal,
      tax_rate: TAX_RATE,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      notes
    }
  }, [discount, paymentMethod, paymentReference, notes])

  const handleGenerateBill = (patient: BillablePatient) => {
    setSelectedPatient(patient)
    const generatedInvoice = generateInvoice(patient)
    setInvoice(generatedInvoice)
  }

  const handleProcessPayment = async () => {
    if (!selectedPatient || !invoice) return

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setGenerating(true)
    try {
      const supabase = createAuthenticatedClient()

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`

      // Create invoice record
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: invoice.patient_id,
          visit_date: invoice.visit_date,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          discount_amount: invoice.discount_amount,
          total_amount: invoice.total_amount,
          payment_method: invoice.payment_method,
          payment_reference: invoice.payment_reference,
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
          notes: invoice.notes,
          bill_items: invoice.items
        })
        .select()

      if (invoiceError) throw invoiceError

      // Complete billing workflow
      const billingResult = await workflowManager.completeBilling(
        selectedPatient.patient_id,
        invoiceNumber,
        invoice.total_amount,
        paymentMethod
      )

      if (!billingResult.success) {
        throw new Error(billingResult.message)
      }

      toast.success(`Payment processed successfully! ${billingResult.message}`)
      
      // Reset form and refresh patients
      setSelectedPatient(null)
      setInvoice(null)
      setPaymentMethod('')
      setPaymentReference('')
      setDiscount(0)
      setNotes('')
      fetchBillablePatients()

    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrintBill = () => {
    if (!invoice) return
    
    // Create a printable bill format
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; color: #333;">Swamidesk Clinic</h2>
        <h3 style="text-align: center; color: #666;">Invoice</h3>
        
        <div style="margin: 20px 0;">
          <strong>Patient:</strong> ${invoice.patient_name}<br>
          <strong>Date:</strong> ${new Date(invoice.visit_date).toLocaleDateString()}<br>
          <strong>Payment Method:</strong> ${invoice.payment_method}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.total.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Subtotal</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">₹${invoice.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${invoice.discount_amount > 0 ? `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Discount</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-₹${invoice.discount_amount.toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Tax (18% GST)</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${invoice.tax_amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; font-size: 16px;">Total</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; font-size: 16px;">₹${invoice.total_amount.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          Thank you for choosing Swamidesk Clinic
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Billing System...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading billable patients...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Invoice generation view
  if (selectedPatient && invoice) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
            <p className="text-muted-foreground">
              Complete billing for {selectedPatient.patients?.full_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedPatient(null)}>
            Back to Queue
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient & Visit Info */}
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
                  <div><strong>Name:</strong> {selectedPatient.patients?.full_name}</div>
                  <div><strong>Phone:</strong> {selectedPatient.patients?.phone}</div>
                  <div><strong>Visit Date:</strong> {new Date(selectedPatient.visit_date).toLocaleDateString()}</div>
                  <div><strong>Doctor:</strong> {selectedPatient.doctors?.full_name}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clinical Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Chief Complaint</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPatient.chief_complaint}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Diagnosis</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPatient.diagnosis}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-method">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                    <Input
                      id="payment-reference"
                      placeholder="Transaction ID, check number, etc."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bill Items */}
                  <div className="space-y-2">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.description}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    
                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Tax (GST 18%):</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span className="text-green-600">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button 
                    onClick={handleProcessPayment}
                    disabled={generating || !paymentMethod}
                    className="w-full"
                  >
                    {generating ? 'Processing Payment...' : `Process Payment ${formatCurrency(invoice.total_amount)}`}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handlePrintBill}
                      className="flex-1"
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print Bill
                    </Button>
                    
                    {selectedPatient.patients?.email && (
                      <Button 
                        variant="outline"
                        onClick={() => toast.info('Email feature coming soon')}
                        className="flex-1"
                      >
                        <MailIcon className="h-4 w-4 mr-2" />
                        Email Bill
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main billing queue
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrated Billing System</h1>
          <p className="text-muted-foreground">
            Complete billing with consultation fees and approved procedures
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <FileTextIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{billablePatients.length}</div>
            <p className="text-xs text-muted-foreground">patients ready for billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <IndianRupeeIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                billablePatients.reduce((sum, patient) => {
                  const invoice = generateInvoice(patient)
                  return sum + invoice.total_amount
                }, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">pending revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Procedures</CardTitle>
            <ActivityIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {billablePatients.filter(p => p.requires_procedures && p.procedure_quotes.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">patients with procedures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Medicines</CardTitle>
            <PillIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {billablePatients.filter(p => p.requires_medicines).length}
            </div>
            <p className="text-xs text-muted-foreground">patients with medicines</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Queue</CardTitle>
          <CardDescription>
            Patients who have completed treatment and are ready for billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billablePatients.map((patient) => {
              const previewInvoice = generateInvoice(patient)
              const procedureCount = patient.procedure_quotes?.filter(q => q.status === 'approved').length || 0

              return (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{patient.patients?.full_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {new Date(patient.visit_date).toLocaleDateString()}
                      </Badge>
                      {procedureCount > 0 && (
                        <Badge variant="secondary">
                          {procedureCount} procedure{procedureCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {patient.requires_medicines && (
                        <Badge variant="outline" className="bg-green-50">
                          <PillIcon className="h-3 w-3 mr-1" />
                          Medicines
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Doctor: {patient.doctors?.full_name}</div>
                      <div>Diagnosis: {patient.diagnosis}</div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <IndianRupeeIcon className="h-3 w-3" />
                          Total: {formatCurrency(previewInvoice.total_amount)}
                        </span>
                        <span className="text-xs">
                          Created: {new Date(patient.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => handleGenerateBill(patient)}>
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Generate Bill
                  </Button>
                </div>
              )
            })}

            {billablePatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No pending bills</p>
                <p className="text-sm">All patients have been billed or are still in treatment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}