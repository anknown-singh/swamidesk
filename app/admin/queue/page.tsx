'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Search, Users, UserCheck, AlertCircle, CheckCircle, Calendar, Phone } from 'lucide-react'

interface QueueItem {
  id: string
  patient_id: string
  token_number: number
  status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed'
  priority: boolean
  chief_complaint: string
  notes: string
  visit_date: string
  created_at: string
  updated_at: string
  patients: {
    id: string
    full_name: string
    phone: string
    date_of_birth: string
  }
}

export default function AdminQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (
            id,
            full_name,
            phone,
            date_of_birth
          )
        `)
        .in('status', ['waiting', 'in_consultation'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setQueueItems(data || [])
    } catch (error) {
      console.error('Error fetching queue:', error)
      setError('Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    
    // Set up real-time subscription  
    const supabase = createClient()
    const subscription = supabase
      .channel('queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        fetchQueue()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchQueue])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting', icon: Clock }
      case 'in_consultation':
        return { color: 'bg-blue-100 text-blue-800', label: 'In Consultation', icon: UserCheck }
      case 'services_pending':
        return { color: 'bg-orange-100 text-orange-800', label: 'Services Pending', icon: AlertCircle }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock }
    }
  }

  const getPriorityConfig = (priority: boolean) => {
    if (priority) {
      return { color: 'bg-red-100 text-red-800', label: 'High Priority' }
    } else {
      return { color: 'bg-gray-100 text-gray-600', label: 'Normal' }
    }
  }

  const filteredQueue = queueItems.filter(item => {
    const matchesSearch = (item.patients?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.patients?.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         item.token_number.toString().includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesPriority = filterPriority === 'all' || 
                           (filterPriority === 'emergency' && item.priority) ||
                           (filterPriority === 'normal' && !item.priority)
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalInQueue = queueItems.length
  const waitingCount = queueItems.filter(q => q.status === 'waiting').length
  const inProgressCount = queueItems.filter(q => q.status === 'in_consultation').length
  const completedCount = queueItems.filter(q => q.status === 'completed').length
  const emergencyCount = queueItems.filter(q => q.priority === true).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Administrative view of patient queue across all departments</p>
        </div>
        <Button onClick={() => window.location.href = '/receptionist/queue'} className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Queue
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total in Queue</p>
                <p className="text-2xl font-bold">{totalInQueue}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{waitingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency</p>
                <p className="text-2xl font-bold text-red-600">{emergencyCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, or queue number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="waiting">Waiting</option>
              <option value="in_consultation">In Consultation</option>
              <option value="services_pending">Services Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Priority</option>
              <option value="emergency">High Priority</option>
              <option value="normal">Normal</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredQueue.length} patients in queue
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Patient Queue ({filteredQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQueue.map((item) => {
              const statusConfig = getStatusConfig(item.status)
              const priorityConfig = getPriorityConfig(item.priority)
              const StatusIcon = statusConfig.icon
              
              return (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                          #{item.token_number}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{item.patients.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            ID: {item.patients.id.slice(0, 8)}...
                            {item.patients.phone && ` • ${item.patients.phone}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Added to Queue:</span>
                            <p>{new Date(item.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Last Updated:</span>
                            <p>{new Date(item.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Age:</span>
                            <p>{item.patients.date_of_birth ? 
                                new Date().getFullYear() - new Date(item.patients.date_of_birth).getFullYear() 
                                : 'N/A'} years</p>
                          </div>
                        </div>
                      </div>

                      {item.chief_complaint && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Chief Complaint:</span>
                          <p className="text-gray-600 mt-1">{item.chief_complaint}</p>
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-600 mt-1">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredQueue.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No patients found matching your search' : 'No patients in queue'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}