import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PatientUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  date_of_birth: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/patients/[id]
 * Retrieve a specific patient by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        opd_records(
          id,
          visit_date,
          chief_complaint,
          diagnosis,
          opd_status,
          consultation_fee,
          created_at
        )
      `)
      .eq('patient_id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patient', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: patient })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/patients/[id]
 * Update a specific patient
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = PatientUpdateSchema.parse(body)
    
    // Check if patient exists
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', id)
      .single()
    
    if (fetchError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    const { data: patient, error } = await supabase
      .from('patients')
      .update(validatedData)
      .eq('patient_id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      
      // Handle duplicate phone number
      if (error.code === '23505' && error.message.includes('phone')) {
        return NextResponse.json(
          { error: 'Another patient with this phone number already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update patient', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Patient updated successfully',
      data: patient
    })
    
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

/**
 * DELETE /api/v1/patients/[id]
 * Delete a specific patient (soft delete by marking as inactive)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if patient exists
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .eq('patient_id', id)
      .single()
    
    if (fetchError?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    // Check for active visits
    const { data: activeVisits, error: visitsError } = await supabase
      .from('opd_records')
      .select('id')
      .eq('patient_id', id)
      .in('opd_status', ['waiting', 'consultation', 'procedures_pending'])
      .limit(1)
    
    if (visitsError) {
      console.error('Database error checking active visits:', visitsError)
      return NextResponse.json(
        { error: 'Failed to check patient status' },
        { status: 500 }
      )
    }
    
    if (activeVisits && activeVisits.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active visits. Please complete or cancel active visits first.' },
        { status: 409 }
      )
    }
    
    // Soft delete by marking as inactive
    const { error } = await supabase
      .from('patients')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete patient', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Patient deleted successfully',
      data: { patient_id: id, full_name: existingPatient!.full_name }
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}