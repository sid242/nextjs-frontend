import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    redirect("/tenant-suspended");
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your registered email address and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
