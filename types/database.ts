export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          patient_id: string
          full_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          blood_group: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          patient_id?: string
          full_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          blood_group?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          patient_id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          blood_group?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          status: string
          appointment_type: string
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          status?: string
          appointment_type: string
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          status?: string
          appointment_type?: string
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      medicines: {
        Row: {
          id: string
          name: string
          category: string
          dosage_form: string
          strength: string | null
          unit_price: number
          stock_quantity: number
          minimum_stock: number
          manufacturer: string | null
          batch_number: string | null
          expiry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          dosage_form: string
          strength?: string | null
          unit_price: number
          stock_quantity: number
          minimum_stock: number
          manufacturer?: string | null
          batch_number?: string | null
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          dosage_form?: string
          strength?: string | null
          unit_price?: number
          stock_quantity?: number
          minimum_stock?: number
          manufacturer?: string | null
          batch_number?: string | null
          expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          prescription_date: string
          status: string
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          prescription_date: string
          status?: string
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          prescription_date?: string
          status?: string
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          patient_id: string
          total_amount: number
          paid_amount: number | null
          payment_status: string
          invoice_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          total_amount: number
          paid_amount?: number | null
          payment_status?: string
          invoice_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          total_amount?: number
          paid_amount?: number | null
          payment_status?: string
          invoice_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string
          permissions: string[]
          is_system: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          permissions: string[]
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          permissions?: string[]
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string
          assigned_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_by: string
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_by?: string
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
      services: {
        Row: {
          id: string
          name: string
          category: string
          price: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          price: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          price?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          medicine_id: string
          quantity_prescribed: number
          quantity_dispensed: number | null
          dosage_instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          medicine_id: string
          quantity_prescribed: number
          quantity_dispensed?: number | null
          dosage_instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prescription_id?: string
          medicine_id?: string
          quantity_prescribed?: number
          quantity_dispensed?: number | null
          dosage_instructions?: string | null
          created_at?: string
        }
      }
      opd_records: {
        Row: {
          id: string
          patient_id: string
          opd_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          opd_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          opd_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      visit_services: {
        Row: {
          id: string
          service_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      security_audit_log: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: any
          ip_address: string
          user_agent: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: any
          ip_address: string
          user_agent: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: any
          ip_address?: string
          user_agent?: string
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}