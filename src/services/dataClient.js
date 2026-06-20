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
  mockConnectors,
  mockAgentLog,
  mockCustomers,
  mockCustomerMemories,
  mockChatSeed,
  mockChatSuggestions,
  mockAgentHub,
  mockWorkflows,
  mockAssistantReply,
} from "@/data/mock";

// Simulate network latency so loading states are real during the demo.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const dataMode = isSupabaseConfigured ? "supabase" : "mock";
const CUSTOMER_MEMORY_KEY = "client-companion-memory-v1";
const useSupabaseCustomerMemory =
  isSupabaseConfigured && import.meta.env.VITE_ENABLE_SUPABASE_MEMORY === "true";
const useSupabaseCustomerChat =
  isSupabaseConfigured && import.meta.env.VITE_ENABLE_CUSTOMER_CHAT_FUNCTION === "true";
const CUSTOMER_CHAT_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "client",
  "customer",
  "from",
  "have",
  "into",
  "next",
  "that",
  "their",
  "there",
  "this",
  "with",
  "would",
  "when",
  "what",
  "where",
]);

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
  const mockCustomer = mockCustomers.find((item) => String(item.id) === String(customer.id));
  const name = customer.name ?? customer.company ?? "Unnamed customer";

  return {
    ...mockCustomer,
    ...customer,
    name,
    lastTouch: customer.lastTouch ?? customer.last_touch ?? mockCustomer?.lastTouch,
    nextAction: customer.nextAction ?? customer.next_action ?? mockCustomer?.nextAction,
    task: customer.task ?? customer.nextAction ?? customer.next_action ?? mockCustomer?.task ?? mockCustomer?.nextAction ?? "",
    avatar: customer.avatar ?? mockCustomer?.avatar ?? getInitials(name),
    accent: customer.accent ?? mockCustomer?.accent ?? "#868e96",
    email: customer.email ?? mockCustomer?.email ?? customer.contact ?? "",
    phone: customer.phone ?? mockCustomer?.phone ?? "",
    tags: customer.tags ?? mockCustomer?.tags ?? [],
  };
}

function getStoredCustomerMemories(customerId) {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_MEMORY_KEY) ?? "{}");
    return stored[String(customerId)] ?? [];
  } catch {
    return [];
  }
}

function setStoredCustomerMemories(customerId, memories) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_MEMORY_KEY) ?? "{}");
    stored[String(customerId)] = memories;
    window.localStorage.setItem(CUSTOMER_MEMORY_KEY, JSON.stringify(stored));
  } catch {
    /* local persistence is best-effort for the demo */
  }
}

function normalizeCustomerMemory(memory) {
  return {
    id: memory.id,
    customerId: memory.customerId ?? memory.customer_id,
    kind: memory.kind ?? "note",
    title: memory.title ?? "Client memory",
    summary: memory.summary ?? "",
    sourceName: memory.sourceName ?? memory.source_name ?? "",
    sourceMeta: memory.sourceMeta ?? memory.source_meta ?? "",
    createdAt: memory.createdAt ?? memory.created_at ?? new Date().toISOString(),
  };
}

function cleanCustomerText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function getCustomerSearchTerms(text) {
  return cleanCustomerText(text)
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g)
    ?.filter((word) => !CUSTOMER_CHAT_STOP_WORDS.has(word)) ?? [];
}

function getMockCustomerMemories(customerId) {
  return mockCustomerMemories
    .filter((memory) => String(memory.customerId) === String(customerId))
    .map(normalizeCustomerMemory);
}

