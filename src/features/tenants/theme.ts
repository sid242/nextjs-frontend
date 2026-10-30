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
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
  radius: string;
  fontFamily: string;
  sidebarTheme: "DARK" | "LIGHT" | "BRAND";
  sidebarBg: string;
  sidebarFg: string;
  darkPrimary: string;
  darkPrimaryForeground: string;
  darkSecondary: string;
  darkSecondaryForeground: string;
  darkAccent: string;
  darkAccentForeground: string;
  darkRing: string;
  darkSidebarBg: string;
  darkSidebarFg: string;
}

export const GOOGLE_FONTS: Record<string, { family: string; href: string }> = {
  Inter: {
    family: "Inter",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  "Plus Jakarta Sans": {
    family: "Plus Jakarta Sans",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  },
  Geist: {
    family: "Geist",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap",
  },
  Poppins: {
    family: "Poppins",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  Outfit: {
    family: "Outfit",
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
  },
  Roboto: {
    family: "Roboto",
    href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  },
};

export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryDarkColor: string;
  secondaryDarkColor: string;
  accentDarkColor: string;
  fontFamily: "Inter" | "Plus Jakarta Sans" | "Geist" | "Poppins" | "Outfit" | "Roboto";
  sidebarTheme: "DARK" | "LIGHT" | "BRAND";
  borderRadius: string;
}

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: "modern-indigo",
    name: "Modern Indigo",
    description: "Deep indigo with vibrant cyan highlights and dark sleek sidebar",
    primaryColor: "#4F46E5",
    secondaryColor: "#E0E7FF",
    accentColor: "#06B6D4",
    primaryDarkColor: "#6366F1",
    secondaryDarkColor: "#312E81",
    accentDarkColor: "#22D3EE",
    fontFamily: "Inter",
    sidebarTheme: "DARK",
    borderRadius: "0.5rem",
  },
  {
    id: "fintech-emerald",
    name: "Fintech Emerald",
    description: "Clean enterprise green with sharp geometry and dark sidebar",
    primaryColor: "#059669",
    secondaryColor: "#D1FAE5",
    accentColor: "#10B981",
    primaryDarkColor: "#10B981",
    secondaryDarkColor: "#064E3B",
    accentDarkColor: "#34D399",
    fontFamily: "Plus Jakarta Sans",
    sidebarTheme: "DARK",
    borderRadius: "0.375rem",
  },
  {
    id: "corporate-navy",
    name: "Corporate Navy",
    description: "Executive navy anchor with full brand-tinted sidebar",
    primaryColor: "#1E3A8A",
    secondaryColor: "#DBEAFE",
    accentColor: "#3B82F6",
    primaryDarkColor: "#3B82F6",
    secondaryDarkColor: "#1E293B",
    accentDarkColor: "#60A5FA",
    fontFamily: "Roboto",
    sidebarTheme: "BRAND",
    borderRadius: "0.25rem",
  },
  {
    id: "vibrant-violet",
    name: "Vibrant Violet",
    description: "Playful purple & fuchsia with soft curved corners",
    primaryColor: "#7C3AED",
    secondaryColor: "#EDE9FE",
    accentColor: "#C026D3",
    primaryDarkColor: "#8B5CF6",
    secondaryDarkColor: "#4C1D95",
    accentDarkColor: "#D946EF",
    fontFamily: "Poppins",
    sidebarTheme: "DARK",
    borderRadius: "0.75rem",
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    description: "Friendly golden amber with clean light sidebar",
    primaryColor: "#D97706",
    secondaryColor: "#FEF3C7",
    accentColor: "#F59E0B",
    primaryDarkColor: "#F59E0B",
    secondaryDarkColor: "#78350F",
    accentDarkColor: "#FBBF24",
    fontFamily: "Outfit",
    sidebarTheme: "LIGHT",
    borderRadius: "0.5rem",
  },
  {
    id: "clean-slate",
    name: "Clean Slate",
    description: "Monochrome slate minimal aesthetic with geist typography",
    primaryColor: "#334155",
    secondaryColor: "#F1F5F9",
    accentColor: "#64748B",
    primaryDarkColor: "#94A3B8",
    secondaryDarkColor: "#1E293B",
    accentDarkColor: "#CBD5E1",
    fontFamily: "Geist",
    sidebarTheme: "DARK",
    borderRadius: "0.375rem",
  },
];

const DEFAULT_PRIMARY = "#4F46E5";
const DEFAULT_SECONDARY = "#f4f4f5";
const DEFAULT_SECONDARY_DARK = "#27272a";
const DEFAULT_ACCENT = "#06B6D4";
const DEFAULT_RADIUS = "0.5rem";
const DEFAULT_FONT = "Inter";
const DEFAULT_SIDEBAR_THEME: "DARK" | "LIGHT" | "BRAND" = "DARK";

export interface TenantThemeInput {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  primaryDarkColor?: string | null;
  secondaryDarkColor?: string | null;
  accentDarkColor?: string | null;
  fontFamily?: string | null;
  sidebarTheme?: "DARK" | "LIGHT" | "BRAND" | string | null;
  borderRadius?: string | null;
  [key: string]: unknown;
}

