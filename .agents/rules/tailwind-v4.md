# Tailwind CSS v4 Modern Standards & Spacing Scale

This rule outlines the strict requirements for writing clean, production-grade styles using **Tailwind CSS v4** across all components in this repository.

---

## 1. Zero Arbitrary Pixel Rule (Strict Enforcement)

Tailwind CSS v4 introduces a continuous numeric scale where **1 unit = 0.25rem = 4px**.
Furthermore, Tailwind v4 natively supports half-step units (`.5` = 2px):

- **Do NOT use arbitrary bracket pixel values** (e.g., `w-[180px]`, `min-w-[160px]`, `w-[90px]`, `h-[360px]`, `rounded-[32px]`).
- Any pixel value divisible by 4px (or ending in 2px via `.5`) must be written as a native Tailwind v4 class.

### Quick Conversion Reference:

| Pixels  | Unit Calculation | Arbitrary Syntax (STRICTLY FORBIDDEN) | Native Tailwind v4 Class (REQUIRED) |
| :------ | :--------------- | :------------------------------------ | :---------------------------------- |
| `20px`  | `20 / 4 = 5`     | `size-[20px]`, `h-[20px]`             | `size-5`, `h-5`                     |
| `32px`  | `32 / 4 = 8`     | `size-[32px]`, `h-[32px]`             | `size-8`, `h-8`                     |
| `40px`  | `40 / 4 = 10`    | `h-[40px]`, `w-[40px]`                | `h-10`, `w-10`                      |
| `48px`  | `48 / 4 = 12`    | `h-[48px]`, `w-[48px]`                | `h-12`, `w-12`                      |
| `50px`  | `50 / 4 = 12.5`  | `min-w-[50px]`                        | `min-w-12.5`                        |
| `80px`  | `80 / 4 = 20`    | `min-h-[80px]`                        | `min-h-20`                          |
| `90px`  | `90 / 4 = 22.5`  | `w-[90px]`, `min-w-[90px]`            | `w-22.5`, `min-w-22.5` (or `w-24`)  |
| `110px` | `110 / 4 = 27.5` | `w-[110px]`, `min-w-[110px]`          | `w-27.5`, `min-w-27.5` (or `w-28`)  |
| `120px` | `120 / 4 = 30`   | `w-[120px]`, `max-w-[120px]`          | `w-30`, `max-w-30`                  |
| `130px` | `130 / 4 = 32.5` | `w-[130px]`, `min-w-[130px]`          | `w-32.5`, `min-w-32.5`              |
| `140px` | `140 / 4 = 35`   | `max-w-[140px]`, `w-[140px]`          | `max-w-35`, `w-35`                  |
| `150px` | `150 / 4 = 37.5` | `w-[150px]`, `sm:w-[150px]`           | `w-37.5`, `sm:w-37.5`               |
| `160px` | `160 / 4 = 40`   | `min-w-[160px]`, `w-[160px]`          | `min-w-40`, `w-40`                  |
| `180px` | `180 / 4 = 45`   | `w-[180px]`, `min-w-[180px]`          | `w-45`, `min-w-45`                  |
| `200px` | `200 / 4 = 50`   | `w-[200px]`, `min-w-[200px]`          | `w-50`, `min-w-50`                  |
| `220px` | `220 / 4 = 55`   | `min-w-[220px]`                       | `min-w-55`                          |
| `240px` | `240 / 4 = 60`   | `w-[240px]`, `max-w-[240px]`          | `w-60`, `max-w-60`                  |
| `260px` | `260 / 4 = 65`   | `w-[260px]`, `min-w-[260px]`          | `w-65`, `min-w-65`                  |
| `280px` | `280 / 4 = 70`   | `max-w-[280px]`                       | `max-w-70`                          |
| `320px` | `320 / 4 = 80`   | `w-[320px]`, `h-[320px]`              | `w-80`, `h-80`                      |
| `360px` | `360 / 4 = 90`   | `min-h-[360px]`, `w-[360px]`          | `min-h-90`, `w-90`                  |
| `376px` | `376 / 4 = 94`   | `max-w-[375px]`                       | `max-w-94`                          |
| `400px` | `400 / 4 = 100`  | `min-h-[400px]`, `w-[400px]`          | `min-h-100`, `w-100`                |
| `480px` | `480 / 4 = 120`  | `min-h-[480px]`, `max-w-[480px]`      | `min-h-120`, `max-w-120`            |
| `500px` | `500 / 4 = 125`  | `min-h-[500px]`, `max-w-[500px]`      | `min-h-125`, `max-w-125`            |
| `580px` | `580 / 4 = 145`  | `min-h-[580px]`                       | `min-h-145`                         |
| `600px` | `600 / 4 = 150`  | `max-h-[600px]`, `min-h-[600px]`      | `max-h-150`, `min-h-150`            |
| `640px` | `640 / 4 = 160`  | `max-w-[640px]`, `w-[640px]`          | `max-w-160`, `w-160`                |
| `700px` | `700 / 4 = 175`  | `max-h-[700px]`                       | `max-h-175`                         |

