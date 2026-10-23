"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  Building2Icon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  PaletteIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActiveTenant,
  useTenantBranding,
  useUpdateTenantBranding,
  useVerifyTenantCustomDomain,
  type Tenant,
  type TenantBranding,
} from "@/features/tenants";
import { getErrorMessage } from "@/lib/api/errors";
import { initials } from "@/lib/format";

function BrandingForm({
  branding,
  activeTenant,
  activeTenantId,
}: {
  branding: TenantBranding;
  activeTenant?: Tenant;
  activeTenantId: string;
}) {
  const updateBrandingMutation = useUpdateTenantBranding(activeTenantId);
  const verifyDomainMutation = useVerifyTenantCustomDomain(activeTenantId);

  const [companyName, setCompanyName] = useState(
    branding?.companyName ?? activeTenant?.name ?? "Acme Corporation",
  );
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? "#0ea5e9");
  const [accentColor, setAccentColor] = useState(branding?.accentColor ?? "#38bdf8");
  const [customDomain, setCustomDomain] = useState(branding?.customDomain ?? "");
  const [supportEmail, setSupportEmail] = useState(branding?.supportEmail ?? "");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    try {
      await updateBrandingMutation.mutateAsync({
        companyName: companyName.trim(),
        primaryColor,
        accentColor,
        customDomain: customDomain.trim() || undefined,
        supportEmail: supportEmail.trim() || undefined,
      });
      toast.success("Workspace brand identity saved successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save brand identity."));
    }
  };

  const handleVerifyDns = async (bypass = false) => {
    try {
      await verifyDomainMutation.mutateAsync({ bypassVerification: bypass });
      toast.success("Custom domain verified and activated successfully!");
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          "DNS TXT verification failed. Ensure the TXT record matches and has propagated.",
        ),
      );
    }
  };

  const savedDomain = branding?.customDomain?.trim() || "";
  const domainStatus = branding?.customDomainStatus ?? "PENDING";
  const challengeHostname = savedDomain ? `_saas-verify.${savedDomain.toLowerCase()}` : "";
  const expectedTxtValue = `saas-verify=${activeTenantId}`;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="White-Label Branding"
          description={`Customize logos, colors, and visual identity for ${activeTenant?.name ?? "your organization"}.`}
        />
        <Button
          onClick={handleSave}
          disabled={updateBrandingMutation.isPending}
          className="w-full gap-2 shadow-xs sm:w-auto"
        >
          <SparklesIcon className="size-4" />
          {updateBrandingMutation.isPending ? "Saving…" : "Save Brand Identity"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PaletteIcon className="text-primary size-4" /> Visual Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your organization display name, logos, and custom color accents.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Display Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e?.target?.value ?? "")}
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primary-color">Primary Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e?.target?.value ?? "#0ea5e9")}
                  className="border-border size-10 cursor-pointer rounded-md border bg-transparent p-1 transition-transform hover:scale-105"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e?.target?.value ?? "")}
                  className="font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e?.target?.value ?? "#38bdf8")}
                  className="border-border size-10 cursor-pointer rounded-md border bg-transparent p-1 transition-transform hover:scale-105"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e?.target?.value ?? "")}
                  className="font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="support-email">Support Email</Label>
              <div className="relative">
                <MailIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e?.target?.value ?? "")}
                  placeholder="support@yourcompany.com"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ImageIcon className="size-4 text-blue-500" /> Live Interface Preview
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time preview of how your brand tokens appear inside navigation and header slots.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="border-border/80 bg-muted/30 rounded-xl border p-4">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                Header Brand Preview
              </span>
              <div className="bg-background mt-3 flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    className="size-8 shrink-0 rounded-md transition-colors"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    <AvatarFallback className="rounded-md text-xs font-bold">
                      {companyName ? initials(companyName) : <Building2Icon className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-semibold tracking-tight">
                      {companyName || "Your Brand"}
                    </span>
                    <span
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: primaryColor }}
                    >
                      Workspace Live
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600">
                  <CheckCircle2Icon className="size-3.5" />
                  <span className="text-[11px] font-semibold">Verified</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <GlobeIcon className="text-muted-foreground size-3.5" /> Workspace Subdomain
              </Label>
              <div className="flex items-center">
                <Input
                  value={activeTenant?.slug ?? "workspace"}
                  readOnly
                  disabled
                  className="rounded-r-none font-mono text-xs"
                />
                <span className="border-border bg-muted text-muted-foreground inline-flex h-9 items-center rounded-r-md border border-l-0 px-3 font-mono text-xs">
                  .app.domain.com
                </span>
              </div>
              <p className="text-muted-foreground/70 text-[11px]">
                Members can log in directly at this URL with automatic tenant resolution.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Domain & DNS Verification Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GlobeIcon className="text-primary size-4" /> Custom Domain & DNS Challenge
              </CardTitle>
              <CardDescription className="text-xs">
                Serve this workspace under your own domain (e.g.{" "}
                <code className="text-primary font-mono">portal.yourcompany.com</code>).
              </CardDescription>
            </div>
            {savedDomain && (
              <div>
                {domainStatus === "ACTIVE" ? (
                  <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-xs">
                    <CheckCircle2Icon className="size-3.5" /> Verified & Active
                  </Badge>
                ) : domainStatus === "FAILED" ? (
                  <Badge variant="destructive" className="gap-1.5 px-2.5 py-1 text-xs">
                    <AlertCircleIcon className="size-3.5" /> Verification Failed
                  </Badge>
                ) : (
                  <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-xs">
                    <ClockIcon className="size-3.5" /> DNS Verification Pending
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid max-w-xl gap-2">
            <Label htmlFor="custom-domain">Custom Fully Qualified Domain Name (FQDN)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e?.target?.value ?? "")}
                placeholder="portal.yourcompany.com"
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={updateBrandingMutation.isPending}
                className="shrink-0"
              >
                {updateBrandingMutation.isPending ? "Saving…" : "Save Domain"}
              </Button>
            </div>
            <p className="text-muted-foreground/70 text-[11px]">
              Enter the apex domain or subdomain where you want your users to access this tenant.
            </p>
          </div>

          {savedDomain ? (
            <div className="border-border/70 bg-muted/20 grid gap-4 rounded-xl border p-4.5">
              <div className="flex flex-col gap-1">
                <span className="text-foreground text-xs font-semibold">
                  DNS Ownership Challenge
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Add the following TXT record to your DNS provider (e.g. Cloudflare, Route53,
                  Namecheap) to confirm domain ownership.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-background border-border/80 rounded-lg border p-3 shadow-2xs">
                  <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                    Record Type & Host / Name
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        TXT
                      </Badge>
                      <span
                        className="truncate font-mono text-xs font-medium"
                        title={challengeHostname}
                      >
                        {challengeHostname}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleCopy(challengeHostname, "host")}
                      title="Copy Hostname"
                    >
                      {copiedKey === "host" ? (
                        <CheckIcon className="size-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-background border-border/80 rounded-lg border p-3 shadow-2xs">
                  <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                    TXT Value / Token
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className="truncate font-mono text-xs font-medium"
                      title={expectedTxtValue}
                    >
                      {expectedTxtValue}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleCopy(expectedTxtValue, "val")}
                      title="Copy Value"
                    >
                      {copiedKey === "val" ? (
                        <CheckIcon className="size-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-muted-foreground/80 flex items-center gap-2 text-[11px]">
                  <ClockIcon className="size-3.5 shrink-0" />
                  <span>DNS records typically propagate within 1 to 5 minutes.</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleVerifyDns(false)}
                    disabled={verifyDomainMutation.isPending}
                    className="gap-2 shadow-xs"
                  >
                    <RefreshCwIcon
                      className={`size-3.5 ${verifyDomainMutation.isPending ? "animate-spin" : ""}`}
                    />
                    {verifyDomainMutation.isPending ? "Verifying DNS Record…" : "Verify DNS Record"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-border/60 bg-muted/10 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              Save a custom domain above to generate the DNS verification challenge instructions.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function BrandingPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: branding, isLoading } = useTenantBranding(activeTenantId);

  if (isLoading || !branding || !activeTenantId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="White-Label Branding"
          description={`Customize logos, colors, and visual identity for ${activeTenant?.name ?? "your organization"}.`}
        />
        <div className="text-muted-foreground animate-pulse p-8 text-center text-sm">
          Loading workspace branding…
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <BrandingForm
        key={`${activeTenantId}-${branding?.companyName ?? ""}`}
        branding={branding}
        activeTenant={activeTenant}
        activeTenantId={activeTenantId}
      />
    </div>
  );
}
