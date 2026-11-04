"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2Icon,
  CreditCardIcon,
  FileTextIcon,
  GlobeIcon,
  KeyRoundIcon,
  MailIcon,
  PaletteIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";

import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  useActiveTenant,
  useTenantContext,
} from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy/use-tenant-href";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();
  const tenantHref = useTenantHref();
  const normalizedPathname = pathname?.replace?.(/^\/w\/[^/]+/, "") ?? "";
  const { activeTenant } = useActiveTenant();
  const { data: tenantContext } = useTenantContext(activeTenant?.id);
  const permissions = tenantContext?.permissions;

  const allTabs = [
    {
      href: "/settings/profile",
      label: "Profile & Account",
      icon: UserIcon,
      active: normalizedPathname === "/settings" || normalizedPathname === "/settings/profile",
      visible: true,
    },
    {
      href: "/settings/workspace",
      label: "Workspace",
      icon: Building2Icon,
      active: normalizedPathname === "/settings/workspace",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_READ),
    },
    {
      href: "/settings/branding",
      label: "Branding & Theme",
      icon: PaletteIcon,
      active: normalizedPathname === "/settings/branding",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/url",
      label: "Domains & URLs",
      icon: GlobeIcon,
      active: normalizedPathname === "/settings/url",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/sso",
      label: "SSO & SCIM",
      icon: KeyRoundIcon,
      active: normalizedPathname === "/settings/sso",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/billing",
      label: "Plans & Billing",
      icon: CreditCardIcon,
      active: normalizedPathname === "/settings/billing",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/email",
      label: "Email (SMTP)",
      icon: MailIcon,
      active: normalizedPathname === "/settings/email" || normalizedPathname === "/settings/smtp",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/security",
      label: "Security & Sessions",
      icon: ShieldIcon,
      active: normalizedPathname === "/settings/security",
      visible: true,
    },
    {
      href: "/settings/audit",
      label: "Audit Logs",
      icon: FileTextIcon,
      active: normalizedPathname === "/settings/audit",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.AUDIT_READ),
    },
    {
      href: "/settings/access",
      label: "Access & Simulator",
      icon: SparklesIcon,
      active: normalizedPathname === "/settings/access",
      visible:
        hasTenantPermission(permissions, TENANT_PERMISSIONS.ROLES_READ) ||
        hasTenantPermission(permissions, TENANT_PERMISSIONS.ACCESS_READ),
    },
  ];

  const tabs = allTabs.filter((t) => t.visible);

  return (
    <nav aria-label="Settings navigation" className="overflow-x-auto pb-1">
      <div className="bg-muted/70 text-muted-foreground border-border/50 inline-flex h-10 w-fit items-center justify-center rounded-lg border p-1 shadow-2xs">
        {tabs?.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tenantHref(tab.href)}
              className={cn(
                "focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
                tab.active
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
