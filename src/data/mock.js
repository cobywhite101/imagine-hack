// Mock data — the single source of truth before the backend exists.
// Mirror these shapes in supabase/schema.sql so swapping is seamless.

export const mockUsers = [
  { id: "u1", name: "Ada Lovelace", avatar: "AL", points: 1280, level: 7, streak: 12 },
  { id: "u2", name: "Alan Turing", avatar: "AT", points: 1140, level: 6, streak: 5 },
  { id: "u3", name: "Grace Hopper", avatar: "GH", points: 980, level: 6, streak: 9 },
  { id: "u4", name: "Linus Torvalds", avatar: "LT", points: 720, level: 4, streak: 2 },
  { id: "u5", name: "Margaret Hamilton", avatar: "MH", points: 650, level: 4, streak: 7 },
];

// The signed-in user (mock auth). Swap for supabase.auth later.
export const mockCurrentUser = mockUsers[0];

export const mockBadges = [
  { id: "b1", name: "First Blood", icon: "Zap", description: "Completed your first quest", earned: true },
  { id: "b2", name: "Streak Master", icon: "Flame", description: "7-day streak", earned: true },
  { id: "b3", name: "Agent Whisperer", icon: "Bot", description: "Ran 10 agent tasks", earned: true },
  { id: "b4", name: "Connector", icon: "Plug", description: "Linked an MCP server", earned: false },
  { id: "b5", name: "Centurion", icon: "Trophy", description: "Earned 1000 points", earned: true },
  { id: "b6", name: "Night Owl", icon: "Moon", description: "Active after midnight", earned: false },
];

export const mockQuests = [
  { id: "q1", title: "Connect a data source", points: 100, status: "done" },
  { id: "q2", title: "Run your first agent", points: 150, status: "done" },
  { id: "q3", title: "Earn a badge", points: 50, status: "in_progress" },
  { id: "q4", title: "Reach the top 3 leaderboard", points: 300, status: "todo" },
  { id: "q5", title: "Link an MCP integration", points: 200, status: "todo" },
];

export const mockAgents = [
  {
    id: "a1",
    name: "Researcher",
    description: "Gathers and summarizes information from connected sources.",
    status: "idle",
    model: "claude-opus-4-8",
    runs: 24,
  },
  {
    id: "a2",
    name: "Planner",
    description: "Breaks a goal into ordered, executable steps.",
    status: "idle",
    model: "claude-sonnet-4-6",
    runs: 11,
  },
  {
    id: "a3",
    name: "Executor",
    description: "Carries out steps using available MCP tools.",
    status: "running",
    model: "claude-opus-4-8",
    runs: 37,
  },
];

export const mockMcpServers = [
  { id: "m1", name: "GitHub", description: "Repos, issues, and pull requests", connected: true, tools: 42 },
  { id: "m2", name: "Supabase", description: "Database, auth, and storage", connected: true, tools: 18 },
  { id: "m3", name: "Web Search", description: "Live search and fetch", connected: false, tools: 2 },
  { id: "m4", name: "Analytics", description: "Product and usage metrics", connected: false, tools: 9 },
];

// Sample agent run log used by the Agents page demo.
export const mockAgentLog = [
  { id: "l1", agent: "Executor", step: "Read issue #128", at: "12:01" },
  { id: "l2", agent: "Planner", step: "Drafted 3-step plan", at: "12:02" },
  { id: "l3", agent: "Executor", step: "Opened PR via GitHub MCP", at: "12:04" },
];

// ---------------------------------------------------------------------------
// Sales workspace — Customer Hub, Home chat, and Agent Hub.
// ---------------------------------------------------------------------------

// Customer Hub rows. One per company/deal. `overdue` drives the red next-action.
export const mockCustomers = [
  {
    id: "cust1",
    name: "Greenleaf",
    contact: "Maya Chen · VP Sales",
    avatar: "GL",
    accent: "#3bd4cb",
    status: "Negotiation",
    tier: "Enterprise",
    seats: 52,
    value: "$148k",
    lastTouch: "2d ago",
    nextAction: "Send security review",
    due: "Today",
    overdue: true,
    tags: ["AI", "Migration"],
  },
  {
    id: "cust2",
    name: "Northwind Labs",
    contact: "Dev Okafor · Head of RevOps",
    avatar: "NL",
    accent: "#317cff",
    status: "Proposal",
    tier: "Mid-market",
    seats: 24,
    value: "$61k",
    lastTouch: "5d ago",
    nextAction: "Share ROI deck",
    due: "Tomorrow",
    overdue: false,
    tags: ["Expansion"],
  },
  {
    id: "cust3",
    name: "Atlas Freight",
    contact: "Priya Nair · COO",
    avatar: "AF",
    accent: "#ec5d40",
    status: "Qualified",
    tier: "Enterprise",
    seats: 80,
    value: "$210k",
    lastTouch: "1d ago",
    nextAction: "Book technical demo",
    due: "Thu",
    overdue: false,
    tags: ["Logistics", "ICP fit"],
  },
  {
    id: "cust4",
    name: "Sunrise Retail",
    contact: "Tom Becker · Director",
    avatar: "SR",
    accent: "#4991e5",
    status: "Won",
    tier: "Mid-market",
    seats: 18,
    value: "$44k",
    lastTouch: "Today",
    nextAction: "Kickoff onboarding",
    due: "Fri",
    overdue: false,
    tags: ["Closed"],
  },
  {
    id: "cust5",
    name: "Quanta Health",
    contact: "Dr. Lena Voss · CIO",
    avatar: "QH",
    accent: "#39bdd6",
    status: "Churn-risk",
    tier: "Enterprise",
    seats: 64,
    value: "$172k",
    lastTouch: "21d ago",
    nextAction: "Re-engage exec sponsor",
    due: "Overdue",
    overdue: true,
    tags: ["At risk", "Renewal"],
  },
  {
    id: "cust6",
    name: "Beacon Studios",
    contact: "Iris Wong · Founder",
    avatar: "BS",
    accent: "#3bd4cb",
    status: "Lead",
    tier: "Startup",
    seats: 9,
    value: "$12k",
    lastTouch: "8d ago",
    nextAction: "Qualify budget",
    due: "Next week",
    overdue: false,
    tags: ["Inbound"],
  },
];

