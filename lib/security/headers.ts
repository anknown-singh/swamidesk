import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
interface SecurityHeadersConfig {
  contentSecurityPolicy?: string
  strictTransportSecurity?: string
  xFrameOptions?: string
  xContentTypeOptions?: string
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
  customHeaders?: Record<string, string>
}

// CSRF protection
interface CSRFConfig {
  enabled: boolean
  tokenHeader: string
  cookieName: string
  tokenLength: number
  exemptMethods: string[]
  exemptPaths: string[]
}

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Security headers middleware
export class SecurityHeaders {
  private static instance: SecurityHeaders
  private config: SecurityHeadersConfig
  private csrfConfig: CSRFConfig
  private rateLimitConfig: RateLimitConfig
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  public static getInstance(): SecurityHeaders {
    if (!SecurityHeaders.instance) {
      SecurityHeaders.instance = new SecurityHeaders()
    }
    return SecurityHeaders.instance
  }

  constructor() {
    this.config = this.getDefaultHeaders()
    this.csrfConfig = this.getDefaultCSRFConfig()
    this.rateLimitConfig = this.getDefaultRateLimitConfig()
  }

  // Default security headers for healthcare applications
  private getDefaultHeaders(): SecurityHeadersConfig {
    return {
      // Content Security Policy - restrictive for healthcare data protection
      contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; '),

      // HTTPS enforcement (1 year)
      strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

      // Prevent embedding in frames
      xFrameOptions: 'DENY',

      // Prevent MIME type sniffing
      xContentTypeOptions: 'nosniff',

      // Referrer policy for privacy
      referrerPolicy: 'strict-origin-when-cross-origin',

      // Permissions policy
      permissionsPolicy: [
        'camera=()',
        'microphone=()',
        'geolocation=(self)',
        'fullscreen=(self)',
        'payment=()'
      ].join(', '),

      // Cross-origin policies
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-site',

      // Custom healthcare-specific headers
      customHeaders: {
        'X-Healthcare-App': 'SwamiCare',
        'X-Content-Type-Options': 'nosniff',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  }

  // Default CSRF configuration
  private getDefaultCSRFConfig(): CSRFConfig {
    return {
      enabled: true,
      tokenHeader: 'X-CSRF-Token',
      cookieName: 'csrf-token',
      tokenLength: 32,
      exemptMethods: ['GET', 'HEAD', 'OPTIONS'],
      exemptPaths: ['/api/health', '/api/status']
    }
  }

  // Default rate limiting configuration
  private getDefaultRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // per window
      message: 'Too many requests, please try again later',
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  }

  // Apply security headers to response
  applyHeaders(response: NextResponse): NextResponse {
    // Apply CSP
    if (this.config.contentSecurityPolicy) {
      response.headers.set('Content-Security-Policy', this.config.contentSecurityPolicy)
    }

    // Apply HSTS
    if (this.config.strictTransportSecurity) {
      response.headers.set('Strict-Transport-Security', this.config.strictTransportSecurity)
    }

    // Apply frame options
    if (this.config.xFrameOptions) {
      response.headers.set('X-Frame-Options', this.config.xFrameOptions)
    }

    // Apply content type options
    if (this.config.xContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', this.config.xContentTypeOptions)
    }

    // Apply referrer policy
    if (this.config.referrerPolicy) {
      response.headers.set('Referrer-Policy', this.config.referrerPolicy)
    }

    // Apply permissions policy
    if (this.config.permissionsPolicy) {
      response.headers.set('Permissions-Policy', this.config.permissionsPolicy)
    }

    // Apply COEP
    if (this.config.crossOriginEmbedderPolicy) {
      response.headers.set('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy)
    }

    // Apply COOP
    if (this.config.crossOriginOpenerPolicy) {
      response.headers.set('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy)
    }

    // Apply CORP
    if (this.config.crossOriginResourcePolicy) {
      response.headers.set('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy)
    }

    // Apply custom headers
    if (this.config.customHeaders) {
      Object.entries(this.config.customHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    return response
  }

  // CSRF protection
  validateCSRF(request: NextRequest): { isValid: boolean; error?: string } {
    if (!this.csrfConfig.enabled) {
      return { isValid: true }
    }

    const method = request.method.toUpperCase()
    const pathname = request.nextUrl.pathname

    // Skip exempt methods
    if (this.csrfConfig.exemptMethods.includes(method)) {
      return { isValid: true }
    }

    // Skip exempt paths
    if (this.csrfConfig.exemptPaths.some(path => pathname.startsWith(path))) {
      return { isValid: true }
    }

    // Check for CSRF token in header
    const tokenHeader = request.headers.get(this.csrfConfig.tokenHeader)
    const tokenCookie = request.cookies.get(this.csrfConfig.cookieName)?.value

    if (!tokenHeader || !tokenCookie) {
      return { 
        isValid: false, 
        error: 'CSRF token missing' 
      }
    }

    if (tokenHeader !== tokenCookie) {
      return { 
        isValid: false, 
        error: 'CSRF token mismatch' 
      }
    }

    return { isValid: true }
  }

  // Generate CSRF token
  generateCSRFToken(): string {
    const array = new Uint8Array(this.csrfConfig.tokenLength)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Set CSRF token in response
  setCSRFToken(response: NextResponse): NextResponse {
    if (!this.csrfConfig.enabled) {
      return response
    }

    const token = this.generateCSRFToken()
    
    // Set as httpOnly cookie
    response.cookies.set(this.csrfConfig.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 // 1 hour
    })

    // Set as header for client-side access
    response.headers.set('X-CSRF-Token', token)

    return response
  }

  // Rate limiting
  checkRateLimit(request: NextRequest): { isAllowed: boolean; error?: string; retryAfter?: number } {
    const identifier = this.getClientIdentifier(request)
    const now = Date.now()
    const windowMs = this.rateLimitConfig.windowMs

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(identifier)
    
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs }
      this.rateLimitStore.set(identifier, entry)
      return { isAllowed: true }
    }

    if (entry.count >= this.rateLimitConfig.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return { 
        isAllowed: false, 
        error: this.rateLimitConfig.message,
        retryAfter
      }
    }

    entry.count++
    return { isAllowed: true }
  }

  // Get client identifier for rate limiting
  private getClientIdentifier(request: NextRequest): string {
    // Use IP address as identifier
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'
    
    return ip.trim()
  }

  // Security middleware wrapper
  securityMiddleware(request: NextRequest): NextResponse | null {
    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(request)
    if (!rateLimitResult.isAllowed) {
      const response = NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
      
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString())
      }
      
      return this.applyHeaders(response)
    }

    // Check CSRF for state-changing requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const csrfResult = this.validateCSRF(request)
      if (!csrfResult.isValid) {
        const response = NextResponse.json(
          { error: csrfResult.error },
          { status: 403 }
        )
        return this.applyHeaders(response)
      }
    }

    return null // Continue to next middleware
  }

  // Create secure response with all headers
  createSecureResponse(
    body?: any, 
    options?: ResponseInit
  ): NextResponse {
    const response = body ? 
      NextResponse.json(body, options) : 
      new NextResponse(undefined, options)
    
    return this.setCSRFToken(this.applyHeaders(response))
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  updateCSRFConfig(newConfig: Partial<CSRFConfig>): void {
    this.csrfConfig = { ...this.csrfConfig, ...newConfig }
  }

  updateRateLimitConfig(newConfig: Partial<RateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...newConfig }
  }
}

// Route-specific security configurations
export const ROUTE_SECURITY_CONFIGS = {
  // Authentication routes - stricter rate limiting
  auth: {
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Only 10 login attempts
      message: 'Too many authentication attempts, please try again later'
    }
  },

