import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

export const metadata: Metadata = { title: "Create account" };

export default async function TenantRegisterPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

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
    (tenantName ? `Join ${tenantName}` : "Create your account");
  const description: string =
    (resolved.branding?.authSubtitle as string | undefined) ||
    (tenantName
      ? `Get started with your team at ${tenantName}.`
      : "It only takes a minute to get started.");

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">{headline}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm targetTenant={resolved.tenant} />
      </CardContent>
    </Card>
  );
}
