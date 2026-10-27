"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { hasPlatformPermission } from "../permissions";
import { usePlatformMe } from "../queries";

interface PlatformPermissionGateProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  hideInsteadOfBanner?: boolean;
}

export function PlatformPermissionGate({
  permission,
  children,
  fallback,
  hideInsteadOfBanner = false,
}: PlatformPermissionGateProps) {
  const { data: staff, isLoading } = usePlatformMe();

  if (isLoading) {
    if (hideInsteadOfBanner) return null;
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isAllowed = hasPlatformPermission(staff, permission);

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
    <div className="bg-card/40 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-red-500/20 p-8 text-center shadow-xs">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 shadow-xs">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Your internal platform role (
        <strong>{staff?.roleName ?? staff?.roleKey ?? "Operator"}</strong>) does not have the{" "}
        <code className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-xs">
          {requiredLabel}
        </code>{" "}
        permission required to inspect or administer this operational surface.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/platform/tenants">Go to Workspaces</Link>
        </Button>
      </div>
    </div>
  );
}
