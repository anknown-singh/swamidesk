'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Stethoscope } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First, check if user exists in our custom users table
      const { data: userProfiles, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, full_name, password_hash, is_active')
        .eq('email', email)
        .eq('is_active', true)

      if (profileError || !userProfiles || userProfiles.length === 0) {
        setError('Invalid email or password')
        return
      }

      const userProfile = userProfiles[0]

      // For demo purposes, we'll accept 'password123' for all users
      // In production, you'd verify the password hash properly
      if (password !== 'password123') {
        setError('Invalid email or password')
        return
      }

      // Now sign in with Supabase Auth using a service role approach
      // Since we can't create arbitrary Supabase users, we'll use the admin user
      // and store the actual user info in the session
      
      try {
        // For demo purposes, we'll create a temporary auth session
        // This is a workaround since we have a custom user table
        
        // Store user session info
        const normalizeRole = (role: string): string => {
          if (role === 'service_attendant') return 'attendant'
          return role
        }
        
        const normalizedRole = normalizeRole(userProfile.role)

        // Store both localStorage (for backward compatibility) and prepare for Supabase
        const userSessionData = {
          id: userProfile.id,
          email: userProfile.email,
          role: normalizedRole,
          name: userProfile.full_name || 'Unknown User'
        }

        localStorage.setItem('swamicare_user', JSON.stringify(userSessionData))

        // For Supabase to recognize the user as authenticated, we need to create a session
        // Since we can't create arbitrary users, we'll use the RLS bypass we created earlier
        
        // Set a flag to indicate successful authentication
        localStorage.setItem('swamicare_auth_token', userProfile.id)
        
        // Redirect to appropriate dashboard
        const dashboardPaths = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          receptionist: '/receptionist/dashboard',
          attendant: '/attendant/dashboard',
          pharmacist: '/pharmacy/dashboard'
        }
        
        const targetPath = dashboardPaths[normalizedRole as keyof typeof dashboardPaths] || '/login'
        
        // Try router.push first, then fallback to window.location
        try {
          router.push(targetPath)
          // If router.push doesn't work immediately, use window.location as fallback
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              window.location.href = targetPath
            }
          }, 100)
        } catch {
          window.location.href = targetPath
        }

      } catch (authError) {
        console.error('Authentication error:', authError)
        setError('Authentication failed. Please try again.')
      }

    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">SwamiCare</CardTitle>
          <CardDescription>Clinic Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Accounts:</p>
            <div className="mt-2 space-y-1 text-xs">
              <p><strong>Admin:</strong> admin@swamicare.com</p>
              <p><strong>Doctor:</strong> doctor@swamicare.com</p>
              <p><strong>Receptionist:</strong> receptionist@swamicare.com</p>
              <p className="text-gray-500">Password: password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}