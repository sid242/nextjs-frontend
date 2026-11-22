"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_ROUTES } from "@/config/routes";
import { usePlatformMe } from "@/features/platform";
import { useTenantHref, useTenantUrl } from "@/lib/tenancy";

import { hasTenantPermission } from "../permissions";
import { useActiveTenant, useTenantContext } from "../queries";

interface TenantPermissionGateProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  hideInsteadOfBanner?: boolean;
}

export function TenantPermissionGate({
  permission,
  children,
  fallback,
  hideInsteadOfBanner = false,
}: TenantPermissionGateProps) {
  const tenantHref = useTenantHref();
  const params = useParams();
  const hasPlatformSession = useTenantUrl()?.hasPlatformSession === true;
  const slugFromParam = typeof params?.tenantSlug === "string" ? params.tenantSlug : undefined;
  const { activeTenant, isLoading: tenantLoading } = useActiveTenant();
  const { data: context, isLoading: contextLoading } = useTenantContext(activeTenant?.id);
  const isAllowed = hasTenantPermission(context?.permissions, permission);
  const { data: staff } = usePlatformMe({
    enabled:
      hasPlatformSession &&
      !tenantLoading &&
      !contextLoading &&
      !isAllowed &&
      !fallback &&
      !hideInsteadOfBanner,
  });

  const isLoading = tenantLoading || contextLoading;

  if (isLoading) {
    if (hideInsteadOfBanner) return null;
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (hideInsteadOfBanner) {
    return null;
  }

  const targetSlug = activeTenant?.slug ?? slugFromParam ?? "";
  const targetName = activeTenant?.name ?? (targetSlug ? `"${targetSlug}"` : "this workspace");

  // If the visitor is a Platform Staff operator viewing a customer workspace without active support delegation:
  if (hasPlatformSession && staff?.id) {
    return (
      <div className="bg-card/60 flex min-h-105 flex-col items-center justify-center rounded-2xl border border-indigo-500/30 p-8 text-center shadow-xs">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-500 shadow-xs dark:text-indigo-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Platform Staff Operator &bull; Zero-Standing Customer Privileges
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight">Support Delegation Required</h2>
        <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-relaxed">
          You are signed in as Platform Staff (<strong>{staff.displayName}</strong>). To inspect and
          manage data in <strong>{targetName}</strong>, platform security policy requires an audited
          support delegation session.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
            <Link
              href={
                targetSlug
                  ? `/platform/support?tenant=${encodeURIComponent(targetSlug)}`
                  : "/platform/support"
              }
            >
              <ShieldAlert className="h-4 w-4" />
              Initiate Audited Support Session
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PLATFORM_ROUTES.TENANTS}>Return to Platform Console</Link>
          </Button>
        </div>
      </div>
    );
  }

  const requiredLabel = Array.isArray(permission) ? permission.join(" or ") : permission;

  return (
    <div className="bg-card/40 border-destructive/20 flex min-h-105 flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-xs">
      <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Your role in <strong>{targetName}</strong> does not have the{" "}
        <code className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-xs">
          {requiredLabel}
        </code>{" "}
        permission required to access this resource.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href={tenantHref("/dashboard")}>Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
