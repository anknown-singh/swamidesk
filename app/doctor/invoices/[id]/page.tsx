'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Building2
} from 'lucide-react'

interface ConsultationInvoice {
  id: string
  appointment_id: string
  consultation_session_id: string
  invoice_number: string
  invoice_date: string
  patient_name: string
  patient_contact: string
  patient_address: string
  patient_email: string
  doctor_name: string
  department: string
  consultation_fee: number
  additional_charges: number
  discount_amount: number
  total_amount: number
  payment_status: string
  payment_method: string
  consultation_date: string
  consultation_duration: number
  notes: string
  created_at: string
}

export default function DoctorInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<ConsultationInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  const supabase = createClient()

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('consultation_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Invoice not found')
      }

      setInvoice(data)
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchInvoice(resolvedParams.id)
    }
  }, [resolvedParams])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    console.log('Download PDF functionality to be implemented')
  }

  const handleEmail = () => {
    console.log('Email functionality to be implemented')
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

  if (!invoice) {
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
          <AlertDescription>Invoice not found</AlertDescription>
        </Alert>
      </div>
    )
  }

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
          Back to OPD
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

          {invoice.patient_email && (
            <Button
              variant="outline"
              onClick={handleEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Patient
            </Button>
          )}
        </div>
      </div>

      {/* Invoice */}
      <Card className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 border-b border-gray-200 print:bg-white print:border-b print:border-gray-400">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-blue-900">SwamiDesk Hospital</h1>
              <p className="text-blue-700 mt-1">Your Health, Our Priority</p>
              <div className="mt-4 text-sm text-blue-600 space-y-1">
                <p className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  123 Medical Street, Healthcare District
                </p>
                <p className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  City - 123456 | +91 98765 43210
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white border border-blue-300 rounded-lg p-4 shadow-sm print:shadow-none">
                <p className="text-xs text-blue-500 uppercase tracking-wide">Consultation Invoice</p>
                <p className="font-bold text-blue-900 mt-1 text-lg">{invoice.invoice_number}</p>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Patient and Doctor Details */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">Patient Information</h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {invoice.patient_name}
                </p>
                <p className="text-gray-600 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {invoice.patient_contact}
                </p>
                {invoice.patient_address && (
                  <p className="text-gray-600 flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                    <span className="leading-relaxed">{invoice.patient_address}</span>
                  </p>
                )}
                {invoice.patient_email && (
                  <p className="text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {invoice.patient_email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">Doctor & Consultation</h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900 flex items-center">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Dr. {invoice.doctor_name}
                </p>
                <p className="text-gray-600 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  {invoice.department}
                </p>
                <p className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(invoice.consultation_date).toLocaleDateString('en-IN')}
                </p>
                {invoice.consultation_duration && (
                  <p className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {invoice.consultation_duration} minutes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Details</h3>

          <div className="overflow-hidden border border-gray-200 rounded-lg print:border-gray-400">
            <table className="w-full">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Service</th>
                  <th className="text-center py-4 px-4 text-sm font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Duration</th>
                  <th className="text-right py-4 px-4 text-sm font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 print:border-b print:border-gray-200">
                    {invoice.department} Consultation
                  </td>
                  <td className="py-4 px-4 text-sm text-center text-gray-700 print:border-b print:border-gray-200">
                    {invoice.consultation_duration ? `${invoice.consultation_duration} min` : 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-sm text-right font-medium text-gray-900 print:border-b print:border-gray-200">
                    ₹{invoice.consultation_fee.toFixed(2)}
                  </td>
                </tr>
                {invoice.additional_charges > 0 && (
                  <tr>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 print:border-b print:border-gray-200">
                      Additional Charges
                    </td>
                    <td className="py-4 px-4 text-sm text-center text-gray-700 print:border-b print:border-gray-200">
                      -
                    </td>
                    <td className="py-4 px-4 text-sm text-right font-medium text-gray-900 print:border-b print:border-gray-200">
                      ₹{invoice.additional_charges.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 print:bg-white print:border-t print:border-gray-400">
          <div className="flex justify-between items-start">
            <div className="text-sm text-gray-600 max-w-xs">
              <p className="mb-2">
                <strong>Payment Status:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  invoice.payment_status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.payment_status.toUpperCase()}
                </span>
              </p>
              {invoice.payment_method && (
                <p className="mb-2">
                  <strong>Payment Method:</strong> {invoice.payment_method}
                </p>
              )}
              {invoice.notes && (
                <p className="text-gray-500 text-xs">
                  <strong>Notes:</strong> {invoice.notes}
                </p>
              )}
            </div>

            <div className="min-w-[250px] bg-white rounded-lg border border-gray-200 p-6 shadow-sm print:shadow-none print:border-gray-400">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Consultation Fee:</span>
                  <span>₹{invoice.consultation_fee.toFixed(2)}</span>
                </div>
                {invoice.additional_charges > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Additional Charges:</span>
                    <span>₹{invoice.additional_charges.toFixed(2)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount:</span>
                    <span>- ₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-bold text-lg text-gray-900">
                    <span>TOTAL:</span>
                    <span>₹{invoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-100 text-center print:bg-white print:border-t print:border-gray-300">
          <p className="text-xs text-gray-500">
            Computer generated invoice. No signature required. • For queries: +91 98765 43210
          </p>
        </div>
      </Card>
    </div>
  )
}