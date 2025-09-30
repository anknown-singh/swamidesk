'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Search,
  Eye,
  Download,
  Mail,
  Calendar,
  User,
  Phone,
  AlertCircle,
  Plus
} from 'lucide-react'

interface SellOrderInvoice {
  id: string
  sell_order_id: string
  invoice_number: string
  invoice_date: string
  customer_name: string
  customer_contact: string
  customer_email: string
  total_amount: number
  payment_status: string
  payment_method: string
  created_at: string
  sell_orders: {
    order_number: string
    status: string
    sale_date: string
  }
}

export default function PharmacyInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<SellOrderInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<SellOrderInvoice[]>([])

  const supabase = createClient()

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('sell_order_invoices')
        .select(`
          *,
          sell_orders (
            order_number,
            status,
            sale_date
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setInvoices(data || [])
      setFilteredInvoices(data || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices)
    } else {
      const filtered = invoices.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.sell_orders.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredInvoices(filtered)
    }
  }, [searchTerm, invoices])

  const getPaymentStatusBadge = (status: string) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const handleViewInvoice = (sellOrderId: string) => {
    router.push(`/pharmacy/invoices/${sellOrderId}`)
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Download invoice:', invoiceId)
    // Implement PDF download functionality
  }

  const handleEmailInvoice = (invoiceId: string) => {
    console.log('Email invoice:', invoiceId)
    // Implement email functionality
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Loading invoices...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Invoices</h1>
          <p className="text-gray-600">Manage and view all pharmacy invoices</p>
        </div>
        <Button
          onClick={() => router.push('/pharmacy/sell-orders')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Sale
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, customer name, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.payment_status === 'paid').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {invoices.filter(inv => inv.payment_status === 'pending').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm ? 'No invoices found matching your search' : 'No invoices found'}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/pharmacy/sell-orders')}
              >
                Create Your First Sale Order
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {invoice.invoice_number}
                        </h3>
                        <Badge className={getPaymentStatusBadge(invoice.payment_status)}>
                          {invoice.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{invoice.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{invoice.customer_contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Order: {invoice.sell_orders.order_number}
                          </span>
                          <span className="text-gray-600">
                            Payment: {invoice.payment_method || 'Not specified'}
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          ₹{invoice.total_amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewInvoice(invoice.sell_order_id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                      {invoice.customer_email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmailInvoice(invoice.id)}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}