'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole, UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AuthenticatedLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function AuthenticatedLayout({ children, allowedRoles }: AuthenticatedLayoutProps) {
  const [user, setUser] = useState<{ profile: UserProfile } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      try {
        // Check for our custom localStorage session
        const sessionData = localStorage.getItem('swamicare_user')
        
        if (!sessionData) {
          router.push('/login')
          return
        }

        const userData = JSON.parse(sessionData)
        
        // Verify the user still exists in the database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .eq('is_active', true)
          .single()

        if (!profile) {
          localStorage.removeItem('swamicare_user')
          router.push('/login')
          return
        }

        const userProfile = profile as UserProfile
        if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
          router.push('/unauthorized')
          return
        }

        setUser({ profile: userProfile })
      } catch (error) {
        console.error('Auth error:', error)
        localStorage.removeItem('swamicare_user')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase, router, allowedRoles])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userProfile={user.profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userProfile={user.profile} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}