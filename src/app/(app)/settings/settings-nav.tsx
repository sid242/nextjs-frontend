"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2Icon,
  CreditCardIcon,
  MailIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";

import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  useActiveTenant,
  useTenantContext,
} from "@/features/tenants";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();
  const { activeTenant } = useActiveTenant();
  const { data: tenantContext } = useTenantContext(activeTenant?.id);
  const permissions = tenantContext?.permissions;

  const allTabs = [
    {
      href: "/settings/profile",
      label: "Profile & Account",
      icon: UserIcon,
      active: pathname === "/settings" || pathname === "/settings/profile",
      visible: true,
    },
    {
      href: "/settings/workspace",
      label: "Workspace",
      icon: Building2Icon,
      active: pathname === "/settings/workspace",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_READ),
    },
    {
      href: "/settings/branding",
      label: "Branding & Theme",
      icon: PaletteIcon,
      active: pathname === "/settings/branding",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/billing",
      label: "Plans & Billing",
      icon: CreditCardIcon,
      active: pathname === "/settings/billing",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/email",
      label: "Email (SMTP)",
      icon: MailIcon,
      active: pathname === "/settings/email" || pathname === "/settings/smtp",
      visible: hasTenantPermission(permissions, TENANT_PERMISSIONS.TENANTS_UPDATE),
    },
    {
      href: "/settings/security",
      label: "Security & Sessions",
      icon: ShieldIcon,
      active: pathname === "/settings/security",
      visible: true,
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
              href={tab.href}
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
