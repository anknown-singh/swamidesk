'use client'

import { NextRequest, NextResponse } from 'next/server'
import { inputValidator, HEALTHCARE_VALIDATION_SCHEMAS, ValidationRateLimit } from './validation'
import { securityHeaders, HealthcareSecurityUtils } from './headers'
import { rbacService } from '../auth/rbac'

// API protection middleware
export interface APIProtectionConfig {
  requireAuth?: boolean
  requiredPermissions?: string[]
  validateInput?: boolean
  validationSchema?: string
  rateLimit?: boolean
  auditLog?: boolean
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'
  encryptResponse?: boolean
}

// API endpoint protection wrapper
export function withAPIProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: APIProtectionConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const startTime = Date.now()
      const clientIP = getClientIP(request)
      let userId: string | null = null

      // 1. Rate limiting check
      if (config.rateLimit !== false) {
        if (ValidationRateLimit.isRateLimited(clientIP)) {
          return securityHeaders.createSecureResponse(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
      }

      // 2. Authentication check
      if (config.requireAuth) {
        const authResult = await validateAuthentication(request)
        if (!authResult.success) {
          await logSecurityEvent('auth_failure', {
            ip: clientIP,
            path: request.nextUrl.pathname,
            error: authResult.error
          })
          
          return securityHeaders.createSecureResponse(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        userId = authResult.userId
      }

      // 3. Authorization check
      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        if (!userId) {
          return securityHeaders.createSecureResponse(
            { error: 'Authentication required for permission check' },
            { status: 401 }
          )
        }

        const hasPermissions = await rbacService.hasAllPermissions(
          userId, 
          config.requiredPermissions
        )
        
        if (!hasPermissions) {
          await logSecurityEvent('access_denied', {
            userId,
            ip: clientIP,
            path: request.nextUrl.pathname,
            requiredPermissions: config.requiredPermissions
          })

          return securityHeaders.createSecureResponse(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // 4. Input validation
      if (config.validateInput && request.method !== 'GET') {
        const validationResult = await validateRequestInput(request, config.validationSchema)
        if (!validationResult.success) {
          await logSecurityEvent('validation_failure', {
            userId,
            ip: clientIP,
            path: request.nextUrl.pathname,
            errors: validationResult.errors
          })

          return securityHeaders.createSecureResponse(
            { 
              error: 'Input validation failed', 
              details: validationResult.errors 
            },
            { status: 400 }
          )
        }

        // Replace request body with sanitized data
        if (validationResult.sanitizedData) {
          Object.defineProperty(request, '_sanitizedBody', {
            value: validationResult.sanitizedData,
            writable: false
          })
        }
      }

      // 5. Execute the actual handler
      const response = await handler(request)

      // 6. Add security headers based on data classification
      if (config.dataClassification) {
        const classificationHeaders = HealthcareSecurityUtils.getDataClassificationHeaders(
          config.dataClassification
        )
        Object.entries(classificationHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      // 7. Add HIPAA headers if dealing with healthcare data
      if (['confidential', 'restricted'].includes(config.dataClassification || '')) {
        const hipaaHeaders = HealthcareSecurityUtils.getHIPAAHeaders()
        Object.entries(hipaaHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      // 8. Audit logging
      if (config.auditLog && userId) {
        const auditHeaders = HealthcareSecurityUtils.getAuditHeaders(
          userId, 
          `${request.method} ${request.nextUrl.pathname}`
        )
        Object.entries(auditHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })

        await logAuditEvent(userId, request, response, Date.now() - startTime)
      }

      // 9. Apply final security headers
      return securityHeaders.applyHeaders(response)

    } catch (error) {
      await logSecurityEvent('api_error', {
        ip: getClientIP(request),
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return securityHeaders.createSecureResponse(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Authentication validation
async function validateAuthentication(request: NextRequest): Promise<{
  success: boolean
  userId?: string
  error?: string
}> {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
    if (!token) {
      return { success: false, error: 'Missing access token' }
    }

    // Validate token (implement your token validation logic)
    // This is a placeholder - in real implementation, you'd verify JWT or session token
    const userId = await validateAccessToken(token)
    if (!userId) {
      return { success: false, error: 'Invalid access token' }
    }

    return { success: true, userId }
  } catch (error) {
    return { 
      success: false, 
      error: `Authentication validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Token validation (placeholder - implement based on your auth system)
async function validateAccessToken(token: string): Promise<string | null> {
  try {
    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Verify JWT signature
    // 2. Check token expiration
    // 3. Validate against session store
    // 4. Return user ID if valid

    // For now, return a mock user ID if token is not empty
    return token.length > 10 ? 'mock-user-id' : null
  } catch (error) {
    return null
  }
}

// Input validation for API requests
async function validateRequestInput(
  request: NextRequest, 
  schemaName?: string
): Promise<{
  success: boolean
  errors?: string[]
  sanitizedData?: any
}> {
  try {
    let requestData: any
    const contentType = request.headers.get('content-type')

    // Parse request body based on content type
    if (contentType?.includes('application/json')) {
      requestData = await request.json()
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      requestData = Object.fromEntries(formData.entries())
    } else {
      return { success: true } // Skip validation for other content types
    }

    // Get validation schema
    const schema = schemaName ? 
      HEALTHCARE_VALIDATION_SCHEMAS[schemaName as keyof typeof HEALTHCARE_VALIDATION_SCHEMAS] :
      null

    if (!schema) {
      return { success: true } // Skip validation if no schema
    }

    // Validate against schema
    const validationResult = inputValidator.validateSchema(requestData, schema)
    
    return {
      success: validationResult.isValid,
      errors: validationResult.errors,
      sanitizedData: validationResult.sanitized
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Request parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? 
    forwarded.split(',')[0].trim() : 
    request.headers.get('x-real-ip') || '127.0.0.1'
  
  return ip
}

// Security event logging
async function logSecurityEvent(
  eventType: string, 
  eventData: any
): Promise<void> {
  try {
    // In a real application, you would log to a security event system
    console.warn(`[Security Event] ${eventType}:`, eventData)
    
    // You could also send to external security monitoring systems
    // await sendToSecurityMonitoring({ type: eventType, data: eventData })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Audit event logging
async function logAuditEvent(
  userId: string,
  request: NextRequest,
  response: NextResponse,
  responseTime: number
): Promise<void> {
  try {
    const auditData = {
      userId,
      method: request.method,
      path: request.nextUrl.pathname,
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent')
    }

    // Log to audit system
    console.log(`[Audit] API Access:`, auditData)
    
    // In production, store in audit log database
    // await storeAuditLog(auditData)
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

// Helper function to get sanitized request body
export function getSanitizedBody(request: NextRequest): any {
  return (request as any)._sanitizedBody
}

// Predefined API protection configurations for healthcare endpoints
export const HEALTHCARE_API_CONFIGS = {
  // Patient data endpoints
  patients: {
    requireAuth: true,
    requiredPermissions: ['patients:read'],
    validateInput: true,
    validationSchema: 'patient',
    rateLimit: true,
    auditLog: true,
    dataClassification: 'confidential' as const
  },

  // Patient write operations
  patientsWrite: {
    requireAuth: true,
    requiredPermissions: ['patients:write'],
    validateInput: true,
    validationSchema: 'patient',
    rateLimit: true,
    auditLog: true,
    dataClassification: 'confidential' as const
  },

  // Medical records
  medicalRecords: {
    requireAuth: true,
    requiredPermissions: ['patients:sensitive'],
    validateInput: true,
    validationSchema: 'medical_record',
    rateLimit: true,
    auditLog: true,
    dataClassification: 'restricted' as const
  },

  // Prescriptions
  prescriptions: {
    requireAuth: true,
    requiredPermissions: ['prescriptions:read'],
    validateInput: true,
    validationSchema: 'prescription',
    rateLimit: true,
    auditLog: true,
    dataClassification: 'confidential' as const
  },

  // Administrative endpoints
  admin: {
    requireAuth: true,
    requiredPermissions: ['system:admin'],
    validateInput: true,
    rateLimit: true,
    auditLog: true,
    dataClassification: 'internal' as const
  },

  // Public health information
  publicHealth: {
    requireAuth: false,
    validateInput: true,
    rateLimit: true,
    auditLog: false,
    dataClassification: 'public' as const
  }
}