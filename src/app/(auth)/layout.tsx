import { headers } from "next/headers";
import Link from "next/link";

import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { siteConfig } from "@/config/site";
import { TenantLogo, TenantThemeProvider } from "@/features/tenants";
import { resolvePublicTenant } from "@/lib/server/tenant-resolver";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const host = headerList.get("host") ?? undefined;
  const xPathname = headerList.get("x-pathname") ?? "";

  let querySlug: string | undefined;
  try {
    const parsedUrl = new URL(`http://localhost${xPathname}`);
    querySlug = parsedUrl.searchParams.get("tenant") ?? undefined;
  } catch {
    querySlug = undefined;
  }

  const resolved = await resolvePublicTenant({ host, slug: querySlug });

  return (
    <TenantThemeProvider overrideBranding={resolved?.branding}>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {resolved ? (
              <TenantLogo
                variant="full"
                branding={resolved.branding}
                tenant={resolved.tenant}
                showName
              />
            ) : (
              <span className="text-lg font-semibold tracking-tight">{siteConfig.name}</span>
            )}
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="grid flex-1 place-items-center p-4">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </TenantThemeProvider>
  );
}
