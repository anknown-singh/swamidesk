'use client'

import { createClient } from '@/lib/supabase/client'

// Define permission categories and specific permissions
export interface Permission {
  id: string
  name: string
  description: string
  category: PermissionCategory
  level: PermissionLevel
}

export enum PermissionCategory {
  PATIENTS = 'patients',
  APPOINTMENTS = 'appointments',
  PRESCRIPTIONS = 'prescriptions',
  BILLING = 'billing',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USERS = 'users',
  AUDIT = 'audit',
  SYSTEM = 'system'
}

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: string
  expiresAt?: string
}

// Comprehensive permissions definition
export const PERMISSIONS: Record<string, Permission> = {
  // Patient Management
  'patients:read': {
    id: 'patients:read',
    name: 'View Patients',
    description: 'View patient information and medical records',
    category: PermissionCategory.PATIENTS,
    level: PermissionLevel.READ
  },
  'patients:write': {
    id: 'patients:write',
    name: 'Manage Patients',
    description: 'Create and update patient records',
    category: PermissionCategory.PATIENTS,
    level: PermissionLevel.WRITE
  },
  'patients:delete': {
    id: 'patients:delete',
    name: 'Delete Patients',
    description: 'Delete patient records (archive)',
    category: PermissionCategory.PATIENTS,
    level: PermissionLevel.DELETE
  },
  'patients:sensitive': {
    id: 'patients:sensitive',
    name: 'View Sensitive Data',
    description: 'Access sensitive patient information',
    category: PermissionCategory.PATIENTS,
    level: PermissionLevel.ADMIN
  },

  // Appointment Management
  'appointments:read': {
    id: 'appointments:read',
    name: 'View Appointments',
    description: 'View appointment schedules and details',
    category: PermissionCategory.APPOINTMENTS,
    level: PermissionLevel.READ
  },
  'appointments:write': {
    id: 'appointments:write',
    name: 'Manage Appointments',
    description: 'Create, update, and reschedule appointments',
    category: PermissionCategory.APPOINTMENTS,
    level: PermissionLevel.WRITE
  },
  'appointments:cancel': {
    id: 'appointments:cancel',
    name: 'Cancel Appointments',
    description: 'Cancel and delete appointments',
    category: PermissionCategory.APPOINTMENTS,
    level: PermissionLevel.DELETE
  },
  'appointments:all': {
    id: 'appointments:all',
    name: 'View All Appointments',
    description: 'View appointments for all doctors',
    category: PermissionCategory.APPOINTMENTS,
    level: PermissionLevel.ADMIN
  },

  // Prescription Management
  'prescriptions:read': {
    id: 'prescriptions:read',
    name: 'View Prescriptions',
    description: 'View prescription details and history',
    category: PermissionCategory.PRESCRIPTIONS,
    level: PermissionLevel.READ
  },
  'prescriptions:write': {
    id: 'prescriptions:write',
    name: 'Create Prescriptions',
    description: 'Create and modify prescriptions',
    category: PermissionCategory.PRESCRIPTIONS,
    level: PermissionLevel.WRITE
  },
  'prescriptions:dispense': {
    id: 'prescriptions:dispense',
    name: 'Dispense Medications',
    description: 'Dispense medications and update inventory',
    category: PermissionCategory.PRESCRIPTIONS,
    level: PermissionLevel.WRITE
  },
  'prescriptions:controlled': {
    id: 'prescriptions:controlled',
    name: 'Controlled Substances',
    description: 'Prescribe and dispense controlled substances',
    category: PermissionCategory.PRESCRIPTIONS,
    level: PermissionLevel.ADMIN
  },

  // Billing & Financial
  'billing:read': {
    id: 'billing:read',
    name: 'View Billing',
    description: 'View invoices and payment information',
    category: PermissionCategory.BILLING,
    level: PermissionLevel.READ
  },
  'billing:write': {
    id: 'billing:write',
    name: 'Manage Billing',
    description: 'Create invoices and process payments',
    category: PermissionCategory.BILLING,
    level: PermissionLevel.WRITE
  },
  'billing:financial': {
    id: 'billing:financial',
    name: 'Financial Reports',
    description: 'Access financial reports and revenue data',
    category: PermissionCategory.BILLING,
    level: PermissionLevel.ADMIN
  },
  'billing:refunds': {
    id: 'billing:refunds',
    name: 'Process Refunds',
    description: 'Process refunds and adjustments',
    category: PermissionCategory.BILLING,
    level: PermissionLevel.ADMIN
  },

  // Inventory Management
  'inventory:read': {
    id: 'inventory:read',
    name: 'View Inventory',
    description: 'View medicine stock and inventory levels',
    category: PermissionCategory.INVENTORY,
    level: PermissionLevel.READ
  },
  'inventory:write': {
    id: 'inventory:write',
    name: 'Manage Inventory',
    description: 'Update stock levels and manage inventory',
    category: PermissionCategory.INVENTORY,
    level: PermissionLevel.WRITE
  },
  'inventory:purchase': {
    id: 'inventory:purchase',
    name: 'Purchase Orders',
    description: 'Create purchase orders and manage suppliers',
    category: PermissionCategory.INVENTORY,
    level: PermissionLevel.ADMIN
  },
  'inventory:audit': {
    id: 'inventory:audit',
    name: 'Inventory Audit',
    description: 'Perform inventory audits and adjustments',
    category: PermissionCategory.INVENTORY,
    level: PermissionLevel.ADMIN
  },

  // Reports & Analytics
  'reports:basic': {
    id: 'reports:basic',
    name: 'Basic Reports',
    description: 'Generate basic operational reports',
    category: PermissionCategory.REPORTS,
    level: PermissionLevel.READ
  },
  'reports:advanced': {
    id: 'reports:advanced',
    name: 'Advanced Analytics',
    description: 'Access advanced analytics and dashboards',
    category: PermissionCategory.REPORTS,
    level: PermissionLevel.WRITE
  },
  'reports:export': {
    id: 'reports:export',
    name: 'Export Data',
    description: 'Export reports and data to external formats',
    category: PermissionCategory.REPORTS,
    level: PermissionLevel.ADMIN
  },

  // User & Role Management
  'users:read': {
    id: 'users:read',
    name: 'View Users',
    description: 'View user accounts and basic information',
    category: PermissionCategory.USERS,
    level: PermissionLevel.READ
  },
  'users:write': {
    id: 'users:write',
    name: 'Manage Users',
    description: 'Create and update user accounts',
    category: PermissionCategory.USERS,
    level: PermissionLevel.WRITE
  },
  'users:roles': {
    id: 'users:roles',
    name: 'Assign Roles',
    description: 'Assign and manage user roles',
    category: PermissionCategory.USERS,
    level: PermissionLevel.ADMIN
  },
  'users:security': {
    id: 'users:security',
    name: 'Security Management',
    description: 'Manage security settings and MFA',
    category: PermissionCategory.USERS,
    level: PermissionLevel.ADMIN
  },

  // System Settings
  'settings:read': {
    id: 'settings:read',
    name: 'View Settings',
    description: 'View system configuration and settings',
    category: PermissionCategory.SETTINGS,
    level: PermissionLevel.READ
  },
  'settings:write': {
    id: 'settings:write',
    name: 'Modify Settings',
    description: 'Modify system configuration and settings',
    category: PermissionCategory.SETTINGS,
    level: PermissionLevel.WRITE
  },
  'settings:system': {
    id: 'settings:system',
    name: 'System Configuration',
    description: 'Access critical system configuration',
    category: PermissionCategory.SETTINGS,
    level: PermissionLevel.ADMIN
  },

  // Audit & Security
  'audit:read': {
    id: 'audit:read',
    name: 'View Audit Logs',
    description: 'View system audit logs and activities',
    category: PermissionCategory.AUDIT,
    level: PermissionLevel.READ
  },
  'audit:export': {
    id: 'audit:export',
    name: 'Export Audit Logs',
    description: 'Export audit logs for compliance',
    category: PermissionCategory.AUDIT,
    level: PermissionLevel.ADMIN
  },

  // System Administration
  'system:backup': {
    id: 'system:backup',
    name: 'System Backup',
    description: 'Manage system backups and restores',
    category: PermissionCategory.SYSTEM,
    level: PermissionLevel.ADMIN
  },
  'system:maintenance': {
    id: 'system:maintenance',
    name: 'System Maintenance',
    description: 'Perform system maintenance tasks',
    category: PermissionCategory.SYSTEM,
    level: PermissionLevel.ADMIN
  },
  'system:api': {
    id: 'system:api',
    name: 'API Management',
    description: 'Manage API keys and integrations',
    category: PermissionCategory.SYSTEM,
    level: PermissionLevel.ADMIN
  }
}

