export type NavIcon =
  | "layout-dashboard"
  | "users"
  | "shield-check"
  | "palette"
  | "mail"
  | "folder"
  | "scroll-text"
  | "settings"
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
            permission: "members:read",
          },
          {
            title: "Roles & Permissions",
            href: "/roles",
            icon: "shield-check",
            permission: "roles:read",
          },
        ],
      },
      {
        title: "Files",
        href: "/files",
        icon: "folder",
        permission: "files:read",
      },
      {
        title: "Email Templates",
        href: "/email-templates",
        icon: "mail",
        permission: "tenants:read",
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
        permission: "audit:read",
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
    { title: "Roles & Permissions", href: "/roles", icon: "shield-check" as const },
    { title: "Files", href: "/files", icon: "folder" as const },
    { title: "Email Templates", href: "/email-templates", icon: "mail" as const },
    { title: "Audit Logs", href: "/audit-logs", icon: "scroll-text" as const },
    { title: "Settings", href: "/settings", icon: "settings" as const },
  ],
} as const;
