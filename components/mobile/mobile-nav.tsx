'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
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
  UserCheck,
  Package
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<any>
  roles?: string[]
}

const navigationItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home, roles: ['admin'] },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Package, roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  
  { href: '/doctor/dashboard', label: 'Dashboard', icon: Home, roles: ['doctor'] },
  { href: '/doctor/patients', label: 'Patients', icon: Users, roles: ['doctor'] },
  { href: '/doctor/consultations', label: 'Consultations', icon: Stethoscope, roles: ['doctor'] },
  { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText, roles: ['doctor'] },
  { href: '/doctor/settings', label: 'Settings', icon: Settings, roles: ['doctor'] },
  
  { href: '/receptionist/dashboard', label: 'Dashboard', icon: Home, roles: ['receptionist'] },
  { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar, roles: ['receptionist'] },
  { href: '/receptionist/patients', label: 'Patients', icon: Users, roles: ['receptionist'] },
  { href: '/receptionist/billing', label: 'Billing', icon: CreditCard, roles: ['receptionist'] },
  { href: '/receptionist/settings', label: 'Settings', icon: Settings, roles: ['receptionist'] },
  
  { href: '/pharmacy/dashboard', label: 'Dashboard', icon: Home, roles: ['pharmacy'] },
  { href: '/pharmacy/dispensing', label: 'Dispensing', icon: Pill, roles: ['pharmacy'] },
  { href: '/pharmacy/inventory', label: 'Inventory', icon: Package, roles: ['pharmacy'] },
  { href: '/pharmacy/settings', label: 'Settings', icon: Settings, roles: ['pharmacy'] },
  
  { href: '/attendant/dashboard', label: 'Dashboard', icon: Home, roles: ['attendant'] },
  { href: '/attendant/procedures', label: 'Procedures', icon: Activity, roles: ['attendant'] },
  { href: '/attendant/queue', label: 'Queue', icon: UserCheck, roles: ['attendant'] },
  { href: '/attendant/settings', label: 'Settings', icon: Settings, roles: ['attendant'] }
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()

  const userNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  )

  const toggleNav = () => setIsOpen(!isOpen)
  const closeNav = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Navigation Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleNav}
          className="bg-white/90 backdrop-blur-sm border shadow-sm"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={closeNav}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-80 bg-white border-r shadow-xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="font-bold text-lg">SwamIDesk</h2>
                <p className="text-blue-100 text-sm capitalize">
                  {user?.role || 'User'} Portal
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeNav}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="space-y-1">
              {userNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeNav}
                    className={`
                      flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500">SwamIDesk v1.7.0</p>
              <p className="text-xs text-gray-400">Healthcare Management</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}