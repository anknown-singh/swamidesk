'use client'

import { auditLogger, AuditEventType } from '@/lib/security/audit-logger'

// Notification types for healthcare workflows
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

// Notification priorities
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// Notification categories for filtering
export enum NotificationCategory {
  PATIENT_CARE = 'patient_care',
  SCHEDULING = 'scheduling',
  CLINICAL = 'clinical',
  PHARMACY = 'pharmacy',
  BILLING = 'billing',
  SYSTEM = 'system',
  EMERGENCY = 'emergency'
}

// Notification interface
export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  data?: any
  recipientId?: string
  recipientRole?: string
  departmentId?: string
  createdAt: string
  expiresAt?: string
  readAt?: string
  actionUrl?: string
  actions?: NotificationAction[]
  metadata?: any
}

// Notification actions (buttons/links)
interface NotificationAction {
  id: string
  label: string
  action: string
  url?: string
  style: 'primary' | 'secondary' | 'danger'
}

// Notification subscription preferences
interface NotificationSubscription {
  userId: string
  type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
  quietHours?: {
    start: string
    end: string
  }
}

// Notification delivery channels
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  DESKTOP = 'desktop'
}

// Real-time notification system
export class NotificationSystem {
  private static instance: NotificationSystem
  private notifications = new Map<string, Notification>()
  private subscribers = new Map<string, ((notification: Notification) => void)[]>()
  private websocket: WebSocket | null = null
  private reconnectTimer?: NodeJS.Timeout
  private heartbeatTimer?: NodeJS.Timeout
  private maxRetries = 5
  private retryCount = 0

  public static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  constructor() {
    // TODO: WebSocket endpoint '/api/notifications/ws' not implemented yet
    // Disable WebSocket connection to prevent console errors
    // this.initializeWebSocket()
    this.startCleanupTimer()
  }

