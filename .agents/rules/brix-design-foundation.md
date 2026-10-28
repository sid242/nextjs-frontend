# BrixUI Design System & Foundation Guidelines

This rule establishes the design language, token hierarchy, and layout foundations derived from the **BrixUI Multi-Brand Design System & UI Kit** for this application.

---

## 1. Color Palette & Semantic System

### Principles:

- **Never Hardcode Hex Values**: Always reference OKLCH semantic tokens (`bg-background`, `text-foreground`, `border-border`, `text-primary`, `bg-card`).
- **Surface & Tint Contrast (WCAG 2.1 AA Compliant)**:
  - **Success / Published**: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
  - **Warning / Pending**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
  - **Destructive / Error**: `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`
  - **Info / Draft**: `bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20`
  - **Neutral / Archived**: `bg-muted/80 text-muted-foreground border border-border/60`
- **Dark Mode Elevation Pairings**:
  - Light mode surfaces: Pure white (`oklch(1 0 0)`) canvas with 1px border (`oklch(0.922 0 0)`).
  - Dark mode surfaces: Subtle stepped neutrals: canvas `oklch(0.145 0 0)`, cards `oklch(0.205 0 0)`, floating popovers `oklch(0.23 0 0)`, borders `oklch(1 0 0 / 10%)`.

---

## 2. Typography Hierarchy

| Style Level            | Class Combination                                                     | Intended Usage                                           |
| :--------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------- |
| **Display Title**      | `text-3xl font-extrabold tracking-tight text-balance text-foreground` | Main dashboard heroes, landing banners                   |
| **H1 (Page Header)**   | `text-2xl font-bold tracking-tight text-balance text-foreground`      | Top-level view headers (e.g. Email Templates)            |
| **H2 (Card Title)**    | `text-lg font-semibold tracking-tight text-foreground`                | Widget headers, modal headers, major card titles         |
| **H3 (Section Title)** | `text-sm font-semibold tracking-tight text-foreground`                | Form section headings, sidebar category labels           |
| **Body (Default)**     | `text-sm text-foreground leading-relaxed text-pretty`                 | Content paragraphs, dialog descriptions, inputs          |
| **Body (Muted/Small)** | `text-xs text-muted-foreground leading-normal`                        | Table captions, helper copy, secondary metadata          |
| **Code / Tokens**      | `font-mono text-xs font-medium`                                       | IDs, merge variables (`{{variable}}`), slugs, timestamps |

---

## 3. Grid System & Responsive Page Layout

Adopt BrixUI's 12-column responsive layout system:

1. **Mobile (< 640px)**:
   - Single-column vertical flow (`grid-cols-1`).
   - Action headers stack vertically: title on top, full-width or wrap action buttons below (`flex-col gap-3 sm:flex-row`).
   - Screen padding: `px-4 py-4`.
2. **Tablet (640px – 1024px)**:
   - 2-column distribution (`md:grid-cols-2`).
   - Split metadata/variable sidebars 2-up rather than squishing them into narrow vertical columns (`grid-cols-1 md:grid-cols-2 xl:grid-cols-1`).
   - Screen padding: `px-6 py-6`.
3. **Desktop (> 1024px)**:
   - 12-column fluid grid (`grid-cols-1 xl:grid-cols-12`).
   - Main content takes `xl:col-span-8`, auxiliary cards take `xl:col-span-4`.
   - Max width constraint: `max-w-7xl mx-auto w-full`.
   - Screen padding: `px-8 py-8`.

---

## 4. Component Sizing Standards

All interactive controls (Buttons, Inputs, Selects, Dropdowns) follow standard height steps:

| Size Step          | Height Class  | Padding / Font              | Target Elements                                   |
| :----------------- | :------------ | :-------------------------- | :------------------------------------------------ |
| **Sm (Compact)**   | `h-8` (32px)  | `px-3 text-xs rounded-lg`   | Table actions, filter pills, badge controls       |
| **Md (Default)**   | `h-10` (40px) | `px-4 text-sm rounded-xl`   | Standard inputs, select triggers, primary buttons |
| **Lg (Prominent)** | `h-12` (48px) | `px-5 text-base rounded-xl` | Auth forms, modal confirmation actions            |

---

## 5. Border Radius Hierarchy

Never use arbitrary brackets (`rounded-[...px]`). Use BrixUI standard scale:

- `rounded-xs` (2px): Inner indicator dots, active tabs.
- `rounded-md` (6px): Badges, tooltips, checkboxes.
- `rounded-lg` (8px): Inputs, select dropdown menus, table action buttons.
- `rounded-xl` (12px): Interactive action cards, filter bars, select triggers.
- `rounded-2xl` (16px): Primary content cards, data table wrappers, modal dialogs.
- `rounded-3xl` (24px): Prominent hero banners, onboarding cards.
- `rounded-4xl` (32px): Device frames, preview shells, fluid canvas containers.
- `rounded-full` (9999px): Avatars, live pulse dots, category pills.

---

## 6. Spacing & Rhythm

Use strict multiples of 4px using native Tailwind v4 continuous scale:

- Micro-gaps: `gap-1` (4px), `gap-1.5` (6px), `gap-2` (8px), `gap-2.5` (10px).
- Internal element padding: `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px).
- Card & container gutters: `space-y-4` (16px), `space-y-6` (24px), `space-y-8` (32px).
- Major page section margin: `mt-8` (32px), `mt-12` (48px).

---

## 7. Shadows, Specular Highlights & Effects

- **Sub-Pixel Border Containment**: Every elevated card must have `border border-border/80` or `border border-border/60`.
- **Specular Highlight**: Primary buttons and elevated cards feature an upper specular highlight:
  ```css
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
    0 1px 2px 0 rgba(0, 0, 0, 0.05);
  ```
- **Layer Elevation Classes**:
  - L1 (Card / Section): `shadow-xs border border-border/80`
  - L2 (Dropdown / Popover): `shadow-md border border-border`
  - L3 (Modal / Dialog): `shadow-xl border border-border`
  - L4 (Device Frame): `shadow-2xl border-4 border-neutral-800`

---

## 8. Background Assets & Canvas Textures

To prevent sterile white/black canvases, use BrixUI subtle background textures:

- **Subtle Dot Matrix Texture**:
  ```css
  bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]
  dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]
  ```
- **Device Viewport Canvas**:
  Use `bg-neutral-100/90 dark:bg-neutral-950/60` with a smooth inset border for device previews.
