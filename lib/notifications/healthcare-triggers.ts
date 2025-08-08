import { createClient } from '@/lib/supabase/client'
import {
  realtimeNotificationSystem,
  NotificationType,
  NotificationCategory,
  NotificationPriority
} from '@/lib/notifications/realtime-notification-system'

// Healthcare notification triggers - these can be called from client or server

export class HealthcareNotificationTriggers {
  
  // Patient workflow notifications
  static async notifyPatientRegistration(patientId: string, patientName: string) {
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'New Patient Registered',
      `${patientName} has been registered in the system`,
      NotificationType.NEW_PATIENT_REGISTRATION,
      NotificationCategory.PATIENT_CARE,
      NotificationPriority.NORMAL,
      {
        data: { patient_id: patientId, patient_name: patientName },
        action_url: `/patients/${patientId}`,
        actions: [
          {
            id: 'view_patient',
            label: 'View Patient',
            action: 'navigate',
            url: `/patients/${patientId}`,
            style: 'primary' as const
          }
        ]
      }
    )
  }

  static async notifyPatientArrival(patientId: string, patientName: string, appointmentId?: string, doctorId?: string) {
    // Notify reception
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'Patient Arrived',
      `${patientName} has arrived for their appointment`,
      NotificationType.PATIENT_ARRIVAL,
      NotificationCategory.PATIENT_CARE,
      NotificationPriority.HIGH,
      {
        data: { patient_id: patientId, appointment_id: appointmentId },
        action_url: `/receptionist/queue`,
        actions: [
          {
            id: 'check_in',
            label: 'Check In',
            action: 'check_in',
            style: 'primary' as const
          }
        ]
      }
    )

    // Notify assigned doctor if specified
    if (doctorId) {
      await realtimeNotificationSystem.createUserNotification(
        doctorId,
        'Patient Ready',
        `${patientName} is ready for consultation`,
        NotificationType.PATIENT_READY_FOR_CONSULTATION,
        NotificationCategory.PATIENT_CARE,
        NotificationPriority.HIGH,
        {
          data: { patient_id: patientId, appointment_id: appointmentId },
          action_url: `/doctor/consultations?patient=${patientId}`,
          actions: [
            {
              id: 'start_consultation',
              label: 'Start Consultation',
              action: 'navigate',
              url: `/doctor/consultations?patient=${patientId}`,
              style: 'primary' as const
            }
          ]
        }
      )
    }
  }

  // Appointment notifications
  static async notifyAppointmentScheduled(appointmentId: string, patientName: string, doctorId: string, appointmentTime: string) {
    // Notify doctor
    await realtimeNotificationSystem.createUserNotification(
      doctorId,
      'New Appointment Scheduled',
      `Appointment with ${patientName} scheduled for ${new Date(appointmentTime).toLocaleDateString()}`,
      NotificationType.APPOINTMENT_SCHEDULED,
      NotificationCategory.SCHEDULING,
      NotificationPriority.NORMAL,
      {
        data: { appointment_id: appointmentId, patient_name: patientName },
        action_url: `/doctor/calendar?appointment=${appointmentId}`,
        actions: [
          {
            id: 'view_appointment',
            label: 'View Calendar',
            action: 'navigate',
            url: `/doctor/calendar`,
            style: 'primary' as const
          }
        ]
      }
    )

    // Notify reception
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'Appointment Confirmed',
      `Appointment scheduled for ${patientName}`,
      NotificationType.APPOINTMENT_SCHEDULED,
      NotificationCategory.SCHEDULING,
      NotificationPriority.NORMAL,
      {
        data: { appointment_id: appointmentId },
        action_url: `/receptionist/appointments`
      }
    )
  }

  static async notifyAppointmentCancellation(appointmentId: string, patientName: string, doctorId: string, reason?: string) {
    const message = `Appointment with ${patientName} has been cancelled${reason ? `: ${reason}` : ''}`

    // Notify doctor
    await realtimeNotificationSystem.createUserNotification(
      doctorId,
      'Appointment Cancelled',
      message,
      NotificationType.APPOINTMENT_CANCELLED,
      NotificationCategory.SCHEDULING,
      NotificationPriority.HIGH,
      {
        data: { appointment_id: appointmentId, reason },
        action_url: `/doctor/calendar`
      }
    )

    // Notify reception
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'Appointment Cancelled',
      message,
      NotificationType.APPOINTMENT_CANCELLED,
      NotificationCategory.SCHEDULING,
      NotificationPriority.NORMAL,
      {
        data: { appointment_id: appointmentId, reason }
      }
    )
  }

  // Clinical notifications
  static async notifyLabResultsReady(patientId: string, patientName: string, doctorId: string, testType: string) {
    await realtimeNotificationSystem.createUserNotification(
      doctorId,
      'Lab Results Available',
      `${testType} results ready for ${patientName}`,
      NotificationType.LAB_RESULTS_AVAILABLE,
      NotificationCategory.CLINICAL,
      NotificationPriority.HIGH,
      {
        data: { patient_id: patientId, test_type: testType },
        action_url: `/doctor/patients/${patientId}/lab-results`,
        actions: [
          {
            id: 'view_results',
            label: 'View Results',
            action: 'navigate',
            url: `/doctor/patients/${patientId}/lab-results`,
            style: 'primary' as const
          }
        ]
      }
    )
  }

  static async notifyCriticalLabValue(patientId: string, patientName: string, testName: string, value: string, doctorId?: string) {
    const message = `CRITICAL: ${testName} = ${value} for ${patientName}`

    if (doctorId) {
      // Notify specific doctor
      await realtimeNotificationSystem.createUserNotification(
        doctorId,
        'CRITICAL Lab Value',
        message,
        NotificationType.CRITICAL_LAB_VALUE,
        NotificationCategory.EMERGENCY,
        NotificationPriority.CRITICAL,
        {
          data: { patient_id: patientId, test_name: testName, value },
          action_url: `/doctor/patients/${patientId}`,
          actions: [
            {
              id: 'review_patient',
              label: 'Review Patient',
              action: 'navigate',
              url: `/doctor/patients/${patientId}`,
              style: 'danger' as const
            }
          ]
        }
      )
    } else {
      // Notify all doctors
      await realtimeNotificationSystem.createRoleNotification(
        'doctor',
        'CRITICAL Lab Value',
        message,
        NotificationType.CRITICAL_LAB_VALUE,
        NotificationCategory.EMERGENCY,
        NotificationPriority.CRITICAL,
        {
          data: { patient_id: patientId, test_name: testName, value },
          action_url: `/doctor/patients/${patientId}`
        }
      )
    }
  }

  // Pharmacy notifications
  static async notifyPrescriptionReady(prescriptionId: string, patientName: string, medicationNames: string[]) {
    // Notify pharmacist
    await realtimeNotificationSystem.createRoleNotification(
      'pharmacist',
      'New Prescription',
      `Prescription ready for dispensing: ${patientName}`,
      NotificationType.PRESCRIPTION_READY,
      NotificationCategory.PHARMACY,
      NotificationPriority.NORMAL,
      {
        data: { prescription_id: prescriptionId, medications: medicationNames },
        action_url: `/pharmacy/prescriptions/${prescriptionId}`,
        actions: [
          {
            id: 'dispense',
            label: 'Dispense',
            action: 'navigate',
            url: `/pharmacy/prescriptions/${prescriptionId}`,
            style: 'primary' as const
          }
        ]
      }
    )

    // Notify reception for patient notification
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'Prescription Ready',
      `Prescription ready for pickup: ${patientName}`,
      NotificationType.PRESCRIPTION_READY_FOR_PICKUP,
      NotificationCategory.PHARMACY,
      NotificationPriority.NORMAL,
      {
        data: { prescription_id: prescriptionId, patient_name: patientName },
        actions: [
          {
            id: 'notify_patient',
            label: 'Notify Patient',
            action: 'notify_patient',
            style: 'primary' as const
          }
        ]
      }
    )
  }

  static async notifyLowInventory(medicineId: string, medicineName: string, currentStock: number, minimumStock: number) {
    // Notify pharmacist
    await realtimeNotificationSystem.createRoleNotification(
      'pharmacist',
      'Low Stock Alert',
      `${medicineName} is running low: ${currentStock} units left (minimum: ${minimumStock})`,
      NotificationType.MEDICATION_OUT_OF_STOCK,
      NotificationCategory.PHARMACY,
      NotificationPriority.HIGH,
      {
        data: { medicine_id: medicineId, medicine_name: medicineName, current_stock: currentStock, minimum_stock: minimumStock },
        action_url: `/pharmacy/inventory?search=${medicineId}`,
        actions: [
          {
            id: 'reorder',
            label: 'Reorder Now',
            action: 'reorder',
            style: 'primary' as const
          }
        ]
      }
    )

    // Notify admin if critically low (less than 10% of minimum)
    if (currentStock < minimumStock * 0.1) {
      await realtimeNotificationSystem.createRoleNotification(
        'admin',
        'URGENT: Inventory Critical',
        `${medicineName} critically low: ${currentStock} units`,
        NotificationType.MEDICATION_OUT_OF_STOCK,
        NotificationCategory.PHARMACY,
        NotificationPriority.URGENT,
        {
          data: { medicine_id: medicineId, medicine_name: medicineName, current_stock: currentStock },
          action_url: `/admin/inventory`
        }
      )
    }
  }

  static async notifyMedicationExpiring(medicineId: string, medicineName: string, expiryDate: string, daysUntilExpiry: number) {
    await realtimeNotificationSystem.createRoleNotification(
      'pharmacist',
      'Medication Expiring',
      `${medicineName} expires in ${daysUntilExpiry} days (${new Date(expiryDate).toLocaleDateString()})`,
      NotificationType.MEDICATION_EXPIRING,
      NotificationCategory.PHARMACY,
      NotificationPriority.NORMAL,
      {
        data: { medicine_id: medicineId, medicine_name: medicineName, expiry_date: expiryDate },
        action_url: `/pharmacy/inventory?expiring=true`,
        actions: [
          {
            id: 'review_stock',
            label: 'Review Stock',
            action: 'navigate',
            url: `/pharmacy/inventory?expiring=true`,
            style: 'primary' as const
          }
        ]
      }
    )
  }

  // Billing notifications
  static async notifyPaymentReceived(invoiceId: string, patientName: string, amount: number, paymentMethod: string) {
    await realtimeNotificationSystem.createRoleNotification(
      'receptionist',
      'Payment Received',
      `Payment of ₹${amount} received from ${patientName} via ${paymentMethod}`,
      NotificationType.PAYMENT_RECEIVED,
      NotificationCategory.BILLING,
      NotificationPriority.NORMAL,
      {
        data: { invoice_id: invoiceId, amount, payment_method: paymentMethod },
        action_url: `/receptionist/billing?invoice=${invoiceId}`
      }
    )

    // Notify admin for large payments
    if (amount > 10000) {
      await realtimeNotificationSystem.createRoleNotification(
        'admin',
        'Large Payment Received',
        `Payment of ₹${amount} received from ${patientName}`,
        NotificationType.PAYMENT_RECEIVED,
        NotificationCategory.BILLING,
        NotificationPriority.NORMAL,
        {
          data: { invoice_id: invoiceId, amount, payment_method: paymentMethod },
          action_url: `/admin/billing`
        }
      )
    }
  }

  // Emergency notifications
  static async notifyEmergencyAlert(title: string, message: string, patientId?: string) {
    // Notify all doctors and admin
    const roles = ['doctor', 'admin', 'attendant']
    
    for (const role of roles) {
      await realtimeNotificationSystem.createRoleNotification(
        role,
        title,
        message,
        NotificationType.EMERGENCY_ALERT,
        NotificationCategory.EMERGENCY,
        NotificationPriority.CRITICAL,
        {
          data: { patient_id: patientId },
          action_url: patientId ? `/patients/${patientId}` : undefined,
          actions: [
            {
              id: 'acknowledge',
              label: 'Acknowledge',
              action: 'acknowledge',
              style: 'danger' as const
            },
            ...(patientId ? [{
              id: 'view_patient',
              label: 'View Patient',
              action: 'navigate',
              url: `/patients/${patientId}`,
              style: 'primary' as const as const
            }] : [])
          ]
        }
      )
    }
  }

  static async notifyDrugInteraction(patientId: string, patientName: string, medications: string[], doctorId: string) {
    const message = `Drug interaction warning for ${patientName}: ${medications.join(' + ')}`

    await realtimeNotificationSystem.createUserNotification(
      doctorId,
      'Drug Interaction Warning',
      message,
      NotificationType.DRUG_INTERACTION_WARNING,
      NotificationCategory.EMERGENCY,
      NotificationPriority.URGENT,
      {
        data: { patient_id: patientId, medications },
        action_url: `/doctor/patients/${patientId}/prescriptions`,
        actions: [
          {
            id: 'review_prescriptions',
            label: 'Review Prescriptions',
            action: 'navigate',
            url: `/doctor/patients/${patientId}/prescriptions`,
            style: 'danger'
          }
        ]
      }
    )
  }

  // System notifications
  static async notifySystemMaintenance(startTime: string, duration: string, affectedSystems: string[]) {
    const message = `Scheduled maintenance: ${new Date(startTime).toLocaleString()} for ${duration}. Affected: ${affectedSystems.join(', ')}`

    // Notify all users
    const roles = ['admin', 'doctor', 'receptionist', 'pharmacist', 'attendant']
    
    for (const role of roles) {
      await realtimeNotificationSystem.createRoleNotification(
        role,
        'Scheduled Maintenance',
        message,
        NotificationType.SYSTEM_MAINTENANCE,
        NotificationCategory.SYSTEM,
        NotificationPriority.HIGH,
        {
          data: { start_time: startTime, duration, affected_systems: affectedSystems }
        }
      )
    }
  }

  // Queue management
  static async notifyPatientWaiting(patientId: string, patientName: string, waitTime: number, doctorId?: string) {
    if (doctorId) {
      await realtimeNotificationSystem.createUserNotification(
        doctorId,
        'Patient Waiting',
        `${patientName} has been waiting for ${waitTime} minutes`,
        NotificationType.PATIENT_WAITING,
        NotificationCategory.PATIENT_CARE,
        waitTime > 30 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        {
          data: { patient_id: patientId, wait_time: waitTime },
          action_url: `/doctor/queue`,
          actions: [
            {
              id: 'call_next',
              label: 'Call Patient',
              action: 'call_patient',
              style: 'primary' as const
            }
          ]
        }
      )
    }
  }
}

