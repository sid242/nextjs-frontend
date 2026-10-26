import type { Metadata } from "next";
import { headers } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth";
import { resolvePublicTenant } from "@/lib/server/tenant-resolver";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string | string[] }>;
}) {
  const { tenant } = await searchParams;
  const tenantSlug = typeof tenant === "string" ? tenant : undefined;
  const headerList = await headers();
  const host = headerList.get("host") ?? undefined;

  const resolved = await resolvePublicTenant({ host, slug: tenantSlug });
  const tenantName = resolved?.branding?.companyName || resolved?.tenant?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {tenantName ? `Join ${tenantName}` : "Create your account"}
        </CardTitle>
        <CardDescription>
          {tenantName
            ? `Get started with your team at ${tenantName}.`
            : "It only takes a minute to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm targetTenant={resolved?.tenant} />
      </CardContent>
    </Card>
  );
}