// Predefined system roles
export const SYSTEM_ROLES: Record<string, Omit<Role, 'id' | 'createdAt' | 'updatedAt'>> = {
  'super_admin': {
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: Object.keys(PERMISSIONS),
    isSystem: true
  },
  'admin': {
    name: 'Administrator',
    description: 'Administrative access to most system functions',
    permissions: [
      'patients:read', 'patients:write', 'patients:sensitive',
      'appointments:read', 'appointments:write', 'appointments:all',
      'prescriptions:read', 'prescriptions:write',
      'billing:read', 'billing:write', 'billing:financial',
      'inventory:read', 'inventory:write', 'inventory:purchase',
      'reports:basic', 'reports:advanced', 'reports:export',
      'users:read', 'users:write', 'users:roles',
      'settings:read', 'settings:write',
      'audit:read'
    ],
    isSystem: true
  },
  'doctor': {
    name: 'Doctor',
    description: 'Medical practitioner with patient care permissions',
    permissions: [
      'patients:read', 'patients:write', 'patients:sensitive',
      'appointments:read', 'appointments:write',
      'prescriptions:read', 'prescriptions:write', 'prescriptions:controlled',
      'billing:read',
      'inventory:read',
      'reports:basic'
    ],
    isSystem: true
  },
  'nurse': {
    name: 'Nurse',
    description: 'Nursing staff with patient care support permissions',
    permissions: [
      'patients:read', 'patients:write',
      'appointments:read', 'appointments:write',
      'prescriptions:read',
      'inventory:read',
      'reports:basic'
    ],
    isSystem: true
  },
  'receptionist': {
    name: 'Receptionist',
    description: 'Front desk staff with appointment and basic patient management',
    permissions: [
      'patients:read', 'patients:write',
      'appointments:read', 'appointments:write', 'appointments:cancel',
      'billing:read', 'billing:write',
      'reports:basic'
    ],
    isSystem: true
  },
  'pharmacist': {
    name: 'Pharmacist',
    description: 'Pharmacy staff with medication dispensing permissions',
    permissions: [
      'patients:read',
      'prescriptions:read', 'prescriptions:dispense', 'prescriptions:controlled',
      'inventory:read', 'inventory:write', 'inventory:audit',
      'billing:read',
      'reports:basic'
    ],
    isSystem: true
  },
  'pharmacy_assistant': {
    name: 'Pharmacy Assistant',
    description: 'Pharmacy support staff with limited dispensing permissions',
    permissions: [
      'patients:read',
      'prescriptions:read', 'prescriptions:dispense',
      'inventory:read', 'inventory:write',
      'reports:basic'
    ],
    isSystem: true
  },
  'billing_clerk': {
    name: 'Billing Clerk',
    description: 'Billing and payment processing specialist',
    permissions: [
      'patients:read',
      'appointments:read',
      'billing:read', 'billing:write',
      'reports:basic'
    ],
    isSystem: true
  },
  'attendant': {
    name: 'Service Attendant',
    description: 'Support staff for procedures and services',
    permissions: [
      'patients:read',
      'appointments:read',
      'inventory:read',
      'reports:basic'
    ],
    isSystem: true
  }
}