// Database trigger functions (these would be called from Supabase functions)
export async function createNotificationTriggers() {

  // This would typically be run as a migration
  const triggerFunctions = `
    -- Function to trigger patient arrival notification
    CREATE OR REPLACE FUNCTION notify_patient_arrival()
    RETURNS TRIGGER AS $$
    BEGIN
      -- This would call our notification service via webhook
      PERFORM pg_notify('patient_arrival', json_build_object(
        'patient_id', NEW.patient_id,
        'patient_name', (SELECT full_name FROM patients WHERE id = NEW.patient_id),
        'appointment_id', NEW.id,
        'doctor_id', NEW.doctor_id
      )::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to trigger low inventory notification
    CREATE OR REPLACE FUNCTION check_inventory_levels()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.stock_quantity <= NEW.minimum_stock THEN
        PERFORM pg_notify('low_inventory', json_build_object(
          'medicine_id', NEW.id,
          'medicine_name', NEW.name,
          'current_stock', NEW.stock_quantity,
          'minimum_stock', NEW.minimum_stock
        )::text);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Triggers
    DROP TRIGGER IF EXISTS patient_arrival_trigger ON appointments;
    CREATE TRIGGER patient_arrival_trigger
      AFTER UPDATE OF status ON appointments
      FOR EACH ROW
      WHEN (NEW.status = 'checked_in' AND OLD.status != 'checked_in')
      EXECUTE FUNCTION notify_patient_arrival();

    DROP TRIGGER IF EXISTS inventory_check_trigger ON medicines;
    CREATE TRIGGER inventory_check_trigger
      AFTER UPDATE OF stock_quantity ON medicines
      FOR each ROW
      EXECUTE FUNCTION check_inventory_levels();
  `

  // In a real implementation, this would be applied via Supabase migrations
  console.log('Notification triggers would be created:', triggerFunctions)
}

export default HealthcareNotificationTriggers