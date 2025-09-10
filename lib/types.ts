// User & Authentication Types
export type UserRole =
  | "admin"
  | "doctor"
  | "receptionist"
  | "attendant"
  | "service_attendant"
  | "pharmacist";

export type VisitStatus =
  | "waiting"
  | "in_consultation"
  | "services_pending"
  | "completed"
  | "billed";

export type ServiceStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TreatmentStatus = "planned" | "active" | "completed" | "paused";

export type PaymentStatus = "pending" | "partial" | "completed" | "refunded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "upi"
  | "insurance"
  | "bank_transfer";

// Appointment Management Types
export type AppointmentStatus =
  | "pending"
  | "requested"
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type AppointmentType =
  | "consultation"
  | "follow_up"
  | "procedure"
  | "treatment"
  | "checkup"
  | "emergency"
  | "vaccination";

export type RecurrenceType =
  | "none"
  | "daily"
  | "weekly"
  | "bi_weekly"
  | "monthly"
  | "custom";

export type AvailabilityStatus =
  | "available"
  | "busy"
  | "break"
  | "off"
  | "blocked";

// Core Entity Types
export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  specialization: string | null;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  address: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_history: string | null;
  allergies: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  appointment_number: string | null;
  patient_id: string;
  doctor_id: string;
  department: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  duration: number | null;
  estimated_end_time: string | null;
  title: string | null;
  description: string | null;
  chief_complaint: string | null;
  notes: string | null;
  patient_notes: string | null;
  priority: boolean;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_end_date: string | null;
  parent_appointment_id: string | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  confirmed_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  opd_id: string | null;
  // Relations
  patients?: Patient;
  users?: UserProfile;
  services?: AppointmentService[];
}

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id: string;
  token_number: number;
  department: string;
  visit_date: string;
  status: VisitStatus;
  consultation_notes: string | null;
  diagnosis: string | null;
  opd_charge: number;
  priority: boolean;
  checked_in_at: string | null;
  consultation_started_at: string | null;
  consultation_ended_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
  doctor?: UserProfile;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  price: number;
  duration: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitService {
  id: string;
  visit_id: string;
  service_id: string;
  attendant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: ServiceStatus;
  notes: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  visit?: Visit;
  service?: Service;
  attendant?: UserProfile;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  unit_price: number;
  unit_type: string;
  stock: number;
  min_stock_level: number;
  batch_number: string | null;
  expiry_date: string | null;
  supplier: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  medicine_id: string;
  quantity: number;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: string;
  // Relations
  visit?: Visit;
  medicine?: Medicine;
}

export interface PharmacyIssue {
  id: string;
  prescription_id: string;
  issued_quantity: number;
  unit_price: number;
  total_price: number;
  batch_number: string | null;
  expiry_date: string | null;
  issued_by: string;
  status: "dispensed" | "cancelled";
  notes: string | null;
  issued_at: string;
  // Relations
  prescription?: Prescription;
  issued_by_user?: UserProfile;
}

export interface TreatmentPlan {
  id: string;
  visit_id: string;
  title: string;
  description: string | null;
  total_sessions: number;
  completed_sessions: number;
  estimated_cost: number | null;
  status: TreatmentStatus;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  visit?: Visit;
  sessions?: TreatmentSession[];
}

export interface TreatmentSession {
  id: string;
  treatment_plan_id: string;
  session_number: number;
  service_id: string;
  attendant_id: string | null;
  scheduled_date: string | null;
  session_date: string | null;
  status: ServiceStatus;
  notes: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  treatment_plan?: TreatmentPlan;
  service?: Service;
  attendant?: UserProfile;
}

export interface Invoice {
  id: string;
  visit_id: string;
  invoice_number: string;
  opd_charge: number;
  services_charge: number;
  medicines_charge: number;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  notes: string | null;
  created_by: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  visit?: Visit;
  created_by_user?: UserProfile;
}

// Appointment Management Entities

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  max_appointments?: number;
  appointment_duration: number; // default duration in minutes
  buffer_time: number; // buffer between appointments in minutes
  created_at: string;
  updated_at: string;
  // Relations
  doctor?: UserProfile;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  leave_type: "vacation" | "sick" | "conference" | "emergency" | "other";
  start_date: string;
  end_date: string;
  start_time?: string; // for partial day leaves
  end_time?: string; // for partial day leaves
  reason?: string;
  is_recurring: boolean;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  doctor?: UserProfile;
  approved_by_user?: UserProfile;
}

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AvailabilityStatus;
  appointment_id?: string; // if slot is booked
  max_capacity: number;
  booked_count: number;
  is_emergency_slot: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  doctor?: UserProfile;
  appointment?: Appointment;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  quantity: number;
  estimated_duration: number | null;
  notes?: string;
  created_at: string;
  // Relations
  appointment?: Appointment;
  service?: Service;
}

