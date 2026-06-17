// Mock data — the single source of truth before the backend exists.
// Mirror these shapes in supabase/schema.sql so swapping is seamless.

export const mockUsers = [
  { id: "u1", name: "Ada Lovelace", avatar: "AL", points: 1280, level: 7, streak: 12 },
  { id: "u2", name: "Alan Turing", avatar: "AT", points: 1140, level: 6, streak: 5 },
  { id: "u3", name: "Grace Hopper", avatar: "GH", points: 980, level: 6, streak: 9 },
  { id: "u4", name: "Linus Torvalds", avatar: "LT", points: 720, level: 4, streak: 2 },
  { id: "u5", name: "Margaret Hamilton", avatar: "MH", points: 650, level: 4, streak: 7 },
  { id: "u6", name: "Adrian", avatar: "AD", points: 590, level: 3, streak: 4 },
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

export const mockAdrianBadges = [
  { id: "ab1", name: "Early Bird", icon: "Sunrise", description: "Logged in before 7 AM", earned: true },
  { id: "ab2", name: "Quick Starter", icon: "Zap", description: "Completed first quest within an hour", earned: true },
  { id: "ab3", name: "Curious Mind", icon: "Search", description: "Explored all 4 app sections", earned: true },
  { id: "ab4", name: "Streak Starter", icon: "Flame", description: "3-day login streak", earned: true },
  { id: "ab5", name: "Team Player", icon: "Users", description: "Competed in leaderboard top 10", earned: false },
  { id: "ab6", name: "Power User", icon: "Star", description: "Reached level 5", earned: false },
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
