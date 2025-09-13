'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  BellDot,
  BellOff,
  X,
  AlertTriangle,
  User,
  Calendar,
  Pill,
  DollarSign,
  Settings,
  Trash2,
  MoreVertical,
  CheckCheck
} from 'lucide-react'
import {
  realtimeNotificationSystem,
  type Notification,
  NotificationCategory,
  NotificationPriority
} from '@/lib/notifications/realtime-notification-system'

interface NotificationCenterProps {
  userId: string
  userRole: string
  className?: string
}

export function NotificationCenter({ userId, userRole, className = '' }: NotificationCenterProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadNotifications = async () => {
    try {
      const userNotifications = await realtimeNotificationSystem.getUserNotifications(userId)
      const unreadCount = await realtimeNotificationSystem.getUnreadCount(userId)
      
      setNotifications(userNotifications)
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleNewNotification = (notification: Notification) => {
    // Play notification sound for high priority notifications
    if (notification.priority === NotificationPriority.HIGH || 
        notification.priority === NotificationPriority.URGENT ||
        notification.priority === NotificationPriority.CRITICAL) {
      audioRef.current?.play().catch(console.error)
    }

    loadNotifications()

    // Auto-open notification center for critical notifications
    if (notification.priority === NotificationPriority.CRITICAL) {
      setIsOpen(true)
    }
  }

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to real-time notifications for this user
    const unsubscribe = realtimeNotificationSystem.subscribe(userId, (notification) => {
      handleNewNotification(notification)
    })

    // Also subscribe to role-based notifications
    const roleUnsubscribe = realtimeNotificationSystem.subscribe(`role:${userRole}`, (notification) => {
      handleNewNotification(notification)
    })

    // Initialize audio for notification sounds
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 0.3

    return () => {
      unsubscribe()
      roleUnsubscribe()
    }
  }, [userId, userRole])

  const handleMarkAsRead = async (notificationId: string) => {
    await realtimeNotificationSystem.markAsRead(notificationId, userId)
    loadNotifications()
  }

  const handleDeleteNotification = async (notificationId: string) => {
    // Delete notification (this would need to be implemented in the service)
    console.log('Delete notification:', notificationId)
    loadNotifications()
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      await realtimeNotificationSystem.markAllAsRead(userId)
      loadNotifications()
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    setLoading(true)
    try {
      // Clear all functionality would need to be implemented
      console.log('Clear all notifications for user:', userId)
      loadNotifications()
    } finally {
      setLoading(false)
    }
  }

  const getFilteredNotifications = () => {
    if (selectedCategory === 'all') {
      return notifications
    }
    return notifications.filter(n => n.category === selectedCategory)
  }

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.PATIENT_CARE:
        return <User className="h-4 w-4" />
      case NotificationCategory.SCHEDULING:
        return <Calendar className="h-4 w-4" />
      case NotificationCategory.CLINICAL:
        return <AlertTriangle className="h-4 w-4" />
      case NotificationCategory.PHARMACY:
        return <Pill className="h-4 w-4" />
      case NotificationCategory.BILLING:
        return <DollarSign className="h-4 w-4" />
      case NotificationCategory.SYSTEM:
        return <Settings className="h-4 w-4" />
      case NotificationCategory.EMERGENCY:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'border-l-red-500 bg-red-50'
      case NotificationPriority.URGENT:
        return 'border-l-orange-500 bg-orange-50'
      case NotificationPriority.HIGH:
        return 'border-l-yellow-500 bg-yellow-50'
      case NotificationPriority.NORMAL:
        return 'border-l-blue-500 bg-blue-50'
      case NotificationPriority.LOW:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return time.toLocaleDateString()
  }

  const formatCategoryName = (category: NotificationCategory) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCategoryCounts = () => {
    const counts = notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1
      return acc
    }, {} as Record<NotificationCategory, number>)

    return counts
  }

  const filteredNotifications = getFilteredNotifications()
  const categoryCounts = getCategoryCounts()

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {unreadCount > 0 ? (
              <BellDot className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-96 max-h-96 p-0" 
          align="end"
          sideOffset={5}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleMarkAllAsRead}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark all as read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Notification settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as NotificationCategory | 'all')}>
            <div className="px-4 py-2 border-b">
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value={NotificationCategory.PATIENT_CARE} className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {categoryCounts[NotificationCategory.PATIENT_CARE] || 0}
                </TabsTrigger>
                <TabsTrigger value={NotificationCategory.CLINICAL} className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {categoryCounts[NotificationCategory.CLINICAL] || 0}
                </TabsTrigger>
                <TabsTrigger value={NotificationCategory.EMERGENCY} className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  {categoryCounts[NotificationCategory.EMERGENCY] || 0}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedCategory} className="m-0">
              <ScrollArea className="h-80">
                <div className="p-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <BellOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            getPriorityColor(notification.priority)
                          } ${!notification.read_at ? 'bg-opacity-80' : 'bg-opacity-40'}`}
                          onClick={() => {
                            if (!notification.read_at) {
                              handleMarkAsRead(notification.id)
                            }
                            if (notification.action_url) {
                              router.push(notification.action_url)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(notification.category)}
                              <span className="font-medium text-sm">
                                {notification.title}
                              </span>
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.created_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {formatCategoryName(notification.category)}
                              </Badge>
                              <Badge 
                                variant={notification.priority === NotificationPriority.CRITICAL ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-1">
                                {notification.actions.slice(0, 2).map((action) => (
                                  <Button
                                    key={action.id}
                                    variant={action.style === 'primary' ? 'default' : action.style === 'danger' ? 'destructive' : 'outline'}
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (action.url) {
                                        window.location.href = action.url
                                      }
                                      // Handle other action types
                                      console.log('Action:', action.action, action)
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to full notifications page
                  router.push('/notifications')
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Notification toast component for individual notifications
export function NotificationToast({ 
  notification, 
  onClose, 
  onAction 
}: { 
  notification: Notification
  onClose: () => void
  onAction?: (actionId: string) => void 
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(5000) // 5 seconds

  useEffect(() => {
    // Auto-hide after 5 seconds unless critical
    if (notification.priority !== NotificationPriority.CRITICAL) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Allow fade out animation
      }, 5000)

      const countdown = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 100))
      }, 100)

      return () => {
        clearTimeout(timer)
        clearInterval(countdown)
      }
    }
    
    return undefined
  }, [notification.priority, onClose])

  if (!isVisible) return null

  return (
    <Card className={`fixed top-4 right-4 z-50 w-96 border-l-4 ${getPriorityColor(notification.priority)} transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getCategoryIcon(notification.category)}
            {notification.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {notification.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-3">
          {notification.message}
        </CardDescription>
        
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2">
            {notification.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.style === 'primary' ? 'default' : action.style === 'danger' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => onAction?.(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Progress bar for auto-dismiss */}
        {notification.priority !== NotificationPriority.CRITICAL && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-100" 
              style={{ width: `${(timeLeft / 5000) * 100}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  function getCategoryIcon(category: NotificationCategory) {
    switch (category) {
      case NotificationCategory.PATIENT_CARE:
        return <User className="h-4 w-4" />
      case NotificationCategory.SCHEDULING:
        return <Calendar className="h-4 w-4" />
      case NotificationCategory.CLINICAL:
        return <AlertTriangle className="h-4 w-4" />
      case NotificationCategory.PHARMACY:
        return <Pill className="h-4 w-4" />
      case NotificationCategory.BILLING:
        return <DollarSign className="h-4 w-4" />
      case NotificationCategory.SYSTEM:
        return <Settings className="h-4 w-4" />
      case NotificationCategory.EMERGENCY:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  function getPriorityColor(priority: NotificationPriority) {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'border-l-red-500 bg-red-50'
      case NotificationPriority.URGENT:
        return 'border-l-orange-500 bg-orange-50'
      case NotificationPriority.HIGH:
        return 'border-l-yellow-500 bg-yellow-50'
      case NotificationPriority.NORMAL:
        return 'border-l-blue-500 bg-blue-50'
      case NotificationPriority.LOW:
        return 'border-l-gray-500 bg-gray-50'
    }
  }
}