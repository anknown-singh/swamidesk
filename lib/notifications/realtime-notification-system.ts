'use client'

import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

// Enhanced notification types for healthcare workflows
export enum NotificationType {
  // Patient notifications
  NEW_PATIENT_REGISTRATION = 'new_patient_registration',
  PATIENT_ARRIVAL = 'patient_arrival',
  PATIENT_WAITING = 'patient_waiting',
  PATIENT_READY_FOR_CONSULTATION = 'patient_ready_for_consultation',
  
  // Appointment notifications
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_OVERDUE = 'appointment_overdue',
  
  // Medical workflow notifications
  CONSULTATION_COMPLETED = 'consultation_completed',
  PRESCRIPTION_READY = 'prescription_ready',
  LAB_RESULTS_AVAILABLE = 'lab_results_available',
  PROCEDURE_SCHEDULED = 'procedure_scheduled',
  PROCEDURE_COMPLETED = 'procedure_completed',
  
  // Pharmacy notifications
  PRESCRIPTION_DISPENSED = 'prescription_dispensed',
  MEDICATION_OUT_OF_STOCK = 'medication_out_of_stock',
  MEDICATION_EXPIRING = 'medication_expiring',
  PRESCRIPTION_READY_FOR_PICKUP = 'prescription_ready_for_pickup',
  
  // Billing notifications
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  INSURANCE_CLAIM_STATUS = 'insurance_claim_status',
  
  // System notifications
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
  BACKUP_COMPLETED = 'backup_completed',
  UPDATE_AVAILABLE = 'update_available',
  
  // Emergency notifications
  EMERGENCY_ALERT = 'emergency_alert',
  CRITICAL_LAB_VALUE = 'critical_lab_value',
  DRUG_INTERACTION_WARNING = 'drug_interaction_warning',
  ALLERGY_ALERT = 'allergy_alert'
}

export enum NotificationCategory {
  PATIENT_CARE = 'patient_care',
  SCHEDULING = 'scheduling',
  CLINICAL = 'clinical',
  PHARMACY = 'pharmacy',
  BILLING = 'billing',
  SYSTEM = 'system',
  EMERGENCY = 'emergency'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface NotificationAction {
  id: string
  label: string
  action: string
  url?: string
  style: 'primary' | 'secondary' | 'danger'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  user_id?: string
  role?: string
  data?: Record<string, any>
  action_url?: string
  actions?: NotificationAction[]
  is_read: boolean
  read_at?: string
  read_by?: string
  created_at: string
  updated_at: string
  expires_at?: string
}

// Role-based notification configuration
const ROLE_NOTIFICATION_TYPES = {
  doctor: [
    NotificationType.PATIENT_ARRIVAL,
    NotificationType.PATIENT_READY_FOR_CONSULTATION,
    NotificationType.LAB_RESULTS_AVAILABLE,
    NotificationType.CRITICAL_LAB_VALUE,
    NotificationType.DRUG_INTERACTION_WARNING,
    NotificationType.ALLERGY_ALERT,
    NotificationType.APPOINTMENT_SCHEDULED,
    NotificationType.APPOINTMENT_CANCELLED,
    NotificationType.EMERGENCY_ALERT
  ],
  receptionist: [
    NotificationType.NEW_PATIENT_REGISTRATION,
    NotificationType.APPOINTMENT_SCHEDULED,
    NotificationType.APPOINTMENT_CANCELLED,
    NotificationType.APPOINTMENT_RESCHEDULED,
    NotificationType.PAYMENT_RECEIVED,
    NotificationType.PAYMENT_OVERDUE,
    NotificationType.PATIENT_ARRIVAL
  ],
  pharmacist: [
    NotificationType.PRESCRIPTION_READY,
    NotificationType.MEDICATION_OUT_OF_STOCK,
    NotificationType.MEDICATION_EXPIRING,
    NotificationType.PRESCRIPTION_DISPENSED,
    NotificationType.PRESCRIPTION_READY_FOR_PICKUP
  ],
  admin: [
    NotificationType.SYSTEM_MAINTENANCE,
    NotificationType.SECURITY_ALERT,
    NotificationType.BACKUP_COMPLETED,
    NotificationType.UPDATE_AVAILABLE,
    NotificationType.PAYMENT_RECEIVED,
    NotificationType.MEDICATION_OUT_OF_STOCK
  ],
  attendant: [
    NotificationType.PROCEDURE_SCHEDULED,
    NotificationType.PROCEDURE_COMPLETED,
    NotificationType.PATIENT_WAITING,
    NotificationType.APPOINTMENT_SCHEDULED
  ]
}

class RealtimeNotificationSystem {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map()

