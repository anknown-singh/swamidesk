export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_doctors',
    'manage_patients',
    'view_all_appointments',
    'manage_appointments',
    'view_analytics',
    'manage_settings',
  ],
  [ROLES.DOCTOR]: [
    'view_own_appointments',
    'manage_own_appointments',
    'view_patient_records',
    'create_medical_records',
    'create_prescriptions',
  ],
  [ROLES.PATIENT]: [
    'view_own_appointments',
    'book_appointments',
    'view_own_medical_records',
    'view_own_prescriptions',
  ],
  [ROLES.RECEPTIONIST]: [
    'manage_appointments',
    'view_patient_info',
    'manage_patient_registration',
    'view_doctor_schedules',
  ],
} as const;

export const DASHBOARD_ROUTES = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.DOCTOR]: '/doctor',
  [ROLES.PATIENT]: '/patient',
  [ROLES.RECEPTIONIST]: '/receptionist',
} as const;