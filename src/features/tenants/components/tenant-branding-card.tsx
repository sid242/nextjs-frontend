"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { requestBrandingUploadUrl, uploadBrandingAsset } from "../api";
import {
  useActiveTenant,
  useTenantBranding,
  useUpdateTenantBranding,
  useVerifyTenantCustomDomain,
} from "../queries";
import type { Tenant, TenantBranding, UpdateTenantBrandingInput } from "../schemas";
import { computeTenantThemeTokens, getContrastRatio } from "../theme";
import { TenantLogo } from "./tenant-logo";

const PRIMARY_COLOR_PRESETS = [
  { label: "Indigo", value: "#4F46E5" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Blue", value: "#2563EB" },
  { label: "Sky", value: "#0284C7" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#D97706" },
  { label: "Rose", value: "#E11D48" },
  { label: "Slate", value: "#334155" },
];

const ACCENT_COLOR_PRESETS = [
  { label: "Cyan", value: "#06B6D4" },
  { label: "Teal", value: "#0D9488" },
  { label: "Fuchsia", value: "#C026D3" },
  { label: "Orange", value: "#EA580C" },
  { label: "Lime", value: "#65A30D" },
];

const RADIUS_PRESETS = [
  { label: "Sharp (0px)", value: "0rem" },
  { label: "Subtle (6px)", value: "0.375rem" },
  { label: "Balanced (8px)", value: "0.5rem" },
  { label: "Soft (10px)", value: "0.625rem" },
  { label: "Rounded (12px)", value: "0.75rem" },
  { label: "Pill (16px)", value: "1rem" },
];

interface TenantBrandingFormProps {
  branding?: TenantBranding | null;
  activeTenant?: Tenant | null;
  activeTenantId: string;
}

function TenantBrandingForm({ branding, activeTenant, activeTenantId }: TenantBrandingFormProps) {
  const updateBrandingMutation = useUpdateTenantBranding(activeTenantId);
  const verifyDomainMutation = useVerifyTenantCustomDomain(activeTenantId);

  // Form state initialized directly from props (pure state, no effect needed)
  const [companyName, setCompanyName] = useState(branding?.companyName || activeTenant?.name || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(branding?.logoUrl || null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(branding?.logoDarkUrl || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(branding?.faviconUrl || null);
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor || "#4F46E5");
  const [accentColor, setAccentColor] = useState(branding?.accentColor || "#06B6D4");
  const [borderRadius, setBorderRadius] = useState(branding?.borderRadius || "0.5rem");
  const [customDomain, setCustomDomain] = useState(branding?.customDomain || "");
  const [supportEmail, setSupportEmail] = useState(branding?.supportEmail || "");

  // Uploading state
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Live preview mode (light/dark)
  const [previewDark, setPreviewDark] = useState(false);

  // Hidden file input refs
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const previewBranding: Partial<TenantBranding> = {
    companyName: companyName.trim() || activeTenant?.name || "Organization",
    logoUrl,
    logoDarkUrl,
    faviconUrl,
    primaryColor,
    accentColor,
    borderRadius,
    customDomain,
    supportEmail,
  };

  const previewTokens = computeTenantThemeTokens(previewBranding);
  const contrastRatio = getContrastRatio(primaryColor, previewTokens.primaryForeground);
  const contrastPassesAA = contrastRatio >= 4.5;

  const resolveBrandingContentType = (filename: string, rawType?: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "ico" || ext === "icon") return "image/x-icon";
    if (ext === "svg") return "image/svg+xml";
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "webp") return "image/webp";
    if (rawType && rawType.startsWith("image/")) {
      if (
        [
          "image/ico",
          "image/icon",
          "image/x-ico",
          "image/vnd.microsoft.icon",
          "application/x-ico",
        ].includes(rawType)
      ) {
        return "image/x-icon";
      }
      return rawType;
    }
    return "image/png";
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    type: "logo" | "logo-dark" | "favicon",
  ) => {
    const file = e?.target?.files?.[0];
    if (!file || !activeTenantId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size (2MB)");
      return;
    }

    setUploadingType(type);
    try {
      const contentType = resolveBrandingContentType(file.name, file.type);
      // Re-create the file object with normalized MIME type if needed so FormData headers match
      const uploadFile =
        file.type === contentType ? file : new File([file], file.name, { type: contentType });

      const presigned = await requestBrandingUploadUrl(activeTenantId, {
        type,
        filename: file.name,
        contentType,
      });

      await uploadBrandingAsset(presigned.uploadUrl, presigned.fields, uploadFile);

      if (type === "logo") setLogoUrl(presigned.publicUrl);
      if (type === "logo-dark") setLogoDarkUrl(presigned.publicUrl);
      if (type === "favicon") setFaviconUrl(presigned.publicUrl);

      toast.success(`${type.toUpperCase()} uploaded successfully!`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to upload ${type}. Ensure file format is valid.`));
    } finally {
      setUploadingType(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!activeTenantId) return;
    try {
      const payload: UpdateTenantBrandingInput = {
        companyName: companyName.trim() || undefined,
        logoUrl,
        logoDarkUrl,
        faviconUrl,
        primaryColor,
        accentColor,
        borderRadius,
        customDomain: customDomain.trim() || null,
        supportEmail: supportEmail.trim() || undefined,
      };

      await updateBrandingMutation.mutateAsync(payload);
      toast.success("Workspace branding updated successfully!");
    } catch {
      toast.error("Failed to save branding changes.");
    }
  };

  const handleVerifyDomain = async () => {
    if (!activeTenantId || !customDomain.trim()) return;
    try {
      await verifyDomainMutation.mutateAsync({ bypassVerification: false });
      toast.success("Custom domain verified and activated!");
    } catch {
      toast.error("DNS verification failed. Ensure TXT challenge record is configured.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Configuration Controls (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Palette className="text-primary size-4" /> Workspace White-Label Branding
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your organization brand identity, logos, color tokens, and custom domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="brand-name" className="text-xs font-semibold">
                Company / Organization Display Name
              </Label>
              <Input
                id="brand-name"
                value={companyName}
                onChange={(e) => setCompanyName(e?.target?.value ?? "")}
                placeholder="e.g. Acme Corporation"
              />
              <p className="text-muted-foreground text-[11px]">
                Overrides the workspace name in the navigation header, document title, and emails.
              </p>
            </div>

            {/* Asset Uploaders */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <span className="text-foreground text-xs font-semibold">Logo & Asset Management</span>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* 1. Light Mode Logo */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Light Mode Logo</Label>
                  <div className="bg-muted/30 border-border/60 relative flex h-24 flex-col items-center justify-center rounded-lg border border-dashed p-2 text-center">
                    {logoUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Light Logo"
                          className="max-h-16 max-w-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setLogoUrl(null)}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove light logo"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => lightLogoInputRef.current?.click()}
                        disabled={uploadingType === "logo"}
                        className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1 text-[11px] transition-colors"
                      >
                        {uploadingType === "logo" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        <span>Upload Light</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={lightLogoInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                </div>

                {/* 2. Dark Mode Logo */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Dark Mode Logo</Label>
                  <div className="relative flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-2 text-center">
                    {logoDarkUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoDarkUrl}
                          alt="Dark Logo"
                          className="max-h-16 max-w-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setLogoDarkUrl(null)}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove dark logo"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => darkLogoInputRef.current?.click()}
                        disabled={uploadingType === "logo-dark"}
                        className="flex flex-col items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-white"
                      >
                        {uploadingType === "logo-dark" ? (
                          <Loader2 className="size-4 animate-spin text-white" />
                        ) : (
                          <Upload className="size-4 text-white" />
                        )}
                        <span>Upload Dark</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={darkLogoInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo-dark")}
                  />
                </div>

                {/* 3. Browser Favicon */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Browser Favicon</Label>
                  <div className="bg-muted/30 border-border/60 relative flex h-24 flex-col items-center justify-center rounded-lg border border-dashed p-2 text-center">
                    {faviconUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={faviconUrl}
                          alt="Favicon"
                          className="size-8 rounded-sm object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setFaviconUrl(null)}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove favicon"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={uploadingType === "favicon"}
                        className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1 text-[11px] transition-colors"
                      >
                        {uploadingType === "favicon" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        <span>Upload Favicon</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept=".ico,.png,.svg,.jpg,.jpeg,.webp,image/x-icon,image/vnd.microsoft.icon,image/ico,image/icon,image/x-ico,image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "favicon")}
                  />
                </div>
              </div>
            </div>

            {/* Colors & Radii */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <span className="text-foreground text-xs font-semibold">Brand Colors & Geometry</span>

              {/* Primary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="primary-color" className="text-xs">
                    Primary Brand Anchor
                  </Label>
                  <span className="text-muted-foreground font-mono text-xs">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e?.target?.value ?? "#4F46E5")}
                    className="border-border/80 size-9 cursor-pointer rounded-md border p-0.5"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRIMARY_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPrimaryColor(c.value)}
                        className={cn(
                          "size-6 rounded-full border transition-all",
                          primaryColor.toLowerCase() === c.value.toLowerCase()
                            ? "ring-foreground scale-110 ring-2"
                            : "opacity-80 hover:opacity-100",
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accent-color" className="text-xs">
                    Accent Color
                  </Label>
                  <span className="text-muted-foreground font-mono text-xs">{accentColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e?.target?.value ?? "#06B6D4")}
                    className="border-border/80 size-9 cursor-pointer rounded-md border p-0.5"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ACCENT_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAccentColor(c.value)}
                        className={cn(
                          "size-6 rounded-full border transition-all",
                          accentColor.toLowerCase() === c.value.toLowerCase()
                            ? "ring-foreground scale-110 ring-2"
                            : "opacity-80 hover:opacity-100",
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <Label htmlFor="radius-select" className="text-xs">
                  Component Corner Curvature (Border Radius)
                </Label>
                <Select value={borderRadius} onValueChange={(val) => setBorderRadius(val)}>
                  <SelectTrigger id="radius-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_PRESETS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Domain Section */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Globe className="text-primary size-3.5" /> Custom White-Label Domain
                </span>
                <Badge
                  variant={branding?.customDomainStatus === "ACTIVE" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {branding?.customDomainStatus ?? "PENDING"}
                </Badge>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain-input" className="text-xs">
                  Domain Hostname
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="domain-input"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e?.target?.value ?? "")}
                    placeholder="e.g. portal.acmecorp.com"
                    className="font-mono text-xs"
                  />
                  {customDomain.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyDomain}
                      disabled={verifyDomainMutation.isPending}
                      className="shrink-0"
                    >
                      {verifyDomainMutation.isPending ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1.5 size-3.5" />
                      )}
                      Verify DNS
                    </Button>
                  )}
                </div>
              </div>

              {customDomain.trim() && (
                <div className="bg-muted/40 text-muted-foreground space-y-1.5 rounded-md border p-3 font-mono text-[11px]">
                  <p className="text-foreground font-semibold">Required DNS Configuration:</p>
                  <p>
                    1. CNAME: host=&quot;{customDomain}&quot;
                    target=&quot;cname.platform.local&quot;
                  </p>
                  <p>
                    2. TXT: host=&quot;_saas-verify.{customDomain}&quot; value=&quot;saas-verify=
                    {activeTenantId}&quot;
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="support-email" className="text-xs">
                  Support Contact Email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e?.target?.value ?? "")}
                  placeholder="e.g. support@acmecorp.com"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (branding) {
                    setCompanyName(branding.companyName || "");
                    setLogoUrl(branding.logoUrl || null);
                    setLogoDarkUrl(branding.logoDarkUrl || null);
                    setFaviconUrl(branding.faviconUrl || null);
                    setPrimaryColor(branding.primaryColor || "#4F46E5");
                    setAccentColor(branding.accentColor || "#06B6D4");
                    setBorderRadius(branding.borderRadius || "0.5rem");
                    setCustomDomain(branding.customDomain || "");
                    setSupportEmail(branding.supportEmail || "");
                  }
                }}
              >
                Reset Changes
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateBrandingMutation.isPending}
                className="gap-2"
              >
                {updateBrandingMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save Branding Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Interactive Preview Canvas (5 cols) */}
      <div className="lg:col-span-5">
        <div className="sticky top-20 space-y-4">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="border-border/50 flex flex-row items-center justify-between border-b pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Live Experience Preview</CardTitle>
                <CardDescription className="text-[11px]">
                  Real-time simulation of tenant visual tokens.
                </CardDescription>
              </div>

              {/* Theme Toggle within Preview */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewDark(false)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border transition-all",
                    !previewDark ? "bg-muted text-foreground" : "text-muted-foreground opacity-60",
                  )}
                  title="Preview Light Mode"
                >
                  <Sun className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDark(true)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border transition-all",
                    previewDark ? "bg-muted text-foreground" : "text-muted-foreground opacity-60",
                  )}
                  title="Preview Dark Mode"
                >
                  <Moon className="size-3.5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {/* Scoped Preview Wrapper */}
              <div
                className={cn(
                  "overflow-hidden rounded-xl border p-4 transition-colors",
                  previewDark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900",
                )}
                style={{
                  ["--primary" as string]: previewTokens.primary,
                  ["--primary-foreground" as string]: previewTokens.primaryForeground,
                  ["--accent" as string]: previewTokens.accent,
                  ["--accent-foreground" as string]: previewTokens.accentForeground,
                  ["--radius" as string]: previewTokens.radius,
                }}
              >
                {/* Mock Header */}
                <div
                  className={cn(
                    "flex items-center justify-between border-b pb-3",
                    previewDark ? "border-zinc-800" : "border-zinc-200",
                  )}
                >
                  <TenantLogo
                    variant="full"
                    branding={previewBranding}
                    tenant={activeTenant}
                    showName
                  />
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{ borderRadius: previewTokens.radius }}
                    >
                      PRO
                    </Badge>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Workspace Navigation</div>
                    <div className="text-muted-foreground text-[11px]">
                      Interactive controls rendered using active brand tokens.
                    </div>
                  </div>

                  {/* Buttons Mockup */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold shadow-xs transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: previewTokens.primary,
                        color: previewTokens.primaryForeground,
                        borderRadius: previewTokens.radius,
                      }}
                    >
                      Primary Action
                    </button>

                    <button
                      type="button"
                      className={cn(
                        "border px-3 py-1.5 text-xs font-semibold shadow-2xs",
                        previewDark
                          ? "border-zinc-800 hover:bg-zinc-900"
                          : "border-zinc-200 hover:bg-zinc-50",
                      )}
                      style={{ borderRadius: previewTokens.radius }}
                    >
                      Secondary
                    </button>
                  </div>

                  {/* Mock Input Field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium opacity-80">Search Directory</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Type a query…"
                      className={cn(
                        "w-full border px-3 py-1.5 text-xs outline-none",
                        previewDark
                          ? "border-zinc-800 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-900",
                      )}
                      style={{ borderRadius: previewTokens.radius }}
                    />
                  </div>

                  {/* Mock Switch & Status */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-2.5",
                      previewDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50",
                    )}
                    style={{ borderRadius: previewTokens.radius }}
                  >
                    <div className="text-[11px] font-medium">Automatic Deployment</div>
                    <div
                      className="size-4 rounded-full"
                      style={{ backgroundColor: previewTokens.accent }}
                      title="Accent Color Badge"
                    />
                  </div>

                  {/* Accessibility & Contrast Telemetry */}
                  <div
                    className={cn(
                      "flex items-center justify-between border-t pt-3 text-[11px]",
                      previewDark ? "border-zinc-800" : "border-zinc-200",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {contrastPassesAA ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-3.5 text-amber-500" />
                      )}
                      <span className="font-semibold">Contrast: {contrastRatio.toFixed(1)}:1</span>
                    </div>

                    <Badge
                      variant={contrastPassesAA ? "default" : "destructive"}
                      className="h-4 px-1.5 text-[9px]"
                    >
                      {contrastPassesAA ? "WCAG AA Pass" : "Low Contrast"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TenantBrandingCard() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: branding, isLoading } = useTenantBranding(activeTenantId);

  if (isLoading || !activeTenantId) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TenantBrandingForm
      key={`${branding?.tenantId ?? "default"}-${activeTenantId}`}
      branding={branding}
      activeTenant={activeTenant}
      activeTenantId={activeTenantId}
    />
  );
}
