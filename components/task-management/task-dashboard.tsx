'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// Types
import { 
  AssignedTask, 
  TaskDashboardStats, 
  TaskType, 
  TaskPriority, 
  TaskStatus, 
  TaskCategory,
  TaskFilterOptions,
  UserProfile,
  Patient,
  Visit,
  Appointment
} from '@/lib/types'

// Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Calendar, 
  Plus, 
  Search,
  Filter,
  MoreHorizontal,
  User,
  Stethoscope,
  FileText,
  Activity,
  TrendingUp,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskDashboardProps {
  className?: string
}

export function TaskDashboard({ className }: TaskDashboardProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [stats, setStats] = useState<TaskDashboardStats | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filters, setFilters] = useState<TaskFilterOptions>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      // Load tasks with relations
      const { data: tasksData, error: tasksError } = await supabase
        .from('assigned_tasks')
        .select(`
          *,
          assigned_by_user:users!assigned_tasks_assigned_by_fkey(id, full_name, role),
          assigned_to_user:users!assigned_tasks_assigned_to_fkey(id, full_name, role),
          patient:patients(id, full_name, phone),
          visit:visits(id, visit_date, status),
          appointment:appointments(id, scheduled_date, scheduled_time, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (tasksError) throw tasksError

      setTasks(tasksData || [])

      // Load users for assignment
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, role, department')
        .eq('is_active', true)
        .order('full_name')

      if (usersError) throw usersError

      setUsers(usersData || [])

      // Calculate stats
      const allTasks = tasksData || []
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const calculatedStats: TaskDashboardStats = {
        total_tasks: allTasks.length,
        pending_tasks: allTasks.filter(t => t.status === 'pending').length,
        in_progress_tasks: allTasks.filter(t => t.status === 'in_progress').length,
        completed_today: allTasks.filter(t => 
          t.status === 'completed' && 
          t.completed_at && 
          new Date(t.completed_at) >= todayStart
        ).length,
        overdue_tasks: allTasks.filter(t => 
          t.status !== 'completed' && 
          t.due_date && 
          new Date(t.due_date) < now
        ).length,
        high_priority_tasks: allTasks.filter(t => 
          ['high', 'urgent', 'critical'].includes(t.priority) &&
          t.status !== 'completed'
        ).length,
        my_tasks: allTasks.filter(t => t.assigned_to === 'current_user_id').length, // TODO: Get current user
        team_tasks: allTasks.length,
        average_completion_time_hours: 0, // TODO: Calculate from actual data
        completion_rate_percentage: allTasks.length > 0 
          ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100)
          : 0
      }

      setStats(calculatedStats)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load task dashboard')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Filter tasks based on current filters and search
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assigned_to_user?.full_name.toLowerCase().includes(searchLower) ||
        task.patient?.full_name?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Tab filter
    if (selectedTab !== 'all') {
      if (selectedTab === 'my_tasks' && task.assigned_to !== 'current_user_id') return false
      if (selectedTab === 'overdue' && (!task.due_date || new Date(task.due_date) >= new Date())) return false
      if (selectedTab === 'high_priority' && !['high', 'urgent', 'critical'].includes(task.priority)) return false
    }

    // Additional filters
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.task_type && task.task_type !== filters.task_type) return false
    if (filters.category && task.category !== filters.category) return false
    if (filters.assigned_to && task.assigned_to !== filters.assigned_to) return false

    return true
  })

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'urgent': return 'bg-orange-500'
      case 'high': return 'bg-yellow-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'assigned': return 'bg-purple-500'
      case 'overdue': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  // Get task type icon
  const getTaskTypeIcon = (taskType: TaskType) => {
    switch (taskType) {
      case 'clinical': return <Stethoscope className="w-4 h-4" />
      case 'administrative': return <FileText className="w-4 h-4" />
      case 'follow_up': return <Calendar className="w-4 h-4" />
      case 'investigation': return <Activity className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Task Management Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Comprehensive task assignment and tracking system for healthcare workflow management
        </p>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total_tasks}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.in_progress_tasks}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{stats.completed_today}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{stats.overdue_tasks}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title, description, assignee, or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as TaskStatus }))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.priority || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value as TaskPriority }))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.assigned_to || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_to: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="my_tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="high_priority">High Priority</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No tasks found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || Object.keys(filters).some(key => filters[key as keyof TaskFilterOptions])
                        ? "Try adjusting your search or filters"
                        : "Create your first task to get started"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Task Header */}
                        <div className="flex items-start gap-3">
                          <div className={cn("w-1 h-16 rounded-full", getPriorityColor(task.priority))} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTaskTypeIcon(task.task_type)}
                              <h4 className="font-semibold">{task.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {task.task_type.replace('_', ' ')}
                              </Badge>
                              <div className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))} />
                              <span className="text-sm text-muted-foreground capitalize">
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description.length > 120 
                                  ? task.description.substring(0, 120) + '...'
                                  : task.description
                                }
                              </p>
                            )}

                            {/* Task Details */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              {task.assigned_to_user && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>Assigned to: {task.assigned_to_user.full_name}</span>
                                </div>
                              )}
                              
                              {task.patient && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>Patient: {task.patient.full_name}</span>
                                </div>
                              )}
                              
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              
                              {task.estimated_duration_minutes && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Est: {task.estimated_duration_minutes}min</span>
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {task.progress_percentage > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{task.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full transition-all"
                                    style={{ width: `${task.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{task.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}