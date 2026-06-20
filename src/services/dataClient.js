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
  mockWorkflowConfig,
  mockAssistantReply,
} from "@/data/mock";

// Simulate network latency so loading states are real during the demo.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const dataMode = isSupabaseConfigured ? "supabase" : "mock";
const WORKFLOW_CONFIG_KEY = "client-companion-workflow-v1";
const CUSTOMER_ARTICLES_KEY = "client-companion-articles-v1";
const useSupabaseCustomerMemory = isSupabaseConfigured;
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
const localCustomers = mockCustomers;
const localCustomerMemories = mockCustomerMemories;
const CUSTOMER_ACCENTS = ["#3bd4cb", "#317cff", "#e64980", "#4991e5", "#9b69ff", "#7048e8", "#22b8cf", "#2f9e44"];
const FALLBACK_CUSTOMER_ACCENT = "#868e96";

function getCustomerAccent(customer) {
  if (customer.accent && customer.accent !== FALLBACK_CUSTOMER_ACCENT) return customer.accent;
  const key = String(customer.id ?? customer.name ?? customer.company ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CUSTOMER_ACCENTS[hash % CUSTOMER_ACCENTS.length];
}

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
  const mockCustomer = localCustomers.find((item) => String(item.id) === String(customer.id));
  const name = customer.name ?? customer.company ?? "Unnamed customer";

  return {
    ...mockCustomer,
    ...customer,
    name,
    lastTouch: customer.lastTouch ?? customer.last_touch ?? mockCustomer?.lastTouch,
    nextAction: customer.nextAction ?? customer.next_action ?? mockCustomer?.nextAction,
    task: customer.task ?? customer.nextAction ?? customer.next_action ?? mockCustomer?.task ?? mockCustomer?.nextAction ?? "",
    avatar: customer.avatar ?? mockCustomer?.avatar ?? getInitials(name),
    accent: getCustomerAccent({ ...customer, accent: customer.accent ?? mockCustomer?.accent }),
    email: customer.email ?? mockCustomer?.email ?? customer.contact ?? "",
    phone: customer.phone ?? mockCustomer?.phone ?? "",
    tags: customer.tags ?? mockCustomer?.tags ?? [],
    contactName: customer.contactName ?? customer.contact_name ?? mockCustomer?.contactName ?? name,
    occupation: customer.occupation ?? mockCustomer?.occupation ?? "",
    dateOfBirth: customer.dateOfBirth ?? customer.date_of_birth ?? mockCustomer?.dateOfBirth ?? "",
    maritalStatus: customer.maritalStatus ?? customer.marital_status ?? mockCustomer?.maritalStatus ?? "",
    gender: customer.gender ?? mockCustomer?.gender ?? "",
    dependents: customer.dependents ?? customer.number_of_dependents ?? mockCustomer?.dependents,
    annualIncomeBracket:
      customer.annualIncomeBracket ?? customer.annual_income_bracket ?? mockCustomer?.annualIncomeBracket ?? "",
    netWorthBracket: customer.netWorthBracket ?? customer.net_worth_bracket ?? mockCustomer?.netWorthBracket ?? "",
    riskTolerance: customer.riskTolerance ?? customer.risk_tolerance ?? mockCustomer?.riskTolerance ?? "",
    investmentHorizonYears:
      customer.investmentHorizonYears ??
      customer.investment_horizon_years ??
      mockCustomer?.investmentHorizonYears,
    liabilitiesSummary: customer.liabilitiesSummary ?? customer.liabilities_summary ?? mockCustomer?.liabilitiesSummary ?? "",
    policyCount: customer.policyCount ?? customer.policy_count ?? mockCustomer?.policyCount,
    policySummary: customer.policySummary ?? customer.policy_summary ?? mockCustomer?.policySummary ?? "",
    policies: customer.policies ?? mockCustomer?.policies ?? [],
    familyMembers: customer.familyMembers ?? customer.family_members ?? mockCustomer?.familyMembers ?? [],
    nextRenewal: customer.nextRenewal ?? customer.next_renewal ?? mockCustomer?.nextRenewal ?? "",
    nextRenewalPolicyType:
      customer.nextRenewalPolicyType ?? customer.next_renewal_policy_type ?? mockCustomer?.nextRenewalPolicyType ?? "",
    estatePlanStatus:
      customer.estatePlanStatus ?? customer.estate_plan_status ?? mockCustomer?.estatePlanStatus ?? "",
    hasWill: customer.hasWill ?? customer.has_will ?? mockCustomer?.hasWill,
    businessOwnership:
      customer.businessOwnership ?? customer.business_ownership ?? mockCustomer?.businessOwnership,
    intendedHeirs: customer.intendedHeirs ?? customer.intended_heirs ?? mockCustomer?.intendedHeirs ?? "",
    lifeEvents: customer.lifeEvents ?? customer.life_events ?? mockCustomer?.lifeEvents ?? [],
    nextLifeEvent: customer.nextLifeEvent ?? customer.next_life_event ?? mockCustomer?.nextLifeEvent ?? "",
    nextLifeEventDate:
      customer.nextLifeEventDate ?? customer.next_life_event_date ?? mockCustomer?.nextLifeEventDate ?? "",
    lastContactDate: customer.lastContactDate ?? customer.last_contact_date ?? mockCustomer?.lastContactDate ?? "",
    preferredCommunicationChannel:
      customer.preferredCommunicationChannel ??
      customer.preferred_communication_channel ??
      mockCustomer?.preferredCommunicationChannel ??
      "",
    rapportNotes: customer.rapportNotes ?? customer.rapport_notes ?? mockCustomer?.rapportNotes ?? "",
    referredBy: customer.referredBy ?? customer.referred_by ?? mockCustomer?.referredBy ?? null,
    lastFactFindDate: customer.lastFactFindDate ?? customer.last_fact_find_date ?? mockCustomer?.lastFactFindDate ?? "",
    kycStatus: customer.kycStatus ?? customer.kyc_status ?? mockCustomer?.kycStatus ?? "",
    advisorId: customer.advisorId ?? customer.assigned_advisor_id ?? mockCustomer?.advisorId ?? "",
    clientSince: customer.clientSince ?? customer.client_since_date ?? mockCustomer?.clientSince ?? "",
    acquisitionChannel:
      customer.acquisitionChannel ?? customer.acquisition_channel ?? mockCustomer?.acquisitionChannel ?? "",
    createdAt: customer.createdAt ?? customer.created_at ?? mockCustomer?.createdAt,
    updatedAt: customer.updatedAt ?? customer.updated_at ?? mockCustomer?.updatedAt,
  };
}

