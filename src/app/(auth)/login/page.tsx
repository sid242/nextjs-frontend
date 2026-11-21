import type { Metadata } from "next";
import { headers } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth";
import { resolvePublicTenant } from "@/lib/server/tenant-resolver";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; tenant?: string | string[] }>;
}) {
  const { next, tenant } = await searchParams;
  const tenantSlug = typeof tenant === "string" ? tenant : undefined;
  const headerList = await headers();
  const host = headerList.get("host") ?? undefined;

  const resolved = await resolvePublicTenant({ host, slug: tenantSlug });
  const tenantName = resolved?.branding?.companyName || resolved?.tenant?.name;
  const headline: string =
    (resolved?.branding?.authHeadline as string | undefined) ||
    (tenantName ? `Sign in to ${tenantName}` : "Welcome back");
  const description: string =
    (resolved?.branding?.authSubtitle as string | undefined) ||
    "Use your workspace email and password.";

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-balance">
          <h1>{headline}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          targetTenant={resolved?.tenant}
        />
      </CardContent>
    </Card>
  );
}
