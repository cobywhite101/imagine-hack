import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CircleCheck,
  Copy,
  FileText,
  Mail,
  Paperclip,
  Plus,
  ShieldCheck,
  Sparkles,
  Pencil,
  Send,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotmSquare6 } from "@/components/ui/dotm-square-6";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerProfileCard, WorkflowDetails, WorkflowHeader } from "@/features/customers/WorkflowPanel";
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
const CUSTOMER_WORKSPACE_TAB_TRIGGER_CLASS =
  "h-9 flex-1 rounded-lg px-4 text-[14px] font-semibold text-[#8a7f80] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:!bg-[#fff8ff] data-[selected]:!text-[#1f1220] data-[selected]:!shadow-[0_1px_5px_rgba(60,38,55,0.12)] aria-selected:!bg-[#fff8ff] aria-selected:!text-[#1f1220] aria-selected:!shadow-[0_1px_5px_rgba(60,38,55,0.12)]";
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

function formatMeetingDate(iso) {
  const [year, month, day] = String(iso ?? "").slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMeetingTime(meeting) {
  if (meeting.allDay || !String(meeting.start ?? "").includes("T")) return "All day";
  const [hours, minutes] = String(meeting.start).slice(11, 16).split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function truncateMeetingNotes(notes) {
  const text = String(notes ?? "").trim();
  return text.length > 120 ? `${text.slice(0, 120).trimEnd()}...` : text;
}

function sortMeetingsUpcomingFirst(meetings = []) {
  const now = Date.now();
  const safeMeetings = Array.isArray(meetings) ? meetings.filter(Boolean) : [];
  const withTime = safeMeetings.map((meeting) => ({
    meeting,
    time: new Date(meeting.start).getTime(),
  }));
  const upcoming = withTime.filter((item) => Number.isNaN(item.time) || item.time >= now);
  const past = withTime.filter((item) => !Number.isNaN(item.time) && item.time < now);
  upcoming.sort((a, b) => a.time - b.time);
  past.sort((a, b) => b.time - a.time);
  return [...upcoming, ...past].map((item) => item.meeting);
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

function formatPromptDate(date, { weekday = false, year = false } = {}) {
  return new Intl.DateTimeFormat("en", {
    ...(weekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date).replace(",", "");
}

function getTodayUtc(today = new Date()) {
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function getPromptCustomerName(customer) {
  const fullName = cleanText(customer?.contactName || customer?.name || "this client");
  const parts = fullName.split(/\s+/);

  if (customer?.ethnicity === "Chinese" && parts.length === 3) {
    return parts.slice(1).join(" ");
  }

  return fullName;
}

function titleCaseText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getPolicyLabel(policyType) {
  const label = titleCaseText(policyType);
  if (!label) return "";
  if (/insurance|policy|savings|linked|medical|life/i.test(label)) return label;
  return `${label} policy`;
}

function getCustomerRenewalPrompt(customer, today = new Date()) {
  const todayUtc = getTodayUtc(today);
  const policyRenewals = (Array.isArray(customer?.policies) ? customer.policies : [])
    .map((policy) => ({
      date: parseDateOnly(policy.renewalDate ?? policy.renewal_date),
      policyType: policy.policyType ?? policy.policy_type,
    }))
    .filter((item) => item.date);
  const recordRenewal = {
    date: parseDateOnly(customer?.nextRenewal),
    policyType: customer?.nextRenewalPolicyType,
  };
  const renewals = [recordRenewal, ...policyRenewals].filter((item) => item.date);
  if (!renewals.length) return null;

  const upcoming = renewals
    .filter((item) => item.date >= todayUtc)
    .sort((a, b) => a.date - b.date);
  const fallback = renewals.sort((a, b) => b.date - a.date);
  const renewal = upcoming[0] ?? fallback[0];

  return {
    ...renewal,
    isPast: renewal.date < todayUtc,
  };
}

// Builds the "Upcoming" summary chips. Prefers events within the next 45 days,
// sorted soonest-first; if nothing is imminent, falls back to the single
// soonest upcoming event so the section stays relevant without going stale.
function getUpcomingSummaryItems(customer, today = new Date()) {
  const todayUtc = getTodayUtc(today);
  const todayYear = todayUtc.getUTCFullYear();
  const events = [];

  const birthday = getNextAnnualDate(customer?.dateOfBirth, today);
  if (birthday) {
    const showYear = birthday.date.getUTCFullYear() !== todayYear;
    events.push({
      daysUntil: birthday.daysUntil,
      label: `Birthday ${formatPromptDate(birthday.date, { weekday: true, year: showYear })}`,
    });
  }

  const renewal = getCustomerRenewalPrompt(customer, today);
  if (renewal && !renewal.isPast) {
    const daysUntil = Math.round((renewal.date.getTime() - todayUtc.getTime()) / DAY_MS);
    const showYear = renewal.date.getUTCFullYear() !== todayYear;
    events.push({
      daysUntil,
      label: `plan renews ${formatPromptDate(renewal.date, { year: showYear })}`,
    });
  }

  const upcoming = events
    .filter((event) => event.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  if (!upcoming.length) return [];

  const nearTerm = upcoming.filter((event) => event.daysUntil <= 45);
  const selected = nearTerm.length ? nearTerm : upcoming.slice(0, 1);
  return selected.slice(0, 2).map((event) => event.label);
}

function getCustomerPronouns(customer) {
  const gender = cleanText(customer?.gender).toLowerCase();
  if (gender === "female") return { possessive: "her", possessiveCap: "Her", subject: "she" };
  if (gender === "male") return { possessive: "his", possessiveCap: "His", subject: "he" };
  return { possessive: "their", possessiveCap: "Their", subject: "they" };
}

function formatUpcomingDatePhrase(date, daysUntil) {
  const weekday = new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(date);
  const monthDay = formatMonthDay(date);
  if (daysUntil >= 0 && daysUntil <= 7) return `this ${weekday}, ${monthDay}`;
  if (daysUntil > 7 && daysUntil <= 14) return `next ${weekday}, ${monthDay}`;
  return formatPromptDate(date, { weekday: true, year: date.getUTCFullYear() !== getTodayUtc().getUTCFullYear() });
}

function formatRelativeBadge(daysUntil) {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil > 1 && daysUntil <= 30) return `in ${daysUntil} days`;
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
  return "";
}

function formatElapsedContact(date) {
  const days = Math.round((getTodayUtc().getTime() - date.getTime()) / DAY_MS);
  if (days < 0) return `scheduled ${formatPromptDate(date)}`;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 45) return `${days} days ago`;
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30));
    return `${months === 1 ? "about a month" : `about ${months} months`} ago`;
  }
  const years = Math.max(1, Math.round(days / 365));
  return `${years === 1 ? "about a year" : `about ${years} years`} ago`;
}

function getPolicyField(policy, camelKey, snakeKey) {
  return policy?.[camelKey] ?? policy?.[snakeKey];
}

function getRenewalPolicy(customer, renewal) {
  const policies = Array.isArray(customer?.policies) ? customer.policies : [];
  if (!renewal?.date || !policies.length) return null;

  const renewalDate = renewal.date.toISOString().slice(0, 10);
  const renewalType = cleanText(renewal.policyType).toLowerCase();

  return (
    policies.find((policy) => {
      const policyDate = parseDateOnly(getPolicyField(policy, "renewalDate", "renewal_date"))?.toISOString().slice(0, 10);
      const policyType = cleanText(getPolicyField(policy, "policyType", "policy_type")).toLowerCase();
      return policyDate === renewalDate && (!renewalType || policyType === renewalType);
    }) ??
    policies.find((policy) => {
      const policyDate = parseDateOnly(getPolicyField(policy, "renewalDate", "renewal_date"))?.toISOString().slice(0, 10);
      return policyDate === renewalDate;
    }) ??
    null
  );
}

function formatPolicyPremium(policy) {
  const amount = Number(getPolicyField(policy, "premiumAmount", "premium_amount"));
  if (!Number.isFinite(amount) || amount <= 0) return "";

  const frequency = cleanText(getPolicyField(policy, "premiumFrequency", "premium_frequency")).toLowerCase();
  const suffix = frequency.startsWith("annual") || frequency.startsWith("year") ? " / year" : frequency.startsWith("month") ? " / month" : "";
  return `RM${Math.round(amount).toLocaleString("en-US")}${suffix}`;
}

function formatCoverageAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `RM${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) return `RM${Math.round(amount / 1_000)}k`;
  return `RM${Math.round(amount)}`;
}

// Holdings card, rendered as a "metric" format (big number). Built only from
// real investment-linked plans - returns null when there is nothing
// market-exposed on file. No fabricated performance numbers.
function buildPortfolioMomentCard(customer, promptName, pronouns) {
  const policies = Array.isArray(customer?.policies) ? customer.policies : [];
  const investmentPolicies = policies.filter((policy) =>
    /investment|education savings/i.test(cleanText(getPolicyField(policy, "policyType", "policy_type")))
  );
  if (!investmentPolicies.length) return null;

  const coverage = investmentPolicies.reduce(
    (sum, policy) => sum + (Number(getPolicyField(policy, "sumAssured", "sum_assured")) || 0),
    0
  );
  const risk = cleanText(customer?.riskTolerance);
  const horizon = Number(customer?.investmentHorizonYears);
  const detailParts = [
    risk ? `${risk.toLowerCase()} risk` : "",
    Number.isFinite(horizon) && horizon > 0 ? `${horizon}-year horizon` : "",
  ].filter(Boolean);

  const coverageLabel = formatCoverageAmount(coverage);
  const planLabel = `${investmentPolicies.length} investment-linked ${investmentPolicies.length === 1 ? "plan" : "plans"}`;

  return {
    id: "portfolio-moment",
    variant: "metric",
    label: "Holdings",
    badge: risk ? titleCaseText(risk) : "Review",
    metric: coverageLabel || `${investmentPolicies.length}`,
    metricCaption: coverageLabel ? `across ${planLabel}` : planLabel,
    detail: detailParts.length ? detailParts.join(" · ") : "Confirm the allocation still fits.",
    actionLabel: "Review the holdings",
    prompt: `Give ${promptName} a simple update on ${pronouns.possessive} investment-linked holdings (${[coverageLabel ? `${coverageLabel} across ${planLabel}` : planLabel, ...detailParts].join(", ")}), using the customer record context and an advisor-friendly tone.`,
  };
}

function formatLastContactDetail(customer) {
  const topic = cleanText(customer?.task || customer?.nextAction || customer?.policySummary)
    .replace(/^(?:discuss|review|prepare|complete|send|confirm)\s+/i, "")
    .replace(/[.]+$/g, "");

  if (topic) return `You discussed ${topic.charAt(0).toLowerCase()}${topic.slice(1)}.`;
  return "Recap the conversation and the next best action.";
}

// Pick the 4 strongest moments while keeping format variety - no single card
// format is allowed to dominate unless there genuinely aren't alternatives.
function selectMomentCards(candidates, limit = 4) {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const picked = [];
  const variantCount = {};
  const variantCap = 2;

  for (const item of sorted) {
    if (picked.length >= limit) break;
    const variant = item.card.variant || "default";
    if ((variantCount[variant] || 0) >= variantCap) continue;
    picked.push(item);
    variantCount[variant] = (variantCount[variant] || 0) + 1;
  }
  // Backfill if the cap left us short (e.g. only one format had candidates).
  if (picked.length < limit) {
    for (const item of sorted) {
      if (picked.length >= limit) break;
      if (picked.includes(item)) continue;
      picked.push(item);
    }
  }
  return picked.map((item) => item.card).slice(0, limit);
}

// Smart suggestions for the moment grid. Each card type is generated only when
// it is actually significant for THIS client right now (a birthday months away
// is not a moment), carries its own visual format (countdown / metric / note /
// task), and is scored by urgency. We then pick the 4 strongest with format
// variety, so different clients see a different, curated, non-repetitive set.
function buildCustomerMomentCards(customer) {
  const promptName = getPromptCustomerName(customer);
  const pronouns = getCustomerPronouns(customer);
  const todayUtc = getTodayUtc();
  const candidates = [];

  // Birthday - countdown format, only when genuinely near.
  const birthday = getNextAnnualDate(customer?.dateOfBirth);
  if (birthday && birthday.daysUntil >= 0 && birthday.daysUntil <= 30) {
    candidates.push({
      score: 88 - birthday.daysUntil,
      card: {
        id: "birthday-moment",
        variant: "countdown",
        label: "Birthday",
        badge: formatRelativeBadge(birthday.daysUntil) || formatPromptDate(birthday.date),
        title: `${pronouns.possessiveCap} birthday is ${formatUpcomingDatePhrase(birthday.date, birthday.daysUntil)}`,
        detail: "A short, personal note goes a long way.",
        actionLabel: "Draft a birthday message",
        prompt: `Draft a warm, concise birthday message for ${promptName}.`,
      },
    });
  }

  // Renewal - countdown format, overdue or within the next quarter.
  const renewal = getCustomerRenewalPrompt(customer);
  let renewalSurfaced = false;
  if (renewal) {
    const renewalDays = Math.round((renewal.date.getTime() - todayUtc.getTime()) / DAY_MS);
    if (renewal.isPast || renewalDays <= 90) {
      renewalSurfaced = true;
      const renewalPolicy = getRenewalPolicy(customer, renewal);
      const policyLabel = getPolicyLabel(renewal.policyType || customer?.nextRenewalPolicyType) || "plan";
      const details = [
        formatPolicyPremium(renewalPolicy),
        customer?.riskTolerance ? `${cleanText(customer.riskTolerance).toLowerCase()} risk` : "",
      ].filter(Boolean);
      candidates.push({
        score: renewal.isPast ? 96 : 90 - renewalDays * 0.5,
        card: {
          id: "renewal-moment",
          variant: "countdown",
          label: "Renewal",
          badge: renewal.isPast ? `overdue ${formatPromptDate(renewal.date)}` : `due ${formatPromptDate(renewal.date)}`,
          title: `${pronouns.possessiveCap} ${policyLabel.toLowerCase()} is up for renewal`,
          detail: details.length ? details.join(" · ") : cleanText(customer?.policySummary) || "Review coverage, premium, and next steps.",
          actionLabel: "Summarize the options",
          prompt: `Summarize the options for ${promptName}'s ${policyLabel.toLowerCase()} renewal and call out any follow-up risks.`,
        },
      });
    }
  }

  // Compliance - task format, KYC that is not yet complete.
  const kyc = cleanText(customer?.kycStatus);
  if (kyc && kyc.toLowerCase() !== "completed") {
    candidates.push({
      score: 84,
      card: {
        id: "kyc-moment",
        variant: "task",
        label: "Compliance",
        badge: titleCaseText(kyc),
        title: `KYC is still ${kyc.toLowerCase()}`,
        detail: "Clear it to keep the account in good standing.",
        actionLabel: "Plan the follow-up",
        prompt: `Outline how to close out the outstanding KYC for ${promptName}, using the customer record context and an advisor-friendly tone.`,
      },
    });
  }

  // Upcoming life event - countdown format, on the horizon.
  const lifeEventDate = parseDateOnly(customer?.nextLifeEventDate);
  const nextLifeEvent = cleanText(customer?.nextLifeEvent);
  const lifeEventDays = getDaysUntilDate(customer?.nextLifeEventDate);
  if (nextLifeEvent && lifeEventDate && lifeEventDays !== null && lifeEventDays >= 0 && lifeEventDays <= 120) {
    candidates.push({
      score: 80 - lifeEventDays * 0.3,
      card: {
        id: "life-event-moment",
        variant: "countdown",
        label: "Life event",
        badge: formatRelativeBadge(lifeEventDays) || formatPromptDate(lifeEventDate),
        title: nextLifeEvent,
        detail: "A timely note shows you're paying attention.",
        actionLabel: "Prepare for it",
        prompt: `Suggest how to support ${promptName} around ${nextLifeEvent.toLowerCase()}, using the customer record context and an advisor-friendly tone.`,
      },
    });
  }

  // Open next action - task format. Skipped if it just restates the renewal.
  const task = cleanText(customer?.task || customer?.nextAction).replace(/[.]+$/g, "");
  const isEstateTask = /will|estate|legacy|heir/i.test(task);
  if (task && !(renewalSurfaced && /renew/i.test(task))) {
    candidates.push({
      score: isEstateTask ? 70 : 62,
      card: {
        id: "next-action-moment",
        variant: "task",
        label: isEstateTask ? "Estate planning" : "Next step",
        badge: "Open item",
        title: task,
        detail: "On your list for this client.",
        actionLabel: "Plan the next move",
        prompt: `Outline the next best step for ${promptName} on "${task}", using the customer record context and an advisor-friendly tone.`,
      },
    });
  }

  // Reconnect - countdown format, only once it has been a real gap.
  const lastContactDate = parseDateOnly(customer?.lastContactDate);
  if (lastContactDate) {
    const daysSince = Math.round((todayUtc.getTime() - lastContactDate.getTime()) / DAY_MS);
    if (daysSince >= 75) {
      candidates.push({
        score: Math.min(74, 40 + Math.floor(daysSince / 30) * 7),
        card: {
          id: "reengage-moment",
          variant: "countdown",
          label: "Reconnect",
          badge: formatPromptDate(lastContactDate),
          title: `You last spoke ${formatElapsedContact(lastContactDate)}`,
          detail: formatLastContactDetail(customer),
          actionLabel: "Draft a check-in",
          prompt: `Draft a light, personal check-in to reconnect with ${promptName} after a gap, using the customer record context.`,
        },
      });
    }
  }

  // Estate readiness - task format, when there are dependents but no will yet.
  const dependents = Number(customer?.dependents);
  if (customer?.hasWill === false && Number.isFinite(dependents) && dependents > 0 && !isEstateTask) {
    candidates.push({
      score: 58,
      card: {
        id: "will-gap-moment",
        variant: "task",
        label: "Estate gap",
        badge: "No will",
        title: `No will on file - ${dependents} ${dependents === 1 ? "dependent" : "dependents"}`,
        detail: "A will protects who depends on them.",
        actionLabel: "Raise it gently",
        prompt: `Suggest a tactful way to raise estate and will planning with ${promptName}, who has ${dependents} ${dependents === 1 ? "dependent" : "dependents"} and no will on file.`,
      },
    });
  }

  // Rapport opener - note format, a personal hook from the record.
  const rapportInsight = extractRapportInsight(customer);
  if (rapportInsight) {
    const cleanInsight = rapportInsight.replace(/[.!?]+$/g, "");
    candidates.push({
      score: 50,
      card: {
        id: "rapport-moment",
        variant: "note",
        label: "Rapport",
        badge: "Personal",
        title: "A personal opener you can use",
        detail: cleanInsight,
        actionLabel: "Work it in",
        prompt: `Suggest a warm way to bring up "${cleanInsight}" with ${promptName} before getting to business.`,
      },
    });
  }

  // Holdings - metric format, from real investment-linked plans.
  const portfolioCard = buildPortfolioMomentCard(customer, promptName, pronouns);
  if (portfolioCard) {
    candidates.push({ score: 46, card: portfolioCard });
  }

  // --- Evergreen bench: lower-priority, still profile-specific. These keep the
  // grid full (4 cards) and give the selector variety to draw from. ---

  // Protection picture - metric format, dependents relying on cover.
  if (Number.isFinite(dependents) && dependents > 0) {
    candidates.push({
      score: 36,
      card: {
        id: "protection-moment",
        variant: "metric",
        label: "Protection",
        badge: "Dependents",
        metric: String(dependents),
        metricCaption: dependents === 1 ? "dependent relies on this cover" : "dependents rely on this cover",
        detail: "Sanity-check the coverage still fits the household.",
        actionLabel: "Review the gap",
        prompt: `Assess whether ${promptName}'s current cover is adequate for ${dependents} ${dependents === 1 ? "dependent" : "dependents"}, using the customer record context.`,
      },
    });
  }

  // Risk profile - note format, a quick framing of how they invest.
  const risk = cleanText(customer?.riskTolerance);
  const horizon = Number(customer?.investmentHorizonYears);
  if (risk) {
    const horizonPart = Number.isFinite(horizon) && horizon > 0 ? ` over a ${horizon}-year horizon` : "";
    candidates.push({
      score: 30,
      card: {
        id: "risk-moment",
        variant: "note",
        label: "Risk profile",
        badge: titleCaseText(risk),
        title: "How they like to invest",
        detail: `${titleCaseText(risk)} risk appetite${horizonPart}.`,
        actionLabel: "Frame the next idea",
        prompt: `Summarize ${promptName}'s ${risk.toLowerCase()} risk profile and what it means for the next recommendation.`,
      },
    });
  }

  // Tenure - metric format, the length of the relationship.
  const clientSinceDate = parseDateOnly(customer?.clientSince);
  if (clientSinceDate) {
    const years = todayUtc.getUTCFullYear() - clientSinceDate.getUTCFullYear();
    candidates.push({
      score: 24,
      card: {
        id: "tenure-moment",
        variant: "metric",
        label: "Relationship",
        badge: `since ${clientSinceDate.getUTCFullYear()}`,
        metric: years >= 1 ? `${years}` : "<1",
        metricCaption: years === 1 ? "year as a client" : "years as a client",
        detail: "A long relationship is worth nurturing.",
        actionLabel: "Plan a check-in",
        prompt: `Suggest a thoughtful way to acknowledge ${promptName}'s ${years >= 1 ? `${years}-year ` : ""}relationship and keep it warm.`,
      },
    });
  }

  const cards = selectMomentCards(candidates, 4);

  // Guarantee 4 cards even for a thin record - pad with gentle, generic touches.
  const fillers = [
    {
      id: "catch-up-moment",
      variant: "note",
      label: "Catch up",
      badge: "Anytime",
      title: "Keep the relationship warm",
      detail: `A quick, no-agenda check-in with ${promptName} goes a long way.`,
      actionLabel: "Draft a check-in",
      prompt: `Draft a light, personal check-in for ${promptName}, using the customer record context.`,
    },
    {
      id: "review-moment",
      variant: "task",
      label: "Review",
      badge: "Housekeeping",
      title: `Refresh ${promptName}'s file`,
      detail: "Confirm the details on record are still current.",
      actionLabel: "Run a quick review",
      prompt: `Review ${promptName}'s record for anything out of date or worth following up on.`,
    },
  ];
  for (const filler of fillers) {
    if (cards.length >= 4) break;
    if (!cards.some((card) => card.id === filler.id)) cards.push(filler);
  }

  return cards.slice(0, 4);
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
    field: "ethnicity",
    label: "Ethnicity",
    aliases: ["ethnicity", "ethnic group", "race"],
    options: ["Chinese", "Malay", "Indian", "Other"],
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
  const firstPick = priority ?? sentences[0];
  const picked = [firstPick, ...sentences.filter((sentence) => sentence !== firstPick).slice(0, 1)];
  const summary = cleanText(picked.join(" "));

  if (summary.length <= 280) return summary;
  return `${summary.slice(0, 280).replace(/\s+\S*$/, "")}...`;
}

