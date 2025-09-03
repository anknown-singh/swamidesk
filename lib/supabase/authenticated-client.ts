import { createClient } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

const SESSION_COOKIE = 'swamicare_session'
const USER_COOKIE = 'swamicare_user'

/**
 * Creates an authenticated Supabase client that includes user context from cookies
 * This aligns with the custom authentication system using cookies (not localStorage)
 */
export function createAuthenticatedClient(): SupabaseClient {
  const supabase = createClient()
  
  // Get user from cookies (matching AuthProvider)
  const getAuthenticatedUserId = (): string | null => {
    try {
      const sessionCookie = Cookies.get(SESSION_COOKIE)
      const userCookie = Cookies.get(USER_COOKIE)
      
      if (sessionCookie && userCookie) {
        const sessionData = JSON.parse(sessionCookie)
        const userData = JSON.parse(userCookie)
        
        // Check if session is expired (24 hours)
        const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
        if (Date.now() - sessionData.timestamp > SESSION_DURATION) {
          return null // Session expired
        }
        
        return userData.id
      }
      return null
    } catch {
      return null
    }
  }

  // Create a proxy to intercept requests and add authentication
  const authenticatedSupabase = new Proxy(supabase, {
    get(target, prop) {
      if (prop === 'from') {
        return function(table: string) {
          const queryBuilder = target.from(table)
          const userId = getAuthenticatedUserId()
          
          // Check if user is authenticated
          if (!userId) {
            console.warn('⚠️ No authenticated user found. Please ensure you are logged in.')
            
            // For critical operations, we could redirect to login
            if (table === 'appointments' || table === 'patients' || table === 'prescriptions') {
              // Check if we're in a browser environment
              if (typeof window !== 'undefined') {
                // Provide user-friendly error message
                alert('Please log in to continue. You will be redirected to the login page.')
                window.location.href = '/login'
              }
            }
          }
          
          if (userId) {
            // Add the authenticated user ID to the request context
            // This is a workaround since we can't modify the actual JWT
            const originalInsert = queryBuilder.insert.bind(queryBuilder)
            const originalUpdate = queryBuilder.update.bind(queryBuilder)
            const originalSelect = queryBuilder.select.bind(queryBuilder)
            
            queryBuilder.insert = function(values: Record<string, unknown> | Record<string, unknown>[]) {
              try {
                // Add created_by field for inserts if not present
                if (values && typeof values === 'object' && !Array.isArray(values)) {
                  if (!values.created_by && table === 'appointments') {
                    values.created_by = userId
                    console.log('✅ Authenticated appointment creation for user:', userId)
                  }
                } else if (Array.isArray(values)) {
                  values.forEach(value => {
                    if (!value.created_by && table === 'appointments') {
                      value.created_by = userId
                      console.log('✅ Authenticated batch appointment creation for user:', userId)
                    }
                  })
                }
                return originalInsert(values)
              } catch (error) {
                console.error('❌ Authentication error during insert:', error)
                throw new Error('Authentication failed. Please ensure you are logged in and try again.')
              }
            }
            
            queryBuilder.update = function(values: Record<string, unknown>) {
              try {
                // Add updated_by context if needed for audit trails
                if (values && typeof values === 'object' && table === 'appointments') {
                  console.log('✅ Authenticated appointment update for user:', userId)
                }
                return originalUpdate(values)
              } catch (error) {
                console.error('❌ Authentication error during update:', error)
                throw new Error('Authentication failed. Please ensure you are logged in and try again.')
              }
            }
            
            // For select queries, we'll rely on RLS policies being disabled
            queryBuilder.select = function(columns?: string) {
              return originalSelect(columns)
            }
          }
          
          return queryBuilder
        }
      }
      
      return target[prop as keyof typeof target]
    }
  })
  
  return authenticatedSupabase
}

/**
 * Hook to get current authenticated user from cookies (matching AuthProvider)
 */
export function useAuthenticatedUser() {
  try {
    const sessionCookie = Cookies.get(SESSION_COOKIE)
    const userCookie = Cookies.get(USER_COOKIE)
    
    if (sessionCookie && userCookie) {
      const sessionData = JSON.parse(sessionCookie)
      const userData = JSON.parse(userCookie)
      
      // Check if session is expired (24 hours)
      const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - sessionData.timestamp > SESSION_DURATION) {
        return null // Session expired
      }
      
      return userData
    }
    return null
  } catch {
    return null
  }
}