import { headers } from "next/headers";
import Link from "next/link";
import { Lock, Shield } from "lucide-react";

import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { siteConfig } from "@/config/site";
import { TenantLogo, TenantThemeProvider } from "@/features/tenants";
import { matchTenantAuthPath } from "@/lib/auth/paths";
import { resolvePublicTenant } from "@/lib/server/tenant-resolver";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const host = headerList.get("host") ?? undefined;
  const xPathname = headerList.get("x-pathname") ?? "";

  let querySlug: string | undefined;
  try {
    const parsedUrl = new URL(`http://localhost${xPathname}`);
    querySlug = parsedUrl.searchParams.get("tenant") ?? undefined;
    if (!querySlug) {
      const match = matchTenantAuthPath(parsedUrl.pathname);
      if (match) querySlug = match.tenantSlug;
    }
  } catch {
    querySlug = undefined;
  }

  const resolved = await resolvePublicTenant({ host, slug: querySlug });
  const branding = resolved?.branding;
  const layout = (branding?.authLayout as "SPLIT" | "CARD") || "SPLIT";
  const coverUrl = branding?.authCoverUrl;
  const tenantName: string =
    (branding?.companyName as string | undefined) || resolved?.tenant?.name || siteConfig.name;
  const headline: string =
    (branding?.authHeadline as string | undefined) ||
    (resolved?.tenant?.name ? `Welcome to ${resolved.tenant.name}` : siteConfig.name);
  const subtitle: string =
    (branding?.authSubtitle as string | undefined) ||
    "Access your dedicated workspace, secure resources, and team collaboration tools.";
  const supportEmail = branding?.supportEmail;

  // Split-screen Layout for Tenant Authentication
  if (resolved?.tenant && layout === "SPLIT") {
    return (
      <TenantThemeProvider overrideBranding={resolved?.branding}>
        <div className="bg-background min-h-screen">
          <div className="grid min-h-screen lg:grid-cols-12">
            {/* Side Hero Banner (Desktop: 5 cols) */}
            <div
              className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:col-span-5 lg:flex"
              style={{
                backgroundColor: "var(--primary, #09090b)",
              }}
            >
              {/* Optional Background Cover Art */}
              {coverUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                  style={{ backgroundImage: `url(${coverUrl})` }}
                />
              ) : null}

              {/* Dynamic Brand Gradients */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/85 via-black/55 to-transparent" />
              <div
                className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full opacity-35 blur-3xl"
                style={{ backgroundColor: "var(--accent, #38bdf8)" }}
              />

              {/* Top Logo */}
              <div className="relative z-10">
                <Link href="/" className="inline-flex items-center gap-2.5">
                  <TenantLogo
                    variant="full"
                    branding={resolved.branding}
                    tenant={resolved.tenant}
                    showName
                    className="text-white"
                  />
                </Link>
              </div>

              {/* Middle Pitch & Badges */}
              <div className="relative z-10 my-auto max-w-md space-y-6 py-12">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                    <Shield className="size-3.5 text-white" />
                    <span>Secure Tenant Workspace</span>
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {headline}
                  </h1>
                  <p className="text-sm leading-relaxed text-white/80">{subtitle}</p>
                </div>

                {/* Trust & Compliance badges */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <div className="size-2 animate-pulse rounded-full bg-emerald-400" />
                    <span>SOC-2 Ready Architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 text-white/70" />
                    <span>Row-Level Kernel Isolation</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
                <span>
                  &copy; {new Date().getFullYear()} {tenantName}
                </span>
                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-white/80 underline underline-offset-2 transition-colors hover:text-white"
                  >
                    Contact Support
                  </a>
                )}
              </div>
            </div>

            {/* Form Side (Desktop: 7 cols, Mobile: full) */}
            <div className="flex flex-1 flex-col lg:col-span-7">
              {/* Header with mobile logo & theme toggle */}
              <header className="border-border/40 flex h-16 items-center justify-between border-b px-6">
                <div className="flex items-center gap-2 lg:hidden">
                  <Link href="/" className="flex items-center gap-2">
                    <TenantLogo
                      variant="full"
                      branding={resolved.branding}
                      tenant={resolved.tenant}
                      showName
                    />
                  </Link>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <ThemeToggle />
                </div>
              </header>

              {/* Main Form Center */}
              <main id="main" className="flex flex-1 items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm space-y-6">
                  {children}

                  {supportEmail && (
                    <p className="text-muted-foreground text-center text-xs">
                      Having trouble signing in?{" "}
                      <a
                        href={`mailto:${supportEmail}`}
                        className="text-primary font-medium hover:underline"
                      >
                        Contact organization admin
                      </a>
                    </p>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </TenantThemeProvider>
    );
  }

  // Centered Card Layout (Default & Platform)
  return (
    <TenantThemeProvider overrideBranding={resolved?.branding}>
      <div className="bg-background selection:bg-primary/20 relative flex min-h-screen flex-col">
        {/* Ambient background brand glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 h-96 w-full max-w-7xl -translate-x-1/2 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--primary, #4F46E5) 0%, transparent 70%)",
          }}
        />

        <header className="border-border/40 relative z-10 flex h-16 items-center justify-between border-b px-6">
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

        <main id="main" className="relative z-10 grid flex-1 place-items-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-4">
            {children}
            {supportEmail && (
              <p className="text-muted-foreground text-center text-xs">
                Having trouble?{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-primary font-medium hover:underline"
                >
                  Contact {tenantName} support
                </a>
              </p>
            )}
          </div>
        </main>
      </div>
    </TenantThemeProvider>
  );
}
