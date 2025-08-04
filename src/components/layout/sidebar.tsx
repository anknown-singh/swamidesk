'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { ROLES } from '@/constants/roles';
import {
  Calendar,
  Users,
  UserCheck,
  Activity,
  Settings,
  FileText,
  Stethoscope,
  ClipboardList,
  BarChart3,
  LogOut,
  Home,
} from 'lucide-react';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT, ROLES.RECEPTIONIST],
  },
  {
    href: '/appointments',
    label: 'Appointments',
    icon: Calendar,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT, ROLES.RECEPTIONIST],
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: Users,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  },
  {
    href: '/doctors',
    label: 'Doctors',
    icon: UserCheck,
    roles: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  },
  {
    href: '/medical-records',
    label: 'Medical Records',
    icon: FileText,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  },
  {
    href: '/prescriptions',
    label: 'Prescriptions',
    icon: Stethoscope,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [ROLES.ADMIN],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: ClipboardList,
    roles: [ROLES.ADMIN, ROLES.DOCTOR],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT, ROLES.RECEPTIONIST],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const userRole = user.role;
  const allowedItems = sidebarItems.filter(item => item.roles.includes(userRole));

  const baseHref = `/${userRole}`;

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Activity className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">SwamIDesk</span>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {allowedItems.map((item) => {
          const href = `${baseHref}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center mb-4">
          <div className="ml-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};