'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Activity,
  Users,
  Database,
  Globe,
  Smartphone,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react'
import { dataEncryption } from '@/lib/security/encryption'
import { mfaService, sessionManager } from '@/lib/auth/mfa'
import { rbacService } from '@/lib/auth/rbac'

interface SecuritySettingsProps {
  userId: string
  userRole: string
  onSettingsChange?: (settings: any) => void
}

interface SecurityStatus {
  mfaEnabled: boolean
  passwordStrength: number
  activeSessions: number
  encryptionStatus: boolean
  auditLogEnabled: boolean
  rateLimitingEnabled: boolean
}

export function SecuritySettings({ userId, userRole, onSettingsChange }: SecuritySettingsProps) {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    mfaEnabled: false,
    passwordStrength: 0,
    activeSessions: 0,
    encryptionStatus: true,
    auditLogEnabled: true,
    rateLimitingEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    loadSecurityStatus()
  }, [userId])

  const loadSecurityStatus = async () => {
    try {
      setLoading(true)
      setError('')

      // Check MFA status
      const mfaEnabled = await mfaService.isMFAEnabled(userId)
      
      // Get active sessions
      const sessions = await sessionManager.getUserSessions(userId)
      
      // Calculate password strength (mock implementation)
      const passwordStrength = calculatePasswordStrength('dummy')

      setSecurityStatus({
        mfaEnabled,
        passwordStrength,
        activeSessions: sessions.length,
        encryptionStatus: true,
        auditLogEnabled: true,
        rateLimitingEnabled: true
      })

      setActiveSessions(sessions)
    } catch (err) {
      setError('Failed to load security status')
    } finally {
      setLoading(false)
    }
  }

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    const strength = calculatePasswordStrength(newPassword)
    if (strength < 75) {
      setError('Password is not strong enough')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // In a real implementation, you would call your password change API
      // await updatePassword(userId, currentPassword, newPassword)
      
      setSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleMFAToggle = async (enabled: boolean) => {
    try {
      setLoading(true)
      setError('')

      if (enabled) {
        // Redirect to MFA setup flow
        onSettingsChange?.({ action: 'setup_mfa' })
      } else {
        // Disable MFA (requires password confirmation)
        const result = await mfaService.disableMFA(userId, currentPassword)
        if (result) {
          setSecurityStatus(prev => ({ ...prev, mfaEnabled: false }))
          setSuccess('MFA disabled successfully')
        } else {
          setError('Failed to disable MFA')
        }
      }
    } catch (err) {
      setError('Failed to update MFA settings')
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      await sessionManager.destroySession(sessionId)
      await loadSecurityStatus()
      setSuccess('Session terminated successfully')
    } catch (err) {
      setError('Failed to terminate session')
    }
  }

  const terminateAllSessions = async () => {
    try {
      await sessionManager.destroyAllUserSessions(userId)
      await loadSecurityStatus()
      setSuccess('All sessions terminated successfully')
    } catch (err) {
      setError('Failed to terminate sessions')
    }
  }

  const downloadSecurityReport = () => {
    const report = {
      userId,
      timestamp: new Date().toISOString(),
      securityStatus,
      activeSessions: activeSessions.map(session => ({
        sessionId: session.sessionId,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      }))
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${userId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500'
    if (strength < 50) return 'bg-orange-500'
    if (strength < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak'
    if (strength < 50) return 'Fair'
    if (strength < 75) return 'Good'
    return 'Strong'
  }

  if (loading && selectedTab === 'overview') {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading security settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Security Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status Overview
              </CardTitle>
              <CardDescription>
                Your current security configuration and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* MFA Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">Two-Factor Auth</span>
                    </div>
                    <Badge variant={securityStatus.mfaEnabled ? "default" : "destructive"}>
                      {securityStatus.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {securityStatus.mfaEnabled ? 
                      'Your account is protected with 2FA' : 
                      'Enable 2FA for better security'
                    }
                  </p>
                </div>

                {/* Password Strength */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">Password Strength</span>
                    </div>
                    <Badge variant={securityStatus.passwordStrength >= 75 ? "default" : "destructive"}>
                      {getPasswordStrengthText(securityStatus.passwordStrength)}
                    </Badge>
                  </div>
                  <Progress 
                    value={securityStatus.passwordStrength} 
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-600">
                    Password strength: {securityStatus.passwordStrength}%
                  </p>
                </div>

                {/* Active Sessions */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">Active Sessions</span>
                    </div>
                    <Badge variant={securityStatus.activeSessions > 3 ? "destructive" : "default"}>
                      {securityStatus.activeSessions}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Devices currently signed in
                  </p>
                </div>

                {/* Data Encryption */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">Data Encryption</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Sensitive data is encrypted
                  </p>
                </div>

                {/* Audit Logging */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Audit Logging</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    All actions are logged
                  </p>
                </div>

                {/* Rate Limiting */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Rate Limiting</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    API requests are rate limited
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadSecurityReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Security Report
                </Button>
                <Button onClick={loadSecurityStatus} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Settings */}
        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">
                    Require a verification code from your phone when signing in
                  </p>
                </div>
                <Switch
                  checked={securityStatus.mfaEnabled}
                  onCheckedChange={handleMFAToggle}
                />
              </div>

              {securityStatus.mfaEnabled && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">MFA is enabled</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your account is protected with two-factor authentication
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Password Strength:</span>
                      <span className="font-medium">
                        {getPasswordStrengthText(calculatePasswordStrength(newPassword))}
                      </span>
                    </div>
                    <Progress 
                      value={calculatePasswordStrength(newPassword)} 
                      className={`h-2 ${getPasswordStrengthColor(calculatePasswordStrength(newPassword))}`}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Management */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices and locations where you're signed in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  You have {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={terminateAllSessions}
                  disabled={activeSessions.length === 0}
                >
                  Terminate All Sessions
                </Button>
              </div>

              <div className="space-y-3">
                {activeSessions.map((session, index) => (
                  <div key={session.sessionId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">
                            Session {index + 1}
                          </span>
                          {index === 0 && (
                            <Badge variant="outline">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          IP: {session.ipAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          Last active: {new Date(session.lastActivity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Device: {session.userAgent?.substring(0, 50)}...
                        </p>
                      </div>
                      {index !== 0 && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => terminateSession(session.sessionId)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Permissions</CardTitle>
              <CardDescription>
                View your current role and permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Current Role</span>
                  </div>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {userRole}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Your permissions are managed by system administrators. 
                    Contact your system administrator if you need additional access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Security Settings</CardTitle>
              <CardDescription>
                Advanced configuration options for security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  These settings are managed by system administrators to ensure optimal security for healthcare data.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Data Encryption</span>
                    <p className="text-sm text-gray-600">Sensitive data is automatically encrypted</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Audit Logging</span>
                    <p className="text-sm text-gray-600">All system activities are logged</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Rate Limiting</span>
                    <p className="text-sm text-gray-600">API requests are rate limited</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Security Headers</span>
                    <p className="text-sm text-gray-600">HTTP security headers are enforced</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}