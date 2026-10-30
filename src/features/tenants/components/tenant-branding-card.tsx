"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  Moon,
  Palette,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Upload,
  Users,
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
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { requestBrandingUploadUrl, uploadBrandingAsset } from "../api";
import { useActiveTenant, useTenantBranding, useUpdateTenantBranding } from "../queries";
import type {
  Tenant,
  TenantBranding,
  TenantFontFamily,
  UpdateTenantBrandingInput,
} from "../schemas";
import {
  BRANDING_PRESETS,
  computeTenantThemeTokens,
  getContrastRatio,
  GOOGLE_FONTS,
  type BrandingPreset,
} from "../theme";
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

  // Form state initialized directly from props (pure state, no effect needed)
  const [companyName, setCompanyName] = useState(branding?.companyName || activeTenant?.name || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(branding?.logoUrl || null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(branding?.logoDarkUrl || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(branding?.faviconUrl || null);
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor || "#4F46E5");
  const [accentColor, setAccentColor] = useState(branding?.accentColor || "#06B6D4");
  const [primaryDarkColor, setPrimaryDarkColor] = useState<string>(
    branding?.primaryDarkColor || "",
  );
  const [accentDarkColor, setAccentDarkColor] = useState<string>(branding?.accentDarkColor || "");
  const [useDarkOverrides, setUseDarkOverrides] = useState<boolean>(
    Boolean(branding?.primaryDarkColor || branding?.accentDarkColor),
  );
  const [fontFamily, setFontFamily] = useState<string>(branding?.fontFamily || "Inter");
  const [sidebarTheme, setSidebarTheme] = useState<"DARK" | "LIGHT" | "BRAND">(
    (branding?.sidebarTheme as "DARK" | "LIGHT" | "BRAND") || "DARK",
  );
  const [borderRadius, setBorderRadius] = useState(branding?.borderRadius || "0.5rem");
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
    primaryDarkColor: useDarkOverrides && primaryDarkColor.trim() ? primaryDarkColor.trim() : null,
    accentDarkColor: useDarkOverrides && accentDarkColor.trim() ? accentDarkColor.trim() : null,
    fontFamily: (fontFamily as TenantFontFamily) || "Inter",
    sidebarTheme,
    borderRadius,
    supportEmail,
  };

  const previewTokens = computeTenantThemeTokens(previewBranding);

  // WCAG contrast calculation for active preview mode
  const activePrimary = previewDark ? previewTokens.darkPrimary : previewTokens.primary;
  const activePrimaryFg = previewDark
    ? previewTokens.darkPrimaryForeground
    : previewTokens.primaryForeground;
  const contrastRatio = getContrastRatio(activePrimary, activePrimaryFg);
  const contrastPassesAA = contrastRatio >= 4.5;
  const contrastPassesAAA = contrastRatio >= 7.0;

  const handleApplyPreset = (preset: BrandingPreset) => {
    setPrimaryColor(preset.primaryColor);
    setAccentColor(preset.accentColor);
    setPrimaryDarkColor(preset.primaryDarkColor);
    setAccentDarkColor(preset.accentDarkColor);
    setUseDarkOverrides(true);
    setFontFamily(preset.fontFamily);
    setSidebarTheme(preset.sidebarTheme);
    setBorderRadius(preset.borderRadius);
    toast.success(`Applied "${preset.name}" preset!`);
  };

  const resolveBrandingContentType = (filename: string, rawType?: string): string => {
    const ext = filename?.split(".")?.pop()?.toLowerCase();
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
      const uploadFile =
        file.type === contentType ? file : new File([file], file.name, { type: contentType });

      const presigned = await requestBrandingUploadUrl(activeTenantId, {
        type,
        filename: file.name,
        contentType,
      });

      await uploadBrandingAsset(presigned.uploadUrl, presigned.fields, uploadFile);

      if (type === "logo") {
        setLogoUrl(presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ logoUrl: presigned.publicUrl });
      } else if (type === "logo-dark") {
        setLogoDarkUrl(presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ logoDarkUrl: presigned.publicUrl });
      } else if (type === "favicon") {
        setFaviconUrl(presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ faviconUrl: presigned.publicUrl });
      }

      toast.success(`${type.toUpperCase()} uploaded and saved successfully!`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to upload ${type}. Ensure file format is valid.`));
    } finally {
      setUploadingType(null);
      if (e?.target) e.target.value = "";
    }
  };

  const handleRemoveAsset = async (type: "logo" | "logo-dark" | "favicon") => {
    if (!activeTenantId) return;
    try {
      if (type === "logo") {
        setLogoUrl(null);
        await updateBrandingMutation.mutateAsync({ logoUrl: null });
      } else if (type === "logo-dark") {
        setLogoDarkUrl(null);
        await updateBrandingMutation.mutateAsync({ logoDarkUrl: null });
      } else if (type === "favicon") {
        setFaviconUrl(null);
        await updateBrandingMutation.mutateAsync({ faviconUrl: null });
      }
      toast.success(`${type.toUpperCase()} removed successfully`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to remove ${type}`));
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
        primaryDarkColor:
          useDarkOverrides && primaryDarkColor.trim() ? primaryDarkColor.trim() : null,
        accentDarkColor: useDarkOverrides && accentDarkColor.trim() ? accentDarkColor.trim() : null,
        fontFamily: (fontFamily as TenantFontFamily) || "Inter",
        sidebarTheme,
        borderRadius,
        supportEmail: supportEmail.trim() || undefined,
      };

      await updateBrandingMutation.mutateAsync(payload);
      toast.success("Workspace branding updated successfully!");
    } catch {
      toast.error("Failed to save branding changes.");
    }
  };

  const handleReset = () => {
    if (branding) {
      setCompanyName(branding?.companyName || "");
      setLogoUrl(branding?.logoUrl || null);
      setLogoDarkUrl(branding?.logoDarkUrl || null);
      setFaviconUrl(branding?.faviconUrl || null);
      setPrimaryColor(branding?.primaryColor || "#4F46E5");
      setAccentColor(branding?.accentColor || "#06B6D4");
      setPrimaryDarkColor(branding?.primaryDarkColor || "");
      setAccentDarkColor(branding?.accentDarkColor || "");
      setUseDarkOverrides(Boolean(branding?.primaryDarkColor || branding?.accentDarkColor));
      setFontFamily(branding?.fontFamily || "Inter");
      setSidebarTheme((branding?.sidebarTheme as "DARK" | "LIGHT" | "BRAND") || "DARK");
      setBorderRadius(branding?.borderRadius || "0.5rem");
      setSupportEmail(branding?.supportEmail || "");
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
              Configure your organization brand identity, dual-mode theme colors, typography, and
              sidebar layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. One-Click Curated Presets */}
            <div className="border-border/50 bg-muted/20 space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary size-4" />
                  <span className="text-foreground text-xs font-semibold">
                    One-Click Theme Presets
                  </span>
                </div>
                <span className="text-muted-foreground text-[11px]">Instant design system</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BRANDING_PRESETS?.map((preset) => {
                  const isActive =
                    primaryColor?.toLowerCase() === preset?.primaryColor?.toLowerCase() &&
                    accentColor?.toLowerCase() === preset?.accentColor?.toLowerCase() &&
                    fontFamily === preset?.fontFamily &&
                    sidebarTheme === preset?.sidebarTheme;
                  return (
                    <button
                      key={preset?.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={cn(
                        "hover:border-primary/50 flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-all",
                        isActive
                          ? "border-primary ring-primary bg-primary/5 ring-1"
                          : "border-border/60 bg-card",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="truncate text-xs font-semibold">{preset?.name}</span>
                        <div className="flex items-center -space-x-1">
                          <span
                            className="border-background size-3 rounded-full border shadow-2xs"
                            style={{ backgroundColor: preset?.primaryColor }}
                          />
                          <span
                            className="border-background size-3 rounded-full border shadow-2xs"
                            style={{ backgroundColor: preset?.accentColor }}
                          />
                        </div>
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                        <span>{preset?.fontFamily}</span>
                        <span className="font-mono text-[9px] uppercase">
                          {preset?.sidebarTheme}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Display Name */}
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

            {/* 3. Typography Engine */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Type className="text-primary size-4" />
                <span className="text-foreground text-xs font-semibold">Typography Engine</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="font-family-select" className="text-xs">
                    Primary Interface Font
                  </Label>
                  <span className="text-muted-foreground font-mono text-xs">{fontFamily}</span>
                </div>
                <Select value={fontFamily} onValueChange={(val) => setFontFamily(val)}>
                  <SelectTrigger id="font-family-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(GOOGLE_FONTS)?.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: `"${font}", sans-serif` }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  className="border-border/60 bg-muted/30 text-foreground/90 rounded-md border p-2.5 text-xs transition-all"
                  style={{ fontFamily: `"${fontFamily}", sans-serif` }}
                >
                  The quick brown fox jumps over the lazy dog. 0123456789
                </div>
              </div>
            </div>

            {/* 4. Sidebar Theme Modes */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="text-primary size-4" />
                <span className="text-foreground text-xs font-semibold">
                  Sidebar Layout Appearance
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    value: "DARK" as const,
                    title: "Dark",
                    desc: "Sleek contrast",
                    bg: "#09090b",
                    fg: "#fafafa",
                  },
                  {
                    value: "LIGHT" as const,
                    title: "Light",
                    desc: "Clean & minimal",
                    bg: "#ffffff",
                    fg: "#09090b",
                  },
                  {
                    value: "BRAND" as const,
                    title: "Brand",
                    desc: "Immersive tint",
                    bg: primaryColor,
                    fg: previewTokens.primaryForeground,
                  },
                ].map((mode) => {
                  const isSelected = sidebarTheme === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setSidebarTheme(mode.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-center transition-all",
                        isSelected
                          ? "border-primary ring-primary/40 bg-primary/5 ring-2"
                          : "border-border/60 hover:border-border bg-card",
                      )}
                    >
                      <div
                        className="border-border/40 flex h-7 w-full items-center justify-center rounded border text-[11px] font-semibold"
                        style={{ backgroundColor: mode.bg, color: mode.fg }}
                      >
                        Aa
                      </div>
                      <span className="text-xs font-medium">{mode.title}</span>
                      <span className="text-muted-foreground text-[10px]">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Asset Uploaders */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <span className="text-foreground text-xs font-semibold">Logo & Asset Management</span>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Light Mode Logo */}
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
                          onClick={() => handleRemoveAsset("logo")}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove light logo"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => lightLogoInputRef?.current?.click()}
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

                {/* Dark Mode Logo */}
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
                          onClick={() => handleRemoveAsset("logo-dark")}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove dark logo"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => darkLogoInputRef?.current?.click()}
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

                {/* Browser Favicon */}
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
                          onClick={() => handleRemoveAsset("favicon")}
                          className="absolute -top-1 -right-1 size-5 rounded-full"
                          aria-label="Remove favicon"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => faviconInputRef?.current?.click()}
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

            {/* 6. Brand Colors & Curvature */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <span className="text-foreground text-xs font-semibold">Brand Colors & Geometry</span>

              {/* Primary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="primary-color" className="text-xs">
                    Primary Brand Anchor (Light Mode)
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
                    Accent Color (Light Mode)
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

              {/* Dark Mode Color Overrides */}
              <div className="border-border/40 bg-muted/20 space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode-override" className="text-xs font-semibold">
                      Dark Mode Palette Overrides
                    </Label>
                    <p className="text-muted-foreground text-[11px]">
                      Specify optimized high-contrast primary and accent shades for Dark Mode.
                    </p>
                  </div>
                  <Switch
                    id="dark-mode-override"
                    checked={useDarkOverrides}
                    onCheckedChange={(checked) => {
                      setUseDarkOverrides(checked);
                      if (checked && !primaryDarkColor) {
                        setPrimaryDarkColor(primaryColor);
                        setAccentDarkColor(accentColor);
                      }
                    }}
                  />
                </div>

                {useDarkOverrides && (
                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="dark-primary-color" className="text-[11px]">
                        Dark Mode Primary
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="dark-primary-color"
                          type="color"
                          value={primaryDarkColor || primaryColor}
                          onChange={(e) => setPrimaryDarkColor(e?.target?.value ?? primaryColor)}
                          className="border-border/80 size-8 cursor-pointer rounded border p-0.5"
                        />
                        <Input
                          value={primaryDarkColor || primaryColor}
                          onChange={(e) => setPrimaryDarkColor(e?.target?.value ?? "")}
                          className="h-8 font-mono text-xs"
                          placeholder="#6366F1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dark-accent-color" className="text-[11px]">
                        Dark Mode Accent
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="dark-accent-color"
                          type="color"
                          value={accentDarkColor || accentColor}
                          onChange={(e) => setAccentDarkColor(e?.target?.value ?? accentColor)}
                          className="border-border/80 size-8 cursor-pointer rounded border p-0.5"
                        />
                        <Input
                          value={accentDarkColor || accentColor}
                          onChange={(e) => setAccentDarkColor(e?.target?.value ?? "")}
                          className="h-8 font-mono text-xs"
                          placeholder="#22D3EE"
                        />
                      </div>
                    </div>
                  </div>
                )}
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

            {/* 7. Support Contact & Domain Link */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Globe className="text-primary size-3.5" /> Domain & URL Settings
                </span>
                <a
                  href="/settings/url"
                  className="text-primary hover:text-primary/80 text-xs font-medium underline-offset-2 hover:underline"
                >
                  Manage domains →
                </a>
              </div>

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
              <Button variant="outline" onClick={handleReset}>
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
                  Real-time simulation across Light & Dark modes and Sidebar styles.
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
                  "overflow-hidden rounded-xl border transition-colors",
                  previewDark ? "dark bg-zinc-950 text-white" : "bg-white text-zinc-900",
                )}
                style={{
                  fontFamily: `"${previewTokens.fontFamily}", sans-serif`,
                  ["--primary" as string]: activePrimary,
                  ["--primary-foreground" as string]: activePrimaryFg,
                  ["--accent" as string]: previewDark
                    ? previewTokens.darkAccent
                    : previewTokens.accent,
                  ["--accent-foreground" as string]: previewDark
                    ? previewTokens.darkAccentForeground
                    : previewTokens.accentForeground,
                  ["--radius" as string]: previewTokens.radius,
                }}
              >
                {/* Simulation: Split Sidebar + Content Layout */}
                <div className="flex min-h-[360px]">
                  {/* Mock Sidebar */}
                  <div
                    className="flex w-32 shrink-0 flex-col justify-between border-r p-2.5 transition-colors"
                    style={{
                      backgroundColor: previewDark
                        ? previewTokens.darkSidebarBg
                        : previewTokens.sidebarBg,
                      color: previewDark ? previewTokens.darkSidebarFg : previewTokens.sidebarFg,
                      borderColor: previewDark ? "#27272a" : "#e4e4e7",
                    }}
                  >
                    <div className="space-y-3">
                      {/* Logo in Sidebar */}
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <TenantLogo
                          variant="icon"
                          branding={previewBranding}
                          tenant={activeTenant}
                        />
                        <span className="truncate text-[11px] font-semibold">
                          {companyName || "Acme"}
                        </span>
                      </div>

                      {/* Mock Navigation links */}
                      <div className="space-y-1 text-[11px]">
                        <div
                          className="flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-opacity"
                          style={{
                            backgroundColor:
                              sidebarTheme === "BRAND" ? "rgba(255,255,255,0.2)" : activePrimary,
                            color: sidebarTheme === "BRAND" ? "#ffffff" : activePrimaryFg,
                            borderRadius: previewTokens.radius,
                          }}
                        >
                          <LayoutDashboard className="size-3 shrink-0" />
                          <span className="truncate">Home</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 opacity-70">
                          <Users className="size-3 shrink-0" />
                          <span className="truncate">Team</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 opacity-70">
                          <Settings className="size-3 shrink-0" />
                          <span className="truncate">Settings</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-current/15 pt-2 text-[9px] opacity-70">
                      {sidebarTheme} Mode
                    </div>
                  </div>

                  {/* Mock Main Area */}
                  <div className="flex-1 p-3">
                    {/* Header bar */}
                    <div
                      className={cn(
                        "flex items-center justify-between border-b pb-2.5",
                        previewDark ? "border-zinc-800" : "border-zinc-200",
                      )}
                    >
                      <span className="text-xs font-semibold">Dashboard</span>
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[9px]"
                        style={{ borderRadius: previewTokens.radius }}
                      >
                        PRO
                      </Badge>
                    </div>

                    {/* Controls Sample */}
                    <div className="mt-3 space-y-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold">Typography Showcase</div>
                        <div className="text-muted-foreground text-[10px]">
                          Font: {previewTokens.fontFamily}
                        </div>
                      </div>

                      {/* Buttons Mockup */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[11px] font-semibold shadow-2xs transition-opacity hover:opacity-90"
                          style={{
                            backgroundColor: activePrimary,
                            color: activePrimaryFg,
                            borderRadius: previewTokens.radius,
                          }}
                        >
                          Primary
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "border px-2.5 py-1 text-[11px] font-medium shadow-2xs",
                            previewDark
                              ? "border-zinc-800 hover:bg-zinc-900"
                              : "border-zinc-200 hover:bg-zinc-50",
                          )}
                          style={{ borderRadius: previewTokens.radius }}
                        >
                          Secondary
                        </button>
                      </div>

                      {/* Mock Input */}
                      <input
                        type="text"
                        readOnly
                        placeholder="Search resources…"
                        className={cn(
                          "w-full border px-2.5 py-1 text-[11px] outline-none",
                          previewDark
                            ? "border-zinc-800 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-900",
                        )}
                        style={{ borderRadius: previewTokens.radius }}
                      />

                      {/* Accent Status Pill */}
                      <div
                        className={cn(
                          "flex items-center justify-between rounded border p-2",
                          previewDark
                            ? "border-zinc-800 bg-zinc-900/50"
                            : "border-zinc-200 bg-zinc-50",
                        )}
                        style={{ borderRadius: previewTokens.radius }}
                      >
                        <span className="text-[10px] font-medium">Accent Highlight</span>
                        <div
                          className="size-3.5 rounded-full"
                          style={{
                            backgroundColor: previewDark
                              ? previewTokens.darkAccent
                              : previewTokens.accent,
                          }}
                          title="Accent Indicator"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accessibility & Contrast Telemetry */}
                <div
                  className={cn(
                    "flex items-center justify-between border-t p-3 text-[11px]",
                    previewDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
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
                    {contrastPassesAAA
                      ? "WCAG AAA Pass"
                      : contrastPassesAA
                        ? "WCAG AA Pass"
                        : "Low Contrast"}
                  </Badge>
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
      key={activeTenantId}
      branding={branding}
      activeTenant={activeTenant}
      activeTenantId={activeTenantId}
    />
  );
}
