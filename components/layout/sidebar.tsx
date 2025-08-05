'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserProfile, UserRole } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar,
  Users,
  UserCheck,
  Activity,
  Settings,
  FileText,
  Stethoscope,
  ClipboardList,
  BarChart3,
  LogOut,
  Home,
  Clock,
  Package,
  CreditCard,
  UserCog,
  Pill,
  ShoppingCart,
} from 'lucide-react'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'],
  },
  // Receptionist specific
  {
    href: '/patients',
    label: 'Patient Registration',
    icon: Users,
    roles: ['admin', 'receptionist'],
  },
  {
    href: '/queue',
    label: 'Queue Management',
    icon: Clock,
    roles: ['admin', 'receptionist'],
  },
  // Doctor specific
  {
    href: '/consultations',
    label: 'Consultations',
    icon: Stethoscope,
    roles: ['admin', 'doctor'],
  },
  {
    href: '/prescriptions',
    label: 'Prescriptions',
    icon: FileText,
    roles: ['admin', 'doctor'],
  },
  {
    href: '/treatment-plans',
    label: 'Treatment Plans',
    icon: Calendar,
    roles: ['admin', 'doctor'],
  },
  // Service Attendant specific
  {
    href: '/services',
    label: 'Service Queue',
    icon: UserCog,
    roles: ['admin', 'attendant'],
  },
  {
    href: '/procedures',
    label: 'Procedures',
    icon: Activity,
    roles: ['admin', 'attendant'],
  },
  // Pharmacist specific
  {
    href: '/pharmacy',
    label: 'Pharmacy Queue',
    icon: Pill,
    roles: ['admin', 'pharmacist'],
  },
  {
    href: '/inventory',
    label: 'Inventory',
    icon: Package,
    roles: ['admin', 'pharmacist'],
  },
  {
    href: '/medicines',
    label: 'Medicine Master',
    icon: ShoppingCart,
    roles: ['admin', 'pharmacist'],
  },
  // Billing & Admin
  {
    href: '/billing',
    label: 'Billing & Invoices',
    icon: CreditCard,
    roles: ['admin', 'receptionist'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: ClipboardList,
    roles: ['admin'],
  },
  {
    href: '/users',
    label: 'User Management',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'doctor', 'receptionist', 'attendant', 'pharmacist'],
  },
]

interface SidebarProps {
  userProfile: UserProfile
}

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Normalize role name to match directory structure
  const normalizeRole = (role: string): string => {
    if (role === 'service_attendant') return 'attendant'
    return role
  }
  
  const userRole = normalizeRole(userProfile.role)
  const allowedItems = sidebarItems.filter(item => item.roles.includes(userRole as UserRole))

  const baseHref = `/${userRole}`
  
  // Comprehensive debugging
  console.log('Sidebar Debug Info:', {
    originalRole: userProfile.role,
    normalizedRole: userRole,
    baseHref,
    allowedItemsCount: allowedItems.length,
    currentPath: pathname,
    userProfile: userProfile,
    allowedItems: allowedItems.map(item => ({
      href: item.href,
      label: item.label,
      fullHref: `${baseHref}${item.href}`,
      roles: item.roles
    }))
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Activity className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">SwamiCare</span>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {allowedItems.map((item) => {
          const href = `${baseHref}${item.href}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={href}
              onClick={() => {
                console.log(`Sidebar navigation: ${item.label} -> ${href}`)
                if (item.label === 'Billing & Invoices') {
                  console.log('Billing link clicked!', { userRole, href, pathname })
                }
              }}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center mb-4">
          <div className="ml-2">
            <p className="text-sm font-medium">{userProfile.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {userProfile.role.replace('_', ' ')}
            </p>
            {userProfile.department && (
              <p className="text-xs text-muted-foreground">
                {userProfile.department}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}