function getStoredCustomerArticles(customerId) {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_ARTICLES_KEY) ?? "{}");
    return stored[String(customerId)] ?? [];
  } catch {
    return [];
  }
}

function setStoredCustomerArticles(customerId, articles) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_ARTICLES_KEY) ?? "{}");
    stored[String(customerId)] = articles;
    window.localStorage.setItem(CUSTOMER_ARTICLES_KEY, JSON.stringify(stored));
  } catch {
    /* local persistence is best-effort for the demo */
  }
}

function normalizeWorkflowConfig(config) {
  return {
    instructions: config?.instructions ?? mockWorkflowConfig.instructions,
    notes: config?.notes ?? mockWorkflowConfig.notes,
    guardrails: config?.guardrails ?? mockWorkflowConfig.guardrails,
    tone: config?.tone ?? mockWorkflowConfig.tone,
    knowledge: { ...mockWorkflowConfig.knowledge, ...(config?.knowledge ?? {}) },
    tools: { ...mockWorkflowConfig.tools, ...(config?.tools ?? {}) },
  };
}

function getStoredWorkflowConfig(customerId) {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(WORKFLOW_CONFIG_KEY) ?? "{}");
    return stored[String(customerId)] ?? null;
  } catch {
    return null;
  }
}

function setStoredWorkflowConfig(customerId, config) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(WORKFLOW_CONFIG_KEY) ?? "{}");
    stored[String(customerId)] = config;
    window.localStorage.setItem(WORKFLOW_CONFIG_KEY, JSON.stringify(stored));
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
    body: memory.body ?? "",
    sourceName: memory.sourceName ?? memory.source_name ?? "",
    sourceMeta: memory.sourceMeta ?? memory.source_meta ?? "",
    createdAt: memory.createdAt ?? memory.created_at ?? new Date().toISOString(),
  };
}

