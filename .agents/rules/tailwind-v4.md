# Tailwind CSS v4 Modern Standards & Spacing Scale

This rule outlines the requirements for writing clean, production-grade styles using **Tailwind CSS v4** in this repository.

---

## 1. Continuous Spacing Scale (No Arbitrary Brackets for 4px Multiples)

Tailwind CSS v4 introduces a continuous numeric spacing scale:

- **1 unit = 0.25rem = 4px**.
- Any integer multiple of 4px is a native utility.
- **Do not use arbitrary bracket syntax** (`[420px]`, `[100px]`, `[320px]`) when the pixel value is divisible by 4.

### Conversion Reference:

| Target Pixels | Divisible by 4  | Arbitrary Syntax (FORBIDDEN) | Tailwind v4 Native (REQUIRED) |
| :------------ | :-------------- | :--------------------------- | :---------------------------- |
| `420px`       | `420 / 4 = 105` | `min-h-[420px]`              | `min-h-105`                   |
| `400px`       | `400 / 4 = 100` | `w-[400px]`                  | `w-100`                       |
| `480px`       | `480 / 4 = 120` | `max-w-[480px]`              | `max-w-120`                   |
| `320px`       | `320 / 4 = 80`  | `h-[320px]`                  | `h-80`                        |
| `360px`       | `360 / 4 = 90`  | `w-[360px]`                  | `w-90`                        |
| `500px`       | `500 / 4 = 125` | `max-w-[500px]`              | `max-w-125`                   |
| `600px`       | `600 / 4 = 150` | `min-h-[600px]`              | `min-h-150`                   |

### When Arbitrary Brackets ARE Allowed:

- Non-multiples of 4px: `w-[347px]`, `top-[1px]`, `gap-[13px]`.
- Dynamic CSS calculations: `min-h-[calc(100vh-4rem)]`.
- Complex multi-value properties: `grid-cols-[1fr_2fr_1fr]`.

---

## 2. Modern Tailwind v4 Features

- **OKLCH Color Model**: Use semantic OKLCH tokens defined in theme (`bg-background`, `text-foreground`, `border-border`, `text-primary`, `bg-destructive/10`).
- **Native Container Queries**: Use `@container`, `@sm`, `@md`, `@lg` instead of window media queries for encapsulated components where appropriate.
- **Text Wrap**: Use modern typography utilities:
  - `text-balance` for headings (`h1`, `h2`, titles) to prevent orphan words.
  - `text-pretty` for body paragraphs.
- **CSS Grid Subgrid**: Use `grid-cols-subgrid` when child elements need to align with a parent grid.
- **Micro-Shadows**: Prefer `shadow-xs` and `shadow-2xs` for tactile border elevations instead of heavy legacy box-shadows.
