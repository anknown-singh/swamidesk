'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
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
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  BarChart3,
  Timer,
  Target,
  Zap,
  Eye,
  ArrowRight,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react'
import {
  workflowEngine,
  type WorkflowInstance,
  PatientWorkflowState
} from '@/lib/workflow/workflow-engine'
import { WorkflowWidget } from './workflow-progress'

interface WorkflowDashboardProps {
  userId: string
  userRole: string
  className?: string
}

interface WorkflowStats {
  total: number
  active: number
  completed: number
  averageDuration: number
  byType: Record<string, number>
}

interface BottleneckAnalysis {
  slowestStates: Array<{ state: string; averageDuration: number; count: number }>
  stateDistribution: Record<string, number>
}

export function WorkflowDashboard({ userId, _userRole, className = '' }: WorkflowDashboardProps) {
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowInstance[]>([])
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats | null>(null)
  const [bottleneckAnalysis, setBottleneckAnalysis] = useState<BottleneckAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadWorkflowData()
    
    // Set up periodic refresh
    const interval = setInterval(loadWorkflowData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadWorkflowData = async () => {
    try {
      setRefreshing(true)
      
      // Get active workflows
      const active = workflowEngine.getActiveWorkflows()
      setActiveWorkflows(active)
      
      // Get workflow statistics
      const stats = workflowEngine.getWorkflowStats()
      setWorkflowStats(stats)
      
      // Get bottleneck analysis
      const bottlenecks = workflowEngine.getBottleneckAnalysis()
      setBottleneckAnalysis(bottlenecks)
      
    } catch (err) {
      setError('Failed to load workflow data')
      console.error('Workflow dashboard loading error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatStateName = (state: string) => {
    return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatWorkflowType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}m`
  }

  const getWorkflowPriority = (workflow: WorkflowInstance) => {
    const age = new Date().getTime() - new Date(workflow.startedAt).getTime()
    const ageHours = age / (1000 * 60 * 60)
    
    if (ageHours > 24) return 'high'
    if (ageHours > 8) return 'medium'
    return 'low'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-500 bg-green-50 border-green-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case PatientWorkflowState.REGISTRATION:
        return <User className="h-4 w-4" />
      case PatientWorkflowState.WAITING:
        return <Clock className="h-4 w-4" />
      case PatientWorkflowState.CONSULTATION:
        return <Activity className="h-4 w-4" />
      case PatientWorkflowState.DISCHARGE:
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getFilteredWorkflows = () => {
    let filtered = activeWorkflows

    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.currentState.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(w => w.type === selectedType)
    }

    return filtered
  }

  const prepareStatsChartData = () => {
    if (!workflowStats) return []

    return Object.entries(workflowStats.byType).map(([type, count]) => ({
      type: formatWorkflowType(type),
      count
    }))
  }

  const prepareBottleneckChartData = () => {
    if (!bottleneckAnalysis) return []

    return bottleneckAnalysis.slowestStates.slice(0, 5).map(item => ({
      state: item.state.split(':')[1]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || item.state,
      duration: Math.round(item.averageDuration),
      count: item.count
    }))
  }

  const prepareStateDistributionData = () => {
    if (!bottleneckAnalysis) return []

    return Object.entries(bottleneckAnalysis.stateDistribution).map(([state, count]) => ({
      name: state.split(':')[1]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || state,
      value: count,
      fill: getRandomColor()
    }))
  }

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#a855f7', '#06b6d4', '#f43f5e']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const uniqueWorkflowTypes = [...new Set(activeWorkflows.map(w => w.type))]
  const filteredWorkflows = getFilteredWorkflows()

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Dashboard</h1>
          <p className="text-gray-600">Monitor and manage all healthcare workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadWorkflowData}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
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

      {/* Statistics Cards */}
      {workflowStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                  <p className="text-2xl font-bold">{workflowStats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold text-blue-600">{workflowStats.active}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{workflowStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatDuration(workflowStats.averageDuration)}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        {/* Active Workflows Tab */}
        <TabsContent value="active" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search workflows by entity ID, state, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">All Types</option>
                  {uniqueWorkflowTypes.map(type => (
                    <option key={type} value={type}>
                      {formatWorkflowType(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mt-3 text-sm text-gray-500">
                Showing {filteredWorkflows.length} of {activeWorkflows.length} active workflows
              </div>
            </CardContent>
          </Card>

          {/* Active Workflows List */}
          <div className="grid gap-4">
            {filteredWorkflows.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Workflows</h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedType !== 'all' 
                      ? 'No workflows match your search criteria' 
                      : 'All workflows have been completed'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Workflow Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStateIcon(workflow.currentState as string)}
                            <div>
                              <h3 className="font-semibold">
                                {formatWorkflowType(workflow.type)} - {workflow.entityId}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Currently in {formatStateName(workflow.currentState as string)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(getWorkflowPriority(workflow))}
                            >
                              {getWorkflowPriority(workflow)} priority
                            </Badge>
                            <Badge variant="secondary">
                              {workflow.progress}%
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Started: {new Date(workflow.startedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            <span>Transitions: {workflow.transitions.length}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to workflow details
                              window.location.href = `/workflows/${workflow.id}`
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to entity
                              window.location.href = `/${workflow.entityType}s/${workflow.entityId}`
                            }}
                          >
                            <User className="h-4 w-4 mr-1" />
                            View {formatWorkflowType(workflow.entityType)}
                          </Button>
                        </div>
                      </div>

                      {/* Progress Widget */}
                      <div>
                        <WorkflowWidget
                          workflowId={workflow.id}
                          userId={userId}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Workflows by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={prepareStatsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Current State Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Current State Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={prepareStateDistributionData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {prepareStateDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Bottlenecks
              </CardTitle>
              <CardDescription>
                Identify workflow states that take the longest time to complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bottleneckAnalysis && (
                <div className="space-y-6">
                  {/* Slowest States Chart */}
                  <div>
                    <h4 className="font-medium mb-4">Slowest Workflow States</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareBottleneckChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="state" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `${value} minutes`, 
                            name === 'duration' ? 'Avg Duration' : name
                          ]}
                        />
                        <Bar dataKey="duration" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bottleneck Details */}
                  <div>
                    <h4 className="font-medium mb-4">Bottleneck Analysis</h4>
                    <div className="space-y-3">
                      {bottleneckAnalysis.slowestStates.slice(0, 3).map((item, index) => (
                        <div key={item.state} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                                #{index + 1}
                              </Badge>
                              <span className="font-medium">
                                {item.state.split(':')[1]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || item.state}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-600">
                                {formatDuration(item.averageDuration)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.count} workflows
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Average time spent in this state across all workflows
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}