// Seed conversation shown on Home. The first assistant message is "rich":
// it carries a `deal` context card and `signals` (rendered specially). Live
// replies from api.sendChatMessage are plain `text`.
export const mockChatSeed = [
  {
    id: "msg-seed-user",
    role: "user",
    text: "How do I win the Greenleaf deal?",
  },
  {
    id: "msg-seed-assistant",
    role: "assistant",
    intro:
      "Based on the deal details, here's a targeted strategy to win the Greenleaf deal:",
    heading: "Strategy to win Greenleaf",
    deal: {
      title: "Greenleaf Intro",
      when: "Dec 12, 10:40 – 11:32 AM",
      comments: 3,
      attachments: 2,
      docs: 2,
      recorded: "48m",
      attendees: ["You", "A"],
    },
    signalsTitle: "Key opportunity signals:",
    signals: [
      { label: "Large startup deal", text: "52 seats across a global AI startup." },
      {
        label: "Active migration intent",
        text: "Considering a move from their current stack due to dissatisfaction with product value and service.",
      },
      {
        label: "Strong ICP fit",
        text: "Growing technology company with 80+ employees, engaged buyers in growth and sales.",
      },
      {
        label: "Recent engagement",
        text: "Re-opened the proposal twice this week after our last outreach.",
      },
    ],
  },
];

// Suggested prompts surfaced under the composer on an empty/fresh chat.
export const mockChatSuggestions = [
  "How can I get my client to buy the better product?",
  "Draft a follow-up email for Greenleaf",
  "Which deals are at risk of going quiet?",
  "Summarize the Greenleaf intro call",
];

// Agent Hub — autonomous sales agents that work the book.
export const mockAgentHub = [
  {
    id: "agt1",
    name: "Deal Coach",
    description:
      "Reads call notes and deal context, then recommends the next best move to advance the deal.",
    status: "running",
    model: "claude-opus-4-8",
    runs: 132,
    category: "Strategy",
  },
  {
    id: "agt2",
    name: "Outreach Writer",
    description:
      "Drafts personalized follow-up emails and call scripts that respect each client's tone.",
    status: "idle",
    model: "claude-sonnet-4-6",
    runs: 318,
    category: "Messaging",
  },
  {
    id: "agt3",
    name: "Quiet-Client Watcher",
    description:
      "Flags any customer not touched in N days so deals never quietly go cold.",
    status: "running",
    model: "claude-haiku-4-5",
    runs: 540,
    category: "Re-engagement",
  },
  {
    id: "agt4",
    name: "Renewal Radar",
    description:
      "Tracks upcoming renewals and premium dates, surfacing them before they slip.",
    status: "idle",
    model: "claude-sonnet-4-6",
    runs: 96,
    category: "Lifecycle",
  },
  {
    id: "agt5",
    name: "Upsell Scout",
    description:
      "Spots expansion signals in usage and conversation and proposes the right upgrade play.",
    status: "idle",
    model: "claude-opus-4-8",
    runs: 71,
    category: "Expansion",
  },
  {
    id: "agt6",
    name: "Brief Builder",
    description:
      "Assembles a pre-meeting brief with talking points, sensitivities, and open commitments.",
    status: "running",
    model: "claude-haiku-4-5",
    runs: 204,
    category: "Prep",
  },
];

// Mock "LLM" for Home. Picks a customer the question mentions (defaults to the
// top deal) and returns a believable, context-aware strategy reply. Swap for a
// real model call behind api.sendChatMessage when a backend exists.
export function mockAssistantReply(question = "") {
  const q = question.toLowerCase();
  const match = mockCustomers.find((c) => q.includes(c.name.toLowerCase()));
  const who = match ? match.name : "Greenleaf";
  const contact = (match ? match.contact : mockCustomers[0].contact).split(" · ")[0];

  const text = [
    `Here's how I'd move ${who} toward the better-fit tier:`,
    "",
    `1. Anchor on their pain, not the feature list. ${contact} flagged dissatisfaction with product value and service on the last call — frame the upgrade as the fix for that, not as "more product."`,
    "",
    "2. Quantify the upside. Tie the higher tier to a number they already care about: seats activated, time saved per rep, or revenue influenced. A one-line ROI beats a feature grid.",
    "",
    "3. De-risk the switch. Offer a short pilot or a migration-assist so the bigger commitment feels reversible. Reference how a similar account ramped in under 2 weeks.",
    "",
    `4. Make the next step tiny. Propose a 20-min working session with ${contact} and one champion to map the rollout — easier to say yes to than a full proposal review.`,
  ].join("\n");

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    text,
  };
}
