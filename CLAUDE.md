# Project: Hackathon Starter

React 19 · Vite · Tailwind v4 · coss ui (Base UI) · Supabase · React Router 7.

## Design system — READ BEFORE BUILDING UI

**[DESIGN.md](DESIGN.md) is the source of truth for all visual work.** Before creating or editing
any component, page, or style, consult it.

Rules:
- **Use tokens, not raw values.** Style with Tailwind classes that map to our CSS variables
  (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`,
  `border`, `rounded-lg`). Tokens are defined in [src/index.css](src/index.css). Do **not**
  hardcode hex colors or arbitrary `[16px]` values when a token exists.
- **Dark-first.** The brand surface is near-black; `:root` already carries the dark brand palette.
- **Fonts:** Inter (`font-sans`, default) for UI/display, IBM Plex Mono (`font-mono`) for labels,
  captions, and metadata.
- **Use coss ui primitives** in [src/components/ui/](src/components/ui/) — Button, Badge, Card, Progress, Tabs, Avatar are installed. Add more with `npx shadcn@latest add https://coss.com/ui/r/<name>.json`. No Radix/shadcn imports.
- If a design need isn't covered by a token, add the token to `index.css` + document it in
  `DESIGN.md` rather than one-off styling.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (run to verify CSS/JSX compiles)
