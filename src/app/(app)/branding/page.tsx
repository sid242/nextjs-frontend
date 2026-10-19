"use client";

import { useState } from "react";
import {
  Building2Icon,
  CheckCircle2Icon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  PaletteIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActiveTenant,
  useTenantBranding,
  useUpdateTenantBranding,
  type Tenant,
  type TenantBranding,
} from "@/features/tenants";
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

  const [companyName, setCompanyName] = useState(
    branding.companyName ?? activeTenant?.name ?? "Acme Corporation",
  );
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor ?? "#0ea5e9");
  const [accentColor, setAccentColor] = useState(branding.accentColor ?? "#38bdf8");
  const [customDomain, setCustomDomain] = useState(
    branding.customDomain ?? activeTenant?.slug ?? "acme",
  );
  const [supportEmail, setSupportEmail] = useState(branding.supportEmail ?? "");

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
    } catch {
      toast.error("Failed to save brand identity.");
    }
  };

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
          className="w-full gap-2 shadow-sm sm:w-auto"
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
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e?.target?.value ?? "")}
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
        key={`${activeTenantId}-${branding.companyName}`}
        branding={branding}
        activeTenant={activeTenant}
        activeTenantId={activeTenantId}
      />
    </div>
  );
}
