'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  PrinterIcon,
  MailIcon,
  ShareIcon,
  DownloadIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon
} from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  category: 'consultation' | 'procedure' | 'medicine' | 'other'
}

interface InvoiceData {
  invoice_number: string
  patient_name: string
  patient_id: string
  patient_phone: string
  patient_email?: string
  visit_date: string
  doctor_name: string
  invoice_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_reference?: string
  notes?: string
  clinic_info: {
    name: string
    address: string
    phone: string
    email: string
    website?: string
    logo?: string
    registration?: string
  }
}

interface InvoiceTemplateProps {
  invoice: InvoiceData
  onPrint?: () => void
  onEmail?: () => void
  onDownload?: () => void
  onShare?: () => void
}

export function InvoiceTemplate({ 
  invoice, 
  onPrint, 
  onEmail, 
  onDownload, 
  onShare 
}: InvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'bg-blue-100 text-blue-800'
      case 'procedure': return 'bg-green-100 text-green-800'
      case 'medicine': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2 print:hidden">
        {onPrint && (
          <Button onClick={onPrint} variant="outline">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        )}
        {onEmail && invoice.patient_email && (
          <Button onClick={onEmail} variant="outline">
            <MailIcon className="h-4 w-4 mr-2" />
            Email to Patient
          </Button>
        )}
        {onDownload && (
          <Button onClick={onDownload} variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} variant="outline">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      {/* Invoice Content */}
      <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              {invoice.clinic_info.logo && (
                <img 
                  src={invoice.clinic_info.logo} 
                  alt="Clinic Logo" 
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.clinic_info.name}
                </h1>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {invoice.clinic_info.address}
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" />
                    {invoice.clinic_info.phone}
                  </div>
                  <div>{invoice.clinic_info.email}</div>
                  {invoice.clinic_info.website && (
                    <div>{invoice.clinic_info.website}</div>
                  )}
                  {invoice.clinic_info.registration && (
                    <div className="text-xs">Reg. No: {invoice.clinic_info.registration}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h2>
              <div className="text-sm space-y-1">
                <div className="font-semibold">#{invoice.invoice_number}</div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Date: {formatDate(invoice.invoice_date)}
                </div>
                <div>Due: {formatDate(invoice.due_date)}</div>
              </div>
            </div>
          </div>

          {/* Patient & Visit Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Bill To
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-lg">{invoice.patient_name}</div>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <div>Patient ID: {invoice.patient_id}</div>
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" />
                    {invoice.patient_phone}
                  </div>
                  {invoice.patient_email && (
                    <div>
                      <MailIcon className="h-3 w-3 inline mr-1" />
                      {invoice.patient_email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Visit Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Visit Date:</span>
                    <span className="ml-2">{formatDate(invoice.visit_date)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Attending Doctor:</span>
                    <span className="ml-2">{invoice.doctor_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Payment Method:</span>
                    <span className="ml-2 capitalize">{invoice.payment_method}</span>
                  </div>
                  {invoice.payment_reference && (
                    <div>
                      <span className="font-medium">Reference:</span>
                      <span className="ml-2">{invoice.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Services & Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold">Description</th>
                    <th className="text-center py-3 px-2 font-semibold">Category</th>
                    <th className="text-center py-3 px-2 font-semibold">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold">Unit Price</th>
                    <th className="text-right py-3 px-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-2">
                        <div className="font-medium">{item.description}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge className={getCategoryBadgeColor(item.category)}>
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-2 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-md">
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span>Tax (GST {(invoice.tax_rate * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-200">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-800">Payment Completed</span>
              </div>
              <div className="text-sm text-green-700 mt-1">
                Paid via {invoice.payment_method} on {formatDate(invoice.invoice_date)}
                {invoice.payment_reference && ` (Ref: ${invoice.payment_reference})`}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Thank you for choosing {invoice.clinic_info.name}</p>
              <p>For any queries regarding this invoice, please contact us at {invoice.clinic_info.phone}</p>
              <div className="mt-4 text-xs">
                <p>This is a computer-generated invoice and does not require a signature.</p>
                <p>Generated on {new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}