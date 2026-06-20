import { useLayoutEffect, useRef, useState } from "react";
import { ChevronUp, Code, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleEditor, SourceFileRow } from "@/features/customers/ArticleEditor";

/* Client workflow configuration panel. */

const ACCENT = "#266df0"; // blue used for active toggles + connect link

function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-150",
        checked ? "bg-[#266df0]" : "bg-[#e3e3e6]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      style={checked ? { backgroundColor: ACCENT } : undefined}
    >
      <span
        className={cn(
          "inline-block size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

function Section({ label, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#1a1a1a]">{label}</h3>
        <div className="flex items-center gap-1.5 text-[#bdbdc2]">
          <button
            type="button"
            aria-label={`About ${label}`}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]"
          >
            <Info className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            onClick={() => setOpen((value) => !value)}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]"
          >
            <ChevronUp className={cn("size-4 transition-transform duration-150", !open && "rotate-180")} strokeWidth={2} />
          </button>
        </div>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </>
  );
}

// Borderless auto-growing textarea for inline workflow notes.
function EditableText({ value, onChange, placeholder, italic = false, ariaLabel }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value ?? ""}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "-mx-2 block w-[calc(100%+1rem)] resize-none rounded-md bg-transparent px-2 py-1 text-[15px] leading-[1.55] text-[#2a2a2e] outline-none transition-colors placeholder:text-[#b0b0b6] hover:bg-black/[0.025] focus:bg-black/[0.04]",
        italic && "placeholder:italic"
      )}
    />
  );
}

function RecordsMark() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-[#f5a623] text-[11px] font-bold lowercase text-white">
      r
    </span>
  );
}

function DocumentsMark() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-[#266df0] text-[11px] font-bold lowercase text-white">
      d
    </span>
  );
}

function MessagesMark() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-[#7048e8] text-[11px] font-bold lowercase text-white">
      m
    </span>
  );
}

