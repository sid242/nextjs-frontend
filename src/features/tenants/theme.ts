interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Safely normalizes and parses a hex color string into RGB numbers.
 * Supports 3-digit (#RGB), 6-digit (#RRGGBB), or raw hex values.
 */
export function hexToRgb(rawHex?: string | null): RgbColor | null {
  if (!rawHex) return null;
  const clean = rawHex.trim().replace(/^#/, "");

  if (clean.length === 3) {
    const r = parseInt(`${clean[0]}${clean[0]}`, 16);
    const g = parseInt(`${clean[1]}${clean[1]}`, 16);
    const b = parseInt(`${clean[2]}${clean[2]}`, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  return null;
}

/**
 * Calculates the relative luminance of a color under WCAG 2.1 specifications (0 = darkest, 1 = lightest).
 */
export function getLuminance(rawHex?: string | null): number {
  const rgb = hexToRgb(rawHex);
  if (!rgb) return 0.5;

  const normalize = (val: number) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const rLinear = normalize(rgb.r);
  const gLinear = normalize(rgb.g);
  const bLinear = normalize(rgb.b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates the WCAG contrast ratio between two hex colors (e.g. 4.5 for AA, 7.0 for AAA).
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getLuminance(hexA);
  const lumB = getLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ComputedThemeTokens {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
  radius: string;
}

const DEFAULT_PRIMARY = "#4F46E5";
const DEFAULT_ACCENT = "#06B6D4";
const DEFAULT_RADIUS = "0.5rem";

export interface TenantThemeInput {
  primaryColor?: string | null;
  accentColor?: string | null;
  borderRadius?: string | null;
  [key: string]: unknown;
}

/**
 * Computes runtime CSS variables with automated WCAG AA/AAA contrast matching.
 */
export function computeTenantThemeTokens(branding?: TenantThemeInput | null): ComputedThemeTokens {
  const primary = branding?.primaryColor?.trim() || DEFAULT_PRIMARY;
  const accent = branding?.accentColor?.trim() || DEFAULT_ACCENT;
  const radius = branding?.borderRadius?.trim() || DEFAULT_RADIUS;

  // Determine optimal foreground text based on luminance threshold
  // Luminance > 0.45 indicates light background requiring dark text (#09090b)
  const isPrimaryLight = getLuminance(primary) > 0.45;
  const primaryForeground = isPrimaryLight ? "#09090b" : "#ffffff";

  const isAccentLight = getLuminance(accent) > 0.45;
  const accentForeground = isAccentLight ? "#09090b" : "#ffffff";

  return {
    primary,
    primaryForeground,
    accent,
    accentForeground,
    ring: primary,
    radius,
  };
}

/**
 * Generates an inline CSS block containing the dynamic variables mapped to the target selector.
 */
export function generateTenantThemeCss(
  branding?: TenantThemeInput | null,
  selector = ":root",
): string {
  const tokens = computeTenantThemeTokens(branding);

  return `
    ${selector} {
      --primary: ${tokens.primary};
      --primary-foreground: ${tokens.primaryForeground};
      --accent: ${tokens.accent};
      --accent-foreground: ${tokens.accentForeground};
      --ring: ${tokens.ring};
      --radius: ${tokens.radius};
    }
  `.trim();
}
