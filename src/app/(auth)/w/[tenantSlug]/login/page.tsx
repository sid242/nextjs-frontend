import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

export const metadata: Metadata = { title: "Sign in" };

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
    redirect("/tenant-suspended");
  }

  const tenantName = resolved.branding?.companyName || resolved.tenant?.name || resolved.name;
  const headline: string =
    (resolved.branding?.authHeadline as string | undefined) ||
    (tenantName ? `Sign in to ${tenantName}` : "Welcome back");
  const description: string =
    (resolved.branding?.authSubtitle as string | undefined) ||
    (tenantName
      ? `Enter your credentials to access the ${tenantName} workspace.`
      : "Sign in to continue.");

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">{headline}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          targetTenant={resolved.tenant}
        />
      </CardContent>
    </Card>
  );
}
