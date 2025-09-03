'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, FileText, CheckCircle, Calendar, Target, Activity, AlertTriangle, Star, TrendingUp, Users, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TreatmentSummaryProps {
  treatmentId: string
  onPrevious: () => void
  onComplete: () => void
}

interface SummaryData {
  treatmentPlan: {
    type: string
    duration: string
    frequency: string
    objective: string
    methodology: string
    startDate: string
    endDate?: string
  }
  goals: {
    total: number
    achieved: number
    inProgress: number
    pending: number
    achievements: string[]
  }
  sessions: {
    total: number
    completed: number
    cancelled: number
    upcoming: number
    totalDuration: number
    types: { [key: string]: number }
  }
  progress: {
    overall: number
    metrics: Array<{
      name: string
      baseline: number
      current: number
      target: number
      improvement: number
    }>
    milestones: Array<{
      title: string
      status: 'completed' | 'pending' | 'delayed'
      date?: string
    }>
  }
  monitoring: {
    totalEntries: number
    criticalAlerts: number
    sideEffects: string[]
    compliance: number
    satisfaction: number
  }
  reviews: {
    total: number
    effectiveness: 'excellent' | 'good' | 'satisfactory' | 'poor'
    recommendations: string[]
    nextReview?: string
  }
  outcomes: {
    status: 'completed' | 'ongoing' | 'discontinued'
    dischargeReason?: string
    followUpRequired: boolean
    followUpDate?: string
  }
}

