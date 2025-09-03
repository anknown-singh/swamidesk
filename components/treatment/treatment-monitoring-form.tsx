'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, ArrowLeft, AlertTriangle, FileText, Activity } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MonitoringEntry {
  id: string
  date: string
  type: 'assessment' | 'observation' | 'concern' | 'improvement' | 'side_effect'
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  actionTaken: string
  followUpRequired: boolean
  followUpDate?: string
  reportedBy: string
}

interface TreatmentMonitoringFormProps {
  treatmentId: string
  onNext: () => void
  onPrevious: () => void
}

export function TreatmentMonitoringForm({ treatmentId, onNext, onPrevious }: TreatmentMonitoringFormProps) {
  const [entries, setEntries] = useState<MonitoringEntry[]>([])
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'assessment' as const,
    severity: 'medium' as const,
    category: '',
    description: '',
    actionTaken: '',
    followUpRequired: false,
    followUpDate: '',
    reportedBy: 'Treatment Team'
  })
  const [saving, setSaving] = useState(false)

  const entryTypes = [
    { value: 'assessment', label: 'Regular Assessment', description: 'Routine treatment assessment' },
    { value: 'observation', label: 'Clinical Observation', description: 'Notable clinical observation' },
    { value: 'concern', label: 'Treatment Concern', description: 'Issue requiring attention' },
    { value: 'improvement', label: 'Progress Note', description: 'Positive treatment response' },
    { value: 'side_effect', label: 'Side Effect', description: 'Treatment-related adverse event' }
  ]

  const categories = [
    'Treatment Response',
    'Side Effects',
    'Pain Management',
    'Functional Improvement',
    'Compliance/Adherence',
    'Psychological Response',
    'Social Factors',
    'Environmental Factors',
    'Medication Effects',
    'Therapy Progress'
  ]

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minor, non-urgent', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', description: 'Moderate attention needed', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', description: 'Significant concern', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', description: 'Immediate attention required', color: 'bg-red-100 text-red-800' }
  ]

  const addEntry = () => {
    if (!newEntry.description.trim() || !newEntry.category) return

    const entry: MonitoringEntry = {
      id: Date.now().toString(),
      ...newEntry
    }

    setEntries(prev => [entry, ...prev].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))

    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      type: 'assessment',
      severity: 'medium',
      category: '',
      description: '',
      actionTaken: '',
      followUpRequired: false,
      followUpDate: '',
      reportedBy: 'Treatment Team'
    })
  }

  const getTypeIcon = (type: MonitoringEntry['type']) => {
    switch (type) {
      case 'assessment':
        return <FileText className="w-4 h-4" />
      case 'observation':
        return <Activity className="w-4 h-4" />
      case 'concern':
        return <AlertTriangle className="w-4 h-4" />
      case 'improvement':
        return <Activity className="w-4 h-4" />
      case 'side_effect':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: MonitoringEntry['type']) => {
    switch (type) {
      case 'assessment':
        return 'default'
      case 'observation':
        return 'secondary'
      case 'concern':
        return 'destructive'
      case 'improvement':
        return 'default'
      case 'side_effect':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getSeverityBadge = (severity: MonitoringEntry['severity']) => {
    const config = severityLevels.find(s => s.value === severity)
    return config ? (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const handleSubmit = async () => {
    setSaving(true)
    
    try {
      // Simulate API call to save monitoring data
      console.log('Saving treatment monitoring:', entries)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNext()
    } catch (error) {
      console.error('Error saving treatment monitoring:', error)
    } finally {
      setSaving(false)
    }
  }

  const criticalEntries = entries.filter(entry => entry.severity === 'critical')
  const highSeverityEntries = entries.filter(entry => entry.severity === 'high')
  const pendingFollowUps = entries.filter(entry => entry.followUpRequired && entry.followUpDate)

  return (
    <div className="space-y-6">
      {/* Alerts for Critical Items */}
      {criticalEntries.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Alert:</strong> {criticalEntries.length} critical monitoring entries require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalEntries.length}</div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{highSeverityEntries.length}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{pendingFollowUps.length}</div>
                <div className="text-sm text-muted-foreground">Pending Follow-ups</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Monitoring Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Monitoring Entry</CardTitle>
          <CardDescription>
            Record treatment monitoring observations, concerns, or assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date *</Label>
              <Input
                id="entryDate"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select 
                value={newEntry.type} 
                onValueChange={(value: MonitoringEntry['type']) => 
                  setNewEntry(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level *</Label>
              <Select 
                value={newEntry.severity} 
                onValueChange={(value: MonitoringEntry['severity']) => 
                  setNewEntry(prev => ({ ...prev, severity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={newEntry.category} 
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedBy">Reported By</Label>
              <Input
                id="reportedBy"
                value={newEntry.reportedBy}
                onChange={(e) => setNewEntry(prev => ({ ...prev, reportedBy: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description/Observation *</Label>
            <Textarea
              id="description"
              placeholder="Describe the observation, concern, or assessment in detail..."
              value={newEntry.description}
              onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action Taken</Label>
            <Textarea
              id="actionTaken"
              placeholder="Describe any immediate actions taken or interventions made..."
              value={newEntry.actionTaken}
              onChange={(e) => setNewEntry(prev => ({ ...prev, actionTaken: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={newEntry.followUpRequired}
                onCheckedChange={(checked) => 
                  setNewEntry(prev => ({ ...prev, followUpRequired: !!checked }))
                }
              />
              <Label htmlFor="followUpRequired">Follow-up Required</Label>
            </div>

            {newEntry.followUpRequired && (
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={newEntry.followUpDate}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Button 
            onClick={addEntry}
            disabled={!newEntry.description.trim() || !newEntry.category}
            className="w-full"
          >
            Add Monitoring Entry
          </Button>
        </CardContent>
      </Card>

      {/* Monitoring Entries List */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monitoring History ({entries.length} entries)</CardTitle>
            <CardDescription>
              Treatment monitoring entries in chronological order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.type)}
                      <Badge variant={getTypeColor(entry.type)}>
                        {entryTypes.find(t => t.value === entry.type)?.label}
                      </Badge>
                    </div>
                    {getSeverityBadge(entry.severity)}
                    <Badge variant="secondary">{entry.category}</Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{new Date(entry.date).toLocaleDateString()}</div>
                    <div>by {entry.reportedBy}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Observation/Description:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                  </div>

                  {entry.actionTaken && (
                    <div>
                      <Label className="text-sm font-medium">Action Taken:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{entry.actionTaken}</p>
                    </div>
                  )}

                  {entry.followUpRequired && (
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">Follow-up Required</Badge>
                      {entry.followUpDate && (
                        <span className="text-muted-foreground">
                          Due: {new Date(entry.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous: Progress Tracking
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Next: Treatment Review'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}