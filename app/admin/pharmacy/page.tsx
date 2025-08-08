'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pill, Search, Clock, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react'

interface PharmacyIssue {
  id: string
  prescription_id: string
  medicine_id: string
  requested_quantity: number
  issued_quantity: number | null
  status: 'pending' | 'partially_issued' | 'completed' | 'cancelled'
  priority: 'normal' | 'urgent'
  notes: string | null
  created_at: string
  issued_at: string | null
  medicines?: {
    id: string
    name: string
    unit_price: number
    dosage_form: string
    stock_quantity: number
  }
}

export default function AdminPharmacyQueuePage() {
  const [pharmacyIssues, setPharmacyIssues] = useState<PharmacyIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchPharmacyIssues = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('pharmacy_issues')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPharmacyIssues(data || [])
    } catch (error) {
      console.error('Error fetching pharmacy issues:', error)
      setError('Failed to load pharmacy queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPharmacyIssues()
  }, [fetchPharmacyIssues])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
      case 'partially_issued':
        return { color: 'bg-blue-100 text-blue-800', label: 'Partially Issued', icon: AlertCircle }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: AlertCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock }
    }
  }

  const getPriorityConfig = (priority: string) => {
    if (priority === 'urgent') {
      return { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    } else {
      return { color: 'bg-gray-100 text-gray-600', label: 'Normal' }
    }
  }

  const filteredIssues = pharmacyIssues.filter(issue => {
    const matchesSearch = issue.medicines?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.prescription_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
    const matchesPriority = filterPriority === 'all' || issue.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalIssues = pharmacyIssues.length
  const pendingCount = pharmacyIssues.filter(i => i.status === 'pending').length
  const partiallyIssuedCount = pharmacyIssues.filter(i => i.status === 'partially_issued').length
  const completedCount = pharmacyIssues.filter(i => i.status === 'completed').length
  const urgentCount = pharmacyIssues.filter(i => i.priority === 'urgent').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading pharmacy queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Queue</h1>
          <p className="text-muted-foreground">Administrative view of pharmacy medicine dispensing queue</p>
        </div>
        <Button onClick={() => window.location.href = '/pharmacist/dispensing'} className="flex items-center gap-2">
          <Pill className="h-4 w-4" />
          Process Queue
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
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold">{totalIssues}</p>
              </div>
              <Pill className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial</p>
                <p className="text-2xl font-bold text-blue-600">{partiallyIssuedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by medicine name, prescription ID, or issue ID..."
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
              <option value="pending">Pending</option>
              <option value="partially_issued">Partially Issued</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredIssues.length} issues in queue
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy Issues List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmacy Queue ({filteredIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const statusConfig = getStatusConfig(issue.status)
              const priorityConfig = getPriorityConfig(issue.priority)
              const StatusIcon = statusConfig.icon
              
              return (
                <div key={issue.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{issue.medicines?.name || 'Unknown Medicine'}</h3>
                          <p className="text-sm text-gray-600">
                            Issue ID: {issue.id.slice(0, 8)}...
                            {issue.prescription_id && ` • Rx: ${issue.prescription_id.slice(0, 8)}...`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600">
                            {issue.issued_quantity || 0} / {issue.requested_quantity}
                          </p>
                          <p className="text-sm text-gray-600">Issued / Requested</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Medicine:</span>
                            <p>{issue.medicines?.name} ({issue.medicines?.dosage_form})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Stock:</span>
                            <p>{issue.medicines?.stock_quantity || 0} units available</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Requested:</span>
                            <p>{new Date(issue.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-700">Unit Price:</span>
                            <p>₹{issue.medicines?.unit_price?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </div>

                      {issue.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-600 mt-1">{issue.notes}</p>
                        </div>
                      )}

                      {issue.issued_at && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Issued At:</span>
                          <p className="text-gray-600 mt-1">{new Date(issue.issued_at).toLocaleString()}</p>
                        </div>
                      )}

                      {/* Medicine Details */}
                      {issue.medicines && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Total Value:</span>
                          <div className="mt-2">
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Requested: {issue.requested_quantity} × ₹{issue.medicines.unit_price}</p>
                                  <p className="text-gray-600 text-sm">
                                    Issued: {issue.issued_quantity || 0} units
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{((issue.issued_quantity || 0) * issue.medicines.unit_price).toFixed(2)}</p>
                                  <p className="text-sm text-gray-600">Total value issued</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredIssues.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No pharmacy issues found matching your search' : 'No items in pharmacy queue'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}