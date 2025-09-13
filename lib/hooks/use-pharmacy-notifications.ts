'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PharmacyNotifications } from '@/lib/notifications/pharmacy-notifications'
import { 
  NotificationCategory, 
  NotificationPriority,
  NotificationType 
} from '@/lib/notifications/notification-system'
import { toast } from 'sonner'

export interface PharmacyNotification {
  id: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  data: any
  recipient_id?: string
  recipient_role?: string
  created_at: string
  read_at?: string
  action_url?: string
  actions?: Array<{
    id: string
    label: string
    action: string
    url?: string
    style: string
  }>
}

interface UsePharmacyNotificationsProps {
  pharmacistId?: string
  autoConnect?: boolean
  enableToasts?: boolean
  enableSound?: boolean
  filterCategories?: NotificationCategory[]
  minPriority?: NotificationPriority
}

interface UsePharmacyNotificationsReturn {
  notifications: PharmacyNotification[]
  unreadCount: number
  isConnected: boolean
  isLoading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
  connectRealtime: () => void
  disconnectRealtime: () => void
}

// Default filter categories - stable reference to prevent re-renders
const DEFAULT_FILTER_CATEGORIES = [NotificationCategory.PHARMACY]

export function usePharmacyNotifications({
  pharmacistId,
  autoConnect = true,
  enableToasts = true,
  enableSound = true,
  filterCategories = DEFAULT_FILTER_CATEGORIES,
  minPriority = NotificationPriority.LOW
}: UsePharmacyNotificationsProps = {}): UsePharmacyNotificationsReturn {
  
  const [notifications, setNotifications] = useState<PharmacyNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastQueueRef = useRef<Set<string>>(new Set()) // Prevent duplicate toasts
  const loadingRef = useRef(false) // Prevent concurrent API calls

  // Priority weight for filtering
  const getPriorityWeight = (priority: NotificationPriority): number => {
    switch (priority) {
      case NotificationPriority.LOW: return 1
      case NotificationPriority.NORMAL: return 2
      case NotificationPriority.HIGH: return 3
      case NotificationPriority.URGENT: return 4
      case NotificationPriority.CRITICAL: return 5
      default: return 1
    }
  }

  // Filter notifications based on criteria
  const filterNotifications = useCallback((notifications: PharmacyNotification[]): PharmacyNotification[] => {
    return notifications.filter(notification => {
      // Filter by category
      if (filterCategories.length > 0 && !filterCategories.includes(notification.category)) {
        return false
      }
      
      // Filter by minimum priority
      if (getPriorityWeight(notification.priority) < getPriorityWeight(minPriority)) {
        return false
      }
      
      return true
    })
  }, [filterCategories, minPriority])

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    // Prevent concurrent calls
    if (loadingRef.current) return
    
    try {
      loadingRef.current = true
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      // Filter by pharmacist or role
      if (pharmacistId) {
        query = query.or(`user_id.eq.${pharmacistId},recipient_role.in.(pharmacist,all)`)
      } else {
        query = query.in('recipient_role', ['pharmacist', 'all'])
      }

      // Filter by categories
      if (filterCategories.length > 0) {
        query = query.in('category', filterCategories)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('Error loading notifications:', fetchError)
        setError('Failed to load notifications')
        return
      }

      const filteredNotifications = filterNotifications(data || [])
      setNotifications(filteredNotifications)
      
      // Count unread notifications
      const unread = filteredNotifications.filter(n => !n.read_at).length
      setUnreadCount(unread)

    } catch (err) {
      console.error('Error in loadNotifications:', err)
      setError('Failed to load notifications')
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [supabase, pharmacistId, filterCategories, filterNotifications])

  // Handle new notification
  const handleNewNotification = useCallback((payload: any) => {
    const notification = payload.new as PharmacyNotification
    
    // Filter the notification
    const filtered = filterNotifications([notification])
    if (filtered.length === 0) return

    // Add to state
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev
      }
      return [notification, ...prev].slice(0, 100) // Keep only latest 100
    })

    // Update unread count
    if (!notification.read_at) {
      setUnreadCount(prev => prev + 1)
    }

    // Show toast notification
    if (enableToasts && !toastQueueRef.current.has(notification.id)) {
      toastQueueRef.current.add(notification.id)
      
      // Clean up toast queue after showing
      setTimeout(() => {
        toastQueueRef.current.delete(notification.id)
      }, 1000)

      const toastOptions: any = {
        id: notification.id,
        duration: notification.priority === NotificationPriority.CRITICAL ? 0 : 5000, // Critical toasts don't auto-dismiss
        action: notification.action_url ? {
          label: 'View',
          onClick: () => window.location.href = notification.action_url!
        } : undefined
      }

      switch (notification.priority) {
        case NotificationPriority.CRITICAL:
          toast.error(notification.title, { 
            description: notification.message,
            ...toastOptions 
          })
          break
        case NotificationPriority.URGENT:
          toast.warning(notification.title, { 
            description: notification.message,
            ...toastOptions 
          })
          break
        case NotificationPriority.HIGH:
          toast.info(notification.title, { 
            description: notification.message,
            ...toastOptions 
          })
          break
        default:
          toast(notification.title, { 
            description: notification.message,
            ...toastOptions 
          })
      }
    }

    // Play sound for high priority notifications
    if (enableSound && audioRef.current) {
      if (notification.priority === NotificationPriority.CRITICAL || 
          notification.priority === NotificationPriority.URGENT ||
          notification.priority === NotificationPriority.HIGH) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [enableToasts, enableSound, filterNotifications])

  // Handle notification updates (e.g., read status)
  const handleNotificationUpdate = useCallback((payload: any) => {
    const updatedNotification = payload.new as PharmacyNotification
    
    setNotifications(prev => 
      prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
    )

    // Update unread count
    if (updatedNotification.read_at) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  // Handle notification deletion
  const handleNotificationDelete = useCallback((payload: any) => {
    const deletedId = payload.old.id
    
    setNotifications(prev => prev.filter(n => n.id !== deletedId))
    
    // Update unread count if deleted notification was unread
    if (!payload.old.read_at) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  // Connect to realtime
  const connectRealtime = useCallback(() => {
    if (channelRef.current || isConnected) return

    try {
      // Create channel for pharmacy notifications
      const channel = supabase
        .channel('pharmacy-notifications')
        
        // Listen for new notifications
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: filterCategories.length > 0 
            ? `category=in.(${filterCategories.join(',')})` 
            : 'recipient_role=in.(pharmacist,all)'
        }, handleNewNotification)
        
        // Listen for notification updates (read status, etc.)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: filterCategories.length > 0 
            ? `category=in.(${filterCategories.join(',')})` 
            : 'recipient_role=in.(pharmacist,all)'
        }, handleNotificationUpdate)
        
        // Listen for notification deletions
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: filterCategories.length > 0 
            ? `category=in.(${filterCategories.join(',')})` 
            : 'recipient_role=in.(pharmacist,all)'
        }, handleNotificationDelete)

      // Subscribe to channel
      channel.subscribe((status) => {
        console.log('📡 Pharmacy notifications channel status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Realtime connection failed')
          setIsConnected(false)
        } else if (status === 'SUBSCRIBED') {
          setError(null)
        }
      })

      channelRef.current = channel
      
    } catch (err) {
      console.error('Error connecting to realtime:', err)
      setError('Failed to connect to realtime notifications')
    }
  }, [supabase, isConnected, filterCategories, handleNewNotification, handleNotificationUpdate, handleNotificationDelete])

  // Disconnect from realtime
  const disconnectRealtime = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setIsConnected(false)
  }, [supabase])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))

    } catch (err) {
      console.error('Error in markAsRead:', err)
    }
  }, [supabase])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      )
      
      setUnreadCount(0)

    } catch (err) {
      console.error('Error in markAllAsRead:', err)
    }
  }, [supabase, notifications])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return
      }

      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read_at)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

    } catch (err) {
      console.error('Error in deleteNotification:', err)
    }
  }, [supabase, notifications])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const notificationIds = notifications.map(n => n.id)
      
      if (notificationIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)

      if (error) {
        console.error('Error clearing notifications:', error)
        return
      }

      setNotifications([])
      setUnreadCount(0)

    } catch (err) {
      console.error('Error in clearAll:', err)
    }
  }, [supabase, notifications])

  // Refresh notifications
  const refresh = useCallback(async () => {
    await loadNotifications()
  }, [loadNotifications])

  // Initialize audio for notifications
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.3
    }
  }, [enableSound])

  // Load initial notifications and connect to realtime
  useEffect(() => {
    loadNotifications()
    
    if (autoConnect) {
      connectRealtime()
    }

    // Cleanup on unmount
    return () => {
      disconnectRealtime()
    }
  }, [autoConnect]) // Remove unstable function dependencies to prevent infinite loops

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
    connectRealtime,
    disconnectRealtime
  }
}

// Utility hook for pharmacy-specific notification triggers
export function usePharmacyNotificationTriggers() {
  const [isTriggering, setIsTriggering] = useState(false)

  const triggerLowStockCheck = useCallback(async () => {
    setIsTriggering(true)
    try {
      await PharmacyNotifications.checkAndNotifyLowStock()
      toast.success('Stock levels checked successfully')
    } catch (error) {
      console.error('Error checking stock:', error)
      toast.error('Failed to check stock levels')
    } finally {
      setIsTriggering(false)
    }
  }, [])

  const triggerExpiryCheck = useCallback(async () => {
    setIsTriggering(true)
    try {
      await PharmacyNotifications.checkAndNotifyExpiringMedications()
      toast.success('Expiry dates checked successfully')
    } catch (error) {
      console.error('Error checking expiry:', error)
      toast.error('Failed to check expiry dates')
    } finally {
      setIsTriggering(false)
    }
  }, [])

  return {
    triggerLowStockCheck,
    triggerExpiryCheck,
    isTriggering
  }
}