import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'

const ApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).default(['read']),
  expires_at: z.string().datetime().optional()
})

// const ApiKeyUpdateSchema = z.object({
//   name: z.string().min(1).max(100).optional(),
//   description: z.string().optional(),
//   is_active: z.boolean().optional(),
//   permissions: z.array(z.enum(['read', 'write', 'admin'])).optional()
// })

/**
 * GET /api/v1/api-keys
 * List API keys for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        description,
        permissions,
        is_active,
        last_used_at,
        expires_at,
        created_at,
        key_preview
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error.message },
        { status: 500 }
      )
    }
    
    // Add status information
    const processedKeys = apiKeys?.map(key => ({
      ...key,
      status: !key.is_active ? 'inactive' :
              (key.expires_at && new Date(key.expires_at) < new Date()) ? 'expired' : 'active'
    }))
    
    return NextResponse.json({ data: processedKeys })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validatedData = ApiKeySchema.parse(body)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if user has reached API key limit
    const { data: existingKeys, error: countError } = await supabase
      .from('api_keys')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (countError) {
      console.error('Error counting API keys:', countError)
      return NextResponse.json(
        { error: 'Failed to validate API key limit' },
        { status: 500 }
      )
    }
    
    const MAX_API_KEYS = 10
    if (existingKeys && existingKeys.length >= MAX_API_KEYS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_API_KEYS} API keys allowed per user` },
        { status: 400 }
      )
    }
    
    // Generate API key
    const keyPrefix = 'sk_'
    const keyData = randomBytes(32).toString('hex')
    const apiKey = `${keyPrefix}${keyData}`
    
    // Create hash for secure storage
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const keyPreview = `${keyPrefix}${keyData.substring(0, 8)}...${keyData.substring(-4)}`
    
    // Store API key in database
    const { data: newApiKey, error } = await supabase
      .from('api_keys')
      .insert([{
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description,
        permissions: validatedData.permissions,
        key_hash: keyHash,
        key_preview: keyPreview,
        expires_at: validatedData.expires_at,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select('id, name, key_preview, permissions, created_at')
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create API key', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'API key created successfully',
        data: {
          ...newApiKey,
          api_key: apiKey // Only return the full key once, on creation
        },
        warning: 'Store this API key securely. You will not be able to see it again.'
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid API key data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}