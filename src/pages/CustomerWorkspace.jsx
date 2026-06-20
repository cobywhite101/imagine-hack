import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

function getThinkingIntentForPrompt(text, hasArticleCandidate) {
  if (parseMemoryUpdateRequest(text)) return "memory_update";
  if (isArticleGenerationRequest(text, hasArticleCandidate)) return "article_generation";
  return "customer_message";
}
const MEMORY_UPDATE_VERB_PATTERN = /\b(update|change|correct|fix|amend|edit|revise)\b/i;
const MEMORY_TARGET_PATTERN = /\b(memory|remembered|client record|customer record|saved record|profile)\b/i;
const MEMORY_UPDATE_FIELDS = [
  {
    id: "birthday",
    label: "Birthday",
    aliases: ["birthday", "birth date", "birthdate", "date of birth", "dob"],
  },
  {
    id: "email",
    label: "Email",
    aliases: ["email", "email address"],
  },
  {
    id: "phone",
    label: "Phone",
    aliases: ["phone", "phone number", "mobile", "mobile number"],
  },
  {
    id: "address",
    label: "Address",
    aliases: ["address", "home address", "mailing address"],
  },
  {
    id: "net_worth",
    label: "Net worth",
    aliases: ["net worth", "estimated net worth"],
  },
  {
    id: "income",
    label: "Income",
    aliases: ["income", "income bracket", "annual income"],
  },
  {
    id: "preference",
    label: "Preference",
    aliases: ["preference", "preferred channel", "communication preference"],
  },
  {
    id: "occupation",
    label: "Occupation",
    aliases: ["occupation", "job", "role"],
  },
];

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

