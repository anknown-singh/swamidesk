'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@/hooks/use-user'
import {
  realtimeNotificationSystem,
  type Notification,
  NotificationPriority
} from '@/lib/notifications/realtime-notification-system'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  showToast: (notification: Notification) => void
  toastNotifications: Notification[]
  dismissToast: (notificationId: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([])

  // Load notifications
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      const [userNotifications, userUnreadCount] = await Promise.all([
        realtimeNotificationSystem.getUserNotifications(user.id),
        realtimeNotificationSystem.getUnreadCount(user.id)
      ])
      
      setNotifications(userNotifications)
      setUnreadCount(userUnreadCount)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return
    
    try {
      await realtimeNotificationSystem.markAsRead(notificationId, user.id)
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [user?.id, refreshNotifications])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return
    
    try {
      await realtimeNotificationSystem.markAllAsRead(user.id)
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [user?.id, refreshNotifications])

  // Show toast notification
  const showToast = useCallback((notification: Notification) => {
    setToastNotifications(prev => {
      // Avoid duplicate toasts
      if (prev.find(n => n.id === notification.id)) {
        return prev
      }
      return [...prev, notification]
    })

    // Auto-dismiss non-critical toasts after 5 seconds
    if (notification.priority !== NotificationPriority.CRITICAL) {
      setTimeout(() => {
        dismissToast(notification.id)
      }, 5000)
    }
  }, [])

  // Dismiss toast notification
  const dismissToast = useCallback((notificationId: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  // Handle new real-time notifications
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Show toast for high priority notifications
    if ([NotificationPriority.HIGH, NotificationPriority.URGENT, NotificationPriority.CRITICAL].includes(notification.priority)) {
      showToast(notification)
    }

    // Play notification sound for urgent/critical notifications
    if ([NotificationPriority.URGENT, NotificationPriority.CRITICAL].includes(notification.priority)) {
      playNotificationSound()
    }

    // Show browser notification if supported and permitted
    if (notification.priority === NotificationPriority.CRITICAL) {
      showBrowserNotification(notification)
    }
  }, [showToast])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(console.error)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id || !user?.role) return

    let unsubscribeUser: (() => void) | undefined
    let unsubscribeRole: (() => void) | undefined

    // Subscribe to user-specific notifications
    unsubscribeUser = realtimeNotificationSystem.subscribe(user.id, handleNewNotification)

    // Subscribe to role-based notifications
    unsubscribeRole = realtimeNotificationSystem.subscribe(`role:${user.role}`, handleNewNotification)

    // Initial load
    refreshNotifications()

    // Request notification permission for critical alerts
    requestNotificationPermission()

    return () => {
      unsubscribeUser?.()
      unsubscribeRole?.()
    }
  }, [user?.id, user?.role, handleNewNotification, refreshNotifications, requestNotificationPermission])

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    showToast,
    toastNotifications,
    dismissToast
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Render toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toastNotifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => dismissToast(notification.id)}
            onAction={(actionId) => {
              console.log('Toast action:', actionId, notification)
              // Handle action based on actionId
              dismissToast(notification.id)
            }}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

// Toast notification component
function NotificationToast({ 
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

  return (
    <div className={`w-96 p-4 rounded-lg border-l-4 shadow-lg ${getPriorityColor(notification.priority)} transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{notification.title}</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
      
      {notification.actions && notification.actions.length > 0 && (
        <div className="flex gap-2">
          {notification.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                action.style === 'primary' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : action.style === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {action.label}
            </button>
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
    </div>
  )
}

// Hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}