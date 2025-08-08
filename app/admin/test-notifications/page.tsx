'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  realtimeNotificationSystem,
  NotificationType,
  NotificationCategory,
  NotificationPriority
} from '@/lib/notifications/realtime-notification-system'
import HealthcareNotificationTriggers from '@/lib/notifications/healthcare-triggers'
import { useUser } from '@/hooks/use-user'
import { Bell, Send, Users, User, AlertTriangle, Pill, Calendar, DollarSign, Settings, Activity } from 'lucide-react'

export default function TestNotificationsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>(NotificationType.NEW_PATIENT_REGISTRATION)
  const [category, setCategory] = useState<NotificationCategory>(NotificationCategory.PATIENT_CARE)
  const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.NORMAL)
  const [targetType, setTargetType] = useState<'user' | 'role'>('role')
  const [targetValue, setTargetValue] = useState('')

  const handleSendNotification = async () => {
    if (!title || !message || !targetValue) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (targetType === 'role') {
        await realtimeNotificationSystem.createRoleNotification(
          targetValue,
          title,
          message,
          type,
          category,
          priority,
          {
            data: { test: true, created_by: user?.id },
            action_url: '/admin/test-notifications'
          }
        )
      } else {
        await realtimeNotificationSystem.createUserNotification(
          targetValue,
          title,
          message,
          type,
          category,
          priority,
          {
            data: { test: true, created_by: user?.id },
            action_url: '/admin/test-notifications'
          }
        )
      }

      alert('Notification sent successfully!')
      setTitle('')
      setMessage('')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  const sendTestScenarios = async () => {
    setLoading(true)
    try {
      // Patient arrival scenario
      await HealthcareNotificationTriggers.notifyPatientArrival(
        'test-patient-1',
        'John Doe',
        'test-appointment-1',
        user?.role === 'doctor' ? user.id : undefined
      )

      // Low inventory scenario
      await HealthcareNotificationTriggers.notifyLowInventory(
        'med-123',
        'Paracetamol 500mg',
        5,
        20
      )

      // Lab results scenario
      if (user?.role === 'doctor') {
        await HealthcareNotificationTriggers.notifyLabResultsReady(
          'test-patient-1',
          'John Doe',
          user.id,
          'Blood Test'
        )
      }

      // Payment received scenario
      await HealthcareNotificationTriggers.notifyPaymentReceived(
        'inv-123',
        'Jane Smith',
        2500,
        'Cash'
      )

      alert('Test scenarios sent successfully!')
    } catch (error) {
      console.error('Error sending test scenarios:', error)
      alert('Failed to send test scenarios')
    } finally {
      setLoading(false)
    }
  }

  const sendEmergencyAlert = async () => {
    setLoading(true)
    try {
      await HealthcareNotificationTriggers.notifyEmergencyAlert(
        'Emergency Alert Test',
        'This is a test emergency alert. All medical staff please report to reception.',
        'test-patient-emergency'
      )
      alert('Emergency alert sent!')
    } catch (error) {
      console.error('Error sending emergency alert:', error)
      alert('Failed to send emergency alert')
    } finally {
      setLoading(false)
    }
  }

  const notificationTypes = Object.values(NotificationType)
  const notificationCategories = Object.values(NotificationCategory)
  const notificationPriorities = Object.values(NotificationPriority)
  const roles = ['doctor', 'receptionist', 'pharmacist', 'admin', 'attendant']

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case NotificationCategory.PATIENT_CARE: return <User className="h-4 w-4" />
      case NotificationCategory.SCHEDULING: return <Calendar className="h-4 w-4" />
      case NotificationCategory.CLINICAL: return <Activity className="h-4 w-4" />
      case NotificationCategory.PHARMACY: return <Pill className="h-4 w-4" />
      case NotificationCategory.BILLING: return <DollarSign className="h-4 w-4" />
      case NotificationCategory.SYSTEM: return <Settings className="h-4 w-4" />
      case NotificationCategory.EMERGENCY: return <AlertTriangle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'destructive'
      case NotificationPriority.URGENT: return 'destructive'
      case NotificationPriority.HIGH: return 'default'
      case NotificationPriority.NORMAL: return 'secondary'
      case NotificationPriority.LOW: return 'outline'
      default: return 'secondary'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators can access the notification testing page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notification System Test</h1>
        <Badge variant="outline">Admin Only</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Custom Notification
            </CardTitle>
            <CardDescription>
              Create and send a custom notification to test the real-time system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Type</label>
                <Select value={targetType} onValueChange={(value: 'user' | 'role') => setTargetType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Role
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User ID
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {targetType === 'role' ? 'Role' : 'User ID'}
                </label>
                {targetType === 'role' ? (
                  <Select value={targetValue} onValueChange={setTargetValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter user ID"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={(value: NotificationType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map(notifType => (
                    <SelectItem key={notifType} value={notifType}>
                      {notifType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={(value: NotificationCategory) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(cat)}
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(value: NotificationPriority) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationPriorities.map(prio => (
                      <SelectItem key={prio} value={prio}>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(prio)} className="h-2 w-2 p-0" />
                          {prio.charAt(0).toUpperCase() + prio.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSendNotification} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Predefined Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Healthcare Scenarios
            </CardTitle>
            <CardDescription>
              Test realistic healthcare notification scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Test Scenarios</h4>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient arrival notification
                </div>
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Low inventory alert
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Lab results ready
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment received
                </div>
              </div>

              <Button 
                onClick={sendTestScenarios} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Test Scenarios'}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Emergency Alert</h4>
              <p className="text-sm text-gray-600">
                Send a critical emergency alert to all medical staff
              </p>
              <Button 
                onClick={sendEmergencyAlert} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Emergency Alert'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>Current User: <span className="font-medium">{(user as any)?.full_name}</span></div>
            <div>Role: <Badge variant="outline">{user?.role}</Badge></div>
            <div>ID: <code className="bg-gray-100 px-1 rounded text-xs">{user?.id}</code></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}