// --- Meeting display helpers (mirror the calendar's local-string format) ---
function formatMeetingDate(iso) {
  const [y, m, d] = String(iso ?? "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMeetingTime(meeting) {
  if (meeting.allDay || !String(meeting.start ?? "").includes("T")) return "All day";
  const [h, min] = String(meeting.start).slice(11, 16).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Upcoming meetings ascending, then past meetings most-recent first.
function sortMeetingsUpcomingFirst(meetings) {
  const now = Date.now();
  const withTime = meetings.map((meeting) => ({
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

function cleanCorrectionValue(value) {
  return cleanText(value)
    .replace(/^(?:from|to|as|is|was|be)\s+/i, "")
    .replace(/\s+(?:in|on)\s+(?:the\s+)?(?:memory|record|profile)$/i, "")
    .replace(/\s+(?:please|thanks|thank you)$/i, "")
    .replace(/^[`"']+|[`"'.!?]+$/g, "")
    .trim();
}

function isValidCorrectionValue(value) {
  return value.length > 0 && value.length <= 120;
}

function findMemoryUpdateField(text) {
  const normalizedText = cleanText(text);

  return MEMORY_UPDATE_FIELDS.find((field) =>
    field.aliases.some((alias) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(normalizedText))
  ) ?? null;
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

  const field = findMemoryUpdateField(raw);
  const asksForUpdate =
    MEMORY_UPDATE_VERB_PATTERN.test(raw) ||
    /\bactually\b/i.test(raw) ||
    /\b(?:not|instead of)\b/i.test(raw);

  if (!asksForUpdate || (!field && !MEMORY_TARGET_PATTERN.test(raw))) return null;

  const fieldPattern = field ? `(?:${field.aliases.map(escapeRegExp).join("|")})` : "(?:memory|record|profile)";
  const patterns = [
    {
      regex: new RegExp(
        `${fieldPattern}[\\s\\S]{0,80}?\\b(?:is|was|says|shows|listed as|stored as|recorded as)\\s+([\\s\\S]+?)\\s+\\b(?:but\\s+)?(?:it'?s|it is|that'?s|that is|should be|is)?\\s*actually\\s+([\\s\\S]+?)(?:[.!?]|$)`,
        "i"
      ),
      oldIndex: 1,
      nextIndex: 2,
    },
    {
      regex: new RegExp(
        `\\b(?:update|change|correct|fix|amend|edit|revise)\\b[\\s\\S]{0,100}?${fieldPattern}[\\s\\S]{0,100}?\\bfrom\\s+([\\s\\S]+?)\\s+\\bto\\s+([\\s\\S]+?)(?:[.!?]|$)`,
        "i"
      ),
      oldIndex: 1,
      nextIndex: 2,
    },
    {
      regex: new RegExp(
        `${fieldPattern}[\\s\\S]{0,80}?\\b(?:is|should be|=)\\s+([\\s\\S]+?)\\s+\\b(?:not|instead of)\\s+([\\s\\S]+?)(?:[.!?]|$)`,
        "i"
      ),
      oldIndex: 2,
      nextIndex: 1,
    },
    {
      regex: new RegExp(
        `${fieldPattern}[\\s\\S]{0,80}?\\bactually\\s+([\\s\\S]+?)\\s+\\b(?:not|instead of)\\s+([\\s\\S]+?)(?:[.!?]|$)`,
        "i"
      ),
      oldIndex: 2,
      nextIndex: 1,
    },
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern.regex);
    if (!match) continue;

    const oldValue = cleanCorrectionValue(match[pattern.oldIndex]);
    const nextValue = cleanCorrectionValue(match[pattern.nextIndex]);
    if (
      isValidCorrectionValue(oldValue) &&
      isValidCorrectionValue(nextValue) &&
      normalizeMemoryComparable(oldValue) !== normalizeMemoryComparable(nextValue)
    ) {
      return {
        fieldId: field?.id ?? "memory",
        fieldLabel: field?.label ?? "Memory",
        fieldAliases: field?.aliases ?? [],
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

function scoreMemoryForCorrection(memory, correction) {
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

  const hasFieldAlias = correction.fieldAliases.some((alias) =>
    normalizedHaystack.includes(normalizeMemoryComparable(alias))
  );

  return [
    20,
    hasFieldAlias ? 10 : 0,
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

function buildMemoryUpdatedMessage({ correction, memory }) {
  return {
    type: "memory-updated",
    text: "Memory updated",
    detail: `${correction.fieldLabel}: ${correction.oldValue} -> ${correction.nextValue}`,
    source: memory?.title ? `Updated ${memory.title}` : "",
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

function buildMeetingUploadMessage({ customer, memory, article }) {
  const documentType = describeMeetingUpload(memory.sourceName || memory.title, memory.body || memory.summary);
  const contactName = customer.contactName || customer.name;

  return {
    text: [
      `I saved **${memory.sourceName || memory.title}** as meeting context for ${customer.name}.`,
      article
        ? `I also pushed **${article.title}** to the internal articles database and indexed it for future chatbot answers.`
        : "I saved the meeting context, but could not generate the internal article automatically from this file.",
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
  const sourcesIndex = bodyText.search(/\n\s*(?:Sources|Source):\s*/i);
  if (sourcesIndex !== -1) {
    postText = bodyText.substring(sourcesIndex).trim();
    bodyText = bodyText.substring(0, sourcesIndex).trim();
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

  if (message.type === "memory-updated") {
    return (
      <div className="group flex w-full items-start gap-2.5">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f7ee] text-[#16794c]">
          <CircleCheck className="size-4" strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-5 text-[#16794c]">Memory updated</p>
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
            {renderMessageText(finalPreText, message.id !== "seed-1")}
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
      <div className="whitespace-pre-wrap text-[14px] font-normal leading-6 text-[#101112]">
        {renderMessageText(message.text, message.id !== "seed-1")}
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

export function CustomerWorkspace() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { data: fetchedCustomer, loading, error } = useApi(() => api.getCustomerById(customerId), [customerId]);
  const { data: fetchedMemories } = useApi(() => api.getCustomerMemories(customerId), [customerId]);
  const { data: fetchedConfig } = useApi(() => api.getWorkflowConfig(customerId), [customerId]);
  const { data: fetchedArticles } = useApi(() => api.getCustomerArticles(customerId), [customerId]);
  const { data: fetchedMeetings } = useApi(() => api.getAdvisorMeetings(), [customerId]);
  const customer = fetchedCustomer;

  // Meetings linked to this customer, upcoming first. Read-only consumer of the
  // shared meeting data layer — no writes happen here.
  const customerMeetings = useMemo(() => {
    if (!fetchedMeetings || !customer) return [];
    const linked = fetchedMeetings.filter(
      (meeting) => String(meeting.customerId) === String(customer.id),
    );
    return sortMeetingsUpcomingFirst(linked);
  }, [fetchedMeetings, customer]);

  // Navigate to the main calendar (lives on /home). The deep-link param lets a
  // later phase scroll to / focus this event without reworking the call site.
  const openMeetingInCalendar = (meeting) => navigate(`/home?meeting=${meeting.id}`);
  const inputRef = useRef(null);
  const threadEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const configSaveTimer = useRef(null);
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

  useEffect(() => {
    if (!customer) return;
    setMessages([
      {
        id: "seed-1",
        role: "assistant",
        text: `I have ${customer.name}'s account context ready. Ask for a recap, renewal plan, risk summary, or follow-up email.`,
      },
    ]);
  }, [customer?.id]);

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
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => clearTimeout(configSaveTimer.current);
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  if (loading && !customer) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-5">
          <Button variant="ghost" size="icon-sm" render={<Link to="/customers" />} aria-label="Back to customers">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Loading customer</h1>
            <p className="text-[11px] text-muted-foreground">Fetching live customer data...</p>
          </div>
        </header>
      </div>
    );
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
    if (savedArticle?.indexedMemory) {
      setMemories((prev) => [
        savedArticle.indexedMemory,
        ...prev.filter((item) => item.id !== savedArticle.indexedMemory.id),
      ]);
    }
    if (notify) {
      addAssistantNotice(
        savedArticle?.memoryIndexError
          ? `Saved internal article: **${savedArticle.title}**\n\nPushed to the internal articles database. I could not mirror it into client memory, but this chat can still read it from Source files.`
          : `Saved internal article: **${savedArticle.title}**\n\nPushed to the database and indexed for future chatbot answers.`
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
    const [nextMemories, nextArticles] = await Promise.all([
      api.getCustomerMemories(customer.id),
      api.getCustomerArticles(customer.id),
    ]);

    setMemories(nextMemories);
    setArticles(nextArticles);

    return { memories: nextMemories, articles: nextArticles };
  }

  async function updateCustomerMemoryFromChat(correction, availableMemories = []) {
    const rankedMemories = availableMemories
      .map((memory) => ({ memory, score: scoreMemoryForCorrection(memory, correction) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.memory.createdAt) - new Date(a.memory.createdAt));
    const target = rankedMemories[0]?.memory;
    if (!target) return { status: "not-found", correction };

    const amended = amendMemoryWithCorrection(target, correction);
    if (!amended) return { status: "not-found", correction };

    const savedMemory = await api.updateCustomerMemory(customer.id, amended.memory);
    setMemories((prev) => {
      if (!prev.some((memory) => memory.id === savedMemory.id)) return [savedMemory, ...prev];
      return prev.map((memory) => (memory.id === savedMemory.id ? savedMemory : memory));
    });

    return {
      status: "updated",
      correction,
      memory: savedMemory,
      changedFields: amended.changedFields,
    };
  }

  function getArticleSourceMemory() {
    if (articleCandidate) {
      return memories.find((memory) => memory.id === articleCandidate.id) ?? articleCandidate;
    }

    return memories.find((memory) => {
      const hasSourceText = memory.body || memory.summary;
      return hasSourceText && ["meeting", "file", "voice", "note"].includes(memory.kind);
    });
  }

  async function createArticleFromLatestMinutes(instruction = "", sourceOverride = null, { notify = true } = {}) {
    const sourceMemory = sourceOverride ?? getArticleSourceMemory();
    if (!sourceMemory) {
      if (notify) {
        addAssistantNotice("Upload meeting minutes or save a client note first, then I can turn it into an internal article.");
      }
      return null;
    }

    const generatedArticle = await api.generateCustomerArticle({
      customer,
      memory: sourceMemory,
      memories,
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
        `Created internal article: **${savedArticle.title}**\n\nPushed to the database, saved under Details > Knowledge > Source files, and indexed for future chatbot answers.`
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
          const savedArticle = await createArticleFromLatestMinutes(
            "Turn these uploaded meeting minutes into an internal article for the advisor knowledge base.",
            savedEntry,
            { notify: false }
          );
          addAssistantNotice(buildMeetingUploadMessage({ customer, memory: savedEntry, article: savedArticle }));
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
        customer,
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

    const memoryUpdateRequest = parseMemoryUpdateRequest(text);
    const intent = getThinkingIntentForPrompt(text, !!articleCandidate);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setValue("");
    const thinkingStartedAt = Date.now();
    setSending(true);
    setThinkingIntent(intent);
    let attemptedMemoryUpdate = false;

    try {
      if (memoryUpdateRequest) {
        attemptedMemoryUpdate = true;
        const latestKnowledge = await refreshCustomerKnowledge();
        const updateResult = await updateCustomerMemoryFromChat(memoryUpdateRequest, latestKnowledge.memories);
        await waitForThinkingSequence(thinkingStartedAt, intent);

        if (updateResult.status === "updated") {
          addAssistantNotice(buildMemoryUpdatedMessage(updateResult));
        } else {
          addAssistantNotice(
            `I could not find "${memoryUpdateRequest.oldValue}" in ${customer.name}'s saved memory, so I did not change anything.`
          );
        }
        return;
      }

      if (isArticleGenerationRequest(text, !!articleCandidate)) {
        await createArticleFromLatestMinutes(text);
        await waitForThinkingSequence(thinkingStartedAt, intent);
        return;
      }

      const latestKnowledge = await refreshCustomerKnowledge();
      const reply = await api.sendCustomerMessage({
        customer,
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
      const sourceMemory =
        memories.find((memory) => memory.id === suggestion.memoryId) ||
        (articleCandidate?.id === suggestion.memoryId ? articleCandidate : null);

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: suggestion.label },
      ]);
      const thinkingStartedAt = Date.now();
      setSending(true);
      setThinkingIntent("article_generation");
      try {
        await createArticleFromLatestMinutes(suggestion.instruction || "", sourceMemory);
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
              className="flex w-fit items-center gap-1 rounded-lg bg-[#f1f1f3] p-1 [&_[data-slot=tab-indicator]]:hidden"
            >
              <TabsTrigger
                value="details"
                className="h-8 rounded-md px-4 text-[14px] font-medium text-[#6b6b70] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-[#317cff] data-[selected]:text-white aria-selected:bg-[#317cff] aria-selected:text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-8 rounded-md px-4 text-[14px] font-medium text-[#6b6b70] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-[#317cff] data-[selected]:text-white aria-selected:bg-[#317cff] aria-selected:text-white"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="meetings"
                className="h-8 rounded-md px-4 text-[14px] font-medium text-[#6b6b70] transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 data-[selected]:bg-[#317cff] data-[selected]:text-white aria-selected:bg-[#317cff] aria-selected:text-white"
              >
                Meetings
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
                <div className="py-10 text-center text-sm text-muted-foreground">Loading workflow…</div>
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

function MeetingRow({ meeting, onOpen }) {
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
      {meeting.notes ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{meeting.notes}</p>
      ) : null}
    </button>
  );
}

function CustomerMeetingsTab({ meetings, onOpen }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Linked meetings</h3>
        <span className="text-xs text-muted-foreground">{meetings.length} scheduled</span>
      </div>
      {meetings.length ? (
        <div className="space-y-2">
          {meetings.map((meeting) => (
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
