'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Clock, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import { queryOptimizer } from '@/lib/database/query-optimizer'
import { useCacheManagement } from '@/hooks/use-dashboard-data'

interface PerformanceStats {
  totalQueries: number
  averageDuration: number
  cacheHitRate: number
  slowQueries: Array<{
    queryKey: string
    duration: number
    resultCount?: number
    timestamp: number
  }>
  topQueries: Array<{
    query: string
    count: number
    avgDuration: number
  }>
}

interface SystemMetrics {
  memoryUsage: number
  responseTime: number
  activeConnections: number
  errorRate: number
  uptime: number
}

export function PerformanceMonitor() {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const { getCacheStats, clearCache } = useCacheManagement()

  const updateStats = useCallback(() => {
    // Get query performance metrics
    const queryStats = queryOptimizer.getPerformanceMetrics()
    setPerformanceStats(queryStats)

    // Simulate system metrics (in a real app, these would come from your monitoring service)
    const simulatedSystemMetrics: SystemMetrics = {
      memoryUsage: Math.random() * 100,
      responseTime: Math.random() * 200 + 50,
      activeConnections: Math.floor(Math.random() * 50) + 10,
      errorRate: Math.random() * 5,
      uptime: Date.now() - (Date.now() % (24 * 60 * 60 * 1000)) // Today's uptime
    }
    setSystemMetrics(simulatedSystemMetrics)
  }, [])

  useEffect(() => {
    if (isVisible) {
      updateStats()
      
      if (autoRefresh) {
        const interval = setInterval(updateStats, refreshInterval)
        return () => clearInterval(interval)
      }
    }
  }, [isVisible, autoRefresh, refreshInterval, updateStats])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportPerformanceData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performanceStats,
      systemMetrics,
      cacheStats: getCacheStats()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Only show in development or for admin users
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>Real-time application performance metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPerformanceData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="queries">Query Performance</TabsTrigger>
              <TabsTrigger value="system">System Metrics</TabsTrigger>
              <TabsTrigger value="cache">Cache Status</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getPerformanceColor(
                      performanceStats?.averageDuration || 0,
                      { good: 100, warning: 500 }
                    )}`}>
                      {formatDuration(performanceStats?.averageDuration || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Database queries</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getPerformanceColor(
                      100 - (performanceStats?.cacheHitRate || 0),
                      { good: 20, warning: 50 }
                    )}`}>
                      {(performanceStats?.cacheHitRate || 0).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Query cache efficiency</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceStats?.totalQueries || 0}</div>
                    <p className="text-xs text-muted-foreground">Last hour</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getPerformanceColor(
                      systemMetrics?.errorRate || 0,
                      { good: 1, warning: 3 }
                    )}`}>
                      {(systemMetrics?.errorRate || 0).toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">System errors</p>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Database</div>
                        <div className="text-sm text-muted-foreground">Connected</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">API Services</div>
                        <div className="text-sm text-muted-foreground">Operational</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Cache Layer</div>
                        <div className="text-sm text-muted-foreground">Active</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="queries" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Slow Queries</CardTitle>
                    <CardDescription>Queries taking &gt; 1 second</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceStats?.slowQueries.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No slow queries detected
                        </div>
                      ) : (
                        performanceStats?.slowQueries.slice(0, 5).map((query, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-mono truncate">
                                {query.queryKey}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {query.resultCount || 0} results
                              </div>
                            </div>
                            <Badge variant="destructive">
                              {formatDuration(query.duration)}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Queries</CardTitle>
                    <CardDescription>Most frequently executed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceStats?.topQueries.slice(0, 5).map((query, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono truncate">
                              {query.query}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {formatDuration(query.avgDuration)}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {query.count}x
                          </Badge>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground">
                          No query data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Usage</span>
                      <span className={`font-medium ${getPerformanceColor(
                        systemMetrics?.memoryUsage || 0,
                        { good: 70, warning: 85 }
                      )}`}>
                        {(systemMetrics?.memoryUsage || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${systemMetrics?.memoryUsage || 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <span className={`font-medium ${getPerformanceColor(
                        systemMetrics?.responseTime || 0,
                        { good: 100, warning: 300 }
                      )}`}>
                        {formatDuration(systemMetrics?.responseTime || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Connections</span>
                      <span className="font-medium">{systemMetrics?.activeConnections || 0}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Uptime</span>
                      <span className="font-medium">{formatUptime(systemMetrics?.uptime || 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance charts would be displayed here</p>
                      <p className="text-xs">Integrate with your monitoring service</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cache" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Cache Statistics</CardTitle>
                    <CardDescription>In-memory cache performance</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => clearCache()}>
                    Clear Cache
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(getCacheStats()).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}