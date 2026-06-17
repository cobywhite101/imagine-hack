// One API for the whole app. It returns mock data until Supabase env vars
// are set, then transparently reads from Supabase instead. Components never
// need to know which mode they're in — they just `await` these functions.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  mockUsers,
  mockCurrentUser,
  mockBadges,
  mockAdrianBadges,
  mockQuests,
  mockAgents,
  mockMcpServers,
  mockAgentLog,
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

  getAdrianBadges: () => fromTable("badges_adrian", mockAdrianBadges),

  getQuests: () => fromTable("quests", mockQuests),

  getAgents: () => fromTable("agents", mockAgents),

  getMcpServers: () => fromTable("mcp_servers", mockMcpServers),

  getAgentLog: () => fromTable("agent_runs", mockAgentLog),

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
