'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const signOut = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    // Clear localStorage
    localStorage.removeItem('swamicare_user')
    setUser(null)
    setUserProfile(null)
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (profile) {
        setUserProfile(profile as UserProfile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a localStorage session (legacy system)
        const localSession = localStorage.getItem('swamicare_user')
        
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User is authenticated with Supabase
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else if (localSession) {
          // User has localStorage session but no Supabase session
          // Create a Supabase session for them
          const userData = JSON.parse(localSession)
          await createSupabaseSessionFromLocal(userData)
        } else {
          // No authentication found
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    const createSupabaseSessionFromLocal = async (userData: any) => {
      try {
        //For the demo, we'll create a temporary Supabase user session
        //In production, you'd want to handle this more securely
        
        // Verify user still exists in database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .eq('is_active', true)
          .single()

        if (profile) {
          // Create a fake JWT session for Supabase to use
          // This is a temporary solution - in production you'd implement proper auth
          const fakeUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              full_name: profile.full_name,
              role: profile.role
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            role: 'authenticated'
          }
          
          setUser(fakeUser as User)
          setUserProfile(profile as UserProfile)
        } else {
          //User no longer exists, clear localStorage
          localStorage.removeItem('swamicare_user')
        }
      } catch (error) {
        console.error('Error creating Supabase session from localStorage:', error)
        localStorage.removeItem('swamicare_user')
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          localStorage.removeItem('swamicare_user')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signOut,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}