# Aether

Aether is a client companion and daily operating surface for financial advisors.
It helps advisors prepare for meetings, remember client context, track follow-ups,
manage client-related expenses, and use AI-assisted workflows without relying on
scattered notes or memory alone.

The app runs with mock data out of the box for demos, then switches to Supabase
when environment variables are configured. The main product areas are:

- Home briefing with today's meetings, tasks, quiet clients, and a weekly calendar
- Client hub with client records, memories, sensitivities, articles, and chat
- Expense tracker with receipt upload, OCR-assisted labeling, and monthly quota
- Agent and workflow builder surfaces for proactive follow-up automation
- Connectors/MCP page for showing tool integrations

## Team

**Team name:** Imagine Hack

**Team members:**

- Adrian Lim
- Gabriella Chua
- Wei Xiang
- Jeremy Kiu
- Ferdinand Sanjaya

## Technologies Used

- React 19
- Vite 6
- Tailwind CSS v4
- shadcn/ui-style local components
- Radix UI primitives
- Lucide React icons
- React Router
- FullCalendar
- Supabase client, database tables, storage, and Edge Functions
- DeepSeek API for AI-generated brief/chat responses when enabled
- Tesseract.js for receipt OCR
- Local storage and mock data for offline demos
- Node.js and npm scripts

## Challenge and Approach

Financial advisors manage many clients at once, and important context often lives
in scattered notes, emails, spreadsheets, or the advisor's memory. That creates
risk: missed follow-ups, weak meeting preparation, forgotten sensitivities, and
loss of continuity when a client is reassigned.

Aether approaches the problem as a single advisor workspace:

- The Home screen gives the advisor a daily brief, task board, calendar, and quiet-client list.
- Client records combine structured profile data, memory timelines, articles, meetings, and chat history.
- The customer chat is grounded in saved client context and is designed to say when information is missing instead of inventing facts.
- Follow-up workflows and agents expose proactive outreach as configurable Trigger -> Condition -> Action flows.
- The data layer goes through `src/services/dataClient.js`, so components work against mock data first and can use Supabase later without changing UI code.

## Usage Instructions

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

Run the project checks:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Mock Data and Supabase

The app is demoable without a backend. If Supabase environment variables are not
configured, Aether reads mock data and local browser state.

To connect Supabase:

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run the SQL files in `supabase/` that match the enabled features, starting with `supabase/schema.sql`.
4. Deploy optional Edge Functions, such as `supabase/functions/home-brief`.
5. Set server-side AI secrets with Supabase, for example `DEEPSEEK_API_KEY`.
6. Restart `npm run dev`.

The main data boundary is `src/services/dataClient.js`. Components should call
methods on `api` instead of importing Supabase or mock arrays directly.

## Project Structure

```text
src/
  components/ui/      Shared UI primitives and loaders
  data/mock.js        Mock users, clients, memories, tasks, agents, workflows
  features/           Product feature modules
  hooks/useApi.js     Async data-loading helper
  lib/supabase.js     Supabase client setup
  pages/              Route-level screens
  services/dataClient.js
                       Mock/Supabase data access layer
supabase/             Database SQL and Edge Functions
scripts/              Project assertion scripts
```

## AI Tool Attribution

- Code assistance provided by OpenAI Codex (GPT-5) for coding.
- Runtime AI responses are provided by DeepSeek models when API access is configured, including home brief generation, advisor chat, customer chat, and follow-up drafting.
- Receipt text extraction uses Tesseract.js OCR to help classify uploaded expense proofs.

Any additional AI tools used in future development should be credited in this
section with the tool name and the component, function, or workflow it assisted.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run repository assertion scripts |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run sync:aag` | Sync AAG seed data |
