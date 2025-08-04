export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    // Tables will be auto-generated from Supabase CLI
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