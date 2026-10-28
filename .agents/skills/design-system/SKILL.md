---
name: design-system
description: >-
  Architectural design system guidelines, UI tokens, elevation models, and component patterns
  for the Next.js multi-tenant foundation following the BrixUI Multi-Brand UI Kit and elevated minimalism.
---

# BrixUI Modern Design System & Foundation Guidelines

Use this skill whenever creating, refactoring, or styling UI components, layouts, dialogs, forms, or data visualizations.

---

## 1. Core Principles (BrixUI Elevated Modern Minimalism)

1. **Clean Geometric Clarity**: Reject muddy dual-tone extrusions. Delineate cards, sidebars, and panels with subtle sub-pixel 1px borders (`border border-border/80` or `border border-border/60`).
2. **Micro-Tactility on Interactive Controls**:
   - Primary buttons and elevated cards feature a crisp 1px upper specular highlight:
     ```css
     box-shadow:
       inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
       0 1px 2px 0 rgba(0, 0, 0, 0.05);
     ```
   - Micro-tactile press animation: `active:scale-[0.98] transition-all duration-150`.
3. **Multi-Tenant White-Label Safe**: All colors resolve through Tailwind v4 `@theme inline` OKLCH CSS variables (`--primary`, `--accent`, `--ring`, `--background`, `--card`). Never hardcode hex values in component classes.
4. **Tailwind CSS v4 Continuous Scale (Zero Arbitrary Pixels)**:
   - **Never write arbitrary bracket pixels** for multiples of 4px or half-steps (`2px`).
   - Write `w-45 min-w-40` instead of `w-[180px] min-w-[160px]`.
   - Write `h-10 rounded-xl` instead of `h-[40px] rounded-[12px]`.
   - Write `min-h-100` instead of `min-h-[400px]`.

---

## 2. Five-Layer Surface Elevation Hierarchy

| Plane               | Surface                      | Tailwind Classes                                  | Usage                                                      |
| :------------------ | :--------------------------- | :------------------------------------------------ | :--------------------------------------------------------- |
| **L0 (Canvas)**     | Background Canvas            | `bg-background`                                   | Base page canvas behind all layout blocks.                 |
| **L1 (Structural)** | Sidebar / Nav / Shell        | `bg-sidebar`, `bg-background/80 backdrop-blur-md` | Persistent shell navigation, sticky headers, dividers.     |
| **L2 (Container)**  | Cards / Tables / Sections    | `bg-card border border-border/80 shadow-xs`       | Content cards, data tables, metrics widgets, form cards.   |
| **L3 (Floating)**   | Dropdowns / Menus / Popovers | `bg-popover border border-border shadow-md`       | Select menus, tenant switcher dropdown, notification bell. |
| **L4 (Overlay)**    | Dialogs / Drawers / Command  | `bg-background border border-border shadow-xl`    | Modals, alert dialogs, slideout sheets.                    |

---

## 3. Color Palette & Semantic System

- **Primary / Brand**: Resolves to active tenant brand or platform indigo/neutral.
- **Surface Neutrals**:
  - Light mode: Pure white (`oklch(1 0 0)`) canvas with 1px border (`oklch(0.922 0 0)`).
  - Dark mode: Stepped neutrals: canvas `oklch(0.145 0 0)`, cards `oklch(0.205 0 0)`, floating popovers `oklch(0.23 0 0)`, borders `oklch(1 0 0 / 10%)`.
- **Status & RBAC Tint Pairs**:
  - **Success / Published**: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
  - **Warning / Pending**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
  - **Destructive / Error**: `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`
  - **Info / Draft**: `bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20`

---

## 4. Typography Hierarchy

- **Display**: `text-3xl font-extrabold tracking-tight text-balance text-foreground`.
- **H1 (Page Header)**: `text-2xl font-bold tracking-tight text-balance text-foreground`.
- **H2 (Card Title)**: `text-lg font-semibold tracking-tight text-foreground`.
- **H3 (Section Title)**: `text-sm font-semibold tracking-tight text-foreground`.
- **Body**: `text-sm text-foreground leading-relaxed text-pretty`.
- **Muted Metadata**: `text-xs text-muted-foreground`.
- **Code, Tokens, Slugs & Merge Variables**: `font-mono text-xs font-medium` (e.g., `{{userName}}`, `tpl-auth-reset`).

---

## 5. Grid System & Responsive Layout

Follow BrixUI's 12-column responsive layout:

- **Mobile (< 640px)**:
  - Single column (`grid-cols-1`).
  - Action headers stack vertically: title on top, action buttons wrapped or full-width (`flex-col gap-3 sm:flex-row`).
  - Table wrappers MUST feature `w-full overflow-x-auto` to prevent viewport overflow.
- **Tablet (640px – 1024px)**:
  - 2-column distribution (`md:grid-cols-2`).
  - Split auxiliary metadata sidebars 2-up rather than squishing them into narrow vertical columns (`grid-cols-1 md:grid-cols-2 xl:grid-cols-1`).
- **Desktop (> 1024px)**:
  - 12-column fluid grid (`grid-cols-1 xl:grid-cols-12`).
  - Main surface: `xl:col-span-8`; Auxiliary surface: `xl:col-span-4`.
  - Max container width: `max-w-7xl mx-auto w-full`.

---

## 6. Component Sizing & Radius Standards

### Component Heights:

- **Sm (32px)**: `h-8 px-3 text-xs rounded-lg`
- **Md (40px, Default)**: `h-10 px-4 text-sm rounded-xl`
- **Lg (48px)**: `h-12 px-5 text-base rounded-xl`

### Radius Scale:

- `rounded-xs` (2px): Inner indicator dots
- `rounded-md` (6px): Badges, tooltips, checkboxes
- `rounded-lg` (8px): Inputs, select dropdown menus, table action buttons
- `rounded-xl` (12px): Interactive action cards, filter bars, select triggers
- `rounded-2xl` (16px): Primary content cards, data table wrappers, modal dialogs
- `rounded-3xl` (24px): Prominent hero banners, onboarding cards
- `rounded-4xl` (32px): Device frames, preview shells, fluid canvas containers
- `rounded-full` (9999px): Avatars, live pulse dots, category pills

---

## 7. Background Assets & Textures

- **Subtle Dot-Matrix Canvas Texture**:
  ```tsx
  <div className="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
  ```
- **Simulated Device Viewport Canvas**:
  Use `bg-neutral-100/90 dark:bg-neutral-950/60` with smooth inset border.
