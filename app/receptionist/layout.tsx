import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

interface ReceptionistLayoutProps {
  children: ReactNode
}

export default function ReceptionistLayout({ children }: ReceptionistLayoutProps) {
  return (
    <AuthenticatedLayout allowedRoles={['admin', 'receptionist']}>
      {children}
    </AuthenticatedLayout>
  )
}