  // Subscribe to real-time notifications for a user or role
  subscribe(target: string, callback: (notification: Notification) => void): () => void {
    const channelName = target.startsWith('role:') ? target : `user:${target}`
    
    // Add callback to subscribers
    if (!this.subscribers.has(channelName)) {
      this.subscribers.set(channelName, new Set())
    }
    this.subscribers.get(channelName)!.add(callback)

    // Create or get existing channel
    if (!this.channels.has(channelName)) {
      this.createChannel(channelName)
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(channelName)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          // Remove channel if no more subscribers
          this.removeChannel(channelName)
        }
      }
    }
  }

  private createChannel(channelName: string) {
    const isRoleChannel = channelName.startsWith('role:')
    const targetValue = channelName.replace(/^(user:|role:)/, '')

    const channel = this.supabase
      .channel(`notifications-${channelName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: isRoleChannel ? `role=eq.${targetValue}` : `user_id=eq.${targetValue}`
        },
        (payload) => {
          const notification = payload.new as Notification
          this.notifySubscribers(channelName, notification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: isRoleChannel ? `role=eq.${targetValue}` : `user_id=eq.${targetValue}`
        },
        (payload) => {
          const notification = payload.new as Notification
          this.notifySubscribers(channelName, notification)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
  }

  private removeChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      this.subscribers.delete(channelName)
    }
  }

  private notifySubscribers(channelName: string, notification: Notification) {
    const subscribers = this.subscribers.get(channelName)
    if (subscribers) {
      subscribers.forEach(callback => callback(notification))
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},role.eq.${await this.getUserRole(userId)}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const userRole = await this.getUserRole(userId)
    
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},role.eq.${userRole}`)
      .eq('is_read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }

    return count || 0
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: userId
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    const userRole = await this.getUserRole(userId)
    
    const { error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: userId
      })
      .or(`user_id.eq.${userId},role.eq.${userRole}`)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'is_read'>): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data?.id || null
  }

  // Create role-based notification
  async createRoleNotification(
    role: string, 
    title: string, 
    message: string, 
    type: NotificationType,
    category: NotificationCategory,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    options?: {
      data?: Record<string, any>
      action_url?: string
      actions?: NotificationAction[]
      expires_at?: string
    }
  ): Promise<string | null> {
    return this.createNotification({
      title,
      message,
      type,
      category,
      priority,
      role,
      ...options
    })
  }

  // Create user-specific notification
  async createUserNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    category: NotificationCategory,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    options?: {
      data?: Record<string, any>
      action_url?: string
      actions?: NotificationAction[]
      expires_at?: string
    }
  ): Promise<string | null> {
    return this.createNotification({
      title,
      message,
      type,
      category,
      priority,
      user_id: userId,
      ...options
    })
  }

  // Helper to get user role
  private async getUserRole(userId: string): Promise<string> {
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    return user?.role || 'user'
  }

  // Cleanup: remove all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.subscribers.clear()
  }

  // Healthcare-specific notification helpers
  async notifyPatientArrival(patientId: string, patientName: string, doctorId?: string): Promise<void> {
    // Notify reception
    await this.createRoleNotification(
      'receptionist',
      'Patient Arrived',
      `${patientName} has arrived for their appointment`,
      NotificationType.PATIENT_ARRIVAL,
      NotificationCategory.PATIENT_CARE,
      NotificationPriority.NORMAL,
      {
        data: { patient_id: patientId },
        action_url: `/patients/${patientId}`
      }
    )

    // Notify assigned doctor if specified
    if (doctorId) {
      await this.createUserNotification(
        doctorId,
        'Patient Arrived',
        `${patientName} is ready for consultation`,
        NotificationType.PATIENT_READY_FOR_CONSULTATION,
        NotificationCategory.PATIENT_CARE,
        NotificationPriority.HIGH,
        {
          data: { patient_id: patientId },
          action_url: `/doctor/consultations/${patientId}`,
          actions: [
            {
              id: 'start_consultation',
              label: 'Start Consultation',
              action: 'navigate',
              url: `/doctor/consultations/${patientId}`,
              style: 'primary'
            }
          ]
        }
      )
    }
  }

  async notifyLowInventory(medicineName: string, currentStock: number, minimumStock: number): Promise<void> {
    await this.createRoleNotification(
      'pharmacist',
      'Low Stock Alert',
      `${medicineName} is running low: ${currentStock} units left (minimum: ${minimumStock})`,
      NotificationType.MEDICATION_OUT_OF_STOCK,
      NotificationCategory.PHARMACY,
      NotificationPriority.HIGH,
      {
        data: { medicine_name: medicineName, current_stock: currentStock, minimum_stock: minimumStock },
        action_url: '/pharmacy/inventory',
        actions: [
          {
            id: 'reorder',
            label: 'Reorder Now',
            action: 'navigate',
            url: '/pharmacy/inventory?reorder=true',
            style: 'primary'
          }
        ]
      }
    )

    // Also notify admin
    await this.createRoleNotification(
      'admin',
      'Inventory Alert',
      `${medicineName} needs restocking (${currentStock}/${minimumStock})`,
      NotificationType.MEDICATION_OUT_OF_STOCK,
      NotificationCategory.PHARMACY,
      NotificationPriority.NORMAL,
      {
        data: { medicine_name: medicineName, current_stock: currentStock },
        action_url: '/admin/inventory'
      }
    )
  }

  async notifyEmergency(title: string, message: string, data?: Record<string, any>): Promise<void> {
    // Notify all doctors and admin
    const roles = ['doctor', 'admin']
    
    for (const role of roles) {
      await this.createRoleNotification(
        role,
        title,
        message,
        NotificationType.EMERGENCY_ALERT,
        NotificationCategory.EMERGENCY,
        NotificationPriority.CRITICAL,
        {
          data,
          actions: [
            {
              id: 'acknowledge',
              label: 'Acknowledge',
              action: 'acknowledge',
              style: 'primary'
            }
          ]
        }
      )
    }
  }
}

// Export singleton instance
export const realtimeNotificationSystem = new RealtimeNotificationSystem()
export default realtimeNotificationSystem