  // API routes - standard protection
  api: {
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'API rate limit exceeded'
    }
  },

  // Admin routes - very strict
  admin: {
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50,
      message: 'Admin access rate limit exceeded'
    },
    customHeaders: {
      'X-Admin-Access': 'true',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },

  // Patient data routes - healthcare compliance
  patient: {
    customHeaders: {
      'X-Healthcare-Data': 'true',
      'X-Data-Classification': 'confidential',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
}

// Healthcare-specific security utilities
export class HealthcareSecurityUtils {
  // HIPAA-compliant headers
  static getHIPAAHeaders(): Record<string, string> {
    return {
      'X-Healthcare-Compliance': 'HIPAA',
      'X-Data-Protection': 'PHI-Protected',
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }

  // Audit trail headers
  static getAuditHeaders(userId: string, action: string): Record<string, string> {
    return {
      'X-User-ID': userId,
      'X-Action': action,
      'X-Timestamp': new Date().toISOString(),
      'X-Audit-Required': 'true'
    }
  }

  // Data classification headers
  static getDataClassificationHeaders(level: 'public' | 'internal' | 'confidential' | 'restricted'): Record<string, string> {
    const cacheControl = level === 'public' ? 
      'public, max-age=3600' : 
      'no-cache, no-store, must-revalidate'

    return {
      'X-Data-Classification': level,
      'Cache-Control': cacheControl
    }
  }
}

// Export singleton instance
export const securityHeaders = SecurityHeaders.getInstance()