"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { activeTenant, isLoading: tenantLoading } = useActiveTenant();
  const { data: context, isLoading: contextLoading } = useTenantContext(activeTenant?.id);

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

  const isAllowed = hasTenantPermission(context?.permissions, permission);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (hideInsteadOfBanner) {
    return null;
  }

  const requiredLabel = Array.isArray(permission) ? permission.join(" or ") : permission;

  return (
    <div className="bg-card/40 border-destructive/20 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-xs">
      <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Your role in <strong>{activeTenant?.name ?? "this workspace"}</strong> does not have the{" "}
        <code className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-xs">
          {requiredLabel}
        </code>{" "}
        permission required to access this resource.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
