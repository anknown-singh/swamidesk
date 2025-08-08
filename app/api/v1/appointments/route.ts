import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  appointment_date: z.string().datetime(),
  appointment_type: z.enum(['consultation', 'follow_up', 'procedure', 'emergency']),
  notes: z.string().optional(),
  estimated_duration: z.number().min(15).max(240).default(30) // minutes
})

const AppointmentUpdateSchema = AppointmentSchema.partial()

const AppointmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  date: z.string().date().optional(),
  doctor_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  type: z.enum(['consultation', 'follow_up', 'procedure', 'emergency']).optional(),
  sort: z.enum(['appointment_date', 'created_at']).default('appointment_date'),
  order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/v1/appointments
 * Retrieve appointments with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = AppointmentQuerySchema.parse(Object.fromEntries(searchParams))
    const { page, limit, date, doctor_id, patient_id, status, type, sort, order } = params
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients(patient_id, full_name, phone),
        doctors:users!doctor_id(id, email, full_name)
      `, { count: 'exact' })
    
    // Apply filters
    if (date) {
      query = query.gte('appointment_date', `${date}T00:00:00`)
                   .lt('appointment_date', `${date}T23:59:59`)
    }
    
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id)
    }
    
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (type) {
      query = query.eq('appointment_type', type)
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: appointments, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      )
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0
    
    return NextResponse.json({
      data: appointments,
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
 * POST /api/v1/appointments
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = AppointmentSchema.parse(body)
    
    // Check if patient exists and is active
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('patient_id, full_name, is_active')
      .eq('patient_id', validatedData.patient_id)
      .single()
    
    if (patientError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    if (!patient.is_active) {
      return NextResponse.json(
        { error: 'Cannot book appointment for inactive patient' },
        { status: 400 }
      )
    }
    
    // Check if doctor exists and is active
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .select('id, full_name, is_active')
      .eq('id', validatedData.doctor_id)
      .eq('role', 'doctor')
      .single()
    
    if (doctorError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }
    
    if (!doctor.is_active) {
      return NextResponse.json(
        { error: 'Cannot book appointment with inactive doctor' },
        { status: 400 }
      )
    }
    
    // Check for scheduling conflicts
    const appointmentStart = new Date(validatedData.appointment_date)
    const appointmentEnd = new Date(appointmentStart.getTime() + validatedData.estimated_duration * 60000)
    
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', validatedData.doctor_id)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('appointment_date', appointmentStart.toISOString())
      .lt('appointment_date', appointmentEnd.toISOString())
    
    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to check appointment conflicts' },
        { status: 500 }
      )
    }
    
    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Doctor has a conflicting appointment at this time' },
        { status: 409 }
      )
    }
    
    // Create the appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        ...validatedData,
        status: 'scheduled',
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        patients(patient_id, full_name, phone),
        doctors:users!doctor_id(id, email, full_name)
      `)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Appointment created successfully',
        data: appointment 
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid appointment data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}