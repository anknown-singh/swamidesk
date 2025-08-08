'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react'
import { mfaService } from '@/lib/auth/mfa'

interface MFAVerificationProps {
  userId: string
  onSuccess: (session: any) => void
  onCancel?: () => void
}

export function MFAVerification({ userId, onSuccess, onCancel }: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [attempts, setAttempts] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isLocked, setIsLocked] = useState(false)

  const maxAttempts = 3
  const lockoutDuration = 300000 // 5 minutes

  // Countdown timer for TOTP refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = 30 - (now % 30)
      setTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Handle lockout
  useEffect(() => {
    if (attempts >= maxAttempts) {
      setIsLocked(true)
      const lockoutTimer = setTimeout(() => {
        setIsLocked(false)
        setAttempts(0)
        setError('')
      }, lockoutDuration)

      return () => clearTimeout(lockoutTimer)
    }
  }, [attempts])

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter a verification code')
      return
    }

    if (isLocked) {
      setError('Too many failed attempts. Please wait before trying again.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const result = await mfaService.verifyMFA(userId, verificationCode.trim(), useBackupCode)

      if (result.success) {
        onSuccess(result.session)
      } else {
        setAttempts(prev => prev + 1)
        setError(result.error || 'Verification failed')
        setVerificationCode('')
        
        // Show specific guidance based on attempt count
        if (attempts === 1) {
          setError(prev => prev + ' Please check your authenticator app and try again.')
        } else if (attempts >= 2) {
          setError(prev => prev + ' Consider using a backup code if you continue having issues.')
        }
      }
    } catch (err) {
      setAttempts(prev => prev + 1)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !isLocked) {
      handleVerification()
    }
  }

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode)
    setVerificationCode('')
    setError('')
    setAttempts(0)
  }

  const getProgressColor = () => {
    if (timeRemaining > 20) return 'bg-green-500'
    if (timeRemaining > 10) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRemainingAttempts = () => maxAttempts - attempts

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {useBackupCode 
              ? 'Enter one of your backup codes to continue'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lockout Warning */}
          {isLocked && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Account temporarily locked due to too many failed attempts. Please wait 5 minutes before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && !isLocked && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {getRemainingAttempts()} attempt{getRemainingAttempts() !== 1 ? 's' : ''} remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}

          {/* TOTP Timer (only for authenticator codes) */}
          {!useBackupCode && !isLocked && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Code refreshes in:
                </span>
                <span className="font-mono font-bold">{timeRemaining}s</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                  style={{ width: `${(timeRemaining / 30) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Verification Input */}
          <div className="space-y-2">
            <Label htmlFor="verification-code">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </Label>
            <Input
              id="verification-code"
              type="text"
              placeholder={useBackupCode ? 'Enter backup code' : '000000'}
              value={verificationCode}
              onChange={(e) => {
                const value = useBackupCode 
                  ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)
                  : e.target.value.replace(/\D/g, '').substring(0, 6)
                setVerificationCode(value)
                setError('') // Clear error on input change
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={useBackupCode ? 8 : 6}
              disabled={loading || isLocked}
              autoComplete="one-time-code"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              {useBackupCode 
                ? 'Enter the 8-character backup code (letters and numbers)'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleVerification}
              disabled={loading || isLocked || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && verificationCode.length !== 8)}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  {useBackupCode ? <Key className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                  Verify {useBackupCode ? 'Backup Code' : 'Code'}
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={toggleBackupCode}
                disabled={loading || isLocked}
                className="flex-1"
              >
                {useBackupCode ? (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Use Authenticator
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Use Backup Code
                  </>
                )}
              </Button>

              {onCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Having trouble?</p>
                <ul className="space-y-1 text-xs">
                  {useBackupCode ? (
                    <>
                      <li>• Backup codes are case-sensitive</li>
                      <li>• Each backup code can only be used once</li>
                      <li>• Contact support if you've used all backup codes</li>
                    </>
                  ) : (
                    <>
                      <li>• Make sure your device's time is correct</li>
                      <li>• Try waiting for a new code to generate</li>
                      <li>• Use a backup code if your authenticator isn't working</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-600">
              This is a secure authentication process. Never share your verification codes with anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}