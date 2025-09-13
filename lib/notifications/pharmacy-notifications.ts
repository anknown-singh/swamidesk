'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  NotificationSystem,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  HealthcareNotifications
} from './notification-system'

export interface PharmacyNotificationData {
  prescriptionId?: string
  medicineId?: string
  medicineName?: string
  patientId?: string
  patientName?: string
  purchaseOrderId?: string
  stockLevel?: number
  minimumLevel?: number
  expiryDate?: string
  supplierName?: string
  batchNumber?: string
  amount?: number
}

export class PharmacyNotifications {
  private static notifications = NotificationSystem.getInstance()
  private static supabase = createClient()

  // ==========================================
  // HIGH PRIORITY NOTIFICATIONS
  // ==========================================

  /**
   * Notify pharmacist when new prescription is ready for dispensing
   */
  static async notifyNewPrescriptionReady(data: {
    prescriptionId: string
    patientName: string
    doctorName: string
    medicineCount: number
    priority?: boolean
  }): Promise<string> {
    const priority = data.priority ? NotificationPriority.URGENT : NotificationPriority.HIGH

    return await this.notifications.createNotification({
      type: NotificationType.PRESCRIPTION_READY,
      title: data.priority ? '🚨 Priority Prescription Ready' : '💊 New Prescription Ready',
      message: `Prescription for ${data.patientName} is ready for dispensing (${data.medicineCount} medicines)`,
      recipientRole: 'pharmacist',
      data: {
        prescriptionId: data.prescriptionId,
        patientName: data.patientName,
        doctorName: data.doctorName,
        medicineCount: data.medicineCount,
        priority: data.priority
      },
      actionUrl: `/pharmacy/prescriptions/${data.prescriptionId}/dispense`,
      actions: [
        {
          id: 'dispense_now',
          label: 'Dispense Now',
          action: 'navigate',
          url: `/pharmacy/prescriptions/${data.prescriptionId}/dispense`,
          style: 'primary'
        },
        {
          id: 'view_prescription',
          label: 'View Details',
          action: 'navigate',
          url: `/pharmacy/prescriptions/${data.prescriptionId}`,
          style: 'secondary'
        }
      ]
    })
  }

  /**
   * Alert pharmacist when medication stock is low
   */
  static async notifyLowStock(data: {
    medicineId: string
    medicineName: string
    currentStock: number
    minimumLevel: number
    isCritical?: boolean
  }): Promise<string> {
    const isCritical = data.isCritical || data.currentStock === 0
    const priority = isCritical ? NotificationPriority.CRITICAL : NotificationPriority.HIGH
    
    const title = isCritical 
      ? `🚨 ${data.medicineName} - OUT OF STOCK`
      : `⚠️ ${data.medicineName} - Low Stock`
    
    const message = isCritical
      ? `${data.medicineName} is completely out of stock! Reorder immediately.`
      : `${data.medicineName} is running low (${data.currentStock} remaining, minimum: ${data.minimumLevel})`

    return await this.notifications.createNotification({
      type: NotificationType.MEDICATION_OUT_OF_STOCK,
      title,
      message,
      recipientRole: 'pharmacist',
      data: {
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        currentStock: data.currentStock,
        minimumLevel: data.minimumLevel,
        isCritical
      },
      actionUrl: '/pharmacy/inventory',
      actions: [
        {
          id: 'create_purchase_order',
          label: 'Create Purchase Order',
          action: 'navigate',
          url: `/pharmacy/purchase-orders/create?medicine=${data.medicineId}`,
          style: 'primary'
        },
        {
          id: 'view_inventory',
          label: 'View Inventory',
          action: 'navigate',
          url: `/pharmacy/inventory?search=${encodeURIComponent(data.medicineName)}`,
          style: 'secondary'
        }
      ],
      expiresIn: isCritical ? undefined : 24 * 60 * 60 * 1000 // Critical alerts don't expire
    })
  }

