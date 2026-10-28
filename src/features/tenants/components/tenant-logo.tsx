"use client";

import { useState } from "react";
import { Building2Icon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useActiveTenant, useTenantBranding } from "../queries";
import { computeTenantThemeTokens, type TenantThemeInput } from "../theme";

export interface TenantLogoTenant {
  id?: string;
  name: string;
  slug?: string;
  plan?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface TenantLogoBranding extends TenantThemeInput {
  companyName?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  customDomain?: string | null;
  supportEmail?: string | null;
}

interface TenantLogoProps {
  className?: string;
  /** "full" for horizontal banner logo, "icon" for collapsed/compact square representation */
  variant?: "full" | "icon";
  /** Optional override for active tenant (e.g. in tenant switcher dropdown list) */
  tenant?: TenantLogoTenant | null;
  /** Optional override for branding (e.g. live preview canvas) */
  branding?: TenantLogoBranding | null;
  /** Whether to show the company name next to the logo in "full" variant */
  showName?: boolean;
}

/**
 * Enterprise theme-aware tenant logo component.
 * Uses pure CSS theme toggling (dark:hidden / hidden dark:block) for instantaneous rendering
 * without hydration mismatches, and gracefully falls back to a branded monogram avatar.
 */
export function TenantLogo({
  className,
  variant = "full",
  tenant: overrideTenant,
  branding: overrideBranding,
  showName = true,
}: TenantLogoProps) {
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const isControlledTenant = overrideTenant !== undefined;
  const isControlledBranding = overrideBranding !== undefined;

  const { activeTenant } = useActiveTenant({ enabled: !isControlledTenant });
  const currentTenant = isControlledTenant ? overrideTenant : activeTenant;

  const shouldFetchBranding =
    !isControlledBranding && !isControlledTenant && Boolean(currentTenant?.id);
  const { data: fetchedBranding } = useTenantBranding(currentTenant?.id, {
    enabled: shouldFetchBranding,
  });

  const activeBranding = isControlledBranding ? overrideBranding : fetchedBranding;

  const lightLogo = activeBranding?.logoUrl?.trim() || null;
  const darkLogo = activeBranding?.logoDarkUrl?.trim() || null;
  const favicon = activeBranding?.faviconUrl?.trim() || null;

  const lightSrc = variant === "icon" ? favicon || lightLogo : lightLogo;

  const displayName = activeBranding?.companyName || currentTenant?.name || "Workspace";
  const tokens = computeTenantThemeTokens(activeBranding);

  const isLightFailed = lightSrc ? Boolean(failedUrls[lightSrc]) : true;
  const isDarkFailed = darkLogo ? Boolean(failedUrls[darkLogo]) : true;

  const hasAnyValidImage = (!isLightFailed && !!lightSrc) || (!isDarkFailed && !!darkLogo);

  const renderFallback = () => (
    <Avatar
      className={cn("size-7 shrink-0 rounded-md shadow-2xs", variant === "icon" && "size-8")}
      style={{
        backgroundColor: tokens.primary,
        color: tokens.primaryForeground,
      }}
    >
      <AvatarFallback
        className="rounded-md text-xs font-bold"
        style={{
          backgroundColor: tokens.primary,
          color: tokens.primaryForeground,
        }}
      >
        {displayName ? initials(displayName) : <Building2Icon className="size-3.5" />}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {hasAnyValidImage ? (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden",
            variant === "icon" ? "size-8 rounded-md" : "h-7 max-w-35",
          )}
        >
          {/* Light mode logo */}
          {lightSrc && !isLightFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`light-${lightSrc}`}
              src={lightSrc}
              alt={displayName}
              onError={() => setFailedUrls((prev) => ({ ...prev, [lightSrc]: true }))}
              className={cn(
                "object-contain",
                darkLogo && darkLogo !== lightLogo && "dark:hidden",
                variant === "icon" ? "size-full rounded-md" : "h-7 w-auto max-w-35",
              )}
            />
          )}

          {/* Dark mode logo */}
          {darkLogo && darkLogo !== lightLogo && !isDarkFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`dark-${darkLogo}`}
              src={darkLogo}
              alt={displayName}
              onError={() => setFailedUrls((prev) => ({ ...prev, [darkLogo]: true }))}
              className={cn(
                "hidden object-contain dark:block",
                variant === "icon" ? "size-full rounded-md" : "h-7 w-auto max-w-35",
              )}
            />
          )}
        </div>
      ) : (
        renderFallback()
      )}

      {variant === "full" && showName && (
        <span className="text-foreground truncate text-sm font-bold tracking-tight">
          {displayName}
        </span>
      )}
    </div>
  );
}
