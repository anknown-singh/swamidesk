'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/contexts/auth-context'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AuthenticatedLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  rightSideActions?: ReactNode
}

export function AuthenticatedLayout({ children, allowedRoles, rightSideActions }: AuthenticatedLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return

    // If no user is authenticated, redirect to login
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [user, loading, isAuthenticated, router, allowedRoles])

  useEffect(() => {
    if (loading && typeof document !== 'undefined') {
      document.title = 'Loading... - SwamiCare'
    }
  }, [loading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading...</div>
          <div className="text-sm text-gray-500 mt-1">Checking authentication</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userProfile={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userProfile={user} rightSideActions={rightSideActions} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}