// RBAC Service Class
export class RBACService {
  private static instance: RBACService
  
  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService()
    }
    return RBACService.instance
  }

  // Check if user has specific permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return userPermissions.includes(permission)
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return permissions.some(permission => userPermissions.includes(permission))
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  // Check if user has all specified permissions
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      return permissions.every(permission => userPermissions.includes(permission))
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  // Get all permissions for a user
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const supabase = createClient()
      
      // Get user's roles and their permissions
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner(
            id,
            permissions,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        throw error
      }

      // Flatten all permissions from all roles
      const allPermissions = new Set<string>()
      
      userRoles?.forEach((userRole: any) => {
        const role = userRole.roles
        if (role && role.is_active && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission: string) => {
            allPermissions.add(permission)
          })
        }
      })

      return Array.from(allPermissions)
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  // Get user's roles
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const supabase = createClient()
      
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        throw error
      }

      return userRoles?.map((ur: any) => ur.roles).filter(role => role) || []
    } catch (error) {
      console.error('Error getting user roles:', error)
      return []
    }
  }

  // Assign role to user
  async assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Check if role assignment already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .single()

      if (existing) {
        throw new Error('User already has this role')
      }

      // Create role assignment
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true
        })

      if (error) {
        throw error
      }

      // Log the role assignment
      await this.logSecurityEvent(assignedBy, 'role_assigned', {
        userId,
        roleId,
        expiresAt
      })

      return true
    } catch (error) {
      console.error('Error assigning role:', error)
      return false
    }
  }

  // Remove role from user
  async removeRole(userId: string, roleId: string, removedBy: string): Promise<boolean> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('user_roles')
        .update({
          is_active: false,
          removed_by: removedBy,
          removed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)

      if (error) {
        throw error
      }

      // Log the role removal
      await this.logSecurityEvent(removedBy, 'role_removed', {
        userId,
        roleId
      })

      return true
    } catch (error) {
      console.error('Error removing role:', error)
      return false
    }
  }

  // Create custom role
  async createRole(name: string, description: string, permissions: string[], createdBy: string): Promise<string | null> {
    try {
      const supabase = createClient()

      // Validate permissions
      const invalidPermissions = permissions.filter(p => !PERMISSIONS[p])
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`)
      }

      const { data: role, error } = await supabase
        .from('roles')
        .insert({
          name,
          description,
          permissions,
          is_system: false,
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      // Log role creation
      await this.logSecurityEvent(createdBy, 'role_created', {
        roleId: role.id,
        name,
        permissions
      })

      return role.id
    } catch (error) {
      console.error('Error creating role:', error)
      return null
    }
  }

  // Update role permissions
  async updateRolePermissions(roleId: string, permissions: string[], updatedBy: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Validate permissions
      const invalidPermissions = permissions.filter(p => !PERMISSIONS[p])
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`)
      }

      // Check if role is system role (cannot be modified)
      const { data: role } = await supabase
        .from('roles')
        .select('is_system, name')
        .eq('id', roleId)
        .single()

      if (role?.is_system) {
        throw new Error('Cannot modify system roles')
      }

      const { error } = await supabase
        .from('roles')
        .update({
          permissions,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)

      if (error) {
        throw error
      }

      // Log role update
      await this.logSecurityEvent(updatedBy, 'role_updated', {
        roleId,
        permissions
      })

      return true
    } catch (error) {
      console.error('Error updating role:', error)
      return false
    }
  }

  // Get all available roles
  async getAllRoles(): Promise<Role[]> {
    try {
      const supabase = createClient()

      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      return roles || []
    } catch (error) {
      console.error('Error getting roles:', error)
      return []
    }
  }

  // Initialize system roles (run once on system setup)
  async initializeSystemRoles(): Promise<void> {
    try {
      const supabase = createClient()

      for (const [key, roleData] of Object.entries(SYSTEM_ROLES)) {
        // Check if role already exists
        const { data: existing } = await supabase
          .from('roles')
          .select('id')
          .eq('name', roleData.name)
          .single()

        if (!existing) {
          await supabase
            .from('roles')
            .insert({
              name: roleData.name,
              description: roleData.description,
              permissions: roleData.permissions,
              is_system: roleData.isSystem,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
      }
    } catch (error) {
      console.error('Error initializing system roles:', error)
    }
  }

  // Resource-based access control
  async canAccessResource(userId: string, resource: string, action: string, resourceId?: string): Promise<boolean> {
    const permission = `${resource}:${action}`
    
    // Check basic permission first
    const hasBasicPermission = await this.hasPermission(userId, permission)
    if (!hasBasicPermission) {
      return false
    }

    // Additional resource-specific checks
    if (resourceId) {
      return await this.checkResourceOwnership(userId, resource, resourceId, action)
    }

    return true
  }

  // Check resource ownership or context-specific access
  private async checkResourceOwnership(userId: string, resource: string, resourceId: string, action: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // For patient records, doctors can only access their own patients (unless they have admin permissions)
      if (resource === 'patients' && action === 'read') {
        const hasAdminAccess = await this.hasPermission(userId, 'patients:sensitive')
        if (hasAdminAccess) {
          return true
        }

        // Check if doctor has treated this patient
        const { data } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', userId)
          .eq('patient_id', resourceId)
          .limit(1)

        return data && data.length > 0
      }

      // For appointments, users can access appointments they're involved in
      if (resource === 'appointments') {
        const hasAllAppointments = await this.hasPermission(userId, 'appointments:all')
        if (hasAllAppointments) {
          return true
        }

        const { data } = await supabase
          .from('appointments')
          .select('id')
          .eq('id', resourceId)
          .or(`doctor_id.eq.${userId},created_by.eq.${userId}`)
          .limit(1)

        return data && data.length > 0
      }

      return true
    } catch (error) {
      console.error('Error checking resource ownership:', error)
      return false
    }
  }

  // Log security events
  private async logSecurityEvent(userId: string, event: string, metadata?: any): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('security_audit_log').insert({
        user_id: userId,
        event_type: event,
        event_data: metadata,
        ip_address: '127.0.0.1', // Would be actual IP in production
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance()

// Helper functions for React components
import { useState, useEffect } from 'react'

export function usePermission(userId: string, permission: string) {
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && permission) {
      rbacService.hasPermission(userId, permission)
        .then(setHasPermission)
        .finally(() => setLoading(false))
    }
  }, [userId, permission])

  return { hasPermission, loading }
}

export function usePermissions(userId: string, permissions: string[]) {
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      rbacService.getUserPermissions(userId)
        .then(setUserPermissions)
        .finally(() => setLoading(false))
    }
  }, [userId])

  return {
    permissions: userPermissions,
    hasPermission: (permission: string) => userPermissions.includes(permission),
    hasAnyPermission: (perms: string[]) => perms.some(p => userPermissions.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every(p => userPermissions.includes(p)),
    loading
  }
}