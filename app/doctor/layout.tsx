import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

interface DoctorLayoutProps {
  children: ReactNode
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <AuthenticatedLayout allowedRoles={['admin', 'doctor']}>
      {children}
    </AuthenticatedLayout>
  )
}