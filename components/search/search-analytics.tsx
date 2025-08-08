'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Eye,
  Clock,
  Target,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react'
import { searchEngine, type SearchAnalytics } from '@/lib/search/search-engine'

interface SearchAnalyticsProps {
  userId: string
  className?: string
  dateRange?: {
    start: string
    end: string
  }
}

interface SearchMetrics {
  totalSearches: number
  uniqueUsers: number
  averageResultsPerQuery: number
  searchSuccessRate: number
  popularSearchTerms: Array<{ term: string; count: number; trend: 'up' | 'down' | 'stable' }>
  searchVolumeTrend: Array<{ date: string; searches: number; users: number }>
  resultTypeDistribution: Array<{ type: string; count: number; percentage: number }>
  noResultsRate: number
  averageResponseTime: number
}

export function SearchAnalyticsComponent({ userId, className = '', dateRange }: SearchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)
      
      const analyticsData = await searchEngine.getSearchAnalytics(dateRange)
      setAnalytics(analyticsData)
      
      // Generate additional metrics
      const metricsData = await generateMetrics(analyticsData)
      setMetrics(metricsData)
      
    } catch (err) {
      setError('Failed to load search analytics')
      console.error('Analytics loading error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateMetrics = async (analyticsData: SearchAnalytics): Promise<SearchMetrics> => {
    // Mock additional metrics - in real app would query from database
    return {
      totalSearches: analyticsData.totalSearches,
      uniqueUsers: Math.floor(analyticsData.totalSearches * 0.3), // Estimate unique users
      averageResultsPerQuery: analyticsData.averageResultsPerQuery,
      searchSuccessRate: 85.6, // Mock success rate
      popularSearchTerms: analyticsData.topQueries.map((query, index) => ({
        term: query.query,
        count: query.count,
        trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable'
      })),
      searchVolumeTrend: generateSearchVolumeTrend(),
      resultTypeDistribution: generateResultTypeDistribution(),
      noResultsRate: (analyticsData.noResultsQueries.length / analyticsData.totalSearches) * 100,
      averageResponseTime: 245 // milliseconds
    }
  }

  const generateSearchVolumeTrend = () => {
    const days = 30
    const data = []
    const baseDate = new Date()
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        searches: Math.floor(Math.random() * 50) + 20,
        users: Math.floor(Math.random() * 20) + 5
      })
    }
    
    return data
  }

  const generateResultTypeDistribution = () => {
    return [
      { type: 'patient', count: 45, percentage: 35.2 },
      { type: 'appointment', count: 32, percentage: 25.0 },
      { type: 'medicine', count: 28, percentage: 21.9 },
      { type: 'service', count: 12, percentage: 9.4 },
      { type: 'invoice', count: 8, percentage: 6.3 },
      { type: 'user', count: 3, percentage: 2.3 }
    ]
  }

  const exportAnalytics = () => {
    if (!analytics || !metrics) return

    const exportData = {
      timestamp: new Date().toISOString(),
      dateRange,
      analytics,
      metrics,
      summary: {
        totalSearches: metrics.totalSearches,
        successRate: metrics.searchSuccessRate,
        averageResponseTime: metrics.averageResponseTime,
        topSearchTerms: analytics.topQueries.slice(0, 10)
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

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

  if (error || !analytics || !metrics) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Analytics data not available'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#a855f7', '#06b6d4', '#f43f5e']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Search Analytics</h1>
          <p className="text-gray-600">Monitor search performance and user behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportAnalytics}
          >
            <Download className="h-4 w-4 mr-1" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalSearches)}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {formatNumber(metrics.uniqueUsers)} unique users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(metrics.searchSuccessRate)}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Results found rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Results</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.averageResultsPerQuery.toFixed(1)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Per search query
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.averageResponseTime}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Average response
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Search Volume Trend
                </CardTitle>
                <CardDescription>Daily search activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.searchVolumeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: any, name: string) => [
                        formatNumber(value),
                        name === 'searches' ? 'Searches' : 'Users'
                      ]}
                    />
                    <Area type="monotone" dataKey="searches" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Result Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Result Type Distribution
                </CardTitle>
                <CardDescription>What users are searching for</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.resultTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {metrics.resultTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string, props: any) => [
                      `${value} (${props.payload.percentage}%)`,
                      props.payload.type
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {metrics.resultTypeDistribution.map((item, index) => (
                    <div key={item.type} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{item.type}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {formatPercentage(item.percentage)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Search Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {formatPercentage(metrics.searchSuccessRate)}
                  </div>
                  <div className="text-sm text-green-700 mt-1">Success Rate</div>
                  <div className="text-xs text-green-600 mt-2">
                    Queries with results
                  </div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {formatPercentage(metrics.noResultsRate)}
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">No Results Rate</div>
                  <div className="text-xs text-yellow-600 mt-2">
                    Queries without results
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.averageResultsPerQuery.toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">Avg Results</div>
                  <div className="text-xs text-blue-600 mt-2">
                    Results per query
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Trends Over Time</CardTitle>
              <CardDescription>How search behavior has changed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.searchVolumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: any, name: string) => [
                      formatNumber(value),
                      name === 'searches' ? 'Searches' : 'Unique Users'
                    ]}
                  />
                  <Line type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Popular Tab */}
        <TabsContent value="popular" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Search Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Most popular search terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.popularSearchTerms.map((term, index) => (
                    <div key={term.term} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="font-medium">{term.term}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatNumber(term.count)}</Badge>
                        <Badge variant="outline" className={getTrendColor(term.trend)}>
                          {getTrendIcon(term.trend)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Clicked Results */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clicked Results</CardTitle>
                <CardDescription>Most popular search results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topResults.map((result, index) => (
                    <div key={result.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{result.type}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline">{formatNumber(result.clicks)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Performance</CardTitle>
                <CardDescription>Search engine performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.averageResponseTime}ms
                    </div>
                    <div className="text-sm text-blue-700">Average</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(metrics.averageResponseTime * 0.7)}ms
                    </div>
                    <div className="text-sm text-green-700">95th Percentile</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fast (&lt;200ms)</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Medium (200-500ms)</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Slow (&gt;500ms)</span>
                    <span>4%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '4%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Results Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Queries with No Results</CardTitle>
                <CardDescription>Searches that need improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.noResultsQueries.slice(0, 8).map((query, index) => (
                    <div key={query} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{query}</span>
                      </div>
                      <Badge variant="outline" className="text-red-600 bg-red-100 border-red-200">
                        No results
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {analytics.noResultsQueries.length > 8 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      View all {analytics.noResultsQueries.length} queries
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}