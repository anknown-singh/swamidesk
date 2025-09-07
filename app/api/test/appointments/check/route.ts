import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if appointments table exists and has data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(10)

    if (appointmentsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query appointments table',
        details: appointmentsError.message,
        code: appointmentsError.code
      })
    }

    // Check if patients table exists and has data
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(10)

    if (patientsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query patients table',
        details: patientsError.message,
        code: patientsError.code
      })
    }

    // Try the problematic query that's failing with corrected joins
    const { data: appointmentsWithPatients, error: joinError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
        users!appointments_doctor_id_fkey(
          id, full_name, email, phone, created_at, updated_at,
          user_profiles(department, specialization)
        )
      `)
      .eq('scheduled_date', '2025-09-06')
      .order('scheduled_time', { ascending: true })
      .limit(5)

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      results: {
        appointments: {
          count: appointments?.length || 0,
          data: appointments?.slice(0, 3) || []
        },
        patients: {
          count: patients?.length || 0,  
          data: patients?.slice(0, 3) || []
        },
        join_query: {
          success: !joinError,
          error: joinError?.message || null,
          code: joinError?.code || null,
          count: appointmentsWithPatients?.length || 0,
          data: appointmentsWithPatients?.slice(0, 2) || []
        }
      }
    })

  } catch (error) {
    console.error('Error checking appointments:', error)
    return NextResponse.json(
      { error: 'Failed to check appointments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}