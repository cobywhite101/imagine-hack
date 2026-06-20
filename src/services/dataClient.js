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
  mockHomeTasks,
  mockHomeMeetings,
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
const CUSTOMER_RECORD_STORAGE_KEY = "client-os-customer-overrides-v1";
const CUSTOMER_MEMORY_STORAGE_KEY = "client-os-customer-memories-v1";
const CUSTOMER_CHAT_UPDATED_EVENT = "client-os-customer-chat-updated";
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
const HOME_TASK_STORAGE_KEY = "client-os-home-tasks-v1";
const HOME_MEETING_STORAGE_KEY = "client-os-home-meetings-v1";
const HOME_TASK_STATUSES = ["To Do", "Meeting", "Follow-up", "Done"];
const HOME_TASK_STATUS_ORDER = new Map(HOME_TASK_STATUSES.map((status, index) => [status, index]));
const CUSTOMER_RECORD_COLUMN_MAP = {
  email: "email",
  phone: "phone",
  contactName: "contact_name",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  maritalStatus: "marital_status",
  occupation: "occupation",
  dependents: "dependents",
  nationality: "nationality",
  advisorId: "assigned_advisor_id",
  clientSince: "client_since_date",
  acquisitionChannel: "acquisition_channel",
  referredBy: "referred_by",
  annualIncomeBracket: "annual_income_bracket",
  netWorthBracket: "net_worth_bracket",
  riskTolerance: "risk_tolerance",
  investmentHorizonYears: "investment_horizon_years",
  liabilitiesSummary: "liabilities_summary",
  hasWill: "has_will",
  estatePlanStatus: "estate_plan_status",
  businessOwnership: "business_ownership",
  intendedHeirs: "intended_heirs",
  lastContactDate: "last_contact_date",
  preferredCommunicationChannel: "preferred_communication_channel",
  rapportNotes: "rapport_notes",
  kycStatus: "kyc_status",
  lastFactFindDate: "last_fact_find_date",
  consentMarketing: "consent_marketing",
  policyCount: "policy_count",
  policySummary: "policy_summary",
  nextRenewal: "next_renewal",
  nextRenewalPolicyType: "next_renewal_policy_type",
  nextLifeEvent: "next_life_event",
  nextLifeEventDate: "next_life_event_date",
};

function requireSupabase(feature) {
  if (!isSupabaseConfigured) {
    throw new Error(`${feature} requires Supabase configuration.`);
  }
}

