import { WORKSPACE_MODULES, type WorkspaceModuleKey } from "./optional-modules";
import { TENANT_PERMISSIONS } from "./permissions";

export type NavIcon =
  | "layout-dashboard"
  | "bar-chart"
  | "users"
  | "shield-check"
  | "palette"
  | "mail"
  | "folder"
  | "message-square"
  | "scroll-text"
  | "settings"
  | "life-buoy"
  | "circle";

export interface NavItem {
  title: string;
  href?: string;
  icon?: NavIcon;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
  permission?: string | string[];
  module?: WorkspaceModuleKey;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "layout-dashboard",
      },
      {
        title: "Analytics & Reports",
        href: "/analytics",
        icon: "bar-chart",
        permission: TENANT_PERMISSIONS.ANALYTICS_READ,
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "Team & Access",
        icon: "users",
        items: [
          {
            title: "Members",
            href: "/team",
            permission: TENANT_PERMISSIONS.MEMBERS_READ,
          },
          {
            title: "User Groups",
            href: "/groups",
            icon: "users",
            permission: TENANT_PERMISSIONS.GROUPS_READ,
          },
          {
            title: "Roles & Permissions",
            href: "/roles",
            icon: "shield-check",
            permission: TENANT_PERMISSIONS.ROLES_READ,
          },
          {
            title: "Access Policies",
            href: "/policies",
            icon: "shield-check",
            permission: TENANT_PERMISSIONS.POLICIES_READ,
          },
        ],
      },
      ...Object.values(WORKSPACE_MODULES).map(({ navigation }) => navigation),
      {
        title: "Team Chat",
        href: "/chat",
        icon: "message-square",
        permission: TENANT_PERMISSIONS.CHAT_READ,
      },
      {
        title: "Files",
        href: "/files",
        icon: "folder",
        permission: TENANT_PERMISSIONS.FILES_READ,
      },
      {
        title: "Email Templates",
        href: "/email-templates",
        icon: "mail",
        permission: TENANT_PERMISSIONS.TENANTS_READ,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Audit Logs",
        href: "/audit-logs",
        icon: "scroll-text",
        permission: TENANT_PERMISSIONS.AUDIT_READ,
      },
      {
        title: "Help & Support",
        href: "/support",
        icon: "life-buoy",
        permission: TENANT_PERMISSIONS.SUPPORT_READ,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: "settings",
      },
    ],
  },
];

export const siteConfig = {
  name: "Foundation",
  description: "A scalable Next.js application foundation.",
  navSections,
  // Backward compatibility flat list
  nav: [
    { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" as const },
    { title: "Team", href: "/team", icon: "users" as const },
    { title: "User Groups", href: "/groups", icon: "folder" as const },
    { title: "Roles & Permissions", href: "/roles", icon: "shield-check" as const },
    { title: "Files", href: "/files", icon: "folder" as const },
    { title: "Email Templates", href: "/email-templates", icon: "mail" as const },
    { title: "Audit Logs", href: "/audit-logs", icon: "scroll-text" as const },
    { title: "Settings", href: "/settings", icon: "settings" as const },
  ],
} as const;
