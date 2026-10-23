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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {tenantName ? `Sign in to ${tenantName}` : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {tenantName
            ? `Enter your credentials to access the ${tenantName} workspace.`
            : "Sign in to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </CardContent>
    </Card>
  );
}