function stripConversationSummaryMarkdown(text) {
  return cleanText(
    String(text ?? "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#+\s+/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
  );
}

function parseCustomerConversationMemory(memory) {
  const body = String(memory?.body ?? "").trim();
  const match = body.match(/^Advisor:\s*([\s\S]*?)(?:(?:\n{2,}|\s+)Assistant:\s*([\s\S]*))?$/i);

  if (match) {
    return {
      advisorText: match[1]?.trim() || "",
      assistantText: match[2]?.trim() || "",
    };
  }

  return {
    advisorText: "",
    assistantText: body || memory?.summary || "",
  };
}

function buildConversationTurnsFromMemory(memory) {
  const { advisorText, assistantText } = parseCustomerConversationMemory(memory);
  const turns = [];

  if (advisorText) {
    turns.push({
      role: "advisor",
      text: stripConversationSummaryMarkdown(advisorText),
      createdAt: memory?.createdAt,
    });
  }

  if (assistantText) {
    turns.push({
      role: "assistant",
      text: stripConversationSummaryMarkdown(assistantText),
      createdAt: memory?.createdAt,
    });
  }

  return turns.filter((turn) => turn.text);
}

function buildCurrentConversationTurns(messages = []) {
  return messages
    .filter((message) => message?.id !== "seed-1" && (message?.role === "user" || message?.role === "assistant"))
    .map((message) => ({
      role: message.role === "user" ? "advisor" : "assistant",
      text: stripConversationSummaryMarkdown(message.text),
      createdAt: message.createdAt ?? message.created_at,
    }))
    .filter((turn) => turn.text);
}

function buildSavedConversationTurns(memories = []) {
  return [...memories]
    .filter((memory) => memory?.kind === "chat")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .reverse()
    .flatMap((memory) => buildConversationTurnsFromMemory(memory));
}

function parseActivityDate(value, { preserveTime = false } = {}) {
  if (preserveTime && String(value ?? "").includes("T")) {
    const dateTime = new Date(value);
    if (!Number.isNaN(dateTime.getTime())) return dateTime;
  }

  const parsedDate = parseDateOnly(value);
  if (parsedDate) return parsedDate;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getActivitySortTime(value) {
  const date = parseActivityDate(value, { preserveTime: true });
  return date ? date.getTime() : 0;
}

function formatActivityDate(value) {
  const hasTime = String(value ?? "").includes("T");
  const date = parseActivityDate(value, { preserveTime: hasTime });
  if (!date) return "RECENT";

  const datePart = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(hasTime ? {} : { timeZone: "UTC" }),
  })
    .format(date)
    .toUpperCase();

  if (!hasTime) return datePart;

  const timePart = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .toUpperCase();

  return `${datePart} · ${timePart}`;
}