  /**
   * Alert about medications expiring soon
   */
  static async notifyMedicationExpiring(data: {
    medicineId: string
    medicineName: string
    expiryDate: string
    daysUntilExpiry: number
    batchNumber?: string
    quantity?: number
  }): Promise<string> {
    const { daysUntilExpiry } = data
    let priority = NotificationPriority.LOW
    let title = `📅 ${data.medicineName} expires in ${daysUntilExpiry} days`

    if (daysUntilExpiry <= 7) {
      priority = NotificationPriority.URGENT
      title = `🚨 ${data.medicineName} expires in ${daysUntilExpiry} days`
    } else if (daysUntilExpiry <= 30) {
      priority = NotificationPriority.HIGH
      title = `⚠️ ${data.medicineName} expires in ${daysUntilExpiry} days`
    }

    const message = `${data.medicineName}${data.batchNumber ? ` (Batch: ${data.batchNumber})` : ''} expires on ${new Date(data.expiryDate).toLocaleDateString()}${data.quantity ? `. Quantity: ${data.quantity}` : ''}`

    return await this.notifications.createNotification({
      type: NotificationType.MEDICATION_EXPIRING,
      title,
      message,
      recipientRole: 'pharmacist',
      data: {
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        expiryDate: data.expiryDate,
        daysUntilExpiry,
        batchNumber: data.batchNumber,
        quantity: data.quantity
      },
      actionUrl: '/pharmacy/inventory',
      actions: [
        {
          id: 'mark_for_disposal',
          label: 'Mark for Disposal',
          action: 'mark_disposal',
          style: 'danger'
        },
        {
          id: 'view_medicine',
          label: 'View Details',
          action: 'navigate',
          url: `/pharmacy/medicines/${data.medicineId}`,
          style: 'secondary'
        }
      ]
    })
  }

  /**
   * Notify about purchase order status changes
   */
  static async notifyPurchaseOrderStatus(data: {
    purchaseOrderId: string
    orderNumber: string
    supplierName: string
    status: 'confirmed' | 'shipped' | 'delivered' | 'delayed' | 'cancelled'
    totalAmount?: number
    estimatedDelivery?: string
    delayReason?: string
  }): Promise<string> {
    let title: string
    let message: string
    let priority = NotificationPriority.NORMAL

    switch (data.status) {
      case 'confirmed':
        title = `✅ Purchase Order ${data.orderNumber} Confirmed`
        message = `${data.supplierName} confirmed your order${data.estimatedDelivery ? `. Expected delivery: ${data.estimatedDelivery}` : ''}`
        break
      case 'shipped':
        title = `🚚 Purchase Order ${data.orderNumber} Shipped`
        message = `Your order from ${data.supplierName} has been shipped${data.estimatedDelivery ? `. Expected delivery: ${data.estimatedDelivery}` : ''}`
        priority = NotificationPriority.HIGH
        break
      case 'delivered':
        title = `📦 Purchase Order ${data.orderNumber} Delivered`
        message = `Your order from ${data.supplierName} has been delivered. Please verify and update inventory.`
        priority = NotificationPriority.HIGH
        break
      case 'delayed':
        title = `⏰ Purchase Order ${data.orderNumber} Delayed`
        message = `Your order from ${data.supplierName} has been delayed${data.delayReason ? `: ${data.delayReason}` : ''}`
        priority = NotificationPriority.HIGH
        break
      case 'cancelled':
        title = `❌ Purchase Order ${data.orderNumber} Cancelled`
        message = `Your order from ${data.supplierName} has been cancelled${data.delayReason ? `: ${data.delayReason}` : ''}`
        priority = NotificationPriority.URGENT
        break
      default:
        title = `📋 Purchase Order ${data.orderNumber} Updated`
        message = `Status update for your order from ${data.supplierName}`
    }

    return await this.notifications.createNotification({
      type: NotificationType.PRESCRIPTION_READY, // We'll add a new type for PO updates
      title,
      message,
      recipientRole: 'pharmacist',
      data: {
        purchaseOrderId: data.purchaseOrderId,
        orderNumber: data.orderNumber,
        supplierName: data.supplierName,
        status: data.status,
        totalAmount: data.totalAmount
      },
      actionUrl: `/pharmacy/purchase-orders`,
      actions: [
        {
          id: 'view_order',
          label: 'View Order',
          action: 'navigate',
          url: `/pharmacy/purchase-orders/${data.purchaseOrderId}`,
          style: 'primary'
        },
        ...(data.status === 'delivered' ? [{
          id: 'update_inventory',
          label: 'Update Inventory',
          action: 'navigate',
          url: `/pharmacy/inventory?po=${data.purchaseOrderId}`,
          style: 'secondary'
        }] : [])
      ]
    })
  }