/**
 * Computes runtime CSS variables with automated WCAG AA/AAA contrast matching for light & dark modes.
 */
export function computeTenantThemeTokens(branding?: TenantThemeInput | null): ComputedThemeTokens {
  const primary = branding?.primaryColor?.trim() || DEFAULT_PRIMARY;
  const secondary = branding?.secondaryColor?.trim() || DEFAULT_SECONDARY;
  const accent = branding?.accentColor?.trim() || DEFAULT_ACCENT;
  const darkPrimary = branding?.primaryDarkColor?.trim() || primary;
  const darkSecondary =
    branding?.secondaryDarkColor?.trim() ||
    (branding?.secondaryColor?.trim() ? secondary : DEFAULT_SECONDARY_DARK);
  const darkAccent = branding?.accentDarkColor?.trim() || accent;
  const radius = branding?.borderRadius?.trim() || DEFAULT_RADIUS;
  const fontFamily = branding?.fontFamily?.trim() || DEFAULT_FONT;
  const rawSidebarTheme =
    (branding?.sidebarTheme?.trim() as "DARK" | "LIGHT" | "BRAND") || DEFAULT_SIDEBAR_THEME;
  const sidebarTheme = ["DARK", "LIGHT", "BRAND"].includes(rawSidebarTheme)
    ? rawSidebarTheme
    : "DARK";

  // Light mode foregrounds
  const isPrimaryLight = getLuminance(primary) > 0.45;
  const primaryForeground = isPrimaryLight ? "#09090b" : "#ffffff";

  const isSecondaryLight = getLuminance(secondary) > 0.45;
  const secondaryForeground = isSecondaryLight ? "#09090b" : "#ffffff";

  const isAccentLight = getLuminance(accent) > 0.45;
  const accentForeground = isAccentLight ? "#09090b" : "#ffffff";

  // Dark mode foregrounds
  const isDarkPrimaryLight = getLuminance(darkPrimary) > 0.45;
  const darkPrimaryForeground = isDarkPrimaryLight ? "#09090b" : "#ffffff";

  const isDarkSecondaryLight = getLuminance(darkSecondary) > 0.45;
  const darkSecondaryForeground = isDarkSecondaryLight ? "#09090b" : "#ffffff";

  const isDarkAccentLight = getLuminance(darkAccent) > 0.45;
  const darkAccentForeground = isDarkAccentLight ? "#09090b" : "#ffffff";

  // Sidebar tokens (Light Mode)
  let sidebarBg = "#09090b";
  let sidebarFg = "#fafafa";
  if (sidebarTheme === "LIGHT") {
    sidebarBg = "#ffffff";
    sidebarFg = "#09090b";
  } else if (sidebarTheme === "BRAND") {
    sidebarBg = primary;
    sidebarFg = primaryForeground;
  }

  // Sidebar tokens (Dark Mode)
  let darkSidebarBg = "#09090b";
  let darkSidebarFg = "#fafafa";
  if (sidebarTheme === "LIGHT") {
    darkSidebarBg = "#18181b";
    darkSidebarFg = "#fafafa";
  } else if (sidebarTheme === "BRAND") {
    darkSidebarBg = darkPrimary;
    darkSidebarFg = darkPrimaryForeground;
  }

  return {
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    accent,
    accentForeground,
    ring: primary,
    radius,
    fontFamily,
    sidebarTheme,
    sidebarBg,
    sidebarFg,
    darkPrimary,
    darkPrimaryForeground,
    darkSecondary,
    darkSecondaryForeground,
    darkAccent,
    darkAccentForeground,
    darkRing: darkPrimary,
    darkSidebarBg,
    darkSidebarFg,
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
      --secondary: ${tokens.secondary};
      --secondary-foreground: ${tokens.secondaryForeground};
      --accent: ${tokens.accent};
      --accent-foreground: ${tokens.accentForeground};
      --ring: ${tokens.ring};
      --radius: ${tokens.radius};
      --font-tenant: "${tokens.fontFamily}", sans-serif;
      --sidebar: ${tokens.sidebarBg};
      --sidebar-foreground: ${tokens.sidebarFg};
      font-family: var(--font-tenant);
    }

    .dark ${selector},
    ${selector}.dark {
      --primary: ${tokens.darkPrimary};
      --primary-foreground: ${tokens.darkPrimaryForeground};
      --secondary: ${tokens.darkSecondary};
      --secondary-foreground: ${tokens.darkSecondaryForeground};
      --accent: ${tokens.darkAccent};
      --accent-foreground: ${tokens.darkAccentForeground};
      --ring: ${tokens.darkRing};
      --sidebar: ${tokens.darkSidebarBg};
      --sidebar-foreground: ${tokens.darkSidebarFg};
    }

    aside.bg-sidebar {
      background-color: var(--sidebar);
      color: var(--sidebar-foreground);
    }
  `.trim();
}
