import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limiting storage (in production, use Redis or a database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface APIConfig {
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  auth: {
    required: boolean
    allowedRoles?: string[]
  }
}

const DEFAULT_CONFIG: APIConfig = {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  auth: {
    required: true
  }
}

/**
 * API Middleware for authentication, rate limiting, and request validation
 */
export async function apiMiddleware(request: NextRequest, config: Partial<APIConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  try {
    // CORS handling
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    if (!checkRateLimit(clientId, mergedConfig.rateLimit)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          details: `Maximum ${mergedConfig.rateLimit.maxRequests} requests per ${mergedConfig.rateLimit.windowMs / 1000} seconds`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(mergedConfig.rateLimit.windowMs / 1000).toString(),
            'X-RateLimit-Limit': mergedConfig.rateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      )
    }

    // Authentication check
    if (mergedConfig.auth.required) {
      const authResult = await authenticateRequest(request)
      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Authentication failed', details: authResult.error },
          { status: 401 }
        )
      }

      // Role-based access control
      if (mergedConfig.auth.allowedRoles && authResult.user) {
        if (!mergedConfig.auth.allowedRoles.includes(authResult.user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions', required_roles: mergedConfig.auth.allowedRoles },
            { status: 403 }
          )
        }
      }

      // Add user info to request headers for downstream handlers
      const response = NextResponse.next()
      response.headers.set('x-user-id', authResult.user?.id || '')
      response.headers.set('x-user-role', authResult.user?.role || '')
      return response
    }

    return NextResponse.next()

  } catch (error) {
    console.error('API Middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // In production, use a combination of IP, API key, and user ID
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || ''
  return `${ip}:${apiKey.slice(0, 10)}` // Use first 10 chars of API key
}

/**
 * Check rate limit for client
 */
function checkRateLimit(clientId: string, config: { windowMs: number; maxRequests: number }): boolean {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Get or create rate limit data for client
  let clientData = rateLimitMap.get(clientId)
  
  if (!clientData || clientData.resetTime <= windowStart) {
    // Reset window
    clientData = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }

  // Check if within limit
  if (clientData.count >= config.maxRequests) {
    return false
  }

  // Increment count
  clientData.count++
  rateLimitMap.set(clientId, clientData)

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupRateLimitMap()
  }

  return true
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [key, data] of rateLimitMap.entries()) {
    if (data.resetTime <= now) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Authenticate API request
 */
async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // In a real implementation, you would:
    // 1. Validate JWT token OR
    // 2. Look up API key in database OR
    // 3. Verify with Supabase auth
    
    // For now, we'll use Supabase client authentication
    const supabase = await createClient()
    
    // Try to get user from Supabase session
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      // Fallback: check if it's an API key
      const { data: apiKey, error: apiError } = await supabase
        .from('api_keys')
        .select('user_id, is_active, permissions, users(id, role, email)')
        .eq('key_hash', hashApiKey(token))
        .eq('is_active', true)
        .single()
      
      if (apiError || !apiKey) {
        return { success: false, error: 'Invalid authentication token' }
      }
      
      return { 
        success: true, 
        user: {
          id: apiKey.user_id,
          role: Array.isArray(apiKey.users) ? (apiKey.users[0] as any)?.role || 'unknown' : (apiKey.users as any)?.role || 'unknown',
          email: Array.isArray(apiKey.users) ? (apiKey.users[0] as any)?.email || 'unknown' : (apiKey.users as any)?.email || 'unknown',
          permissions: apiKey.permissions || []
        }
      }
    }

    // Get user role from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    if (profileError || !userProfile || !userProfile.is_active) {
      return { success: false, error: 'User account not found or inactive' }
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: userProfile.role
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Hash API key for database storage
 * In production, use a proper hashing algorithm like bcrypt
 */
function hashApiKey(key: string): string {
  // This is a simple hash for demonstration
  // In production, use crypto.createHash('sha256').update(key).digest('hex')
  return Buffer.from(key).toString('base64')
}

/**
 * Middleware configuration for different endpoints
 */
export const middlewareConfigs = {
  // Public endpoints (no auth required)
  public: {
    auth: { required: false },
    rateLimit: { windowMs: 60 * 1000, maxRequests: 200 }
  },
  
  // Standard API endpoints
  standard: {
    auth: { required: true },
    rateLimit: { windowMs: 60 * 1000, maxRequests: 100 }
  },
  
  // Admin-only endpoints
  admin: {
    auth: { required: true, allowedRoles: ['admin'] },
    rateLimit: { windowMs: 60 * 1000, maxRequests: 150 }
  },
  
  // Doctor endpoints
  doctor: {
    auth: { required: true, allowedRoles: ['admin', 'doctor'] },
    rateLimit: { windowMs: 60 * 1000, maxRequests: 120 }
  },
  
  // Heavy operations (bulk updates, analytics)
  heavy: {
    auth: { required: true },
    rateLimit: { windowMs: 60 * 1000, maxRequests: 20 }
  }
}