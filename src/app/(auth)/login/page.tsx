import type { Metadata } from "next";
import { headers } from "next/headers";
import { Building2, Lock } from "lucide-react";

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
    "Enter your credentials to access your workspace.";

  return (
    <div className="w-full space-y-4">
      <Card
        className="border-border/80 bg-card/80 shadow-lg backdrop-blur-sm"
        style={{ borderRadius: "var(--radius)" }}
      >
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="flex justify-center">
            <div
              className="bg-primary/10 text-primary border-primary/20 flex size-12 items-center justify-center border shadow-xs"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Building2 className="size-6" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-balance">
              <h1>{headline}</h1>
            </CardTitle>
            <CardDescription className="mx-auto max-w-xs text-xs">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm
            next={typeof next === "string" ? next : undefined}
            targetTenant={resolved?.tenant}
          />
        </CardContent>
      </Card>

      <div className="text-muted-foreground/60 flex items-center justify-center gap-2 text-center font-mono text-[11px]">
        <Lock className="size-3" />
        <span>End-to-End Encrypted &bull; Tenant Isolation</span>
      </div>
    </div>
  );
}
