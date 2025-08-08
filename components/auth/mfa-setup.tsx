'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Check, 
  AlertTriangle, 
  Key,
  Download,
  RefreshCw,
  QrCode,
  Lock
} from 'lucide-react'
import { mfaService } from '@/lib/auth/mfa'
import QRCode from 'qrcode'

interface MFASetupProps {
  userId: string
  onComplete: () => void
}

export function MFASetup({ userId, onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [mfaData, setMfaData] = useState<{
    secret: string
    qrCode: string
    backupCodes: string[]
  } | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [secretCopied, setSecretCopied] = useState(false)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)

  const setupMFA = async () => {
    try {
      setLoading(true)
      setError('')
      
      const result = await mfaService.setupMFA(userId)
      setMfaData(result)
      
      // Generate QR code image
      const qrImage = await QRCode.toDataURL(result.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrCodeImage(qrImage)
      
      setStep('verify')
      setSuccess('MFA setup initiated. Please scan the QR code with your authenticator app.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const success = await mfaService.enableMFA(userId, verificationCode)
      
      if (success) {
        setStep('backup')
        setSuccess('MFA enabled successfully! Please save your backup codes.')
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setSecretCopied(true)
        setTimeout(() => setSecretCopied(false), 2000)
      } else {
        setBackupCodesCopied(true)
        setTimeout(() => setBackupCodesCopied(false), 2000)
      }
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const downloadBackupCodes = () => {
    if (!mfaData?.backupCodes) return

    const content = `SwamIDesk MFA Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${mfaData.backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swamidesk-mfa-backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completeMFASetup = () => {
    setStep('complete')
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {['Setup', 'Verify', 'Backup', 'Complete'].map((label, index) => {
          const isActive = 
            (step === 'setup' && index === 0) ||
            (step === 'verify' && index === 1) ||
            (step === 'backup' && index === 2) ||
            (step === 'complete' && index === 3)
          const isCompleted = 
            (step === 'verify' && index === 0) ||
            (step === 'backup' && index <= 1) ||
            (step === 'complete' && index <= 2)

          return (
            <div key={label} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{label}</span>
              {index < 3 && (
                <div className={`ml-4 w-12 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Setup Step */}
      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Secure your account with an additional layer of protection using an authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Before you start:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download an authenticator app like Google Authenticator, Authy, or 1Password</li>
                <li>• Ensure you have access to your mobile device</li>
                <li>• Keep this window open during setup</li>
              </ul>
            </div>
            
            <Button 
              onClick={setupMFA} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Setting up MFA...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Set up Two-Factor Authentication
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verify Step */}
      {step === 'verify' && mfaData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Use your authenticator app to scan this QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <img src={qrCodeImage} alt="MFA QR Code" className="w-64 h-64" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code with your authenticator app
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label htmlFor="secret">Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="secret"
                      value={mfaData.secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mfaData.secret, 'secret')}
                    >
                      {secretCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Manually enter this key in your authenticator app if you can't scan the QR code
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button 
                onClick={verifyAndEnable} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Verify and Enable MFA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && mfaData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Save Backup Codes
            </CardTitle>
            <CardDescription>
              Keep these backup codes safe. You can use them to access your account if you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Each backup code can only be used once. Store them in a secure location.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {mfaData.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(mfaData.backupCodes.join('\n'), 'backup')}
                className="flex-1"
              >
                {backupCodesCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Codes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <Button onClick={completeMFASetup} className="w-full">
              I've Saved My Backup Codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              MFA Setup Complete
            </CardTitle>
            <CardDescription>
              Two-factor authentication has been successfully enabled for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-600">
              Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app each time you sign in.
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Account Secured
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  )
}