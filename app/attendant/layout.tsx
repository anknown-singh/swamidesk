import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

interface AttendantLayoutProps {
  children: ReactNode
}

export default function AttendantLayout({ children }: AttendantLayoutProps) {
  return (
    <AuthenticatedLayout allowedRoles={['admin', 'service_attendant']}>
      {children}
    </AuthenticatedLayout>
  )
}