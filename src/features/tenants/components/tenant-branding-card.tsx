"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  LogIn,
  Mail,
  Moon,
  Palette,
  Settings,
  Shield,
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
import { ImageCropperDialog, type CropAssetType } from "./image-cropper-dialog";
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

const SECONDARY_COLOR_PRESETS = [
  { label: "Indigo Mist", value: "#E0E7FF" },
  { label: "Emerald Mist", value: "#D1FAE5" },
  { label: "Blue Mist", value: "#DBEAFE" },
  { label: "Purple Mist", value: "#EDE9FE" },
  { label: "Amber Mist", value: "#FEF3C7" },
  { label: "Slate Mist", value: "#F1F5F9" },
  { label: "Zinc Light", value: "#F4F4F5" },
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

interface BrandingFormData {
  companyName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryDarkColor: string;
  secondaryDarkColor: string;
  accentDarkColor: string;
  fontFamily: string;
  sidebarTheme: "DARK" | "LIGHT" | "BRAND";
  borderRadius: string;
  supportEmail: string;
  authHeadline: string;
  authSubtitle: string;
  authCoverUrl: string | null;
  authLayout: "SPLIT" | "CARD";
  hideWatermark: boolean;
}

function TenantBrandingForm({ branding, activeTenant, activeTenantId }: TenantBrandingFormProps) {
  const updateBrandingMutation = useUpdateTenantBranding(activeTenantId);

  // Grouped form state (single state container with typed updater)
  const [formData, setFormData] = useState<BrandingFormData>({
    companyName: branding?.companyName || activeTenant?.name || "",
    logoUrl: branding?.logoUrl || null,
    logoDarkUrl: branding?.logoDarkUrl || null,
    faviconUrl: branding?.faviconUrl || null,
    primaryColor: branding?.primaryColor || "#4F46E5",
    secondaryColor: branding?.secondaryColor || "",
    accentColor: branding?.accentColor || "#06B6D4",
    primaryDarkColor: branding?.primaryDarkColor || "",
    secondaryDarkColor: branding?.secondaryDarkColor || "",
    accentDarkColor: branding?.accentDarkColor || "",
    fontFamily: branding?.fontFamily || "Inter",
    sidebarTheme: (branding?.sidebarTheme as "DARK" | "LIGHT" | "BRAND") || "DARK",
    borderRadius: branding?.borderRadius || "0.5rem",
    supportEmail: branding?.supportEmail || "",
    authHeadline: branding?.authHeadline || "",
    authSubtitle: branding?.authSubtitle || "",
    authCoverUrl: branding?.authCoverUrl || null,
    authLayout: (branding?.authLayout as "SPLIT" | "CARD") || "SPLIT",
    hideWatermark: branding?.hideWatermark ?? false,
  });

  const [useDarkOverrides, setUseDarkOverrides] = useState<boolean>(
    Boolean(
      branding?.primaryDarkColor || branding?.secondaryDarkColor || branding?.accentDarkColor,
    ),
  );

  const updateField = <K extends keyof BrandingFormData>(key: K, value: BrandingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Uploading state
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // In-browser Image Cropper & Aspect Ratio Pipeline
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("");
  const [cropAssetType, setCropAssetType] = useState<CropAssetType>("logo");

  // Live preview mode (light/dark and app/auth/email)
  const [previewDark, setPreviewDark] = useState(false);
  const [previewTab, setPreviewTab] = useState<"app" | "auth" | "email">("app");

  // Hidden file input refs
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const previewBranding: Partial<TenantBranding> = {
    companyName: formData.companyName.trim() || activeTenant?.name || "Organization",
    logoUrl: formData.logoUrl,
    logoDarkUrl: formData.logoDarkUrl,
    faviconUrl: formData.faviconUrl,
    primaryColor: formData.primaryColor,
    secondaryColor: formData.secondaryColor.trim() ? formData.secondaryColor.trim() : null,
    accentColor: formData.accentColor,
    primaryDarkColor:
      useDarkOverrides && formData.primaryDarkColor.trim()
        ? formData.primaryDarkColor.trim()
        : null,
    secondaryDarkColor:
      useDarkOverrides && formData.secondaryDarkColor.trim()
        ? formData.secondaryDarkColor.trim()
        : null,
    accentDarkColor:
      useDarkOverrides && formData.accentDarkColor.trim() ? formData.accentDarkColor.trim() : null,
    fontFamily: (formData.fontFamily as TenantFontFamily) || "Inter",
    sidebarTheme: formData.sidebarTheme,
    borderRadius: formData.borderRadius,
    authHeadline: formData.authHeadline.trim() || undefined,
    authSubtitle: formData.authSubtitle.trim() || undefined,
    authCoverUrl: formData.authCoverUrl,
    authLayout: formData.authLayout,
    hideWatermark: formData.hideWatermark,
    supportEmail: formData.supportEmail,
  };

  const previewTokens = computeTenantThemeTokens(previewBranding);

  // WCAG contrast calculation for active preview mode
  const activePrimary = previewDark ? previewTokens.darkPrimary : previewTokens.primary;
  const activePrimaryFg = previewDark
    ? previewTokens.darkPrimaryForeground
    : previewTokens.primaryForeground;
  const activeSecondary = previewDark ? previewTokens.darkSecondary : previewTokens.secondary;
  const activeSecondaryFg = previewDark
    ? previewTokens.darkSecondaryForeground
    : previewTokens.secondaryForeground;
  const contrastRatio = getContrastRatio(activePrimary, activePrimaryFg);
  const contrastPassesAA = contrastRatio >= 4.5;
  const contrastPassesAAA = contrastRatio >= 7.0;

  const handleApplyPreset = (preset: BrandingPreset) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      primaryDarkColor: preset.primaryDarkColor,
      secondaryDarkColor: preset.secondaryDarkColor,
      accentDarkColor: preset.accentDarkColor,
      fontFamily: preset.fontFamily,
      sidebarTheme: preset.sidebarTheme,
      borderRadius: preset.borderRadius,
    }));
    setUseDarkOverrides(true);
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

  const uploadAssetFile = async (file: File, type: CropAssetType) => {
    if (!activeTenantId) return;

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
        updateField("logoUrl", presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ logoUrl: presigned.publicUrl });
      } else if (type === "logo-dark") {
        updateField("logoDarkUrl", presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ logoDarkUrl: presigned.publicUrl });
      } else if (type === "favicon") {
        updateField("faviconUrl", presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ faviconUrl: presigned.publicUrl });
      } else if (type === "cover") {
        updateField("authCoverUrl", presigned.publicUrl);
        await updateBrandingMutation.mutateAsync({ authCoverUrl: presigned.publicUrl });
      }

      toast.success(`${type.toUpperCase()} uploaded and saved successfully!`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to upload ${type}. Ensure file format is valid.`));
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>, type: CropAssetType) => {
    const file = e?.target?.files?.[0];
    if (!file || !activeTenantId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size (2MB)");
      return;
    }

    const ext = file.name?.split(".")?.pop()?.toLowerCase();
    // SVGs and ICOs are vector / icon binaries, upload directly without raster crop
    if (ext === "svg" || ext === "ico") {
      void uploadAssetFile(file, type);
      if (e?.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropFileName(file.name);
      setCropAssetType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    if (e?.target) e.target.value = "";
  };

  const handleRemoveAsset = async (type: "logo" | "logo-dark" | "favicon" | "cover") => {
    if (!activeTenantId) return;
    try {
      if (type === "logo") {
        updateField("logoUrl", null);
        await updateBrandingMutation.mutateAsync({ logoUrl: null });
      } else if (type === "logo-dark") {
        updateField("logoDarkUrl", null);
        await updateBrandingMutation.mutateAsync({ logoDarkUrl: null });
      } else if (type === "favicon") {
        updateField("faviconUrl", null);
        await updateBrandingMutation.mutateAsync({ faviconUrl: null });
      } else if (type === "cover") {
        updateField("authCoverUrl", null);
        await updateBrandingMutation.mutateAsync({ authCoverUrl: null });
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
        companyName: formData.companyName.trim() || undefined,
        logoUrl: formData.logoUrl,
        logoDarkUrl: formData.logoDarkUrl,
        faviconUrl: formData.faviconUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor.trim() ? formData.secondaryColor.trim() : null,
        accentColor: formData.accentColor,
        primaryDarkColor:
          useDarkOverrides && formData.primaryDarkColor.trim()
            ? formData.primaryDarkColor.trim()
            : null,
        secondaryDarkColor:
          useDarkOverrides && formData.secondaryDarkColor.trim()
            ? formData.secondaryDarkColor.trim()
            : null,
        accentDarkColor:
          useDarkOverrides && formData.accentDarkColor.trim()
            ? formData.accentDarkColor.trim()
            : null,
        fontFamily: (formData.fontFamily as TenantFontFamily) || "Inter",
        sidebarTheme: formData.sidebarTheme,
        borderRadius: formData.borderRadius,
        authHeadline: formData.authHeadline.trim() || undefined,
        authSubtitle: formData.authSubtitle.trim() || undefined,
        authCoverUrl: formData.authCoverUrl,
        authLayout: formData.authLayout,
        hideWatermark: formData.hideWatermark,
        supportEmail: formData.supportEmail.trim() || undefined,
      };

      await updateBrandingMutation.mutateAsync(payload);
      toast.success("Workspace branding updated successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save branding changes."));
    }
  };

  const handleReset = () => {
    setFormData({
      companyName: branding?.companyName || activeTenant?.name || "",
      logoUrl: branding?.logoUrl || null,
      logoDarkUrl: branding?.logoDarkUrl || null,
      faviconUrl: branding?.faviconUrl || null,
      primaryColor: branding?.primaryColor || "#4F46E5",
      secondaryColor: branding?.secondaryColor || "",
      accentColor: branding?.accentColor || "#06B6D4",
      primaryDarkColor: branding?.primaryDarkColor || "",
      secondaryDarkColor: branding?.secondaryDarkColor || "",
      accentDarkColor: branding?.accentDarkColor || "",
      fontFamily: branding?.fontFamily || "Inter",
      sidebarTheme: (branding?.sidebarTheme as "DARK" | "LIGHT" | "BRAND") || "DARK",
      borderRadius: branding?.borderRadius || "0.5rem",
      supportEmail: branding?.supportEmail || "",
      authHeadline: branding?.authHeadline || "",
      authSubtitle: branding?.authSubtitle || "",
      authCoverUrl: branding?.authCoverUrl || null,
      authLayout: (branding?.authLayout as "SPLIT" | "CARD") || "SPLIT",
      hideWatermark: branding?.hideWatermark ?? false,
    });
    setUseDarkOverrides(
      Boolean(
        branding?.primaryDarkColor || branding?.secondaryDarkColor || branding?.accentDarkColor,
      ),
    );
    toast.info("Branding customizations reset to current saved values");
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
                    formData.primaryColor?.toLowerCase() === preset?.primaryColor?.toLowerCase() &&
                    (formData.secondaryColor
                      ? formData.secondaryColor.toLowerCase() ===
                        preset?.secondaryColor?.toLowerCase()
                      : true) &&
                    formData.accentColor?.toLowerCase() === preset?.accentColor?.toLowerCase() &&
                    formData.fontFamily === preset?.fontFamily &&
                    formData.sidebarTheme === preset?.sidebarTheme;
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
                            title="Primary"
                          />
                          <span
                            className="border-background size-3 rounded-full border shadow-2xs"
                            style={{ backgroundColor: preset?.secondaryColor }}
                            title="Secondary"
                          />
                          <span
                            className="border-background size-3 rounded-full border shadow-2xs"
                            style={{ backgroundColor: preset?.accentColor }}
                            title="Accent"
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
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e?.target?.value ?? "")}
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
                  <span className="text-muted-foreground font-mono text-xs">
                    {formData.fontFamily}
                  </span>
                </div>
                <Select
                  value={formData.fontFamily}
                  onValueChange={(val) => updateField("fontFamily", val)}
                >
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
                  style={{ fontFamily: `"${formData.fontFamily}", sans-serif` }}
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
                    bg: formData.primaryColor,
                    fg: previewTokens.primaryForeground,
                  },
                ].map((mode) => {
                  const isSelected = formData.sidebarTheme === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => updateField("sidebarTheme", mode.value)}
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
                    {formData.logoUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.logoUrl}
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
                    onChange={(e) => handleFileInputChange(e, "logo")}
                  />
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Dark Mode Logo</Label>
                  <div className="relative flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-2 text-center">
                    {formData.logoDarkUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.logoDarkUrl}
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
                    onChange={(e) => handleFileInputChange(e, "logo-dark")}
                  />
                </div>

                {/* Browser Favicon */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Browser Favicon</Label>
                  <div className="bg-muted/30 border-border/60 relative flex h-24 flex-col items-center justify-center rounded-lg border border-dashed p-2 text-center">
                    {formData.faviconUrl ? (
                      <div className="relative flex size-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.faviconUrl}
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
                    onChange={(e) => handleFileInputChange(e, "favicon")}
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
                  <span className="text-muted-foreground font-mono text-xs">
                    {formData.primaryColor}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="primary-color"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => updateField("primaryColor", e?.target?.value ?? "#4F46E5")}
                    className="border-border/80 size-9 cursor-pointer rounded-md border p-0.5"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRIMARY_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField("primaryColor", c.value)}
                        className={cn(
                          "size-6 rounded-full border transition-all",
                          formData.primaryColor.toLowerCase() === c.value.toLowerCase()
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

              {/* Secondary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="secondary-color" className="text-xs">
                      Secondary Color (Light Mode)
                    </Label>
                    <span className="text-muted-foreground text-[10px]">(Optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.secondaryColor && (
                      <button
                        type="button"
                        onClick={() => updateField("secondaryColor", "")}
                        className="text-muted-foreground hover:text-foreground text-[10px] underline"
                      >
                        Reset to default
                      </button>
                    )}
                    <span className="text-muted-foreground font-mono text-xs">
                      {formData.secondaryColor || "Default (#F4F4F5)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="secondary-color"
                    type="color"
                    value={formData.secondaryColor || "#F4F4F5"}
                    onChange={(e) => updateField("secondaryColor", e?.target?.value ?? "#F4F4F5")}
                    className="border-border/80 size-9 cursor-pointer rounded-md border p-0.5"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SECONDARY_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField("secondaryColor", c.value)}
                        className={cn(
                          "size-6 rounded-full border transition-all",
                          formData.secondaryColor.toLowerCase() === c.value.toLowerCase()
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
                  <span className="text-muted-foreground font-mono text-xs">
                    {formData.accentColor}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="accent-color"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => updateField("accentColor", e?.target?.value ?? "#06B6D4")}
                    className="border-border/80 size-9 cursor-pointer rounded-md border p-0.5"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ACCENT_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateField("accentColor", c.value)}
                        className={cn(
                          "size-6 rounded-full border transition-all",
                          formData.accentColor.toLowerCase() === c.value.toLowerCase()
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
                      Specify optimized high-contrast primary, secondary, and accent shades for Dark
                      Mode.
                    </p>
                  </div>
                  <Switch
                    id="dark-mode-override"
                    checked={useDarkOverrides}
                    onCheckedChange={(checked) => {
                      setUseDarkOverrides(checked);
                      if (checked) {
                        if (!formData.primaryDarkColor)
                          updateField("primaryDarkColor", formData.primaryColor);
                        if (!formData.secondaryDarkColor && formData.secondaryColor)
                          updateField("secondaryDarkColor", formData.secondaryColor);
                        if (!formData.accentDarkColor)
                          updateField("accentDarkColor", formData.accentColor);
                      }
                    }}
                  />
                </div>

                {useDarkOverrides && (
                  <div className="grid gap-3 pt-2 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dark-primary-color" className="text-[11px]">
                        Dark Mode Primary
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="dark-primary-color"
                          type="color"
                          value={formData.primaryDarkColor || formData.primaryColor}
                          onChange={(e) =>
                            updateField(
                              "primaryDarkColor",
                              e?.target?.value ?? formData.primaryColor,
                            )
                          }
                          className="border-border/80 size-8 cursor-pointer rounded border p-0.5"
                        />
                        <Input
                          value={formData.primaryDarkColor || formData.primaryColor}
                          onChange={(e) => updateField("primaryDarkColor", e?.target?.value ?? "")}
                          className="h-8 font-mono text-xs"
                          placeholder="#6366F1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dark-secondary-color" className="text-[11px]">
                        Dark Mode Secondary
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="dark-secondary-color"
                          type="color"
                          value={
                            formData.secondaryDarkColor || formData.secondaryColor || "#27272a"
                          }
                          onChange={(e) =>
                            updateField(
                              "secondaryDarkColor",
                              e?.target?.value ?? formData.secondaryColor ?? "#27272a",
                            )
                          }
                          className="border-border/80 size-8 cursor-pointer rounded border p-0.5"
                        />
                        <Input
                          value={formData.secondaryDarkColor}
                          onChange={(e) =>
                            updateField("secondaryDarkColor", e?.target?.value ?? "")
                          }
                          className="h-8 font-mono text-xs"
                          placeholder="#27272A"
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
                          value={formData.accentDarkColor || formData.accentColor}
                          onChange={(e) =>
                            updateField("accentDarkColor", e?.target?.value ?? formData.accentColor)
                          }
                          className="border-border/80 size-8 cursor-pointer rounded border p-0.5"
                        />
                        <Input
                          value={formData.accentDarkColor || formData.accentColor}
                          onChange={(e) => updateField("accentDarkColor", e?.target?.value ?? "")}
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
                <Select
                  value={formData.borderRadius}
                  onValueChange={(val) => updateField("borderRadius", val)}
                >
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

            {/* 7. Sign-In & Authentication Screen Customization */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <LogIn className="text-primary size-4" />
                <span className="text-foreground text-xs font-semibold">
                  Sign-In & Auth Screen Customization
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Customize the presentation and branded assets displayed when members and clients log
                in to this workspace.
              </p>

              {/* Layout Mode Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Authentication Layout Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("authLayout", "SPLIT")}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                      formData.authLayout === "SPLIT"
                        ? "border-primary ring-primary/40 bg-primary/5 ring-2"
                        : "border-border/60 hover:border-border bg-card",
                    )}
                  >
                    <div className="border-border/60 flex h-16 w-full overflow-hidden rounded border">
                      <div className="bg-primary/20 flex w-1/2 flex-col justify-between p-1.5">
                        <div className="bg-primary/60 h-2 w-6 rounded-xs" />
                        <div className="bg-primary/40 h-1.5 w-10 rounded-xs" />
                      </div>
                      <div className="bg-background flex w-1/2 flex-col items-center justify-center p-1.5">
                        <div className="bg-muted-foreground/30 h-1.5 w-8 rounded-xs" />
                        <div className="bg-primary mt-1.5 h-2 w-10 rounded-xs" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Split Screen (Recommended)</div>
                      <div className="text-muted-foreground text-[10px]">
                        Immersive brand hero on left, login form on right.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField("authLayout", "CARD")}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                      formData.authLayout === "CARD"
                        ? "border-primary ring-primary/40 bg-primary/5 ring-2"
                        : "border-border/60 hover:border-border bg-card",
                    )}
                  >
                    <div className="border-border/60 bg-muted/20 flex h-16 w-full items-center justify-center rounded border p-2">
                      <div className="border-border/80 bg-background flex h-full w-20 flex-col items-center justify-center rounded border p-1 shadow-xs">
                        <div className="bg-primary/60 size-2 rounded-full" />
                        <div className="bg-muted-foreground/30 mt-1 h-1 w-10 rounded-xs" />
                        <div className="bg-primary mt-1 h-1.5 w-12 rounded-xs" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Centered Card</div>
                      <div className="text-muted-foreground text-[10px]">
                        Minimalist centered card with subtle ambient brand glow.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Headline & Subtitle */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-headline" className="text-xs font-semibold">
                    Welcome Headline
                  </Label>
                  <Input
                    id="auth-headline"
                    value={formData.authHeadline}
                    onChange={(e) => updateField("authHeadline", e?.target?.value ?? "")}
                    placeholder={`e.g. Welcome to ${formData.companyName || "Acme"}`}
                    className="text-xs"
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Displays above the sign-in / registration form.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-subtitle" className="text-xs font-semibold">
                    Subtitle / Tagline
                  </Label>
                  <Input
                    id="auth-subtitle"
                    value={formData.authSubtitle}
                    onChange={(e) => updateField("authSubtitle", e?.target?.value ?? "")}
                    placeholder="e.g. Sign in to access your secure workspace"
                    className="text-xs"
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Supporting descriptive text beneath the headline.
                  </p>
                </div>
              </div>

              {/* Auth Hero Cover Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Auth Hero Cover Art (Split Mode)</Label>
                  <span className="text-muted-foreground text-[11px]">
                    Recommended: 16:9 (1920x1080)
                  </span>
                </div>
                <div className="bg-muted/30 border-border/60 relative flex h-32 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed text-center">
                  {formData.authCoverUrl ? (
                    <div className="relative size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.authCoverUrl}
                        alt="Auth Hero Cover"
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => coverInputRef?.current?.click()}
                          disabled={uploadingType === "cover"}
                          className="h-7 gap-1 text-xs"
                        >
                          <Upload className="size-3" /> Replace
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAsset("cover")}
                          className="h-7 gap-1 text-xs"
                        >
                          <Trash2 className="size-3" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef?.current?.click()}
                      disabled={uploadingType === "cover"}
                      className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1.5 p-4 text-xs transition-colors"
                    >
                      {uploadingType === "cover" ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <ImageIcon className="size-5" />
                      )}
                      <span className="font-medium">Upload Hero Cover Image</span>
                      <span className="text-muted-foreground text-[10px]">
                        PNG, JPG, or WebP up to 2MB. Displayed on desktop sign-in split layout.
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileInputChange(e, "cover")}
                />
              </div>
            </div>

            {/* 8. White-Labeling & Platform Watermark */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="text-primary size-4" />
                    <span className="text-foreground text-xs font-semibold">
                      White-Labeling & Watermark
                    </span>
                    {activeTenant?.plan === "FREE" && (
                      <Badge variant="outline" className="text-[10px] text-amber-500">
                        Pro & Enterprise
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Hide platform branding and &ldquo;Powered by&rdquo; attribution badges on
                    customer-facing auth screens and workspace portals.
                  </p>
                </div>
                <Switch
                  checked={formData.hideWatermark}
                  onCheckedChange={(checked) => updateField("hideWatermark", checked)}
                  disabled={activeTenant?.plan === "FREE"}
                  aria-label="Remove Platform Watermark"
                />
              </div>

              {activeTenant?.plan === "FREE" && (
                <div className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                  <span>
                    Upgrade to Pro or Enterprise to remove the platform watermark and white-label
                    your workspace.
                  </span>
                  <Link href="/settings/billing" className="font-medium underline hover:opacity-80">
                    View Plans →
                  </Link>
                </div>
              )}
            </div>

            {/* 9. Support Contact & Domain Link */}
            <div className="border-border/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Globe className="text-primary size-3.5" /> Domain & URL Settings
                </span>
                <Link
                  href="/settings/url"
                  className="text-primary hover:text-primary/80 text-xs font-medium underline-offset-2 hover:underline"
                >
                  Manage domains →
                </Link>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="support-email" className="text-xs">
                  Support Contact Email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => updateField("supportEmail", e?.target?.value ?? "")}
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
            <CardHeader className="border-border/50 space-y-3 border-b pb-3">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Live Experience Preview</CardTitle>
                  <CardDescription className="text-[11px]">
                    Real-time simulation across Light & Dark modes, App UI, and Auth screens.
                  </CardDescription>
                </div>

                {/* Theme Toggle within Preview */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDark(false)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md border transition-all",
                      !previewDark
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground opacity-60",
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
              </div>

              {/* View Switcher: App vs Auth Screen vs Outgoing Email */}
              <div className="bg-muted/50 border-border/40 flex w-fit items-center gap-1 rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("app")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    previewTab === "app"
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutDashboard className="size-3.5" /> Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("auth")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    previewTab === "auth"
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LogIn className="size-3.5" /> Sign-in Screen
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("email")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    previewTab === "email"
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Mail className="size-3.5" /> Outgoing Email
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
                  ["--secondary" as string]: activeSecondary,
                  ["--secondary-foreground" as string]: activeSecondaryFg,
                  ["--accent" as string]: previewDark
                    ? previewTokens.darkAccent
                    : previewTokens.accent,
                  ["--accent-foreground" as string]: previewDark
                    ? previewTokens.darkAccentForeground
                    : previewTokens.accentForeground,
                  ["--radius" as string]: previewTokens.radius,
                }}
              >
                {previewTab === "app" ? (
                  /* Simulation: Split Sidebar + Content Layout */
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
                            {formData.companyName || "Acme"}
                          </span>
                        </div>

                        {/* Mock Navigation links */}
                        <div className="space-y-1 text-[11px]">
                          <div
                            className="flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-opacity"
                            style={{
                              backgroundColor:
                                formData.sidebarTheme === "BRAND"
                                  ? "rgba(255,255,255,0.2)"
                                  : activePrimary,
                              color:
                                formData.sidebarTheme === "BRAND" ? "#ffffff" : activePrimaryFg,
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
                        {formData.sidebarTheme} Mode
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
                            className="border px-2.5 py-1 text-[11px] font-medium shadow-2xs transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: activeSecondary,
                              color: activeSecondaryFg,
                              borderColor: previewDark ? "#3f3f46" : "#e4e4e7",
                              borderRadius: previewTokens.radius,
                            }}
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
                ) : previewTab === "auth" ? (
                  formData.authLayout === "SPLIT" ? (
                    /* Simulation: Auth Split Layout */
                    <div className="grid min-h-[360px] grid-cols-12">
                      {/* Left Hero Branding Panel */}
                      <div
                        className="relative col-span-6 flex flex-col justify-between overflow-hidden p-3.5 text-white"
                        style={{
                          backgroundColor: activePrimary,
                        }}
                      >
                        {formData.authCoverUrl && (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${formData.authCoverUrl})` }}
                          />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: formData.authCoverUrl
                              ? "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.85) 100%)"
                              : `linear-gradient(135deg, ${activePrimary} 0%, rgba(0,0,0,0.85) 100%)`,
                          }}
                        />
                        <div className="relative z-10 space-y-1.5">
                          <TenantLogo
                            variant="icon"
                            branding={previewBranding}
                            tenant={activeTenant}
                            className="size-6 rounded bg-white/10 p-1 backdrop-blur"
                          />
                          <div className="truncate text-[11px] font-bold drop-shadow-sm">
                            {formData.companyName || "Acme"}
                          </div>
                        </div>
                        <div className="relative z-10 space-y-1">
                          <p className="text-xs leading-tight font-semibold text-white/95">
                            {formData.authHeadline ||
                              `Welcome to ${formData.companyName || "Workspace"}`}
                          </p>
                          <p className="line-clamp-2 text-[10px] text-white/75">
                            {formData.authSubtitle || "Secure enterprise workspace authentication."}
                          </p>
                          <div className="flex items-center gap-1 pt-1 text-[8px] text-white/60">
                            <Shield className="size-2.5" /> SOC-2 & SSO Protected
                          </div>
                        </div>
                      </div>

                      {/* Right Mock Form */}
                      <div className="col-span-6 flex flex-col justify-center space-y-2.5 p-3.5">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold">Sign In</div>
                          <div className="text-muted-foreground text-[10px]">
                            Enter your credentials
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[8px] font-medium">
                              Email
                            </div>
                            <div
                              className={cn(
                                "flex h-6 items-center rounded border px-2 text-[9px] text-zinc-500",
                                previewDark
                                  ? "border-zinc-800 bg-zinc-900"
                                  : "border-zinc-200 bg-zinc-50",
                              )}
                              style={{ borderRadius: previewTokens.radius }}
                            >
                              alex@company.com
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[8px] font-medium">
                              Password
                            </div>
                            <div
                              className={cn(
                                "flex h-6 items-center rounded border px-2 text-[9px] text-zinc-500",
                                previewDark
                                  ? "border-zinc-800 bg-zinc-900"
                                  : "border-zinc-200 bg-zinc-50",
                              )}
                              style={{ borderRadius: previewTokens.radius }}
                            >
                              ••••••••••••
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-full py-1 text-[10px] font-semibold shadow-2xs transition-opacity"
                          style={{
                            backgroundColor: activePrimary,
                            color: activePrimaryFg,
                            borderRadius: previewTokens.radius,
                          }}
                        >
                          Sign in to Workspace
                        </button>
                        <div className="text-muted-foreground pt-0.5 text-center text-[8px]">
                          Forgot password?
                        </div>
                        {!formData.hideWatermark && (
                          <div className="text-muted-foreground/60 flex items-center justify-center gap-1 pt-1 text-[8px]">
                            <span>Powered by</span>
                            <span className="text-foreground/80 font-semibold">SaaS Platform</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Simulation: Auth Centered Card Layout */
                    <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden p-4">
                      {/* Ambient radial brand glow */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(circle at center, ${activePrimary} 0%, transparent 70%)`,
                        }}
                      />
                      <div
                        className={cn(
                          "relative z-10 w-full max-w-[220px] space-y-2.5 rounded-xl border p-3.5 shadow-xs",
                          previewDark
                            ? "border-zinc-800 bg-zinc-900/90"
                            : "border-zinc-200 bg-white/95",
                        )}
                        style={{ borderRadius: previewTokens.radius }}
                      >
                        <div className="flex flex-col items-center space-y-1 text-center">
                          <TenantLogo
                            variant="icon"
                            branding={previewBranding}
                            tenant={activeTenant}
                            className="size-7 rounded shadow-2xs"
                          />
                          <div className="truncate text-xs font-bold">
                            {formData.authHeadline ||
                              `Sign in to ${formData.companyName || "Workspace"}`}
                          </div>
                          <div className="text-muted-foreground line-clamp-2 text-[9px]">
                            {formData.authSubtitle || "Enter your workspace credentials"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div
                            className={cn(
                              "flex h-6 items-center rounded border px-2 text-[9px] text-zinc-500",
                              previewDark
                                ? "border-zinc-800 bg-zinc-950"
                                : "border-zinc-200 bg-zinc-50",
                            )}
                            style={{ borderRadius: previewTokens.radius }}
                          >
                            alex@company.com
                          </div>
                          <div
                            className={cn(
                              "flex h-6 items-center rounded border px-2 text-[9px] text-zinc-500",
                              previewDark
                                ? "border-zinc-800 bg-zinc-950"
                                : "border-zinc-200 bg-zinc-50",
                            )}
                            style={{ borderRadius: previewTokens.radius }}
                          >
                            ••••••••••••
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-full py-1 text-[10px] font-semibold shadow-2xs transition-opacity"
                          style={{
                            backgroundColor: activePrimary,
                            color: activePrimaryFg,
                            borderRadius: previewTokens.radius,
                          }}
                        >
                          Continue
                        </button>
                        <div className="text-muted-foreground flex items-center justify-center gap-1 pt-0.5 text-[8px]">
                          <Shield className="size-2.5" /> Protected Workspace
                        </div>
                        {!formData.hideWatermark && (
                          <div className="text-muted-foreground/60 flex items-center justify-center gap-1 text-[8px]">
                            <span>Powered by</span>
                            <span className="text-foreground/80 font-semibold">SaaS Platform</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  /* Simulation: Outgoing Branded Transactional Email */
                  <div
                    className={cn(
                      "flex min-h-[360px] items-center justify-center p-3.5",
                      previewDark ? "bg-zinc-900/60" : "bg-zinc-100/70",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full max-w-[280px] overflow-hidden rounded-lg border shadow-xs transition-colors",
                        previewDark
                          ? "border-zinc-800 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-white text-zinc-900",
                      )}
                      style={{
                        borderTop: `4px solid ${activePrimary}`,
                        borderRadius: previewTokens.radius,
                      }}
                    >
                      {/* Email Header */}
                      <div
                        className={cn(
                          "border-b p-3 text-center",
                          previewDark ? "border-zinc-800" : "border-zinc-100",
                        )}
                      >
                        {formData.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              previewDark && formData.logoDarkUrl
                                ? formData.logoDarkUrl
                                : formData.logoUrl
                            }
                            alt={formData.companyName || "Organization"}
                            className="mx-auto max-h-6 max-w-[120px] object-contain"
                          />
                        ) : (
                          <div
                            className="text-xs font-bold tracking-tight"
                            style={{ color: activePrimary }}
                          >
                            {formData.companyName || "Acme Organization"}
                          </div>
                        )}
                      </div>

                      {/* Email Body Content */}
                      <div className="space-y-2.5 p-3 text-[10px]">
                        <div className="text-xs font-bold">
                          You&apos;re invited to join {formData.companyName || "Acme"}
                        </div>
                        <p className="text-muted-foreground text-[9px] leading-relaxed">
                          Hi Elena, you have been invited to collaborate on{" "}
                          <strong>{formData.companyName || "Acme"}</strong> with the{" "}
                          <strong>Workspace Admin</strong> role.
                        </p>

                        {/* Branded CTA Button */}
                        <div className="py-1 text-center">
                          <button
                            type="button"
                            className="rounded px-3 py-1 text-[9px] font-semibold text-white shadow-2xs transition-opacity"
                            style={{
                              backgroundColor: activePrimary,
                              color: activePrimaryFg,
                              borderRadius: previewTokens.radius,
                            }}
                          >
                            Accept Invitation & Join
                          </button>
                        </div>

                        {/* Branded Token Box */}
                        <div
                          className={cn(
                            "rounded border border-dashed p-1.5 text-center",
                            previewDark ? "border-zinc-800" : "border-zinc-200",
                          )}
                          style={{
                            backgroundColor: activeSecondary,
                            color: activeSecondaryFg,
                            borderRadius: previewTokens.radius,
                          }}
                        >
                          <div className="text-muted-foreground text-[7px] font-semibold tracking-wider uppercase">
                            Invitation Token
                          </div>
                          <div
                            className="font-mono text-[10px] font-bold tracking-widest"
                            style={{ color: activePrimary }}
                          >
                            INV-7842-AX9B
                          </div>
                        </div>

                        <p className="border-border/40 text-muted-foreground border-t pt-1 text-[8px]">
                          This invitation link expires in 48 hours.
                        </p>
                      </div>

                      {/* Email Footer */}
                      <div
                        className={cn(
                          "text-muted-foreground border-t p-2 text-center text-[8px]",
                          previewDark
                            ? "border-zinc-900 bg-zinc-900/40"
                            : "border-zinc-100 bg-zinc-50",
                        )}
                      >
                        <div>
                          © {new Date().getFullYear()} {formData.companyName || "Organization"}. All
                          rights reserved.
                        </div>
                        {formData.supportEmail ? (
                          <div className="pt-0.5 font-medium" style={{ color: activePrimary }}>
                            Questions? {formData.supportEmail}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

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

      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropSrc}
        fileName={cropFileName}
        assetType={cropAssetType}
        onCropComplete={async (file) => {
          await uploadAssetFile(file, cropAssetType);
        }}
      />
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
