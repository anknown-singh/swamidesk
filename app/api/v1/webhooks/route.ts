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

/**
 * Webhook delivery system
 * This would be called internally when events occur
 */
async function _triggerWebhook(eventType: string, payload: any) {
  try {
    const supabase = await createClient()
    
    // Get all active webhooks that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [eventType])
    
    if (error) {
      console.error('Error fetching webhooks:', error)
      return
    }
    
    if (!webhooks || webhooks.length === 0) {
      return // No webhooks to trigger
    }
    
    // Deliver webhooks in parallel
    const deliveryPromises = webhooks.map(async (webhook) => {
      try {
        const webhookPayload = {
          event: eventType,
          data: payload,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id
        }
        
        // Create signature for verification
        const signature = await createWebhookSignature(
          JSON.stringify(webhookPayload),
          webhook.secret
        )
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SwamIDesk-Signature': signature,
            'X-SwamIDesk-Event': eventType,
            'User-Agent': 'SwamIDesk-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })
        
        const success = response.ok
        
        // Update webhook stats
        await supabase
          .from('webhooks')
          .update({
            last_triggered: new Date().toISOString(),
            success_count: success ? supabase.sql`success_count + 1` : undefined,
            failure_count: !success ? supabase.sql`failure_count + 1` : undefined
          })
          .eq('id', webhook.id)
        
        // Log the delivery attempt
        await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload: webhookPayload,
            response_status: response.status,
            success,
            error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
            delivered_at: new Date().toISOString()
          })
        
        return { webhook_id: webhook.id, success }
        
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error)
        
        // Update failure count
        await supabase
          .from('webhooks')
          .update({
            last_triggered: new Date().toISOString(),
            failure_count: supabase.sql`failure_count + 1`
          })
          .eq('id', webhook.id)
        
        // Log the failed delivery
        await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload,
            response_status: 0,
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            delivered_at: new Date().toISOString()
          })
        
        return { webhook_id: webhook.id, success: false, error: error.message }
      }
    })
    
    const results = await Promise.allSettled(deliveryPromises)
    console.log(`Webhook delivery results for ${eventType}:`, results)
    
  } catch (error) {
    console.error('Error in webhook trigger system:', error)
  }
}

async function createWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const payloadData = encoder.encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}