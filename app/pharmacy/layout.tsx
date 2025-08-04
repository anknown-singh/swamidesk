import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

interface PharmacyLayoutProps {
  children: ReactNode
}

export default function PharmacyLayout({ children }: PharmacyLayoutProps) {
  return (
    <AuthenticatedLayout allowedRoles={['admin', 'pharmacist']}>
      {children}
    </AuthenticatedLayout>
  )
}