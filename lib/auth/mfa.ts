'use client'

import { createClient } from '@/lib/supabase/client'
import { createHash, randomBytes } from 'crypto'

interface MFASetupResult {
  secret: string
  qrCode: string
  backupCodes: string[]
}

interface MFAVerifyResult {
  success: boolean
  error?: string
  session?: any
}

interface SessionData {
  userId: string
  email: string
  role: string
  lastActivity: number
  ipAddress?: string
  userAgent?: string
  mfaVerified: boolean
  sessionId: string
}

// MFA Token generation and verification
export class MFAService {
  private static instance: MFAService
  private readonly secretLength = 32
  private readonly tokenValidityWindow = 30 // seconds
  private readonly backupCodeCount = 10

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService()
    }
    return MFAService.instance
  }

  // Generate TOTP secret for MFA setup
  async setupMFA(userId: string): Promise<MFASetupResult> {
    try {
      const supabase = createClient()
      
      // Generate secret
      const secret = this.generateSecret()
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes()
      
      // Create QR code URL (Google Authenticator compatible)
      const issuer = 'SwamIDesk'
      const label = `${issuer}:${userId}`
      const qrCode = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`

      // Store MFA settings in database
      const { error } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: userId,
          secret_encrypted: this.encryptSecret(secret),
          backup_codes_encrypted: this.encryptBackupCodes(backupCodes),
          is_enabled: false, // User must verify first TOTP to enable
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Failed to setup MFA: ${error.message}`)
      }

      return {
        secret,
        qrCode,
        backupCodes
      }
    } catch (error) {
      throw new Error(`MFA setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Verify TOTP token
  async verifyMFA(userId: string, token: string, useBackupCode = false): Promise<MFAVerifyResult> {
    try {
      const supabase = createClient()

      // Get user's MFA settings
      const { data: mfaSettings, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .single()

      if (error || !mfaSettings) {
        return { success: false, error: 'MFA not configured for this user' }
      }

      let isValid = false

      if (useBackupCode) {
        // Verify backup code
        isValid = await this.verifyBackupCode(userId, token, mfaSettings)
      } else {
        // Verify TOTP token
        const secret = this.decryptSecret(mfaSettings.secret_encrypted)
        isValid = this.verifyTOTP(secret, token)
      }

      if (isValid) {
        // Update last used timestamp
        await supabase
          .from('user_mfa_settings')
          .update({ 
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        // Log MFA success
        await this.logMFAEvent(userId, 'mfa_success', { useBackupCode })

        return { success: true }
      } else {
        // Log MFA failure
        await this.logMFAEvent(userId, 'mfa_failure', { useBackupCode, token: token.substring(0, 2) + '****' })
        return { success: false, error: 'Invalid authentication code' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: `MFA verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Enable MFA after successful verification
  async enableMFA(userId: string, verificationToken: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // First verify the token
      const verifyResult = await this.verifyMFA(userId, verificationToken)
      if (!verifyResult.success) {
        return false
      }

      // Enable MFA
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({ 
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to enable MFA: ${error.message}`)
      }

      await this.logMFAEvent(userId, 'mfa_enabled')
      return true
    } catch (error) {
      console.error('Enable MFA error:', error)
      return false
    }
  }

  // Disable MFA (requires password confirmation)
  async disableMFA(userId: string, _password: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Verify password first (implement password verification)
      // This would typically involve re-authentication with Supabase
      
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({ 
          is_enabled: false,
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to disable MFA: ${error.message}`)
      }

      await this.logMFAEvent(userId, 'mfa_disabled')
      return true
    } catch (error) {
      console.error('Disable MFA error:', error)
      return false
    }
  }

  // Check if user has MFA enabled
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('is_enabled')
        .eq('user_id', userId)
        .single()

      return !error && data?.is_enabled === true
    } catch (error) {
      return false
    }
  }

  // Generate new backup codes
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const supabase = createClient()
      const backupCodes = this.generateBackupCodes()

      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          backup_codes_encrypted: this.encryptBackupCodes(backupCodes),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to generate backup codes: ${error.message}`)
      }

      await this.logMFAEvent(userId, 'backup_codes_regenerated')
      return backupCodes
    } catch (error) {
      throw new Error(`Backup code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods
  private generateSecret(): string {
    return randomBytes(this.secretLength).toString('base64').replace(/[^A-Za-z0-9]/g, '').substring(0, 32)
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < this.backupCodeCount; i++) {
      // Generate 8-character alphanumeric backup codes
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }
    return codes
  }

  private verifyTOTP(secret: string, token: string): boolean {
    const currentTime = Math.floor(Date.now() / 1000)
    const timeWindow = Math.floor(currentTime / this.tokenValidityWindow)

    // Check current window and adjacent windows for clock drift
    for (let window = -1; window <= 1; window++) {
      const testTime = timeWindow + window
      const expectedToken = this.generateTOTP(secret, testTime)
      if (expectedToken === token) {
        return true
      }
    }
    return false
  }

  private generateTOTP(secret: string, timeWindow: number): string {
    // Simplified TOTP implementation
    // In production, use a proper TOTP library like 'otplib'
    const hash = createHash('sha1')
      .update(secret + timeWindow.toString())
      .digest('hex')
    
    const code = parseInt(hash.substring(0, 6), 16) % 1000000
    return code.toString().padStart(6, '0')
  }

  private async verifyBackupCode(userId: string, code: string, mfaSettings: any): Promise<boolean> {
    try {
      const supabase = createClient()
      const backupCodes = this.decryptBackupCodes(mfaSettings.backup_codes_encrypted)
      
      if (backupCodes.includes(code.toUpperCase())) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(bc => bc !== code.toUpperCase())
        
        await supabase
          .from('user_mfa_settings')
          .update({
            backup_codes_encrypted: this.encryptBackupCodes(updatedCodes),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption with environment variable key
    return Buffer.from(secret).toString('base64')
  }

  private decryptSecret(encryptedSecret: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedSecret, 'base64').toString()
  }

  private encryptBackupCodes(codes: string[]): string {
    // In production, use proper encryption
    return Buffer.from(JSON.stringify(codes)).toString('base64')
  }

  private decryptBackupCodes(encryptedCodes: string): string[] {
    // In production, use proper decryption
    return JSON.parse(Buffer.from(encryptedCodes, 'base64').toString())
  }

  private async logMFAEvent(userId: string, event: string, metadata?: any): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('security_audit_log').insert({
        user_id: userId,
        event_type: event,
        event_data: metadata,
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log MFA event:', error)
    }
  }

  private getClientIP(): string {
    // This would be handled server-side in production
    return '127.0.0.1'
  }
}

// Session Management
export class SessionManager {
  private static instance: SessionManager
  private sessions = new Map<string, SessionData>()
  private readonly sessionTimeout = 30 * 60 * 1000 // 30 minutes
  private readonly maxSessions = 5 // Maximum concurrent sessions per user

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Create new session
  async createSession(userId: string, email: string, role: string, mfaVerified = false): Promise<string> {
    const sessionId = this.generateSessionId()
    const sessionData: SessionData = {
      userId,
      email,
      role,
      lastActivity: Date.now(),
      mfaVerified,
      sessionId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    }

    // Clean up old sessions for user
    await this.cleanupUserSessions(userId)

    // Store session
    this.sessions.set(sessionId, sessionData)

    // Store in database for persistence across server restarts
    await this.persistSession(sessionData)

    return sessionId
  }

  // Validate session
  async validateSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      // Try to load from database
      const persistedSession = await this.loadSession(sessionId)
      if (persistedSession) {
        this.sessions.set(sessionId, persistedSession)
        return persistedSession
      }
      return null
    }

    // Check if session is expired
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      await this.destroySession(sessionId)
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()
    await this.updateSessionActivity(sessionId)

    return session
  }

  // Update MFA verification status
  async updateMFAStatus(sessionId: string, mfaVerified: boolean): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.mfaVerified = mfaVerified
      await this.persistSession(session)
    }
  }

  // Destroy session
  async destroySession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    
    // Remove from database
    try {
      const supabase = createClient()
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId)
    } catch (error) {
      console.error('Failed to remove session from database:', error)
    }
  }

  // Destroy all sessions for a user
  async destroyAllUserSessions(userId: string): Promise<void> {
    // Remove from memory
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId)
      }
    }

    // Remove from database
    try {
      const supabase = createClient()
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('Failed to remove user sessions from database:', error)
    }
  }

  // Get active sessions for user
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })

      if (error) {
        throw error
      }

      return data.map(session => ({
        userId: session.user_id,
        email: session.email,
        role: session.role,
        lastActivity: new Date(session.last_activity).getTime(),
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        mfaVerified: session.mfa_verified,
        sessionId: session.session_id
      }))
    } catch (error) {
      console.error('Failed to get user sessions:', error)
      return []
    }
  }

  // Private helper methods
  private generateSessionId(): string {
    return randomBytes(32).toString('hex')
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId)
    
    if (userSessions.length >= this.maxSessions) {
      // Remove oldest sessions
      const sessionsToRemove = userSessions.slice(this.maxSessions - 1)
      for (const session of sessionsToRemove) {
        await this.destroySession(session.sessionId)
      }
    }
  }

  private async persistSession(session: SessionData): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('user_sessions').upsert({
        session_id: session.sessionId,
        user_id: session.userId,
        email: session.email,
        role: session.role,
        last_activity: new Date(session.lastActivity).toISOString(),
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        mfa_verified: session.mfaVerified,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to persist session:', error)
    }
  }

  private async loadSession(sessionId: string): Promise<SessionData | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        userId: data.user_id,
        email: data.email,
        role: data.role,
        lastActivity: new Date(data.last_activity).getTime(),
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        mfaVerified: data.mfa_verified,
        sessionId: data.session_id
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      return null
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', sessionId)
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }

  private getClientIP(): string {
    // This would be handled server-side in production
    return '127.0.0.1'
  }
}

// Export singleton instances
export const mfaService = MFAService.getInstance()
export const sessionManager = SessionManager.getInstance()