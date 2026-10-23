"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { useActiveTenant, useTenantBranding } from "../queries";
import { TenantLogo } from "./tenant-logo";

interface TenantBrandProps {
  className?: string;
  showIconOnly?: boolean;
}

/**
 * Clickable brand header linking to /dashboard, displaying the active tenant's dynamic logo.
 */
export function TenantBrand({ className, showIconOnly = false }: TenantBrandProps) {
  const { activeTenant } = useActiveTenant();
  const { data: branding } = useTenantBranding(activeTenant?.id);

  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2.5 font-semibold tracking-tight transition-opacity hover:opacity-85",
        className,
      )}
      aria-label={`${branding?.companyName || activeTenant?.name || "Workspace"} Home`}
    >
      <TenantLogo
        variant={showIconOnly ? "icon" : "full"}
        showName={!showIconOnly}
        tenant={activeTenant}
        branding={branding}
      />
    </Link>
  );
}
