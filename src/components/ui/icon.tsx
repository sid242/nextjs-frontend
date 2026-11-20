"use client";

import * as React from "react";
import { HelpCircleIcon, icons, type LucideIcon, type LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Registry for custom SVG icons. Can be extended globally or per domain.
 */
export type CustomIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const customIconRegistry: Record<string, CustomIconComponent> = {};

/**
 * Register custom SVG icons that can be referenced by name.
 */
export function registerCustomIcons(iconsMap: Record<string, CustomIconComponent>): void {
  Object.assign(customIconRegistry, iconsMap);
}

/**
 * Normalizes icon names from kebab-case, snake_case, or lowercase into Lucide PascalCase.
 * Examples: "folder-plus" -> "FolderPlus", "calendar" -> "Calendar", "building-2" -> "Building2"
 */
export function normalizeIconName(name: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Resolves an icon component by name (checks custom registry first, then Lucide).
 */
export function getIconComponent(name: string): LucideIcon | CustomIconComponent | null {
  if (!name) return null;

  // 1. Check custom SVG icons registry
  if (customIconRegistry[name]) {
    return customIconRegistry[name];
  }

  // 2. Normalize and check Lucide icons
  const normalized = normalizeIconName(name);
  const LucideComponent = (icons as Record<string, LucideIcon | undefined>)[normalized];
  if (LucideComponent) {
    return LucideComponent;
  }

  return null;
}

export interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: LucideIcon | null;
  className?: string;
}

/**
 * Production-grade dynamic icon component that renders Lucide icons (or custom SVGs) by name string.
 * Zero react-icons dependency; ultra-fast lookup with Lucide tree-shaking support.
 */
export const DynamicIcon = React.forwardRef<SVGSVGElement, DynamicIconProps>(
  ({ name, fallback = HelpCircleIcon, className, size = 18, ...props }, ref) => {
    const Component = getIconComponent(name);

    if (!Component) {
      if (fallback) {
        const FallbackComponent = fallback;
        return (
          <FallbackComponent
            ref={ref}
            size={size}
            className={cn("text-muted-foreground", className)}
            {...props}
          />
        );
      }
      return null;
    }

    const Element = Component as React.ComponentType<DynamicIconProps>;
    return <Element ref={ref} size={size} className={className} {...props} />;
  },
);

DynamicIcon.displayName = "DynamicIcon";

export const Icon = DynamicIcon;
export default DynamicIcon;
