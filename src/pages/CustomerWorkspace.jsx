import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Brain,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Copy,
  FileText,
  Mail,
  Mic,
  Paperclip,
  Plus,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
  Pencil,
  Send,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotmSquare6 } from "@/components/ui/dotm-square-6";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowDetails, WorkflowHeader } from "@/features/customers/WorkflowPanel";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/services/dataClient";
import { useApi } from "@/hooks/useApi";

const ACTION_WORDS = [
  "action",
  "ask",
  "budget",
  "concern",
  "deadline",
  "demo",
  "follow",
  "meeting",
  "need",
  "next",
  "renew",
  "risk",
  "schedule",
  "want",
];

const THINKING_STEP_MS = 950;
const DAY_MS = 24 * 60 * 60 * 1000;
const THINKING_STEPS_BY_INTENT = {
  memory_update: [
    "Updating customer memory...",
    "Resolving correction fields...",
    "Applying verified memory patch...",
    "Saving updated client memory...",
  ],
  article_generation: [
    "Analyzing uploaded notes...",
    "Drafting source-article structure...",
    "Cross-referencing key commitments...",
    "Indexing article for retrieval...",
  ],
  follow_up: [
    "Gathering latest customer context...",
    "Composing follow-up draft...",
    "Tailoring tone and details...",
    "Preparing signature and action items...",
  ],
  customer_message: [
    "Reading customer context...",
    "Running intent analysis...",
    "Preparing advisor-ready answer...",
    "Finalizing response draft...",
  ],
  general: [
    "Pulling from memory...",
    "Reading saved sources...",
    "Checking customer context...",
    "Drafting response...",
  ],
};
const MIN_THINKING_MS_BY_INTENT = Object.fromEntries(
  Object.entries(THINKING_STEPS_BY_INTENT).map(([intent, steps]) => [intent, steps.length * THINKING_STEP_MS])
);
const DEFAULT_THINKING_INTENT = "general";

function getThinkingStepsForIntent(intent) {
  return THINKING_STEPS_BY_INTENT[intent] ?? THINKING_STEPS_BY_INTENT.general;
}

function pickRandomStepIndex(stepCount, currentIndex = -1) {
  if (stepCount <= 1) return 0;
  const next = Math.floor(Math.random() * stepCount);
  return next === currentIndex ? (next + 1) % stepCount : next;
}