function initialsFor(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function WorkflowHeader({ customer }) {
  const customerName = customer?.name || "Customer";
  const ownerLabel = customer?.advisorId ? `Managed by ${customer.advisorId}` : "Advisor unassigned";
  const statusLabel = customer?.task || customer?.nextAction || customer?.kycStatus || "No next action recorded";
  const tagLabel = customer?.acquisitionChannel || customer?.preferredCommunicationChannel || customer?.kycStatus || "Client";
  const avatar = customer?.avatar || initialsFor(customerName) || "C";
  const accent = customer?.accent || "#868e96";

  return (
    <>
      <div
        className="flex size-[48px] items-center justify-center rounded-xl text-[18px] font-semibold text-white"
        style={{ backgroundColor: accent }}
      >
        {avatar}
      </div>

      <h1 className="mt-3 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a]">
        {customerName}
      </h1>
      <p className="mt-1 text-[13px] text-[#9a9aa0]">{statusLabel}</p>

      <div className="mt-2.5 flex min-w-0 items-center gap-2 text-[13px] text-[#3f3f46]">
        <span
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {initialsFor(customer?.advisorId) || avatar[0] || "A"}
        </span>
        <span className="min-w-0 truncate">{ownerLabel}</span>
        <span className="ml-0.5 inline-flex min-w-0 max-w-[150px] items-center gap-1 rounded-md bg-[#f1f1f3] px-1.5 py-0.5 text-[12px] text-[#6b6b70]">
          <span className="shrink-0 text-[#a0a0a6]">#</span>
          <span className="min-w-0 truncate">{tagLabel}</span>
        </span>
      </div>

    </>
  );
}

function formatProfileDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function computeAge(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const today = new Date();
  const monthNow = today.getMonth() + 1;
  let age = today.getFullYear() - year;
  if (monthNow < month || (monthNow === month && today.getDate() < day)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function formatHorizon(years) {
  const value = Number(years);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${value} ${value === 1 ? "year" : "years"}`;
}

// Conservative / Moderate / Aggressive get a scannable status dot.
const RISK_DOT_COLOR = { Conservative: "#16a06a", Moderate: "#e0992a", Aggressive: "#d9534f" };

function ProfileRow({ label, value, dotColor }) {
  const hasValue = value === 0 || Boolean(value);
  return (
    <div className="flex items-baseline justify-between gap-4 py-[5px]">
      <span className="shrink-0 text-[13px] text-[#9a9aa0]">{label}</span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-right text-[13px] font-medium",
          hasValue ? "text-[#2a2a2e]" : "text-[#c0c0c6]"
        )}
      >
        {hasValue && dotColor ? (
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <span className="min-w-0 truncate">{hasValue ? String(value) : "Not recorded"}</span>
      </span>
    </div>
  );
}

// Read-only biography + fact-find snapshot, sourced from the customer record
// (Supabase `customers` row). Matches the panel's existing light styling.
export function CustomerProfileCard({ customer }) {
  if (!customer) return null;

  const age = computeAge(customer.dateOfBirth);
  const dobDisplay = customer.dateOfBirth
    ? `${formatProfileDate(customer.dateOfBirth)}${age != null ? ` (${age})` : ""}`
    : "";
  const dependents =
    customer.dependents === 0 || customer.dependents ? String(customer.dependents) : "";

  return (
    <div className="text-[#2a2a2e]">
      <Section label="Biography">
        <div className="-mt-1">
          <ProfileRow label="Date of birth" value={dobDisplay} />
          <ProfileRow label="Gender" value={customer.gender} />
          <ProfileRow label="Marital status" value={customer.maritalStatus} />
          <ProfileRow label="Occupation" value={customer.occupation} />
          <ProfileRow label="Nationality" value={customer.nationality} />
          <ProfileRow label="Ethnicity" value={customer.ethnicity} />
          <ProfileRow label="Dependents" value={dependents} />
        </div>
      </Section>

      <Section label="Financial profile">
        <div className="-mt-1">
          <ProfileRow label="Annual income" value={customer.annualIncomeBracket} />
          <ProfileRow label="Net worth" value={customer.netWorthBracket} />
          <ProfileRow
            label="Risk tolerance"
            value={customer.riskTolerance}
            dotColor={RISK_DOT_COLOR[customer.riskTolerance]}
          />
          <ProfileRow label="Investment horizon" value={formatHorizon(customer.investmentHorizonYears)} />
        </div>
      </Section>
    </div>
  );
}

// Controlled: parent owns `config` + `articles` and persists changes.
export function WorkflowDetails({ config, onChange, articles = [], onSaveArticle, onDeleteArticle }) {
  const knowledge = config.knowledge ?? {};
  const tools = config.tools ?? {};

  const setField = (field, value) => onChange({ ...config, [field]: value });
  const setKnowledge = (key, value) => onChange({ ...config, knowledge: { ...knowledge, [key]: value } });
  const setTools = (key, value) => onChange({ ...config, tools: { ...tools, [key]: value } });
  const [editing, setEditing] = useState(null); // { article } | { article: null } for new

  async function saveArticle(article) {
    await onSaveArticle?.(article);
    setEditing(null);
  }

  async function deleteArticle(articleId) {
    await onDeleteArticle?.(articleId);
    setEditing(null);
  }
  return (
    <div className="text-[#2a2a2e]">
      <Section label="Notes">
        <EditableText
          ariaLabel="Notes"
          value={config.notes}
          onChange={(value) => setField("notes", value)}
          placeholder="Add notes, reminders, or client context..."
        />
      </Section>

      <Section label="Communication style">
        <EditableText
          ariaLabel="Communication style"
          italic
          value={config.tone}
          onChange={(value) => setField("tone", value)}
          placeholder="Type e.g. concise, detailed, objective, warm, etc."
        />
      </Section>

      <div className="mt-3 border-t border-[#ededed] pt-1">
        <p className="py-2 font-mono text-[11px] uppercase tracking-wide text-[#a0a0a6]">Source files</p>
        {articles.length > 0 ? (
          articles.map((article) => (
            <SourceFileRow
              key={article.id}
              title={article.title || "Untitled internal article"}
              subtitle={article.subtitle || article.type || "Internal article"}
              onClick={() => setEditing({ article })}
            />
          ))
        ) : (
          <p className="py-2 text-[13px] leading-5 text-[#8a8a8f]">No internal articles saved yet.</p>
        )}

        <button
          type="button"
          onClick={() => setEditing({ article: null })}
          className="mt-1 flex items-center gap-2 py-1.5 text-[15px] text-[#6b6b70] transition-colors hover:text-[#1a1a1a]"
        >
          <Plus className="size-4" strokeWidth={2} />
          New source file
        </button>
      </div>

      <Section label="Workflow capabilities">
        <div className="-mt-1">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <Code className="size-[18px] text-[#3f3f46]" strokeWidth={1.9} />
              <span className="text-[15px]">Code Interpreter</span>
            </div>
            <Toggle label="Code Interpreter" checked={!!tools.code} onChange={(value) => setTools("code", value)} />
          </div>
        </div>
      </Section>

      {editing && (
        <ArticleEditor
          article={editing.article}
          onClose={() => setEditing(null)}
          onSave={saveArticle}
          onDelete={deleteArticle}
        />
      )}
    </div>
  );
}