export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: "sms" | "email" | "whatsapp" | "call";
  scheduled_at: string;
  sent_at?: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  message_template: string;
  error_message?: string;
  created_at: string;
  // Relations
  appointment?: Appointment;
}

export interface AppointmentWaitlist {
  id: string;
  patient_id: string;
  doctor_id: string;
  preferred_date: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  appointment_type: AppointmentType;
  priority: number; // higher number = higher priority
  notes?: string;
  status: "active" | "contacted" | "expired" | "fulfilled";
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
  doctor?: UserProfile;
}

// Queue Management Types
export interface QueueItem {
  id: string;
  token_number: number;
  department: string;
  status: VisitStatus;
  priority: boolean;
  checked_in_at: string | null;
  patient_name: string;
  patient_mobile: string | null;
  doctor_name: string;
  queue_position: number;
}

// Form Types
export interface PatientRegistrationForm {
  name: string;
  mobile: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  email?: string;
  emergency_contact?: string;
}

export interface VisitCreationForm {
  patient_id: string;
  doctor_id: string;
  department: string;
  priority?: boolean;
  opd_charge?: number;
}

export interface ConsultationForm {
  consultation_notes: string;
  diagnosis: string;
  services: Array<{
    service_id: string;
    quantity: number;
    notes?: string;
  }>;
  prescriptions: Array<{
    medicine_id: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  treatment_plan?: {
    title: string;
    description?: string;
    total_sessions: number;
    estimated_cost?: number;
  };
}

export interface PharmacyDispenseForm {
  prescription_id: string;
  issued_quantity: number;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
}

export interface InvoiceForm {
  visit_id: string;
  discount_amount?: number;
  discount_percentage?: number;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  notes?: string;
}

// Appointment Form Types
export interface AppointmentBookingForm {
  notes: string;
  created_by: string;
  patient_id: string;
  doctor_id: string;
  department: string;
  appointment_type: AppointmentType;
  scheduled_date: string;
  scheduled_time: string;
  duration?: number;
  title?: string;
  description?: string;
  patient_notes?: string;
  priority?: boolean;
  services?: string[]; // array of service IDs
  estimated_cost?: number;
}

export interface AppointmentRescheduleForm {
  appointment_id: string;
  new_scheduled_date: string;
  new_scheduled_time: string;
  reschedule_reason?: string;
  notify_patient: boolean;
}

export interface AppointmentCancellationForm {
  appointment_id: string;
  cancellation_reason: string;
  refund_amount?: number;
  notify_patient: boolean;
}

export interface DoctorAvailabilityForm {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  max_appointments?: number;
  appointment_duration: number;
  buffer_time: number;
  [key: string]: unknown;
}

export interface DoctorLeaveForm {
  doctor_id: string;
  leave_type: "vacation" | "sick" | "conference" | "emergency" | "other";
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  is_recurring: boolean;
  [key: string]: unknown;
}

export interface WaitlistEntryForm {
  patient_id: string;
  doctor_id: string;
  preferred_date: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  appointment_type: AppointmentType;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_patients: number;
  today_patients: number;
  queue_length: number;
  revenue_today: number;
  appointments_today: number;
  appointments_upcoming: number;
  appointments_completed_today: number;
  appointments_cancelled_today: number;
  appointments_no_show_today: number;
  pending_services: number;
  low_stock_items: number;
  pending_prescriptions: number;
  doctor_availability_today: number;
  waitlist_count: number;
}

export interface DepartmentStats {
  department: string;
  patient_count: number;
  revenue: number;
  growth_percentage: number;
}

// Search and Filter Types
export interface PatientSearchFilters {
  name?: string;
  mobile?: string;
  email?: string;
  created_from?: string;
  created_to?: string;
}

export interface VisitSearchFilters {
  patient_id?: string;
  doctor_id?: string;
  department?: string;
  status?: VisitStatus;
  visit_date_from?: string;
  visit_date_to?: string;
  priority?: boolean;
}

export interface MedicineSearchFilters {
  name?: string;
  category?: string;
  low_stock?: boolean;
  expiring_soon?: boolean;
  supplier?: string;
}

export interface AppointmentSearchFilters {
  patient_id?: string;
  doctor_id?: string;
  department?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  priority?: boolean;
  is_recurring?: boolean;
}

export interface DoctorAvailabilityFilters {
  doctor_id?: string;
  day_of_week?: number;
  date_from?: string;
  date_to?: string;
  is_available?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

// System Configuration Types
export interface SystemSettings {
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;
  tax_rate: number;
  currency_symbol: string;
  default_opd_charge: number;
  working_hours_start: string;
  working_hours_end: string;
  appointment_duration: number;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Report Types
export interface RevenueReport {
  date: string;
  opd_revenue: number;
  services_revenue: number;
  medicines_revenue: number;
  total_revenue: number;
  patient_count: number;
}

export interface InventoryReport {
  medicine_name: string;
  current_stock: number;
  min_stock_level: number;
  stock_value: number;
  expiry_date?: string;
  needs_reorder: boolean;
}

export interface PatientReport {
  patient_id: string;
  patient_name: string;
  total_visits: number;
  last_visit_date: string;
  total_spent: number;
  outstanding_balance: number;
}

export interface AppointmentReport {
  date: string;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  revenue_from_appointments: number;
  average_appointment_duration: number;
  doctor_utilization_rate: number;
}

export interface DoctorAppointmentReport {
  doctor_id: string;
  doctor_name: string;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  average_rating?: number;
  revenue_generated: number;
  utilization_rate: number;
  available_hours: number;
  booked_hours: number;
}

export interface AppointmentAnalytics {
  peak_booking_hours: Array<{ hour: number; count: number }>;
  popular_appointment_types: Array<{ type: AppointmentType; count: number }>;
  cancellation_reasons: Array<{ reason: string; count: number }>;
  average_lead_time: number; // days between booking and appointment
  no_show_rate: number;
  same_day_booking_rate: number;
  recurring_appointment_rate: number;
}

// Consultation System Types
export type ConsultationStep =
  | "chief_complaints"
  | "history"
  | "examination"
  | "vitals"
  | "diagnosis"
  | "investigations"
  | "treatment"
  | "completed";

export type ConsultationStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "on_hold";

export type HistoryType =
  | "present_illness"
  | "past_medical"
  | "personal"
  | "family"
  | "allergy";

export type ExaminationType =
  | "general"
  | "cardiovascular"
  | "respiratory"
  | "abdominal"
  | "neurological"
  | "musculoskeletal"
  | "dermatological"
  | "ent"
  | "ophthalmological"
  | "psychiatric";

export type DiagnosisType = "provisional" | "final" | "differential";

export type InvestigationType =
  | "lab"
  | "imaging"
  | "specialized"
  | "biopsy"
  | "functional";

export type InvestigationUrgency = "urgent" | "routine" | "stat" | "within_24h";

export type InvestigationStatus =
  | "ordered"
  | "sample_collected"
  | "in_process"
  | "completed"
  | "cancelled";

export type TreatmentType =
  | "conservative"
  | "surgical"
  | "procedural"
  | "combined";

export type NoteType = "progress" | "addendum" | "correction" | "follow_up";

export interface ConsultationSession {
  id: string;
  visit_id: string;
  doctor_id: string;
  patient_id: string;
  started_at: string;
  ended_at: string | null;
  current_step: ConsultationStep;
  is_completed: boolean;
  total_duration_minutes: number | null;
  consultation_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  visit?: Visit;
  doctor?: UserProfile;
  patient?: Patient;
  chief_complaints?: ConsultationChiefComplaint[];
  history?: ConsultationHistory[];
  examination_findings?: ExaminationFinding[];
  vitals?: ConsultationVitals[];
  diagnoses?: ConsultationDiagnosis[];
  investigation_orders?: InvestigationOrder[];
  treatment_plans?: ConsultationTreatmentPlan[];
  progress_notes?: ConsultationProgressNote[];
}

export interface ConsultationChiefComplaint {
  id: string;
  consultation_id: string;
  complaint: string;
  duration: string | null;
  severity: number | null;
  associated_symptoms: string[];
  onset: string | null;
  character: string | null;
  location: string | null;
  radiation: string | null;
  aggravating_factors: string[];
  relieving_factors: string[];
  timing: string | null;
  created_at: string;
}

export interface ConsultationHistory {
  id: string;
  consultation_id: string;
  history_type: HistoryType;
  content: Record<string, any>;
  summary_text: string | null;
  relevant_negatives: string[];
  created_at: string;
  updated_at: string;
}

export interface ExaminationFinding {
  id: string;
  consultation_id: string;
  examination_type: ExaminationType;
  findings: Record<string, any>;
  normal_findings: string[];
  abnormal_findings: string[];
  clinical_significance: string | null;
  examination_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConsultationVitals {
  id: string;
  consultation_id: string;
  temperature: number | null;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  pain_score: number | null;
  recorded_at: string;
  recorded_by: string | null;
  // Relations
  recorded_by_user?: UserProfile;
}

export interface ConsultationDiagnosis {
  id: string;
  consultation_id: string;
  diagnosis_type: DiagnosisType;
  diagnosis_text: string;
  icd10_code: string | null;
  icd10_description: string | null;
  confidence_level: number | null;
  is_primary: boolean;
  supporting_evidence: string[];
  ruling_out_evidence: string[];
  clinical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestigationOrder {
  id: string;
  consultation_id: string;
  investigation_type: InvestigationType;
  investigation_name: string;
  investigation_code: string | null;
  category: string | null;
  urgency: InvestigationUrgency;
  clinical_indication: string | null;
  instructions: string | null;
  expected_date: string | null;
  cost_estimate: number | null;
  status: InvestigationStatus;
  results: Record<string, any> | null;
  results_summary: string | null;
  interpretation: string | null;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultationTreatmentPlan {
  id: string;
  consultation_id: string;
  treatment_type: TreatmentType;
  primary_treatment: string;
  treatment_goals: string[];
  plan_details: Record<string, any>;
  medications: Record<string, any> | null;
  lifestyle_modifications: string[];
  dietary_advice: string | null;
  activity_restrictions: string[];
  home_care_instructions: string[];
  procedures: Record<string, any> | null;
  pre_operative_requirements: string[];
  post_operative_care: string[];
  risk_assessment: string | null;
  consent_required: boolean;
  follow_up_required: boolean;
  follow_up_days: number | null;
  follow_up_instructions: string | null;
  warning_signs: string[];
  emergency_instructions: string | null;
  estimated_cost: number | null;
  insurance_approval_needed: boolean;
  referral_required: boolean;
  referral_specialty: string | null;
  special_instructions: string | null;
  patient_education_provided: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsultationTemplate {
  id: string;
  name: string;
  specialty: string | null;
  condition: string | null;
  template_data: Record<string, any>;
  chief_complaints_template: Record<string, any> | null;
  history_template: Record<string, any> | null;
  examination_template: Record<string, any> | null;
  common_diagnoses: string[];
  common_investigations: string[];
  common_treatments: Record<string, any> | null;
  created_by: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_user?: UserProfile;
}

export interface ConsultationProgressNote {
  id: string;
  consultation_id: string;
  note_type: NoteType;
  note_text: string;
  clinical_changes: string | null;
  plan_modifications: string | null;
  created_by: string;
  created_at: string;
  // Relations
  created_by_user?: UserProfile;
}

// Form Types for Consultation System
export interface ConsultationSessionForm {
  visit_id: string;
  doctor_id: string;
  patient_id: string;
  current_step?: ConsultationStep;
}

export interface ChiefComplaintForm {
  complaint: string;
  duration?: string;
  severity?: number;
  associated_symptoms?: string[];
  onset?: string;
  character?: string;
  location?: string;
  radiation?: string;
  aggravating_factors?: string[];
  relieving_factors?: string[];
  timing?: string;
}

export interface HistoryForm {
  history_type: HistoryType;
  content: Record<string, any>;
  summary_text?: string;
  relevant_negatives?: string[];
}

export interface ExaminationForm {
  examination_type: ExaminationType;
  findings: Record<string, any>;
  normal_findings?: string[];
  abnormal_findings?: string[];
  clinical_significance?: string;
}

export interface VitalsForm {
  temperature?: number;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  height?: number;
  weight?: number;
  pain_score?: number;
}

export interface DiagnosisForm {
  diagnosis_type: DiagnosisType;
  diagnosis_text: string;
  icd10_code?: string;
  icd10_description?: string;
  confidence_level?: number;
  is_primary?: boolean;
  supporting_evidence?: string[];
  ruling_out_evidence?: string[];
  clinical_notes?: string;
}

export interface InvestigationOrderForm {
  investigation_type: InvestigationType;
  investigation_name: string;
  investigation_code?: string;
  category?: string;
  urgency?: InvestigationUrgency;
  clinical_indication?: string;
  instructions?: string;
  expected_date?: string;
  cost_estimate?: number;
}

export interface TreatmentPlanForm {
  treatment_type: TreatmentType;
  primary_treatment: string;
  treatment_goals?: string[];
  plan_details: Record<string, any>;
  medications?: Record<string, any>;
  lifestyle_modifications?: string[];
  dietary_advice?: string;
  activity_restrictions?: string[];
  home_care_instructions?: string[];
  procedures?: Record<string, any>;
  pre_operative_requirements?: string[];
  post_operative_care?: string[];
  risk_assessment?: string;
  consent_required?: boolean;
  follow_up_required?: boolean;
  follow_up_days?: number;
  follow_up_instructions?: string;
  warning_signs?: string[];
  emergency_instructions?: string;
  estimated_cost?: number;
  insurance_approval_needed?: boolean;
  referral_required?: boolean;
  referral_specialty?: string;
  special_instructions?: string;
  patient_education_provided?: string[];
}

// Extended Visit interface to include consultation
export interface VisitWithConsultation extends Visit {
  consultation_status: ConsultationStatus;
  consultation_sessions?: ConsultationSession[];
}

// Task Management System Types
export type TaskType =
  | "clinical"
  | "administrative"
  | "follow_up"
  | "investigation"
  | "procedure"
  | "medication"
  | "appointment"
  | "documentation"
  | "discharge"
  | "referral";

export type TaskPriority = "low" | "normal" | "high" | "urgent" | "critical";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "overdue";

export type TaskCategory =
  | "patient_care"
  | "administrative"
  | "quality_assurance"
  | "compliance"
  | "education"
  | "research";

export interface AssignedTask {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  // Assignment details
  assigned_by: string;
  assigned_to: string;
  assigned_at: string;
  // Related entities
  patient_id: string | null;
  visit_id: string | null;
  appointment_id: string | null;
  consultation_id: string | null;
  // Timing
  due_date: string | null;
  due_time: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  // Progress tracking
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  // Clinical context
  clinical_context: Record<string, any> | null;
  required_resources: string[] | null;
  prerequisites: string[] | null;
  outcome_notes: string | null;
  quality_check_required: boolean;
  // Metadata
  tags: string[];
  attachments: string[] | null;
  reminders_sent: number;
  last_reminder_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_by_user?: UserProfile;
  assigned_to_user?: UserProfile;
  patient?: Patient;
  visit?: Visit;
  appointment?: Appointment;
  consultation_session?: ConsultationSession;
  subtasks?: TaskSubtask[];
  comments?: TaskComment[];
  attachments_data?: TaskAttachment[];
}

export interface TaskSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_to_user?: UserProfile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  author?: UserProfile;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  // Relations
  uploaded_by_user?: UserProfile;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  task_type: TaskType;
  category: TaskCategory;
  default_priority: TaskPriority;
  estimated_duration_minutes: number | null;
  required_resources: string[] | null;
  prerequisites: string[] | null;
  checklist_template: TaskChecklistItem[] | null;
  tags: string[];
  is_active: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_user?: UserProfile;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  order_index: number;
  // Relations
  completed_by_user?: UserProfile;
}

export interface TaskNotification {
  id: string;
  task_id: string;
  recipient_id: string;
  notification_type:
    | "assignment"
    | "due_soon"
    | "overdue"
    | "completed"
    | "cancelled"
    | "reminder";
  message: string;
  sent_at: string | null;
  read_at: string | null;
  // Relations
  task?: AssignedTask;
  recipient?: UserProfile;
}

export interface TaskRecurrence {
  id: string;
  task_template_id: string;
  recurrence_type:
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "yearly"
    | "custom";
  interval_value: number;
  days_of_week: number[] | null;
  day_of_month: number | null;
  month_of_year: number | null;
  end_type: "never" | "after_count" | "until_date";
  end_count: number | null;
  end_date: string | null;
  is_active: boolean;
  last_generated_at: string | null;
  next_due_date: string | null;
  created_at: string;
}

// Task Management Form Types
export interface TaskCreationForm {
  title: string;
  description?: string;
  task_type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  assigned_to: string;
  patient_id?: string;
  visit_id?: string;
  appointment_id?: string;
  consultation_id?: string;
  due_date?: string;
  due_time?: string;
  estimated_duration_minutes?: number;
  required_resources?: string[];
  prerequisites?: string[];
  tags?: string[];
  quality_check_required?: boolean;
  clinical_context?: Record<string, any>;
}

export interface TaskUpdateForm {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string;
  due_date?: string;
  due_time?: string;
  progress_percentage?: number;
  outcome_notes?: string;
  tags?: string[];
  clinical_context?: Record<string, any>;
}

export interface TaskFilterOptions {
  assigned_to?: string;
  assigned_by?: string;
  task_type?: TaskType;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  patient_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  created_from?: string;
  created_to?: string;
  tags?: string[];
  overdue_only?: boolean;
}

export interface TaskDashboardStats {
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_today: number;
  overdue_tasks: number;
  high_priority_tasks: number;
  my_tasks: number;
  team_tasks: number;
  average_completion_time_hours: number;
  completion_rate_percentage: number;
}
