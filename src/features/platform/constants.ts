import {
  Building2,
  FileText,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PLATFORM_PERMISSION_KEYS } from "./permissions";

export interface NavItemConfig {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission: string | string[];
}

export interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  {
    title: "Core & Telemetry",
    items: [
      {
        href: "/platform/dashboard",
        label: "Overview",
        description: "System KPIs, telemetry & operations control",
        icon: LayoutDashboard,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: "/platform/tenants",
        label: "Workspaces",
        description: "Customer organizations, databases & status",
        icon: Building2,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: "/platform/plans",
        label: "Plans & Tiers",
        description: "Multi-tenant tiers, seat limits & quotas",
        icon: Layers,
        permission: PLATFORM_PERMISSION_KEYS.BILLING_READ,
      },
    ],
  },
  {
    title: "Governance & Access",
    items: [
      {
        href: "/platform/staff",
        label: "Staff Directory",
        description: "Manage internal operator accounts & status",
        icon: Users,
        permission: PLATFORM_PERMISSION_KEYS.STAFF_READ,
      },
      {
        href: "/platform/users",
        label: "User Accounts",
        description: "Customer accounts, status & suspension",
        icon: UserCheck,
        permission: PLATFORM_PERMISSION_KEYS.USERS_READ,
      },
      {
        href: "/platform/roles",
        label: "Roles & Matrix",
        description: "System & custom resource::action catalogue",
        icon: ShieldCheck,
        permission: PLATFORM_PERMISSION_KEYS.ROLES_READ,
      },
      {
        href: "/platform/support-sessions",
        label: "Support Sessions",
        description: "Time-bound, audited tenant delegation",
        icon: LifeBuoy,
        permission: [PLATFORM_PERMISSION_KEYS.SUPPORT_START, PLATFORM_PERMISSION_KEYS.SUPPORT_END],
      },
    ],
  },
  {
    title: "Security & Auditing",
    items: [
      {
        href: "/platform/audit-logs",
        label: "Audit Trail",
        description: "Immutable compliance & security logs",
        icon: FileText,
        permission: PLATFORM_PERMISSION_KEYS.AUDIT_READ,
      },
    ],
  },
];
