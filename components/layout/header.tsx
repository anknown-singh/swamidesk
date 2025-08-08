'use client'

import type { UserProfile } from '@/lib/types'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { GlobalSearch } from '@/components/search/global-search'

interface HeaderProps {
  userProfile: UserProfile
}

function getRoleDisplayName(role: UserProfile['role']): string {
  const roleNames: Record<UserProfile['role'], string> = {
    admin: 'Administrator',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
    attendant: 'Service Attendant',
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
          <GlobalSearch userProfile={userProfile} />
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationCenter 
            userId={userProfile.id} 
            userRole={userProfile.role}
          />
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userProfile.full_name}
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