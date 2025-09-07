import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'swamicare_session'
const USER_COOKIE = 'swamicare_user'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip authentication for public routes
  const publicRoutes = ['/login', '/api/health', '/api/status', '/api/test', '/_next', '/favicon.ico', '/unauthorized']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for custom session cookies
  const sessionCookie = request.cookies.get(SESSION_COOKIE)
  const userCookie = request.cookies.get(USER_COOKIE)

  if (!sessionCookie || !userCookie) {
    // No valid session, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Validate session data
    const sessionData = JSON.parse(sessionCookie.value)
    const userData = JSON.parse(userCookie.value)
    
    // Check if session is expired (24 hours)
    const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - sessionData.timestamp > SESSION_DURATION) {
      // Session expired, redirect to login
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      
      // Clear expired cookies
      response.cookies.delete(SESSION_COOKIE)
      response.cookies.delete(USER_COOKIE)
      
      return response
    }

    // Check role-based access for protected routes
    const userRole = userData.role
    if (!userRole || !userData.is_active) {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // Allow access for authenticated users
    return NextResponse.next()

  } catch (error) {
    console.error('Session validation error:', error)
    
    // Invalid session data, redirect to login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    
    // Clear invalid cookies
    response.cookies.delete(SESSION_COOKIE)
    response.cookies.delete(USER_COOKIE)
    
    return response
  }
}