function compactActivityText(text, maxLength = 160) {
  const cleaned = stripConversationSummaryMarkdown(text);
  if (!cleaned) return "";

  const truncated =
    cleaned.length <= maxLength
      ? cleaned
      : `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;

  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`;
}

function buildActivityEntry({ id, date, text, sequence }) {
  const itemText = compactActivityText(text);
  if (!itemText) return null;

  const dateValue = date ?? new Date().toISOString();
  return {
    id,
    date: dateValue,
    dateLabel: formatActivityDate(dateValue),
    sortTime: getActivitySortTime(dateValue),
    sequence,
    text: itemText,
  };
}

function summarizeChatExchange(advisorTurn, assistantTurn) {
  const ask = stripConversationSummaryMarkdown(advisorTurn?.text);
  const takeaway = summarizeText(stripConversationSummaryMarkdown(assistantTurn?.text), "");
  const segments = [];
  if (ask) segments.push(`Advisor asked: ${ask}`);
  if (takeaway) segments.push(`Assistant: ${takeaway}`);
  return segments.join(" — ");
}

function buildCustomerActivityTimeline({ customer, messages = [], memories = [], meetings = [], articles = [] }) {
  const currentTurns = buildCurrentConversationTurns(messages);
  const conversationTurns = currentTurns.length ? currentTurns.slice(-4) : buildSavedConversationTurns(memories).slice(-4);
  const entries = [];
  let sequence = 0;

  const pushEntry = (id, date, text) => {
    const entry = buildActivityEntry({ id, date, text, sequence: sequence++ });
    if (entry) entries.push(entry);
  };

  // Chat history log: condense each notable advisor/assistant exchange into a
  // single dated + timed entry so future sessions can scan what was discussed.
  for (let index = 0; index < conversationTurns.length; index += 1) {
    const turn = conversationTurns[index];
    const next = conversationTurns[index + 1];

    if (turn.role === "advisor" && next?.role === "assistant") {
      pushEntry(
        `chat-${index}`,
        next.createdAt ?? turn.createdAt ?? new Date().toISOString(),
        summarizeChatExchange(turn, next)
      );
      index += 1;
      continue;
    }

    const label = turn.role === "advisor" ? "Advisor noted" : "Assistant noted";
    pushEntry(`chat-${index}`, turn.createdAt ?? new Date().toISOString(), `${label}: ${turn.text}`);
  }

  const seen = new Set();
  return entries
    .filter((entry) => {
      const key = `${entry.dateLabel}:${entry.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.sortTime - a.sortTime || b.sequence - a.sequence)
    .slice(0, 10);
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

function buildMeetingUploadMessage({ customer, memory, workflowGenerated = false }) {
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
      workflowGenerated
        ? "**Workflow updated**\nAI generated Notes and Communication style from this latest client context.\n"
        : "",
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

function CustomerPromptStart({ customer, onSendPrompt, sending }) {
  const promptName = getPromptCustomerName(customer);

  return (
    <div className="flex w-[660px] max-w-full flex-col items-center self-center px-5 py-6 text-center xl:py-7">
      <h2 className="max-w-[600px] text-[27px] font-semibold leading-[1.14] text-[#101112] sm:text-[31px] xl:text-[34px]">
        What would you like to know about {promptName}?
      </h2>
      <p className="mt-4 text-[14px] font-medium leading-6 text-black/38 xl:text-[15px]">
        Ask in your own words, or pick something I already remember.
      </p>

      <CustomerMomentCards customer={customer} onSendPrompt={onSendPrompt} sending={sending} />
    </div>
  );
}

function CustomerMomentCards({ customer, onSendPrompt, sending }) {
  const cards = buildCustomerMomentCards(customer);
  if (!cards.length) return null;

  return (
    <div className="mt-5 w-full max-w-[660px] text-left xl:mt-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSendPrompt?.(card.prompt)}
            disabled={sending}
            className="group flex min-h-24 w-full flex-col rounded-lg border border-border bg-card px-3.5 py-3 text-left text-card-foreground transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="flex min-w-0 items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 font-mono text-xs font-medium uppercase leading-none text-muted-foreground">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span className="truncate">{card.label}</span>
              </span>
              <Badge variant="secondary" size="sm" className="shrink-0 font-mono uppercase">
                {card.badge}
              </Badge>
            </span>
            <MomentCardBody card={card} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Each suggestion type renders in its own format so the grid never feels like
// one repeated template: metric (big number), note (quoted insight), task
// (checklist item), or countdown/default (event line).
function MomentCardBody({ card }) {
  const action = <span className="font-medium text-primary">{card.actionLabel} -&gt;</span>;

  if (card.variant === "metric") {
    return (
      <>
        <span className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[26px] font-semibold leading-none tabular-nums text-foreground">{card.metric}</span>
          <span className="min-w-0 text-xs leading-4 text-muted-foreground">{card.metricCaption}</span>
        </span>
        <span className="mt-auto block pt-2 text-xs leading-5 text-muted-foreground">
          {card.detail} {action}
        </span>
      </>
    );
  }

  if (card.variant === "note") {
    return (
      <>
        {card.title ? (
          <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted-foreground/80">
            {card.title}
          </span>
        ) : null}
        <span className="mt-1 block border-l-2 border-primary/40 pl-2.5 text-sm italic leading-5 text-foreground">
          &ldquo;{card.detail}&rdquo;
        </span>
        <span className="mt-auto block pt-2 text-xs leading-5">{action}</span>
      </>
    );
  }

  if (card.variant === "task") {
    return (
      <>
        <span className="mt-1.5 flex items-start gap-2">
          <span className="mt-0.5 size-3.5 shrink-0 rounded-sm border border-primary/50 bg-primary/5" aria-hidden="true" />
          <span className="min-w-0 text-sm font-medium leading-5 text-foreground">{card.title}</span>
        </span>
        <span className="mt-auto block pt-2 text-xs leading-5 text-muted-foreground">
          {card.detail} {action}
        </span>
      </>
    );
  }

  // countdown / default - event line.
  return (
    <>
      <span className="mt-1.5 block text-sm font-medium leading-5 text-foreground">{card.title}</span>
      <span className="mt-auto block pt-2 text-xs leading-5 text-muted-foreground">
        {card.detail} {action}
      </span>
    </>
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
  onSendPrompt,
  onOpenCalendar,
  sending,
  model,
  onModelChange,
}) {
  const [open, setOpen] = useState(false);

  const modelLabels = {
    base: "Base",
    reasoning: "Reasoning",
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
                        onModelChange("base");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "base" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      Base
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onModelChange("reasoning");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-black/[0.04]",
                        model === "reasoning" ? "text-[#266df0] bg-[#266df0]/[0.04]" : "text-black/75"
                      )}
                    >
                      Reasoning
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

const MARKDOWN_DIVIDER_LINE_PATTERN = /^\s*(?:\*\*)?(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})(?:\*\*)?\s*$/;

function getRenderableMessageText(text, isAssistant = false) {
  const rawText = String(text ?? "");
  if (!isAssistant) return rawText;

  return rawText
    .split("\n")
    .filter((line) => !MARKDOWN_DIVIDER_LINE_PATTERN.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

function shouldAnimateMessageText(message) {
  return message?.role === "assistant" && message?.animateText === true;
}

function renderMessageText(text, isAssistant = false, animate = false) {
  const displayText = getRenderableMessageText(text, isAssistant);
  if (!displayText) return "";
  const parts = displayText.split("**");
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

      const style = isAssistant && animate
        ? {
            animationDelay: `${currentWordIndex * 15}ms`,
          }
        : undefined;

      return (
        <span
          key={`word-${partIndex}-${tokenIndex}`}
          style={style}
          className={`${isBold ? "font-semibold" : ""} ${
            isAssistant && animate ? "inline-block animate-grok-fade opacity-0" : ""
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
  if (!message || typeof message !== "object") return null;
  const animateText = shouldAnimateMessageText(message);

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
            {renderMessageText(finalPreText, true, animateText)}
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
        {renderMessageText(message.text, true, animateText)}
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
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_390px]">
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

        <aside className="min-h-0 overflow-y-auto bg-white px-6">
          <div className="pt-4">
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

          <div className="pb-8 pt-4">
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
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock width={sectionIndex === 0 ? 48 : 154} height={18} />
            <div className="flex items-center gap-1.5">
              <SkeletonBlock width={24} height={24} />
              <SkeletonBlock width={24} height={24} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <SkeletonBlock height={17} width={sectionIndex === 0 ? "82%" : "94%"} />
            <SkeletonBlock height={17} width={sectionIndex === 1 ? "68%" : "56%"} />
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
  const navigate = useNavigate();
  const { data: fetchedCustomer, loading, error } = useApi(() => api.getCustomerById(customerId), [customerId]);
  const { data: fetchedMemories, loading: memoriesLoading } = useApi(() => api.getCustomerMemories(customerId), [customerId]);
  const { data: fetchedConfig } = useApi(() => api.getWorkflowConfig(customerId), [customerId]);
  const { data: fetchedArticles } = useApi(() => api.getCustomerArticles(customerId), [customerId]);
  const { data: fetchedMeetings } = useApi(() => api.getAdvisorMeetings(), [customerId]);
  const inputRef = useRef(null);
  const threadEndRef = useRef(null);
  const configSaveTimer = useRef(null);
  const workflowGuidanceKeyRef = useRef(null);
  const [customerOverride, setCustomerOverride] = useState(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [memories, setMemories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [workflowConfig, setWorkflowConfig] = useState(null);
  const [articleCandidate, setArticleCandidate] = useState(null);
  const [savingMemory, setSavingMemory] = useState(false);
  const [sending, setSending] = useState(false);
  const [thinkingIntent, setThinkingIntent] = useState(DEFAULT_THINKING_INTENT);
  const [selectedModel, setSelectedModel] = useState("base");
  const customer = customerOverride ?? fetchedCustomer;
  const apiModel = selectedModel === "reasoning" ? "deepseek-reasoner" : "deepseek-chat";
  const customerMeetings = useMemo(() => {
    if (!fetchedMeetings || !customer) return [];
    const linked = fetchedMeetings.filter((meeting) => String(meeting.customerId) === String(customer.id));
    return sortMeetingsUpcomingFirst(linked);
  }, [customer, fetchedMeetings]);

  const openMeetingInCalendar = (meeting) => navigate(`/home?meeting=${meeting.id}`);
  const safeMemories = Array.isArray(memories) ? memories.filter(Boolean) : [];
  const visibleMessages = Array.isArray(messages) ? messages.filter((message) => message && message.id) : [];

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
    if (!customer?.id || !workflowConfig || !fetchedConfig || !fetchedMemories || !fetchedArticles || !fetchedMeetings) return;

    const guidanceKey = [
      customer.id,
      customer.updatedAt ?? customer.updated_at ?? "",
      safeMemories.map((memory) => [memory.id, memory.updatedAt, memory.createdAt, memory.title, memory.summary].filter(Boolean).join("|")).join("||"),
      articles.map((article) => [article.id, article.updatedAt, article.createdAt, article.title, article.summary].filter(Boolean).join("|")).join("||"),
      customerMeetings.map((meeting) => [meeting.id, meeting.updatedAt, meeting.createdAt, meeting.start, meeting.title, meeting.notes].filter(Boolean).join("|")).join("||"),
    ].join("::");

    if (workflowGuidanceKeyRef.current === guidanceKey) return;
    workflowGuidanceKeyRef.current = guidanceKey;

    let cancelled = false;
    api.generateWorkflowGuidance({
      customer,
      memories: safeMemories,
      articles,
      meetings: customerMeetings,
      workflowConfig,
      model: apiModel,
    })
      .then((nextConfig) => {
        if (cancelled || !nextConfig) return;
        updateWorkflowConfig(nextConfig);
      })
      .catch(() => {
        workflowGuidanceKeyRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [
    customer,
    workflowConfig,
    fetchedConfig,
    fetchedMemories,
    fetchedArticles,
    fetchedMeetings,
    safeMemories,
    articles,
    customerMeetings,
    apiModel,
  ]);

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
            createdAt: new Date().toISOString(),
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
      model: apiModel,
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

  async function generateWorkflowGuidanceFromContext(sourceMemory, { customerOverride = null, memoriesOverride = null } = {}) {
    if (!sourceMemory) return null;

    const activeCustomer = customerOverride ?? customer;
    const activeMemories = memoriesOverride ?? memories;
    const baseConfig = workflowConfig ?? fetchedConfig;
    if (!activeCustomer) return null;

    const generatedConfig = await api.generateWorkflowGuidance({
      customer: activeCustomer,
      memories: activeMemories,
      articles,
      sourceMemory,
      workflowConfig: baseConfig,
      model: apiModel,
    });

    setWorkflowConfig(generatedConfig);
    clearTimeout(configSaveTimer.current);
    await api.saveWorkflowConfig(activeCustomer.id, generatedConfig);
    return generatedConfig;
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
          let workflowGenerated = false;
          try {
            const latestMemories = [savedEntry, ...memories.filter((memory) => memory.id !== savedEntry.id)];
            const generatedConfig = await generateWorkflowGuidanceFromContext(savedEntry, {
              customerOverride: customer,
              memoriesOverride: latestMemories,
            });
            workflowGenerated = Boolean(generatedConfig);
          } catch {
            workflowGenerated = false;
          }
          addAssistantNotice(buildMeetingUploadMessage({ customer, memory: savedEntry, workflowGenerated }));
        }
      }
    } finally {
      setSavingMemory(false);
    }
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
        createdAt: new Date().toISOString(),
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
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: prompt, createdAt: new Date().toISOString() }]);

    try {
      const latestKnowledge = await refreshCustomerKnowledge();
      const reply = await api.draftCustomerFollowUp({
        customer: latestKnowledge.customer,
        memories: latestKnowledge.memories,
        articles: latestKnowledge.articles,
        workflowConfig,
        model: apiModel,
      });
      await waitForThinkingSequence(thinkingStartedAt, "follow_up");
      if (reply) setMessages((prev) => [...prev, { createdAt: new Date().toISOString(), ...reply, animateText: true }]);
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
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text, createdAt: new Date().toISOString() }]);
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
        model: apiModel,
      });
      await waitForThinkingSequence(thinkingStartedAt, intent);
      if (reply) {
        setMessages((prev) => [...prev, { createdAt: new Date().toISOString(), ...reply, animateText: true }]);
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
        { id: `u-${Date.now()}`, role: "user", text: suggestion.label, createdAt: new Date().toISOString() },
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

  function startNewCustomerChat() {
    if (!customer || sending) return;

    setMessages([buildCustomerSeedMessage(customer, memories)]);
    setValue("");
    setFiles([]);
    setArticleCandidate(null);
    setThinkingIntent(DEFAULT_THINKING_INTENT);
    window.requestAnimationFrame(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  const activityItems = buildCustomerActivityTimeline({
    customer,
    messages: visibleMessages,
    memories: safeMemories,
    meetings: customerMeetings,
    articles,
  });
  const hasStartedChat = visibleMessages.some((message) => message.id !== "seed-1");
  const showStartPrompt = !hasStartedChat && !sending;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_390px]">
        <section className="relative flex min-h-0 flex-col overflow-hidden border-r bg-white text-[#101112]">
          <div className="absolute left-6 top-6 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link to="/customers" />}
              aria-label="Back to customers"
              className="border border-border bg-white shadow-sm hover:bg-neutral-50"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Button>
            <button
              type="button"
              onClick={startNewCustomerChat}
              disabled={sending}
              aria-label="Start new customer chat"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[12px] font-medium text-[#101112] shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#266df0]/20 disabled:pointer-events-none disabled:opacity-45"
            >
              <Plus className="size-3.5 text-muted-foreground" strokeWidth={1.9} />
              <span>New chat</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn("flex min-h-full flex-col items-center", showStartPrompt ? "justify-center" : "justify-end")}>
              <div
                className={cn(
                  "flex max-w-full flex-col items-stretch justify-start px-6 py-8",
                  showStartPrompt ? "w-full" : "w-[700px] gap-10"
                )}
              >
                {showStartPrompt ? (
                  <CustomerPromptStart customer={customer} onSendPrompt={sendCustomerPrompt} sending={sending} />
                ) : (
                  visibleMessages.map((message) => (
                    <CustomerChatMessage key={message.id} message={message} onSuggestion={handleSuggestion} />
                  ))
                )}
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
              onSendPrompt={sendCustomerPrompt}
              onOpenCalendar={() => navigate("/home")}
              sending={sending}
              model={selectedModel}
	              onModelChange={setSelectedModel}
	            />
	          </div>
	        </section>

        <aside className="min-h-0 overflow-y-auto bg-white px-6">
          <div className="pt-4">
            <WorkflowHeader customer={customer} />
          </div>

          <Tabs defaultValue="details" className="gap-0 pb-8 pt-4">
            <TabsList
              variant="ghost"
              className="flex w-full items-center gap-1 rounded-xl bg-[#eee4e3] p-1 [&_[data-slot=tab-indicator]]:hidden"
            >
              <TabsTrigger
                value="details"
                className={CUSTOMER_WORKSPACE_TAB_TRIGGER_CLASS}
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className={CUSTOMER_WORKSPACE_TAB_TRIGGER_CLASS}
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="meetings"
                className={CUSTOMER_WORKSPACE_TAB_TRIGGER_CLASS}
              >
                Meetings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="pt-1">
              <CustomerProfileCard customer={customer} />
              <div className="mt-1 border-t border-[#ededed] pt-1" />
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

            <TabsContent value="activity" className="pt-6">
              <CustomerActivityTimeline items={activityItems} loading={memoriesLoading && !fetchedMemories} />
            </TabsContent>

            <TabsContent value="meetings" className="pt-5">
              <CustomerMeetingsTab meetings={customerMeetings} onOpen={openMeetingInCalendar} />
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

function CustomerActivityTimeline({ items, loading }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <section aria-labelledby="customer-activity-heading">
      <h3 id="customer-activity-heading" className="sr-only">
        Activity timeline
      </h3>

      {loading && !safeItems.length ? (
        <div className="rounded-lg border border-[#eadfe1] bg-white/70 p-4 text-sm text-[#8a7f80]" role="status">
          Loading activity...
        </div>
      ) : safeItems.length ? (
        <ol className="space-y-0" aria-label="Customer activity timeline">
          {safeItems.map((item, index) => (
            <li key={item.id} className="grid grid-cols-[14px_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0">
              <div className="relative flex justify-center pt-[7px]" aria-hidden="true">
                <span
                  className={cn(
                    "relative z-10 size-2.5 rounded-full",
                    index === 0 ? "bg-[#5e6de8]" : "bg-[#d9d1d2]"
                  )}
                />
                {index < safeItems.length - 1 ? (
                  <span className="absolute bottom-[-14px] top-[18px] w-px bg-[#dfd6d7]" />
                ) : null}
              </div>
              <div className="min-w-0">
                <time
                  dateTime={String(item.date ?? "")}
                  className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-[#aaa0a6]"
                >
                  {item.dateLabel}
                </time>
                <p className="mt-1 text-[15px] leading-[1.45] text-[#27182b]">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-lg border border-[#eadfe1] bg-white/70 p-4 text-sm text-[#8a7f80]">
          No customer activity has been saved yet.
        </div>
      )}
    </section>
  );
}

function MeetingRow({ meeting, onOpen }) {
  const notes = truncateMeetingNotes(meeting.notes);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(meeting)}
      className="block w-full rounded-lg border bg-white p-3 text-left transition-colors hover:border-primary/40 hover:bg-neutral-50"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{meeting.title}</p>
        <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {formatMeetingTime(meeting)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CalendarDays className="size-3.5 shrink-0" />
        <span>{formatMeetingDate(meeting.start)}</span>
        {meeting.location ? <span className="truncate">| {meeting.location}</span> : null}
      </div>
      {notes ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{notes}</p> : null}
    </button>
  );
}

function CustomerMeetingsTab({ meetings, onOpen }) {
  const safeMeetings = Array.isArray(meetings) ? meetings.filter(Boolean) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Linked meetings</h3>
        <span className="text-xs text-muted-foreground">{safeMeetings.length} scheduled</span>
      </div>
      {safeMeetings.length ? (
        <div className="space-y-2">
          {safeMeetings.map((meeting) => (
            <MeetingRow key={meeting.id} meeting={meeting} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          No meetings linked to this customer yet.
        </div>
      )}
    </div>
  );
}
