'use client'

import { createClient } from '@/lib/supabase/client'

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_SUCCESS = 'mfa_success',
  MFA_FAILED = 'mfa_failed',

  // Authorization events
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',

  // Data events
  PATIENT_CREATED = 'patient_created',
  PATIENT_UPDATED = 'patient_updated',
  PATIENT_DELETED = 'patient_deleted',
  PATIENT_VIEWED = 'patient_viewed',
  MEDICAL_RECORD_CREATED = 'medical_record_created',
  MEDICAL_RECORD_UPDATED = 'medical_record_updated',
  MEDICAL_RECORD_VIEWED = 'medical_record_viewed',
  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_DISPENSED = 'prescription_dispensed',
  
  // Financial events
  INVOICE_CREATED = 'invoice_created',
  PAYMENT_PROCESSED = 'payment_processed',
  REFUND_PROCESSED = 'refund_processed',
  BILLING_VIEWED = 'billing_viewed',

  // System events
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  DATABASE_BACKUP = 'database_backup',
  SYSTEM_ERROR = 'system_error',
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // API events
  API_ACCESS = 'api_access',
  API_ERROR = 'api_error',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import'
}

// Risk levels for audit events
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Audit log entry interface
export interface AuditLogEntry {
  id?: string
  user_id?: string
  session_id?: string
  event_type: AuditEventType
  event_data?: any
  resource_type?: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  risk_level: RiskLevel
  success: boolean
  error_message?: string
  timestamp: string
  metadata?: any
}

// Audit configuration
interface AuditConfig {
  enabled: boolean
  logLevel: RiskLevel
  retentionDays: number
  enableRealTimeAlerts: boolean
  anonymizeData: boolean
  encryptLogs: boolean
}

