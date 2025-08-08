'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Shield,
  AlertTriangle,
  Eye,
  Activity,
  Lock,
  Users,
  Database,
  RefreshCw,
  Download,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Search,
  Filter
} from 'lucide-react'
import { securityMonitor } from '@/lib/security/security-monitor'
import { auditLogger, AuditEventType, RiskLevel } from '@/lib/security/audit-logger'

interface SecurityDashboardProps {
  userId: string
  isAdmin: boolean
}

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

interface SecurityIncident {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: string
  status: string
  events: any[]
  metadata?: any
}

export function SecurityDashboard({ userId, isAdmin }: SecurityDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [securitySummary, setSecuritySummary] = useState<any>(null)
  const [metricsHistory, setMetricsHistory] = useState<SecurityMetrics[]>([])
  const [activeIncidents, setActiveIncidents] = useState<SecurityIncident[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState('overview')
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadSecurityData()
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [autoRefresh])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load security summary
      const summary = securityMonitor.getSecuritySummary()
      setSecuritySummary(summary)

      // Load metrics history
      const history = securityMonitor.getMetricsHistory(24)
      setMetricsHistory(history)

      // Load active incidents
      const incidents = securityMonitor.getActiveIncidents()
      setActiveIncidents(incidents)

      // Load recent audit logs
      const { data: logs } = await auditLogger.queryLogs({
        limit: 50,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      })
      setAuditLogs(logs)

    } catch (err) {
      setError('Failed to load security data')
      console.error('Security dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleIncidentResolve = async (incidentId: string) => {
    try {
      await securityMonitor.resolveIncident(incidentId, 'Resolved by admin')
      await loadSecurityData()
    } catch (err) {
      setError('Failed to resolve incident')
    }
  }

  const downloadSecurityReport = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      
      const report = await auditLogger.generateReport(startDate, endDate, {
        includeSuccessEvents: false,
        includeRiskAnalysis: true,
        groupByUser: true,
        groupByEventType: true
      })

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to generate security report')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200'
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const prepareMetricsChartData = () => {
    return metricsHistory.map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      'Failed Logins': metric.failedLogins,
      'Access Denials': metric.accessDenials,
      'Critical Events': metric.criticalEvents,
      'Suspicious Activity': metric.suspiciousActivity
    }))
  }

  const prepareIncidentSeverityData = () => {
    const severityCounts = activeIncidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      critical: '#ef4444',
      high: '#f97316', 
      medium: '#eab308',
      low: '#3b82f6'
    }

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      fill: colors[severity as keyof typeof colors]
    }))
  }

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to view the security dashboard.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading && !securitySummary) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading security dashboard...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">Real-time security monitoring and incident management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadSecurityData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={downloadSecurityReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Health Score */}
      {securitySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${getHealthScoreColor(securitySummary.healthScore)}`}>
                  {securitySummary.healthScore}%
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Overall Security Health</p>
                  <p className="text-xs text-gray-500">
                    Last updated: {formatTimestamp(securitySummary.metrics?.timestamp || new Date().toISOString())}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {securitySummary.criticalIncidents}
                  </div>
                  <div className="text-xs text-red-700">Critical Incidents</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {securitySummary.activeIncidents}
                  </div>
                  <div className="text-xs text-orange-700">Active Incidents</div>
                </div>
              </div>
            </div>
            
            <Progress 
              value={securitySummary.healthScore} 
              className={`h-3 ${getHealthScoreColor(securitySummary.healthScore)}`}
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {securitySummary?.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                      <p className="text-2xl font-bold text-red-600">
                        {securitySummary.metrics.failedLogins}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Access Denials</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {securitySummary.metrics.accessDenials}
                      </p>
                    </div>
                    <Lock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Access</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {securitySummary.metrics.dataAccess}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {securitySummary.metrics.activeSessions}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Metrics Chart */}
          {metricsHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Security Events (Last 24 Hours)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareMetricsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="Failed Logins" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="Access Denials" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="Critical Events" stroke="#dc2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="Suspicious Activity" stroke="#7c2d12" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Threats */}
          {securitySummary?.topThreats && securitySummary.topThreats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Threat Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securitySummary.topThreats.map((threat: string, index: number) => (
                    <div key={threat} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{formatEventType(threat)}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Incidents</CardTitle>
              <CardDescription>
                {activeIncidents.length} active incident{activeIncidents.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeIncidents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No active security incidents</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeIncidents.map((incident) => (
                    <div key={incident.id} className={`p-4 border rounded-lg ${getSeverityColor(incident.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                              {incident.severity.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{formatEventType(incident.type)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                          <div className="text-xs text-gray-500">
                            <p>Detected: {formatTimestamp(incident.timestamp)}</p>
                            <p>Events: {incident.events.length}</p>
                            {incident.metadata?.alertMessage && (
                              <p>Alert: {incident.metadata.alertMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncidentResolve(incident.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Severity Distribution */}
          {activeIncidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incident Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={prepareIncidentSeverityData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {prepareIncidentSeverityData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Events Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={prepareMetricsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Failed Logins" fill="#ef4444" />
                    <Bar dataKey="Critical Events" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Activity */}
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={prepareMetricsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="Data Access" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
              <CardDescription>
                Latest security events and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={log.success ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {log.risk_level}
                        </Badge>
                        <span className="font-medium text-sm">
                          {formatEventType(log.event_type)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>User: {log.user_id || 'System'}</span>
                        {log.ip_address && <span> • IP: {log.ip_address}</span>}
                        <span> • {formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                    {!log.success && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-refresh Dashboard</p>
                  <p className="text-sm text-gray-600">Automatically refresh security data every 30 seconds</p>
                </div>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Security Notifications</p>
                  <p className="text-sm text-gray-600">Get real-time alerts for critical security events</p>
                </div>
                <Button variant="outline">
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit Log Retention</p>
                  <p className="text-sm text-gray-600">How long to keep detailed audit logs (currently: 7 years)</p>
                </div>
                <Button variant="outline">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}