  /**
   * Alert about critical drug interactions during dispensing
   */
  static async notifyDrugInteraction(data: {
    prescriptionId: string
    patientName: string
    interactingMedicines: string[]
    interactionSeverity: 'mild' | 'moderate' | 'severe'
    interactionDescription: string
  }): Promise<string> {
    const priority = data.interactionSeverity === 'severe' 
      ? NotificationPriority.CRITICAL 
      : data.interactionSeverity === 'moderate' 
        ? NotificationPriority.URGENT 
        : NotificationPriority.HIGH

    const severityEmoji = data.interactionSeverity === 'severe' ? '🚨' : 
                         data.interactionSeverity === 'moderate' ? '⚠️' : '💊'

    return await this.notifications.createNotification({
      type: NotificationType.DRUG_INTERACTION_WARNING,
      title: `${severityEmoji} Drug Interaction Alert - ${data.patientName}`,
      message: `${data.interactionSeverity.toUpperCase()} interaction detected: ${data.interactingMedicines.join(' + ')}. ${data.interactionDescription}`,
      recipientRole: 'pharmacist',
      data: {
        prescriptionId: data.prescriptionId,
        patientName: data.patientName,
        interactingMedicines: data.interactingMedicines,
        interactionSeverity: data.interactionSeverity,
        interactionDescription: data.interactionDescription
      },
      actionUrl: `/pharmacy/prescriptions/${data.prescriptionId}/dispense`,
      actions: [
        {
          id: 'review_prescription',
          label: 'Review Prescription',
          action: 'navigate',
          url: `/pharmacy/prescriptions/${data.prescriptionId}/dispense`,
          style: 'danger'
        },
        {
          id: 'contact_doctor',
          label: 'Contact Doctor',
          action: 'contact_doctor',
          style: 'secondary'
        }
      ],
      expiresIn: undefined // Critical interactions don't expire
    })
  }

  // ==========================================
  // MEDIUM PRIORITY NOTIFICATIONS
  // ==========================================

  /**
   * Remind about prescription pickup
   */
  static async notifyPrescriptionPickupReminder(data: {
    prescriptionId: string
    patientName: string
    patientPhone?: string
    daysSinceReady: number
    medicineNames: string[]
  }): Promise<string> {
    const priority = data.daysSinceReady > 7 ? NotificationPriority.HIGH : NotificationPriority.NORMAL
    
    return await this.notifications.createNotification({
      type: NotificationType.PRESCRIPTION_READY_FOR_PICKUP,
      title: `📞 Prescription Pickup Reminder - ${data.patientName}`,
      message: `Prescription ready for pickup for ${data.daysSinceReady} days. Medicines: ${data.medicineNames.slice(0, 2).join(', ')}${data.medicineNames.length > 2 ? ` +${data.medicineNames.length - 2} more` : ''}`,
      recipientRole: 'pharmacist',
      data: {
        prescriptionId: data.prescriptionId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        daysSinceReady: data.daysSinceReady,
        medicineNames: data.medicineNames
      },
      actionUrl: `/pharmacy/prescriptions/${data.prescriptionId}`,
      actions: [
        {
          id: 'call_patient',
          label: 'Call Patient',
          action: 'call_patient',
          style: 'primary'
        },
        {
          id: 'mark_contacted',
          label: 'Mark as Contacted',
          action: 'mark_contacted',
          style: 'secondary'
        }
      ]
    })
  }

  /**
   * High-value transaction alert
   */
  static async notifyHighValueTransaction(data: {
    transactionType: 'sale' | 'purchase'
    orderId: string
    amount: number
    threshold: number
    customerName?: string
    supplierName?: string
    medicineNames: string[]
  }): Promise<string> {
    const isSupplier = data.transactionType === 'purchase'
    const entityName = isSupplier ? data.supplierName : data.customerName
    const emoji = isSupplier ? '📦' : '💰'
    
    return await this.notifications.createNotification({
      type: NotificationType.PAYMENT_RECEIVED, // We'll use this for high-value alerts
      title: `${emoji} High-Value ${data.transactionType === 'purchase' ? 'Purchase' : 'Sale'} - ₹${data.amount.toLocaleString()}`,
      message: `${data.transactionType === 'purchase' ? 'Purchase from' : 'Sale to'} ${entityName}: ₹${data.amount.toLocaleString()} (above threshold: ₹${data.threshold.toLocaleString()})`,
      recipientRole: 'pharmacist',
      data: {
        transactionType: data.transactionType,
        orderId: data.orderId,
        amount: data.amount,
        threshold: data.threshold,
        entityName,
        medicineNames: data.medicineNames
      },
      actionUrl: data.transactionType === 'purchase' 
        ? `/pharmacy/purchase-orders/${data.orderId}`
        : `/pharmacy/sell-orders/${data.orderId}`,
      actions: [
        {
          id: 'view_transaction',
          label: 'View Details',
          action: 'navigate',
          url: data.transactionType === 'purchase' 
            ? `/pharmacy/purchase-orders/${data.orderId}`
            : `/pharmacy/sell-orders/${data.orderId}`,
          style: 'primary'
        }
      ]
    })
  }

