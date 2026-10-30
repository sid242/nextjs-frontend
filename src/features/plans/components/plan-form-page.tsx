"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Layers,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  ControlledCheckbox,
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { useCreatePlan, usePlatformPlans, useUpdatePlan } from "../queries";
import { createPlanSchema, type CreatePlanInput, type UpdatePlanInput } from "../schemas";

interface PlanFormPageProps {
  planId?: string;
}

const INTERVAL_OPTIONS = [
  { label: "Monthly (Billed every month)", value: "MONTHLY" },
  { label: "Annual (Billed every 12 months)", value: "ANNUAL" },
  { label: "Lifetime (Single one-off charge)", value: "LIFETIME" },
];

const CURRENCY_OPTIONS = [
  { label: "USD - United States Dollar ($)", value: "USD" },
  { label: "EUR - Euro (€)", value: "EUR" },
  { label: "GBP - British Pound (£)", value: "GBP" },
  { label: "CAD - Canadian Dollar (CA$)", value: "CAD" },
];

export function PlanFormPage({ planId: propPlanId }: PlanFormPageProps) {
  const router = useRouter();
  const params = useParams();
  const rawId = propPlanId || (params?.id as string | undefined);
  const isEdit = Boolean(rawId);

  const { data: plans = [], isLoading: plansLoading } = usePlatformPlans({ includeInactive: true });
  const { mutateAsync: createNewPlan, isPending: isCreating } = useCreatePlan();
  const { mutateAsync: updateExistingPlan, isPending: isUpdating } = useUpdatePlan();

  const existingPlan = useMemo(
    () => (rawId ? plans.find((p) => p.id === rawId) : null),
    [plans, rawId],
  );

  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      key: "",
      name: "",
      description: "",
      priceCents: 4900,
      currency: "USD",
      billingInterval: "MONTHLY",
      isActive: true,
      isPublic: true,
      entitlements: {
        maxMembers: 15,
        maxProjects: 50,
        maxStorageMb: 10240, // 10 GB
        hasCustomRoles: true,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: false,
        hasAuditRetentionDays: 60,
      },
    },
  });

  // Populate existing data when in edit mode
  useEffect(() => {
    if (existingPlan) {
      methods.reset({
        key: existingPlan.key,
        name: existingPlan.name,
        description: existingPlan.description ?? "",
        priceCents: existingPlan.priceCents ?? 0,
        currency: existingPlan.currency ?? "USD",
        billingInterval: existingPlan.billingInterval ?? "MONTHLY",
        isActive: existingPlan.isActive ?? true,
        isPublic: existingPlan.isPublic ?? true,
        entitlements: {
          maxMembers: existingPlan.entitlements?.maxMembers ?? 15,
          maxProjects: existingPlan.entitlements?.maxProjects ?? 50,
          maxStorageMb: existingPlan.entitlements?.maxStorageMb ?? 10240,
          hasCustomRoles: Boolean(existingPlan.entitlements?.hasCustomRoles),
          hasAdvancedAnalytics: Boolean(existingPlan.entitlements?.hasAdvancedAnalytics),
          hasPrioritySupport: Boolean(existingPlan.entitlements?.hasPrioritySupport),
          hasAuditRetentionDays: existingPlan.entitlements?.hasAuditRetentionDays ?? 60,
        },
      });
    }
  }, [existingPlan, methods]);

  // Reactive watches for the Live Preview card
  const watchedValues = useWatch({ control: methods.control });
  const previewName = watchedValues.name?.trim() || "Untitled Plan";
  const previewPriceCents = Number(watchedValues.priceCents ?? 0);
  const previewPriceFormatted =
    previewPriceCents === 0 ? "$0" : `$${(previewPriceCents / 100).toFixed(2)}`;
  const previewInterval = watchedValues.billingInterval || "MONTHLY";
  const previewCurrency = watchedValues.currency || "USD";
  const previewDescription =
    watchedValues.description?.trim() ||
    "Ideal for scaling teams needing high-performance infrastructure and automated collaboration tools.";
  const previewMembers = watchedValues.entitlements?.maxMembers ?? 15;
  const previewStorageMb = watchedValues.entitlements?.maxStorageMb ?? 10240;
  const previewStorageGb = (previewStorageMb / 1024).toFixed(1).replace(/\.0$/, "");
  const previewHasCustomRoles = Boolean(watchedValues.entitlements?.hasCustomRoles);
  const previewHasAnalytics = Boolean(watchedValues.entitlements?.hasAdvancedAnalytics);
  const previewHasSupport = Boolean(watchedValues.entitlements?.hasPrioritySupport);
  const previewRetentionDays = watchedValues.entitlements?.hasAuditRetentionDays ?? 60;
  const previewIsActive = watchedValues.isActive ?? true;
  const previewIsPublic = watchedValues.isPublic ?? true;

  const handleKeyAutoGenerate = () => {
    const currentName = methods.getValues("name");
    if (!currentName) return;
    const cleanKey = currentName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    methods.setValue("key", cleanKey, { shouldValidate: true });
  };

  const onSubmit = async (values: CreatePlanInput) => {
    setFormError(null);
    try {
      if (isEdit && rawId) {
        const updatePayload: UpdatePlanInput = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          priceCents: Number(values.priceCents ?? 0),
          currency: values.currency,
          billingInterval: values.billingInterval,
          isActive: Boolean(values.isActive),
          isPublic: Boolean(values.isPublic),
          entitlements: values.entitlements
            ? {
                maxMembers: Number(values.entitlements.maxMembers),
                maxProjects: Number(values.entitlements.maxProjects),
                maxStorageMb: Number(values.entitlements.maxStorageMb),
                hasCustomRoles: Boolean(values.entitlements.hasCustomRoles),
                hasAdvancedAnalytics: Boolean(values.entitlements.hasAdvancedAnalytics),
                hasPrioritySupport: Boolean(values.entitlements.hasPrioritySupport),
                hasAuditRetentionDays: Number(values.entitlements.hasAuditRetentionDays),
              }
            : undefined,
        };
        await updateExistingPlan({ id: rawId, data: updatePayload });
        toast.success(`Plan "${values.name}" updated successfully!`);
      } else {
        await createNewPlan({
          ...values,
          key: values.key.toUpperCase().trim(),
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          priceCents: Number(values.priceCents ?? 0),
          entitlements: values.entitlements
            ? {
                maxMembers: Number(values.entitlements.maxMembers),
                maxProjects: Number(values.entitlements.maxProjects),
                maxStorageMb: Number(values.entitlements.maxStorageMb),
                hasCustomRoles: Boolean(values.entitlements.hasCustomRoles),
                hasAdvancedAnalytics: Boolean(values.entitlements.hasAdvancedAnalytics),
                hasPrioritySupport: Boolean(values.entitlements.hasPrioritySupport),
                hasAuditRetentionDays: Number(values.entitlements.hasAuditRetentionDays),
              }
            : undefined,
        });
        toast.success(`Commercial tier "${values.name}" provisioned successfully!`);
      }
      router.push("/platform/plans");
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to persist commercial tier."));
    }
  };

  if (isEdit && plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[600px] lg:col-span-8" />
          <Skeleton className="h-[450px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
            <Link href="/platform/plans">
              <ArrowLeft className="size-3.5" />
              Back to Plans
            </Link>
          </Button>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span>Platform</span>
            <span>/</span>
            <span>Plans</span>
            <span>/</span>
            <span className="text-foreground font-semibold">
              {isEdit ? `Edit: ${existingPlan?.name || "Tier"}` : "Provision New Tier"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={previewIsActive ? "default" : "secondary"}
            className="h-6 gap-1 font-mono text-[10px]"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                previewIsActive ? "animate-pulse bg-emerald-400" : "bg-muted-foreground",
              )}
            />
            {previewIsActive ? "ACTIVE TIER" : "INACTIVE DRAFT"}
          </Badge>
          {previewIsPublic && (
            <Badge variant="outline" className="border-primary/30 text-primary h-6 text-[10px]">
              PUBLIC CATALOGUE
            </Badge>
          )}
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="border-border/60 bg-card/60 flex flex-col justify-between gap-3 rounded-2xl border p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">
            {isEdit ? `Edit Subscription Tier: ${existingPlan?.name}` : "Provision Commercial Plan"}
          </h1>
          <p className="text-muted-foreground text-xs">
            Configure seat quotas, cloud storage allocations, feature access gates, and pricing
            intervals for multi-tenant accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/platform/plans")}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={methods.handleSubmit(onSubmit)}
            disabled={isCreating || isUpdating}
            className="h-8 gap-1.5 text-xs shadow-xs"
          >
            <Check className="size-3.5" />
            {isCreating || isUpdating ? "Saving..." : isEdit ? "Update Tier" : "Publish Tier"}
          </Button>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle className="text-xs font-semibold">Validation or Server Error</AlertTitle>
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      {/* Form & Live Preview Grid */}
      <FormWrapper methods={methods} onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form Columns (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Card 1: Identity & Key */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="text-primary size-4" />
                  Tier Identity &amp; System Key
                </CardTitle>
                <CardDescription className="text-xs">
                  Machine identifiers, marketing names, and public catalog visibility switches.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ControlledInput
                    name="name"
                    label="Plan Display Name"
                    placeholder="e.g. Enterprise Cloud"
                    description="Customer-facing tier name shown in invoices and checkout."
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="key" className="text-xs font-medium">
                        System Key Identifier
                      </Label>
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={handleKeyAutoGenerate}
                          className="text-primary hover:text-primary/80 text-[11px] font-medium"
                        >
                          Auto-generate from name
                        </button>
                      )}
                    </div>
                    <ControlledInput
                      name="key"
                      placeholder="ENTERPRISE_CLOUD"
                      description="Unique uppercase identifier (e.g. PRO_ANNUAL). Immutable once created."
                      disabled={isEdit}
                    />
                  </div>
                </div>

                <ControlledTextarea
                  name="description"
                  label="Marketing Description / Pitch"
                  placeholder="Outline who this plan is tailored for and key capabilities provided..."
                  description="Displayed on the tenant subscription comparison screen."
                  rows={2}
                />

                <div className="border-border/60 bg-muted/20 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Public Catalog Visibility</Label>
                      <p className="text-muted-foreground text-[11px]">
                        Allow any organization to self-serve upgrade to this plan.
                      </p>
                    </div>
                    <ControlledCheckbox name="isPublic" label="" />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Operational Status</Label>
                      <p className="text-muted-foreground text-[11px]">
                        Active plans can be assigned and renewed by subscribers.
                      </p>
                    </div>
                    <ControlledCheckbox name="isActive" label="" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Monetization & Pricing */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="text-primary size-4" />
                  Commercials &amp; Monetization Schedule
                </CardTitle>
                <CardDescription className="text-xs">
                  Pricing amount in base currency cents, recurrence cadence, and billing terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <ControlledInput
                      name="priceCents"
                      type="number"
                      label="Price in Cents"
                      placeholder="4900"
                      description="e.g. 4900 = $49.00 USD. Enter 0 for Free tier."
                    />
                  </div>

                  <ControlledSelect
                    name="currency"
                    label="Currency"
                    options={CURRENCY_OPTIONS}
                    description="ISO-4217 currency code."
                  />

                  <ControlledSelect
                    name="billingInterval"
                    label="Billing Recurrence"
                    options={INTERVAL_OPTIONS}
                    description="Subscription charge interval."
                  />
                </div>

                <div className="border-border/50 bg-muted/30 flex items-center gap-3 rounded-lg border p-3 text-xs">
                  <Sparkles className="text-primary size-4 shrink-0" />
                  <div>
                    <span className="font-semibold">Calculated Retail Price: </span>
                    <span className="text-foreground font-mono font-bold">
                      {previewPriceFormatted} {previewCurrency}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      per{" "}
                      {previewInterval === "ANNUAL"
                        ? "year"
                        : previewInterval === "MONTHLY"
                          ? "month"
                          : "lifetime access"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Capacity & Quotas */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="text-primary size-4" />
                  Capacity, Workspaces &amp; Storage Quotas
                </CardTitle>
                <CardDescription className="text-xs">
                  Resource boundaries and hard usage ceilings enforced across tenant accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ControlledInput
                    name="entitlements.maxMembers"
                    type="number"
                    label="Maximum Member Seats"
                    placeholder="15"
                    description="Hard ceiling for invited team members in this workspace."
                  />

                  <ControlledInput
                    name="entitlements.maxProjects"
                    type="number"
                    label="Maximum Projects / Workspaces"
                    placeholder="50"
                    description="Concurrent project count allowed per tenant."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <ControlledInput
                      name="entitlements.maxStorageMb"
                      type="number"
                      label="Cloud Storage Limit (MB)"
                      placeholder="10240"
                      description={`Current: ${previewStorageGb} GB (${previewStorageMb.toLocaleString()} MB)`}
                    />
                  </div>

                  <ControlledInput
                    name="entitlements.hasAuditRetentionDays"
                    type="number"
                    label="Audit Log Retention (Days)"
                    placeholder="60"
                    description="Rolling retention duration for operator & tenant audit trails."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Feature Entitlements & Gating */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="text-primary size-4" />
                  Enterprise Feature Gates &amp; SLAs
                </CardTitle>
                <CardDescription className="text-xs">
                  Toggle premium platform capabilities dynamically gated by this subscription tier.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="border-border/60 hover:bg-muted/10 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Custom RBAC &amp; Roles</span>
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        Security
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Allows workspace administrators to craft custom roles with granular permission
                      matrices.
                    </p>
                  </div>
                  <ControlledCheckbox name="entitlements.hasCustomRoles" label="" />
                </div>

                <div className="border-border/60 hover:bg-muted/10 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        Advanced Analytics &amp; Reports
                      </span>
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        Insights
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Unlocks real-time metrics, telemetry graphs, and exportable CSV audit records.
                    </p>
                  </div>
                  <ControlledCheckbox name="entitlements.hasAdvancedAnalytics" label="" />
                </div>

                <div className="border-border/60 hover:bg-muted/10 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">24/7 Priority Support SLA</span>
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        Enterprise SLA
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Guaranteed response time within 1 hour with dedicated solution engineer.
                    </p>
                  </div>
                  <ControlledCheckbox name="entitlements.hasPrioritySupport" label="" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Interactive Card Preview (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <Card className="border-border/80 shadow-md">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Live Customer Pricing Preview
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[9px]">
                      SIMULATION
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {/* Mock Pricing Card that customers see */}
                  <div className="border-border/80 bg-card hover:border-primary/50 relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all">
                    {previewIsPublic && (
                      <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                        Popular
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-foreground text-lg font-bold tracking-tight">
                          {previewName}
                        </h3>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {previewDescription}
                        </p>
                      </div>

                      <div className="border-border/40 flex items-baseline gap-1 border-t pt-1">
                        <span className="text-foreground text-3xl font-extrabold tracking-tight">
                          {previewPriceFormatted}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {previewInterval === "ANNUAL"
                            ? "/year"
                            : previewInterval === "LIFETIME"
                              ? "once"
                              : "/month"}
                        </span>
                      </div>

                      <Button
                        type="button"
                        className="h-9 w-full rounded-xl text-xs font-semibold shadow-xs"
                      >
                        Upgrade to {previewName}
                      </Button>

                      {/* Included Feature Checklist */}
                      <div className="border-border/40 space-y-2 border-t pt-3 text-xs">
                        <div className="text-foreground text-[11px] font-semibold tracking-wider uppercase">
                          What&apos;s Included:
                        </div>
                        <ul className="space-y-2">
                          <li className="text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                            <span>
                              <strong className="text-foreground">{previewMembers}</strong> Team
                              Members
                            </span>
                          </li>
                          <li className="text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                            <span>
                              <strong className="text-foreground">{previewStorageGb} GB</strong>{" "}
                              Encrypted Cloud Storage
                            </span>
                          </li>
                          <li className="text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                            <span>
                              <strong className="text-foreground">
                                {previewRetentionDays} days
                              </strong>{" "}
                              Audit Log Retention
                            </span>
                          </li>
                          <li
                            className={cn(
                              "text-muted-foreground flex items-center gap-2",
                              !previewHasCustomRoles && "line-through opacity-40",
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                "size-3.5 shrink-0",
                                previewHasCustomRoles
                                  ? "text-emerald-500"
                                  : "text-muted-foreground",
                              )}
                            />
                            <span>Custom RBAC &amp; Roles</span>
                          </li>
                          <li
                            className={cn(
                              "text-muted-foreground flex items-center gap-2",
                              !previewHasAnalytics && "line-through opacity-40",
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                "size-3.5 shrink-0",
                                previewHasAnalytics ? "text-emerald-500" : "text-muted-foreground",
                              )}
                            />
                            <span>Advanced Analytics &amp; Reporting</span>
                          </li>
                          <li
                            className={cn(
                              "text-muted-foreground flex items-center gap-2",
                              !previewHasSupport && "line-through opacity-40",
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                "size-3.5 shrink-0",
                                previewHasSupport ? "text-emerald-500" : "text-muted-foreground",
                              )}
                            />
                            <span>Priority 24/7 SLA Support</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Action Summary Card */}
              <Card className="border-border/70 shadow-xs">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Configured Machine Key</span>
                    <span className="text-foreground font-mono font-semibold">
                      {watchedValues.key || "PENDING"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Billing Interval</span>
                    <span className="font-mono text-xs">{previewInterval}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-mono text-xs">{previewCurrency}</span>
                  </div>

                  <div className="border-border/50 flex flex-col gap-2 border-t pt-2">
                    <Button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="w-full gap-2 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <Check className="size-4" />
                      {isCreating || isUpdating
                        ? "Saving Changes..."
                        : isEdit
                          ? "Save Plan Updates"
                          : "Publish Commercial Tier"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/platform/plans")}
                      className="w-full rounded-xl text-xs"
                    >
                      Cancel &amp; Discard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FormWrapper>
    </div>
  );
}