function getCustomerAccent(customer) {
  if (customer.accent && customer.accent !== FALLBACK_CUSTOMER_ACCENT) return customer.accent;
  const key = String(customer.id ?? customer.name ?? customer.company ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CUSTOMER_ACCENTS[hash % CUSTOMER_ACCENTS.length];
}

function isImageAvatarValue(value) {
  return /^(https?:|data:image\/|blob:)/i.test(String(value ?? "").trim());
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

function pad2(value) {
  return String(value).padStart(2, "0");
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function toLocalDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) return toLocalDateString(new Date());
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toLocalTimeString(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function hasExplicitTimezone(value) {
  return /(?:z|[+-]\d{2}:?\d{2})$/i.test(String(value ?? ""));
}

function toLocalCalendarValue(value, allDay = false) {
  if (!value) return allDay ? toLocalDateString() : `${toLocalDateString()}T09:00`;
  const text = String(value);
  if (allDay) return text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text) && !hasExplicitTimezone(text)) {
    return text.slice(0, 16);
  }

  const date = new Date(text);
  if (!isValidDate(date)) return text.slice(0, 16);
  return `${toLocalDateString(date)}T${toLocalTimeString(date)}`;
}

function toDbTimestamp(value, allDay = false) {
  if (!value) return null;
  const text = String(value);
  const localValue = allDay && !text.includes("T") ? `${text.slice(0, 10)}T00:00` : text;
  const date = new Date(localValue);
  return isValidDate(date) ? date.toISOString() : null;
}

function isSameLocalDate(value, dateString = toLocalDateString()) {
  if (!value) return false;
  const text = String(value);
  if (!text.includes("T") || !hasExplicitTimezone(text)) return text.slice(0, 10) === dateString;
  return toLocalDateString(text) === dateString;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function readStoredArray(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredArray(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* local persistence is best-effort for the demo */
  }
}

function normalizeHomeTaskStatus(status) {
  if (status === "In progress") return "Meeting";
  return HOME_TASK_STATUSES.includes(status) ? status : "To Do";
}

function getHomeTaskIcon(task) {
  const status = normalizeHomeTaskStatus(task?.status);
  if (status === "Done") return "check";
  if (status === "Meeting") return "meeting";
  if (status === "Follow-up") return "mail";
  if (/brief|prep|note|draft/i.test(task?.title ?? "")) return "notepad";
  return "plus";
}

function normalizeHomeTask(task = {}) {
  const status = normalizeHomeTaskStatus(task.status);
  const title = String(task.title ?? task.task ?? task.next_action ?? "New task").trim() || "New task";

  return {
    id: String(task.id ?? `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    customerId: task.customerId ?? task.customer_id ?? null,
    title,
    icon: task.icon ?? getHomeTaskIcon({ ...task, title, status }),
    priority: task.priority ?? "",
    category: task.category ?? task.task_type ?? "",
    status,
    notes: task.notes ?? "",
    dueDate: task.dueDate ?? task.due_date ?? null,
    sortOrder: Number(task.sortOrder ?? task.sort_order ?? 0),
    muted: task.muted ?? status === "Done",
    createdAt: task.createdAt ?? task.created_at ?? null,
    updatedAt: task.updatedAt ?? task.updated_at ?? null,
  };
}

function homeTaskToRow(task) {
  const entry = normalizeHomeTask(task);
  return {
    id: entry.id,
    customer_id: entry.customerId,
    title: entry.title,
    icon: entry.icon,
    priority: entry.priority || null,
    category: entry.category || null,
    status: entry.status,
    notes: entry.notes || null,
    due_date: entry.dueDate || null,
    sort_order: entry.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

function sortHomeTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const statusDiff =
      (HOME_TASK_STATUS_ORDER.get(a.status) ?? 99) - (HOME_TASK_STATUS_ORDER.get(b.status) ?? 99);
    if (statusDiff) return statusDiff;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.title).localeCompare(String(b.title));
  });
}

function getStoredHomeTasks() {
  return sortHomeTasks(readStoredArray(HOME_TASK_STORAGE_KEY, mockHomeTasks).map(normalizeHomeTask));
}

function setStoredHomeTasks(tasks) {
  const next = sortHomeTasks(tasks.map(normalizeHomeTask));
  writeStoredArray(HOME_TASK_STORAGE_KEY, next);
  return next;
}

function getStoredCustomerOverrides() {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_RECORD_STORAGE_KEY) ?? "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function setStoredCustomerOverride(customerId, patch) {
  if (typeof window === "undefined" || !customerId) return null;
  try {
    const stored = getStoredCustomerOverrides();
    const next = {
      ...stored,
      [String(customerId)]: {
        ...(stored[String(customerId)] ?? {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    };
    window.localStorage.setItem(CUSTOMER_RECORD_STORAGE_KEY, JSON.stringify(next));
    return next[String(customerId)];
  } catch {
    return null;
  }
}

// Drop a local override once Supabase accepts the same write, so the database
// becomes the source of truth again for those fields. Pass `fields` to clear
// only the columns that were successfully persisted.
function clearStoredCustomerOverride(customerId, fields) {
  if (typeof window === "undefined" || !customerId) return;
  try {
    const stored = getStoredCustomerOverrides();
    const key = String(customerId);
    if (!stored[key]) return;
    if (Array.isArray(fields) && fields.length) {
      for (const field of fields) delete stored[key][field];
      const remaining = Object.keys(stored[key]).filter((name) => name !== "updatedAt");
      if (!remaining.length) delete stored[key];
    } else {
      delete stored[key];
    }
    window.localStorage.setItem(CUSTOMER_RECORD_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Best-effort cleanup; ignore storage failures.
  }
}

function getStoredCustomerMemories(customerId = null) {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_MEMORY_STORAGE_KEY) ?? "{}");
    const entries = customerId ? stored[String(customerId)] ?? [] : Object.values(stored).flat();
    return entries.map(normalizeCustomerMemory);
  } catch {
    return [];
  }
}

function setStoredCustomerMemory(customerId, memory) {
  if (typeof window === "undefined" || !customerId) return normalizeCustomerMemory(memory);
  const entry = normalizeCustomerMemory({
    ...memory,
    customerId,
    createdAt: memory.createdAt ?? new Date().toISOString(),
  });

  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOMER_MEMORY_STORAGE_KEY) ?? "{}");
    const key = String(customerId);
    const current = stored[key] ?? [];
    stored[key] = [entry, ...current.filter((item) => String(item.id) !== String(entry.id))];
    window.localStorage.setItem(CUSTOMER_MEMORY_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* local persistence is best-effort for the demo */
  }

  if (entry.kind === "chat") {
    window.dispatchEvent(
      new CustomEvent(CUSTOMER_CHAT_UPDATED_EVENT, { detail: { customerId: entry.customerId } })
    );
  }

  return entry;
}

function normalizeAdvisorMeeting(meeting = {}) {
  const allDay = Boolean(meeting.allDay ?? meeting.all_day);
  const startValue = meeting.start ?? meeting.startsAt ?? meeting.starts_at ?? meeting.start_at;
  const endValue = meeting.end ?? meeting.endsAt ?? meeting.ends_at ?? meeting.end_at;

  return {
    id: String(meeting.id ?? `meeting-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    customerId: meeting.customerId ?? meeting.customer_id ?? null,
    title: String(meeting.title ?? "Client meeting").trim() || "Client meeting",
    start: toLocalCalendarValue(startValue, allDay),
    end: endValue ? toLocalCalendarValue(endValue, allDay) : undefined,
    allDay,
    notes: meeting.notes ?? "",
    location: meeting.location ?? "",
    status: meeting.status ?? "scheduled",
    createdAt: meeting.createdAt ?? meeting.created_at ?? null,
    updatedAt: meeting.updatedAt ?? meeting.updated_at ?? null,
  };
}

function advisorMeetingToRow(meeting) {
  const entry = normalizeAdvisorMeeting(meeting);
  return {
    id: entry.id,
    customer_id: entry.customerId,
    title: entry.title,
    starts_at: toDbTimestamp(entry.start, entry.allDay),
    ends_at: entry.end ? toDbTimestamp(entry.end, entry.allDay) : null,
    all_day: entry.allDay,
    notes: entry.notes || null,
    location: entry.location || null,
    status: entry.status || "scheduled",
    updated_at: new Date().toISOString(),
  };
}

function sortAdvisorMeetings(meetings) {
  return [...meetings].sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

function getStoredHomeMeetings() {
  return sortAdvisorMeetings(readStoredArray(HOME_MEETING_STORAGE_KEY, mockHomeMeetings).map(normalizeAdvisorMeeting));
}

function setStoredHomeMeetings(meetings) {
  const next = sortAdvisorMeetings(meetings.map(normalizeAdvisorMeeting));
  writeStoredArray(HOME_MEETING_STORAGE_KEY, next);
  return next;
}

async function getCustomersForHomeFallback() {
  if (!isSupabaseConfigured) return localCustomers.map(normalizeCustomerRecord);

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []).map(normalizeCustomerRecord);
}

function getCustomerTaskCategory(customer) {
  const task = `${customer.task ?? customer.nextAction ?? ""}`.toLowerCase();
  if (customer.kycStatus && customer.kycStatus !== "Completed") return "KYC";
  if (task.includes("will") || task.includes("estate")) return "Estate planning";
  if (task.includes("renew")) return "Renewal";
  return "Follow-up";
}

function getCustomerTaskPriority(customer, dueDate) {
  if (customer.kycStatus && customer.kycStatus !== "Completed") return "High";
  if (dueDate && dueDate <= toLocalDateString()) return "High";
  if (customer.status === "Action needed") return "Medium";
  return "Low";
}

function buildCustomerHomeTasks(customers) {
  const today = toLocalDateString();
  const candidates = customers
    .filter((customer) => customer.task || customer.nextAction || customer.status === "Action needed")
    .sort((a, b) => {
      const ar = a.nextRenewal || "9999-12-31";
      const br = b.nextRenewal || "9999-12-31";
      return ar.localeCompare(br) || String(a.name).localeCompare(String(b.name));
    })
    .slice(0, 8);

  return sortHomeTasks(
    candidates.map((customer, index) => {
      const category = getCustomerTaskCategory(customer);
      const dueDate = customer.nextRenewal && customer.nextRenewal < "2030-01-01" ? customer.nextRenewal : today;
      const status = category === "Renewal" ? "To Do" : "Follow-up";
      const task = customer.task || customer.nextAction || `Follow up with ${customer.name}`;
      return normalizeHomeTask({
        id: `customer-task-${customer.id}`,
        customerId: customer.id,
        title: `${task}: ${customer.name}`,
        priority: getCustomerTaskPriority(customer, dueDate),
        category,
        status,
        dueDate,
        notes: [
          customer.preferredCommunicationChannel ? `Preferred channel: ${customer.preferredCommunicationChannel}.` : "",
          customer.nextRenewal ? `Next renewal: ${customer.nextRenewal}${customer.nextRenewalPolicyType ? ` (${customer.nextRenewalPolicyType})` : ""}.` : "",
        ].filter(Boolean).join(" "),
        sortOrder: index * 10,
      });
    }),
  );
}

function buildCustomerHomeMeetings(customers) {
  const today = toLocalDateString();
  const times = [
    ["09:30", "10:15"],
    ["11:30", "12:00"],
    ["14:00", "14:45"],
  ];
  const candidates = customers
    .filter((customer) => customer.status === "Action needed" || customer.nextRenewal)
    .sort((a, b) => {
      const ar = a.nextRenewal || "9999-12-31";
      const br = b.nextRenewal || "9999-12-31";
      return ar.localeCompare(br) || String(a.name).localeCompare(String(b.name));
    })
    .slice(0, 3);

  return sortAdvisorMeetings(
    candidates.map((customer, index) => {
      const [startTime, endTime] = times[index] ?? times[0];
      const meetingLabel = customer.nextRenewalPolicyType
        ? `${customer.nextRenewalPolicyType} review`
        : "client review";
      return normalizeAdvisorMeeting({
        id: `customer-meeting-${customer.id}`,
        customerId: customer.id,
        title: `${customer.name} ${meetingLabel}`,
        start: `${today}T${startTime}`,
        end: `${today}T${endTime}`,
        notes: customer.task || customer.nextAction || "Review the client record and confirm the next action.",
      });
    }),
  );
}

function buildHomeStats(tasks, meetings) {
  const today = toLocalDateString();
  const todoToday = tasks.filter((task) => task.status === "To Do" && (!task.dueDate || task.dueDate <= today)).length;
  const meetingsToday = meetings.filter((meeting) => isSameLocalDate(meeting.start, today)).length;
  const followUps = tasks.filter((task) => task.status === "Follow-up").length;
  const completed = tasks.filter((task) => task.status === "Done").length;

  return [
    {
      id: "todo",
      label: "To-do Tasks",
      value: String(todoToday),
      helper: todoToday ? pluralize(todoToday, "task due today", "tasks due today") : "No tasks due today",
    },
    {
      id: "meetings",
      label: "Meetings",
      value: String(meetingsToday),
      helper: meetingsToday ? pluralize(meetingsToday, "client meeting", "client meetings") : "No meetings today",
    },
    {
      id: "followups",
      label: "Follow-ups",
      value: String(followUps),
      helper: followUps ? pluralize(followUps, "follow-up due", "follow-ups due") : "No follow-ups due",
    },
    {
      id: "completed",
      label: "Completed",
      value: String(completed),
      helper: completed ? pluralize(completed, "task done", "tasks done") : "No tasks done yet",
    },
  ];
}

function formatMeetingTime(meeting) {
  if (!meeting?.start || !String(meeting.start).includes("T")) return "";
  const [hour, minute] = String(meeting.start).slice(11, 16).split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${pad2(minute)} ${suffix}`;
}

function compactText(value, maxLength = 280) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function getHomeBriefContext(tasks, meetings, customers = []) {
  const today = toLocalDateString();
  const todayMeetings = meetings
    .filter((meeting) => isSameLocalDate(meeting.start, today))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const followUps = tasks.filter((task) => task.status === "Follow-up");
  const dueTasks = tasks.filter(
    (task) => !["Done", "Meeting"].includes(task.status) && (!task.dueDate || task.dueDate <= today)
  );
  const highPriorityTasks = dueTasks.filter((task) => String(task.priority).toLowerCase() === "high");
  const priority = todayMeetings[0];
  const priorityTime = formatMeetingTime(priority);
  const customersById = new Map(customers.map((customer) => [String(customer.id), customer]));

  return {
    advisorName: "Daniel",
    today,
    todayMeetings,
    followUps,
    dueTasks,
    highPriorityTasks,
    priority,
    priorityTime,
    customersById,
    meetingsText: pluralize(todayMeetings.length, "meeting today", "meetings today"),
    followUpsText: pluralize(followUps.length, "follow-up due", "follow-ups due"),
    priorityText: priority
      ? `${priority.title}${priorityTime ? ` at ${priorityTime}` : ""}`
      : dueTasks[0]?.title ?? "Your client task board",
  };
}

function buildLocalHomeBrief(tasks, meetings, customers = []) {
  const context = getHomeBriefContext(tasks, meetings, customers);
  const priorityTask = context.highPriorityTasks[0] ?? context.followUps[0] ?? context.dueTasks[0];
  const priorityText = context.priority
    ? context.priorityText
    : priorityTask?.title ?? context.priorityText;
  const workload = [
    context.meetingsText,
    context.followUpsText,
    context.highPriorityTasks.length
      ? pluralize(context.highPriorityTasks.length, "high-priority task", "high-priority tasks")
      : "",
  ].filter(Boolean);
  const bodyHighlights = [
    { id: "meetings", text: context.meetingsText, tone: "meetings" },
    { id: "followups", text: context.followUpsText, tone: "followups" },
    context.highPriorityTasks.length
      ? {
          id: "highPriorityTasks",
          text: pluralize(context.highPriorityTasks.length, "high-priority task", "high-priority tasks"),
          tone: "priority",
        }
      : null,
  ].filter(Boolean);

  return {
    advisorName: context.advisorName,
    headline: `Good morning, ${context.advisorName}.`,
    body: workload.length
      ? `You have ${workload.join(", ")}. Start with ${priorityText}; it is the best next action for today.`
      : `Start with ${priorityText}; it is the best next action for today.`,
    bodyHighlights,
    meetingsText: context.meetingsText,
    followUpsText: context.followUpsText,
    priorityText: priorityText || context.priorityText,
    source: "local",
  };
}

async function buildHomeBrief(tasks, meetings, customers = []) {
  const fallback = buildLocalHomeBrief(tasks, meetings, customers);
  const context = getHomeBriefContext(tasks, meetings, customers);
  const taskLines = context.dueTasks.slice(0, 8).map((task) => {
    const customer = task.customerId ? context.customersById.get(String(task.customerId)) : null;
    return {
      title: task.title,
      status: task.status,
      priority: task.priority || "Normal",
      category: task.category || "General",
      dueDate: task.dueDate,
      notes: task.notes,
      customer: customer?.name ?? null,
    };
  });
  const meetingLines = context.todayMeetings.slice(0, 6).map((meeting) => {
    const customer = meeting.customerId ? context.customersById.get(String(meeting.customerId)) : null;
    return {
      title: meeting.title,
      time: formatMeetingTime(meeting),
      notes: meeting.notes,
      customer: customer?.name ?? null,
    };
  });
  const briefPayload = {
    advisorName: context.advisorName,
    today: context.today,
    counts: {
      meetingsToday: context.todayMeetings.length,
      followUpsDue: context.followUps.length,
      dueTasks: context.dueTasks.length,
      highPriorityTasks: context.highPriorityTasks.length,
    },
    tasks: taskLines,
    meetings: meetingLines,
  };

  const enableHomeAiFunction = import.meta.env.VITE_ENABLE_HOME_AI_BRIEF === "true";
  if (isSupabaseConfigured && enableHomeAiFunction) {
    try {
      const { data, error } = await supabase.functions.invoke("home-brief", {
        body: briefPayload,
      });
      if (!error && data?.brief) return normalizeGeneratedHomeBrief(data.brief, fallback);
      if (!error && data) return normalizeGeneratedHomeBrief(data, fallback);
    } catch {
      /* fall through to local or explicitly-enabled browser AI */
    }
  }

  const allowBrowserAi = import.meta.env.VITE_ENABLE_BROWSER_DEEPSEEK === "true";
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
  if (!allowBrowserAi || !apiKey) return fallback;

  const systemPrompt = `You generate a short morning brief for a financial advisor CRM home page.
Use only the supplied tasks and meetings. Do not invent clients, counts, times, or obligations.
Choose today's earliest meeting first. If there are no meetings, choose urgent due tasks, then follow-ups.
Return only valid JSON:
{
  "headline": "short greeting",
  "body": "one concise sentence under 34 words",
  "priorityText": "short priority label"
}`;
  const userPrompt = JSON.stringify(briefPayload);

  const reply = await queryDeepSeek([{ role: "user", text: userPrompt }], systemPrompt);
  const generated = parseJsonObject(reply);
  return normalizeGeneratedHomeBrief(generated, fallback);
}

function normalizeGeneratedHomeBrief(generated, fallback) {
  const headline = compactText(generated?.headline, 90) || fallback.headline;
  const body = compactText(generated?.body, 260) || fallback.body;
  const priorityText = compactText(generated?.priorityText, 120) || fallback.priorityText;

  return {
    ...fallback,
    headline,
    body,
    priorityText,
    source: generated ? "ai" : fallback.source,
  };
}

async function createHomeDashboard({ tasks, meetings, customers = [] }) {
  const normalizedTasks = sortHomeTasks(tasks.map(normalizeHomeTask));
  const normalizedMeetings = sortAdvisorMeetings(meetings.map(normalizeAdvisorMeeting));

  return {
    brief: await buildHomeBrief(normalizedTasks, normalizedMeetings, customers),
    stats: buildHomeStats(normalizedTasks, normalizedMeetings),
    tasks: normalizedTasks,
    meetings: normalizedMeetings,
    syncedAt: new Date().toISOString(),
  };
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
    avatarUrl:
      customer.avatarUrl ??
      customer.avatar_url ??
      customer.profileImageUrl ??
      customer.profile_image_url ??
      customer.profilePictureUrl ??
      customer.profile_picture_url ??
      customer.photoUrl ??
      customer.photo_url ??
      customer.imageUrl ??
      customer.image_url ??
      (isImageAvatarValue(customer.avatar) ? customer.avatar : mockCustomer?.avatarUrl),
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

function humanizeCustomerRecordKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\b(Of|At|Id|Kyc)\b/g, (word) => {
      if (word === "Id") return "ID";
      if (word === "Kyc") return "KYC";
      return word.toLowerCase();
    });
}

function formatCustomerRecordValue(value) {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) {
    if (!value.length) return "";
    return value
      .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
      .join("; ");
  }
  if (typeof value === "object") {
    if (!Object.keys(value).length) return "";
    return JSON.stringify(value);
  }
  return String(value);
}

function formatCustomerRecordForPrompt(customer) {
  const seenLabels = new Set();
  const lines = Object.entries(customer ?? {})
    .map(([key, value]) => {
      const label = humanizeCustomerRecordKey(key);
      const normalizedLabel = label.toLowerCase();
      const formattedValue = formatCustomerRecordValue(value);
      if (!formattedValue || seenLabels.has(normalizedLabel)) return null;
      seenLabels.add(normalizedLabel);
      return `- ${label}: ${formattedValue}`;
    })
    .filter(Boolean);

  return lines.length ? lines.join("\n") : "- No populated client record fields.";
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

function stripInlineMarkdown(text) {
  return cleanCustomerText(
    String(text ?? "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "")
  );
}

function formatSidebarChatSummary(text) {
  const summary = stripInlineMarkdown(text).replace(
    /^here(?:'|’)s a quick snapshot before you reach out:?\s*/i,
    ""
  );
  const focused = summary.match(/\b(Status|Next step|Next action|Action):\s*([^.;|]+)(?:[.;|]|$)/i);

  if (focused) {
    const label = focused[1]
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\bStep\b/, "step")
      .replace(/\bAction\b/, "action");
    return truncateCustomerText(`${label}: ${focused[2].trim()}`, 56);
  }

  return truncateCustomerText(summary || "Recent AI chat", 56);
}

function decodeBasicHtmlEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function htmlToPlainText(html) {
  return decodeBasicHtmlEntities(
    String(html ?? "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<\/(p|div|section|article|h[1-6]|li|ul|ol|tr)>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarizeCustomerKnowledge(text, fallback = "Saved customer knowledge source.") {
  const cleaned = cleanCustomerText(text);
  if (!cleaned) return fallback;

  const sentences = cleaned
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => cleanCustomerText(sentence))
    .filter(Boolean) ?? [cleaned];

  const priority = sentences.find((sentence) => {
    const lower = sentence.toLowerCase();
    return /\b(net worth|income|risk|liabilit|policy|renew|action|next|follow|deadline|commitment)\b/.test(lower);
  });
  const summary = cleanCustomerText([priority ?? sentences[0], ...sentences.filter((sentence) => sentence !== priority).slice(0, 1)].join(" "));

  if (summary.length <= 320) return summary;
  return `${summary.slice(0, 320).replace(/\s+\S*$/, "")}...`;
}

function getArticleMemoryId(articleId) {
  return `article-memory-${articleId}`;
}

function isArticleBackedMemory(memory) {
  return (
    memory?.kind === "article" ||
    String(memory?.id ?? "").startsWith("article-memory-") ||
    /\barticle:[^|\s]+/i.test(String(memory?.sourceMeta ?? memory?.source_meta ?? ""))
  );
}

function customerArticleToMemory(article) {
  const entry = normalizeCustomerArticle(article);
  if (!entry.id) return null;

  const bodyText = htmlToPlainText(entry.body);
  const sourceMeta = [
    `article:${entry.id}`,
    entry.subtitle,
    entry.updatedAt ? `Updated ${new Date(entry.updatedAt).toLocaleDateString()}` : "",
  ].filter(Boolean).join(" | ");

  return normalizeCustomerMemory({
    id: getArticleMemoryId(entry.id),
    customerId: entry.customerId,
    kind: "article",
    title: entry.title,
    summary: summarizeCustomerKnowledge(bodyText, entry.subtitle || entry.title),
    body: bodyText,
    sourceName: `Internal article: ${entry.title}`,
    sourceMeta,
    createdAt: entry.updatedAt ?? entry.createdAt,
  });
}

function dedupeCustomerKnowledgeSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = cleanCustomerText(`${source.kind}:${source.title}:${source.body || source.summary}`).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCustomerKnowledgeSources(memories = [], articles = []) {
  const articleSources = articles
    .map(customerArticleToMemory)
    .filter(Boolean);
  const memorySources = memories
    .map(normalizeCustomerMemory)
    .filter((memory) => !isArticleBackedMemory(memory) && memory.kind !== "chat");

  return dedupeCustomerKnowledgeSources([...memorySources, ...articleSources]);
}

function formatRecentCustomerConversation(history = [], memories = []) {
  const visibleTurns = history
    .slice(-10)
    .map((message) => {
      const role = message?.role === "user" ? "Advisor" : "Assistant";
      const text = truncateCustomerText(message?.text || message?.content || "", 900);
      return text ? `${role}: ${text}` : "";
    })
    .filter(Boolean);

  const savedTurns = memories
    .map(normalizeCustomerMemory)
    .filter((memory) => memory.kind === "chat")
    .slice(0, 4)
    .map((memory) => truncateCustomerText(memory.body || memory.summary, 900))
    .filter(Boolean);

  const lines = [...savedTurns.map((turn) => `Saved chat: ${turn}`), ...visibleTurns];
  return lines.length ? lines.join("\n\n") : "No recent conversation context.";
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

function extractNetWorthFact(memory) {
  const text = `${memory?.summary ?? ""}\n${memory?.body ?? ""}`;
  const index = text.toLowerCase().lastIndexOf("net worth");
  if (index === -1) return null;

  const snippet = text.slice(index, index + 260);
  const value = snippet.match(/\b(?:below\s+)?RM\s*\d+(?:\.\d+)?\s*(?:k|m|million)?(?:\s*[–-]\s*(?:RM\s*)?\d+(?:\.\d+)?\s*(?:k|m|million)?)?\+?/i)?.[0];
  if (!value) return null;

  const date = snippet.match(/\bas of\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?|\d{4}-\d{2}-\d{2})/i)?.[1];

  return {
    value: cleanCustomerText(value),
    date: date ? cleanCustomerText(date) : "",
  };
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

function buildLocalCustomerChatReply({ customer, text, memories, articles = [] }) {
  const knowledgeSources = buildCustomerKnowledgeSources(memories, articles);
  const ranked = rankCustomerMemories(text, knowledgeSources);
  const rankedOrRecent = ranked.length
    ? ranked
    : knowledgeSources
        .map((memory) => ({ memory, score: 0 }))
        .sort((a, b) => new Date(b.memory.createdAt) - new Date(a.memory.createdAt));
  const lower = text.toLowerCase();
  const wantsDraft = /\b(draft|email|follow[- ]?up|reply|message)\b/.test(lower);
  const wantsPlan = /\b(plan|recap|summary|risk|renew|next|prepare|strategy)\b/.test(lower);
  const wantsNetWorth = /\bnet\s*worth\b/.test(lower);

  if (wantsNetWorth) {
    const source = rankedOrRecent.map((item) => item.memory).find((memory) => extractNetWorthFact(memory));
    const fact = source ? extractNetWorthFact(source) : null;

    if (source && fact) {
      return {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: `Based on ${formatCustomerSource(source)}, ${customer.name}'s latest net worth is ${fact.value}${fact.date ? ` as of ${fact.date}` : ""}.`,
      };
    }
  }

  if (wantsDraft) {
    const draft = buildCustomerDraft(customer, rankedOrRecent.map((item) => item.memory));
    const sources = rankedOrRecent.slice(0, 2).map((item) => formatCustomerSource(item.memory)).join("; ");

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

  const relevant = rankedOrRecent.slice(0, 3).map((item) => item.memory);
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

function parseJsonObject(text) {
  if (!text) return null;
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
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
    // Apply local overrides in both modes: in live mode they hold edits that
    // Supabase rejected (missing table / RLS), so the list still reflects them.
    const overrides = getStoredCustomerOverrides();
    return rows.map((row) => normalizeCustomerRecord({ ...row, ...(overrides[String(row.id)] ?? {}) }));
  },

  getCustomerById: async (customerId) => {
    if (!customerId) return null;

    if (!isSupabaseConfigured) {
      await delay();
      const customer = localCustomers.find((item) => String(item.id) === String(customerId));
      const override = getStoredCustomerOverrides()[String(customerId)] ?? {};
      return customer ? normalizeCustomerRecord({ ...customer, ...override }) : null;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (error) throw error;

    // Merge any locally-stored override on top, and fall back to mock data if
    // the row isn't in Supabase yet, so an edit that Supabase rejected still
    // shows after a reload.
    const override = getStoredCustomerOverrides()[String(customerId)] ?? {};
    const base = data ?? localCustomers.find((item) => String(item.id) === String(customerId));
    return base ? normalizeCustomerRecord({ ...base, ...override }) : null;
  },

  updateCustomerRecord: async (customerId, patch) => {
    if (!customerId || !patch || typeof patch !== "object") return null;

    // Persist the edit to a local override store and return the merged record.
    // Used offline, and as a fallback in live mode when the customers table is
    // missing or the row is not writable (e.g. RLS blocks anon updates), so the
    // change always sticks for the demo. Mirrors fromTableOrMock's philosophy:
    // try Supabase first, but never let a missing/locked table break the flow.
    const persistLocalOverride = async () => {
      const override = setStoredCustomerOverride(customerId, patch) ?? patch;
      const current = isSupabaseConfigured
        ? await api.getCustomerById(customerId)
        : localCustomers.find((item) => String(item.id) === String(customerId));
      if (!current) return null;
      return normalizeCustomerRecord({ ...current, ...override });
    };

    if (!isSupabaseConfigured) {
      await delay();
      return persistLocalOverride();
    }

    const rowPatch = {};
    for (const [field, value] of Object.entries(patch)) {
      const column = CUSTOMER_RECORD_COLUMN_MAP[field];
      if (!column) continue;
      rowPatch[column] = value === "" ? null : value;
    }

    if (!Object.keys(rowPatch).length) return api.getCustomerById(customerId);
    rowPatch.updated_at = new Date().toISOString();

    try {
      // maybeSingle (not single) so a 0-row update — e.g. the row is hidden by
      // RLS — resolves to null instead of throwing, letting us fall back.
      const { data, error } = await supabase
        .from("customers")
        .update(rowPatch)
        .eq("id", customerId)
        .select("*")
        .maybeSingle();

      if (!error && data) {
        // Supabase accepted the write — it owns these fields now.
        clearStoredCustomerOverride(customerId, Object.keys(patch));
        return normalizeCustomerRecord(data);
      }
    } catch {
      // Table missing or write rejected — fall through to the local override.
    }

    return persistLocalOverride();
  },

  getCustomerMemories: async (customerId) => {
    if (!customerId) return [];

    if (!isSupabaseConfigured) {
      await delay();
      return [...getStoredCustomerMemories(customerId), ...localCustomerMemories]
        .filter((memory) => String(memory.customerId) === String(customerId))
        .map(normalizeCustomerMemory)
        .filter((memory) => !isArticleBackedMemory(memory))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
      const { data, error } = await supabase
        .from("customer_memories")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return [...getStoredCustomerMemories(customerId), ...(data ?? [])]
        .map(normalizeCustomerMemory)
        .filter((memory) => !isArticleBackedMemory(memory))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      return getStoredCustomerMemories(customerId)
        .filter((memory) => !isArticleBackedMemory(memory))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  getRecentCustomerChatThreads: async () => {
    const customers = await api.getCustomers();
    const customersById = new Map(customers.map((customer) => [String(customer.id), customer]));
    let chatMemories = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("customer_memories")
          .select("*")
          .eq("kind", "chat")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        chatMemories = [...getStoredCustomerMemories(), ...(data ?? [])]
          .map(normalizeCustomerMemory)
          .filter((memory) => memory.kind === "chat");
      } catch {
        chatMemories = getStoredCustomerMemories().filter((memory) => memory.kind === "chat");
      }
    } else {
      await delay();
      chatMemories = [...getStoredCustomerMemories(), ...localCustomerMemories.map(normalizeCustomerMemory)].filter(
        (memory) => memory.kind === "chat"
      );
    }

    const latestByCustomer = new Map();
    chatMemories
      .filter((memory) => memory.customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((memory) => {
        const key = String(memory.customerId);
        if (!latestByCustomer.has(key)) latestByCustomer.set(key, memory);
      });

    return Array.from(latestByCustomer.values()).map((memory) => {
      const customer = customersById.get(String(memory.customerId));
      const customerName = customer?.name || customer?.company || `Customer ${memory.customerId}`;
      const summary = formatSidebarChatSummary(memory.summary || memory.body || "Recent AI chat");

      return {
        id: memory.id,
        customerId: memory.customerId,
        customerName,
        avatar: isImageAvatarValue(customer?.avatar) ? getInitials(customerName) : customer?.avatar || getInitials(customerName),
        avatarUrl: customer?.avatarUrl || (isImageAvatarValue(customer?.avatar) ? customer.avatar : ""),
        accent: customer?.accent || getCustomerAccent({ id: memory.customerId, name: customerName }),
        summary,
        createdAt: memory.createdAt,
      };
    });
  },

  saveCustomerMemory: async (customerId, memory) => {
    const entry = normalizeCustomerMemory({
      ...memory,
      customerId,
      createdAt: memory.createdAt ?? new Date().toISOString(),
    });

    if (!isSupabaseConfigured) {
      await delay();
      return setStoredCustomerMemory(customerId, entry);
    }

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
      if (!error && data) {
        const savedEntry = normalizeCustomerMemory(data);
        if (savedEntry.kind === "chat" && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(CUSTOMER_CHAT_UPDATED_EVENT, { detail: { customerId: savedEntry.customerId } })
          );
        }
        return savedEntry;
      }
    } catch (error) {
      return setStoredCustomerMemory(customerId, entry);
    }

    return setStoredCustomerMemory(customerId, entry);
  },

  updateCustomerMemory: async (customerId, memory) => {
    if (!customerId || !memory?.id) return normalizeCustomerMemory(memory);
    requireSupabase("Updating customer memory");

    const entry = normalizeCustomerMemory({
      ...memory,
      customerId,
    });

    const { data, error } = await supabase
      .from("customer_memories")
      .update({
        kind: entry.kind,
        title: entry.title,
        summary: entry.summary,
        body: entry.body,
        source_name: entry.sourceName,
        source_meta: entry.sourceMeta,
      })
      .eq("id", entry.id)
      .eq("customer_id", customerId)
      .select("*")
      .single();

    if (error) throw error;
    return normalizeCustomerMemory(data);
  },

  getCustomerArticles: async (customerId) => {
    if (!customerId) return [];
    requireSupabase("Customer articles");

    try {
      const { data, error } = await supabase
        .from("customer_articles")
        .select("*")
        .eq("customer_id", customerId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(normalizeCustomerArticle);
    } catch (error) {
      throw error;
    }
  },

  saveCustomerArticle: async (customerId, article) => {
    if (!customerId) return normalizeCustomerArticle(article);
    requireSupabase("Saving customer articles");
    const now = new Date().toISOString();
    const entry = normalizeCustomerArticle({
      ...article,
      id: article?.id ?? `article-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      customerId,
      createdAt: article?.createdAt ?? now,
      updatedAt: now,
    });

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
      if (data) {
        return normalizeCustomerArticle(data);
      }
    } catch (error) {
      throw error;
    }

    return entry;
  },

  deleteCustomerArticle: async (customerId, articleId) => {
    if (!customerId || !articleId) return false;
    requireSupabase("Deleting customer articles");

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

  sendCustomerMessage: async ({ customer, text, memories = [], articles = [], history = [], workflowConfig = null, model = "deepseek-chat" }) => {
    if (!customer || !text?.trim()) return null;

    let activeCustomer = customer;
    let activeMemories = memories;
    let activeArticles = articles;

    if (isSupabaseConfigured && customer.id) {
      try {
        const [freshCustomer, freshMemories, freshArticles] = await Promise.all([
          api.getCustomerById(customer.id),
          api.getCustomerMemories(customer.id),
          api.getCustomerArticles(customer.id),
        ]);
        activeCustomer = freshCustomer ?? activeCustomer;
        activeMemories = freshMemories;
        activeArticles = freshArticles;
      } catch (error) {
        throw error;
      }
    }

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
    const knowledgeSources = buildCustomerKnowledgeSources(activeMemories, activeArticles);
    if (apiKey) {
      const customerRecordString = formatCustomerRecordForPrompt(activeCustomer);
      const recentConversationString = formatRecentCustomerConversation(history, activeMemories);
      const memoryString = knowledgeSources.length > 0
        ? knowledgeSources
            .map((m, idx) => {
              const body = truncateCustomerText(m.body, 5000);
              return [
                `[${idx + 1}] (${m.kind || "note"}): ${m.title || "Note"}`,
                `Summary: ${m.summary || m.text || ""}`,
                m.sourceMeta ? `Source meta: ${m.sourceMeta}` : "",
                body ? `Source text: ${body}` : "",
              ].filter(Boolean).join("\n");
            })
            .join("\n\n")
        : "No saved customer knowledge sources.";

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

Current Client Record:
${customerRecordString}

Recent Conversation:
${recentConversationString}

Saved Customer Knowledge Sources (client memories, meeting summaries, files, and saved articles):
${memoryString}

Respond to the Advisor's inquiry. Use Recent Conversation to resolve follow-ups, pronouns, "it", "that", and corrections like "actually..." before answering. Use the current client record, client memories, and saved articles when they are relevant. Treat Current Client Record as canonical for structured CRM fields such as date of birth, KYC status, policy dates, contact preferences, and renewal dates. Never say a structured field is missing if Current Client Record includes a value for it. Do not default to articles; prefer the most recent directly relevant source, whether it is a client record field, memory, meeting note, file, article, or recent chat turn. If sources conflict, say which source/date you used. When drafting emails or follow-ups, make them clear, warm, professional, and tailored. Keep responses concise, and format them nicely in markdown. Do not prefix the text with "Answer for ${activeCustomer.name}:" or similar boilerplate unless explicitly asked.`;

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
          body: { customer: activeCustomer, text, memories: activeMemories, articles: activeArticles },
        });
        if (!error && data?.message) return data.message;
        if (!error && data?.text) return data;
      } catch {
        /* fall through to local grounded reply */
      }
    }

    await delay(450);
    return buildLocalCustomerChatReply({ customer: activeCustomer, text, memories: activeMemories, articles: activeArticles });
  },

  draftCustomerFollowUp: async ({ customer, memories = [], articles = [], workflowConfig = null, model }) => {
    if (!customer) return null;
    const text = `Draft a follow-up email for ${customer.name} using the latest saved customer knowledge, including memories and articles, plus the next step.`;
    return api.sendCustomerMessage({ customer, text, memories, articles, history: [], workflowConfig, model });
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

  // --- Home dashboard ----------------------------------------------------

  getHomeTasks: async () => {
    if (!isSupabaseConfigured) {
      await delay(120);
      return getStoredHomeTasks();
    }

    try {
      const { data, error } = await supabase
        .from("advisor_tasks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (data?.length) return sortHomeTasks(data.map(normalizeHomeTask));
    } catch {
      const stored = readStoredArray(HOME_TASK_STORAGE_KEY, []);
      if (stored.length) return sortHomeTasks(stored.map(normalizeHomeTask));
    }

    const customers = await getCustomersForHomeFallback();
    return buildCustomerHomeTasks(customers);
  },

  saveHomeTask: async (task) => {
    const entry = normalizeHomeTask({
      ...task,
      title: task?.title?.trim() || "New task",
      icon: task?.icon ?? getHomeTaskIcon(task),
      muted: task?.status === "Done",
    });

    if (!isSupabaseConfigured) {
      await delay(80);
      const next = setStoredHomeTasks(
        getStoredHomeTasks().some((item) => item.id === entry.id)
          ? getStoredHomeTasks().map((item) => (item.id === entry.id ? entry : item))
          : [...getStoredHomeTasks(), entry],
      );
      return next.find((item) => item.id === entry.id) ?? entry;
    }

    try {
      const { data, error } = await supabase
        .from("advisor_tasks")
        .upsert(homeTaskToRow(entry), { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;
      return normalizeHomeTask(data);
    } catch {
      const stored = readStoredArray(HOME_TASK_STORAGE_KEY, []);
      const current = stored.length
        ? stored.map(normalizeHomeTask)
        : buildCustomerHomeTasks(await getCustomersForHomeFallback());
      const next = setStoredHomeTasks(
        current.some((item) => item.id === entry.id)
          ? current.map((item) => (item.id === entry.id ? entry : item))
          : [...current, entry],
      );
      return next.find((item) => item.id === entry.id) ?? entry;
    }
  },

  deleteHomeTask: async (taskId) => {
    if (!taskId) return false;

    if (!isSupabaseConfigured) {
      await delay(80);
      setStoredHomeTasks(getStoredHomeTasks().filter((task) => task.id !== taskId));
      return true;
    }

    try {
      const { error } = await supabase.from("advisor_tasks").delete().eq("id", taskId);
      if (error) throw error;
      return true;
    } catch {
      const current = readStoredArray(HOME_TASK_STORAGE_KEY, []).map(normalizeHomeTask);
      setStoredHomeTasks(current.filter((task) => task.id !== taskId));
      return true;
    }
  },

  getAdvisorMeetings: async () => {
    if (!isSupabaseConfigured) {
      await delay(120);
      return getStoredHomeMeetings();
    }

    try {
      const { data, error } = await supabase
        .from("advisor_meetings")
        .select("*")
        .order("starts_at", { ascending: true });

      if (error) throw error;
      if (data?.length) return sortAdvisorMeetings(data.map(normalizeAdvisorMeeting));
    } catch {
      const stored = readStoredArray(HOME_MEETING_STORAGE_KEY, []);
      if (stored.length) return sortAdvisorMeetings(stored.map(normalizeAdvisorMeeting));
    }

    const customers = await getCustomersForHomeFallback();
    return buildCustomerHomeMeetings(customers);
  },

  saveAdvisorMeeting: async (meeting) => {
    const entry = normalizeAdvisorMeeting(meeting);

    if (!isSupabaseConfigured) {
      await delay(80);
      const current = getStoredHomeMeetings();
      const next = setStoredHomeMeetings(
        current.some((item) => item.id === entry.id)
          ? current.map((item) => (item.id === entry.id ? entry : item))
          : [...current, entry],
      );
      return next.find((item) => item.id === entry.id) ?? entry;
    }

    try {
      const { data, error } = await supabase
        .from("advisor_meetings")
        .upsert(advisorMeetingToRow(entry), { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;
      return normalizeAdvisorMeeting(data);
    } catch {
      const stored = readStoredArray(HOME_MEETING_STORAGE_KEY, []);
      const current = stored.length
        ? stored.map(normalizeAdvisorMeeting)
        : buildCustomerHomeMeetings(await getCustomersForHomeFallback());
      const next = setStoredHomeMeetings(
        current.some((item) => item.id === entry.id)
          ? current.map((item) => (item.id === entry.id ? entry : item))
          : [...current, entry],
      );
      return next.find((item) => item.id === entry.id) ?? entry;
    }
  },

  deleteAdvisorMeeting: async (meetingId) => {
    if (!meetingId) return false;

    if (!isSupabaseConfigured) {
      await delay(80);
      setStoredHomeMeetings(getStoredHomeMeetings().filter((meeting) => meeting.id !== meetingId));
      return true;
    }

    try {
      const { error } = await supabase.from("advisor_meetings").delete().eq("id", meetingId);
      if (error) throw error;
      return true;
    } catch {
      const current = readStoredArray(HOME_MEETING_STORAGE_KEY, []).map(normalizeAdvisorMeeting);
      setStoredHomeMeetings(current.filter((meeting) => meeting.id !== meetingId));
      return true;
    }
  },

  getHomeDashboard: async () => {
    const [tasks, meetings, customers] = await Promise.all([
      api.getHomeTasks(),
      api.getAdvisorMeetings(),
      getCustomersForHomeFallback(),
    ]);

    return await createHomeDashboard({ tasks, meetings, customers });
  },

  subscribeHomeDashboard: (onChange) => {
    if (typeof onChange !== "function") return () => {};

    if (!isSupabaseConfigured) {
      const handler = (event) => {
        if ([HOME_TASK_STORAGE_KEY, HOME_MEETING_STORAGE_KEY].includes(event.key)) onChange();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", handler);
      return () => {
        if (typeof window !== "undefined") window.removeEventListener("storage", handler);
      };
    }

    const channel = supabase
      .channel("home-dashboard-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "advisor_tasks" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "advisor_meetings" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeCustomerKnowledge: (customerId, onChange) => {
    if (!customerId || typeof onChange !== "function") return () => {};

    if (!isSupabaseConfigured) return () => {};

    const memoryFilter = `customer_id=eq.${customerId}`;
    const customerFilter = `id=eq.${customerId}`;
    const channel = supabase
      .channel(`customer-knowledge-sync-${customerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_memories", filter: memoryFilter }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_articles", filter: memoryFilter }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers", filter: customerFilter }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

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
