"use client";

import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileUp,
  Palette,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { TENANT_PATHS } from "@/config/routes";
import { useTenantSubscription } from "@/features/plans";
import { hasTenantPermission, useActiveTenant, useTenantContext } from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy/use-tenant-href";

const shortcuts = [
  {
    title: "Invite a teammate",
    path: TENANT_PATHS.TEAM,
    icon: UserPlus,
    permission: TENANT_PERMISSIONS.MEMBERS_INVITE,
  },
  {
    title: "Upload files",
    path: TENANT_PATHS.FILES,
    icon: FileUp,
    permission: TENANT_PERMISSIONS.FILES_UPLOAD,
  },
  {
    title: "Edit branding",
    path: TENANT_PATHS.SETTINGS_BRANDING,
    icon: Palette,
    permission: TENANT_PERMISSIONS.TENANTS_UPDATE,
  },
  {
    title: "View audit log",
    path: TENANT_PATHS.AUDIT_LOGS,
    icon: ShieldCheck,
    permission: TENANT_PERMISSIONS.AUDIT_READ,
  },
];

export function DashboardWidgets() {
  const tenantHref = useTenantHref();
  const { activeTenantId } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenantId);
  const { data: subscription, isPending, isError } = useTenantSubscription();
  const plan = subscription?.plan;
  const usage = subscription?.usage;
  const seats = usage?.occupiedSeats ?? usage?.activeMembers ?? 0;
  const seatLimit = usage?.maxMembers;
  const capacityPercentage = seatLimit ? Math.min(100, (seats / seatLimit) * 100) : 0;
  const price = plan
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: plan.currency }).format(
        plan.priceCents / 100,
      )
    : null;
  const interval = plan?.billingInterval === "ANNUAL" ? "year" : "month";

  if (isPending) {
    return <Skeleton aria-label="Loading workspace subscription" className="h-32 rounded-2xl" />;
  }

  if (isError || !subscription || !usage) {
    return (
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardTitle>Workspace subscription</CardTitle>
          <CardDescription>
            {isError
              ? "Subscription details are temporarily unavailable."
              : "No subscription is assigned."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center justify-between gap-2">
            Team capacity <Users aria-hidden="true" className="size-4" />
          </CardDescription>
          <CardTitle className="text-2xl font-bold">
            {seatLimit === null ? seats : `${seats} of ${seatLimit}`}
            <span className="text-muted-foreground ml-2 text-sm font-normal">seats used</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {seatLimit !== null && (
            <Progress aria-label="Team seats used" value={capacityPercentage} />
          )}
          <p className="text-muted-foreground text-sm">
            {seatLimit === null ? "No seat limit" : `${usage.remainingSeats ?? 0} seats available`}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center justify-between gap-2">
            Workspace subscription <CreditCard aria-hidden="true" className="size-4" />
          </CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2 text-2xl font-bold">
            {plan?.name ?? "Subscription"}
            <Badge variant="secondary">{subscription.status.replaceAll("_", " ")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          {price && (
            <p className="text-muted-foreground text-sm">
              {plan?.priceCents === 0
                ? "Free"
                : plan?.billingInterval === "LIFETIME"
                  ? `${price} one time`
                  : `${price} / ${interval}`}
            </p>
          )}
          {hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.TENANTS_UPDATE) && (
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={tenantHref(TENANT_PATHS.SETTINGS_BILLING)}>
                Billing settings <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardQuickActions() {
  const tenantHref = useTenantHref();
  const { activeTenantId } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenantId);
  const actions = shortcuts.filter(({ permission }) =>
    hasTenantPermission(context?.permissions, permission),
  );

  if (!actions.length) return null;

  return (
    <section aria-labelledby="dashboard-quick-actions" className="grid gap-3">
      <h2 id="dashboard-quick-actions" className="text-lg font-semibold tracking-tight">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {actions.map(({ title, path, icon: Icon }) => (
          <Button
            key={path}
            asChild
            variant="outline"
            className="h-auto min-h-11 justify-start rounded-xl px-3 text-pretty whitespace-normal"
          >
            <Link href={tenantHref(path)}>
              <Icon aria-hidden="true" className="text-primary size-4" />
              {title}
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
