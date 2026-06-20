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

export const mockConnectors = [
  {
    id: "atlassian",
    name: "Atlassian",
    description: "Connect to Confluence and Jira to search, summarize, and perform project actions.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/atlassian.com.png",
    featured: true,
    connected: false,
    tools: 14,
    category: "Project management",
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description: "Explore BigQuery datasets and tables, run SQL queries, and analyze your data.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/bigquery.googleapis.com.svg",
    featured: true,
    connected: false,
    tools: 8,
    category: "Data",
  },
  {
    id: "box",
    name: "Box",
    description: "Search, analyze, and get insights from your files in Box.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/box.com.png",
    featured: true,
    connected: false,
    tools: 6,
    category: "Files",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Search repositories, review issues, and manage pull requests in GitHub.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/githubcopilot.com.png",
    featured: true,
    connected: true,
    tools: 42,
    category: "Developer tools",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Include your email in your chats.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/mail.google.com.svg",
    featured: true,
    connected: false,
    tools: 5,
    category: "Email",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Include your calendar in your chats.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/calendar.google.com.svg",
    featured: true,
    connected: false,
    tools: 4,
    category: "Calendar",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Include your team's files in your chats.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/drive.google.com.svg",
    featured: true,
    connected: true,
    tools: 9,
    category: "Files",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Search, summarize, and manage issues, projects, and cycles.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/linear.app.png",
    featured: true,
    connected: false,
    tools: 12,
    category: "Project management",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Search, summarize, and author content across your workspace.",
    iconUrl: "https://static-assets.mistral.ai/integrations/notion_logo.png",
    featured: true,
    connected: false,
    tools: 10,
    category: "Knowledge base",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Read and send emails with Outlook.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/outlook.png",
    featured: true,
    connected: false,
    tools: 7,
    category: "Email",
  },
  {
    id: "outlook-calendar",
    name: "Outlook Calendar",
    description: "Manage your Outlook Calendar from agent workflows.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/outlook-calendar.png",
    featured: true,
    connected: false,
    tools: 4,
    category: "Calendar",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    description: "Include your team's files in your chats.",
    iconUrl: "https://static-assets.mistral.ai/integrations/sharepoint_logo.png",
    featured: true,
    connected: false,
    tools: 8,
    category: "Files",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Search messages, read channels, and summarize team discussions.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/slack.com.png",
    featured: true,
    connected: false,
    tools: 11,
    category: "Messaging",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Access and manage payments, customers, invoices, and subscriptions.",
    iconUrl: "https://static-assets.mistralai.com/integrations/icons/stripe.com.png",
    featured: true,
    connected: false,
    tools: 13,
    category: "Finance",
  },
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

// Customer rows and customer memory are database-owned. Seed the AAG client
// dataset through supabase/schema.sql and supabase/customer_memories.sql.
export const mockCustomers = [];
export const mockCustomerMemories = [];

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

// Workflows — advisor-built automation diagrams. Each is a linear chain of
// blocks; `type` maps to src/features/workflows/blockTypes.js. The first block
// is always the trigger. Edited locally in the builder (persistence deferred).
export const mockWorkflows = [
  {
    id: "wf-intro-email",
    name: "Build account brief & draft intro email",
    description:
      "When a deal moves to In Progress, an AI agent researches the account and drafts a personalized intro email for the AE.",
    status: "draft",
    blocks: [
      {
        id: "blk-intro-1",
        type: "record-updated",
        description: "When a deal's stage is updated",
        config: { object: "Deals", attribute: "Deal stage" },
      },
      {
        id: "blk-intro-2",
        type: "filter",
        description: "Only continue if deal moved to In Progress",
        config: { attribute: "Deal stage", operator: "is", value: "In Progress" },
      },
      {
        id: "blk-intro-3",
        type: "web-agent",
        description: "Research the associated company",
        config: {
          prompt:
            "Research the deal's company: core product & value prop, recent news/funding, competitive landscape, and likely pain points our solution addresses.",
          model: "claude-opus-4-8",
        },
      },
      {
        id: "blk-intro-4",
        type: "custom-agent",
        description: "Draft personalized intro email",
        config: {
          instructions:
            "Using the research, draft a 3-paragraph personalized intro email the AE can send. Warm, specific, no fluff.",
          model: "claude-opus-4-8",
          output: "Email draft",
        },
      },
      {
        id: "blk-intro-5",
        type: "create-task",
        description: "Create task for AE with research + draft",
        config: { title: "Review & send intro email", assignee: "Deal owner", due: "1 day" },
      },
    ],
  },
  {
    id: "wf-quiet-deals",
    name: "Re-engage quiet deals",
    description:
      "Every weekday, find deals untouched for two weeks and draft a re-engagement nudge for the owner.",
    status: "live",
    blocks: [
      {
        id: "blk-quiet-1",
        type: "schedule",
        description: "Every weekday at 9am",
        config: { frequency: "Every weekday", time: "9:00 AM" },
      },
      {
        id: "blk-quiet-2",
        type: "filter",
        description: "No touch in 14 days",
        config: { attribute: "Status", operator: "is", value: "Open" },
      },
      {
        id: "blk-quiet-3",
        type: "custom-agent",
        description: "Draft a re-engagement message",
        config: {
          instructions: "Draft a short, friendly check-in referencing the last conversation.",
          model: "claude-sonnet-4-6",
          output: "Email draft",
        },
      },
      {
        id: "blk-quiet-4",
        type: "create-task",
        description: "Task the owner to follow up",
        config: { title: "Follow up — deal going quiet", assignee: "Deal owner", due: "Today" },
      },
    ],
  },
  {
    id: "wf-tag-enterprise",
    name: "Flag enterprise deals",
    description: "Tag large deals and notify the team so they get the right attention.",
    status: "draft",
    blocks: [
      {
        id: "blk-tag-1",
        type: "record-updated",
        description: "When deal amount changes",
        config: { object: "Deals", attribute: "Amount" },
      },
      {
        id: "blk-tag-2",
        type: "filter",
        description: "Amount over $100k",
        config: { attribute: "Amount", operator: "is greater than", value: "100000" },
      },
      {
        id: "blk-tag-3",
        type: "create-task",
        description: "Loop in a sales lead",
        config: { title: "Review enterprise deal", assignee: "Round robin", due: "1 day" },
      },
    ],
  },
];

// Mock "LLM" for Home. Picks a customer the question mentions (defaults to the
// top deal) and returns a believable, context-aware strategy reply. Swap for a
// real model call behind api.sendChatMessage when a backend exists.
export function mockAssistantReply(question = "") {
  const q = question.toLowerCase();
  const match = mockCustomers.find((c) => q.includes(c.name.toLowerCase()));
  const who = match ? match.name : "Greenleaf";
  const contact = (match?.contact ?? "Maya Chen · VP Sales").split(" · ")[0];

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
