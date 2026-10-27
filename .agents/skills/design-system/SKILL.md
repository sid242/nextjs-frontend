---
name: design-system
description: >-
  Architectural design system guidelines, UI tokens, elevation models, and component patterns
  for the Next.js multi-tenant foundation following modern elevated minimalism and micro-tactility.
---

# Modern Tactile & Elevated Minimal Design System

Use this skill whenever creating, refactoring, or styling UI components, layouts, dialogs, forms, or data visualizations.

---

## 1. Core Philosophy: Why Elevated Minimal over Neumorphism

This foundation explicitly rejects pure **Neumorphism** (soft extruded plastic UI) in favor of **Elevated Modern Minimalism with Micro-Tactility** (inspired by Linear, Raycast, and Stripe).

### Critical Rules:

1. **Never use pure Neumorphic dual-shadow extrusions** (e.g. `box-shadow: 8px 8px 16px #bebebe, -8px -8px 16px #ffffff`). They break dynamic white-label branding, fail WCAG contrast ratios, and waste screen density.
2. **Use Sub-Pixel Borders**: Delineate cards, sidebars, and panels with subtle 1px borders (`border border-border/60` or `border-border/40`).
3. **Micro-Tactility on Interactive Elements**:
   - Give primary and secondary buttons a crisp 1px top inner specular highlight:
     ```css
     box-shadow:
       inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
       0 1px 2px 0 rgba(0, 0, 0, 0.05);
     ```
   - Use subtle press scaling on click: `active:scale-[0.98] transition-all duration-150`.
4. **Multi-Tenant White-Label Safe**: All colors must resolve through Tailwind v4 `@theme inline` OKLCH CSS variables (`--primary`, `--accent`, `--ring`). Never hardcode hex values in component classes.

---

## 2. Five-Layer Surface Elevation Hierarchy

Every screen element belongs to one of five explicit elevation planes:

| Plane               | Surface                      | Tailwind Classes                                  | Usage                                                       |
| :------------------ | :--------------------------- | :------------------------------------------------ | :---------------------------------------------------------- |
| **L0 (Canvas)**     | Background                   | `bg-background`                                   | Base page canvas behind all layout blocks.                  |
| **L1 (Structural)** | Sidebar / Nav / Shell        | `bg-sidebar`, `bg-background/80 backdrop-blur-md` | Persistent shell navigation, sticky headers, dividers.      |
| **L2 (Container)**  | Cards / Tables / Sections    | `bg-card border border-border/60 shadow-xs`       | Content cards, data tables, metrics widgets, form cards.    |
| **L3 (Floating)**   | Dropdowns / Menus / Tooltips | `bg-popover border border-border shadow-lg`       | Select menus, tenant switcher dropdown, notification bell.  |
| **L4 (Overlay)**    | Dialogs / Drawers / Command  | `bg-background border border-border shadow-2xl`   | `Sheet` mobile drawer, `GlobalSearch` dialog, modal alerts. |

---

## 3. Component Styling Standards

### A. Buttons (`src/components/ui/button.tsx`)

- **Default (Primary)**:
  - Light mode: Deep high-contrast dark with white text (`bg-primary text-primary-foreground`).
  - Dark mode: Crisp bright foreground with dark text (`dark:bg-primary dark:text-primary-foreground`).
  - Subtle top specular highlight: `shadow-xs hover:shadow-sm active:scale-[0.98]`.
- **Secondary / Outline**:
  - `bg-secondary/60 hover:bg-secondary border border-border/60 text-secondary-foreground`.
- **Ghost**:
  - `hover:bg-accent hover:text-accent-foreground rounded-md`.

### B. Inputs & Form Fields (`src/components/ui/input.tsx`)

- Crisp 1px border: `border border-border/80 bg-background/50 hover:border-border`.
- Focus state: `focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring`.
- Helper & Error texts: Muted text-xs for helper text; `text-destructive text-xs font-medium` for validation errors.

### C. Status & RBAC Badges (`src/components/ui/badge.tsx`)

Always use tinted background with high-contrast text and border:

- **Success**: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
- **Warning**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
- **Destructive**: `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`
- **Info / Secondary**: `bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20`

### D. Data Tables & Audit Streams (`src/components/ui/table.tsx`)

- Header row: `bg-muted/40 text-muted-foreground font-semibold text-xs uppercase tracking-wider`.
- Row hover: `hover:bg-muted/30 transition-colors`.
- Cell dividers: `divide-y divide-border/40`.

---

## 4. Typography & Monospace Conventions

- **Display & Headings**: `font-sans font-bold tracking-tight text-foreground`.
- **Body & Labels**: `font-sans text-sm text-foreground leading-relaxed`.
- **Secondary Metadata**: `text-xs text-muted-foreground`.
- **IDs, Keys, Codes, Timestamps, Ports, Tokens**: Always use `font-mono text-xs` (e.g. `x-request-id`, IP addresses, tenant slugs).

---

## 5. Micro-Animations & Transitions

- Fast, snappy durations: `150ms` to `200ms`.
- Standard easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out).
- Tooltips and Dropdowns: `fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-150`.
- Mobile Sheet: Slide transitions `duration-250 ease-out`.

---

## 6. Accessibility Checklist (WCAG 2.1 AA)

- [ ] Interactive elements have minimum `44x44px` touch targets on mobile.
- [ ] Text contrast meets minimum `4.5:1` against its immediate surface.
- [ ] Focus rings are visible on keyboard navigation (`focus-visible`).
- [ ] Color is never the sole indicator of status (always pair with icons or explicit labels).
- [ ] Icon-only buttons must have `aria-label` or `<span className="sr-only">`.

---

## 7. Tailwind CSS v4 Continuous Scale & Sizing Standards

Tailwind CSS v4 supports a continuous numeric scale where **1 unit = 0.25rem = 4px**.
Any integer multiple of 4px is a native utility. **Never write arbitrary bracket syntax (`[...]`) when a divisible-by-4 integer scale exists**:

- **Height & Min-Height**:
  - Write `min-h-105` instead of `min-h-[420px]` (`105 * 4px = 420px`).
  - Write `h-80` instead of `h-[320px]` (`80 * 4px = 320px`).
  - Write `min-h-150` instead of `min-h-[600px]` (`150 * 4px = 600px`).
- **Width & Max-Width**:
  - Write `w-100` instead of `w-[400px]` (`100 * 4px = 400px`).
  - Write `max-w-120` instead of `max-w-[480px]` (`120 * 4px = 480px`).
  - Write `w-90` instead of `w-[360px]` (`90 * 4px = 360px`).
- **Padding & Margin**:
  - Write `p-7` (28px), `p-9` (36px), `gap-7` (28px), `mt-15` (60px).
- Reserve bracket syntax (`[...]`) strictly for values not divisible by 4px (`w-[347px]`, `top-[1px]`) or dynamic expressions (`min-h-[calc(100vh-4rem)]`).
- Always use `text-balance` on headings (`h1`, `h2`, dialog titles) and `text-pretty` on multiline paragraphs.
