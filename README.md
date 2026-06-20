# Hackathon Starter

React + Vite + Tailwind v4 + shadcn/ui + Supabase. Runs on **mock data out of
the box** — no backend needed — and switches to Supabase automatically once you
add env vars. Built around three themes: **Gamification**, **Agents**, **MCPs**.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

That's it. The header shows a **"● mock data"** badge — you're running fully
offline on the data in `src/data/mock.js`.

## Going live with Supabase (later)

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`, then `supabase/aag_seed.sql`,
   then `supabase/advisor_home.sql`.
3. `cp .env.example .env.local` and fill in:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Restart `npm run dev`. The badge flips to **"● live (supabase)"** and every
   screen now reads real data — no component changes needed.

The magic is in [`src/services/dataClient.js`](src/services/dataClient.js): one
`api` object that returns mock data or queries Supabase depending on whether the
env vars exist. **Always import data through `api`, never hit `supabase` or the
mock arrays directly from components.**

## Where things live

```
src/
├── components/ui/      shadcn primitives (button, card, badge, ...)
├── data/mock.js        ← all mock data (edit this freely)
├── services/dataClient.js  ← THE swap layer (mock ⇄ supabase)
├── hooks/useApi.js     tiny async data hook
├── features/
│   ├── gamification/   leaderboard, badges, quests, level card
│   ├── agents/         agent list + live run trace
│   └── mcp/            MCP server connect/disconnect
├── pages/              Dashboard, Agents, MCP (one per route)
└── App.jsx             nav + routes
```

## How to add a feature (the pattern)

1. Add mock data to `src/data/mock.js`.
2. Expose it via a method in `src/services/dataClient.js`.
3. Build a component in `src/features/<area>/` using `useApi(() => api.xxx())`.
4. Drop it into a page.

Doing it in this order means the UI works on mock data immediately, and wiring
Supabase later is just filling in the `dataClient` branch.

## Adding more shadcn components

```bash
npx shadcn@latest add dialog dropdown-menu input
```
`components.json` is already configured (JS, `@/` alias, zinc theme).

## Scripts

| command | what |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run preview` | preview the build |

See [COLLAB.md](COLLAB.md) for the two-person git workflow.
# imagine-hack
