// One API for the whole app. It returns mock data until Supabase env vars
// are set, then transparently reads from Supabase instead. Components never
// need to know which mode they're in — they just `await` these functions.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  mockUsers,
  mockCurrentUser,
  mockBadges,
  mockQuests,
  mockAgents,
  mockMcpServers,
  mockAgentLog,
  mockCustomers,
  mockChatSeed,
  mockChatSuggestions,
  mockAgentHub,
  mockAssistantReply,
} from "@/data/mock";

// Simulate network latency so loading states are real during the demo.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const dataMode = isSupabaseConfigured ? "supabase" : "mock";

async function fromTable(table, mockValue, orderBy) {
  if (!isSupabaseConfigured) {
    await delay();
    return mockValue;
  }
  let query = supabase.from(table).select("*");
  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Like fromTable, but for brand-new features whose Supabase table may not
// exist yet. Tries the table; on any error (or empty result) it falls back to
// mock data so the demo never breaks. Drop the table in and it swaps over.
async function fromTableOrMock(table, mockValue) {
  if (!isSupabaseConfigured) {
    await delay();
    return mockValue;
  }
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error || !data?.length) return mockValue;
    return data;
  } catch {
    return mockValue;
  }
}

function normalizeCustomerRecord(customer) {
  return {
    ...customer,
    lastTouch: customer.lastTouch ?? customer.last_touch,
    nextAction: customer.nextAction ?? customer.next_action,
    tags: customer.tags ?? [],
  };
}

export const api = {
  getCurrentUser: async () => {
    if (!isSupabaseConfigured) {
      await delay();
      return mockCurrentUser;
    }
    const { data } = await supabase.auth.getUser();
    return data?.user ?? mockCurrentUser;
  },

  getLeaderboard: () =>
    fromTable("users", [...mockUsers].sort((a, b) => b.points - a.points), {
      column: "points",
      ascending: false,
    }),

  getBadges: () => fromTable("badges", mockBadges),

  getQuests: () => fromTable("quests", mockQuests),

  getAgents: () => fromTable("agents", mockAgents),

  getMcpServers: () => fromTable("mcp_servers", mockMcpServers),

  getAgentLog: () => fromTable("agent_runs", mockAgentLog),

  // --- Sales workspace ---------------------------------------------------

  getCustomers: async () => {
    const rows = await fromTable("customers", mockCustomers, { column: "name" });
    return rows.map(normalizeCustomerRecord);
  },

  getAgentHub: () => fromTableOrMock("agent_hub", mockAgentHub),

  // Home chat seed + suggested prompts (presentational — always mock).
  getChatSeed: async () => {
    await delay();
    return { messages: mockChatSeed, suggestions: mockChatSuggestions };
  },

  // The assistant. The live home is a Supabase Edge Function (where the
  // DeepSeek key lives server-side). Until it exists, fall back to a
  // context-aware canned reply so the demo always responds.
  sendChatMessage: async ({ text }) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { text },
        });
        if (!error && data) return data;
      } catch {
        /* fall through to mock reply */
      }
    }
    await delay(700);
    return mockAssistantReply(text);
  },

  // Example write — mock mode just echoes; Supabase mode persists.
  awardPoints: async (userId, points) => {
    if (!isSupabaseConfigured) {
      await delay();
      return { userId, points, mocked: true };
    }
    const { data, error } = await supabase.rpc("award_points", {
      p_user_id: userId,
      p_points: points,
    });
    if (error) throw error;
    return data;
  },
};