export function TreatmentSummary({ treatmentId, onPrevious, onComplete }: TreatmentSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Mock data - in real implementation, this would be fetched from API
  useEffect(() => {
    const loadSummaryData = async () => {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: SummaryData = {
        treatmentPlan: {
          type: 'Physical Therapy',
          duration: '8 weeks',
          frequency: 'Twice weekly',
          objective: 'Restore full range of motion and reduce pain following knee injury',
          methodology: 'Combination of manual therapy, exercise therapy, and electrophysical agents',
          startDate: '2024-01-15',
          endDate: '2024-03-10'
        },
        goals: {
          total: 8,
          achieved: 5,
          inProgress: 2,
          pending: 1,
          achievements: [
            'Reduced pain from 8/10 to 3/10',
            'Increased knee flexion from 90° to 130°',
            'Improved walking distance from 100m to 500m',
            'Return to stairs climbing without assistance',
            'Improved balance and coordination scores'
          ]
        },
        sessions: {
          total: 16,
          completed: 14,
          cancelled: 1,
          upcoming: 1,
          totalDuration: 960, // minutes
          types: {
            'Individual Therapy': 12,
            'Group Therapy': 2,
            'Assessment': 2
          }
        },
        progress: {
          overall: 87,
          metrics: [
            { name: 'Pain Level (0-10)', baseline: 8, current: 3, target: 2, improvement: 62.5 },
            { name: 'Knee Flexion (degrees)', baseline: 90, current: 130, target: 140, improvement: 80 },
            { name: 'Walking Distance (meters)', baseline: 100, current: 500, target: 1000, improvement: 44.4 },
            { name: 'Balance Score (%)', baseline: 40, current: 80, target: 90, improvement: 80 }
          ],
          milestones: [
            { title: 'Pain reduction to 5/10', status: 'completed', date: '2024-01-29' },
            { title: 'Achieve 120° knee flexion', status: 'completed', date: '2024-02-12' },
            { title: 'Walk 300m without pain', status: 'completed', date: '2024-02-19' },
            { title: 'Return to work activities', status: 'pending' }
          ]
        },
        monitoring: {
          totalEntries: 18,
          criticalAlerts: 2,
          sideEffects: ['Mild muscle soreness', 'Occasional fatigue'],
          compliance: 92,
          satisfaction: 8.5
        },
        reviews: {
          total: 4,
          effectiveness: 'good',
          recommendations: [
            'Continue current exercise program',
            'Gradual return to sports activities',
            'Home exercise maintenance'
          ],
          nextReview: '2024-04-10'
        },
        outcomes: {
          status: 'completed',
          dischargeReason: 'Goals achieved, functional capacity restored',
          followUpRequired: true,
          followUpDate: '2024-06-10'
        }
      }
      
      setSummaryData(mockData)
      setLoading(false)
    }

    loadSummaryData()
  }, [treatmentId])

  const handleExportSummary = async () => {
    setExporting(true)
    
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, this would generate and download a PDF
      console.log('Exporting treatment summary as PDF...')
      
      // Create a mock download
      const element = document.createElement('a')
      element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(
        `Treatment Summary Report\n\nTreatment ID: ${treatmentId}\nGenerated: ${new Date().toLocaleString()}`
      )
      element.download = `treatment-summary-${treatmentId}.txt`
      element.click()
      
    } catch (error) {
      console.error('Error exporting summary:', error)
    } finally {
      setExporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'discontinued':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'delayed':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'satisfactory':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || !summaryData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating treatment summary...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Treatment Summary Report
              </CardTitle>
              <CardDescription>
                Comprehensive overview of treatment progress and outcomes
              </CardDescription>
            </div>
            <Button onClick={handleExportSummary} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{summaryData.progress.overall}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summaryData.goals.achieved}/{summaryData.goals.total}</div>
                <div className="text-sm text-muted-foreground">Goals Achieved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{summaryData.sessions.completed}</div>
                <div className="text-sm text-muted-foreground">Sessions Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summaryData.monitoring.satisfaction}/10</div>
                <div className="text-sm text-muted-foreground">Patient Satisfaction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treatment Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Treatment Plan Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Treatment Type</h4>
              <p className="font-medium">{summaryData.treatmentPlan.type}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Duration</h4>
              <p className="font-medium">{summaryData.treatmentPlan.duration}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Frequency</h4>
              <p className="font-medium">{summaryData.treatmentPlan.frequency}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Primary Objective</h4>
            <p className="text-sm">{summaryData.treatmentPlan.objective}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Methodology</h4>
            <p className="text-sm">{summaryData.treatmentPlan.methodology}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Start Date</h4>
              <p className="font-medium">{new Date(summaryData.treatmentPlan.startDate).toLocaleDateString()}</p>
            </div>
            {summaryData.treatmentPlan.endDate && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">End Date</h4>
                <p className="font-medium">{new Date(summaryData.treatmentPlan.endDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goals Achievement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goals Achievement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryData.goals.achieved}</div>
              <div className="text-sm text-muted-foreground">Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryData.goals.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryData.goals.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryData.goals.total}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Achievement Progress</h4>
            <Progress value={(summaryData.goals.achieved / summaryData.goals.total) * 100} className="h-3" />
            <div className="text-sm text-muted-foreground text-center">
              {Math.round((summaryData.goals.achieved / summaryData.goals.total) * 100)}% of goals achieved
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Key Achievements</h4>
            <ul className="space-y-1">
              {summaryData.goals.achievements.map((achievement, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryData.progress.metrics.map((metric, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{metric.name}</h4>
                <Badge variant="secondary">{metric.improvement.toFixed(1)}% improvement</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                <div>
                  <span className="text-muted-foreground">Baseline:</span>
                  <span className="font-medium ml-1">{metric.baseline}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium ml-1">{metric.current}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium ml-1">{metric.target}</span>
                </div>
              </div>
              
              <Progress value={metric.improvement} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryData.sessions.total}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryData.sessions.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryData.sessions.cancelled}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(summaryData.sessions.totalDuration / 60)}h</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Session Types</h4>
            <div className="space-y-2">
              {Object.entries(summaryData.sessions.types).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <Badge variant="outline">{count} sessions</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Monitoring & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Patient Compliance</h4>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={summaryData.monitoring.compliance} className="flex-1 h-2" />
                <span className="font-medium">{summaryData.monitoring.compliance}%</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Monitoring Entries</h4>
              <p className="font-medium">{summaryData.monitoring.totalEntries} entries</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Critical Alerts</h4>
              <p className="font-medium text-red-600">{summaryData.monitoring.criticalAlerts} alerts</p>
            </div>
          </div>

          {summaryData.monitoring.sideEffects.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Reported Side Effects</h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.monitoring.sideEffects.map((effect, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {effect}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Treatment Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Treatment Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Total Reviews</h4>
              <p className="font-medium">{summaryData.reviews.total} reviews</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Treatment Effectiveness</h4>
              <Badge variant="outline" className={getEffectivenessColor(summaryData.reviews.effectiveness)}>
                {summaryData.reviews.effectiveness}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Key Recommendations</h4>
            <ul className="space-y-1">
              {summaryData.reviews.recommendations.map((rec, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {summaryData.reviews.nextReview && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Next Review Scheduled</h4>
                <p className="font-medium">{new Date(summaryData.reviews.nextReview).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Treatment Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Treatment Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Treatment Status</h4>
              <Badge variant="outline" className={getStatusColor(summaryData.outcomes.status)}>
                {summaryData.outcomes.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Follow-up Required</h4>
              <p className="font-medium">{summaryData.outcomes.followUpRequired ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {summaryData.outcomes.dischargeReason && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Discharge Summary</h4>
                <p className="text-sm">{summaryData.outcomes.dischargeReason}</p>
              </div>
            </>
          )}

          {summaryData.outcomes.followUpDate && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Follow-up Date</h4>
                <p className="font-medium">{new Date(summaryData.outcomes.followUpDate).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Completion Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Treatment Workflow Completed!</strong> All treatment components have been documented and reviewed. 
          The complete treatment summary is ready for final review and export.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous: Treatment Review
        </Button>
        
        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Treatment Workflow
        </Button>
      </div>
    </div>
  )
}