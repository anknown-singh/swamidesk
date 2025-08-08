import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PrescriptionItemSchema = z.object({
  medicine_id: z.string().uuid(),
  quantity_prescribed: z.number().min(1),
  dosage_instructions: z.string().min(1),
  frequency: z.string().min(1),
  duration_days: z.number().min(1).max(365)
})

const PrescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  opd_record_id: z.string().uuid().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  prescription_items: z.array(PrescriptionItemSchema).min(1).max(20)
})

const PrescriptionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patient_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  status: z.enum(['pending', 'partially_dispensed', 'fully_dispensed', 'cancelled']).optional(),
  sort: z.enum(['created_at', 'prescription_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/v1/prescriptions
 * Retrieve prescriptions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = PrescriptionQuerySchema.parse(Object.fromEntries(searchParams))
    const { page, limit, patient_id, doctor_id, date_from, date_to, status, sort, order } = params
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patients(patient_id, full_name, phone),
        doctors:users!doctor_id(id, email, full_name),
        prescription_items(
          id,
          medicine_id,
          quantity_prescribed,
          quantity_dispensed,
          dosage_instructions,
          frequency,
          duration_days,
          medicines(name, category, dosage_form, unit_price)
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }
    
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id)
    }
    
    if (date_from) {
      query = query.gte('prescription_date', `${date_from}T00:00:00`)
    }
    
    if (date_to) {
      query = query.lte('prescription_date', `${date_to}T23:59:59`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: prescriptions, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prescriptions', details: error.message },
        { status: 500 }
      )
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0
    
    return NextResponse.json({
      data: prescriptions,
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
 * POST /api/v1/prescriptions
 * Create a new prescription with items
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = PrescriptionSchema.parse(body)
    
    // Verify patient exists
    const { error: patientError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .eq('patient_id', validatedData.patient_id)
      .single()
    
    if (patientError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    // Verify doctor exists
    const { error: doctorError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', validatedData.doctor_id)
      .eq('role', 'doctor')
      .single()
    
    if (doctorError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }
    
    // Verify all medicines exist and have sufficient stock
    const medicineIds = validatedData.prescription_items.map(item => item.medicine_id)
    const { data: medicines, error: medicineError } = await supabase
      .from('medicines')
      .select('id, name, stock_quantity')
      .in('id', medicineIds)
    
    if (medicineError) {
      return NextResponse.json(
        { error: 'Failed to verify medicines', details: medicineError.message },
        { status: 500 }
      )
    }
    
    if (medicines.length !== medicineIds.length) {
      return NextResponse.json(
        { error: 'One or more medicines not found' },
        { status: 404 }
      )
    }
    
    // Check stock availability
    const stockErrors = []
    for (const item of validatedData.prescription_items) {
      const medicine = medicines.find(m => m.id === item.medicine_id)
      if (medicine && medicine.stock_quantity < item.quantity_prescribed) {
        stockErrors.push({
          medicine_name: medicine.name,
          requested: item.quantity_prescribed,
          available: medicine.stock_quantity
        })
      }
    }
    
    if (stockErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient stock for some medicines',
          stock_errors: stockErrors
        },
        { status: 400 }
      )
    }
    
    // Create prescription
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert([{
        patient_id: validatedData.patient_id,
        doctor_id: validatedData.doctor_id,
        opd_record_id: validatedData.opd_record_id,
        prescription_date: new Date().toISOString(),
        diagnosis: validatedData.diagnosis,
        notes: validatedData.notes,
        status: 'pending',
        total_amount: 0 // Will be calculated after items are inserted
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create prescription', details: error.message },
        { status: 500 }
      )
    }
    
    // Create prescription items
    const prescriptionItems = validatedData.prescription_items.map(item => ({
      prescription_id: prescription.id,
      medicine_id: item.medicine_id,
      quantity_prescribed: item.quantity_prescribed,
      quantity_dispensed: 0,
      dosage_instructions: item.dosage_instructions,
      frequency: item.frequency,
      duration_days: item.duration_days
    }))
    
    const { data: items, error: itemsError } = await supabase
      .from('prescription_items')
      .insert(prescriptionItems)
      .select(`
        *,
        medicines(name, category, unit_price)
      `)
    
    if (itemsError) {
      // Rollback prescription if items fail
      await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescription.id)
      
      console.error('Database error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to create prescription items', details: itemsError.message },
        { status: 500 }
      )
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => 
      sum + (item.quantity_prescribed * item.medicines.unit_price), 0
    )
    
    // Update prescription with total amount
    await supabase
      .from('prescriptions')
      .update({ total_amount: totalAmount })
      .eq('id', prescription.id)
    
    return NextResponse.json(
      { 
        message: 'Prescription created successfully',
        data: {
          ...prescription,
          total_amount: totalAmount,
          prescription_items: items
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid prescription data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}