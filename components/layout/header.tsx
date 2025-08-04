'use client'

import type { UserProfile } from '@/lib/types'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  userProfile: UserProfile
}

function getRoleDisplayName(role: UserProfile['role']): string {
  const roleNames = {
    admin: 'Administrator',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
    service_attendant: 'Service Attendant',
    pharmacist: 'Pharmacist'
  }
  return roleNames[role]
}

export function Header({ userProfile }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search patients, appointments..."
              className="pl-10 w-80"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userProfile.name}
              </p>
              <p className="text-xs text-gray-500">
                {getRoleDisplayName(userProfile.role)}
              </p>
            </div>
            <div className="bg-gray-200 rounded-full p-2">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}