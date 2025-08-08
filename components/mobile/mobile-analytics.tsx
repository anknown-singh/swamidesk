'use client'

import { useState, useEffect } from 'react'
import { MobileDashboardLayout, MobileGrid, MobileSection } from './mobile-dashboard-layout'
import { MobileCard, MobileMetricCard } from './mobile-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Clock,
  Target,
  Download,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
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

// Sample data for demonstration
const revenueData = [
  { date: '1', desktop: 4000, mobile: 2400 },
  { date: '7', desktop: 3000, mobile: 1398 },
  { date: '14', desktop: 2000, mobile: 9800 },
  { date: '21', desktop: 2780, mobile: 3908 },
  { date: '28', desktop: 1890, mobile: 4800 },
]

const patientFlowData = [
  { hour: '8AM', patients: 5, completed: 4 },
  { hour: '9AM', patients: 12, completed: 10 },
  { hour: '10AM', patients: 15, completed: 13 },
  { hour: '11AM', patients: 18, completed: 16 },
  { hour: '12PM', patients: 20, completed: 17 },
  { hour: '2PM', patients: 22, completed: 20 },
  { hour: '3PM', patients: 18, completed: 16 },
  { hour: '4PM', patients: 15, completed: 14 },
  { hour: '5PM', patients: 10, completed: 9 },
]

const departmentData = [
  { name: 'General Medicine', value: 45, color: '#3B82F6' },
  { name: 'Procedures', value: 30, color: '#10B981' },
  { name: 'Pharmacy', value: 25, color: '#F59E0B' },
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

interface MobileAnalyticsProps {
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
}

export function MobileAnalytics({ 
  timeRange = '30', 
  onTimeRangeChange 
}: MobileAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedChart, setSelectedChart] = useState<string | null>(null)

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <MobileDashboardLayout
      title="Analytics"
      subtitle="Business intelligence and performance metrics"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
          <TabsTrigger value="patients" className="text-xs">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <MobileSection title="Key Performance Indicators">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MobileMetricCard
                title="Total Revenue"
                value="₹2,45,000"
                subtitle="Last 30 days"
                icon={DollarSign}
                color="green"
                trend={{ value: "+12.3%", positive: true }}
              />
              <MobileMetricCard
                title="Patients Served"
                value="1,245"
                subtitle="Last 30 days"
                icon={Users}
                color="blue"
                trend={{ value: "+8.1%", positive: true }}
              />
              <MobileMetricCard
                title="Avg. Revenue/Patient"
                value="₹1,968"
                subtitle="Per consultation"
                icon={Target}
                color="purple"
                trend={{ value: "+4.2%", positive: true }}
              />
              <MobileMetricCard
                title="Completion Rate"
                value="94.2%"
                subtitle="Patient journey"
                icon={Activity}
                color="green"
              />
            </div>
          </MobileSection>

          {/* Performance Chart */}
          <MobileCard title="Performance Trends">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="desktop" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </MobileCard>

          {/* Department Breakdown */}
          <MobileGrid columns={2}>
            <MobileCard title="Department Performance">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: dept.color }}
                      />
                      <span>{dept.name}</span>
                    </div>
                    <span className="font-medium">{dept.value}%</span>
                  </div>
                ))}
              </div>
            </MobileCard>

            <MobileCard title="Quick Insights">
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-800">Revenue Growth</p>
                    <p className="text-xs text-green-700">12.3% increase this month</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Patient Volume</p>
                    <p className="text-xs text-blue-700">Peak hours: 11AM - 2PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-orange-800">Action Needed</p>
                    <p className="text-xs text-orange-700">3 low-stock medications</p>
                  </div>
                </div>
              </div>
            </MobileCard>
          </MobileGrid>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <MobileSection title="Revenue Analysis">
            <div className="grid grid-cols-3 gap-3">
              <MobileMetricCard
                title="Daily Avg"
                value="₹8,167"
                icon={Calendar}
                color="blue"
              />
              <MobileMetricCard
                title="Monthly"
                value="₹2,45,000"
                icon={TrendingUp}
                color="green"
              />
              <MobileMetricCard
                title="Projection"
                value="₹2,67,000"
                icon={Target}
                color="purple"
              />
            </div>
          </MobileSection>

          <MobileCard title="Revenue Trends">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `₹${value/1000}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="desktop" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MobileCard>

          <MobileCard title="Revenue Breakdown">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium">Consultations</span>
                <span className="text-sm font-bold text-blue-600">₹1,47,000 (60%)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">Procedures</span>
                <span className="text-sm font-bold text-green-600">₹73,500 (30%)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-sm font-medium">Pharmacy</span>
                <span className="text-sm font-bold text-orange-600">₹24,500 (10%)</span>
              </div>
            </div>
          </MobileCard>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <MobileSection title="Patient Analytics">
            <div className="grid grid-cols-2 gap-3">
              <MobileMetricCard
                title="Total Visits"
                value="1,245"
                icon={Users}
                color="blue"
                trend={{ value: "+8.1%", positive: true }}
              />
              <MobileMetricCard
                title="New Patients"
                value="234"
                icon={UserCheck}
                color="green"
                trend={{ value: "+15.2%", positive: true }}
              />
            </div>
          </MobileSection>

          <MobileCard title="Hourly Patient Flow">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientFlowData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="patients" 
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    name="Registrations"
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    name="Completed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MobileCard>

          <MobileGrid columns={2}>
            <MobileCard title="Wait Times" compact>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">18 min</div>
                <div className="text-xs text-muted-foreground">Average wait</div>
                <div className="mt-2 text-xs">
                  <span className="text-green-600">↓ 3 min from last month</span>
                </div>
              </div>
            </MobileCard>

            <MobileCard title="Satisfaction" compact>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">4.7/5</div>
                <div className="text-xs text-muted-foreground">Patient rating</div>
                <div className="mt-2 text-xs">
                  <span className="text-green-600">94% satisfaction rate</span>
                </div>
              </div>
            </MobileCard>
          </MobileGrid>
        </TabsContent>
      </Tabs>
    </MobileDashboardLayout>
  )
}