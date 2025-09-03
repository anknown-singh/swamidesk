'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Calendar, User, FileText, Clock, ArrowRight, Filter } from 'lucide-react'
import Link from 'next/link'

interface OPDRecord {
  id: string
  patient_id: string
  patient_name: string
  opd_date: string
  opd_time: string
  department: string
  doctor_id: string
  doctor_name: string
  opd_status: 'consultation' | 'procedures_pending' | 'pharmacy_pending' | 'investigations_pending' | 'completed'
  chief_complaint: string
  consultation_count: number
  treatment_count: number
  prescription_count: number
  created_at: string
  updated_at: string
}

export default function OPDListPage() {
  const [opdRecords, setOpdRecords] = useState<OPDRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<OPDRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Mock data - in real implementation, this would fetch from API
  useEffect(() => {
    const loadOPDRecords = async () => {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockRecords: OPDRecord[] = [
        {
          id: 'opd-001',
          patient_id: 'pat-001',
          patient_name: 'Sarah Johnson',
          opd_date: '2024-01-15',
          opd_time: '09:00',
          department: 'Cardiology',
          doctor_id: 'doc-001',
          doctor_name: 'Dr. Smith',
          opd_status: 'completed',
          chief_complaint: 'Chest pain and shortness of breath',
          consultation_count: 2,
          treatment_count: 1,
          prescription_count: 3,
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T11:30:00Z'
        },
        {
          id: 'opd-002',
          patient_id: 'pat-002',
          patient_name: 'Michael Chen',
          opd_date: '2024-01-15',
          opd_time: '10:30',
          department: 'Orthopedics',
          doctor_id: 'doc-002',
          doctor_name: 'Dr. Williams',
          opd_status: 'procedures_pending',
          chief_complaint: 'Knee pain after sports injury',
          consultation_count: 1,
          treatment_count: 1,
          prescription_count: 2,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:45:00Z'
        },
        {
          id: 'opd-003',
          patient_id: 'pat-003',
          patient_name: 'Emily Davis',
          opd_date: '2024-01-16',
          opd_time: '14:00',
          department: 'ENT',
          doctor_id: 'doc-003',
          doctor_name: 'Dr. Brown',
          opd_status: 'consultation',
          chief_complaint: 'Hearing loss and ear pain',
          consultation_count: 1,
          treatment_count: 0,
          prescription_count: 0,
          created_at: '2024-01-16T14:00:00Z',
          updated_at: '2024-01-16T14:00:00Z'
        },
        {
          id: 'opd-004',
          patient_id: 'pat-004',
          patient_name: 'Robert Wilson',
          opd_date: '2024-01-16',
          opd_time: '16:15',
          department: 'Neurology',
          doctor_id: 'doc-004',
          doctor_name: 'Dr. Anderson',
          opd_status: 'pharmacy_pending',
          chief_complaint: 'Persistent headaches and dizziness',
          consultation_count: 2,
          treatment_count: 1,
          prescription_count: 4,
          created_at: '2024-01-16T16:15:00Z',
          updated_at: '2024-01-16T17:00:00Z'
        },
        {
          id: 'opd-005',
          patient_id: 'pat-005',
          patient_name: 'Lisa Thompson',
          opd_date: '2024-01-17',
          opd_time: '11:00',
          department: 'Dermatology',
          doctor_id: 'doc-005',
          doctor_name: 'Dr. Martinez',
          opd_status: 'consultation',
          chief_complaint: 'Skin rash and allergic reaction',
          consultation_count: 1,
          treatment_count: 0,
          prescription_count: 1,
          created_at: '2024-01-17T11:00:00Z',
          updated_at: '2024-01-17T11:15:00Z'
        }
      ]
      
      setOpdRecords(mockRecords)
      setFilteredRecords(mockRecords)
      setLoading(false)
    }

    loadOPDRecords()
  }, [])

  // Filter records based on search and filter criteria
  useEffect(() => {
    const filtered = opdRecords.filter(record => {
      const matchesSearch = 
        record.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.chief_complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || record.opd_status === statusFilter
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter
      const matchesDate = !dateFilter || record.opd_date === dateFilter

      return matchesSearch && matchesStatus && matchesDepartment && matchesDate
    })

    setFilteredRecords(filtered)
  }, [searchQuery, statusFilter, departmentFilter, dateFilter, opdRecords])

  const getStatusColor = (status: OPDRecord['opd_status']) => {
    switch (status) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800'
      case 'procedures_pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'pharmacy_pending':
        return 'bg-orange-100 text-orange-800'
      case 'investigations_pending':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: OPDRecord['opd_status']) => {
    switch (status) {
      case 'consultation':
        return 'In Consultation'
      case 'procedures_pending':
        return 'Procedures Pending'
      case 'pharmacy_pending':
        return 'Pharmacy Pending'
      case 'investigations_pending':
        return 'Investigations Pending'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const departments = [...new Set(opdRecords.map(record => record.department))]
  const statuses = ['consultation', 'procedures_pending', 'pharmacy_pending', 'investigations_pending', 'completed']

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading OPD records...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OPD Management</h1>
          <p className="text-muted-foreground">
            Manage all Out-Patient Department records and sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/patients">
            <Plus className="w-4 h-4 mr-2" />
            Create New OPD
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{opdRecords.length}</div>
                <div className="text-sm text-muted-foreground">Total OPDs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {opdRecords.filter(r => r.opd_status !== 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Active OPDs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(opdRecords.map(r => r.patient_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {opdRecords.filter(r => r.opd_date === new Date().toISOString().split('T')[0]).length}
                </div>
                <div className="text-sm text-muted-foreground">Today's OPDs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search OPD records by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patients, complaints, doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status as OPDRecord['opd_status'])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OPD Records List */}
      <Card>
        <CardHeader>
          <CardTitle>
            OPD Records ({filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'})
          </CardTitle>
          <CardDescription>
            Click on any record to view detailed information and manage sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No OPD Records Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || dateFilter
                  ? 'Try adjusting your filters or search criteria'
                  : 'No OPD records have been created yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/admin/opd/${record.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className={getStatusColor(record.opd_status)}>
                              {getStatusLabel(record.opd_status)}
                            </Badge>
                            <Badge variant="secondary">{record.department}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.opd_date).toLocaleDateString()} at {record.opd_time}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold mb-1">{record.patient_name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Doctor:</strong> {record.doctor_name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>Chief Complaint:</strong> {record.chief_complaint}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              <strong>{record.consultation_count}</strong> Consultations
                            </span>
                            <span>
                              <strong>{record.treatment_count}</strong> Treatments
                            </span>
                            <span>
                              <strong>{record.prescription_count}</strong> Prescriptions
                            </span>
                            <span>
                              Updated: {new Date(record.updated_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-muted-foreground">
                            OPD ID: {record.id}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}