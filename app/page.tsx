'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userProfile = profile as { role: string } | null
      if (userProfile?.role) {
        const dashboardPaths = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          receptionist: '/receptionist/dashboard',
          service_attendant: '/attendant/dashboard',
          pharmacist: '/pharmacy/dashboard'
        }
        router.push(dashboardPaths[userProfile.role as keyof typeof dashboardPaths])
      } else {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  )
}