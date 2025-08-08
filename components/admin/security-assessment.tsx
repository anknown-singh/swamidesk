'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Shield,
  AlertTriangle,
  Bug,
  Lock,
  Eye,
  Database,
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Play,
  Pause,
  Target,
  TrendingUp,
  FileText,
  User
} from 'lucide-react'
import { 
  vulnerabilityScanner,
  VulnerabilityType,
  VulnerabilitySeverity,
  type VulnerabilityFinding
} from '@/lib/security/vulnerability-scanner'

interface SecurityAssessmentProps {
  userId: string
  isAdmin: boolean
}

interface AssessmentResult {
  summary: {
    totalTests: number
    testsPassed: number
    testsFailed: number
    vulnerabilitiesFound: number
    criticalVulnerabilities: number
    highVulnerabilities: number
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
  }
  results: Array<{
    testName: string
    passed: boolean
    vulnerabilities: VulnerabilityFinding[]
    details?: any
  }>
  vulnerabilities: VulnerabilityFinding[]
}

export function SecurityAssessment({ _userId, isAdmin }: SecurityAssessmentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [selectedTestSuites, setSelectedTestSuites] = useState<string[]>([
    'input_validation',
    'authentication',
    'authorization',
    'data_encryption',
    'session_security',
    'hipaa_compliance'
  ])
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedVulnerability, setSelectedVulnerability] = useState<VulnerabilityFinding | null>(null)

  const testSuites = [
    { id: 'input_validation', name: 'Input Validation', description: 'Tests for SQL injection, XSS, and input validation bypass' },
    { id: 'authentication', name: 'Authentication', description: 'Tests for weak passwords, missing MFA, and auth bypass' },
    { id: 'authorization', name: 'Authorization', description: 'Tests for privilege escalation and access control bypass' },
    { id: 'data_encryption', name: 'Data Encryption', description: 'Tests for weak encryption and key management issues' },
    { id: 'session_security', name: 'Session Security', description: 'Tests for session management vulnerabilities' },
    { id: 'information_disclosure', name: 'Information Disclosure', description: 'Tests for information leakage and debug exposure' },
    { id: 'business_logic', name: 'Business Logic', description: 'Tests for healthcare workflow logic flaws' },
    { id: 'hipaa_compliance', name: 'HIPAA Compliance', description: 'Tests for HIPAA regulatory compliance issues' },
    { id: 'api_security', name: 'API Security', description: 'Tests for API security issues and rate limiting' }
  ]

  const runSecurityAssessment = async () => {
    if (selectedTestSuites.length === 0) {
      setError('Please select at least one test suite to run')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await vulnerabilityScanner.runSecurityAssessment(selectedTestSuites)
      setAssessmentResult(result)
      
    } catch (err) {
      setError('Failed to run security assessment')
      console.error('Security assessment error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestSuiteToggle = (suiteId: string) => {
    setSelectedTestSuites(prev => 
      prev.includes(suiteId) 
        ? prev.filter(id => id !== suiteId)
        : [...prev, suiteId]
    )
  }

  const downloadAssessmentReport = () => {
    if (!assessmentResult) return

    const report = {
      timestamp: new Date().toISOString(),
      summary: assessmentResult.summary,
      testResults: assessmentResult.results,
      vulnerabilities: assessmentResult.vulnerabilities,
      securityReport: vulnerabilityScanner.generateSecurityReport()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-assessment-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const formatVulnerabilityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const prepareVulnerabilityChartData = () => {
    if (!assessmentResult) return []

    const typeCounts = assessmentResult.vulnerabilities.reduce((acc, vuln) => {
      const type = formatVulnerabilityType(vuln.type)
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }))
  }

  const prepareSeverityChartData = () => {
    if (!assessmentResult) return []

    const severityCounts = assessmentResult.vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308', 
      low: '#3b82f6',
      info: '#6b7280'
    }

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      fill: colors[severity as keyof typeof colors] || '#6b7280'
    }))
  }

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to run security assessments.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security Assessment</h1>
          <p className="text-gray-600">Comprehensive vulnerability scanning and penetration testing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runSecurityAssessment}
            disabled={loading || selectedTestSuites.length === 0}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Assessment...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Assessment
              </>
            )}
          </Button>
          {assessmentResult && (
            <Button
              variant="outline"
              onClick={downloadAssessmentReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Test Suite Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Suite Selection</CardTitle>
          <CardDescription>
            Select the security tests to include in your assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testSuites.map((suite) => (
              <div
                key={suite.id}
                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTestSuiteToggle(suite.id)}
              >
                <Checkbox
                  checked={selectedTestSuites.includes(suite.id)}
                  onChange={() => handleTestSuiteToggle(suite.id)}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{suite.name}</h4>
                  <p className="text-sm text-gray-600">{suite.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{selectedTestSuites.length} of {testSuites.length} test suites selected</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTestSuites(testSuites.map(s => s.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTestSuites([])}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {assessmentResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {assessmentResult.summary.totalTests}
                  </div>
                  <div className="text-sm text-blue-700">Total Tests</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {assessmentResult.summary.testsPassed}
                  </div>
                  <div className="text-sm text-green-700">Tests Passed</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {assessmentResult.summary.vulnerabilitiesFound}
                  </div>
                  <div className="text-sm text-orange-700">Vulnerabilities</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {assessmentResult.summary.criticalVulnerabilities}
                  </div>
                  <div className="text-sm text-red-700">Critical Issues</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Risk Level</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-lg py-2 px-4 ${getSeverityColor(assessmentResult.summary.overallRisk)}`}
                  >
                    {assessmentResult.summary.overallRisk.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Test Success Rate</div>
                  <div className={`text-2xl font-bold ${
                    assessmentResult.summary.testsPassed === assessmentResult.summary.totalTests 
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.round((assessmentResult.summary.testsPassed / assessmentResult.summary.totalTests) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="tests">Test Results</TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vulnerability Types Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerabilities by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={prepareVulnerabilityChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="type" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Severity Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerability Severity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={prepareSeverityChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {prepareSeverityChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* HIPAA-Specific Issues */}
              {assessmentResult.vulnerabilities.some(v => v.hipaaRelevant) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      HIPAA Compliance Issues
                    </CardTitle>
                    <CardDescription>
                      Vulnerabilities that may impact HIPAA compliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assessmentResult.vulnerabilities
                        .filter(v => v.hipaaRelevant)
                        .slice(0, 5)
                        .map((vuln) => (
                          <div key={vuln.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                              vuln.severity === 'critical' ? 'text-red-500' : 
                              vuln.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium">{vuln.title}</h4>
                              <p className="text-sm text-gray-600">{vuln.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                                <span className="text-xs text-gray-500">{vuln.location}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Vulnerabilities Tab */}
            <TabsContent value="vulnerabilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Vulnerabilities Found</CardTitle>
                  <CardDescription>
                    {assessmentResult.vulnerabilities.length} vulnerabilities identified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {assessmentResult.vulnerabilities.map((vuln) => (
                      <div 
                        key={vuln.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedVulnerability(vuln)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                                {vuln.severity}
                              </Badge>
                              <span className="font-medium">{vuln.title}</span>
                              {vuln.hipaaRelevant && (
                                <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                                  HIPAA
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{vuln.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Type: {formatVulnerabilityType(vuln.type)}</span>
                              <span>Location: {vuln.location}</span>
                              {vuln.cvsScore && (
                                <span>CVSS: {vuln.cvsScore.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vulnerability Detail Modal */}
              {selectedVulnerability && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Vulnerability Details</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedVulnerability(null)}
                      >
                        Close
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Severity</h4>
                        <Badge className={getSeverityColor(selectedVulnerability.severity)}>
                          {selectedVulnerability.severity}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Type</h4>
                        <span className="text-sm">{formatVulnerabilityType(selectedVulnerability.type)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">CVSS Score</h4>
                        <span className="text-sm">{selectedVulnerability.cvsScore?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">HIPAA Relevant</h4>
                        <span className="text-sm">{selectedVulnerability.hipaaRelevant ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedVulnerability.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <p className="text-sm text-gray-600">{selectedVulnerability.location}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <p className="text-sm text-gray-600">{selectedVulnerability.recommendation}</p>
                    </div>

                    {selectedVulnerability.evidence && (
                      <div>
                        <h4 className="font-medium mb-2">Evidence</h4>
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                          {JSON.stringify(selectedVulnerability.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Test Results Tab */}
            <TabsContent value="tests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessmentResult.results.map((result) => (
                      <div key={result.testName} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center gap-2">
                            {result.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {result.testName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </Badge>
                        </div>
                        
                        {result.vulnerabilities.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Issues found: </span>
                            {result.vulnerabilities.length} vulnerabilities
                          </div>
                        )}
                        
                        {result.details?.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            Error: {result.details.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Remediation Tab */}
            <TabsContent value="remediation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Remediation Recommendations</CardTitle>
                  <CardDescription>
                    Priority actions to improve your security posture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Critical Issues First */}
                    {assessmentResult.vulnerabilities
                      .filter(v => v.severity === VulnerabilitySeverity.CRITICAL)
                      .map((vuln, index) => (
                        <div key={vuln.id} className="p-4 border-l-4 border-red-500 bg-red-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-red-900">
                                {index + 1}. {vuln.title}
                              </h4>
                              <p className="text-sm text-red-700 mt-1">{vuln.recommendation}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                                <span className="text-xs text-red-600">{vuln.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* High Priority Issues */}
                    {assessmentResult.vulnerabilities
                      .filter(v => v.severity === VulnerabilitySeverity.HIGH)
                      .slice(0, 5)
                      .map((vuln, index) => (
                        <div key={vuln.id} className="p-4 border-l-4 border-orange-500 bg-orange-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-orange-900">
                                {assessmentResult.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length + index + 1}. {vuln.title}
                              </h4>
                              <p className="text-sm text-orange-700 mt-1">{vuln.recommendation}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                                <span className="text-xs text-orange-600">{vuln.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* General Recommendations */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">General Security Recommendations</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Implement regular security assessments and penetration testing</li>
                        <li>• Keep all software dependencies up to date</li>
                        <li>• Train staff on security best practices and HIPAA compliance</li>
                        <li>• Implement comprehensive audit logging and monitoring</li>
                        <li>• Regular backup and disaster recovery testing</li>
                        <li>• Conduct periodic access reviews and permission audits</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

export default SecurityAssessment;