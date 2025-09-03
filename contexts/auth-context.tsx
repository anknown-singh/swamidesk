'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'

export interface UserProfile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone?: string
  department?: string
  specialization?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  isAuthenticated: false
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const SESSION_COOKIE = 'swamicare_session'
const USER_COOKIE = 'swamicare_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const normalizeRole = (role: string): UserRole => {
    if (role === 'service_attendant') return 'service_attendant'
    return role as UserRole
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
      setLoading(true)

      // Validate credentials against custom users table
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('is_active', true)
        .single()

      if (error || !users) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Simple password check (in production, use proper password hashing)
      if (password !== 'password123') {
        return { success: false, error: 'Invalid email or password' }
      }

      const userProfile: UserProfile = {
        id: users.id,
        role: normalizeRole(users.role),
        full_name: users.full_name,
        email: users.email,
        phone: users.phone,
        department: users.department,
        specialization: users.specialization,
        is_active: users.is_active,
        created_at: users.created_at,
        updated_at: users.updated_at
      }

      // Store session in secure cookies
      const sessionData = {
        userId: userProfile.id,
        timestamp: Date.now()
      }
      
      // Set secure cookies with 24-hour expiration
      const cookieOptions = {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
        sameSite: 'strict' as const,
        path: '/'
      }
      
      Cookies.set(SESSION_COOKIE, JSON.stringify(sessionData), cookieOptions)
      Cookies.set(USER_COOKIE, JSON.stringify(userProfile), cookieOptions)

      setUser(userProfile)
      setLoading(false)

      return { success: true, user: userProfile }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Remove cookies
    Cookies.remove(SESSION_COOKIE, { path: '/' })
    Cookies.remove(USER_COOKIE, { path: '/' })
    setUser(null)
    router.push('/login')
  }

  const loadSession = async () => {
    try {
      const sessionCookie = Cookies.get(SESSION_COOKIE)
      const userCookie = Cookies.get(USER_COOKIE)
      
      if (!sessionCookie || !userCookie) {
        setLoading(false)
        return
      }

      const { userId, timestamp } = JSON.parse(sessionCookie)
      const storedUser = JSON.parse(userCookie)
      
      // Check if session is expired (24 hours)
      const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - timestamp > SESSION_DURATION) {
        Cookies.remove(SESSION_COOKIE, { path: '/' })
        Cookies.remove(USER_COOKIE, { path: '/' })
        setLoading(false)
        return
      }

      // Verify user still exists and is active
      const { data: currentUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (error || !currentUser) {
        Cookies.remove(SESSION_COOKIE, { path: '/' })
        Cookies.remove(USER_COOKIE, { path: '/' })
        setLoading(false)
        return
      }

      // Update user data from database in case of changes
      const updatedUserProfile: UserProfile = {
        id: currentUser.id,
        role: normalizeRole(currentUser.role),
        full_name: currentUser.full_name,
        email: currentUser.email,
        phone: currentUser.phone,
        department: currentUser.department,
        specialization: currentUser.specialization,
        is_active: currentUser.is_active,
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at
      }

      setUser(updatedUserProfile)
    } catch (error) {
      console.error('Session load error:', error)
      Cookies.remove(SESSION_COOKIE, { path: '/' })
      Cookies.remove(USER_COOKIE, { path: '/' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()

    // Listen for cookie changes (logout from other tabs)
    const checkSession = () => {
      const sessionCookie = Cookies.get(SESSION_COOKIE)
      if (!sessionCookie && user) {
        setUser(null)
      }
    }

    const intervalId = setInterval(checkSession, 5000) // Check every 5 seconds
    return () => clearInterval(intervalId)
  }, []) // Fixed: Remove user dependency to prevent infinite re-renders

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}