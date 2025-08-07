// Centralized Patient Workflow Management System
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'

export type PatientStatus = 
  | 'registered'           // Patient registered, not yet in queue
  | 'waiting'              // In queue, waiting for consultation
  | 'in_consultation'      // Currently with doctor
  | 'admin_review'         // Procedures pending admin pricing approval
  | 'procedures_pending'   // Approved procedures, waiting for execution
  | 'pharmacy_pending'     // Medicines needed, waiting for pharmacy
  | 'completed'            // All treatments done, ready for billing
  | 'billed'               // Payment completed, patient discharged

export interface PatientWorkflowData {
  id: string
  patient_id: string
  appointment_id?: string
  current_status: PatientStatus
  requires_procedures: boolean
  requires_medicines: boolean
  procedure_quotes: any[]
  department: string
  doctor_id?: string
  created_at: string
  updated_at: string
}

export class WorkflowManager {
  private supabase = createAuthenticatedClient()

  /**
   * Smart routing logic based on treatment decisions
   */
  static determineNextStatus(
    requiresProcedures: boolean,
    procedureQuotes: any[],
    requiresMedicines: boolean
  ): PatientStatus {
    // If procedures are required and quotes exist, need admin approval first
    if (requiresProcedures && procedureQuotes.length > 0) {
      return 'admin_review'
    }
    
    // If only medicines required, go direct to pharmacy
    if (requiresMedicines && !requiresProcedures) {
      return 'pharmacy_pending'
    }
    
    // If no treatment required, ready for billing
    if (!requiresProcedures && !requiresMedicines) {
      return 'completed'
    }
    
    // Default case
    return 'completed'
  }

  /**
   * Update patient workflow status
   */
  async updatePatientStatus(
    patientId: string, 
    newStatus: PatientStatus,
    additionalData?: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updates = {
        current_status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      // Update OPD record if exists
      const { error: opdError } = await this.supabase
        .from('opd_records')
        .update({ opd_status: newStatus, ...updates })
        .eq('patient_id', patientId)
        .gte('created_at', new Date().toISOString().split('T')[0]) // Today's records only

      if (opdError && opdError.code !== 'PGRST116') { // Ignore "no rows" error
        throw opdError
      }

      // Update appointment status if relevant
      if (newStatus === 'completed' || newStatus === 'billed') {
        await this.supabase
          .from('appointments')
          .update({ status: newStatus === 'billed' ? 'completed' : 'in_progress' })
          .eq('patient_id', patientId)
          .eq('scheduled_date', new Date().toISOString().split('T')[0])
      }

      return { 
        success: true, 
        message: `Patient status updated to ${newStatus}` 
      }
    } catch (error) {
      console.error('Error updating patient status:', error)
      return { 
        success: false, 
        message: 'Failed to update patient status' 
      }
    }
  }

