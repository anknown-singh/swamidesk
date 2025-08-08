import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InvoiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patient_id: z.string().uuid().optional(),
  payment_status: z.enum(['pending', 'partial', 'paid', 'overdue']).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  amount_min: z.coerce.number().min(0).optional(),
  amount_max: z.coerce.number().min(0).optional(),
  sort: z.enum(['created_at', 'total_amount', 'due_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

const PaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().min(0.01),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'insurance']),
  reference_number: z.string().optional(),
  notes: z.string().optional()
})

/**
 * GET /api/v1/billing
 * Retrieve invoices with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = InvoiceQuerySchema.parse(Object.fromEntries(searchParams))
    const { page, limit, patient_id, payment_status, date_from, date_to, amount_min, amount_max, sort, order } = params
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        patients(patient_id, full_name, phone),
        invoice_items(
          id,
          description,
          quantity,
          unit_price,
          total_price,
          item_type
        ),
        payments(
          id,
          amount,
          payment_method,
          payment_date,
          reference_number
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }
    
    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }
    
    if (date_from) {
      query = query.gte('invoice_date', `${date_from}T00:00:00`)
    }
    
    if (date_to) {
      query = query.lte('invoice_date', `${date_to}T23:59:59`)
    }
    
    if (amount_min !== undefined) {
      query = query.gte('total_amount', amount_min)
    }
    
    if (amount_max !== undefined) {
      query = query.lte('total_amount', amount_max)
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: invoices, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoices', details: error.message },
        { status: 500 }
      )
    }
    
    // Calculate payment totals for each invoice
    const processedInvoices = invoices?.map(invoice => ({
      ...invoice,
      total_paid: invoice.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0,
      balance_due: invoice.total_amount - (invoice.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0)
    }))
    
    const totalPages = count ? Math.ceil(count / limit) : 0
    
    return NextResponse.json({
      data: processedInvoices,
      pagination: {
        current_page: page,
        per_page: limit,
        total: count,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/billing/payments
 * Record a payment against an invoice
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = PaymentSchema.parse(body)
    
    // Verify invoice exists and get current balance
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        payment_status,
        patients(full_name),
        payments(amount)
      `)
      .eq('id', validatedData.invoice_id)
      .single()
    
    if (invoiceError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    if (invoiceError) {
      console.error('Database error:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to fetch invoice', details: invoiceError.message },
        { status: 500 }
      )
    }
    
    // Calculate current paid amount
    const totalPaid = invoice.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
    const balanceDue = invoice.total_amount - totalPaid
    
    // Validate payment amount
    if (validatedData.amount > balanceDue) {
      return NextResponse.json(
        { 
          error: 'Payment amount exceeds balance due',
          balance_due: balanceDue,
          payment_amount: validatedData.amount
        },
        { status: 400 }
      )
    }
    
    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        invoice_id: validatedData.invoice_id,
        amount: validatedData.amount,
        payment_method: validatedData.payment_method,
        payment_date: new Date().toISOString(),
        reference_number: validatedData.reference_number,
        notes: validatedData.notes
      }])
      .select()
      .single()
    
    if (paymentError) {
      console.error('Database error:', paymentError)
      return NextResponse.json(
        { error: 'Failed to record payment', details: paymentError.message },
        { status: 500 }
      )
    }
    
    // Update invoice payment status
    const newTotalPaid = totalPaid + validatedData.amount
    const newBalanceDue = invoice.total_amount - newTotalPaid
    
    let newPaymentStatus = 'pending'
    if (newBalanceDue === 0) {
      newPaymentStatus = 'paid'
    } else if (newTotalPaid > 0) {
      newPaymentStatus = 'partial'
    }
    
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_status: newPaymentStatus,
        paid_amount: newTotalPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.invoice_id)
    
    if (updateError) {
      console.error('Failed to update invoice status:', updateError)
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json(
      { 
        message: 'Payment recorded successfully',
        data: {
          payment_id: payment.id,
          invoice_number: invoice.invoice_number,
          patient_name: (invoice as any).patients?.full_name || 'Unknown Patient',
          payment_amount: validatedData.amount,
          new_balance: newBalanceDue,
          payment_status: newPaymentStatus
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}