function getAllLocalCustomerMemories(customerId) {
  const stored = getStoredCustomerMemories(customerId).map(normalizeCustomerMemory);
  const storedIds = new Set(stored.map((memory) => memory.id));
  const seeded = getMockCustomerMemories(customerId).filter((memory) => !storedIds.has(memory.id));

  return [...stored, ...seeded].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function rankCustomerMemories(question, memories) {
  const terms = getCustomerSearchTerms(question);
  if (!terms.length) return memories.slice(0, 3).map((memory) => ({ memory, score: 1 }));

  return memories
    .map((memory) => {
      const haystack = `${memory.title} ${memory.summary} ${memory.sourceName} ${memory.sourceMeta}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.memory.createdAt) - new Date(a.memory.createdAt));
}

function formatCustomerSource(memory) {
  return `${memory.sourceName || memory.title}${memory.createdAt ? `, ${new Date(memory.createdAt).toLocaleDateString()}` : ""}`;
}

function buildCustomerDraft(customer, memories) {
  const topMemories = memories.slice(0, 2);
  const contextLines = topMemories.length
    ? topMemories.map((memory) => `- ${memory.summary}`).join("\n")
    : `- Current next step: ${customer.task || customer.nextAction || "confirm the next action"}.`;

  return [
    `Subject: Next step for ${customer.name}`,
    "",
    `Hi ${customer.contact?.split(" · ")[0] || customer.name},`,
    "",
    "Quick recap from our latest notes:",
    contextLines,
    "",
    `Recommended next step: ${customer.task || customer.nextAction || "confirm the next action and timing"}.`,
    "",
    "Would you be open to a short follow-up this week so we can close the loop and agree the next checkpoint?",
  ].join("\n");
}

function buildLocalCustomerChatReply({ customer, text, memories }) {
  const ranked = rankCustomerMemories(text, memories);
  const lower = text.toLowerCase();
  const wantsDraft = /\b(draft|email|follow[- ]?up|reply|message)\b/.test(lower);
  const wantsPlan = /\b(plan|recap|summary|risk|renew|next|prepare|strategy)\b/.test(lower);

  if (wantsDraft) {
    const draft = buildCustomerDraft(customer, ranked.map((item) => item.memory));
    const sources = ranked.slice(0, 2).map((item) => formatCustomerSource(item.memory)).join("; ");

    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: `${draft}\n\nSources: ${sources || "customer record"}`,
    };
  }

  if (!ranked.length && !wantsPlan) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: `I don't know from ${customer.name}'s saved record yet. Add a note or upload meeting minutes, then ask again and I can answer with a source.`,
    };
  }

  const relevant = ranked.slice(0, 3).map((item) => item.memory);
  const sourceLines = relevant.length
    ? relevant.map((memory) => `- ${memory.summary} (${formatCustomerSource(memory)})`).join("\n")
    : `- ${customer.task || customer.nextAction || "No next step recorded"} (customer record)`;

  return {
    id: `a-${Date.now()}`,
    role: "assistant",
    text: [
      `Answer for ${customer.name}:`,
      "",
      sourceLines,
      "",
      `Recommended action: ${customer.task || customer.nextAction || "confirm the next touchpoint and update the client record"}.`,
    ].join("\n"),
  };
}

function getInitials(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "NC";
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

  getConnectors: async () => {
    if (!isSupabaseConfigured) {
      await delay();
      return mockConnectors;
    }

    try {
      const { data, error } = await supabase.from("mcp_servers").select("name, connected");
      if (error) return mockConnectors;

      const liveStateByName = new Map(
        (data ?? []).map((server) => [server.name?.toLowerCase(), server.connected])
      );

      return mockConnectors.map((connector) => {
        const liveConnected = liveStateByName.get(connector.name.toLowerCase());
        return liveConnected === undefined ? connector : { ...connector, connected: liveConnected };
      });
    } catch {
      return mockConnectors;
    }
  },

  getAgentLog: () => fromTable("agent_runs", mockAgentLog),

  // --- Sales workspace ---------------------------------------------------

  getCustomers: async () => {
    const rows = await fromTable("customers", mockCustomers, { column: "name" });
    return rows.map(normalizeCustomerRecord);
  },

  getCustomerById: async (customerId) => {
    if (!customerId) return null;

    if (!isSupabaseConfigured) {
      await delay();
      const customer = mockCustomers.find((item) => String(item.id) === String(customerId));
      return customer ? normalizeCustomerRecord(customer) : null;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeCustomerRecord(data) : null;
  },

  getCustomerMemories: async (customerId) => {
    if (!customerId) return [];

    if (useSupabaseCustomerMemory) {
      try {
        const { data, error } = await supabase
          .from("customer_memories")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (!error) return (data ?? []).map(normalizeCustomerMemory);
      } catch {
        /* fall through to local demo memory */
      }
    }

    await delay(120);
    return getAllLocalCustomerMemories(customerId);
  },

  saveCustomerMemory: async (customerId, memory) => {
    const entry = normalizeCustomerMemory({
      ...memory,
      customerId,
      createdAt: memory.createdAt ?? new Date().toISOString(),
    });

    if (useSupabaseCustomerMemory) {
      try {
        const { data, error } = await supabase
          .from("customer_memories")
          .insert({
            id: entry.id,
            customer_id: customerId,
            kind: entry.kind,
            title: entry.title,
            summary: entry.summary,
            source_name: entry.sourceName,
            source_meta: entry.sourceMeta,
            created_at: entry.createdAt,
          })
          .select("*")
          .single();

        if (!error && data) return normalizeCustomerMemory(data);
      } catch {
        /* fall through to local demo memory */
      }
    }

    const existing = getStoredCustomerMemories(customerId).filter((item) => item.id !== entry.id);
    setStoredCustomerMemories(customerId, [entry, ...existing]);
    await delay(120);
    return entry;
  },

  sendCustomerMessage: async ({ customer, text, memories = [] }) => {
    if (!customer || !text?.trim()) return null;

    if (useSupabaseCustomerChat) {
      try {
        const { data, error } = await supabase.functions.invoke("customer-chat", {
          body: { customer, text, memories },
        });
        if (!error && data?.message) return data.message;
        if (!error && data?.text) return data;
      } catch {
        /* fall through to local grounded reply */
      }
    }

    await delay(450);
    return buildLocalCustomerChatReply({ customer, text, memories });
  },

  draftCustomerFollowUp: async ({ customer, memories = [] }) => {
    if (!customer) return null;
    const text = `Draft a follow-up email for ${customer.name} using the latest saved memory and next step.`;
    return api.sendCustomerMessage({ customer, text, memories });
  },

  getAgentHub: () => fromTableOrMock("agent_hub", mockAgentHub),

  getWorkflows: () => fromTableOrMock("workflows", mockWorkflows),

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
