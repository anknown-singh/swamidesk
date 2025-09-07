"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
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
  Home,
  Clock,
  Package,
  CreditCard,
  UserCog,
  ShoppingCart,
  TrendingUp,
  BookOpen,
  GitBranch,
  User,
  LogOut,
} from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  isGlobal?: boolean; // for routes that don't need role prefix
}

const sidebarItems: SidebarItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    roles: ["admin", "doctor", "receptionist", "attendant", "pharmacist"],
  },
  // Calendar for MVP roles (except pharmacist)
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    roles: ["admin", "doctor", "receptionist", "attendant"],
  },
  // Receptionist specific
  {
    href: "/patients",
    label: "Patient Registration",
    icon: Users,
    roles: ["admin", "receptionist"],
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: ClipboardList,
    roles: ["admin", "receptionist"],
  },
  {
    href: "/appointment-management",
    label: "Appointment Status",
    icon: ClipboardList,
    roles: ["admin", "receptionist"],
  },
  {
    href: "/workflow-requests",
    label: "Workflow Requests",
    icon: GitBranch,
    roles: ["admin", "receptionist"],
  },
  // Doctor specific
  {
    href: "/appointment-management",
    label: "My Appointments",
    icon: ClipboardList,
    roles: ["doctor"],
  },
  {
    href: "/workflow",
    label: "Patient Workflow",
    icon: GitBranch,
    roles: ["doctor", "admin"],
  },
  {
    href: "/queue",
    label: "Patient Queue",
    icon: Users,
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    href: "/consultations",
    label: "Consultations",
    icon: Stethoscope,
    roles: ["admin", "doctor"],
  },
  {
    href: "/opd",
    label: "OPD Workflow",
    icon: Activity,
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    href: "/prescriptions",
    label: "Prescriptions",
    icon: FileText,
    roles: ["admin", "doctor"],
  },
  {
    href: "/treatment-plans",
    label: "Treatment Plans",
    icon: ClipboardList,
    roles: ["admin", "doctor"],
  },
  {
    href: "/availability",
    label: "My Availability",
    icon: Clock,
    roles: ["doctor"],
  },
  // Service Attendant specific
  {
    href: "/appointment-management",
    label: "Service Queue",
    icon: UserCog,
    roles: ["attendant"],
  },
  {
    href: "/services",
    label: "Services",
    icon: UserCog,
    roles: ["admin", "attendant"],
  },
  {
    href: "/procedures",
    label: "Procedures",
    icon: Activity,
    roles: ["admin", "attendant"],
  },
  // Pharmacist specific
  {
    href: "/inventory",
    label: "Inventory Management",
    icon: Package,
    roles: ["admin", "pharmacist"],
  },
  {
    href: "/pharmacy/purchase-orders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    roles: ["admin", "pharmacist"],
    isGlobal: true,
  },
  {
    href: "/pharmacy/sell-orders",
    label: "Sell Orders",
    icon: TrendingUp,
    roles: ["admin", "pharmacist"],
    isGlobal: true,
  },
  {
    href: "/pharmacy/medicines",
    label: "Medicines",
    icon: Activity,
    roles: ["admin", "pharmacist"],
    isGlobal: true,
  },
  // Billing & Admin
  {
    href: "/billing",
    label: "Billing & Invoices",
    icon: CreditCard,
    roles: ["admin", "receptionist"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    href: "/users",
    label: "User Management",
    icon: UserCheck,
    roles: ["admin"],
  },
  {
    href: "/doctor-availability",
    label: "Doctor Availability",
    icon: Clock,
    roles: ["admin"],
  },
  {
    href: "/documentation",
    label: "Help & Documentation",
    icon: BookOpen,
    roles: ["admin", "doctor", "receptionist", "attendant", "pharmacist"],
    isGlobal: true,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "doctor", "receptionist", "attendant", "pharmacist"],
  },
];

interface SidebarProps {
  userProfile: UserProfile;
}

function getRoleDisplayName(role: UserProfile["role"]): string {
  const roleNames: Record<UserProfile["role"], string> = {
    admin: "Administrator",
    doctor: "Doctor",
    receptionist: "Receptionist",
    attendant: "Service Attendant",
    service_attendant: "Service Attendant",
    pharmacist: "Pharmacist",
  };
  return roleNames[role];
}

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Normalize role name to match directory structure
  const normalizeRole = (role: string): string => {
    if (role === "service_attendant") return "attendant";
    if (role === "pharmacist") return "pharmacy"; // Special case: pharmacist uses /pharmacy/ directory
    return role;
  };

  const userRole = userProfile.role;
  const normalizedRole = normalizeRole(userProfile.role);
  const allowedItems = sidebarItems.filter((item) =>
    item.roles.includes(userRole as UserRole)
  );

  const baseHref = `/${normalizedRole}`;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Activity className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">SwamiCare</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {allowedItems.map((item) => {
          const href = item.isGlobal ? item.href : `${baseHref}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-200 rounded-full p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {userProfile.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {getRoleDisplayName(userProfile.role)}
            </p>
            {userProfile.department && (
              <p className="text-xs text-gray-500">{userProfile.department}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
