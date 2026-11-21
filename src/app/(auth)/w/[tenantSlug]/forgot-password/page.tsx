import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_ROUTES, ROUTES } from "@/config/routes";
import { ForgotPasswordForm } from "@/features/auth";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function TenantForgotPasswordPage({
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
    redirect(AUTH_ROUTES.TENANT_SUSPENDED);
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          <h1>Reset your password</h1>
        </CardTitle>
        <CardDescription>
          Enter your registered email address and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm loginHref={ROUTES.tenant(tenantSlug).LOGIN} />
      </CardContent>
    </Card>
  );
}