  /**
   * Get patients by department and status
   */
  async getPatientsByDepartmentAndStatus(
    department: string, 
    statuses: PatientStatus[]
  ): Promise<PatientWorkflowData[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('opd_records')
        .select(`
          *,
          patients(id, full_name, phone, email),
          appointments(id, scheduled_time, appointment_type)
        `)
        .in('opd_status', statuses)
        .gte('created_at', today)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching patients by department:', error)
      return []
    }
  }

  /**
   * Route patient after consultation completion
   */
  async routePatientAfterConsultation(
    patientId: string,
    requiresProcedures: boolean,
    procedureQuotes: any[],
    requiresMedicines: boolean,
    prescriptionNotes?: string
  ): Promise<{ success: boolean; nextStep: string; message: string }> {
    try {
      const nextStatus = WorkflowManager.determineNextStatus(
        requiresProcedures,
        procedureQuotes,
        requiresMedicines
      )

      await this.updatePatientStatus(patientId, nextStatus, {
        requires_procedures: requiresProcedures,
        requires_medicines: requiresMedicines,
        procedure_quotes: procedureQuotes,
        prescription_notes: prescriptionNotes
      })

      let nextStep = ''
      let message = ''

      switch (nextStatus) {
        case 'admin_review':
          nextStep = 'Admin Review Dashboard'
          message = 'Procedure quotes sent to admin for pricing approval'
          break
        case 'pharmacy_pending':
          nextStep = 'Pharmacy Department'
          message = 'Patient routed to pharmacy for medications'
          break
        case 'completed':
          nextStep = 'Billing Counter'
          message = 'Patient ready for billing - no further treatment required'
          break
        default:
          nextStep = 'Unknown'
          message = 'Patient routing completed'
      }

      return { success: true, nextStep, message }
    } catch (error) {
      console.error('Error routing patient:', error)
      return { 
        success: false, 
        nextStep: '', 
        message: 'Failed to route patient' 
      }
    }
  }

  /**
   * Handle admin approval of procedures
   */
  async handleAdminApproval(
    patientId: string,
    approvedProcedures: any[],
    hasRejectedProcedures: boolean,
    stillRequiresMedicines: boolean
  ): Promise<{ success: boolean; nextStep: string; message: string }> {
    try {
      let nextStatus: PatientStatus

      if (approvedProcedures.length > 0) {
        // Has approved procedures, route to procedures department
        nextStatus = 'procedures_pending'
      } else if (stillRequiresMedicines) {
        // No approved procedures but needs medicines
        nextStatus = 'pharmacy_pending'
      } else {
        // Nothing approved, complete consultation
        nextStatus = 'completed'
      }

      await this.updatePatientStatus(patientId, nextStatus, {
        procedure_quotes: approvedProcedures,
        admin_approved_at: new Date().toISOString()
      })

      let nextStep = ''
      let message = ''

      switch (nextStatus) {
        case 'procedures_pending':
          nextStep = 'Procedures Department'
          message = `${approvedProcedures.length} procedure(s) approved and scheduled`
          break
        case 'pharmacy_pending':
          nextStep = 'Pharmacy Department'
          message = 'Procedures review complete, patient routed to pharmacy'
          break
        case 'completed':
          nextStep = 'Billing Counter'
          message = 'Admin review complete, patient ready for billing'
          break
      }

      return { success: true, nextStep, message }
    } catch (error) {
      console.error('Error handling admin approval:', error)
      return { 
        success: false, 
        nextStep: '', 
        message: 'Failed to process admin approval' 
      }
    }
  }

  /**
   * Complete procedure and route to next step
   */
  async completeProcedure(
    patientId: string,
    procedureId: string,
    stillHasPendingProcedures: boolean,
    requiresMedicines: boolean
  ): Promise<{ success: boolean; nextStep: string; message: string }> {
    try {
      let nextStatus: PatientStatus

      if (stillHasPendingProcedures) {
        // Still has more procedures to complete
        nextStatus = 'procedures_pending'
      } else if (requiresMedicines) {
        // All procedures done, but needs medicines
        nextStatus = 'pharmacy_pending'
      } else {
        // All done, ready for billing
        nextStatus = 'completed'
      }

      await this.updatePatientStatus(patientId, nextStatus, {
        [`procedure_${procedureId}_completed_at`]: new Date().toISOString()
      })

      let nextStep = ''
      let message = ''

      switch (nextStatus) {
        case 'procedures_pending':
          nextStep = 'Procedures Department'
          message = 'Procedure completed, more procedures pending'
          break
        case 'pharmacy_pending':
          nextStep = 'Pharmacy Department'
          message = 'All procedures completed, patient routed to pharmacy'
          break
        case 'completed':
          nextStep = 'Billing Counter'
          message = 'All treatments completed, patient ready for billing'
          break
      }

      return { success: true, nextStep, message }
    } catch (error) {
      console.error('Error completing procedure:', error)
      return { 
        success: false, 
        nextStep: '', 
        message: 'Failed to complete procedure' 
      }
    }
  }

  /**
   * Complete pharmacy dispensing and route to billing
   */
  async completePharmacy(patientId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.updatePatientStatus(patientId, 'completed', {
        pharmacy_completed_at: new Date().toISOString()
      })

      return { 
        success: true, 
        message: 'Medications dispensed, patient ready for billing' 
      }
    } catch (error) {
      console.error('Error completing pharmacy:', error)
      return { 
        success: false, 
        message: 'Failed to complete pharmacy dispensing' 
      }
    }
  }

  /**
   * Complete billing and discharge patient
   */
  async completeBilling(
    patientId: string, 
    invoiceNumber: string, 
    totalAmount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.updatePatientStatus(patientId, 'billed', {
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        billed_at: new Date().toISOString()
      })

      return { 
        success: true, 
        message: `Payment completed. Invoice #${invoiceNumber}` 
      }
    } catch (error) {
      console.error('Error completing billing:', error)
      return { 
        success: false, 
        message: 'Failed to complete billing' 
      }
    }
  }

  /**
   * Get patient workflow summary for dashboard
   */
  async getWorkflowSummary(): Promise<{
    waiting: number
    in_consultation: number
    admin_review: number
    procedures_pending: number
    pharmacy_pending: number
    completed: number
    billed: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('opd_records')
        .select('opd_status')
        .gte('created_at', today)

      if (error) throw error

      const summary = {
        waiting: 0,
        in_consultation: 0,
        admin_review: 0,
        procedures_pending: 0,
        pharmacy_pending: 0,
        completed: 0,
        billed: 0
      }

      data?.forEach(record => {
        const status = record.opd_status as PatientStatus
        if (summary.hasOwnProperty(status)) {
          summary[status]++
        }
      })

      return summary
    } catch (error) {
      console.error('Error fetching workflow summary:', error)
      return {
        waiting: 0,
        in_consultation: 0,
        admin_review: 0,
        procedures_pending: 0,
        pharmacy_pending: 0,
        completed: 0,
        billed: 0
      }
    }
  }
}

// Export singleton instance
export const workflowManager = new WorkflowManager()