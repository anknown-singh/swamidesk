// User & Authentication Types
export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'attendant' | 'service_attendant' | 'pharmacist'

export type VisitStatus = 'waiting' | 'in_consultation' | 'services_pending' | 'completed' | 'billed'

export type ServiceStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export type TreatmentStatus = 'planned' | 'active' | 'completed' | 'paused'

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded'

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer'

// Appointment Management Types
export type AppointmentStatus = 'pending' | 'requested' | 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

export type AppointmentType = 'consultation' | 'follow_up' | 'procedure' | 'checkup' | 'emergency' | 'vaccination'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'custom'

export type AvailabilityStatus = 'available' | 'busy' | 'break' | 'off' | 'blocked'

// Core Entity Types
export interface UserProfile {
  id: string
  role: UserRole
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

export interface Patient {
  id: string
  full_name: string
  phone: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  address: string | null
  email: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_history: string | null
  allergies: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  appointment_number: string | null
  patient_id: string
  doctor_id: string
  department: string | null
  appointment_type: AppointmentType
  status: AppointmentStatus
  scheduled_date: string
  scheduled_time: string
  duration: number | null
  estimated_end_time: string | null
  title: string | null
  description: string | null
  chief_complaint: string | null
  notes: string | null
  patient_notes: string | null
  priority: boolean
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  recurrence_end_date: string | null
  parent_appointment_id: string | null
  reminder_sent: boolean
  confirmation_sent: boolean
  confirmed_at: string | null
  estimated_cost: number | null
  actual_cost: number | null
  arrived_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Relations
  patients?: Patient
  users?: UserProfile
  services?: AppointmentService[]
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

// Appointment Management Entities

export interface DoctorAvailability {
  id: string
  doctor_id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  break_start_time?: string
  break_end_time?: string
  is_available: boolean
  max_appointments?: number
  appointment_duration: number // default duration in minutes
  buffer_time: number // buffer between appointments in minutes
  created_at: string
  updated_at: string
  // Relations
  doctor?: UserProfile
}

export interface DoctorLeave {
  id: string
  doctor_id: string
  leave_type: 'vacation' | 'sick' | 'conference' | 'emergency' | 'other'
  start_date: string
  end_date: string
  start_time?: string // for partial day leaves
  end_time?: string // for partial day leaves
  reason?: string
  is_recurring: boolean
  approved: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  // Relations
  doctor?: UserProfile
  approved_by_user?: UserProfile
}

export interface AppointmentSlot {
  id: string
  doctor_id: string
  date: string
  start_time: string
  end_time: string
  status: AvailabilityStatus
  appointment_id?: string // if slot is booked
  max_capacity: number
  booked_count: number
  is_emergency_slot: boolean
  created_at: string
  updated_at: string
  // Relations
  doctor?: UserProfile
  appointment?: Appointment
}

export interface AppointmentService {
  id: string
  appointment_id: string
  service_id: string
  quantity: number
  estimated_duration: number | null
  notes?: string
  created_at: string
  // Relations
  appointment?: Appointment
  service?: Service
}

export interface AppointmentReminder {
  id: string
  appointment_id: string
  reminder_type: 'sms' | 'email' | 'whatsapp' | 'call'
  scheduled_at: string
  sent_at?: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  message_template: string
  error_message?: string
  created_at: string
  // Relations
  appointment?: Appointment
}

export interface AppointmentWaitlist {
  id: string
  patient_id: string
  doctor_id: string
  preferred_date: string
  preferred_time_start?: string
  preferred_time_end?: string
  appointment_type: AppointmentType
  priority: number // higher number = higher priority
  notes?: string
  status: 'active' | 'contacted' | 'expired' | 'fulfilled'
  expires_at: string
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  doctor?: UserProfile
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

// Appointment Form Types
export interface AppointmentBookingForm {
  patient_id: string
  doctor_id: string
  department: string
  appointment_type: AppointmentType
  scheduled_date: string
  scheduled_time: string
  duration?: number
  title?: string
  description?: string
  patient_notes?: string
  priority?: boolean
  services?: string[] // array of service IDs
  estimated_cost?: number
}

export interface AppointmentRescheduleForm {
  appointment_id: string
  new_scheduled_date: string
  new_scheduled_time: string
  reschedule_reason?: string
  notify_patient: boolean
}

export interface AppointmentCancellationForm {
  appointment_id: string
  cancellation_reason: string
  refund_amount?: number
  notify_patient: boolean
}

export interface DoctorAvailabilityForm {
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  break_start_time?: string
  break_end_time?: string
  is_available: boolean
  max_appointments?: number
  appointment_duration: number
  buffer_time: number
  [key: string]: unknown
}

export interface DoctorLeaveForm {
  doctor_id: string
  leave_type: 'vacation' | 'sick' | 'conference' | 'emergency' | 'other'
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  reason?: string
  is_recurring: boolean
  [key: string]: unknown
}

export interface WaitlistEntryForm {
  patient_id: string
  doctor_id: string
  preferred_date: string
  preferred_time_start?: string
  preferred_time_end?: string
  appointment_type: AppointmentType
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
  appointments_upcoming: number
  appointments_completed_today: number
  appointments_cancelled_today: number
  appointments_no_show_today: number
  pending_services: number
  low_stock_items: number
  pending_prescriptions: number
  doctor_availability_today: number
  waitlist_count: number
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

export interface AppointmentSearchFilters {
  patient_id?: string
  doctor_id?: string
  department?: string
  appointment_type?: AppointmentType
  status?: AppointmentStatus
  scheduled_date_from?: string
  scheduled_date_to?: string
  priority?: boolean
  is_recurring?: boolean
}

export interface DoctorAvailabilityFilters {
  doctor_id?: string
  day_of_week?: number
  date_from?: string
  date_to?: string
  is_available?: boolean
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

export interface AppointmentReport {
  date: string
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  revenue_from_appointments: number
  average_appointment_duration: number
  doctor_utilization_rate: number
}

export interface DoctorAppointmentReport {
  doctor_id: string
  doctor_name: string
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  average_rating?: number
  revenue_generated: number
  utilization_rate: number
  available_hours: number
  booked_hours: number
}

export interface AppointmentAnalytics {
  peak_booking_hours: Array<{ hour: number, count: number }>
  popular_appointment_types: Array<{ type: AppointmentType, count: number }>
  cancellation_reasons: Array<{ reason: string, count: number }>
  average_lead_time: number // days between booking and appointment
  no_show_rate: number
  same_day_booking_rate: number
  recurring_appointment_rate: number
}