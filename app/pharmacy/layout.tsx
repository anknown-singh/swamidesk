import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { PharmacyNotificationCenter } from '@/components/notifications/pharmacy-notification-center'

interface PharmacyLayoutProps {
  children: ReactNode
}

export default function PharmacyLayout({ children }: PharmacyLayoutProps) {
  return (
    <AuthenticatedLayout 
      allowedRoles={['admin', 'pharmacist']}
      rightSideActions={<PharmacyNotificationCenter />}
    >
      {children}
    </AuthenticatedLayout>
  )
}