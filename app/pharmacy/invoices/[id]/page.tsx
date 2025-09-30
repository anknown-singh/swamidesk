'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CompactPharmacyInvoice } from '@/components/pharmacy/CompactPharmacyInvoice'
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  AlertCircle,
  FileText
} from 'lucide-react'

interface SellOrder {
  id: string
  order_number: string
  customer_name: string
  customer_contact: string
  customer_address: string
  customer_email: string
  sale_date: string
  status: string
  subtotal: number
  total_amount: number
  discount_amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
  sell_order_items: SellOrderItem[]
}

interface SellOrderItem {
  id: string
  medicine_name: string
  salt_content: string
  company_name: string
  quantity: number
  batch_number: string | null
  expiry_date: string | null
  unit_category: string
  sale_unit: string
  mrp: number
  total_price: number
}

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  expiryDate: string
  mrp: number
}

interface CustomerDetails {
  name: string
  address: string
  phone: string
  email?: string
}

export default function PharmacyInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [sellOrder, setSellOrder] = useState<SellOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  const supabase = createClient()

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const fetchSellOrder = async (orderId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('sell_orders')
        .select(`
          *,
          sell_order_items (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Sell order not found')
      }

      setSellOrder(data)
    } catch (err) {
      console.error('Error fetching sell order:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sell order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchSellOrder(resolvedParams.id)
    }
  }, [resolvedParams])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log('Download PDF functionality to be implemented')
  }

  const handleEmail = () => {
    // Implement email functionality
    console.log('Email functionality to be implemented')
  }

  const transformToInvoiceData = (sellOrder: SellOrder): {
    invoiceNumber: string
    date: string
    customerDetails: CustomerDetails
    items: InvoiceItem[]
  } => {
    const invoiceItems: InvoiceItem[] = sellOrder.sell_order_items.map(item => ({
      id: item.id,
      name: `${item.medicine_name} (${item.salt_content}) - ${item.company_name}`,
      quantity: item.quantity,
      expiryDate: item.expiry_date || 'N/A',
      mrp: item.mrp
    }))

    const customerDetails: CustomerDetails = {
      name: sellOrder.customer_name,
      address: sellOrder.customer_address,
      phone: sellOrder.customer_contact,
      email: sellOrder.customer_email || undefined
    }

    return {
      invoiceNumber: sellOrder.order_number,
      date: new Date(sellOrder.sale_date).toLocaleDateString('en-IN'),
      customerDetails,
      items: invoiceItems
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Loading invoice...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!sellOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>Sell order not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if order can have invoice
  const canShowInvoice = ['confirmed', 'shipped', 'delivered'].includes(sellOrder.status)

  if (!canShowInvoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invoice is only available for confirmed or dispensed orders. Current status: {sellOrder.status}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const invoiceData = transformToInvoiceData(sellOrder)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sell Orders
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>

          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>

          {sellOrder.customer_email && (
            <Button
              variant="outline"
              onClick={handleEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Customer
            </Button>
          )}
        </div>
      </div>

      {/* Order Status Info */}
      <Card className="mb-6 print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Invoice for Order {sellOrder.order_number}</h2>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize font-medium">{sellOrder.status}</span> •
                Payment: <span className="capitalize font-medium">{sellOrder.payment_method}</span> •
                Total: <span className="font-medium">₹{sellOrder.total_amount.toFixed(2)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sale Date</p>
              <p className="font-medium">{new Date(sellOrder.sale_date).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Copy */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 print:hidden">Customer Copy</h3>
        <CompactPharmacyInvoice
          invoiceNumber={invoiceData.invoiceNumber}
          date={invoiceData.date}
          customerDetails={invoiceData.customerDetails}
          items={invoiceData.items}
          copyType="customer"
        />
      </div>

      {/* Pharmacy Copy */}
      <div className="print:hidden">
        <h3 className="text-lg font-semibold mb-4">Pharmacy Copy</h3>
        <CompactPharmacyInvoice
          invoiceNumber={invoiceData.invoiceNumber}
          date={invoiceData.date}
          customerDetails={invoiceData.customerDetails}
          items={invoiceData.items}
          copyType="pharmacy"
        />
      </div>

      {/* Additional Order Details */}
      {sellOrder.notes && (
        <Card className="mt-6 print:hidden">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Order Notes</h4>
            <p className="text-sm text-muted-foreground">{sellOrder.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}