function normalizeCustomerArticle(article) {
  const createdAt = article?.createdAt ?? article?.created_at ?? new Date().toISOString();
  const updatedAt = article?.updatedAt ?? article?.updated_at ?? createdAt;

  return {
    id: article?.id,
    customerId: article?.customerId ?? article?.customer_id,
    title: article?.title?.trim() || "Untitled internal article",
    subtitle: article?.subtitle ?? article?.sourceName ?? article?.source_name ?? "",
    type: article?.type ?? article?.article_type ?? "Internal article",
    body: article?.body ?? "",
    sourceMemoryId: article?.sourceMemoryId ?? article?.source_memory_id ?? null,
    sourceName: article?.sourceName ?? article?.source_name ?? "",
    createdAt,
    updatedAt,
  };
}

function cleanCustomerText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function truncateCustomerText(text, maxLength = 6000) {
  const value = String(text ?? "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function escapeArticleHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToArticleHtml(text) {
  const paragraphs = String(text ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) return "";

  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
      const isList = lines.length > 1 && lines.every((line) => /^[-*•]\s+/.test(line));
      if (isList) {
        return `<ul>${lines
          .map((line) => `<li>${escapeArticleHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${escapeArticleHtml(paragraph).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function sanitizeArticleHtml(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .trim();
}

function parseArticleJson(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const candidates = [withoutFence];
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(withoutFence.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next candidate */
    }
  }

  return null;
}

function buildLocalArticleFromMemory({ customer, memory }) {
  const sourceText = memory?.body || memory?.summary || "";
  const sourceName = memory?.sourceName || memory?.title || "meeting minutes";
  const sentences =
    sourceText
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => cleanCustomerText(sentence))
      .filter(Boolean) ?? [];
  const highlights = sentences.slice(0, 5);
  const nextSteps = sentences.filter((sentence) => {
    const lower = sentence.toLowerCase();
    return /\b(action|next|follow|renew|schedule|need|risk|concern|deadline|ask)\b/.test(lower);
  }).slice(0, 5);

  const body = [
    `<p>Generated from ${escapeArticleHtml(sourceName)} for ${escapeArticleHtml(customer.name)}.</p>`,
    "<h2>Meeting recap</h2>",
    highlights.length
      ? `<ul>${highlights.map((sentence) => `<li>${escapeArticleHtml(sentence)}</li>`).join("")}</ul>`
      : textToArticleHtml(sourceText),
    "<h2>Recommended follow-up</h2>",
    nextSteps.length
      ? `<ul>${nextSteps.map((sentence) => `<li>${escapeArticleHtml(sentence)}</li>`).join("")}</ul>`
      : `<p>Confirm the next action with ${escapeArticleHtml(customer.contactName || customer.name)} and keep the advisor workflow updated.</p>`,
  ].join("");

  return normalizeCustomerArticle({
    title: `${customer.name} meeting article`,
    subtitle: sourceName,
    type: "Internal article",
    body,
    sourceMemoryId: memory?.id ?? null,
    sourceName,
  });
}

function getCustomerSearchTerms(text) {
  return cleanCustomerText(text)
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g)
    ?.filter((word) => !CUSTOMER_CHAT_STOP_WORDS.has(word)) ?? [];
}

function getMockCustomerMemories(customerId) {
  return localCustomerMemories
    .filter((memory) => String(memory.customerId) === String(customerId))
    .map(normalizeCustomerMemory);
}

function getAllLocalCustomerMemories(customerId) {
  return getMockCustomerMemories(customerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function rankCustomerMemories(question, memories) {
  const terms = getCustomerSearchTerms(question);
  if (!terms.length) return memories.slice(0, 3).map((memory) => ({ memory, score: 1 }));

  return memories
    .map((memory) => {
      const haystack = `${memory.title} ${memory.summary} ${memory.body} ${memory.sourceName} ${memory.sourceMeta}`.toLowerCase();
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
    `Hi ${customer.contactName || customer.name},`,
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

function buildLocalHomeChatReply(text) {
  const terms = getCustomerSearchTerms(text);
  const matches = localCustomers
    .map((customer) => {
      const memories = localCustomerMemories.filter((memory) => String(memory.customerId) === String(customer.id));
      const haystack = [
        customer.name,
        customer.occupation,
        customer.task,
        customer.preferredCommunicationChannel,
        customer.kycStatus,
        ...memories.flatMap((memory) => [memory.summary, memory.body]),
      ].join(" ").toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { customer, memories, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = matches[0] ?? (localCustomers[0] ? {
    customer: localCustomers[0],
    memories: localCustomerMemories.filter((memory) => String(memory.customerId) === String(localCustomers[0].id)),
    score: 0,
  } : null);

  if (!selected) return mockAssistantReply(text);

  const memory = selected.memories[0];
  const customer = selected.customer;
  const source = memory ? `\n\nMemory source: ${memory.sourceName} (${memory.sourceMeta}).` : "";

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    text: [
      `${customer.name}: ${memory?.summary || customer.task || "No saved memory yet."}`,
      "",
      `Next action: ${customer.task || customer.nextAction || "Confirm the next customer touchpoint"}.`,
      `Preferred channel: ${customer.preferredCommunicationChannel || "Not recorded"}.`,
      source,
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

async function queryDeepSeek(messages, systemPrompt = "", model = "deepseek-chat") {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("DeepSeek API key is not configured.");
    return null;
  }

  try {
    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: "system", content: systemPrompt });
    }

    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text || msg.content || "",
      });
    });

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek API responded with error status:", response.status);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Error querying DeepSeek API:", error);
    return null;
  }
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
    const rows = await fromTable("customers", localCustomers, { column: "name" });
    return rows.map(normalizeCustomerRecord);
  },

  getCustomerById: async (customerId) => {
    if (!customerId) return null;

    if (!isSupabaseConfigured) {
      await delay();
      const customer = localCustomers.find((item) => String(item.id) === String(customerId));
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

        if (error) throw error;
        return (data ?? []).map(normalizeCustomerMemory);
      } catch (error) {
        throw error;
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
            body: entry.body,
            source_name: entry.sourceName,
            source_meta: entry.sourceMeta,
            created_at: entry.createdAt,
          })
          .select("*")
          .single();

        if (error) throw error;
        if (!error && data) return normalizeCustomerMemory(data);
      } catch (error) {
        throw error;
      }
    }

    await delay(120);
    return entry;
  },

  getCustomerArticles: async (customerId) => {
    if (!customerId) return [];

    const formatCustomerProfileToArticleBody = (customer) => {
      if (!customer) return "";
      const lines = [];
      lines.push(`# Client Profile: ${customer.name}`);
      lines.push("");

      lines.push("## Demographics");
      if (customer.dateOfBirth) {
        const dob = new Date(customer.dateOfBirth);
        const age = new Date().getFullYear() - dob.getFullYear();
        lines.push(`- **Age**: ${age}`);
      }
      if (customer.maritalStatus) lines.push(`- **Marital Status**: ${customer.maritalStatus}`);
      if (customer.occupation) lines.push(`- **Occupation**: ${customer.occupation}`);
      lines.push("");

      lines.push("## Financial Profile");
      if (customer.annualIncomeBracket) lines.push(`- **Income**: ${customer.annualIncomeBracket}`);
      if (customer.netWorthBracket) lines.push(`- **Net Worth**: ${customer.netWorthBracket}`);
      if (customer.riskTolerance) lines.push(`- **Risk Tolerance**: ${customer.riskTolerance}`);
      if (customer.investmentHorizonYears) lines.push(`- **Investment Horizon**: ${customer.investmentHorizonYears} years`);
      lines.push("");

      lines.push("## Policies");
      const policies = Array.isArray(customer.policies) ? customer.policies : [];
      if (policies.length > 0) {
        policies.forEach((policy) => {
          const type = policy.policy_type ?? policy.policyType ?? policy.type ?? "Policy";
          const sum = policy.sum_assured ?? policy.sumAssured;
          const renewal = policy.renewal_date ?? policy.renewalDate;
          lines.push(`- **${type}**: Sum Assured: RM${sum ? Number(sum).toLocaleString() : "—"}, Renewal: ${renewal ?? "—"}`);
        });
      } else {
        lines.push("No active policies recorded.");
      }
      lines.push("");

      lines.push("## Life Events");
      const lifeEvents = Array.isArray(customer.lifeEvents) ? customer.lifeEvents : [];
      if (lifeEvents.length > 0) {
        lifeEvents.forEach((event) => {
          const title = event.description ?? event.title ?? event.event;
          const target = event.target_date ?? event.expectedDate ?? event.expected_date;
          lines.push(`- **${title}**: Expected: ${target ? new Date(target).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}`);
        });
      } else {
        lines.push("No upcoming life events recorded.");
      }
      lines.push("");

      lines.push("## Relationship & Preferences");
      if (customer.rapportNotes) lines.push(`- **Rapport Notes**: ${customer.rapportNotes}`);
      if (customer.preferredCommunicationChannel) lines.push(`- **Preferred Channel**: ${customer.preferredCommunicationChannel}`);
      if (customer.referredBy) lines.push(`- **Referred By**: ${customer.referredBy}`);
      if (customer.businessOwnership) lines.push("- **Business Owner**: Yes");
      lines.push("");

      lines.push("## Compliance");
      if (customer.kycStatus) lines.push(`- **KYC Status**: ${customer.kycStatus}`);
      if (customer.lastFactFindDate) lines.push(`- **Last Fact-Find**: ${customer.lastFactFindDate}`);
      if (customer.hasWill != null) lines.push(`- **Will in Place**: ${customer.hasWill ? "Yes" : "No"}`);
      if (customer.estatePlanStatus) lines.push(`- **Estate Plan Status**: ${customer.estatePlanStatus}`);

      return lines.join("\n");
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("customer_articles")
          .select("*")
          .eq("customer_id", customerId)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        if (data && data.length === 0) {
            const customer = localCustomers.find((item) => String(item.id) === String(customerId));
            if (customer) {
              const bodyText = formatCustomerProfileToArticleBody(customer);
              const initialArticle = {
                id: `profile-article-${customerId}`,
                customer_id: customerId,
                title: `${customer.name}'s Profile`,
                subtitle: "Client Profile & Financial Summary",
                article_type: "Internal article",
                body: bodyText,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              await supabase.from("customer_articles").insert({
                id: initialArticle.id,
                customer_id: customerId,
                title: initialArticle.title,
                subtitle: initialArticle.subtitle,
                article_type: initialArticle.article_type,
                body: initialArticle.body,
                created_at: initialArticle.created_at,
                updated_at: initialArticle.updated_at
              });
              return [normalizeCustomerArticle(initialArticle)];
            }
        }
        return (data ?? []).map(normalizeCustomerArticle);
      } catch (error) {
        throw error;
      }
    }

    const customer = localCustomers.find((item) => String(item.id) === String(customerId));
    let localArticles = getStoredCustomerArticles(customerId);
    if (localArticles.length === 0 && customer) {
      const bodyText = formatCustomerProfileToArticleBody(customer);
      const initialArticle = {
        id: `profile-article-${customerId}`,
        customerId,
        title: `${customer.name}'s Profile`,
        subtitle: "Client Profile & Financial Summary",
        type: "Internal article",
        body: bodyText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localArticles = [initialArticle];
      setStoredCustomerArticles(customerId, localArticles);
    }

    await delay(120);
    return localArticles
      .map(normalizeCustomerArticle)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  saveCustomerArticle: async (customerId, article) => {
    if (!customerId) return normalizeCustomerArticle(article);
    const now = new Date().toISOString();
    const entry = normalizeCustomerArticle({
      ...article,
      id: article?.id ?? `article-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      customerId,
      createdAt: article?.createdAt ?? now,
      updatedAt: now,
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("customer_articles")
          .upsert({
            id: entry.id,
            customer_id: customerId,
            title: entry.title,
            subtitle: entry.subtitle,
            article_type: entry.type,
            body: entry.body,
            source_memory_id: entry.sourceMemoryId,
            source_name: entry.sourceName,
            created_at: entry.createdAt,
            updated_at: entry.updatedAt,
          })
          .select("*")
          .single();

        if (error) throw error;
        if (data) return normalizeCustomerArticle(data);
      } catch (error) {
        throw error;
      }
    }

    const existing = getStoredCustomerArticles(customerId)
      .map(normalizeCustomerArticle)
      .filter((item) => item.id !== entry.id);
    const next = [entry, ...existing].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setStoredCustomerArticles(customerId, next);
    await delay(120);
    return entry;
  },

  deleteCustomerArticle: async (customerId, articleId) => {
    if (!customerId || !articleId) return false;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("customer_articles")
          .delete()
          .eq("id", articleId)
          .eq("customer_id", customerId);

        if (error) throw error;
        return true;
      } catch (error) {
        throw error;
      }
    }

    const existing = getStoredCustomerArticles(customerId)
      .map(normalizeCustomerArticle)
      .filter((item) => item.id !== articleId);
    setStoredCustomerArticles(customerId, existing);
    await delay(120);
    return true;
  },

  getWorkflowConfig: async (customerId) => {
    if (!customerId) return normalizeWorkflowConfig(null);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("workflow_configs")
          .select("config")
          .eq("customer_id", customerId)
          .maybeSingle();

        if (!error && data?.config) return normalizeWorkflowConfig(data.config);
      } catch {
        /* fall through to local demo config */
      }
    }

    await delay(120);
    return normalizeWorkflowConfig(getStoredWorkflowConfig(customerId));
  },

  saveWorkflowConfig: async (customerId, config) => {
    if (!customerId) return normalizeWorkflowConfig(config);
    const next = normalizeWorkflowConfig(config);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("workflow_configs")
          .upsert({ customer_id: customerId, config: next, updated_at: new Date().toISOString() });
        if (!error) return next;
      } catch {
        /* fall through to local demo config */
      }
    }

    setStoredWorkflowConfig(customerId, next);
    await delay(80);
    return next;
  },

  sendCustomerMessage: async ({ customer, text, memories = [], history = [], workflowConfig = null, model = "deepseek-chat" }) => {
    if (!customer || !text?.trim()) return null;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      const memoryString = memories.length > 0
        ? memories
            .map((m, idx) => {
              const body = truncateCustomerText(m.body, 5000);
              return [
                `[${idx + 1}] (${m.kind || "note"}): ${m.title || "Note"}`,
                `Summary: ${m.summary || m.text || ""}`,
                body ? `Source text: ${body}` : "",
              ].filter(Boolean).join("\n");
            })
            .join("\n\n")
        : "No saved memories.";

      const cfg = workflowConfig ? normalizeWorkflowConfig(workflowConfig) : null;
      const enabledKnowledge = cfg
        ? Object.entries(cfg.knowledge).filter(([, on]) => on).map(([name]) => name)
        : [];
      const enabledTools = cfg
        ? Object.entries(cfg.tools).filter(([, on]) => on).map(([name]) => name)
        : [];
      const workflowBlock = cfg
        ? `\n\nWorkflow configuration for this client record:
${cfg.instructions ? `\nWorkflow brief:\n${cfg.instructions}` : ""}${cfg.notes ? `\n\nNotes:\n${cfg.notes}` : ""}${cfg.guardrails ? `\n\nRules (must follow):\n${cfg.guardrails}` : ""}${cfg.tone ? `\n\nCommunication style: ${cfg.tone}` : ""}${enabledKnowledge.length ? `\n\nConnected knowledge sources: ${enabledKnowledge.join(", ")}.` : ""}${enabledTools.length ? `\nAvailable tools: ${enabledTools.join(", ")}.` : ""}`
        : "";

      const customerSystem = `You are a helpful, precise, and professional Client CRM Companion (Client OS Advisor).
You are helping the advisor work from a client record.${workflowBlock}

Current Client Context:
- Name: ${customer.name}
- Email: ${customer.email || "N/A"}
- Contact Person: ${customer.contactName || customer.name}
- Next Action/Task: ${customer.task || customer.nextAction || "None"}
- KYC Status: ${customer.kycStatus || "N/A"}
- Client Since: ${customer.clientSince || "N/A"}

Saved Memories (Notes, Meeting Summaries, Files):
${memoryString}

Respond to the Advisor's inquiry. Use the client's context and memories to ground your answer. When drafting emails or follow-ups, make them clear, warm, professional, and tailored. Keep responses concise, and format them nicely in markdown. Do not prefix the text with "Answer for ${customer.name}:" or similar boilerplate unless explicitly asked.`;

      const chatHistory = [...history];
      if (!chatHistory.some((h) => h.role === "user" && h.text === text)) {
        chatHistory.push({ role: "user", text });
      }

      const deepseekReply = await queryDeepSeek(chatHistory, customerSystem, model);
      if (deepseekReply) {
        return {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: deepseekReply,
        };
      }
    }

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

  draftCustomerFollowUp: async ({ customer, memories = [], workflowConfig = null, model }) => {
    if (!customer) return null;
    const text = `Draft a follow-up email for ${customer.name} using the latest saved memory and next step.`;
    return api.sendCustomerMessage({ customer, text, memories, history: [], workflowConfig, model });
  },

  generateCustomerArticle: async ({
    customer,
    memory,
    memories = [],
    workflowConfig = null,
    model = "deepseek-chat",
    instruction = "",
  }) => {
    if (!customer) return null;
    const source = memory ?? memories.find((item) => ["meeting", "file", "voice", "note"].includes(item.kind));
    if (!source) return null;

    const sourceMemory = normalizeCustomerMemory(source);
    const sourceText = truncateCustomerText(sourceMemory.body || sourceMemory.summary, 12000);
    if (!sourceText) return null;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      const cfg = workflowConfig ? normalizeWorkflowConfig(workflowConfig) : null;
      const workflowGuidance = cfg
        ? [
            cfg.instructions ? `Workflow brief:\n${cfg.instructions}` : "",
            cfg.notes ? `Notes:\n${cfg.notes}` : "",
            cfg.guardrails ? `Workflow rules:\n${cfg.guardrails}` : "",
            cfg.tone ? `Communication style: ${cfg.tone}` : "",
          ].filter(Boolean).join("\n\n")
        : "";

      const systemPrompt = `You convert advisor meeting minutes into a durable internal customer knowledge article.
Return only valid JSON with these fields:
{
  "title": "short specific article title",
  "subtitle": "source/date/context label",
  "body": "HTML article body using only h2, p, ul, li, strong, em, br"
}

Do not invent facts. Preserve commitments, dates, financial goals, risks, objections, family/context signals, and recommended next actions. Keep the article scannable for another advisor.`;

      const userPrompt = [
        `Customer: ${customer.name}`,
        `Contact: ${customer.contactName || customer.name}`,
        `Advisor next action: ${customer.task || customer.nextAction || "None recorded"}`,
        `Source: ${sourceMemory.sourceName || sourceMemory.title}`,
        instruction ? `Advisor request: ${instruction}` : "",
        workflowGuidance,
        "Meeting minutes / source text:",
        sourceText,
      ].filter(Boolean).join("\n\n");

      const reply = await queryDeepSeek([{ role: "user", text: userPrompt }], systemPrompt, model);
      const parsed = parseArticleJson(reply);

      if (parsed) {
        const parsedBody = String(parsed.body ?? parsed.bodyHtml ?? "");
        return normalizeCustomerArticle({
          title: parsed.title,
          subtitle: parsed.subtitle || sourceMemory.sourceName || sourceMemory.title,
          type: "Internal article",
          body: sanitizeArticleHtml(/<\w+/i.test(parsedBody) ? parsedBody : textToArticleHtml(parsedBody)),
          sourceMemoryId: sourceMemory.id,
          sourceName: sourceMemory.sourceName || sourceMemory.title,
        });
      }

      if (reply) {
        return normalizeCustomerArticle({
          title: `${customer.name} meeting article`,
          subtitle: sourceMemory.sourceName || sourceMemory.title,
          type: "Internal article",
          body: sanitizeArticleHtml(/<\w+/i.test(reply) ? reply : textToArticleHtml(reply)),
          sourceMemoryId: sourceMemory.id,
          sourceName: sourceMemory.sourceName || sourceMemory.title,
        });
      }
    }

    await delay(350);
    return buildLocalArticleFromMemory({ customer, memory: sourceMemory });
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
  sendChatMessage: async ({ text, history = [], model = "deepseek-chat" }) => {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      let crmContext = "";
      try {
        const customers = localCustomers || [];
        crmContext = `You are a helpful Client CRM assistant.
Here are the clients in the workspace:
${customers.map((c) => `- ${c.name} (Contact: ${c.contactName || c.contact || "N/A"}, Next Step: ${c.task || c.nextAction || "None"})`).join("\n")}`;
      } catch (e) {
        crmContext = "You are a helpful Client CRM assistant.";
      }

      const systemPrompt = `${crmContext}
Assist the user with CRM tasks, answering questions about clients, recommending follow-up templates, or explaining CRM strategies. Keep answers clear, direct, and formatted nicely in markdown.`;

      const chatHistory = [...history];
      if (!chatHistory.some((h) => h.role === "user" && h.text === text)) {
        chatHistory.push({ role: "user", text });
      }

      const deepseekReply = await queryDeepSeek(chatHistory, systemPrompt, model);
      if (deepseekReply) {
        return {
          id: `msg-${Date.now()}`,
          role: "assistant",
          text: deepseekReply,
        };
      }
    }

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
    return buildLocalHomeChatReply(text);
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