function getThinkingIntentForPrompt(text, hasArticleCandidate, customer = null, history = []) {
  if (parseCustomerRecordUpdateRequest(text, customer, history)) return "memory_update";
  if (parseMemoryUpdateRequest(text)) return "memory_update";
  if (isArticleGenerationRequest(text, hasArticleCandidate)) return "article_generation";
  return "customer_message";
}
const MEMORY_UPDATE_VERB_PATTERN = /\b(update|change|correct|fix|amend|edit|revise)\b/i;
const MEMORY_TARGET_PATTERN = /\b(memory|remembered|client record|customer record|saved record|profile|article|source file|saved source|knowledge)\b/i;

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function waitForThinkingSequence(startedAt, intent = DEFAULT_THINKING_INTENT) {
  const remaining = (MIN_THINKING_MS_BY_INTENT[intent] ?? MIN_THINKING_MS_BY_INTENT.general) - (Date.now() - startedAt);
  if (remaining <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

function formatMemoryDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function cleanText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function parseDateOnly(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function getNextAnnualDate(value, today = new Date()) {
  const sourceDate = parseDateOnly(value);
  if (!sourceDate) return null;

  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const month = sourceDate.getUTCMonth();
  const day = sourceDate.getUTCDate();
  let nextDate = new Date(Date.UTC(todayUtc.getUTCFullYear(), month, day));
  if (nextDate < todayUtc) {
    nextDate = new Date(Date.UTC(todayUtc.getUTCFullYear() + 1, month, day));
  }

  return {
    date: nextDate,
    daysUntil: Math.round((nextDate.getTime() - todayUtc.getTime()) / DAY_MS),
  };
}

function getDaysUntilDate(value, today = new Date()) {
  const date = parseDateOnly(value);
  if (!date) return null;
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return Math.round((date.getTime() - todayUtc.getTime()) / DAY_MS);
}

function formatMonthDay(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getRelationshipLead(customer) {
  const nextAction = customer.task || customer.nextAction;
  if (nextAction) return `the next action: ${nextAction}`;
  if (customer.nextRenewalPolicyType) return `the ${customer.nextRenewalPolicyType} review`;
  return "the client conversation";
}

function extractRapportInsight(customer, memories = []) {
  const text = [
    customer.rapportNotes,
    ...memories.flatMap((memory) => [memory.summary, memory.body]),
  ]
    .filter(Boolean)
    .join(" ");

  if (!text) return "";

  const blockedPattern =
    /\b(policy|premium|sum assured|net worth|income|risk tolerance|fact-find|last direct contact|prefers|client since|estate planning|kyc|renewal|will in place)\b/i;
  const rapportPattern =
    /\b(avid|baking|badminton|cycling|durian|enthusiast|fan|garden|guitar|hobby|karaoke|learning|likes|loves|picked up|plays|regular|training|vinyl)\b/i;

  const candidates = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanText(sentence).replace(/^["']+|["']+$/g, ""))
    .filter((sentence) => sentence.length >= 24 && sentence.length <= 180)
    .filter((sentence) => rapportPattern.test(sentence) && !blockedPattern.test(sentence))
    .map((sentence) => ({
      sentence,
      score:
        (/\b(recently|training|learning|picked up|avid|enthusiast)\b/i.test(sentence) ? 3 : 0) +
        (/\b(durian|birthday|festival|baking|cycling|badminton|guitar)\b/i.test(sentence) ? 2 : 0) +
        (sentence.length < 120 ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.sentence ?? "";
}

function buildCustomerIcebreakerMessage(customer, memories = []) {
  const lead = getRelationshipLead(customer);
  const birthday = getNextAnnualDate(customer.dateOfBirth);
  const nextLifeEventDays = getDaysUntilDate(customer.nextLifeEventDate);

  if (birthday && birthday.daysUntil <= 45) {
    return `Reminder: ${customer.name}'s birthday is ${formatMonthDay(birthday.date)}. Open with a quick birthday note, then move into ${lead}.`;
  }

  if (customer.nextLifeEvent && nextLifeEventDays !== null && nextLifeEventDays >= 0 && nextLifeEventDays <= 90) {
    return `Useful opener: ${customer.nextLifeEvent} is coming up on ${formatMonthDay(parseDateOnly(customer.nextLifeEventDate))}. Acknowledge that first, then move into ${lead}.`;
  }

  const rapportInsight = extractRapportInsight(customer, memories);
  if (rapportInsight) {
    return `Useful opener: ${rapportInsight.replace(/[.!?]+$/, "")}. Use that to break the ice before moving into ${lead}.`;
  }

  if (customer.nextRenewal) {
    const renewalDate = parseDateOnly(customer.nextRenewal);
    if (renewalDate) {
      return `Useful reminder: ${customer.nextRenewalPolicyType || "Policy"} renewal is coming up on ${formatMonthDay(renewalDate)}. Start with a warm check-in, then move into the review.`;
    }
  }

  return `I have ${customer.name}'s account context ready. Start with a warm check-in, then ask for a recap, renewal plan, risk summary, or follow-up email.`;
}

function buildCustomerSeedMessage(customer, memories = []) {
  const customerMemories = memories.filter((memory) => String(memory.customerId ?? "") === String(customer.id ?? ""));
  return {
    id: "seed-1",
    role: "assistant",
    text: buildCustomerIcebreakerMessage(customer, customerMemories),
  };
}

function cleanCorrectionValue(value) {
  return cleanText(value)
    .replace(/^(?:from|to|as|is|was|be)\s+/i, "")
    .replace(/\s+(?:in|on)\s+(?:the\s+)?(?:memory|record|profile|saved sources?)$/i, "")
    .replace(/\s+(?:please|thanks|thank you)$/i, "")
    .replace(/^[`"']+|[`"'.!?]+$/g, "")
    .trim();
}

function isValidCorrectionValue(value) {
  return value.length > 0 && value.length <= 120;
}

function cleanCorrectionSubject(value) {
  return cleanText(value)
    .replace(MEMORY_UPDATE_VERB_PATTERN, "")
    .replace(MEMORY_TARGET_PATTERN, "")
    .replace(/\b(?:the|a|an|this|that|client|customer|please|can you|could you|it|his|her|their)\b/gi, " ")
    .replace(/\b(?:from|to|as|is|was|be|says|shows|listed|stored|recorded)\b\s*$/i, "")
    .replace(/[.?!:;,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCorrectionSubject(subject) {
  const cleaned = cleanCorrectionSubject(subject);
  if (!cleaned) return "Memory";
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function normalizeMemoryComparable(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseMemoryUpdateRequest(text) {
  const raw = cleanText(text);
  if (!raw) return null;

  const asksForUpdate =
    MEMORY_UPDATE_VERB_PATTERN.test(raw) ||
    /\b(save|remember|set)\b/i.test(raw) ||
    /\bactually\b/i.test(raw) ||
    /\b(?:not|instead of)\b/i.test(raw);

  if (!asksForUpdate) return null;

  const patterns = [
    {
      regex:
        /([\s\S]{1,140}?)\b(?:is|was|says|shows|listed as|stored as|recorded as|=)\s+([\s\S]+?)\s+\b(?:but\s+)?(?:it'?s|it is|that'?s|that is|should be|is)?\s*actually\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: 1,
      oldIndex: 2,
      nextIndex: 3,
    },
    {
      regex:
        /\b(?:update|change|correct|fix|amend|edit|revise)\b([\s\S]{0,140}?)\bfrom\s+([\s\S]+?)\s+\bto\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: 1,
      oldIndex: 2,
      nextIndex: 3,
    },
    {
      regex:
        /([\s\S]{1,140}?)\b(?:should be|is|=)\s+([\s\S]+?)\s+\b(?:not|instead of)\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: 1,
      oldIndex: 3,
      nextIndex: 2,
    },
    {
      regex:
        /([\s\S]{0,140}?)\bactually\s+([\s\S]+?)\s+\b(?:not|instead of)\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: 1,
      oldIndex: 3,
      nextIndex: 2,
    },
    {
      regex: /\bfrom\s+([\s\S]+?)\s+\bto\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: null,
      oldIndex: 1,
      nextIndex: 2,
    },
    {
      regex:
        /\b(?:update|change|correct|fix|amend|edit|revise|save|remember|set)\b([\s\S]{0,140}?)\b(?:to|as|is)\s+([\s\S]+?)(?:[.!?]|$)/i,
      subjectIndex: 1,
      oldIndex: null,
      nextIndex: 2,
    },
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern.regex);
    if (!match) continue;

    const subject = pattern.subjectIndex ? cleanCorrectionSubject(match[pattern.subjectIndex]) : "";
    const oldValue = pattern.oldIndex ? cleanCorrectionValue(match[pattern.oldIndex]) : "";
    const nextValue = cleanCorrectionValue(match[pattern.nextIndex]);
    const hasValidReplacement =
      isValidCorrectionValue(oldValue) &&
      normalizeMemoryComparable(oldValue) !== normalizeMemoryComparable(nextValue);
    const hasValidNewFact = !oldValue && Boolean(subject) && isValidCorrectionValue(nextValue);

    if (isValidCorrectionValue(nextValue) && (hasValidReplacement || hasValidNewFact)) {
      return {
        subject,
        fieldLabel: formatCorrectionSubject(subject),
        oldValue,
        nextValue,
      };
    }
  }

  return null;
}

function getReplacementPatterns(value) {
  const cleaned = cleanCorrectionValue(value);
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return [];

  const patternFromParts = (tokens) =>
    tokens
      .map((token) => {
        const ordinal = token.match(/^(\d{1,2})(?:st|nd|rd|th)?$/i);
        if (ordinal) return `${ordinal[1]}(?:st|nd|rd|th)?`;
        return escapeRegExp(token);
      })
      .join("[\\s,./-]+");

  const patterns = [new RegExp(patternFromParts(parts), "i")];
  const dayMonth = cleaned.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)$/i);
  if (dayMonth) {
    patterns.push(new RegExp(`${escapeRegExp(dayMonth[2])}[\\s,./-]+${dayMonth[1]}(?:st|nd|rd|th)?`, "i"));
  }
  const monthDay = cleaned.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i);
  if (monthDay) {
    patterns.push(new RegExp(`${monthDay[2]}(?:st|nd|rd|th)?[\\s,./-]+${escapeRegExp(monthDay[1])}`, "i"));
  }

  return patterns;
}

function replaceCorrectionValue(text, oldValue, nextValue) {
  const source = String(text ?? "");
  if (!source) return { text: source, changed: false };

  for (const pattern of getReplacementPatterns(oldValue)) {
    const updated = source.replace(pattern, nextValue);
    if (updated !== source) return { text: updated, changed: true };
  }

  return { text: source, changed: false };
}

function scoreSourceForCorrection(memory, correction) {
  const haystack = [
    memory.title,
    memory.summary,
    memory.body,
    memory.sourceName,
    memory.sourceMeta,
  ].join("\n");
  const normalizedHaystack = normalizeMemoryComparable(haystack);
  const normalizedOldValue = normalizeMemoryComparable(correction.oldValue);
  if (!normalizedOldValue || !normalizedHaystack.includes(normalizedOldValue)) return 0;

  const subjectTerms = normalizeMemoryComparable(correction.subject)
    .split(" ")
    .filter((term) => term.length > 2);
  const subjectScore = subjectTerms.reduce(
    (total, term) => total + (normalizedHaystack.includes(term) ? 2 : 0),
    0
  );

  return [
    20,
    Math.min(subjectScore, 10),
    memory.kind === "profile" ? 3 : 0,
    memory.kind === "article" ? 2 : 0,
    memory.kind === "chat" ? -3 : 0,
  ].reduce((total, score) => total + score, 0);
}

function amendMemoryWithCorrection(memory, correction) {
  const nextMemory = { ...memory };
  const changedFields = [];

  for (const key of ["title", "summary", "body"]) {
    const result = replaceCorrectionValue(nextMemory[key], correction.oldValue, correction.nextValue);
    if (result.changed) {
      nextMemory[key] = result.text;
      changedFields.push(key);
    }
  }

  if (!changedFields.length) return null;
  return { memory: nextMemory, changedFields };
}

function amendArticleWithCorrection(article, correction) {
  const nextArticle = { ...article };
  const changedFields = [];

  for (const key of ["title", "subtitle", "body", "sourceName"]) {
    const result = replaceCorrectionValue(nextArticle[key], correction.oldValue, correction.nextValue);
    if (result.changed) {
      nextArticle[key] = result.text;
      changedFields.push(key);
    }
  }

  if (!changedFields.length) return null;
  return { article: nextArticle, changedFields };
}

function buildKnowledgeUpdatedMessage({ correction, memory, article }) {
  return {
    type: "memory-updated",
    text: article ? "Article updated" : "Memory updated",
    detail: correction.oldValue
      ? `${correction.fieldLabel}: ${correction.oldValue} -> ${correction.nextValue}`
      : `${correction.fieldLabel}: ${correction.nextValue}`,
    source: article?.title ? `Updated ${article.title}` : memory?.title ? `Updated ${memory.title}` : "",
  };
}

const MONTH_INDEX_BY_NAME = new Map(
  [
    ["jan", 1],
    ["january", 1],
    ["feb", 2],
    ["february", 2],
    ["mar", 3],
    ["march", 3],
    ["apr", 4],
    ["april", 4],
    ["may", 5],
    ["jun", 6],
    ["june", 6],
    ["jul", 7],
    ["july", 7],
    ["aug", 8],
    ["august", 8],
    ["sep", 9],
    ["sept", 9],
    ["september", 9],
    ["oct", 10],
    ["october", 10],
    ["nov", 11],
    ["november", 11],
    ["dec", 12],
    ["december", 12],
  ]
);

function toIsoDate(year, month, day) {
  const yyyy = Number(year);
  const mm = Number(month);
  const dd = Number(day);
  if (yyyy < 1900 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (date.getUTCFullYear() !== yyyy || date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) return "";
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function extractDateOfBirthValue(text, currentDateOfBirth = "") {
  const raw = cleanText(text);
  const matches = [];

  for (const match of raw.matchAll(/\b((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    const value = toIsoDate(match[1], match[2], match[3]);
    if (value) matches.push({ value, raw: match[0] });
  }

  for (const match of raw.matchAll(/\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+((?:19|20)\d{2})\b/gi)) {
    const month = MONTH_INDEX_BY_NAME.get(match[1].toLowerCase());
    const value = month ? toIsoDate(match[3], month, match[2]) : "";
    if (value) matches.push({ value, raw: match[0] });
  }

  for (const match of raw.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})[,]?\s+((?:19|20)\d{2})\b/gi)) {
    const month = MONTH_INDEX_BY_NAME.get(match[2].toLowerCase());
    const value = month ? toIsoDate(match[3], month, match[1]) : "";
    if (value) matches.push({ value, raw: match[0] });
  }

  for (const match of raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-]((?:19|20)\d{2})\b/g)) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const value = toIsoDate(match[3], month, day);
    if (value) matches.push({ value, raw: match[0] });
  }

  if (matches.length) return { value: matches.at(-1).value, raw: matches.at(-1).raw };

  const yearMatches = [...raw.matchAll(/\b((?:19|20)\d{2})\b/g)];
  const currentParts = String(currentDateOfBirth ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yearMatches.length && currentParts) {
    const year = yearMatches.at(-1)[1];
    return { value: toIsoDate(year, currentParts[2], currentParts[3]), raw: year };
  }

  if (yearMatches.length) {
    return { needsFullDate: true, raw: yearMatches.at(-1)[1] };
  }

  return null;
}

function extractDateValue(text, currentValue = "") {
  const parsedDate = extractDateOfBirthValue(text, currentValue);
  if (!parsedDate?.value) return parsedDate;
  return parsedDate;
}

function normalizeSelectValue(value, options) {
  const normalized = normalizeMemoryComparable(value);
  if (!normalized) return "";
  const exact = options.find((option) => normalizeMemoryComparable(option) === normalized);
  if (exact) return exact;
  return options.find((option) => {
    const normalizedOption = normalizeMemoryComparable(option);
    return normalized.includes(normalizedOption) || normalizedOption.includes(normalized);
  }) ?? cleanCorrectionValue(value);
}

function normalizeBooleanValue(value) {
  const normalized = normalizeMemoryComparable(value);
  if (/\b(yes|true|y|has|have|with|active|enabled|done|completed)\b/.test(normalized)) return true;
  if (/\b(no|false|n|none|without|not|disabled|incomplete|pending)\b/.test(normalized)) return false;
  return null;
}

function normalizeIntegerValue(value) {
  const match = String(value ?? "").match(/\b\d+\b/);
  if (!match) return null;
  return Number(match[0]);
}

const CUSTOMER_RECORD_FIELD_DEFINITIONS = [
  {
    field: "email",
    label: "Email",
    aliases: ["email", "email address", "e-mail"],
    type: "email",
  },
  {
    field: "phone",
    label: "Phone",
    aliases: ["phone", "phone number", "mobile", "mobile number", "contact number"],
  },
  {
    field: "contactName",
    label: "Contact name",
    aliases: ["contact name", "contact person", "primary contact"],
  },
  {
    field: "dateOfBirth",
    label: "Date of birth",
    aliases: ["birth date", "birthdate", "birth year", "birthyear", "date of birth", "dob", "born"],
    type: "dateOfBirth",
  },
  {
    field: "gender",
    label: "Gender",
    aliases: ["gender", "sex"],
    options: ["Male", "Female", "Other"],
  },
  {
    field: "maritalStatus",
    label: "Marital status",
    aliases: ["marital status", "marriage status", "relationship status"],
    options: ["Single", "Married", "Divorced", "Widowed"],
  },
  {
    field: "occupation",
    label: "Occupation",
    aliases: ["occupation", "job", "job title", "profession", "role"],
  },
  {
    field: "dependents",
    label: "Dependents",
    aliases: ["dependents", "number of dependents", "children"],
    type: "integer",
  },
  {
    field: "nationality",
    label: "Nationality",
    aliases: ["nationality", "citizenship"],
  },
  {
    field: "advisorId",
    label: "Advisor",
    aliases: ["advisor", "advisor id", "assigned advisor", "assigned advisor id", "owner"],
  },
  {
    field: "clientSince",
    label: "Client since",
    aliases: ["client since", "client since date", "became client", "onboarded"],
    type: "date",
  },
  {
    field: "acquisitionChannel",
    label: "Acquisition channel",
    aliases: ["acquisition channel", "source channel", "lead source"],
  },
  {
    field: "referredBy",
    label: "Referred by",
    aliases: ["referred by", "referrer", "referral source"],
  },
  {
    field: "annualIncomeBracket",
    label: "Annual income bracket",
    aliases: ["annual income", "income bracket", "income"],
  },
  {
    field: "netWorthBracket",
    label: "Net worth bracket",
    aliases: ["net worth", "net worth bracket"],
  },
  {
    field: "riskTolerance",
    label: "Risk tolerance",
    aliases: ["risk tolerance", "risk profile", "risk appetite", "risk"],
    options: ["Conservative", "Moderate", "Aggressive"],
  },
  {
    field: "investmentHorizonYears",
    label: "Investment horizon",
    aliases: ["investment horizon", "investment horizon years", "horizon years"],
    type: "integer",
  },
  {
    field: "liabilitiesSummary",
    label: "Liabilities summary",
    aliases: ["liabilities", "liabilities summary", "debt summary"],
    type: "longText",
  },
  {
    field: "hasWill",
    label: "Has will",
    aliases: ["has will", "will status", "will"],
    type: "boolean",
  },
  {
    field: "estatePlanStatus",
    label: "Estate plan status",
    aliases: ["estate plan", "estate plan status", "estate planning status"],
  },
  {
    field: "businessOwnership",
    label: "Business ownership",
    aliases: ["business ownership", "owns business", "business owner"],
    type: "boolean",
  },
  {
    field: "intendedHeirs",
    label: "Intended heirs",
    aliases: ["intended heirs", "heirs", "beneficiaries"],
    type: "longText",
  },
  {
    field: "lastContactDate",
    label: "Last contact date",
    aliases: ["last contact", "last contact date", "last touch date"],
    type: "date",
  },
  {
    field: "preferredCommunicationChannel",
    label: "Preferred communication channel",
    aliases: ["preferred communication channel", "communication channel", "preferred channel", "channel"],
    options: ["Email", "Phone call", "WhatsApp"],
  },
  {
    field: "rapportNotes",
    label: "Rapport notes",
    aliases: ["rapport notes", "rapport", "relationship notes"],
    type: "longText",
  },
  {
    field: "kycStatus",
    label: "KYC status",
    aliases: ["kyc", "kyc status", "know your customer status"],
    options: ["Pending", "In progress", "Completed"],
  },
  {
    field: "lastFactFindDate",
    label: "Last fact-find date",
    aliases: ["last fact find", "last fact-find", "fact find date", "fact-find date", "last fact find date"],
    type: "date",
  },
  {
    field: "consentMarketing",
    label: "Marketing consent",
    aliases: ["marketing consent", "consent marketing", "marketing opt in", "marketing opt-in"],
    type: "boolean",
  },
  {
    field: "policyCount",
    label: "Policy count",
    aliases: ["policy count", "number of policies"],
    type: "integer",
  },
  {
    field: "policySummary",
    label: "Policy summary",
    aliases: ["policy summary", "policies summary"],
    type: "longText",
  },
  {
    field: "nextRenewal",
    label: "Next renewal",
    aliases: ["next renewal", "renewal date", "next renewal date"],
    type: "date",
  },
  {
    field: "nextRenewalPolicyType",
    label: "Next renewal policy type",
    aliases: ["next renewal policy type", "renewal policy type", "next renewal type"],
  },
  {
    field: "nextLifeEvent",
    label: "Next life event",
    aliases: ["next life event", "life event"],
  },
  {
    field: "nextLifeEventDate",
    label: "Next life event date",
    aliases: ["next life event date", "life event date"],
    type: "date",
  },
];

function buildFieldPattern(definition) {
  return new RegExp(
    `\\b(?:${definition.aliases.map(escapeRegExp).join("|")})\\b`,
    "i"
  );
}

function getCustomerRecordFieldDefinition(text) {
  return [...CUSTOMER_RECORD_FIELD_DEFINITIONS]
    .sort((a, b) => Math.max(...b.aliases.map((alias) => alias.length)) - Math.max(...a.aliases.map((alias) => alias.length)))
    .find((definition) => buildFieldPattern(definition).test(text)) ?? null;
}

function inferCustomerRecordFieldFromHistory(history = []) {
  const recentText = [...history]
    .reverse()
    .slice(0, 6)
    .map((message) => message?.text ?? "")
    .filter(Boolean)
    .join("\n");

  return getCustomerRecordFieldDefinition(recentText);
}

function extractRawRecordFieldValue(text, definition) {
  const fieldPattern = `(?:${definition.aliases.map(escapeRegExp).join("|")})`;
  const patterns = [
    new RegExp(`\\b${fieldPattern}\\b\\s*(?::|=)\\s*([\\s\\S]+)$`, "i"),
    new RegExp(`\\b${fieldPattern}\\b[\\s\\S]{0,50}?\\b(?:is|are|as|to|=|should be|actually|now)\\s+([\\s\\S]+)$`, "i"),
    new RegExp(`\\b(?:update|change|correct|fix|amend|edit|revise|save|remember|set)\\b[\\s\\S]{0,80}?\\b${fieldPattern}\\b[\\s\\S]{0,40}?\\b(?:to|as|=|is)\\s+([\\s\\S]+)$`, "i"),
    new RegExp(`\\b(?:has|have)\\s+([\\s\\S]{1,40}?)\\s+\\b${fieldPattern}\\b`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanCorrectionValue(match[1]);
  }

  return "";
}

function normalizeCustomerRecordValue(rawValue, definition, customer) {
  if (definition.type !== "boolean" && /\b(?:clear|remove|delete|blank|empty|none|unknown|not recorded)\b/i.test(rawValue)) {
    return "";
  }

  if (definition.type === "dateOfBirth") {
    const parsedDate = extractDateOfBirthValue(rawValue, customer?.dateOfBirth);
    if (!parsedDate?.value && !parsedDate?.needsFullDate) return null;
    return parsedDate;
  }

  if (definition.type === "date") {
    const parsedDate = extractDateValue(rawValue, customer?.[definition.field]);
    if (!parsedDate?.value) return null;
    return parsedDate.value;
  }

  if (definition.type === "integer") {
    return normalizeIntegerValue(rawValue);
  }

  if (definition.type === "boolean") {
    return normalizeBooleanValue(rawValue);
  }

  if (definition.type === "email") {
    const match = rawValue.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    return match ? match[0] : null;
  }

  if (definition.options) {
    const normalizedOption = normalizeSelectValue(rawValue, definition.options);
    return definition.options.includes(normalizedOption) ? normalizedOption : null;
  }

  const cleaned = cleanCorrectionValue(rawValue);
  if (!cleaned) return null;
  return definition.type === "longText" ? cleaned.slice(0, 2000) : cleaned.slice(0, 240);
}

function parseCustomerRecordUpdateRequest(text, customer, history = []) {
  const raw = cleanText(text);
  if (!raw) return null;
  if (/\?$/.test(raw) || /\b(?:what|when|show|tell|check|look up|find)\b/i.test(raw)) return null;
  if (!/\b(?:update|change|correct|fix|amend|edit|revise|save|remember|set|actually|should be|is|are|has|have|=)\b/i.test(raw)) {
    return null;
  }

  const definition = getCustomerRecordFieldDefinition(raw) ?? inferCustomerRecordFieldFromHistory(history);
  if (!definition) return null;

  const rawValue = extractRawRecordFieldValue(raw, definition) || raw;
  if (!rawValue) return null;

  const normalizedValue = normalizeCustomerRecordValue(rawValue, definition, customer);
  if (normalizedValue === null || normalizedValue === undefined) return null;

  const nextValue =
    definition.type === "dateOfBirth" && typeof normalizedValue === "object"
      ? normalizedValue.value
      : normalizedValue;
  const needsFullDate =
    definition.type === "dateOfBirth" &&
    typeof normalizedValue === "object" &&
    normalizedValue.needsFullDate;

  return {
    field: definition.field,
    fieldLabel: definition.label,
    oldValue: customer?.[definition.field] ?? "",
    nextValue,
    displayValue: rawValue,
    needsFullDate,
  };
}

function getRecordUpdateDisplayValue(correction) {
  if (correction.field === "dateOfBirth") {
    const displayValue = cleanText(correction.displayValue);
    if (/^(?:19|20)\d{2}$/.test(displayValue)) {
      return displayValue;
    }
  }

  return correction.nextValue;
}

function getRecordUpdateLabel(correction) {
  if (correction.field === "dateOfBirth") {
    const displayValue = cleanText(correction.displayValue);
    if (/^(?:19|20)\d{2}$/.test(displayValue)) {
      return "Birth year";
    }
  }

  return correction.fieldLabel;
}

function buildRecordUpdatedMessage({ correction }) {
  const label = getRecordUpdateLabel(correction);
  const value = getRecordUpdateDisplayValue(correction);

  return {
    type: "record-updated",
    text: `${label} updated to ${value}`,
  };
}



function summarizeText(rawText, fallback) {
  const text = cleanText(rawText);
  if (!text) return fallback;

  const sentences = text
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => cleanText(sentence))
    .filter(Boolean) ?? [text];

  const priority = sentences.find((sentence) => {
    const lower = sentence.toLowerCase();
    return ACTION_WORDS.some((word) => lower.includes(word));
  });
  const picked = [priority ?? sentences[0], ...sentences.filter((sentence) => sentence !== priority).slice(0, 1)];
  const summary = cleanText(picked.join(" "));

  if (summary.length <= 280) return summary;
  return `${summary.slice(0, 280).replace(/\s+\S*$/, "")}...`;
}

function isTextLikeFile(file) {
  return (
    file.type?.startsWith("text/") ||
    ["application/json", "application/xml", "application/csv"].includes(file.type) ||
    /\.(txt|md|csv|json|log)$/i.test(file.name)
  );
}

async function readFileText(file) {
  if (!isTextLikeFile(file)) return "";
  try {
    return (await file.text()).slice(0, 24000);
  } catch {
    return "";
  }
}

function isMeetingMinutesUpload(fileName, text) {
  const haystack = `${fileName} ${text}`.toLowerCase();
  return /\b(meeting|minutes|transcript|call notes|advisor notes|agenda|action items?)\b/.test(haystack);
}

function isArticleGenerationRequest(text, hasCandidate = false) {
  const lower = text.toLowerCase();
  const asksForArticle = /\b(article|internal article|source file|knowledge article|knowledge base|write[- ]?up)\b/.test(lower);
  const acceptsPrompt = hasCandidate && /^(yes|yeah|yep|sure|ok|okay|please|do it|go ahead|create it|generate it)\b/.test(lower);
  return asksForArticle || acceptsPrompt;
}

function describeMeetingUpload(fileName, body) {
  const haystack = `${fileName} ${body}`.toLowerCase();
  if (/\b(action items?|attendees|agenda|minutes)\b/.test(haystack)) return "Raw client meeting minutes";
  if (/\b(transcript|speaker|recording)\b/.test(haystack)) return "Client meeting transcript";
  return "Advisor meeting notes";
}

function buildMeetingUploadMessage({ customer, memory }) {
  const documentType = describeMeetingUpload(memory.sourceName || memory.title, memory.body || memory.summary);
  const contactName = customer.contactName || customer.name;

  return {
    text: [
      `I saved **${memory.sourceName || memory.title}** as meeting context for ${customer.name}.`,
      "",
      `**What it is**`,
      `${documentType} with client context, commitments, and follow-up signals for ${contactName}.`,
      "",
      `**Summary**`,
      memory.summary || "I could not extract a useful text summary from this file yet.",
      "",
      `**Suggestions**`,
      `- Draft a client follow-up email from the commitments and next steps.`,
      `- Review action items, risks, and dates before updating the advisor workflow.`,
    ].join("\n"),
    suggestions: [
      {
        id: `followup-${memory.id}`,
        label: "Draft follow-up",
        action: "draft-follow-up",
      },
      {
        id: `actions-${memory.id}`,
        label: "Review actions",
        action: "send-prompt",
        prompt: `Review the action items, risks, important dates, and recommended next steps from ${memory.sourceName || memory.title}.`,
      },
    ],
  };
}

function upsertArticleList(articles, article) {
  const next = [article, ...articles.filter((item) => item.id !== article.id)];
  return next.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));
}

function CustomerChatIconButton({ label, children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.04] disabled:pointer-events-none disabled:opacity-35",
        className
      )}
    >
      {children}
    </button>
  );
}

function CustomerChatComposer({
  customer,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  onAttach,
  onDraft,
  sending,
  model,
  onModelChange,
}) {
  const [open, setOpen] = useState(false);

  const modelLabels = {
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
  };

  return (
    <div className="flex h-[140px] w-[700px] max-w-full flex-col items-stretch justify-start px-4 pb-[24px]">
      <div className="relative flex h-[116px] w-full flex-col rounded-[14px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] focus-within:shadow-[inset_0_0_0_1px_rgba(38,109,240,0.28),0_8px_24px_rgba(28,40,64,0.08)]">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Ask about ${customer.name}...`}
          className="w-full flex-1 resize-none bg-transparent px-5 py-4 text-[15px] font-medium leading-5 text-[#101112] outline-none placeholder:text-black/45"
        />
        <div className="flex h-11 items-end justify-between gap-3 p-2">
          <div className="flex min-w-0 items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[13px] font-medium leading-5 text-[#266df0] hover:bg-black/[0.04] transition-colors"
              >
                <span>{modelLabels[model] || "Auto"}</span>
                <ChevronDown className="size-3 text-[#266df0]/70" />
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-1.5 z-50 w-48 rounded-lg bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onModelChange("deepseek-chat");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "deepseek-chat" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      DeepSeek Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onModelChange("deepseek-reasoner");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "deepseek-reasoner" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      DeepSeek Reasoner
                    </button>
                  </div>
                </>
              )}
            </div>
            <CustomerChatIconButton label="Attach file" onClick={onAttach}>
              <Plus className="size-3.5" strokeWidth={1.9} />
            </CustomerChatIconButton>
            <button
              type="button"
              onClick={onAttach}
              className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium leading-5 text-black/55 transition-colors hover:bg-black/[0.04]"
            >
              <Paperclip className="size-3.5" strokeWidth={1.9} />
              Minutes
            </button>
            <button
              type="button"
              onClick={onDraft}
              disabled={sending}
              className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium leading-5 text-black/55 transition-colors hover:bg-black/[0.04] disabled:pointer-events-none disabled:opacity-35"
            >
              <Sparkles className="size-3.5" strokeWidth={1.9} />
              Draft
            </button>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            aria-label="Send message"
            disabled={!value.trim() || sending}
            className="flex size-7 items-center justify-center rounded-lg bg-[#266df0] p-[7px] text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(38,109,240,0.24)] transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-3.5" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}

function renderMessageText(text, isAssistant = false) {
  if (!text) return "";
  const parts = text.split("**");
  let wordIndex = 0;

  return parts.flatMap((part, partIndex) => {
    const isBold = partIndex % 2 === 1;
    const tokens = part.split(/(\s+)/);

    return tokens.map((token, tokenIndex) => {
      if (!token) return null;
      if (/^\s+$/.test(token)) {
        return <span key={`space-${partIndex}-${tokenIndex}`}>{token}</span>;
      }

      const currentWordIndex = wordIndex;
      wordIndex += 1;

      const style = isAssistant
        ? {
            animationDelay: `${currentWordIndex * 15}ms`,
          }
        : undefined;

      return (
        <span
          key={`word-${partIndex}-${tokenIndex}`}
          style={style}
          className={`${isBold ? "font-semibold" : ""} ${
            isAssistant ? "inline-block animate-grok-fade opacity-0" : ""
          }`}
        >
          {token}
        </span>
      );
    });
  });
}

function parseEmailDraft(text) {
  if (!text) return null;

  const lines = text.split("\n");
  let subjectLineIndex = -1;
  let subjectText = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^(?:\*\*|\*|)?Subject(?:\*\*|\*|)?:\s*(.+)$/i);
    if (match) {
      subjectLineIndex = i;
      subjectText = match[1].replace(/[\*\_\#]+/g, "").trim();
      break;
    }
  }

  if (subjectLineIndex === -1) return null;

  const preText = lines.slice(0, subjectLineIndex).join("\n").trim();
  const bodyLines = lines.slice(subjectLineIndex + 1);
  let bodyText = bodyLines.join("\n").trim();

  let postText = "";
  const postTextIndex = bodyText.search(/\n\s*(?:Next step|Sources|Source):\s*/i);
  if (postTextIndex !== -1) {
    postText = bodyText.substring(postTextIndex).trim();
    bodyText = bodyText.substring(0, postTextIndex).trim();
  }

  return {
    preText,
    subject: subjectText,
    body: bodyText,
    postText,
  };
}

function formatBodyToHtml(rawText) {
  if (!rawText) return "";

  const paragraphs = rawText.split(/\n\n+/);

  return paragraphs
    .map((p) => {
      let escaped = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

      escaped = escaped.replace(/\[([^\]]+)\]/g, (match) => {
        return `<span class="text-[#0d0d0d] bg-[#266df0]/10 border border-[#266df0]/20 cursor-text rounded-md px-1 py-0.5 font-medium select-all">${match}</span>`;
      });

      escaped = escaped.replace(/\n/g, "<br />");

      return `<p class="mb-4 last:mb-0 leading-[26px]">${escaped}</p>`;
    })
    .join("");
}

function EmailDraftBlock({ initialSubject, initialBody }) {
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

  return (
    <div className="my-4 w-[768px] max-w-full font-sans text-left">
      <div className="relative isolate w-full overflow-clip rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_4px_80px_rgba(0,0,0,0.02)] h-[559px] flex flex-col">
        {/* Subject */}
        <div className="pt-6 pb-3 pr-10 pl-5 shrink-0">
          <div className="grid">
            <textarea
              ref={subjectRef}
              defaultValue={initialSubject}
              className="col-start-1 col-end-2 row-start-1 row-end-2 w-full resize-none overflow-hidden p-0 border-none bg-transparent text-[22px] font-semibold text-[#0d0d0d] leading-normal placeholder:text-[#9b9b9b] focus:ring-0 focus:outline-hidden"
              aria-label="Subject"
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-[0.5px] border-black/[0.08] mx-5 my-0" />

        {/* Body Editor */}
        <div className="flex-1 overflow-y-auto pt-4 pb-4 pr-10 pl-5 min-h-0">
          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            className="ProseMirror w-full break-words focus:outline-none text-[15px] leading-[26px] text-[#0d0d0d] font-sans"
            dangerouslySetInnerHTML={{ __html: formatBodyToHtml(initialBody) }}
          />
        </div>
      </div>
    </div>
  );
}

function MessageSuggestions({ suggestions = [], onSuggestion }) {
  if (!suggestions.length) return null;

  return (
    <div className="mt-3 flex max-w-full flex-wrap gap-2">
      {suggestions.map((suggestion) => {
        const SuggestionIcon =
          suggestion.action === "create-article" ? FileText : suggestion.action === "draft-follow-up" ? Mail : Check;

        return (
          <button
            key={suggestion.id || suggestion.label}
            type="button"
            onClick={() => onSuggestion?.(suggestion)}
            className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 text-[13px] font-medium leading-none text-[#101112] shadow-[0_1px_2px_rgba(28,40,64,0.04)] transition-colors hover:bg-[#f6f7f9]"
          >
            <SuggestionIcon className="size-3.5 shrink-0 text-[#266df0]" strokeWidth={1.9} />
            <span className="truncate">{suggestion.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CustomerChatMessage({ message, onSuggestion }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-xl bg-[#f1f1f1] px-3.5 py-2 text-[14px] font-normal leading-5 text-[#101112]">
          {renderMessageText(message.text, false)}
        </div>
      </div>
    );
  }

  if (message.type === "memory-updated" || message.type === "record-updated") {
    const isRecordUpdate = message.type === "record-updated";
    return (
      <div className="group flex w-full items-start gap-2.5">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f7ee] text-[#16794c]">
          <CircleCheck className="size-4" strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-5 text-[#16794c]">
            {message.text || (isRecordUpdate ? "Client record updated" : "Memory updated")}
          </p>
          {message.detail && (
            <p className="mt-0.5 text-[13px] font-normal leading-5 text-[#101112]">{message.detail}</p>
          )}
          {message.source && (
            <p className="mt-0.5 text-[12px] font-medium leading-4 text-black/45">{message.source}</p>
          )}
        </div>
      </div>
    );
  }

  const parsedDraft = parseEmailDraft(message.text);
  if (parsedDraft) {
    const finalPreText = parsedDraft.preText || `Here is the drafted email for this customer:`;
    return (
      <div className="group flex flex-col gap-1 w-full items-start">
        {finalPreText && (
          <div className="whitespace-pre-wrap text-[14px] font-normal leading-6 text-[#101112] w-full mb-2">
            {renderMessageText(finalPreText, true)}
          </div>
        )}

        <div className="w-[768px] h-[605px] max-w-full flex flex-col">
          <EmailDraftBlock
            initialSubject={parsedDraft.subject}
            initialBody={parsedDraft.body}
          />
        </div>

        {parsedDraft.postText && (
          <div className="mt-2 text-[12px] text-black/45 italic">
            {parsedDraft.postText}
          </div>
        )}

        <MessageSuggestions suggestions={message.suggestions} onSuggestion={onSuggestion} />

        <div className="mt-1 flex h-7 items-center justify-start gap-1 text-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <CustomerChatIconButton label="Copy">
            <Copy className="size-3.5" strokeWidth={1.8} />
          </CustomerChatIconButton>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div
        className={cn(
          "whitespace-pre-wrap font-normal text-[#101112]",
          message.id === "seed-1" ? "text-[16px] leading-7" : "text-[14px] leading-6"
        )}
      >
        {renderMessageText(message.text, true)}
      </div>
      <MessageSuggestions suggestions={message.suggestions} onSuggestion={onSuggestion} />
      <div className="mt-1 flex h-7 items-center justify-start gap-1 text-black/45 opacity-0 transition-opacity group-hover:opacity-100">
        <CustomerChatIconButton label="Copy">
          <Copy className="size-3.5" strokeWidth={1.8} />
        </CustomerChatIconButton>
      </div>
    </div>
  );
}

function CustomerChatThinkingIndicator({ intent = DEFAULT_THINKING_INTENT }) {
  const steps = getThinkingStepsForIntent(intent);
  const [stepIndex, setStepIndex] = useState(() => pickRandomStepIndex(steps.length));

  useEffect(() => {
    setStepIndex(pickRandomStepIndex(steps.length));
    const timer = window.setInterval(() => {
      setStepIndex((current) => pickRandomStepIndex(steps.length, current));
    }, THINKING_STEP_MS);

    return () => window.clearInterval(timer);
  }, [intent]);

  return (
    <div
      className="flex h-8 min-w-[210px] items-center gap-2 text-[13px] font-medium leading-6 text-[#266df0]"
      aria-live="polite"
    >
      <DotmSquare6 size={26} dotSize={4} ariaLabel="Assistant is thinking" />
      <span key={stepIndex} className="inline-block animate-thinking-status-fade whitespace-nowrap ml-1">
        {steps[stepIndex]}
      </span>
    </div>
  );
}

function CustomerWorkspaceSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_410px]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-r bg-white text-[#101112]">
          <div className="absolute left-6 top-6 z-10">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link to="/customers" />}
              aria-label="Back to customers"
              className="border border-border bg-white shadow-sm hover:bg-neutral-50"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-end">
              <div className="flex w-[700px] max-w-full flex-col items-stretch justify-start gap-10 px-6 py-8">
                <div className="max-w-full">
                  <SkeletonBlock height={18} width="92%" />
                  <SkeletonBlock height={18} width="86%" />
                  <SkeletonBlock height={18} width="58%" />
                  <div className="mt-1 flex h-7 items-center gap-1">
                    <SkeletonBlock width={28} height={28} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 justify-center bg-white">
            <div className="flex h-[140px] w-[700px] max-w-full flex-col items-stretch justify-start px-4 pb-[24px]">
              <div className="flex h-[116px] w-full flex-col rounded-[14px] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                <SkeletonBlock height={16} width="46%" />
                <div className="mt-auto flex h-11 items-end justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <SkeletonBlock width={112} height={28} />
                    <SkeletonBlock width={28} height={28} />
                    <SkeletonBlock width={82} height={28} />
                    <SkeletonBlock width={66} height={28} />
                  </div>
                  <SkeletonBlock width={28} height={28} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-white">
          <div className="px-6 pt-4">
            <SkeletonBlock width={48} height={48} />

            <div className="mt-3 space-y-2">
              <SkeletonBlock width={224} height={24} />
              <SkeletonBlock width={164} height={14} />
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <SkeletonBlock circle width={18} height={18} />
              <SkeletonBlock width={128} height={14} />
              <SkeletonBlock width={86} height={20} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <SkeletonBlock width={178} height={32} />
              <SkeletonBlock width={32} height={32} />
            </div>
          </div>

          <div className="px-6 pb-8 pt-4">
            <div className="mb-5 flex w-fit gap-1 rounded-lg bg-[#f1f1f3] p-1">
              <SkeletonBlock width={84} height={32} />
              <SkeletonBlock width={84} height={32} />
            </div>
            <WorkflowDetailsSkeleton />
          </div>
        </aside>
      </div>
    </div>
  );
}

function WorkflowDetailsSkeleton() {
  return (
    <div className="pt-1 text-[#2a2a2e]">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock width={sectionIndex === 0 ? 48 : sectionIndex === 1 ? 42 : 154} height={18} />
            <div className="flex items-center gap-1.5">
              <SkeletonBlock width={24} height={24} />
              <SkeletonBlock width={24} height={24} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <SkeletonBlock height={17} width={sectionIndex === 0 ? "82%" : "94%"} />
            <SkeletonBlock height={17} width={sectionIndex === 2 ? "68%" : "56%"} />
          </div>
        </section>
      ))}
      <section className="py-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock width={128} height={18} />
          <div className="flex items-center gap-1.5">
            <SkeletonBlock width={24} height={24} />
            <SkeletonBlock width={24} height={24} />
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-between gap-3 py-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <SkeletonBlock width={20} height={20} />
                <SkeletonBlock width={rowIndex === 1 ? 128 : 104} height={17} />
              </div>
              <SkeletonBlock width={38} height={22} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CustomerWorkspace() {
  const { customerId } = useParams();
  const { data: fetchedCustomer, loading, error } = useApi(() => api.getCustomerById(customerId), [customerId]);
  const { data: fetchedMemories } = useApi(() => api.getCustomerMemories(customerId), [customerId]);
  const { data: fetchedConfig } = useApi(() => api.getWorkflowConfig(customerId), [customerId]);
  const { data: fetchedArticles } = useApi(() => api.getCustomerArticles(customerId), [customerId]);
  const inputRef = useRef(null);
  const threadEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const configSaveTimer = useRef(null);
  const [customerOverride, setCustomerOverride] = useState(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [memories, setMemories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [workflowConfig, setWorkflowConfig] = useState(null);
  const [articleCandidate, setArticleCandidate] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);
  const [sending, setSending] = useState(false);
  const [thinkingIntent, setThinkingIntent] = useState(DEFAULT_THINKING_INTENT);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const customer = customerOverride ?? fetchedCustomer;

  useEffect(() => {
    setCustomerOverride(null);
  }, [customerId]);

  useEffect(() => {
    if (!customer) return;
    setMessages([buildCustomerSeedMessage(customer, memories)]);
  }, [customer?.id]);

  useEffect(() => {
    if (!customer) return;
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== "seed-1") return prev;
      return [buildCustomerSeedMessage(customer, memories)];
    });
  }, [
    customer?.dateOfBirth,
    customer?.nextLifeEvent,
    customer?.nextLifeEventDate,
    customer?.nextRenewal,
    customer?.nextRenewalPolicyType,
    customer?.rapportNotes,
    memories,
  ]);

  useEffect(() => {
    if (fetchedMemories) setMemories(fetchedMemories);
  }, [fetchedMemories]);

  useEffect(() => {
    if (fetchedArticles) setArticles(fetchedArticles);
  }, [fetchedArticles]);

  useEffect(() => {
    if (fetchedConfig) setWorkflowConfig(fetchedConfig);
  }, [fetchedConfig]);

  useEffect(() => {
    if (!customer?.id) return undefined;

    let refreshTimer = null;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshCustomerKnowledge().catch(() => {
          /* realtime refresh is best-effort; explicit sends still fetch fresh data */
        });
      }, 80);
    };

    const unsubscribe = api.subscribeCustomerKnowledge(customer.id, scheduleRefresh);

    return () => {
      window.clearTimeout(refreshTimer);
      unsubscribe?.();
    };
  }, [customer?.id]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => clearTimeout(configSaveTimer.current);
  }, []);

  if (loading && !customer) {
    return <CustomerWorkspaceSkeleton />;
  }

  if (error && !customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Could not load customer</h1>
            <p className="text-[11px] text-muted-foreground">Supabase returned an error for this customer.</p>
          </div>
        </header>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Customer not found</h1>
            <p className="text-[11px] text-muted-foreground">Return to Customer Hub</p>
          </div>
        </header>
      </div>
    );
  }

  function buildMemoryEntry({ kind, title, body, sourceName, sourceMeta }) {
    const fallback =
      kind === "file"
        ? `Uploaded ${sourceName}. Text extraction is not available for this file type yet, but the document is saved as client context.`
        : "Saved client note for future chatbot context.";

    return {
      id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind,
      title,
      summary: summarizeText(body, fallback),
      body,
      sourceName,
      sourceMeta,
      createdAt: new Date().toISOString(),
    };
  }

  async function remember(entry, { notify = true } = {}) {
    try {
      const savedEntry = await api.saveCustomerMemory(customer.id, entry);
      setMemories((prev) => [savedEntry, ...prev.filter((item) => item.id !== savedEntry.id && item.id !== entry.id)]);
      if (notify) {
        setMessages((prev) => [
          ...prev,
          {
            id: `memory-${savedEntry.id}`,
            role: "assistant",
            text: `Saved to ${customer.name}'s memory:\n\n${savedEntry.summary}`,
          },
        ]);
      }
      return savedEntry;
    } catch (error) {
      throw error;
    }
  }

  async function saveCustomerArticle(article, { notify = true } = {}) {
    if (!customer) return null;
    const now = new Date().toISOString();
    const articleForSave = {
      ...article,
      id: article.id ?? `article-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      customerId: customer.id,
      createdAt: article.createdAt ?? now,
      updatedAt: now,
    };

    const savedArticle = await api.saveCustomerArticle(customer.id, articleForSave);
    setArticles((prev) => upsertArticleList(prev, savedArticle));
    if (notify) {
      addAssistantNotice(
        `Saved internal article: **${savedArticle.title}**\n\nSaved to the articles database. Customer memory was not changed.`
      );
    }
    return savedArticle;
  }

  async function deleteCustomerArticle(articleId) {
    if (!customer) return;
    await api.deleteCustomerArticle(customer.id, articleId);
    setArticles((prev) => prev.filter((item) => item.id !== articleId));
  }

  async function refreshCustomerKnowledge() {
    const [nextCustomer, nextMemories, nextArticles] = await Promise.all([
      api.getCustomerById(customer.id),
      api.getCustomerMemories(customer.id),
      api.getCustomerArticles(customer.id),
    ]);

    setMemories(nextMemories);
    setArticles(nextArticles);
    if (nextCustomer) setCustomerOverride(nextCustomer);

    return { customer: nextCustomer ?? customer, memories: nextMemories, articles: nextArticles };
  }

  function getArticleIdFromMemory(memory) {
    return (
      String(memory?.sourceMeta ?? "").match(/\barticle:([^|\s]+)/i)?.[1] ??
      String(memory?.id ?? "").match(/^article-memory-(.+)$/)?.[1] ??
      null
    );
  }

  function getCorrectionSources(availableMemories = [], availableArticles = []) {
    const articleIds = new Set(availableArticles.map((article) => String(article.id)));
    const memorySources = availableMemories
      .filter((memory) => {
        if (memory.kind === "chat") return false;
        return !(memory.kind === "article" && articleIds.has(String(getArticleIdFromMemory(memory))));
      })
      .map((memory) => ({
        sourceType: "memory",
        ...memory,
        memory,
      }));
    const articleSources = availableArticles.map((article) => ({
      sourceType: "article",
      id: article.id,
      customerId: article.customerId,
      kind: "article",
      title: article.title,
      summary: article.subtitle,
      body: article.body,
      sourceName: article.sourceName,
      sourceMeta: article.type,
      createdAt: article.updatedAt ?? article.createdAt,
      article,
    }));

    return [...memorySources, ...articleSources];
  }

  async function saveCorrectionMemory(correction) {
    return remember(
      buildMemoryEntry({
        kind: "profile",
        title: `${correction.fieldLabel} update`,
        body: [
          correction.oldValue ? `${correction.fieldLabel} corrected from ${correction.oldValue}.` : null,
          `${correction.fieldLabel}: ${correction.nextValue}`,
        ].filter(Boolean).join("\n"),
        sourceName: "Advisor chat update",
        sourceMeta: "Saved from chatbot instruction",
      }),
      { notify: false }
    );
  }

  async function updateCustomerKnowledgeFromChat(correction, availableMemories = [], availableArticles = []) {
    if (!correction.oldValue) {
      const savedMemory = await saveCorrectionMemory(correction);

      return {
        status: "updated",
        correction,
        memory: savedMemory,
        changedFields: ["body"],
      };
    }

    const rankedSources = getCorrectionSources(availableMemories, availableArticles)
      .map((source) => ({ source, score: scoreSourceForCorrection(source, correction) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.source.createdAt) - new Date(a.source.createdAt));
    const target = rankedSources[0]?.source;

    if (!target) {
      if (correction.subject && correction.nextValue) {
        const savedMemory = await saveCorrectionMemory(correction);
        return {
          status: "updated",
          correction,
          memory: savedMemory,
          changedFields: ["body"],
        };
      }

      return { status: "not-found", correction };
    }

    if (target.sourceType === "article") {
      const amendedArticle = amendArticleWithCorrection(target.article, correction);
      if (!amendedArticle) return { status: "not-found", correction };

      const savedArticle = await saveCustomerArticle(amendedArticle.article, { notify: false });

      return {
        status: "updated",
        correction,
        article: savedArticle,
        changedFields: amendedArticle.changedFields,
      };
    }

    if (target) {
      const amendedMemory = amendMemoryWithCorrection(target.memory, correction);
      if (!amendedMemory) return { status: "not-found", correction };

      const savedMemory = await api.updateCustomerMemory(customer.id, amendedMemory.memory);
      setMemories((prev) => {
        if (!prev.some((memory) => memory.id === savedMemory.id)) return [savedMemory, ...prev];
        return prev.map((memory) => (memory.id === savedMemory.id ? savedMemory : memory));
      });

      return {
        status: "updated",
        correction,
        memory: savedMemory,
        changedFields: amendedMemory.changedFields,
      };
    }
  }

  async function updateCustomerRecordFromChat(correction) {
    if (correction.needsFullDate) {
      return {
        status: "needs-detail",
        correction,
      };
    }

    const savedCustomer = await api.updateCustomerRecord(customer.id, {
      [correction.field]: correction.nextValue,
    });

    if (savedCustomer) setCustomerOverride(savedCustomer);

    return {
      status: "updated",
      correction,
      customer: savedCustomer ?? customer,
    };
  }

  function getArticleSourceMemory(sourceMemories = memories) {
    if (articleCandidate) {
      return sourceMemories.find((memory) => memory.id === articleCandidate.id) ?? articleCandidate;
    }

    return sourceMemories.find((memory) => {
      const hasSourceText = memory.body || memory.summary;
      return hasSourceText && ["meeting", "file", "voice", "note"].includes(memory.kind);
    });
  }

  async function createArticleFromLatestMinutes(
    instruction = "",
    sourceOverride = null,
    { notify = true, customerOverride = null, memoriesOverride = null } = {}
  ) {
    const activeCustomer = customerOverride ?? customer;
    const activeMemories = memoriesOverride ?? memories;
    const sourceMemory = sourceOverride ?? getArticleSourceMemory(activeMemories);
    if (!sourceMemory) {
      if (notify) {
        addAssistantNotice("Upload meeting minutes or save a client note first, then I can turn it into an internal article.");
      }
      return null;
    }

    const generatedArticle = await api.generateCustomerArticle({
      customer: activeCustomer,
      memory: sourceMemory,
      memories: activeMemories,
      workflowConfig,
      model: selectedModel,
      instruction,
    });

    if (!generatedArticle) {
      if (notify) {
        addAssistantNotice("I could not generate an article from the saved minutes yet. Try uploading a text transcript or note.");
      }
      return null;
    }

    const savedArticle = await saveCustomerArticle(generatedArticle, { notify: false });
    setArticleCandidate(null);
    if (notify) {
      addAssistantNotice(
        `Created internal article: **${savedArticle.title}**\n\nSaved under Details > Knowledge > Source files. Customer memory was not changed.`
      );
    }
    return savedArticle;
  }

  async function addFiles(fileList) {
    const next = Array.from(fileList ?? []).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type || "Document",
      file,
    }));
    const currentIds = new Set(files.map((file) => file.id));
    const freshFiles = next.filter((file) => !currentIds.has(file.id));
    if (!freshFiles.length) return;

    setFiles((prev) => {
      const seen = new Set(prev.map((file) => file.id));
      return [
        ...prev,
        ...freshFiles
          .filter((file) => !seen.has(file.id))
          .map(({ file, ...upload }) => upload),
      ];
    });

    setSavingMemory(true);
    try {
      for (const upload of freshFiles) {
        const body = await readFileText(upload.file);
        const meetingMinutes = isMeetingMinutesUpload(upload.name, body);
        const savedEntry = await remember(
          buildMemoryEntry({
            kind: meetingMinutes ? "meeting" : "file",
            title: upload.name,
            body,
            sourceName: upload.name,
            sourceMeta: `${formatFileSize(upload.size)} | ${isTextLikeFile(upload.file) ? "Summarized" : "Stored reference"}`,
          }),
          { notify: !meetingMinutes }
        );
        if (meetingMinutes) {
          setArticleCandidate(savedEntry);
          addAssistantNotice(buildMeetingUploadMessage({ customer, memory: savedEntry }));
        }
      }
    } finally {
      setSavingMemory(false);
    }
  }

  async function saveNoteMemory() {
    const body = noteText.trim();
    if (!body || !customer) return;
    setSavingMemory(true);
    try {
      await remember(
        buildMemoryEntry({
          kind: "voice",
          title: "Voice or typed note",
          body,
          sourceName: "Advisor note",
          sourceMeta: "Summarized",
        })
      );
      setNoteText("");
      setVoiceError("");
    } finally {
      setSavingMemory(false);
    }
  }

  function startVoiceCapture() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice capture is not supported in this browser. Paste the note and summarize it instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          transcript += `${event.results[index][0].transcript} `;
        }
      }
      if (transcript.trim()) {
        setNoteText((prev) => cleanText(`${prev} ${transcript}`));
      }
    };
    recognition.onerror = () => {
      setVoiceError("Could not capture audio. Paste the note and summarize it instead.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceError("");
    setListening(true);
  }

  function stopVoiceCapture() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function addAssistantNotice(notice) {
    const message =
      typeof notice === "string"
        ? { text: notice }
        : notice;

    setMessages((prev) => [
      ...prev,
      {
        id: `notice-${Date.now()}`,
        role: "assistant",
        ...message,
      },
    ]);
  }



  // Update workflow config in state immediately (so the chat uses the latest)
  // and debounce the persistence so we don't write on every keystroke.
  function updateWorkflowConfig(next) {
    setWorkflowConfig(next);
    clearTimeout(configSaveTimer.current);
    configSaveTimer.current = setTimeout(() => {
      api.saveWorkflowConfig(customer.id, next);
    }, 600);
  }

  async function draftFollowUp() {
    if (!customer || sending) return;

    const prompt = "Draft a follow-up email from this customer's latest saved knowledge.";
    const thinkingStartedAt = Date.now();
    setThinkingIntent("follow_up");
    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: prompt }]);

    try {
      const latestKnowledge = await refreshCustomerKnowledge();
      const reply = await api.draftCustomerFollowUp({
        customer: latestKnowledge.customer,
        memories: latestKnowledge.memories,
        articles: latestKnowledge.articles,
        workflowConfig,
        model: selectedModel,
      });
      await waitForThinkingSequence(thinkingStartedAt, "follow_up");
      if (reply) setMessages((prev) => [...prev, reply]);
    } catch {
      await waitForThinkingSequence(thinkingStartedAt, "follow_up");
      addAssistantNotice("I could not draft a follow-up right now. Try again after saving the latest client memory.");
    } finally {
      setSending(false);
    }
  }

  async function sendCustomerPrompt(text) {
    if (!text || sending) return;

    const customerRecordUpdateRequest = parseCustomerRecordUpdateRequest(text, customer, messages);
    const memoryUpdateRequest = parseMemoryUpdateRequest(text);
    const intent = getThinkingIntentForPrompt(text, !!articleCandidate, customer, messages);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setValue("");
    const thinkingStartedAt = Date.now();
    setSending(true);
    setThinkingIntent(intent);
    let attemptedMemoryUpdate = false;

    try {
      if (customerRecordUpdateRequest) {
        attemptedMemoryUpdate = true;
        const updateResult = await updateCustomerRecordFromChat(customerRecordUpdateRequest);
        await waitForThinkingSequence(thinkingStartedAt, intent);

        if (updateResult.status === "updated") {
          addAssistantNotice(buildRecordUpdatedMessage(updateResult));
        } else {
          addAssistantNotice(
            "I can update the date of birth, but I need the full date because this client does not already have a month and day saved."
          );
        }
        return;
      }

      if (memoryUpdateRequest) {
        attemptedMemoryUpdate = true;
        const latestKnowledge = await refreshCustomerKnowledge();
        const updateResult = await updateCustomerKnowledgeFromChat(
          memoryUpdateRequest,
          latestKnowledge.memories,
          latestKnowledge.articles
        );
        await waitForThinkingSequence(thinkingStartedAt, intent);

        if (updateResult.status === "updated") {
          addAssistantNotice(buildKnowledgeUpdatedMessage(updateResult));
        } else {
          addAssistantNotice(
            `I could not find "${memoryUpdateRequest.oldValue}" in ${latestKnowledge.customer.name}'s saved memories or articles, so I did not change anything.`
          );
        }
        return;
      }

      if (isArticleGenerationRequest(text, !!articleCandidate)) {
        const latestKnowledge = await refreshCustomerKnowledge();
        await createArticleFromLatestMinutes(text, null, {
          customerOverride: latestKnowledge.customer,
          memoriesOverride: latestKnowledge.memories,
        });
        await waitForThinkingSequence(thinkingStartedAt, intent);
        return;
      }

      const latestKnowledge = await refreshCustomerKnowledge();
      const reply = await api.sendCustomerMessage({
        customer: latestKnowledge.customer,
        text,
        memories: latestKnowledge.memories,
        articles: latestKnowledge.articles,
        history: messages,
        workflowConfig,
        model: selectedModel,
      });
      await waitForThinkingSequence(thinkingStartedAt, intent);
      if (reply) {
        setMessages((prev) => [...prev, reply]);
        try {
          await remember(
            buildMemoryEntry({
              kind: "chat",
              title: "Advisor chat turn",
              body: `Advisor: ${text}\n\nAssistant: ${reply.text}`,
              sourceName: "Customer chat",
              sourceMeta: selectedModel,
            }),
            { notify: false }
          );
        } catch {
          addAssistantNotice("I answered, but could not save this chat turn to Supabase memory.");
        }
      }
    } catch {
      await waitForThinkingSequence(thinkingStartedAt, intent);
      addAssistantNotice(
        attemptedMemoryUpdate
          ? "I found the memory update request, but could not save the change to Supabase."
          : "I could not search this customer record right now. Try again in a moment."
      );
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    await sendCustomerPrompt(value.trim());
  }

  async function handleSuggestion(suggestion) {
    if (!suggestion || sending) return;

    if (suggestion.action === "create-article") {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: suggestion.label },
      ]);
      const thinkingStartedAt = Date.now();
      setSending(true);
      setThinkingIntent("article_generation");
      try {
        const latestKnowledge = await refreshCustomerKnowledge();
        const sourceMemory =
          latestKnowledge.memories.find((memory) => memory.id === suggestion.memoryId) ||
          (articleCandidate?.id === suggestion.memoryId ? articleCandidate : null);
        await createArticleFromLatestMinutes(suggestion.instruction || "", sourceMemory, {
          customerOverride: latestKnowledge.customer,
          memoriesOverride: latestKnowledge.memories,
        });
        await waitForThinkingSequence(thinkingStartedAt, "article_generation");
      } catch {
        await waitForThinkingSequence(thinkingStartedAt, "article_generation");
        addAssistantNotice("I could not generate the internal article right now. Try again from the uploaded minutes.");
      } finally {
        setSending(false);
      }
      return;
    }

    if (suggestion.action === "draft-follow-up") {
      await draftFollowUp();
      return;
    }

    if (suggestion.action === "send-prompt") {
      await sendCustomerPrompt(suggestion.prompt || suggestion.label);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const activityItems = memories.slice(0, 6).map((memory) => {
    const ActivityIcon = memory.kind === "file" ? FileText : memory.kind === "meeting" ? CalendarDays : Brain;
    const typeLabel = memory.kind === "file" ? "Document" : memory.kind === "meeting" ? "Meeting" : "Note";

    return {
      ...memory,
      ActivityIcon,
      typeLabel,
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_410px]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-r bg-white text-[#101112]">
          <div className="absolute left-6 top-6 z-10">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link to="/customers" />}
              aria-label="Back to customers"
              className="border border-border bg-white shadow-sm hover:bg-neutral-50"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-end">
              <div className="flex w-[700px] max-w-full flex-col items-stretch justify-start gap-10 px-6 py-8">
                {messages.map((message) => (
                  <CustomerChatMessage key={message.id} message={message} onSuggestion={handleSuggestion} />
                ))}
                {sending && <CustomerChatThinkingIndicator intent={thinkingIntent} />}
                <div ref={threadEndRef} />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-[170px] left-0 right-0 flex h-7 items-center justify-center">
            <button
              type="button"
              aria-label="Scroll to latest message"
              onClick={() => threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })}
              className="pointer-events-auto flex size-7 items-center justify-center rounded-lg bg-white text-black/70 opacity-0 shadow-[0_0_0_1px_rgba(28,40,64,0.08),0_2px_8px_rgba(28,40,64,0.12)] transition-opacity hover:opacity-100 focus:opacity-100"
            >
              <ArrowDown className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex shrink-0 justify-center bg-white">
            <CustomerChatComposer
              customer={customer}
              value={value}
              onChange={setValue}
              onKeyDown={onKeyDown}
              onSubmit={submit}
              onAttach={() => inputRef.current?.click()}
              onDraft={draftFollowUp}
              sending={sending}
              model={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-white">
          <WorkflowHeader customer={customer} />

          <Tabs defaultValue="details" className="gap-0 px-6 pb-8 pt-4">
            <TabsList
              variant="ghost"
              className="flex w-fit items-center gap-1 rounded-[6px] bg-[#f1f1f3] p-1 [&_[data-slot=tab-indicator]]:hidden"
            >
              <TabsTrigger
                value="details"
                className="h-8 rounded-[4px] px-4 text-[14px] font-medium text-[#6b6b70] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-[#317cff] data-[selected]:text-white aria-selected:bg-[#317cff] aria-selected:text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-8 rounded-[4px] px-4 text-[14px] font-medium text-[#6b6b70] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-[#317cff] data-[selected]:text-white aria-selected:bg-[#317cff] aria-selected:text-white"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="pt-1">
              {workflowConfig ? (
                <WorkflowDetails
                  config={workflowConfig}
                  onChange={updateWorkflowConfig}
                  articles={articles}
                  onSaveArticle={saveCustomerArticle}
                  onDeleteArticle={deleteCustomerArticle}
                />
              ) : (
                <WorkflowDetailsSkeleton />
              )}
            </TabsContent>

            <TabsContent value="activity" className="pt-5">
              <div className="grid grid-cols-2 gap-2">
                <CustomerFact icon={Mail} label="Email" value={customer.email || "No email"} />
                <CustomerFact icon={UserRound} label="Owner" value="Ferdinand" />
                <CustomerFact icon={CalendarDays} label="Last touch" value={customer.lastTouch || "Not recorded"} />
                <CustomerFact icon={FileText} label="Next step" value={customer.task || customer.nextAction || "Confirm next action"} />
              </div>

              <div className="mt-5 rounded-lg border bg-white p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Brain className="size-4 text-primary" />
                  Add client note
                </div>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={4}
                  placeholder="Paste a call note, family update, preference, or commitment..."
                  className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant={listening ? "secondary" : "outline"}
                    size="sm"
                    onClick={listening ? stopVoiceCapture : startVoiceCapture}
                  >
                    <Mic className="size-4" /> {listening ? "Stop" : "Dictate"}
                  </Button>
                  <Button size="sm" onClick={saveNoteMemory} disabled={!noteText.trim() || savingMemory}>
                    <FileText className="size-4" /> Save note
                  </Button>
                </div>
                {voiceError && <p className="mt-2 text-xs text-destructive-foreground">{voiceError}</p>}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Recent interactions</h3>
                  <span className="text-xs text-muted-foreground">{activityItems.length} saved</span>
                </div>
                <div className="space-y-3">
                  {activityItems.map(({ ActivityIcon, typeLabel, ...memory }) => (
                    <div key={memory.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <ActivityIcon className="size-4" />
                      </span>
                      <div className="border-b pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{memory.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {typeLabel} | {memory.sourceName} | {formatMemoryDate(memory.createdAt)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {memory.sourceMeta || "Saved"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{memory.summary}</p>
                      </div>
                    </div>
                  ))}
                  {!activityItems.length && (
                    <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
                      No client interactions saved yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={cn(
                    "flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed bg-white px-4 py-5 text-center transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <UploadCloud className="size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Add transcript or document</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, or notes from a client call</p>
                  <Button className="mt-4" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    <Paperclip className="size-4" /> Choose files
                  </Button>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((item) => item.id !== file.id))}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.log"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function CustomerFact({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg border bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
