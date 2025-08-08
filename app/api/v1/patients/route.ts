import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema for patient data validation
const PatientSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  date_of_birth: z.string().date(),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional()
})

const PatientUpdateSchema = PatientSchema.partial()

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  sort: z.enum(['created_at', 'full_name', 'date_of_birth']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/v1/patients
 * Retrieve a paginated list of patients
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by name, phone, or email
 * - gender: Filter by gender
 * - sort: Sort field (created_at, full_name, date_of_birth)
 * - order: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = PaginationSchema.parse(Object.fromEntries(searchParams))
    const { page, limit, search, gender, sort, order } = params
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('patients')
      .select(`
        patient_id,
        full_name,
        phone,
        email,
        date_of_birth,
        gender,
        address,
        created_at,
        updated_at,
        blood_group,
        emergency_contact_name,
        emergency_contact_phone
      `)
    
    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    // Apply gender filter
    if (gender) {
      query = query.eq('gender', gender)
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: patients, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patients', details: error.message },
        { status: 500 }
      )
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0
    
    return NextResponse.json({
      data: patients,
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
 * POST /api/v1/patients
 * Create a new patient
 * 
 * Body: PatientSchema (JSON)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = PatientSchema.parse(body)
    
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      
      // Handle duplicate phone number
      if (error.code === '23505' && error.message.includes('phone')) {
        return NextResponse.json(
          { error: 'Patient with this phone number already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create patient', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Patient created successfully',
        data: patient 
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid patient data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}