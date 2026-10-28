"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Mail,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { useProvisionTenant } from "../queries";
import { provisionTenantSchema, type ProvisionTenantInput } from "../schemas";

export function ProvisionTenantPage() {
  const { mutateAsync: provision, isPending } = useProvisionTenant();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    databaseMode: string;
    plan: string;
    ownerEmail: string;
    ownerName: string;
    inviteUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<ProvisionTenantInput>({
    resolver: zodResolver(provisionTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      ownerEmail: "",
      plan: "FREE",
      databaseMode: "shared",
      timezone: "UTC",
      notes: "",
      databaseConfig: {
        databaseName: "",
        poolLimit: 5,
        databaseKey: "",
        connectionUrl: "",
      },
    },
  });

  const nameValue = useWatch({ control: form.control, name: "name" });
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const dbModeValue = useWatch({ control: form.control, name: "databaseMode" });

  // Automatically derive URL slug from workspace name if not manually modified
  useEffect(() => {
    if (nameValue && !form.formState.dirtyFields.slug) {
      const derived = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", derived, { shouldValidate: true });
    }
  }, [nameValue, form]);

  const onSubmit = async (data: ProvisionTenantInput) => {
    setErrorMsg(null);
    try {
      const payload: ProvisionTenantInput = {
        ...data,
        databaseConfig:
          data.databaseMode === "dedicated" && data.databaseConfig
            ? {
                databaseName: data.databaseConfig.databaseName?.trim() || undefined,
                databaseKey: data.databaseConfig.databaseKey?.trim() || undefined,
                poolLimit: data.databaseConfig.poolLimit
                  ? Number(data.databaseConfig.poolLimit)
                  : 5,
                connectionUrl: data.databaseConfig.connectionUrl?.trim() || undefined,
              }
            : undefined,
      };
      const res = await provision(payload);
      setProvisionResult({
        tenantId: res.tenant.id,
        tenantName: res.tenant.name,
        tenantSlug: res.tenant.slug,
        databaseMode: res.tenant.databaseMode,
        plan: res.tenant.plan,
        ownerEmail: res.owner.email,
        ownerName: res.owner.name,
        inviteUrl: res.inviteUrl,
      });
      toast.success(`Organization ${res.tenant.name} provisioned successfully!`);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Failed to provision customer workspace"));
    }
  };

  const copyToClipboard = async () => {
    if (provisionResult?.inviteUrl) {
      await navigator.clipboard.writeText(provisionResult.inviteUrl);
      setCopied(true);
      toast.success("Magic-link onboarding URL copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    form.reset({
      name: "",
      slug: "",
      ownerEmail: "",
      plan: "FREE",
      databaseMode: "shared",
      timezone: "UTC",
      notes: "",
      databaseConfig: {
        databaseName: "",
        poolLimit: 5,
        databaseKey: "",
        connectionUrl: "",
      },
    });
    setProvisionResult(null);
    setErrorMsg(null);
    setCopied(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header with Breadcrumb Back */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-9 shrink-0">
            <Link href="/platform/tenants">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Provision Workspace Organization</h1>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Multi-Tenant
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Onboard a new customer tenant organization, configure its database routing pool, and
              generate an audited owner invitation.
            </p>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto">
          <Link href="/platform/tenants">
            <ArrowLeft className="size-3.5" /> Back to Workspaces
          </Link>
        </Button>
      </div>

      {/* Success View */}
      {provisionResult ? (
        <div className="space-y-6">
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100">
            <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle className="text-base font-bold">
              Organization Provisioned Successfully
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs leading-relaxed">
              Workspace <strong>{provisionResult.tenantName}</strong> has been deployed into the{" "}
              <strong className="capitalize">{provisionResult.databaseMode}</strong> database pool
              on tier <strong>{provisionResult.plan}</strong>.
            </AlertDescription>
          </Alert>

          {/* Invitation URL Box */}
          <Card className="border-emerald-500/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="size-4 text-emerald-600 dark:text-emerald-400" /> Owner
                  Magic-Link Onboarding URL
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
                >
                  Single-Use Token
                </Badge>
              </div>
              <CardDescription className="text-xs">
                An invitation email was enqueued for{" "}
                <strong className="text-foreground">{provisionResult.ownerEmail}</strong>. You may
                also directly copy or test this onboarding URL:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    value={provisionResult.inviteUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="bg-muted/50 pr-10 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="gap-1.5 shadow-2xs"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy Invitation Link"}
                  </Button>
                  <Button type="button" variant="outline" asChild className="gap-1.5 shadow-2xs">
                    <a href={provisionResult.inviteUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" /> Test Link
                    </a>
                  </Button>
                </div>
              </div>

              {/* Organization Summary Telemetry */}
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="bg-muted/20 rounded-lg border p-3">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Workspace ID & Slug
                  </span>
                  <div className="mt-1 font-mono text-xs font-semibold">
                    {provisionResult.tenantSlug}
                  </div>
                  <span className="text-muted-foreground block truncate font-mono text-[10px]">
                    {provisionResult.tenantId}
                  </span>
                </div>

                <div className="bg-muted/20 rounded-lg border p-3">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Database Pool
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold capitalize">
                    <Database className="size-3.5 text-indigo-500" />
                    {provisionResult.databaseMode} Pool
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    {provisionResult.databaseMode === "dedicated"
                      ? "Enterprise isolated schema"
                      : "Shared tenantId isolation"}
                  </span>
                </div>

                <div className="bg-muted/20 rounded-lg border p-3">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Initial Owner
                  </span>
                  <div className="mt-1 truncate text-xs font-semibold">
                    {provisionResult.ownerEmail}
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    Role: Organization Owner
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Navigation */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="size-3.5" /> Provision Another Workspace
            </Button>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/platform/tenants">Return to Workspaces</Link>
              </Button>
              <Button asChild className="gap-1.5 shadow-xs">
                <Link href={`/platform/tenants/${provisionResult.tenantId}`}>
                  Open Workspace Inspector <ArrowLeft className="size-3.5 rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Creation Form */
        <FormWrapper methods={form} onSubmit={onSubmit} className="space-y-6">
          {errorMsg && (
            <Alert variant="destructive">
              <ShieldAlert className="size-4" />
              <AlertTitle>Provisioning Failed</AlertTitle>
              <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Card 1: Workspace Identity */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="text-primary size-4" /> Workspace Identity
              </CardTitle>
              <CardDescription className="text-xs">
                Display name and URL slug routing key for this customer organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <ControlledInput
                name="name"
                label="Organization Name"
                placeholder="e.g. Acme Corporation"
                required
              />

              <div className="space-y-1.5">
                <ControlledInput
                  name="slug"
                  label="URL Slug (Identifier)"
                  placeholder="e.g. acme-corp"
                  required
                />
                <p className="text-muted-foreground font-mono text-[11px]">
                  Tenant URL:{" "}
                  <span className="text-foreground">
                    https://app.saas.io/{slugValue || "workspace-slug"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Initial Owner Profile */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="text-primary size-4" /> Primary Workspace Owner
              </CardTitle>
              <CardDescription className="text-xs">
                The initial customer administrator who will receive magic-link onboarding
                credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlledInput
                name="ownerEmail"
                label="Primary Owner Email"
                type="email"
                placeholder="e.g. founder@acme.com"
                required
              />
              <p className="text-muted-foreground text-xs leading-relaxed">
                A single-use cryptographically signed onboarding invitation will be generated and
                dispatched via background queue upon workspace creation.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Database & Cloud Architecture Tier */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="text-primary size-4" /> Database Architecture Tier
              </CardTitle>
              <CardDescription className="text-xs">
                Configure data isolation guarantees and PostgreSQL connection pool routing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  onClick={() => form.setValue("databaseMode", "shared", { shouldValidate: true })}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer rounded-xl border p-4 transition-all",
                    dbModeValue === "shared"
                      ? "border-primary bg-primary/5 ring-primary ring-1"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Shared Multi-Tenant</span>
                    {dbModeValue === "shared" && <Check className="text-primary size-4" />}
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    Data isolated via PostgreSQL row-level tenantId indexes. Optimal for Standard,
                    Starter, and Growth tier organizations.
                  </p>
                </div>

                <div
                  onClick={() => {
                    form.setValue("databaseMode", "dedicated", { shouldValidate: true });
                    form.setValue("plan", "ENTERPRISE", { shouldValidate: true });
                  }}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer rounded-xl border p-4 transition-all",
                    dbModeValue === "dedicated"
                      ? "border-primary bg-primary/5 ring-primary ring-1"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">Dedicated Database</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Enterprise
                      </Badge>
                    </div>
                    {dbModeValue === "dedicated" && <Check className="text-primary size-4" />}
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    Isolated PostgreSQL schema with independent database connection budget,
                    high-burst pools, and enterprise compliance.
                  </p>
                </div>
              </div>

              {/* Dedicated Database Configuration Info */}
              {dbModeValue === "dedicated" && (
                <div className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        Enterprise Dedicated Database Configuration
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-indigo-500/30 font-mono text-[10px] text-indigo-600 dark:text-indigo-400"
                    >
                      Isolated Schema & Pool
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Upon provisioning, an isolated PostgreSQL database will be automatically
                    initialized with its own dedicated connection budget, and all Drizzle migrations
                    will be executed.
                  </p>

                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    <ControlledInput
                      name="databaseConfig.databaseName"
                      label="PostgreSQL Database Name"
                      placeholder={`tenant_${(slugValue || "acme").replace(/[^a-z0-9_]/gi, "_")}`}
                      hint="Optional custom identifier"
                      description="Must start with a letter/underscore (alphanumeric & underscores)."
                    />

                    <ControlledInput
                      name="databaseConfig.databaseKey"
                      label="Cluster Routing Key"
                      placeholder={`dedicated-${slugValue || "acme"}`}
                      hint="Optional custom routing key"
                      description="Dynamic router identifier used by multi-tenant connection pools."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ControlledInput
                      name="databaseConfig.poolLimit"
                      label="Connection Pool Budget"
                      type="number"
                      placeholder="5"
                      hint="Default: 5 (1 - 50)"
                      description="Maximum concurrent connections allocated for this tenant replica."
                    />

                    <ControlledInput
                      name="databaseConfig.connectionUrl"
                      label="External PostgreSQL URL (Optional)"
                      placeholder="postgresql://user:pass@host:5432/db"
                      hint="Optional external cluster"
                      description="Leave empty to provision inside the primary PostgreSQL cluster."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Subscription Plan & Licensing */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Layers className="text-primary size-4" /> Subscription & Operational Notes
              </CardTitle>
              <CardDescription className="text-xs">
                Licensing tier and internal compliance telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <ControlledSelect
                name="plan"
                label={
                  dbModeValue === "dedicated"
                    ? "Subscription Tier (Locked to Enterprise for Dedicated DB)"
                    : "Subscription Tier"
                }
                disabled={dbModeValue === "dedicated"}
                returnPrimitiveValue
                options={
                  dbModeValue === "dedicated"
                    ? [{ label: "Enterprise Tier (Dedicated Database)", value: "ENTERPRISE" }]
                    : [
                        { label: "Free Workspace (Default)", value: "FREE" },
                        { label: "Starter Tier", value: "STARTER" },
                        { label: "Pro / Growth Tier", value: "PRO" },
                        { label: "Enterprise Tier", value: "ENTERPRISE" },
                      ]
                }
              />

              <ControlledInput
                name="notes"
                label="Internal Operator Notes (Optional)"
                placeholder="e.g. Sales queue referral or dedicated POC"
              />
            </CardContent>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button asChild variant="outline">
              <Link href="/platform/tenants">Cancel</Link>
            </Button>
            <SubmitButton pending={isPending} pendingText="Deploying Workspace Organization…">
              <Sparkles className="mr-2 size-4" /> Provision Customer Workspace
            </SubmitButton>
          </div>
        </FormWrapper>
      )}
    </div>
  );
}
