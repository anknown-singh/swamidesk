'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Receipt, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
}

interface Visit {
  id: string
  visit_number: string
  visit_date: string
  status: string
  patients: Patient
}

interface Service {
  id: string
  name: string
  price: number
}

interface VisitService {
  id: string
  price: number
  services: Service
}

interface Prescription {
  id: string
  quantity: number
  medicines: {
    name: string
    unit_price: number
  }
}

interface Invoice {
  id: string
  invoice_number: string
  visit_id: string
  patient_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_status: 'pending' | 'partial' | 'completed' | 'refunded'
  payment_method: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer'
  payment_date: string
  payment_reference: string
  notes: string
  created_at: string
  visits: Visit
  patients: Patient
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [unbilledVisits, setUnbilledVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [visitServices, setVisitServices] = useState<VisitService[]>([])
  const [visitPrescriptions, setVisitPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(18) // 18% GST
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchInvoices()
    fetchUnbilledVisits()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          visits (
            id,
            visit_number,
            visit_date,
            status,
            patients (
              id,
              patient_number,
              first_name,
              last_name
            )
          ),
          patients (
            id,
            patient_number,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnbilledVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (
            id,
            patient_number,
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed')
        .is('id', null) // This would need a proper join to check if invoice exists
        .order('visit_date', { ascending: false })

      if (error) throw error
      
      // Filter out visits that already have invoices
      const existingInvoiceVisitIds = invoices.map(inv => inv.visit_id)
      const unbilled = (data || []).filter(visit => !existingInvoiceVisitIds.includes(visit.id))
      
      setUnbilledVisits(unbilled)
    } catch (error) {
      console.error('Error fetching unbilled visits:', error)
    }
  }


  const fetchVisitDetails = async (visit: Visit) => {
    try {
      // Fetch visit services
      const { data: servicesData, error: servicesError } = await supabase
        .from('visit_services')
        .select(`
          *,
          services (
            id,
            name,
            price
          )
        `)
        .eq('visit_id', visit.id)

      if (servicesError) throw servicesError
      setVisitServices(servicesData || [])

      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medicines (
            name,
            unit_price
          )
        `)
        .eq('visit_id', visit.id)

      if (prescriptionsError) throw prescriptionsError
      setVisitPrescriptions(prescriptionsData || [])

      setSelectedVisit(visit)
      setShowForm(true)
    } catch (error) {
      console.error('Error fetching visit details:', error)
      setError('Failed to load visit details')
    }
  }

  const calculateSubtotal = () => {
    const servicesTotal = visitServices.reduce((sum, vs) => sum + (vs.price || 0), 0)
    const medicinesTotal = visitPrescriptions.reduce((sum, p) => sum + (p.quantity * p.medicines.unit_price), 0)
    return servicesTotal + medicinesTotal
  }

  const calculateTax = (subtotal: number) => {
    return (subtotal * tax) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxAmount = calculateTax(subtotal)
    return subtotal + taxAmount - discount
  }

  const generateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedVisit || !paymentMethod) {
      setError('Please select payment method')
      return
    }

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem('swamicare_user')
      const user = userData ? JSON.parse(userData) : null

      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax(subtotal)
      const totalAmount = calculateTotal()

      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          visit_id: selectedVisit.id,
          patient_id: selectedVisit.patients.id,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discount,
          total_amount: totalAmount,
          payment_status: 'completed', // Assuming immediate payment
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          payment_reference: paymentReference,
          notes: notes,
          created_by: user?.id
        }])
        .select()

      if (error) throw error

      // Update visit status to billed
      await supabase
        .from('visits')
        .update({ status: 'billed' })
        .eq('id', selectedVisit.id)

      setSuccess(`Invoice generated successfully! Invoice #${data[0].invoice_number}. Patient cycle complete.`)
      setShowForm(false)
      setSelectedVisit(null)
      setVisitServices([])
      setVisitPrescriptions([])
      setDiscount(0)
      setPaymentMethod('')
      setPaymentReference('')
      setNotes('')
      
      fetchInvoices()
      fetchUnbilledVisits()
    } catch (error) {
      console.error('Error generating invoice:', error)
      setError('Failed to generate invoice')
    }
  }

  const updatePaymentStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          payment_status: newStatus,
          payment_date: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', invoiceId)

      if (error) throw error
      
      setSuccess('Payment status updated')
      fetchInvoices()
    } catch (error) {
      console.error('Error updating payment status:', error)
      setError('Failed to update payment status')
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'partial': return <AlertCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'refunded': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.patients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.patients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.patients.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingAmount = invoices.filter(inv => inv.payment_status === 'pending').reduce((sum, inv) => sum + inv.total_amount, 0)
  const completedAmount = invoices.filter(inv => inv.payment_status === 'completed').reduce((sum, inv) => sum + inv.total_amount, 0)
  const todayAmount = invoices.filter(inv => 
    new Date(inv.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum, inv) => sum + inv.total_amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading billing data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage patient billing and payment processing</p>
        </div>
        <div className="text-sm text-gray-600">
          {unbilledVisits.length} unbilled visits
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>{success}</span>
            {success.includes('Patient cycle complete') && (
              <Button size="sm" onClick={() => router.push('/receptionist/queue')}>
                Return to Queue
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{todayAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Payments</p>
                <p className="text-2xl font-bold text-blue-600">₹{completedAmount.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unbilled Visits */}
      {unbilledVisits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              Unbilled Visits ({unbilledVisits.length})
            </CardTitle>
            <CardDescription>Completed visits that need billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unbilledVisits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-4 hover:bg-orange-50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">
                          {visit.patients.first_name} {visit.patients.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{visit.patients.patient_number}</p>
                      </div>
                      <span className="text-xs text-gray-500">{visit.visit_number}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Visit Date: {new Date(visit.visit_date).toLocaleDateString()}
                    </p>
                    
                    <Button 
                      size="sm" 
                      onClick={() => fetchVisitDetails(visit)}
                      className="w-full"
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Generation Form */}
      {showForm && selectedVisit && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Invoice</CardTitle>
            <CardDescription>
              Patient: {selectedVisit.patients.first_name} {selectedVisit.patients.last_name} • 
              Visit: {selectedVisit.visit_number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={generateInvoice} className="space-y-6">
              {/* Services & Medicines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Services</h4>
                  <div className="space-y-2">
                    {visitServices.length > 0 ? (
                      visitServices.map((vs) => (
                        <div key={vs.id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{vs.services.name}</span>
                          <span>₹{vs.price?.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No services</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Medicines</h4>
                  <div className="space-y-2">
                    {visitPrescriptions.length > 0 ? (
                      visitPrescriptions.map((p) => (
                        <div key={p.id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{p.medicines.name} (x{p.quantity})</span>
                          <span>₹{(p.quantity * p.medicines.unit_price).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No medicines</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount">Discount Amount (₹)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tax">Tax Rate (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({tax}%):</span>
                      <span>₹{calculateTax(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <select
                    id="payment_method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select payment method...</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="payment_reference">Payment Reference</Label>
                  <Input
                    id="payment_reference"
                    placeholder="Transaction ID, Check number, etc."
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                  placeholder="Additional notes or comments..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Generate Invoice</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
          <CardDescription>
            <div className="flex items-center gap-4 mt-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search invoices by patient name, ID, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <span className="text-sm">
                {filteredInvoices.length} invoices found
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {invoice.patients.first_name} {invoice.patients.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {invoice.patients.patient_number} • {invoice.invoice_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getPaymentStatusColor(invoice.payment_status)}`}>
                        {getPaymentStatusIcon(invoice.payment_status)}
                        {invoice.payment_status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <p className="font-bold">₹{invoice.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Payment Method:</span>
                        <p className="capitalize">{invoice.payment_method}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Invoice Date:</span>
                        <p>{new Date(invoice.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Visit Date:</span>
                        <p>{new Date(invoice.visits.visit_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {invoice.payment_reference && (
                      <p className="text-xs text-gray-500">
                        Reference: {invoice.payment_reference}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {invoice.payment_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updatePaymentStatus(invoice.id, 'completed')}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No invoices found matching your search' : 'No invoices generated yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}