  // Initialize WebSocket connection for real-time notifications
  private initializeWebSocket(): void {
    if (typeof window === 'undefined') return // Skip on server side

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/notifications/ws`

    try {
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log('🔔 Notification WebSocket connected')
        this.retryCount = 0
        this.startHeartbeat()
        
        // Send authentication if user is logged in
        const token = localStorage.getItem('auth_token')
        if (token) {
          this.websocket?.send(JSON.stringify({
            type: 'auth',
            token
          }))
        }
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.websocket.onclose = (event) => {
        console.log('🔔 Notification WebSocket disconnected:', event.code)
        this.stopHeartbeat()
        
        if (!event.wasClean && this.retryCount < this.maxRetries) {
          this.scheduleReconnect()
        }
      }

      this.websocket.onerror = (error) => {
        console.error('🔔 Notification WebSocket error:', error)
      }

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'notification':
        this.handleIncomingNotification(data.notification)
        break
      case 'notification_read':
        this.markAsRead(data.notificationId, data.userId)
        break
      case 'notification_deleted':
        this.deleteNotification(data.notificationId)
        break
      case 'pong':
        // Heartbeat response
        break
      default:
        console.warn('Unknown WebSocket message type:', data.type)
    }
  }

  // Handle incoming notification
  private handleIncomingNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification)
    this.notifySubscribers(notification.recipientId || 'all', notification)
    
    // Show browser notification for high priority items
    if (notification.priority === NotificationPriority.HIGH || 
        notification.priority === NotificationPriority.URGENT ||
        notification.priority === NotificationPriority.CRITICAL) {
      this.showBrowserNotification(notification)
    }

    // Log notification delivery
    auditLogger.log(AuditEventType.SYSTEM_ERROR, {
      eventData: {
        action: 'notification_received',
        type: notification.type,
        priority: notification.priority,
        recipientId: notification.recipientId
      }
    })
  }

  // Schedule WebSocket reconnection
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000) // Exponential backoff, max 30s
    this.retryCount++

    this.reconnectTimer = setTimeout(() => {
      console.log(`🔔 Attempting to reconnect WebSocket (attempt ${this.retryCount})`)
      this.initializeWebSocket()
    }, delay)
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Ping every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  // Create and send notification
  async createNotification(params: {
    type: NotificationType
    title: string
    message: string
    recipientId?: string
    recipientRole?: string
    departmentId?: string
    data?: any
    actionUrl?: string
    actions?: NotificationAction[]
    expiresIn?: number // milliseconds
  }): Promise<string> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      category: this.getCategoryForType(params.type),
      priority: this.getPriorityForType(params.type),
      title: params.title,
      message: params.message,
      data: params.data,
      recipientId: params.recipientId,
      recipientRole: params.recipientRole,
      departmentId: params.departmentId,
      createdAt: new Date().toISOString(),
      expiresAt: params.expiresIn ? 
        new Date(Date.now() + params.expiresIn).toISOString() : undefined,
      actionUrl: params.actionUrl,
      actions: params.actions
    }

    // Store notification
    this.notifications.set(notification.id, notification)

    // Send via WebSocket if connected
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'notification',
        notification
      }))
    }

    // Notify local subscribers
    const recipientKey = params.recipientId || 'all'
    this.notifySubscribers(recipientKey, notification)

    // Log notification creation
    await auditLogger.log(AuditEventType.SYSTEM_ERROR, {
      eventData: {
        action: 'notification_created',
        type: notification.type,
        recipientId: params.recipientId,
        priority: notification.priority
      }
    })

    return notification.id
  }

  // Get category for notification type
  private getCategoryForType(type: NotificationType): NotificationCategory {
    const categoryMap: Record<NotificationType, NotificationCategory> = {
      [NotificationType.NEW_PATIENT_REGISTRATION]: NotificationCategory.PATIENT_CARE,
      [NotificationType.PATIENT_ARRIVAL]: NotificationCategory.PATIENT_CARE,
      [NotificationType.PATIENT_WAITING]: NotificationCategory.PATIENT_CARE,
      [NotificationType.PATIENT_READY_FOR_CONSULTATION]: NotificationCategory.PATIENT_CARE,
      
      [NotificationType.APPOINTMENT_SCHEDULED]: NotificationCategory.SCHEDULING,
      [NotificationType.APPOINTMENT_REMINDER]: NotificationCategory.SCHEDULING,
      [NotificationType.APPOINTMENT_CANCELLED]: NotificationCategory.SCHEDULING,
      [NotificationType.APPOINTMENT_RESCHEDULED]: NotificationCategory.SCHEDULING,
      [NotificationType.APPOINTMENT_OVERDUE]: NotificationCategory.SCHEDULING,
      
      [NotificationType.CONSULTATION_COMPLETED]: NotificationCategory.CLINICAL,
      [NotificationType.PRESCRIPTION_READY]: NotificationCategory.CLINICAL,
      [NotificationType.LAB_RESULTS_AVAILABLE]: NotificationCategory.CLINICAL,
      [NotificationType.PROCEDURE_SCHEDULED]: NotificationCategory.CLINICAL,
      [NotificationType.PROCEDURE_COMPLETED]: NotificationCategory.CLINICAL,
      
      [NotificationType.PRESCRIPTION_DISPENSED]: NotificationCategory.PHARMACY,
      [NotificationType.MEDICATION_OUT_OF_STOCK]: NotificationCategory.PHARMACY,
      [NotificationType.MEDICATION_EXPIRING]: NotificationCategory.PHARMACY,
      [NotificationType.PRESCRIPTION_READY_FOR_PICKUP]: NotificationCategory.PHARMACY,
      
      [NotificationType.INVOICE_GENERATED]: NotificationCategory.BILLING,
      [NotificationType.PAYMENT_RECEIVED]: NotificationCategory.BILLING,
      [NotificationType.PAYMENT_OVERDUE]: NotificationCategory.BILLING,
      [NotificationType.INSURANCE_CLAIM_STATUS]: NotificationCategory.BILLING,
      
      [NotificationType.SYSTEM_MAINTENANCE]: NotificationCategory.SYSTEM,
      [NotificationType.SECURITY_ALERT]: NotificationCategory.SYSTEM,
      [NotificationType.BACKUP_COMPLETED]: NotificationCategory.SYSTEM,
      [NotificationType.UPDATE_AVAILABLE]: NotificationCategory.SYSTEM,
      
      [NotificationType.EMERGENCY_ALERT]: NotificationCategory.EMERGENCY,
      [NotificationType.CRITICAL_LAB_VALUE]: NotificationCategory.EMERGENCY,
      [NotificationType.DRUG_INTERACTION_WARNING]: NotificationCategory.EMERGENCY,
      [NotificationType.ALLERGY_ALERT]: NotificationCategory.EMERGENCY
    }

    return categoryMap[type] || NotificationCategory.SYSTEM
  }

  // Get priority for notification type
  private getPriorityForType(type: NotificationType): NotificationPriority {
    const priorityMap: Record<NotificationType, NotificationPriority> = {
      [NotificationType.EMERGENCY_ALERT]: NotificationPriority.CRITICAL,
      [NotificationType.CRITICAL_LAB_VALUE]: NotificationPriority.CRITICAL,
      [NotificationType.DRUG_INTERACTION_WARNING]: NotificationPriority.CRITICAL,
      [NotificationType.ALLERGY_ALERT]: NotificationPriority.CRITICAL,
      
      [NotificationType.SECURITY_ALERT]: NotificationPriority.URGENT,
      [NotificationType.PATIENT_READY_FOR_CONSULTATION]: NotificationPriority.URGENT,
      [NotificationType.APPOINTMENT_OVERDUE]: NotificationPriority.URGENT,
      
      [NotificationType.NEW_PATIENT_REGISTRATION]: NotificationPriority.HIGH,
      [NotificationType.PATIENT_ARRIVAL]: NotificationPriority.HIGH,
      [NotificationType.LAB_RESULTS_AVAILABLE]: NotificationPriority.HIGH,
      [NotificationType.MEDICATION_OUT_OF_STOCK]: NotificationPriority.HIGH,
      
      [NotificationType.APPOINTMENT_SCHEDULED]: NotificationPriority.NORMAL,
      [NotificationType.APPOINTMENT_CANCELLED]: NotificationPriority.NORMAL,
      [NotificationType.CONSULTATION_COMPLETED]: NotificationPriority.NORMAL,
      [NotificationType.PRESCRIPTION_READY]: NotificationPriority.NORMAL,
      [NotificationType.INVOICE_GENERATED]: NotificationPriority.NORMAL,
      
      [NotificationType.APPOINTMENT_REMINDER]: NotificationPriority.LOW,
      [NotificationType.BACKUP_COMPLETED]: NotificationPriority.LOW,
      [NotificationType.UPDATE_AVAILABLE]: NotificationPriority.LOW,
      [NotificationType.MEDICATION_EXPIRING]: NotificationPriority.LOW
    }

    return priorityMap[type] || NotificationPriority.NORMAL
  }

  // Subscribe to notifications
  subscribe(recipientId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(recipientId)) {
      this.subscribers.set(recipientId, [])
    }
    
    this.subscribers.get(recipientId)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(recipientId)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  // Notify subscribers
  private notifySubscribers(recipientId: string, notification: Notification): void {
    // Notify specific recipient
    const callbacks = this.subscribers.get(recipientId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(notification)
        } catch (error) {
          console.error('Notification callback failed:', error)
        }
      })
    }

    // Notify role-based subscribers
    if (notification.recipientRole) {
      const roleCallbacks = this.subscribers.get(`role:${notification.recipientRole}`)
      if (roleCallbacks) {
        roleCallbacks.forEach(callback => {
          try {
            callback(notification)
          } catch (error) {
            console.error('Role notification callback failed:', error)
          }
        })
      }
    }

    // Notify all subscribers
    const allCallbacks = this.subscribers.get('all')
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback(notification)
        } catch (error) {
          console.error('All notification callback failed:', error)
        }
      })
    }
  }

  // Show browser notification
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === NotificationPriority.CRITICAL,
        silent: notification.priority === NotificationPriority.LOW
      })

      browserNotification.onclick = () => {
        window.focus()
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
        browserNotification.close()
      }

      // Auto close after 10 seconds unless critical
      if (notification.priority !== NotificationPriority.CRITICAL) {
        setTimeout(() => browserNotification.close(), 10000)
      }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId)
    if (notification) {
      notification.readAt = new Date().toISOString()
      
      // Send read status via WebSocket
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'mark_read',
          notificationId,
          userId
        }))
      }

      await auditLogger.log(AuditEventType.SYSTEM_ERROR, {
        eventData: {
          action: 'notification_read',
          notificationId,
          userId
        }
      })
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId)
    
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'delete_notification',
        notificationId
      }))
    }
  }

  // Get notifications for user
  getNotifications(recipientId?: string, category?: NotificationCategory, unreadOnly = false): Notification[] {
    const now = new Date()
    
    return Array.from(this.notifications.values())
      .filter(notification => {
        // Check expiration
        if (notification.expiresAt && new Date(notification.expiresAt) < now) {
          return false
        }
        
        // Check recipient
        if (recipientId && notification.recipientId !== recipientId) {
          return false
        }
        
        // Check category
        if (category && notification.category !== category) {
          return false
        }
        
        // Check read status
        if (unreadOnly && notification.readAt) {
          return false
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = { critical: 5, urgent: 4, high: 3, normal: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }

  // Get unread count
  getUnreadCount(recipientId?: string, category?: NotificationCategory): number {
    return this.getNotifications(recipientId, category, true).length
  }

  // Clear all notifications for user
  async clearAllNotifications(recipientId: string): Promise<void> {
    const userNotifications = this.getNotifications(recipientId)
    
    for (const notification of userNotifications) {
      await this.deleteNotification(notification.id)
    }
  }

  // Start cleanup timer for expired notifications
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = new Date()
      const expiredIds: string[] = []
      
      for (const [id, notification] of this.notifications.entries()) {
        if (notification.expiresAt && new Date(notification.expiresAt) < now) {
          expiredIds.push(id)
        }
      }
      
      expiredIds.forEach(id => {
        this.notifications.delete(id)
      })
      
      if (expiredIds.length > 0) {
        console.log(`🔔 Cleaned up ${expiredIds.length} expired notifications`)
      }
    }, 60000) // Check every minute
  }

  // Cleanup resources
  cleanup(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    this.subscribers.clear()
    this.notifications.clear()
  }
}

// Healthcare-specific notification helpers
export class HealthcareNotifications {
  private static notifications = NotificationSystem.getInstance()

  // Patient workflow notifications
  static async notifyPatientArrival(patientId: string, patientName: string, doctorId: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.PATIENT_ARRIVAL,
      title: 'Patient Arrived',
      message: `${patientName} has arrived for their appointment`,
      recipientId: doctorId,
      data: { patientId, patientName },
      actionUrl: `/patients/${patientId}`,
      actions: [{
        id: 'view_patient',
        label: 'View Patient',
        action: 'navigate',
        url: `/patients/${patientId}`,
        style: 'primary'
      }]
    })
  }

  static async notifyConsultationReady(patientId: string, patientName: string, doctorId: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.PATIENT_READY_FOR_CONSULTATION,
      title: 'Patient Ready for Consultation',
      message: `${patientName} is ready for consultation`,
      recipientId: doctorId,
      data: { patientId, patientName },
      actionUrl: `/consultation/${patientId}`,
      actions: [{
        id: 'start_consultation',
        label: 'Start Consultation',
        action: 'navigate',
        url: `/consultation/${patientId}`,
        style: 'primary'
      }]
    })
  }

  static async notifyPrescriptionReady(patientId: string, patientName: string, prescriptionId: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.PRESCRIPTION_READY,
      title: 'Prescription Ready',
      message: `Prescription for ${patientName} is ready for pickup`,
      recipientRole: 'pharmacist',
      data: { patientId, patientName, prescriptionId },
      actionUrl: `/pharmacy/prescriptions/${prescriptionId}`,
      actions: [{
        id: 'dispense_medication',
        label: 'Dispense Medication',
        action: 'navigate',
        url: `/pharmacy/prescriptions/${prescriptionId}`,
        style: 'primary'
      }]
    })
  }

  // Emergency notifications
  static async notifyEmergencyAlert(message: string, departmentId?: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.EMERGENCY_ALERT,
      title: '🚨 EMERGENCY ALERT',
      message,
      recipientRole: 'all',
      departmentId,
      data: { emergency: true },
      expiresIn: 60 * 60 * 1000, // 1 hour
      actions: [{
        id: 'acknowledge',
        label: 'Acknowledge',
        action: 'acknowledge',
        style: 'danger'
      }]
    })
  }

  static async notifyCriticalLabValue(patientId: string, patientName: string, labTest: string, value: string, doctorId: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.CRITICAL_LAB_VALUE,
      title: '⚠️ Critical Lab Value',
      message: `CRITICAL: ${patientName} - ${labTest}: ${value}`,
      recipientId: doctorId,
      data: { patientId, patientName, labTest, value, critical: true },
      actionUrl: `/patients/${patientId}/lab-results`,
      actions: [{
        id: 'review_results',
        label: 'Review Results',
        action: 'navigate',
        url: `/patients/${patientId}/lab-results`,
        style: 'danger'
      }, {
        id: 'contact_patient',
        label: 'Contact Patient',
        action: 'contact',
        style: 'secondary'
      }]
    })
  }

  // Inventory notifications
  static async notifyMedicationOutOfStock(medicationName: string, currentStock: number): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.MEDICATION_OUT_OF_STOCK,
      title: 'Medication Out of Stock',
      message: `${medicationName} is out of stock (${currentStock} remaining)`,
      recipientRole: 'pharmacist',
      data: { medicationName, currentStock },
      actionUrl: '/pharmacy/inventory',
      actions: [{
        id: 'reorder',
        label: 'Reorder Now',
        action: 'reorder',
        style: 'primary'
      }, {
        id: 'view_inventory',
        label: 'View Inventory',
        action: 'navigate',
        url: '/pharmacy/inventory',
        style: 'secondary'
      }]
    })
  }

  // Appointment notifications
  static async notifyAppointmentReminder(patientId: string, patientName: string, appointmentTime: string, doctorId: string): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Upcoming Appointment',
      message: `Appointment with ${patientName} in 15 minutes`,
      recipientId: doctorId,
      data: { patientId, patientName, appointmentTime },
      actionUrl: `/appointments`,
      expiresIn: 30 * 60 * 1000, // 30 minutes
      actions: [{
        id: 'view_appointment',
        label: 'View Details',
        action: 'navigate',
        url: `/appointments/${patientId}`,
        style: 'primary'
      }]
    })
  }
}

// Export singleton instance
export const notificationSystem = NotificationSystem.getInstance()