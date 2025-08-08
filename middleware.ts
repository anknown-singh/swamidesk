import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { securityHeaders, ROUTE_SECURITY_CONFIGS } from '@/lib/security/headers'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for test routes
  if (pathname.startsWith('/admin/test')) {
    return NextResponse.next()
  }

  // Apply route-specific security configurations
  if (pathname.startsWith('/api/auth/')) {
    securityHeaders.updateRateLimitConfig(ROUTE_SECURITY_CONFIGS.auth.rateLimitConfig)
  } else if (pathname.startsWith('/api/')) {
    securityHeaders.updateRateLimitConfig(ROUTE_SECURITY_CONFIGS.api.rateLimitConfig)
  } else if (pathname.startsWith('/admin/')) {
    securityHeaders.updateRateLimitConfig(ROUTE_SECURITY_CONFIGS.admin.rateLimitConfig)
    securityHeaders.updateConfig({ 
      customHeaders: ROUTE_SECURITY_CONFIGS.admin.customHeaders 
    })
  } else if (pathname.includes('/patient')) {
    securityHeaders.updateConfig({ 
      customHeaders: ROUTE_SECURITY_CONFIGS.patient.customHeaders 
    })
  }

  // Run security middleware checks first
  const securityResult = securityHeaders.securityMiddleware(request)
  if (securityResult) {
    return securityResult // Return error response if security check fails
  }

  // Continue with existing Supabase session handling
  const response = await updateSession(request)

  // Apply security headers to the response
  return securityHeaders.applyHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}