// Advanced audit logging service
export class AuditLogger {
  private static instance: AuditLogger
  private config: AuditConfig
  private alertCallbacks: ((entry: AuditLogEntry) => void)[] = []
  private logBuffer: AuditLogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
    this.startAutoFlush()
  }

  private getDefaultConfig(): AuditConfig {
    return {
      enabled: true,
      logLevel: RiskLevel.LOW, // Log all events
      retentionDays: 2555, // ~7 years for healthcare compliance
      enableRealTimeAlerts: true,
      anonymizeData: process.env.NODE_ENV === 'production',
      encryptLogs: true
    }
  }

  // Log audit event
  async log(
    eventType: AuditEventType,
    options: {
      userId?: string
      sessionId?: string
      resourceType?: string
      resourceId?: string
      eventData?: any
      success?: boolean
      errorMessage?: string
      ipAddress?: string
      userAgent?: string
      metadata?: any
    } = {}
  ): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const riskLevel = this.calculateRiskLevel(eventType, options)
    
    // Skip if event is below configured log level
    if (this.getRiskValue(riskLevel) < this.getRiskValue(this.config.logLevel)) {
      return
    }

    const entry: AuditLogEntry = {
      user_id: options.userId,
      session_id: options.sessionId,
      event_type: eventType,
      event_data: this.sanitizeEventData(options.eventData),
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      ip_address: options.ipAddress || this.getClientIP(),
      user_agent: options.userAgent || this.getUserAgent(),
      risk_level: riskLevel,
      success: options.success !== false,
      error_message: options.errorMessage,
      timestamp: new Date().toISOString(),
      metadata: options.metadata
    }

    // Add to buffer for batch processing
    this.logBuffer.push(entry)

    // Immediate flush for high-risk events
    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      await this.flushBuffer()
    }

    // Trigger real-time alerts
    if (this.config.enableRealTimeAlerts && this.shouldAlert(entry)) {
      this.triggerAlert(entry)
    }
  }

  // Calculate risk level based on event type and context
  private calculateRiskLevel(eventType: AuditEventType, options: any): RiskLevel {
    // Critical events
    const criticalEvents = [
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.SYSTEM_CONFIG_CHANGED,
      AuditEventType.PERMISSION_CHANGED,
      AuditEventType.PATIENT_DELETED,
      AuditEventType.DATA_EXPORT
    ]

    // High-risk events
    const highRiskEvents = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.MFA_FAILED,
      AuditEventType.PASSWORD_CHANGED,
      AuditEventType.ROLE_ASSIGNED,
      AuditEventType.PATIENT_CREATED,
      AuditEventType.MEDICAL_RECORD_CREATED,
      AuditEventType.PRESCRIPTION_CREATED,
      AuditEventType.PAYMENT_PROCESSED
    ]

    // Medium-risk events
    const mediumRiskEvents = [
      AuditEventType.PATIENT_VIEWED,
      AuditEventType.MEDICAL_RECORD_VIEWED,
      AuditEventType.BILLING_VIEWED,
      AuditEventType.PATIENT_UPDATED,
      AuditEventType.MEDICAL_RECORD_UPDATED,
      AuditEventType.API_ACCESS
    ]

    if (criticalEvents.includes(eventType)) {
      return RiskLevel.CRITICAL
    }

    if (highRiskEvents.includes(eventType)) {
      return RiskLevel.HIGH
    }

    if (mediumRiskEvents.includes(eventType)) {
      return RiskLevel.MEDIUM
    }

    // Check for additional risk factors
    if (options.success === false) {
      return RiskLevel.HIGH
    }

    if (options.errorMessage) {
      return RiskLevel.MEDIUM
    }

    return RiskLevel.LOW
  }

  private getRiskValue(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.LOW: return 1
      case RiskLevel.MEDIUM: return 2
      case RiskLevel.HIGH: return 3
      case RiskLevel.CRITICAL: return 4
      default: return 1
    }
  }

  // Sanitize sensitive data in event logs
  private sanitizeEventData(data: any): any {
    if (!data || !this.config.anonymizeData) {
      return data
    }

    const sanitized = { ...data }
    
    // Remove or hash sensitive fields
    const sensitiveFields = [
      'password', 'ssn', 'social_security_number',
      'credit_card', 'bank_account', 'insurance_number',
      'phone_number', 'email', 'address', 'full_name'
    ]

    const hashFields = (obj: any, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          hashFields(obj[key], fullKey)
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          // Hash sensitive data instead of removing
          obj[key] = this.hashValue(String(obj[key]))
        }
      }
    }

    hashFields(sanitized)
    return sanitized
  }

  private hashValue(value: string): string {
    // Simple hash for audit logs (not cryptographically secure)
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`
  }

  // Check if event should trigger alert
  private shouldAlert(entry: AuditLogEntry): boolean {
    return (
      entry.risk_level === RiskLevel.CRITICAL ||
      entry.risk_level === RiskLevel.HIGH ||
      !entry.success
    )
  }

  // Trigger real-time alerts
  private triggerAlert(entry: AuditLogEntry): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(entry)
      } catch (error) {
        console.error('Alert callback failed:', error)
      }
    })

    // Log alert to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Security Alert: ${entry.event_type}`, entry)
    }
  }

  // Add alert callback
  onAlert(callback: (entry: AuditLogEntry) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Flush log buffer to database
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return
    }

    const entries = [...this.logBuffer]
    this.logBuffer = []

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries)

      if (error) {
        throw error
      }

      // Log successful flush in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 Flushed ${entries.length} audit log entries`)
      }

    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      
      // Put entries back in buffer for retry
      this.logBuffer.unshift(...entries)
      
      // Limit buffer size to prevent memory issues
      if (this.logBuffer.length > 1000) {
        this.logBuffer = this.logBuffer.slice(0, 1000)
      }
    }
  }

  // Start auto-flush timer
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer()
    }, 30000) // Flush every 30 seconds
  }

  // Stop auto-flush timer
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  // Query audit logs with filtering
  async queryLogs(filters: {
    userId?: string
    eventType?: AuditEventType
    resourceType?: string
    resourceId?: string
    startDate?: Date
    endDate?: Date
    riskLevel?: RiskLevel
    success?: boolean
    limit?: number
    offset?: number
  } = {}): Promise<{ data: AuditLogEntry[]; total: number }> {
    try {
      const supabase = createClient()
      let query = supabase.from('audit_logs').select('*', { count: 'exact' })

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId)
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString())
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString())
      }

      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel)
      }

      if (filters.success !== undefined) {
        query = query.eq('success', filters.success)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      // Order by timestamp descending
      query = query.order('timestamp', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        data: data || [],
        total: count || 0
      }

    } catch (error) {
      console.error('Failed to query audit logs:', error)
      return { data: [], total: 0 }
    }
  }

  // Generate audit report
  async generateReport(
    startDate: Date,
    endDate: Date,
    options: {
      includeSuccessEvents?: boolean
      groupByUser?: boolean
      groupByEventType?: boolean
      includeRiskAnalysis?: boolean
    } = {}
  ): Promise<{
    summary: any
    events: AuditLogEntry[]
    riskAnalysis?: any
    userActivity?: any
    eventTypeBreakdown?: any
  }> {
    try {
      const logs = await this.queryLogs({
        startDate,
        endDate,
        success: options.includeSuccessEvents ? undefined : false
      })

      const summary = {
        totalEvents: logs.total,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        criticalEvents: logs.data.filter(e => e.risk_level === RiskLevel.CRITICAL).length,
        highRiskEvents: logs.data.filter(e => e.risk_level === RiskLevel.HIGH).length,
        failedEvents: logs.data.filter(e => !e.success).length,
        uniqueUsers: new Set(logs.data.map(e => e.user_id).filter(Boolean)).size
      }

      let riskAnalysis, userActivity, eventTypeBreakdown

      if (options.includeRiskAnalysis) {
        riskAnalysis = this.analyzeRisk(logs.data)
      }

      if (options.groupByUser) {
        userActivity = this.groupByUser(logs.data)
      }

      if (options.groupByEventType) {
        eventTypeBreakdown = this.groupByEventType(logs.data)
      }

      return {
        summary,
        events: logs.data,
        riskAnalysis,
        userActivity,
        eventTypeBreakdown
      }

    } catch (error) {
      console.error('Failed to generate audit report:', error)
      throw error
    }
  }

  private analyzeRisk(logs: AuditLogEntry[]): any {
    const riskByLevel = logs.reduce((acc, log) => {
      acc[log.risk_level] = (acc[log.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const failureRate = logs.length > 0 ? 
      (logs.filter(l => !l.success).length / logs.length) * 100 : 0

    return {
      riskByLevel,
      failureRate: Math.round(failureRate * 100) / 100,
      topRiskyEvents: logs
        .filter(l => l.risk_level === RiskLevel.CRITICAL || l.risk_level === RiskLevel.HIGH)
        .slice(0, 10)
    }
  }

  private groupByUser(logs: AuditLogEntry[]): any {
    return logs.reduce((acc, log) => {
      const userId = log.user_id || 'anonymous'
      if (!acc[userId]) {
        acc[userId] = {
          totalEvents: 0,
          failedEvents: 0,
          eventTypes: new Set()
        }
      }
      
      acc[userId].totalEvents++
      if (!log.success) {
        acc[userId].failedEvents++
      }
      acc[userId].eventTypes.add(log.event_type)
      
      return acc
    }, {} as Record<string, any>)
  }

  private groupByEventType(logs: AuditLogEntry[]): any {
    return logs.reduce((acc, log) => {
      const eventType = log.event_type
      if (!acc[eventType]) {
        acc[eventType] = {
          total: 0,
          successful: 0,
          failed: 0,
          riskLevels: {}
        }
      }
      
      acc[eventType].total++
      if (log.success) {
        acc[eventType].successful++
      } else {
        acc[eventType].failed++
      }
      
      acc[eventType].riskLevels[log.risk_level] = 
        (acc[eventType].riskLevels[log.risk_level] || 0) + 1
      
      return acc
    }, {} as Record<string, any>)
  }

  // Clean old logs based on retention policy
  async cleanupOldLogs(): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      const supabase = createClient()
      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())

      if (error) {
        throw error
      }

      const deletedCount = Array.isArray(data) ? data.length : 0
      
      if (deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${deletedCount} old audit log entries`)
      }

      return deletedCount

    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
      return 0
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<AuditConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): AuditConfig {
    return { ...this.config }
  }

  private getClientIP(): string {
    // In a browser environment, this would be handled server-side
    return '127.0.0.1'
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  }

  // Cleanup resources
  cleanup(): void {
    this.stopAutoFlush()
    this.flushBuffer() // Final flush
  }
}

// Healthcare-specific audit helpers
export class HealthcareAuditHelpers {
  private static audit = AuditLogger.getInstance()

  // Log patient data access
  static async logPatientAccess(
    userId: string,
    patientId: string,
    action: 'viewed' | 'created' | 'updated' | 'deleted',
    metadata?: any
  ): Promise<void> {
    const eventTypes = {
      viewed: AuditEventType.PATIENT_VIEWED,
      created: AuditEventType.PATIENT_CREATED,
      updated: AuditEventType.PATIENT_UPDATED,
      deleted: AuditEventType.PATIENT_DELETED
    }

    await this.audit.log(eventTypes[action], {
      userId,
      resourceType: 'patient',
      resourceId: patientId,
      metadata
    })
  }

  // Log medical record access
  static async logMedicalRecordAccess(
    userId: string,
    recordId: string,
    patientId: string,
    action: 'viewed' | 'created' | 'updated',
    metadata?: any
  ): Promise<void> {
    const eventTypes = {
      viewed: AuditEventType.MEDICAL_RECORD_VIEWED,
      created: AuditEventType.MEDICAL_RECORD_CREATED,
      updated: AuditEventType.MEDICAL_RECORD_UPDATED
    }

    await this.audit.log(eventTypes[action], {
      userId,
      resourceType: 'medical_record',
      resourceId: recordId,
      metadata: { ...metadata, patientId }
    })
  }

  // Log prescription events
  static async logPrescriptionEvent(
    userId: string,
    prescriptionId: string,
    patientId: string,
    action: 'created' | 'dispensed',
    metadata?: any
  ): Promise<void> {
    const eventTypes = {
      created: AuditEventType.PRESCRIPTION_CREATED,
      dispensed: AuditEventType.PRESCRIPTION_DISPENSED
    }

    await this.audit.log(eventTypes[action], {
      userId,
      resourceType: 'prescription',
      resourceId: prescriptionId,
      metadata: { ...metadata, patientId }
    })
  }

  // Log billing events
  static async logBillingEvent(
    userId: string,
    invoiceId: string,
    patientId: string,
    action: 'created' | 'viewed' | 'payment' | 'refund',
    metadata?: any
  ): Promise<void> {
    const eventTypes = {
      created: AuditEventType.INVOICE_CREATED,
      viewed: AuditEventType.BILLING_VIEWED,
      payment: AuditEventType.PAYMENT_PROCESSED,
      refund: AuditEventType.REFUND_PROCESSED
    }

    await this.audit.log(eventTypes[action], {
      userId,
      resourceType: 'invoice',
      resourceId: invoiceId,
      metadata: { ...metadata, patientId }
    })
  }

  // Log data export (HIPAA compliance)
  static async logDataExport(
    userId: string,
    exportType: string,
    recordCount: number,
    metadata?: any
  ): Promise<void> {
    await this.audit.log(AuditEventType.DATA_EXPORT, {
      userId,
      resourceType: 'data_export',
      eventData: {
        exportType,
        recordCount,
        timestamp: new Date().toISOString()
      },
      metadata
    })
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()