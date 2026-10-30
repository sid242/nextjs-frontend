"use client";

import { useEffect, useId, type ReactNode } from "react";

import { useActiveTenant, useTenantBranding } from "../queries";
import { generateTenantThemeCss, GOOGLE_FONTS, type TenantThemeInput } from "../theme";

export interface TenantThemeOverride extends TenantThemeInput {
  faviconUrl?: string | null;
  [key: string]: unknown;
}

interface TenantThemeProviderProps {
  children: ReactNode;
  /** Optional branding override (used by the live settings preview canvas) */
  overrideBranding?: TenantThemeOverride | null;
  /** Target CSS selector to apply tokens to (defaults to :root) */
  selector?: string;
}

/**
 * Injects dynamic tenant CSS tokens (--primary, --accent, --ring, --radius)
 * and synchronizes the browser tab favicon with the active tenant's brand.
 */
export function TenantThemeProvider({
  children,
  overrideBranding,
  selector = ":root",
}: TenantThemeProviderProps) {
  const { activeTenant } = useActiveTenant();
  const { data: fetchedBranding } = useTenantBranding(activeTenant?.id);
  const styleId = useId();

  const branding = overrideBranding !== undefined ? overrideBranding : fetchedBranding;
  const css = generateTenantThemeCss(branding, selector);

  // Synchronize dynamic Google Font
  useEffect(() => {
    const rawFont = branding?.fontFamily?.trim() || "Inter";
    const fontConfig = GOOGLE_FONTS[rawFont];
    if (!fontConfig?.href) return;

    let fontLink: HTMLLinkElement | null = document.getElementById(
      "tenant-google-font",
    ) as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "tenant-google-font";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    fontLink.href = fontConfig.href;
  }, [branding?.fontFamily]);

  // Synchronize dynamic favicon
  useEffect(() => {
    const faviconUrl = branding?.faviconUrl?.trim();
    if (!faviconUrl) return;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    const originalHref = link?.href ?? "/favicon.ico";

    if (!link) {
      link = document.createElement("link");
      link.rel = "shortcut icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;

    return () => {
      if (link && originalHref) {
        link.href = originalHref;
      }
    };
  }, [branding?.faviconUrl]);

  return (
    <>
      <style
        id={`tenant-theme-${styleId.replace(/:/g, "")}`}
        dangerouslySetInnerHTML={{ __html: css }}
      />
      {children}
    </>
  );
}
