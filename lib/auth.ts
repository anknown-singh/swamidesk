import { createClient } from './supabase/server'
import { createClient as createBrowserClient } from './supabase/client'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'service_attendant' | 'pharmacist'

export interface UserProfile {
  id: string
  role: UserRole
  name: string
  email: string | null
  phone: string | null
  department: string | null
  specialization: string | null
  is_active: boolean
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    user,
    profile: profile as UserProfile
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