  // ==========================================
  // LOW PRIORITY NOTIFICATIONS
  // ==========================================

  /**
   * Daily sales summary notification
   */
  static async notifyDailySalesSummary(data: {
    date: string
    totalSales: number
    totalOrders: number
    topSellingMedicines: Array<{name: string, quantity: number}>
    lowStockAlerts: number
  }): Promise<string> {
    return await this.notifications.createNotification({
      type: NotificationType.PAYMENT_RECEIVED, // Using existing type for summary
      title: `📊 Daily Sales Summary - ${new Date(data.date).toLocaleDateString()}`,
      message: `Sales: ₹${data.totalSales.toLocaleString()} | Orders: ${data.totalOrders} | Stock Alerts: ${data.lowStockAlerts}`,
      recipientRole: 'pharmacist',
      data: {
        date: data.date,
        totalSales: data.totalSales,
        totalOrders: data.totalOrders,
        topSellingMedicines: data.topSellingMedicines,
        lowStockAlerts: data.lowStockAlerts
      },
      actionUrl: '/pharmacy/dashboard',
      actions: [
        {
          id: 'view_dashboard',
          label: 'View Dashboard',
          action: 'navigate',
          url: '/pharmacy/dashboard',
          style: 'primary'
        },
        {
          id: 'view_reports',
          label: 'View Reports',
          action: 'navigate',
          url: '/pharmacy/reports',
          style: 'secondary'
        }
      ],
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check and notify about low stock items
   */
  static async checkAndNotifyLowStock(): Promise<void> {
    try {
      const { data: lowStockItems, error } = await this.supabase
        .from('medicines')
        .select('id, name, stock_quantity, minimum_stock')
        .lt('stock_quantity', this.supabase.raw('minimum_stock'))
        .eq('is_active', true)

      if (error) {
        console.error('Error checking low stock:', error)
        return
      }

      for (const item of lowStockItems || []) {
        await this.notifyLowStock({
          medicineId: item.id,
          medicineName: item.name,
          currentStock: item.stock_quantity,
          minimumLevel: item.minimum_stock,
          isCritical: item.stock_quantity === 0
        })
      }
    } catch (error) {
      console.error('Error in checkAndNotifyLowStock:', error)
    }
  }

  /**
   * Check and notify about expiring medications
   */
  static async checkAndNotifyExpiringMedications(): Promise<void> {
    try {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data: expiringItems, error } = await this.supabase
        .from('medicines')
        .select('id, name, expiry_date, batch_number, stock_quantity')
        .lt('expiry_date', thirtyDaysFromNow.toISOString())
        .eq('is_active', true)
        .gt('stock_quantity', 0)

      if (error) {
        console.error('Error checking expiring medications:', error)
        return
      }

      for (const item of expiringItems || []) {
        const expiryDate = new Date(item.expiry_date)
        const today = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry >= 0) { // Only notify for future expiries
          await this.notifyMedicationExpiring({
            medicineId: item.id,
            medicineName: item.name,
            expiryDate: item.expiry_date,
            daysUntilExpiry,
            batchNumber: item.batch_number,
            quantity: item.stock_quantity
          })
        }
      }
    } catch (error) {
      console.error('Error in checkAndNotifyExpiringMedications:', error)
    }
  }

  /**
   * Get pharmacy notifications for a specific pharmacist
   */
  static async getPharmacyNotifications(pharmacistId?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('category', NotificationCategory.PHARMACY)
        .order('created_at', { ascending: false })
        .limit(50)

      if (pharmacistId) {
        query = query.or(`recipient_id.eq.${pharmacistId},recipient_role.eq.pharmacist`)
      } else {
        query = query.eq('recipient_role', 'pharmacist')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching pharmacy notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPharmacyNotifications:', error)
      return []
    }
  }
}

// Export singleton instance
export const pharmacyNotifications = PharmacyNotifications