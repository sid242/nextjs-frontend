import { describe, expect, it } from "vitest";

import { tenantBrandingSchema } from "./schemas";
import {
  BRANDING_PRESETS,
  computeTenantThemeTokens,
  generateTenantThemeCss,
  getContrastRatio,
  getLuminance,
  GOOGLE_FONTS,
  hexToRgb,
} from "./theme";

describe("Theme Engine & Color Calculations", () => {
  it("parses valid hex colors to RGB correctly", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("invalid")).toBeNull();
  });

  it("calculates relative luminance and contrast ratio accurately", () => {
    const whiteLum = getLuminance("#ffffff");
    const blackLum = getLuminance("#000000");
    expect(whiteLum).toBeCloseTo(1, 1);
    expect(blackLum).toBeCloseTo(0, 1);

    const contrast = getContrastRatio("#000000", "#ffffff");
    expect(contrast).toBeGreaterThanOrEqual(21);
  });

  it("computes dual-mode theme tokens with fallback defaults", () => {
    const tokens = computeTenantThemeTokens();
    expect(tokens.primary).toBe("#4F46E5");
    expect(tokens.secondary).toBe("#f4f4f5");
    expect(tokens.darkSecondary).toBe("#27272a");
    expect(tokens.secondaryForeground).toBe("#09090b");
    expect(tokens.darkSecondaryForeground).toBe("#ffffff");
    expect(tokens.fontFamily).toBe("Inter");
    expect(tokens.sidebarTheme).toBe("DARK");
    expect(tokens.sidebarBg).toBe("#09090b");
    expect(tokens.darkSidebarBg).toBe("#09090b");
  });

  it("computes dark mode overrides and brand-themed sidebars", () => {
    const tokens = computeTenantThemeTokens({
      primaryColor: "#059669",
      secondaryColor: "#D1FAE5",
      accentColor: "#10B981",
      primaryDarkColor: "#10B981",
      secondaryDarkColor: "#064E3B",
      accentDarkColor: "#34D399",
      fontFamily: "Plus Jakarta Sans",
      sidebarTheme: "BRAND",
    });

    expect(tokens.primary).toBe("#059669");
    expect(tokens.secondary).toBe("#D1FAE5");
    expect(tokens.darkSecondary).toBe("#064E3B");
    expect(tokens.secondaryForeground).toBe("#09090b");
    expect(tokens.darkSecondaryForeground).toBe("#ffffff");
    expect(tokens.darkPrimary).toBe("#10B981");
    expect(tokens.fontFamily).toBe("Plus Jakarta Sans");
    expect(tokens.sidebarTheme).toBe("BRAND");
    expect(tokens.sidebarBg).toBe("#059669");
    expect(tokens.darkSidebarBg).toBe("#10B981");
  });

  it("generates CSS with light, dark and scoped aside rules", () => {
    const css = generateTenantThemeCss({
      primaryColor: "#4F46E5",
      sidebarTheme: "LIGHT",
      fontFamily: "Geist",
    });

    expect(css).toContain("--primary: #4F46E5;");
    expect(css).toContain("--secondary: #f4f4f5;");
    expect(css).toContain('--font-tenant: "Geist", sans-serif;');
    expect(css).toContain(".dark :root");
    expect(css).toContain("--secondary: #27272a;");
    expect(css).toContain("aside.bg-sidebar");
  });

  it("contains curated presets with valid fonts and hex colors", () => {
    expect(BRANDING_PRESETS.length).toBeGreaterThanOrEqual(6);
    for (const preset of BRANDING_PRESETS) {
      expect(preset.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.primaryDarkColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.secondaryDarkColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.accentDarkColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(GOOGLE_FONTS[preset.fontFamily]).toBeDefined();
    }
  });

  it("validates tenant branding schema with new theme fields", () => {
    const valid = tenantBrandingSchema.parse({
      companyName: "Acme",
      primaryColor: "#1E3A8A",
      secondaryColor: "#DBEAFE",
      primaryDarkColor: "#3B82F6",
      secondaryDarkColor: "#1E293B",
      fontFamily: "Roboto",
      sidebarTheme: "BRAND",
    });

    expect(valid.companyName).toBe("Acme");
    expect(valid.secondaryColor).toBe("#DBEAFE");
    expect(valid.primaryDarkColor).toBe("#3B82F6");
    expect(valid.secondaryDarkColor).toBe("#1E293B");
    expect(valid.fontFamily).toBe("Roboto");
    expect(valid.sidebarTheme).toBe("BRAND");
  });
});
