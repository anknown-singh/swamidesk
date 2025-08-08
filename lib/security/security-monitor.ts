'use client'

import { auditLogger, AuditEventType, RiskLevel } from './audit-logger'
import { rbacService } from '../auth/rbac'
import { sessionManager } from '../auth/mfa'

// Security metrics interface
interface SecurityMetrics {
  timestamp: string
  failedLogins: number
  successfulLogins: number
  mfaFailures: number
  accessDenials: number
  criticalEvents: number
  activeSessions: number
  suspiciousActivity: number
  dataAccess: number
  systemErrors: number
}

// Threat detection patterns
interface ThreatPattern {
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  condition: (events: any[]) => boolean
  alertMessage: string
}

// Security incident interface
interface SecurityIncident {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  ipAddress?: string
  timestamp: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  events: any[]
  metadata?: any
}

// Real-time security monitoring service
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private metrics: Map<string, SecurityMetrics> = new Map()
  private incidents: Map<string, SecurityIncident> = new Map()
  private threatPatterns: ThreatPattern[] = []
  private alertCallbacks: ((incident: SecurityIncident) => void)[] = []
  private monitoringInterval?: NodeJS.Timeout
  private metricsBuffer: any[] = []

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  constructor() {
    this.initializeThreatPatterns()
    this.startMonitoring()
    this.setupAuditLogging()
  }

  // Initialize threat detection patterns
  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      // Brute force login attempts
      {
        name: 'bruteforce_login',
        description: 'Multiple failed login attempts from same IP',
        severity: 'high',
        condition: (events) => {
          const failedLogins = events.filter(e => 
            e.event_type === AuditEventType.LOGIN_FAILED &&
            e.timestamp > new Date(Date.now() - 15 * 60 * 1000).toISOString() // Last 15 minutes
          )
          
          // Group by IP address
          const ipCounts = failedLogins.reduce((acc, event) => {
            const ip = event.ip_address || 'unknown'
            acc[ip] = (acc[ip] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          
          return Object.values(ipCounts).some(count => count >= 5)
        },
        alertMessage: 'Potential brute force attack detected'
      },

      // Privilege escalation attempts
      {
        name: 'privilege_escalation',
        description: 'Multiple access denied events for high-privilege resources',
        severity: 'critical',
        condition: (events) => {
          const accessDenials = events.filter(e => 
            e.event_type === AuditEventType.ACCESS_DENIED &&
            e.timestamp > new Date(Date.now() - 10 * 60 * 1000).toISOString() && // Last 10 minutes
            e.risk_level === RiskLevel.HIGH
          )
          
          // Same user attempting multiple high-risk actions
          const userCounts = accessDenials.reduce((acc, event) => {
            const userId = event.user_id || 'anonymous'
            acc[userId] = (acc[userId] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          
          return Object.values(userCounts).some(count => count >= 3)
        },
        alertMessage: 'Potential privilege escalation attempt detected'
      },

      // Unusual data access patterns
      {
        name: 'unusual_data_access',
        description: 'Abnormal volume of patient data access',
        severity: 'medium',
        condition: (events) => {
          const dataAccess = events.filter(e => 
            [
              AuditEventType.PATIENT_VIEWED,
              AuditEventType.MEDICAL_RECORD_VIEWED
            ].includes(e.event_type) &&
            e.timestamp > new Date(Date.now() - 60 * 60 * 1000).toISOString() // Last hour
          )
          
          // Check for users accessing many different patients
          const userPatientAccess = dataAccess.reduce((acc, event) => {
            const userId = event.user_id || 'anonymous'
            const patientId = event.resource_id || event.metadata?.patientId
            
            if (!acc[userId]) {
              acc[userId] = new Set()
            }
            if (patientId) {
              acc[userId].add(patientId)
            }
            return acc
          }, {} as Record<string, Set<string>>)
          
          return Object.values(userPatientAccess).some(patients => patients.size > 20)
        },
        alertMessage: 'Unusual patient data access pattern detected'
      },

      // Multiple MFA failures
      {
        name: 'mfa_attacks',
        description: 'Multiple MFA failures indicating potential account compromise',
        severity: 'high',
        condition: (events) => {
          const mfaFailures = events.filter(e => 
            e.event_type === AuditEventType.MFA_FAILED &&
            e.timestamp > new Date(Date.now() - 30 * 60 * 1000).toISOString() // Last 30 minutes
          )
          
          return mfaFailures.length >= 5
        },
        alertMessage: 'Multiple MFA failure attempts detected'
      },

      // Session hijacking indicators
      {
        name: 'session_anomaly',
        description: 'Suspicious session activity patterns',
        severity: 'medium',
        condition: (events) => {
          const loginEvents = events.filter(e => 
            e.event_type === AuditEventType.USER_LOGIN &&
            e.timestamp > new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // Last 2 hours
          )
          
          // Check for same user logging in from different IPs rapidly
          const userLogins = loginEvents.reduce((acc, event) => {
            const userId = event.user_id
            if (!userId) return acc
            
            if (!acc[userId]) {
              acc[userId] = []
            }
            acc[userId].push({
              ip: event.ip_address,
              timestamp: event.timestamp
            })
            return acc
          }, {} as Record<string, Array<{ ip: string; timestamp: string }>>)
          
          return Object.values(userLogins).some(logins => {
            const uniqueIPs = new Set(logins.map(l => l.ip))
            return uniqueIPs.size >= 3 && logins.length >= 3 // 3+ different IPs in 2 hours
          })
        },
        alertMessage: 'Potential session hijacking or account sharing detected'
      },

      // Data export anomalies
      {
        name: 'suspicious_export',
        description: 'Large or frequent data exports',
        severity: 'critical',
        condition: (events) => {
          const exports = events.filter(e => 
            e.event_type === AuditEventType.DATA_EXPORT &&
            e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
          )
          
          // Check for large exports or many exports by same user
          return exports.some(e => 
            e.event_data?.recordCount > 1000 || // Large export
            exports.filter(ex => ex.user_id === e.user_id).length >= 5 // Many exports
          )
        },
        alertMessage: 'Suspicious data export activity detected'
      },

      // System configuration changes
      {
        name: 'config_changes',
        description: 'Critical system configuration changes',
        severity: 'critical',
        condition: (events) => {
          return events.some(e => 
            e.event_type === AuditEventType.SYSTEM_CONFIG_CHANGED &&
            e.timestamp > new Date(Date.now() - 60 * 60 * 1000).toISOString() // Last hour
          )
        },
        alertMessage: 'Critical system configuration change detected'
      }
    ]
  }

  // Start real-time monitoring
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.analyzeSecurityEvents()
      await this.updateMetrics()
    }, 60000) // Check every minute
  }

  // Setup audit logging integration
  private setupAuditLogging(): void {
    auditLogger.onAlert((entry) => {
      this.metricsBuffer.push(entry)
      
      // Immediate analysis for critical events
      if (entry.risk_level === RiskLevel.CRITICAL) {
        this.analyzeSecurityEvents()
      }
    })
  }

  // Analyze security events for threats
  private async analyzeSecurityEvents(): Promise<void> {
    try {
      // Get recent events for analysis
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 4 * 60 * 60 * 1000) // Last 4 hours
      
      const { data: events } = await auditLogger.queryLogs({
        startDate,
        endDate,
        limit: 1000
      })

      // Add buffered events
      const allEvents = [...events, ...this.metricsBuffer]

      // Check each threat pattern
      for (const pattern of this.threatPatterns) {
        if (pattern.condition(allEvents)) {
          await this.createIncident(pattern, allEvents)
        }
      }

      // Clear buffer after analysis
      this.metricsBuffer = []

    } catch (error) {
      console.error('Security analysis failed:', error)
    }
  }

  // Create security incident
  private async createIncident(
    pattern: ThreatPattern,
    events: any[]
  ): Promise<void> {
    const incidentId = `${pattern.name}_${Date.now()}`
    
    // Check if similar incident already exists and is recent
    const existingIncident = Array.from(this.incidents.values()).find(
      incident => 
        incident.type === pattern.name &&
        incident.status !== 'closed' &&
        new Date(incident.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Within last hour
    )

    if (existingIncident) {
      // Update existing incident
      existingIncident.events.push(...events.slice(-10)) // Add latest events
      existingIncident.timestamp = new Date().toISOString()
      return
    }

    const incident: SecurityIncident = {
      id: incidentId,
      type: pattern.name,
      severity: pattern.severity,
      description: pattern.description,
      timestamp: new Date().toISOString(),
      status: 'open',
      events: events.filter(e => this.isEventRelevant(e, pattern)).slice(-20), // Last 20 relevant events
      metadata: {
        alertMessage: pattern.alertMessage,
        detectionTime: new Date().toISOString()
      }
    }

    // Extract common details from events
    const userIds = new Set(incident.events.map(e => e.user_id).filter(Boolean))
    const ipAddresses = new Set(incident.events.map(e => e.ip_address).filter(Boolean))

    if (userIds.size === 1) {
      incident.userId = Array.from(userIds)[0]
    }

    if (ipAddresses.size === 1) {
      incident.ipAddress = Array.from(ipAddresses)[0]
    }

    this.incidents.set(incidentId, incident)

    // Trigger alerts
    this.triggerIncidentAlert(incident)

    // Auto-escalate critical incidents
    if (incident.severity === 'critical') {
      await this.escalateIncident(incidentId)
    }
  }

  // Check if event is relevant to threat pattern
  private isEventRelevant(event: any, pattern: ThreatPattern): boolean {
    const relevantEventTypes = {
      bruteforce_login: [AuditEventType.LOGIN_FAILED],
      privilege_escalation: [AuditEventType.ACCESS_DENIED],
      unusual_data_access: [AuditEventType.PATIENT_VIEWED, AuditEventType.MEDICAL_RECORD_VIEWED],
      mfa_attacks: [AuditEventType.MFA_FAILED],
      session_anomaly: [AuditEventType.USER_LOGIN, AuditEventType.USER_LOGOUT],
      suspicious_export: [AuditEventType.DATA_EXPORT],
      config_changes: [AuditEventType.SYSTEM_CONFIG_CHANGED]
    }

    const patternEventTypes = relevantEventTypes[pattern.name as keyof typeof relevantEventTypes] || []
    return patternEventTypes.includes(event.event_type)
  }

  // Update security metrics
  private async updateMetrics(): Promise<void> {
    try {
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const { data: recentEvents } = await auditLogger.queryLogs({
        startDate: hourAgo,
        endDate: now,
        limit: 1000
      })

      const metrics: SecurityMetrics = {
        timestamp: now.toISOString(),
        failedLogins: recentEvents.filter(e => e.event_type === AuditEventType.LOGIN_FAILED).length,
        successfulLogins: recentEvents.filter(e => e.event_type === AuditEventType.USER_LOGIN).length,
        mfaFailures: recentEvents.filter(e => e.event_type === AuditEventType.MFA_FAILED).length,
        accessDenials: recentEvents.filter(e => e.event_type === AuditEventType.ACCESS_DENIED).length,
        criticalEvents: recentEvents.filter(e => e.risk_level === RiskLevel.CRITICAL).length,
        activeSessions: await this.getActiveSessionCount(),
        suspiciousActivity: recentEvents.filter(e => !e.success && e.risk_level === RiskLevel.HIGH).length,
        dataAccess: recentEvents.filter(e => 
          [AuditEventType.PATIENT_VIEWED, AuditEventType.MEDICAL_RECORD_VIEWED].includes(e.event_type)
        ).length,
        systemErrors: recentEvents.filter(e => e.event_type === AuditEventType.SYSTEM_ERROR).length
      }

      // Store metrics (keep last 24 hours)
      const metricsKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
      this.metrics.set(metricsKey, metrics)

      // Cleanup old metrics
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      for (const [key] of this.metrics) {
        const [year, month, date, hour] = key.split('-').map(Number)
        const keyDate = new Date(year, month, date, hour)
        if (keyDate < cutoff) {
          this.metrics.delete(key)
        }
      }

    } catch (error) {
      console.error('Failed to update security metrics:', error)
    }
  }

  // Get active session count
  private async getActiveSessionCount(): Promise<number> {
    try {
      // This would integrate with your session management system
      // For now, return a mock count
      return 0
    } catch (error) {
      return 0
    }
  }

  // Trigger incident alert
  private triggerIncidentAlert(incident: SecurityIncident): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(incident)
      } catch (error) {
        console.error('Incident alert callback failed:', error)
      }
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Security Incident [${incident.severity.toUpperCase()}]: ${incident.metadata?.alertMessage}`, incident)
    }
  }

  // Add incident alert callback
  onIncident(callback: (incident: SecurityIncident) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Escalate incident
  async escalateIncident(incidentId: string): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) return

    incident.status = 'investigating'
    
    // Log escalation
    await auditLogger.log(AuditEventType.SECURITY_VIOLATION, {
      resourceType: 'security_incident',
      resourceId: incidentId,
      eventData: {
        incidentType: incident.type,
        severity: incident.severity,
        escalated: true
      },
      success: true
    })

    // In production, you might:
    // - Send alerts to security team
    // - Create tickets in incident management system
    // - Trigger automated response actions
  }

  // Resolve incident
  async resolveIncident(incidentId: string, resolution: string): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) return

    incident.status = 'resolved'
    incident.metadata = {
      ...incident.metadata,
      resolution,
      resolvedAt: new Date().toISOString()
    }

    await auditLogger.log(AuditEventType.SECURITY_VIOLATION, {
      resourceType: 'security_incident',
      resourceId: incidentId,
      eventData: {
        action: 'resolved',
        resolution
      },
      success: true
    })
  }

  // Get current security metrics
  getCurrentMetrics(): SecurityMetrics | null {
    const keys = Array.from(this.metrics.keys()).sort()
    const latestKey = keys[keys.length - 1]
    return latestKey ? this.metrics.get(latestKey) || null : null
  }

  // Get metrics history
  getMetricsHistory(hours: number = 24): SecurityMetrics[] {
    const now = new Date()
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
    
    return Array.from(this.metrics.entries())
      .filter(([key]) => {
        const [year, month, date, hour] = key.split('-').map(Number)
        const keyDate = new Date(year, month, date, hour)
        return keyDate >= cutoff
      })
      .map(([, metrics]) => metrics)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  // Get active incidents
  getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .filter(incident => ['open', 'investigating'].includes(incident.status))
      .sort((a, b) => {
        // Sort by severity, then by timestamp
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
        if (severityDiff !== 0) return severityDiff
        return b.timestamp.localeCompare(a.timestamp)
      })
  }

  // Get incident by ID
  getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.get(incidentId)
  }

  // Get all incidents
  getAllIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  // Security health score (0-100)
  calculateSecurityHealthScore(): number {
    const metrics = this.getCurrentMetrics()
    if (!metrics) return 100

    let score = 100
    
    // Deduct points for various security issues
    score -= Math.min(metrics.failedLogins * 2, 20) // Max -20 for failed logins
    score -= Math.min(metrics.mfaFailures * 5, 25) // Max -25 for MFA failures
    score -= Math.min(metrics.accessDenials * 3, 15) // Max -15 for access denials
    score -= Math.min(metrics.criticalEvents * 10, 30) // Max -30 for critical events
    score -= Math.min(metrics.suspiciousActivity * 4, 20) // Max -20 for suspicious activity
    
    // Active incidents also reduce score
    const activeIncidents = this.getActiveIncidents()
    const criticalIncidents = activeIncidents.filter(i => i.severity === 'critical').length
    const highIncidents = activeIncidents.filter(i => i.severity === 'high').length
    
    score -= criticalIncidents * 15
    score -= highIncidents * 10
    
    return Math.max(score, 0)
  }

  // Generate security summary
  getSecuritySummary(): {
    healthScore: number
    activeIncidents: number
    criticalIncidents: number
    recentAlerts: number
    metrics: SecurityMetrics | null
    topThreats: string[]
  } {
    const metrics = this.getCurrentMetrics()
    const incidents = this.getActiveIncidents()
    const criticalIncidents = incidents.filter(i => i.severity === 'critical')
    
    // Get most common incident types
    const threatCounts = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topThreats = Object.entries(threatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([threat]) => threat)

    return {
      healthScore: this.calculateSecurityHealthScore(),
      activeIncidents: incidents.length,
      criticalIncidents: criticalIncidents.length,
      recentAlerts: metrics ? metrics.criticalEvents + metrics.suspiciousActivity : 0,
      metrics,
      topThreats
    }
  }

  // Cleanup resources
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()