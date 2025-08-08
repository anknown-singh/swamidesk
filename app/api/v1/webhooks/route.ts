import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const WebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'patient.created',
    'patient.updated',
    'patient.deleted',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
    'prescription.created',
    'invoice.paid',
    'inventory.low_stock'
  ])),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  secret: z.string().min(16).optional() // For webhook signature verification
})

// const WebhookUpdateSchema = WebhookSchema.partial()

/**
 * GET /api/v1/webhooks
 * List all registered webhooks
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select(`
        id,
        url,
        events,
        description,
        is_active,
        created_at,
        updated_at,
        last_triggered,
        success_count,
        failure_count
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch webhooks', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: webhooks })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/webhooks
 * Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = WebhookSchema.parse(body)
    
    // Generate a secret if not provided
    if (!validatedData.secret) {
      validatedData.secret = generateWebhookSecret()
    }
    
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create webhook', details: error.message },
        { status: 500 }
      )
    }
    
    // Don't return the secret in the response for security
    const { secret, ...webhookData } = webhook
    
    return NextResponse.json(
      { 
        message: 'Webhook registered successfully',
        data: {
          ...webhookData,
          secret: `wh_secret_${secret.slice(0, 8)}...` // Show only first 8 chars
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateWebhookSecret(): string {
  return `wh_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`
}


