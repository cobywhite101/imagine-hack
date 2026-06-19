# Design System

Brand reference for this project. Extracted from [devin.ai](https://devin.ai/) and adapted to our
stack (React 19 · Tailwind v4 · shadcn/ui "new-york"). Tokens live as CSS variables in
[src/index.css](src/index.css) and are consumed through Tailwind utility classes (`bg-primary`,
`text-muted-foreground`, etc.).

> **Status:** `src/index.css` currently ships the default shadcn _zinc_ theme. The "Token mapping"
> section below is the target — apply it to `index.css` to make the app match the brand.

---

## Brand at a glance

- **Aesthetic:** dark-first, near-black surfaces, high contrast, restrained accent color.
- **Voice in UI:** technical/precise — pairs a clean sans (Inter) with a mono (IBM Plex Mono) for
  labels, captions, and UI metadata.
- **Motion:** effectively instant (~0.001s) with `ease` — transitions are present but imperceptible.

---

## Colors

### Core
| Role | Hex | RGB | Notes |
|------|-----|-----|-------|
| Primary | `#317cff` | `49, 124, 255` | Brand blue — primary actions, links, focus |
| Accent / orange | `#ec5d40` | `236, 93, 64` | Secondary accent, highlights |
| Surface | `#000000` | `0, 0, 0` | Page background (dark) |
| Button bg | `#121111` | `18, 17, 17` | Default solid button |
| Badge bg | `#141414` | `20, 20, 20` | Filled neutral pills |

### Primary scale (gradient family)
| Hex | RGB |
|-----|-----|
| `#4991e5` | `73, 145, 229` |
| `#39bdd6` | `57, 189, 214` |
| `#3bd4cb` | `59, 212, 203` |

### Neutrals
| Hex | RGB | Use |
|-----|-----|-----|
| `#fcfcfc` | `252, 252, 252` | Text on dark |
| `#e7e7e7` | `231, 231, 231` | Light text / badge text |
| `#989898` | `152, 152, 152` | Muted / secondary text |

---

## Typography

**Inter** — primary UI & display. Weight **500** throughout.

| Token | Size |
|-------|------|
| display | 70px |
| heading-2 | 64px / 40px |
| heading-3 | 30px / 26px |
| heading-5 | 24px |
| body | 18px / 14px |
| link | 16px |

**IBM Plex Mono** — UI labels, captions, metadata. Weight **500**.

| Token | Size |
|-------|------|
| ui | 16px |
| caption | 11px |

---

## Spacing

8px base system. Common steps: `8 · 12 · 16 · 24 · 28 · 35 · 37 · 56 · 75` (px).

---

## Border radius

| Radius | Used on |
|--------|---------|
| 10px | links, figures, cards |
| 12px | divs, lists |
| 16px | divs, cards |
| 100px | pills / buttons (fully rounded) |
| 5px | badges/tags |

---

## Components

### Button (default)
- bg `#121111` · text `#fcfcfc`
- padding `5px 10px 5px 7px`
- radius `100px`
- shadow `rgba(0,0,0,0.22) 0 4px 16px`

### Badge / pill (neutral, filled)
- bg `#141414` · text `#e7e7e7`
- padding `8px 14.4px` · radius `5px` · font-size `16px`

### Links
- Default brand: `#317cff` · on-dark: `#fcfcfc`
- Hover: `underline`

---

## Token mapping → `src/index.css`

Replace the default zinc palette with the brand. Dark is the primary theme. Values shown as hex for
readability — convert to `oklch()` (or keep hex; Tailwind v4 accepts both) when editing.

```css
/* dark / default surface */
--background: #000000;        /* surface */
--foreground: #fcfcfc;        /* primary text on dark */
--card:       #121111;        /* button/card surface */
--muted-foreground: #989898;  /* secondary text */
--primary:    #317cff;        /* brand blue */
--accent:     #ec5d40;        /* orange accent */
--border:     #141414;
--radius:     1rem;           /* 16px cards; pills use rounded-full */
```

Fonts — register Inter + IBM Plex Mono and expose as Tailwind families:

```css
@theme inline {
  --font-sans: "Inter", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}
```

---

## Source

Auto-extracted from https://devin.ai/ — see this file's git history for the raw extraction.
