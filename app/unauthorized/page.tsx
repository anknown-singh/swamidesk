'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Home, LogOut } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    if (user?.role) {
      router.push(`/${user.role}/dashboard`)
    } else {
      router.push('/login')
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                You are logged in as: <span className="font-medium">{user.full_name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </p>
              <p className="text-xs text-red-600 mt-2">
                This page requires different permissions than your current role
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You need to be logged in to access this page
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGoHome} 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            {user && (
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout & Login as Different User
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}