import { createClient } from './supabase/server'
import { createClient as createBrowserClient } from './supabase/client'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'

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

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return {
    user,
    profile: {
      id: profile.id,
      role: profile.role as UserRole,
      full_name: profile.full_name || '',
      email: profile.email,
      phone: profile.phone,
      department: profile.department,
      specialization: profile.specialization,
      password_hash: profile.password_hash,
      is_active: profile.is_active,
      created_at: profile.created_at || '',
      updated_at: profile.updated_at || ''
    }
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const { profile } = await requireAuth()
  
  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }
  
  return profile
}

export async function signOut() {
  const supabase = createBrowserClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    admin: 'Administrator',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
    service_attendant: 'Service Attendant',
    pharmacist: 'Pharmacist'
  }
  return roleNames[role]
}

export function getRoleDashboardPath(role: UserRole): string {
  const paths = {
    admin: '/admin',
    doctor: '/doctor',
    receptionist: '/receptionist',
    service_attendant: '/attendant',
    pharmacist: '/pharmacy'
  }
  return paths[role]
}