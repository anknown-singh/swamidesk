'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'

interface UserSession {
  id: string
  profile: UserProfile
}

export function useUser() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Use the same localStorage authentication as AuthenticatedLayout
        const sessionData = localStorage.getItem('swamicare_user')
        
        if (!sessionData) {
          setUser(null)
          setLoading(false)
          return
        }

        const userData = JSON.parse(sessionData)
        
        // Verify the user still exists in the database
        const { data: profiles } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .eq('is_active', true)

        if (!profiles || profiles.length === 0) {
          localStorage.removeItem('swamicare_user')
          setUser(null)
          setLoading(false)
          return
        }

        const profile = profiles[0] as UserProfile
        setUser({ 
          id: profile.id,
          profile 
        })
      } catch (error) {
        console.error('Error in getUser:', error)
        localStorage.removeItem('swamicare_user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
    
    // Listen for localStorage changes (for logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'swamicare_user') {
        if (!e.newValue) {
          setUser(null)
        } else {
          getUser()
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [supabase])

  return { user, loading }
}