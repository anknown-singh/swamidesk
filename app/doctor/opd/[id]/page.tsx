'use client'

import { OPDManagement } from '@/components/opd/opd-management'
import { useAuth } from '@/contexts/auth-context'
import { useParams, useSearchParams } from 'next/navigation'

export default function DoctorOPDByIdPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  
  // Get OPD ID from route parameter
  const opdId = params.id as string
  
  // Get patient ID from query parameter (if provided)
  const patientId = searchParams.get('patientId')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h3 className="text-lg font-medium mb-2">Session Error</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load user session. Please try refreshing the page or log in again.
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!opdId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-orange-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Missing OPD ID</h3>
          <p className="text-muted-foreground mb-4">
            No OPD session ID provided in the URL.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OPDManagement 
        userRole="doctor" 
        userId={user.id}
        prefilledOpdId={opdId}
        prefilledPatientId={patientId}
      />
    </div>
  )
}