---

## 2. Native Border Radius Scale (No `rounded-[...px]`)

Use native Tailwind v4 radius tokens instead of arbitrary bracket radii:

| Radius | Native Utility | Forbidden Bracket Syntax | Usage Target                                      |
| :----- | :------------- | :----------------------- | :------------------------------------------------ |
| `2px`  | `rounded-xs`   | `rounded-[2px]`          | Inner sub-elements, status indicators             |
| `4px`  | `rounded-sm`   | `rounded-[4px]`          | Checkboxes, tags, mini-badges                     |
| `6px`  | `rounded-md`   | `rounded-[6px]`          | Small tooltips, badges                            |
| `8px`  | `rounded-lg`   | `rounded-[8px]`          | Standard inputs, select triggers                  |
| `12px` | `rounded-xl`   | `rounded-[12px]`         | Elevated cards, dropdown popovers, action buttons |
| `16px` | `rounded-2xl`  | `rounded-[16px]`         | Primary containers, data table shells, dialogs    |
| `24px` | `rounded-3xl`  | `rounded-[24px]`         | Large feature hero cards, interactive panels      |
| `32px` | `rounded-4xl`  | `rounded-[32px]`         | Device mockups, mobile preview frames             |
| Full   | `rounded-full` | `rounded-[9999px]`       | Avatars, status pills, circular icon buttons      |

---

## 3. Shadows & Elevation Tokens

Always use semantic Tailwind shadow utilities paired with fine sub-pixel borders:

- `shadow-2xs`: Specular highlights, micro-elements (`shadow-2xs border border-border/60`).
- `shadow-xs`: Default for elevated cards, table shells, and primary buttons (`shadow-xs border border-border/80`).
- `shadow-sm` / `shadow-md`: Hover states and floating select dropdowns (`shadow-md border border-border`).
- `shadow-lg` / `shadow-xl`: Modal dialogs, action sheets, and flyout sheets (`shadow-xl border border-border`).
- `shadow-2xl`: Device preview frames, floating command palettes (`shadow-2xl border-4 border-neutral-800`).

---

## 4. Modern Tailwind v4 Typography & Layout Standards

- **Heading Balancing**: Always apply `text-balance` to headings (`h1`, `h2`, `h3`, card titles, dialog titles) to prevent single-word line wraps (orphans).
- **Body Layout**: Use `text-pretty` for multiline descriptions and explanatory text.
- **Monospace Formatting**: Format IDs, keys, tokens, timestamps, IP addresses, and merge variables (`{{variable}}`) with `font-mono text-xs`.
- **Arbitrary Brackets Exception**:
  - Bracket syntax is permitted **strictly** for:
    1. CSS functions: `max-h-[calc(100vh-120px)]`, `min-h-[calc(100vh-4rem)]`.
    2. Grid templates with fractional columns: `grid-cols-[1fr_auto_2fr]`.
    3. Values not divisible by 4 or 2 (e.g., `top-[1px]`, `w-[347px]`).
