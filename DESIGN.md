# Design

This doc has two parts:

1. **[Product direction](#product-direction)** — what we're building this hackathon, how the UI
   supports the three themes, and what works in mock mode now vs. what waits for Supabase.
2. **[Design system](#design-system)** — the brand/visual reference (colors, type, components,
   tokens). This is the source of truth for all visual work (see [CLAUDE.md](CLAUDE.md)).

Read part 1 before deciding *what* to build; read part 2 before deciding *how* it should look.

---

# Product direction

## What this is

A single-page dashboard for an **AI-agent platform with gamification**. One person can run
`npm install && npm run dev` and immediately see a working, populated app — no backend, no keys.
The header shows a **`● mock data`** badge; everything renders from
[`src/data/mock.js`](src/data/mock.js). When Supabase env vars are added later, the same screens
flip to **`● live (supabase)`** with **no component changes**.

Stack: **React 19 · Vite 6 · Tailwind v4 · shadcn/ui ("new-york") · React Router 7 · Supabase**.

> **The hackathon goal is a convincing, demoable product on mock data.** Build features as UI +
> mock data first. Treat the live backend as a later swap, not a prerequisite.

## The non-negotiable rule: data goes through `api`

Every screen reads and writes data **only** through the `api` object in
[`src/services/dataClient.js`](src/services/dataClient.js), via the `useApi` hook:

```js
const { data: agents, loading } = useApi(() => api.getAgents());
```

- **Never** import `supabase` in a component.
- **Never** import `mockAgents` / `mockUsers` / etc. directly in a component.
- `dataClient` decides mock vs. live based on `isSupabaseConfigured`. Components stay identical in
  both modes.

This single rule is what makes "mock now, Supabase later" work. Designs that bypass it (a component
that talks to Supabase directly, or reads a mock array directly) are wrong by construction.

### Adding anything new (the pattern)

1. Add the shape to [`src/data/mock.js`](src/data/mock.js) (append to the bottom; don't reorder).
2. Expose it as a method on `api` in [`src/services/dataClient.js`](src/services/dataClient.js).
3. Build the component in `src/features/<area>/` using `useApi(() => api.xxx())`.
4. Drop it into a page in `src/pages/`.
5. Mirror the shape in [`supabase/schema.sql`](supabase/schema.sql) so the live swap is seamless
   (this step can be done later — it's not needed to demo).

## The three themes

The whole experience is organized around the three themes from the [README](README.md). Each maps to
a route, a feature folder, and `api` methods that already return mock data.

### 1. Gamification — `/` (Dashboard)

Make progress feel rewarding and competitive. Surfaces in
[`src/features/gamification/`](src/features/gamification/) and on the Dashboard:

- **Level card** — current user's level, points, streak (`api.getCurrentUser`).
- **Quests** — todo / in-progress / done with point values (`api.getQuests`).
- **Leaderboard** — users ranked by points (`api.getLeaderboard`).
- **Badges** — earned vs. locked, with icons (`api.getBadges`).
- Points are awarded through `api.awardPoints` (mock mode echoes; Supabase mode persists).

UX intent: bright, immediate, celebratory. Use the **primary blue** for progress/points and the
**orange accent** sparingly for "earned/unlocked" moments. Lean on `Progress`, `Badge`, and `Card`.

### 2. Agents — `/agents`

Show autonomous agents and make a run feel alive. In
[`src/features/agents/`](src/features/agents/):

- Agent list with status (`idle` / `running`), model, and run count (`api.getAgents`).
- A **live run trace** that streams steps as an agent executes (`api.getAgentLog`).

UX intent: a "control room" feel. The run trace is the hero — stream steps with a clear running
state. Use `font-mono` for step logs, timestamps, and model names.

### 3. MCPs — `/mcp`

Connecting tools is what gives agents power. In [`src/features/mcp/`](src/features/mcp/):

- A grid of MCP servers with connect/disconnect and a tool count (`api.getMcpServers`).
- Connected state is visually obvious (status badge), toggleable in mock mode.

UX intent: an "integrations marketplace." Cards with a clear connected/not-connected state and a
single primary action per card.

## Works in mock mode *now* vs. *deferred*

Design against this line so the team never blocks on backend work.

| Area | Mock-mode now (build this) | Deferred until Supabase |
|------|----------------------------|--------------------------|
| Reads | All lists/cards from `api.get*()` | Same calls, real rows — no UI change |
| Writes | Optimistic local state (e.g. toggle MCP, award points echo, stream run trace) | Real persistence (`awardPoints` RPC, inserts/updates) |
| Auth | `mockCurrentUser` from `api.getCurrentUser` | `supabase.auth` real session |
| Data badge | `● mock data` | `● live (supabase)` (automatic) |
| Schema | Shapes live in `mock.js` | `supabase/schema.sql` mirrors them |

Rules of thumb for the hackathon:
- **If a feature needs a feature to *look* done, it can ship on mock data.** Build it.
- **If it needs durable, multi-user, cross-session state, note it as deferred** and fake it locally
  for the demo.
- Don't design flows that *require* real auth, real persistence, or live external APIs to be
  demoable. Those are the swap-later layer.

## Collaboration constraints (don't design around them)

From [COLLAB.md](COLLAB.md): keep **`main` always working/demoable**, favor **small frequent
commits**, and split work along the folder structure (one person on gamification + Dashboard, the
other on agents + MCP). Designs should be **modular per feature folder** so two people rarely edit
the same file. Treat `src/data/mock.js`, `src/services/dataClient.js`, and `src/App.jsx` as shared —
append/extend, don't reorganize.

---

# Design system

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

> **Component library: [shadcn/ui](https://ui.shadcn.com) — the only component library for this project.**
> Built on Radix UI + Tailwind. Copy-paste/own model.
> Already installed in [src/components/ui/](src/components/ui/): Button, Badge, Card, Progress, Tabs, Avatar.
> Need another? `npx shadcn@latest add <name>`. Full component index: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

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
