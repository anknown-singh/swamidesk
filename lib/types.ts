// User & Authentication Types
export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'

export type VisitStatus = 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'

export type ServiceStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export type TreatmentStatus = 'planned' | 'active' | 'completed' | 'paused'

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer'

// Core Entity Types
export interface UserProfile {
  id: string
  role: UserRole
  name: string
  email: string | null
  phone: string | null
  department: string | null
  specialization: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Patient {
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

export interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  token_number: number
  department: string
  visit_date: string
  status: VisitStatus
  consultation_notes: string | null
  diagnosis: string | null
  opd_charge: number
  priority: boolean
  checked_in_at: string | null
  consultation_started_at: string | null
  consultation_ended_at: string | null
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  doctor?: UserProfile
}

export interface Service {
  id: string
  name: string
  category: string
  subcategory: string | null
  price: number
  duration: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VisitService {
  id: string
  visit_id: string
  service_id: string
  attendant_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  status: ServiceStatus
  notes: string | null
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Relations
  visit?: Visit
  service?: Service
  attendant?: UserProfile
}

export interface Medicine {
  id: string
  name: string
  generic_name: string | null
  brand: string | null
  unit_price: number
  unit_type: string
  stock: number
  min_stock_level: number
  batch_number: string | null
  expiry_date: string | null
  supplier: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Prescription {
  id: string
  visit_id: string
  medicine_id: string
  quantity: number
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  created_at: string
  // Relations
  visit?: Visit
  medicine?: Medicine
}

export interface PharmacyIssue {
  id: string
  prescription_id: string
  issued_quantity: number
  unit_price: number
  total_price: number
  batch_number: string | null
  expiry_date: string | null
  issued_by: string
  status: 'dispensed' | 'cancelled'
  notes: string | null
  issued_at: string
  // Relations
  prescription?: Prescription
  issued_by_user?: UserProfile
}

export interface TreatmentPlan {
  id: string
  visit_id: string
  title: string
  description: string | null
  total_sessions: number
  completed_sessions: number
  estimated_cost: number | null
  status: TreatmentStatus
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  created_at: string
  updated_at: string
  // Relations
  visit?: Visit
  sessions?: TreatmentSession[]
}

export interface TreatmentSession {
  id: string
  treatment_plan_id: string
  session_number: number
  service_id: string
  attendant_id: string | null
  scheduled_date: string | null
  session_date: string | null
  status: ServiceStatus
  notes: string | null
  outcome: string | null
  created_at: string
  updated_at: string
  // Relations
  treatment_plan?: TreatmentPlan
  service?: Service
  attendant?: UserProfile
}

export interface Invoice {
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
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  payment_reference: string | null
  notes: string | null
  created_by: string
  paid_at: string | null
  created_at: string
  updated_at: string
  // Relations
  visit?: Visit
  created_by_user?: UserProfile
}

// Queue Management Types
export interface QueueItem {
  id: string
  token_number: number
  department: string
  status: VisitStatus
  priority: boolean
  checked_in_at: string | null
  patient_name: string
  patient_mobile: string | null
  doctor_name: string
  queue_position: number
}

// Form Types
export interface PatientRegistrationForm {
  name: string
  mobile: string
  dob?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  email?: string
  emergency_contact?: string
}

export interface VisitCreationForm {
  patient_id: string
  doctor_id: string
  department: string
  priority?: boolean
  opd_charge?: number
}

export interface ConsultationForm {
  consultation_notes: string
  diagnosis: string
  services: Array<{
    service_id: string
    quantity: number
    notes?: string
  }>
  prescriptions: Array<{
    medicine_id: string
    quantity: number
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
  }>
  treatment_plan?: {
    title: string
    description?: string
    total_sessions: number
    estimated_cost?: number
  }
}

export interface PharmacyDispenseForm {
  prescription_id: string
  issued_quantity: number
  batch_number?: string
  expiry_date?: string
  notes?: string
}

export interface InvoiceForm {
  visit_id: string
  discount_amount?: number
  discount_percentage?: number
  payment_method?: PaymentMethod
  payment_reference?: string
  notes?: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Dashboard Stats Types
export interface DashboardStats {
  total_patients: number
  today_patients: number
  queue_length: number
  revenue_today: number
  appointments_today: number
  pending_services: number
  low_stock_items: number
  pending_prescriptions: number
}

export interface DepartmentStats {
  department: string
  patient_count: number
  revenue: number
  growth_percentage: number
}

// Search and Filter Types
export interface PatientSearchFilters {
  name?: string
  mobile?: string
  email?: string
  created_from?: string
  created_to?: string
}

export interface VisitSearchFilters {
  patient_id?: string
  doctor_id?: string
  department?: string
  status?: VisitStatus
  visit_date_from?: string
  visit_date_to?: string
  priority?: boolean
}

export interface MedicineSearchFilters {
  name?: string
  category?: string
  low_stock?: boolean
  expiring_soon?: boolean
  supplier?: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  created_at: string
  read: boolean
}

// System Configuration Types
export interface SystemSettings {
  clinic_name: string
  clinic_address: string
  clinic_phone: string
  clinic_email: string
  tax_rate: number
  currency_symbol: string
  default_opd_charge: number
  working_hours_start: string
  working_hours_end: string
  appointment_duration: number
}

export interface Department {
  id: string
  name: string
  description?: string
  is_active: boolean
}

// Report Types
export interface RevenueReport {
  date: string
  opd_revenue: number
  services_revenue: number
  medicines_revenue: number
  total_revenue: number
  patient_count: number
}

export interface InventoryReport {
  medicine_name: string
  current_stock: number
  min_stock_level: number
  stock_value: number
  expiry_date?: string
  needs_reorder: boolean
}

export interface PatientReport {
  patient_id: string
  patient_name: string
  total_visits: number
  last_visit_date: string
  total_spent: number
  outstanding_balance: number
}