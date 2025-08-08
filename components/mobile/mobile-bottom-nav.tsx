'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  Stethoscope,
  Pill,
  Activity,
  CreditCard,
  BarChart3,
  Package
} from 'lucide-react'

interface BottomNavItem {
  href: string
  label: string
  icon: React.ComponentType<any>
  badge?: number
  roles?: string[]
}

const navigationItems: BottomNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home, roles: ['admin'] },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Package, roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  
  { href: '/doctor/dashboard', label: 'Dashboard', icon: Home, roles: ['doctor'] },
  { href: '/doctor/patients', label: 'Patients', icon: Users, roles: ['doctor'] },
  { href: '/doctor/consultations', label: 'Consult', icon: Stethoscope, roles: ['doctor'] },
  { href: '/doctor/settings', label: 'Settings', icon: Settings, roles: ['doctor'] },
  
  { href: '/receptionist/dashboard', label: 'Dashboard', icon: Home, roles: ['receptionist'] },
  { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar, roles: ['receptionist'] },
  { href: '/receptionist/patients', label: 'Patients', icon: Users, roles: ['receptionist'] },
  { href: '/receptionist/billing', label: 'Billing', icon: CreditCard, roles: ['receptionist'] },
  
  { href: '/pharmacy/dashboard', label: 'Dashboard', icon: Home, roles: ['pharmacy'] },
  { href: '/pharmacy/dispensing', label: 'Dispensing', icon: Pill, roles: ['pharmacy'] },
  { href: '/pharmacy/inventory', label: 'Inventory', icon: Package, roles: ['pharmacy'] },
  { href: '/pharmacy/settings', label: 'Settings', icon: Settings, roles: ['pharmacy'] },
  
  { href: '/attendant/dashboard', label: 'Dashboard', icon: Home, roles: ['attendant'] },
  { href: '/attendant/procedures', label: 'Procedures', icon: Activity, roles: ['attendant'] },
  { href: '/attendant/settings', label: 'Settings', icon: Settings, roles: ['attendant'] }
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const userNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  ).slice(0, 4) // Show max 4 items in bottom nav

  if (!user || userNavItems.length === 0) {
    return null
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
      <nav className="flex">
        {userNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors relative",
                "min-h-[64px] active:bg-gray-100",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
              
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-blue-600" : "text-gray-400"
                )} />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              
              <span className={cn(
                "truncate max-w-full",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

interface MobileBottomNavPlaceholderProps {
  className?: string
}

export function MobileBottomNavPlaceholder({ className }: MobileBottomNavPlaceholderProps) {
  return (
    <div className={cn("lg:hidden h-16", className)} />
  )
}