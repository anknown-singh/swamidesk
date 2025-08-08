'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'
import { 
  Shield, 
  Download, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Settings,
  RefreshCw,
  Loader2
} from 'lucide-react'

interface BackupConfig {
  id?: string
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  include_patients: boolean
  include_billing: boolean
  include_inventory: boolean
  include_system: boolean
  retention_days: number
  auto_cleanup: boolean
  last_backup: string | null
  next_backup: string | null
}

interface BackupJob {
  id: string
  created_at: string
  status: 'completed' | 'failed' | 'in_progress'
  size_mb: number
  tables_included: string[]
  file_path: string
  error_message?: string
}

export function BackupSystem() {
  const [config, setConfig] = useState<BackupConfig>({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    include_patients: true,
    include_billing: true,
    include_inventory: true,
    include_system: false,
    retention_days: 30,
    auto_cleanup: true,
    last_backup: null,
    next_backup: null
  })

  const [backupHistory, setBackupHistory] = useState<BackupJob[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [backing, setBacking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchBackupConfig()
    fetchBackupHistory()
  }, [])

  const fetchBackupConfig = async () => {
    try {
      // const supabase = createAuthenticatedClient()
      
      // In a real implementation, this would fetch from a backup_config table
      // For now, we'll simulate with localStorage
      const savedConfig = localStorage.getItem('backup_config')
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      }
      
      // Calculate next backup time
      if (config.enabled) {
        const nextBackup = calculateNextBackupTime(config)
        setConfig(prev => ({ ...prev, next_backup: nextBackup }))
      }

    } catch (error) {
      console.error('Error fetching backup config:', error)
      setError('Failed to load backup configuration')
    } finally {
      setLoading(false)
    }
  }

  const fetchBackupHistory = async () => {
    try {
      // In a real implementation, this would fetch from a backup_jobs table
      // For now, we'll simulate backup history
      const mockHistory: BackupJob[] = [
        {
          id: '1',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          size_mb: 245.6,
          tables_included: ['patients', 'opd_records', 'invoices', 'medicines'],
          file_path: '/backups/swamidesk_backup_2024_01_15.sql'
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          size_mb: 238.2,
          tables_included: ['patients', 'opd_records', 'invoices', 'medicines'],
          file_path: '/backups/swamidesk_backup_2024_01_14.sql'
        },
        {
          id: '3',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'failed',
          size_mb: 0,
          tables_included: [],
          file_path: '',
          error_message: 'Connection timeout during backup process'
        }
      ]

      setBackupHistory(mockHistory)

    } catch (error) {
      console.error('Error fetching backup history:', error)
    }
  }

  const calculateNextBackupTime = (config: BackupConfig): string => {
    const now = new Date()
    const nextBackup = new Date()
    
    // Set time
    const [hours, minutes] = config.time.split(':').map(Number)
    nextBackup.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, move to next occurrence
    if (nextBackup <= now) {
      switch (config.frequency) {
        case 'daily':
          nextBackup.setDate(nextBackup.getDate() + 1)
          break
        case 'weekly':
          nextBackup.setDate(nextBackup.getDate() + 7)
          break
        case 'monthly':
          nextBackup.setMonth(nextBackup.getMonth() + 1)
          break
      }
    }
    
    return nextBackup.toISOString()
  }

  const saveBackupConfig = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Calculate next backup time
      const updatedConfig = {
        ...config,
        next_backup: config.enabled ? calculateNextBackupTime(config) : null
      }

      // In a real implementation, this would save to database
      localStorage.setItem('backup_config', JSON.stringify(updatedConfig))
      
      setConfig(updatedConfig)
      setSuccess('Backup configuration saved successfully!')

    } catch (error) {
      console.error('Error saving backup config:', error)
      setError('Failed to save backup configuration')
    } finally {
      setSaving(false)
    }
  }

  const performManualBackup = async () => {
    setBacking(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate backup process
      const backupData = await gatherBackupData()
      const backupFile = await createBackupFile(backupData)
      await downloadBackupFile(backupFile)

      // Update backup history
      const newBackup: BackupJob = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        status: 'completed',
        size_mb: Math.round(backupFile.size / 1024 / 1024 * 100) / 100,
        tables_included: getIncludedTables(),
        file_path: `/backups/${backupFile.name}`
      }

      setBackupHistory(prev => [newBackup, ...prev])
      setConfig(prev => ({ ...prev, last_backup: newBackup.created_at }))
      
      setSuccess('Manual backup completed successfully!')

    } catch (error) {
      console.error('Error performing backup:', error)
      setError('Failed to perform backup')
    } finally {
      setBacking(false)
    }
  }

  const gatherBackupData = async () => {
    const supabase = createAuthenticatedClient()
    const backupData: { [key: string]: any[] } = {}

    if (config.include_patients) {
      const { data: patients } = await supabase.from('patients').select('*')
      backupData.patients = patients || []

      const { data: opdRecords } = await supabase.from('opd_records').select('*')
      backupData.opd_records = opdRecords || []
    }

    if (config.include_billing) {
      const { data: invoices } = await supabase.from('invoices').select('*')
      backupData.invoices = invoices || []

      const { data: pharmacyIssues } = await supabase.from('pharmacy_issues').select('*')
      backupData.pharmacy_issues = pharmacyIssues || []
    }

    if (config.include_inventory) {
      const { data: medicines } = await supabase.from('medicines').select('*')
      backupData.medicines = medicines || []
    }

    if (config.include_system) {
      const { data: users } = await supabase.from('users').select('*')
      backupData.users = users || []

      const { data: services } = await supabase.from('services').select('*')
      backupData.services = services || []
    }

    return backupData
  }

  const createBackupFile = async (backupData: any) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `swamidesk_backup_${timestamp}.json`
    
    const backupContent = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0',
        clinic_name: 'SwamIDesk Clinic',
        tables_included: getIncludedTables(),
        total_records: Object.values(backupData).reduce((sum: number, table: any) => sum + table.length, 0)
      },
      data: backupData
    }

    const jsonString = JSON.stringify(backupContent, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    return new File([blob], fileName, { type: 'application/json' })
  }

  const downloadBackupFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getIncludedTables = () => {
    const tables = []
    if (config.include_patients) tables.push('patients', 'opd_records')
    if (config.include_billing) tables.push('invoices', 'pharmacy_issues')
    if (config.include_inventory) tables.push('medicines')
    if (config.include_system) tables.push('users', 'services')
    return tables
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading backup system...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Automated Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automated data backups to ensure data safety and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Enable/Disable Backup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Enable Automatic Backups</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically create data backups on schedule
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {config.enabled && (
              <>
                {/* Backup Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                    <select
                      value={config.frequency}
                      onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Backup Time</label>
                    <input
                      type="time"
                      value={config.time}
                      onChange={(e) => setConfig({ ...config, time: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Data Inclusion */}
                <div>
                  <label className="block text-sm font-medium mb-3">Include in Backup</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.include_patients}
                        onChange={(e) => setConfig({ ...config, include_patients: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Patient Data</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.include_billing}
                        onChange={(e) => setConfig({ ...config, include_billing: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Billing Data</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.include_inventory}
                        onChange={(e) => setConfig({ ...config, include_inventory: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Inventory Data</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.include_system}
                        onChange={(e) => setConfig({ ...config, include_system: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">System Config</span>
                    </label>
                  </div>
                </div>

                {/* Retention Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Retention Days</label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={config.retention_days}
                      onChange={(e) => setConfig({ ...config, retention_days: parseInt(e.target.value) || 30 })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep backups for this many days
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={config.auto_cleanup}
                      onChange={(e) => setConfig({ ...config, auto_cleanup: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm">Auto-cleanup old backups</label>
                  </div>
                </div>

                {/* Next Backup Info */}
                {config.next_backup && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Next backup scheduled: {new Date(config.next_backup).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Save Configuration */}
            <div className="flex gap-3">
              <Button
                onClick={saveBackupConfig}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>

              <Button
                onClick={performManualBackup}
                disabled={backing || getIncludedTables().length === 0}
                variant="outline"
              >
                {backing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Manual Backup Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>
            Recent backup jobs and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backupHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No backup history available</p>
                <p className="text-sm">Perform your first backup to see history here</p>
              </div>
            ) : (
              backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="font-medium">
                          Backup - {new Date(backup.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(backup.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      {getStatusBadge(backup.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Size: </span>
                        <span className="font-medium">{formatFileSize(backup.size_mb)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tables: </span>
                        <span className="font-medium">{backup.tables_included.length}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Included: </span>
                        <span className="font-medium">{backup.tables_included.join(', ')}</span>
                      </div>
                    </div>

                    {backup.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {backup.error_message}
                      </div>
                    )}
                  </div>

                  {backup.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="font-medium">
                  {config.last_backup 
                    ? new Date(config.last_backup).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Backup Status</p>
                <p className="font-medium">
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {config.enabled ? (
                <Shield className="h-8 w-8 text-blue-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="font-medium">
                  {formatFileSize(
                    backupHistory
                      .filter(b => b.status === 'completed')
                      .reduce((sum, b) => sum + b.size_mb, 0)
                  )}
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}