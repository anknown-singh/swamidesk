export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          role: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          name: string
          email: string | null
          phone: string | null
          department: string | null
          specialization: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          name: string
          email?: string | null
          phone?: string | null
          department?: string | null
          specialization?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          name?: string
          email?: string | null
          phone?: string | null
          department?: string | null
          specialization?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          mobile: string | null
          dob: string | null
          gender: 'male' | 'female' | 'other' | null
          address: string | null
          email: string | null
          emergency_contact: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          mobile?: string | null
          dob?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          email?: string | null
          emergency_contact?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mobile?: string | null
          dob?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          email?: string | null
          emergency_contact?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          token_number: number
          department: string
          visit_date: string
          status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
          consultation_notes: string | null
          diagnosis: string | null
          opd_charge: number
          priority: boolean
          checked_in_at: string | null
          consultation_started_at: string | null
          consultation_ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          token_number: number
          department: string
          visit_date?: string
          status?: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
          consultation_notes?: string | null
          diagnosis?: string | null
          opd_charge?: number
          priority?: boolean
          checked_in_at?: string | null
          consultation_started_at?: string | null
          consultation_ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          token_number?: number
          department?: string
          visit_date?: string
          status?: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
          consultation_notes?: string | null
          diagnosis?: string | null
          opd_charge?: number
          priority?: boolean
          checked_in_at?: string | null
          consultation_started_at?: string | null
          consultation_ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          department: string
          appointment_type: 'consultation' | 'follow_up' | 'procedure' | 'checkup' | 'emergency' | 'vaccination'
          status: 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          scheduled_date: string
          scheduled_time: string
          duration: number
          title: string | null
          description: string | null
          notes: string | null
          patient_notes: string | null
          priority: boolean
          is_recurring: boolean
          recurrence_type: 'none' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'custom' | null
          recurrence_end_date: string | null
          parent_appointment_id: string | null
          reminder_sent: boolean
          confirmation_sent: boolean
          estimated_cost: number | null
          actual_cost: number | null
          created_by: string
          confirmed_at: string | null
          arrived_at: string | null
          started_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          no_show_at: string | null
          rescheduled_from: string | null
          rescheduled_to: string | null
          rescheduled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          department: string
          appointment_type: 'consultation' | 'follow_up' | 'procedure' | 'checkup' | 'emergency' | 'vaccination'
          status?: 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          scheduled_date: string
          scheduled_time: string
          duration?: number
          title?: string | null
          description?: string | null
          notes?: string | null
          patient_notes?: string | null
          priority?: boolean
          is_recurring?: boolean
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'custom' | null
          recurrence_end_date?: string | null
          parent_appointment_id?: string | null
          reminder_sent?: boolean
          confirmation_sent?: boolean
          estimated_cost?: number | null
          actual_cost?: number | null
          created_by: string
          confirmed_at?: string | null
          arrived_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          no_show_at?: string | null
          rescheduled_from?: string | null
          rescheduled_to?: string | null
          rescheduled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          department?: string
          appointment_type?: 'consultation' | 'follow_up' | 'procedure' | 'checkup' | 'emergency' | 'vaccination'
          status?: 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          scheduled_date?: string
          scheduled_time?: string
          duration?: number
          title?: string | null
          description?: string | null
          notes?: string | null
          patient_notes?: string | null
          priority?: boolean
          is_recurring?: boolean
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'custom' | null
          recurrence_end_date?: string | null
          parent_appointment_id?: string | null
          reminder_sent?: boolean
          confirmation_sent?: boolean
          estimated_cost?: number | null
          actual_cost?: number | null
          created_by?: string
          confirmed_at?: string | null
          arrived_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          no_show_at?: string | null
          rescheduled_from?: string | null
          rescheduled_to?: string | null
          rescheduled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          role: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          full_name: string
          email: string | null
          phone: string | null
          department: string | null
          specialization: string | null
          password_hash: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          full_name: string
          email?: string | null
          phone?: string | null
          department?: string | null
          specialization?: string | null
          password_hash: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
          full_name?: string
          email?: string | null
          phone?: string | null
          department?: string | null
          specialization?: string | null
          password_hash?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          visit_id: string
          invoice_number: string
          opd_charge: number
          services_charge: number
          medicines_charge: number
          subtotal: number
          discount_amount: number
          discount_percentage: number
          tax_amount: number
          total_amount: number
          amount_paid: number
          balance_amount: number
          payment_status: 'pending' | 'partial' | 'completed' | 'refunded'
          payment_method: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer' | null
          payment_reference: string | null
          notes: string | null
          created_by: string
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          invoice_number: string
          opd_charge?: number
          services_charge?: number
          medicines_charge?: number
          subtotal?: number
          discount_amount?: number
          discount_percentage?: number
          tax_amount?: number
          total_amount?: number
          amount_paid?: number
          balance_amount?: number
          payment_status?: 'pending' | 'partial' | 'completed' | 'refunded'
          payment_method?: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer' | null
          payment_reference?: string | null
          notes?: string | null
          created_by: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          invoice_number?: string
          opd_charge?: number
          services_charge?: number
          medicines_charge?: number
          subtotal?: number
          discount_amount?: number
          discount_percentage?: number
          tax_amount?: number
          total_amount?: number
          amount_paid?: number
          balance_amount?: number
          payment_status?: 'pending' | 'partial' | 'completed' | 'refunded'
          payment_method?: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer' | null
          payment_reference?: string | null
          notes?: string | null
          created_by?: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clinic_settings: {
        Row: {
          id: string
          clinic_name: string
          clinic_address: string
          clinic_phone: string
          clinic_email: string
          clinic_website: string
          clinic_logo: string
          tax_rate: number
          currency_symbol: string
          default_opd_charge: number
          working_hours_start: string
          working_hours_end: string
          appointment_duration: number
          working_days: string
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_name: string
          clinic_address: string
          clinic_phone: string
          clinic_email: string
          clinic_website?: string
          clinic_logo?: string
          tax_rate?: number
          currency_symbol?: string
          default_opd_charge?: number
          working_hours_start?: string
          working_hours_end?: string
          appointment_duration?: number
          working_days?: string
          created_by: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_name?: string
          clinic_address?: string
          clinic_phone?: string
          clinic_email?: string
          clinic_website?: string
          clinic_logo?: string
          tax_rate?: number
          currency_symbol?: string
          default_opd_charge?: number
          working_hours_start?: string
          working_hours_end?: string
          appointment_duration?: number
          working_days?: string
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'
      visit_status: 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'
      service_status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
      treatment_status: 'planned' | 'active' | 'completed' | 'paused'
      payment_status: 'pending' | 'partial' | 'completed' | 'refunded'
      payment_method: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer'
    }
    CompositeTypes: Record<string, never>
  }
}