import {
  Building2,
  Database,
  FileText,
  FolderTree,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PLATFORM_ROUTES } from "@/config/routes";

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
        href: PLATFORM_ROUTES.DASHBOARD,
        label: "Overview",
        description: "System KPIs, telemetry & operations control",
        icon: LayoutDashboard,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: PLATFORM_ROUTES.TENANTS,
        label: "Workspaces",
        description: "Customer organizations, databases & status",
        icon: Building2,
        permission: PLATFORM_PERMISSION_KEYS.TENANTS_READ,
      },
      {
        href: PLATFORM_ROUTES.DATABASE_OPERATIONS,
        label: "Database Operations",
        description: "Provisioning, dedicated migration & schema health",
        icon: Database,
        permission: PLATFORM_PERMISSION_KEYS.HEALTH_READ,
      },
      {
        href: PLATFORM_ROUTES.PLANS,
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
        href: PLATFORM_ROUTES.STAFF,
        label: "Staff Directory",
        description: "Manage internal operator accounts & status",
        icon: Users,
        permission: PLATFORM_PERMISSION_KEYS.STAFF_READ,
      },
      {
        href: PLATFORM_ROUTES.GROUPS,
        label: "Staff Groups",
        description: "Staff user groups and operator teams",
        icon: FolderTree,
        permission: PLATFORM_PERMISSION_KEYS.GROUPS_READ,
      },
      {
        href: PLATFORM_ROUTES.USERS,
        label: "User Accounts",
        description: "Customer accounts, status & suspension",
        icon: UserCheck,
        permission: PLATFORM_PERMISSION_KEYS.USERS_READ,
      },
      {
        href: PLATFORM_ROUTES.ROLES,
        label: "Roles & Matrix",
        description: "System & custom resource:action catalogue",
        icon: ShieldCheck,
        permission: PLATFORM_PERMISSION_KEYS.ROLES_READ,
      },
      {
        href: PLATFORM_ROUTES.POLICIES,
        label: "Access Policies",
        description: "Dynamic PBAC attribute policies for operators",
        icon: Shield,
        permission: PLATFORM_PERMISSION_KEYS.ROLES_READ,
      },
      {
        href: PLATFORM_ROUTES.SUPPORT_SESSIONS,
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
        href: PLATFORM_ROUTES.AUDIT_LOGS,
        label: "Audit Trail",
        description: "Immutable compliance & security logs",
        icon: FileText,
        permission: PLATFORM_PERMISSION_KEYS.AUDIT_READ,
      },
    ],
  },
];
