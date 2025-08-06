'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Search, DollarSign, FileText, Calendar, User, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

interface Invoice {
  id: string
  patient_id: string
  visit_id: string | null
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
  payment_method: string | null
  notes: string | null
  created_at: string
  patients: {
    id: string
    patient_id: string
    full_name: string
    phone: string
    email: string
  }
  visits: {
    id: string
    visit_date: string
    doctor_id: string
    users: {
      id: string
      full_name: string
    }
  } | null
  invoice_items: Array<{
    id: string
    item_type: 'consultation' | 'prescription' | 'procedure' | 'service' | 'other'
    description: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients (
            id,
            patient_id,
            full_name,
            phone,
            email
          ),
          visits (
            id,
            visit_date,
            doctor_id,
            users!visits_doctor_id_fkey (
              id,
              full_name
            )
          ),
          invoice_items (
            id,
            item_type,
            description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
      case 'paid':
        return { color: 'bg-green-100 text-green-800', label: 'Paid', icon: CheckCircle }
      case 'partially_paid':
        return { color: 'bg-blue-100 text-blue-800', label: 'Partially Paid', icon: AlertCircle }
      case 'overdue':
        return { color: 'bg-red-100 text-red-800', label: 'Overdue', icon: AlertCircle }
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: FileText }
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.patients.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.visits?.users?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || invoice.payment_status === filterStatus
    const matchesPaymentMethod = filterPaymentMethod === 'all' || 
                                invoice.payment_method === filterPaymentMethod ||
                                (filterPaymentMethod === 'none' && !invoice.payment_method)
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = invoice.invoice_date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(invoice.invoice_date) >= weekAgo
    } else if (dateFilter === 'this_month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(invoice.invoice_date) >= monthAgo
    } else if (dateFilter === 'overdue') {
      matchesDate = new Date(invoice.due_date) < new Date() && 
                   ['pending', 'partially_paid'].includes(invoice.payment_status)
    }
    
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
  })

  const totalInvoices = invoices.length
  const pendingCount = invoices.filter(i => i.payment_status === 'pending').length
  const paidCount = invoices.filter(i => i.payment_status === 'paid').length
  const overdueCount = invoices.filter(i => 
    new Date(i.due_date) < new Date() && ['pending', 'partially_paid'].includes(i.payment_status)
  ).length

  const totalRevenue = invoices
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const pendingRevenue = invoices
    .filter(i => ['pending', 'partially_paid', 'overdue'].includes(i.payment_status))
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  // Get unique payment methods for filter
  const paymentMethods = Array.from(new Set(invoices.map(i => i.payment_method).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading invoices...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoice Management</h1>
          <p className="text-muted-foreground">Administrative view of all patient billing and payments</p>
        </div>
        <Button onClick={() => window.location.href = '/receptionist/billing'} className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{paidCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Pending Revenue</p>
              <p className="text-xl font-bold text-yellow-600">₹{pendingRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, invoice number, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Payment Methods</option>
              <option value="none">No Payment Method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredInvoices.length} invoices found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.payment_status)
              const StatusIcon = statusConfig.icon
              const isOverdue = new Date(invoice.due_date) < new Date() && 
                              ['pending', 'partially_paid'].includes(invoice.payment_status)
              
              return (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">#{invoice.invoice_number}</h3>
                          <p className="text-sm text-gray-600">
                            {invoice.patients.full_name} • ID: {invoice.patients.patient_id}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>
                        {isOverdue && (
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            OVERDUE
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">₹{invoice.total_amount?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">{invoice.invoice_items.length} items</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Invoice Date:</span>
                            <p>{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Due Date:</span>
                            <p className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p>{invoice.visits?.users?.full_name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Payment Method:</span>
                            <p>{invoice.payment_method || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Contact:</span>
                            <p>{invoice.patients.phone || invoice.patients.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Subtotal:</span>
                          <p>₹{invoice.subtotal?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Tax:</span>
                          <p>₹{invoice.tax_amount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Discount:</span>
                          <p>₹{invoice.discount_amount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Visit Date:</span>
                          <p>{invoice.visits?.visit_date ? 
                              new Date(invoice.visits.visit_date).toLocaleDateString() 
                              : 'N/A'}</p>
                        </div>
                      </div>

                      {/* Invoice Items */}
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Invoice Items:</span>
                        <div className="mt-2 space-y-1">
                          {invoice.invoice_items.slice(0, 3).map((item, index) => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium capitalize">{item.item_type}</span>: {item.description}
                                <span className="text-gray-600"> (Qty: {item.quantity})</span>
                              </div>
                              <span className="font-medium">₹{item.total_price?.toFixed(2) || '0.00'}</span>
                            </div>
                          ))}
                          {invoice.invoice_items.length > 3 && (
                            <div className="text-gray-600 text-center">
                              +{invoice.invoice_items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {invoice.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-600 mt-1">{invoice.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No invoices found matching your search' : 'No invoices created yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}