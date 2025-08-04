import { ReactNode } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthenticatedLayout allowedRoles={['admin']}>
      {children}
    </AuthenticatedLayout>
  )
}