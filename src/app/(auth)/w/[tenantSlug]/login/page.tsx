import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_ROUTES } from "@/config/routes";
import { LoginForm } from "@/features/auth";
import { TenantLogo, TenantThemeProvider } from "@/features/tenants";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const resolved = await resolveTenantBySlug(tenantSlug);
  const tenantName = resolved?.branding?.companyName || resolved?.tenant?.name || "Workspace";
  return {
    title: `Sign in to ${tenantName}`,
    description: `Access your dedicated ${tenantName} workspace.`,
  };
}

export default async function TenantLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { tenantSlug } = await params;
  const { next } = await searchParams;

  const resolved = await resolveTenantBySlug(tenantSlug);
  if (!resolved || resolved.kind !== "tenant") {
    notFound();
  }

  if (resolved.status === "SUSPENDED" || resolved.status === "DEACTIVATED") {
    redirect(AUTH_ROUTES.TENANT_SUSPENDED);
  }

  const tenantName = resolved.branding?.companyName || resolved.tenant?.name || resolved.name;
  const headline: string =
    (resolved.branding?.authHeadline as string | undefined) ||
    (tenantName ? `Sign in to ${tenantName}` : "Welcome back");
  const description: string =
    (resolved.branding?.authSubtitle as string | undefined) ||
    "Use your workspace credentials to access team resources.";

  const primaryColor = resolved.branding?.primaryColor || undefined;

  return (
    <TenantThemeProvider overrideBranding={resolved?.branding}>
      <div className="w-full space-y-4">
        {/* Workspace Switcher / Back header link */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            All Workspaces
          </Link>
          <span className="text-muted-foreground/70 inline-flex items-center gap-1 font-mono text-[11px]">
            <ShieldCheck className="size-3 text-emerald-500" />
            Verified Workspace
          </span>
        </div>

        <Card
          className="border-border/80 bg-card/80 shadow-lg backdrop-blur-sm"
          style={{ borderRadius: "var(--radius)" }}
        >
          <CardHeader className="space-y-3 pb-4 text-center">
            {/* Logo / Brand Icon Badge */}
            <div className="flex justify-center">
              {resolved.branding?.logoUrl ? (
                <TenantLogo
                  variant="full"
                  branding={resolved.branding}
                  tenant={resolved.tenant}
                  showName={false}
                  className="h-11 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <div
                  className="shadow-primary/20 flex size-12 items-center justify-center text-white shadow-md"
                  style={{
                    backgroundColor: primaryColor || "var(--primary, #09090b)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <Building2 className="size-6 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-balance">
                <h1>{headline}</h1>
              </CardTitle>
              <CardDescription className="mx-auto max-w-xs text-xs">{description}</CardDescription>
            </div>

            {/* Tenant Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 font-mono text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {resolved.tenant?.slug}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <LoginForm
              next={typeof next === "string" ? next : undefined}
              targetTenant={resolved.tenant}
            />
          </CardContent>
        </Card>

        {/* Security / Trust Footer */}
        <div className="text-muted-foreground/60 flex items-center justify-center gap-2 text-center font-mono text-[11px]">
          <Lock className="size-3" />
          <span>Row-Level Isolated &bull; TLS 1.3 Encrypted Session</span>
        </div>
      </div>
    </TenantThemeProvider>
  );
}
