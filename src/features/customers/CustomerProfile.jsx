import { cn } from "@/lib/utils";

/* Client snapshot for the workspace side panel. Renders the rich customer
   record (demographics, financials, policies, life events, relationship,
   compliance) using the same light styling as WorkflowPanel. Every section
   hides itself when the underlying data is missing, so partial records still
   look intentional. */

const DAY = 1000 * 60 * 60 * 24;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonthYear(value) {
  const date = parseDate(value);
  if (!date) return value ?? "";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

function formatFullDate(value) {
  const date = parseDate(value);
  if (!date) return value ?? "";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ageFromDob(value) {
  const dob = parseDate(value);
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function yearsSince(value) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (DAY * 365.25)));
}

function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.round((date.getTime() - Date.now()) / DAY);
}

function daysSince(value) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / DAY);
}

function monthsSince(value) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (DAY * 30.4375));
}

function formatSum(amount) {
  const n = Number(amount);
  if (!n) return null;
  if (n >= 1_000_000) return `RM${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `RM${Math.round(n / 1_000)}k`;
  return `RM${n}`;
}

const TONE = {
  red: "text-red-600",
  amber: "text-amber-600",
  green: "text-emerald-600",
  neutral: "text-[#1a1a1a]",
};

const PILL = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  neutral: "bg-[#f1f1f3] text-[#6b6b70]",
};

function Pill({ tone = "neutral", children }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-[12px] font-medium", PILL[tone])}>
      {children}
    </span>
  );
}

function Section({ label, children }) {
  return (
    <section className="border-b border-[#ededed] py-3 last:border-b-0">
      <h3 className="mb-2 text-[13px] font-semibold text-[#1a1a1a]">{label}</h3>
      {children}
    </section>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-[#9a9aa0]">{label}</p>
      <p className="mt-0.5 text-[14px] font-medium text-[#1a1a1a]">{value}</p>
    </div>
  );
}

// Right-aligned status line used by Policies + Compliance rows.
function Row({ label, value, tone = "neutral" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[13px] text-[#2a2a2e]">{label}</span>
      <span className={cn("shrink-0 text-[12px] font-medium", TONE[tone])}>{value}</span>
    </div>
  );
}

export function CustomerProfile({ customer }) {
  if (!customer) return null;

  const age = ageFromDob(customer.dateOfBirth);
  const demographics = [
    age != null ? `${age}` : null,
    customer.maritalStatus ? String(customer.maritalStatus).toLowerCase() : null,
    customer.occupation ? String(customer.occupation).toLowerCase() : null,
  ].filter(Boolean);

  const clientSinceYears = yearsSince(customer.clientSince);
  const clientSinceLabel = customer.clientSince
    ? `Client since ${formatMonthYear(customer.clientSince)}${clientSinceYears ? ` · ${clientSinceYears} years` : ""}`
    : null;

  const renewalDays = daysUntil(customer.nextRenewal);
  const contactDays = daysSince(customer.lastContactDate);

  const financials = [
    { label: "Income", value: customer.annualIncomeBracket },
    { label: "Net worth", value: customer.netWorthBracket },
    { label: "Risk", value: customer.riskTolerance },
    {
      label: "Horizon",
      value: customer.investmentHorizonYears ? `${customer.investmentHorizonYears} years` : null,
    },
  ].filter((item) => item.value);

  const policies = Array.isArray(customer.policies) ? customer.policies : [];
  const lifeEvents = (Array.isArray(customer.lifeEvents) ? customer.lifeEvents : [])
    .map((event) => ({
      title: event.description ?? event.title ?? event.event,
      mentioned: event.mentioned_date ?? event.mentionedDate,
      expected: event.target_date ?? event.expectedDate ?? event.expected_date,
    }))
    .filter((event) => event.title)
    .sort((a, b) => {
      const da = parseDate(a.expected)?.getTime() ?? Infinity;
      const db = parseDate(b.expected)?.getTime() ?? Infinity;
      return da - db;
    });

  const relationshipPrimary = [customer.rapportNotes, customer.preferredCommunicationChannel]
    .filter(Boolean)
    .join(" · ");
  const relationshipMeta = [
    customer.businessOwnership ? "Owns a business" : null,
    customer.referredBy ? `Referred by ${customer.referredBy}` : "No referral on file",
  ]
    .filter(Boolean)
    .join(" · ");

  const kycTone = /complete/i.test(customer.kycStatus || "")
    ? "green"
    : /pending|progress/i.test(customer.kycStatus || "")
      ? "amber"
      : "red";

  const factFindMonths = monthsSince(customer.lastFactFindDate);
  const factFindDue = factFindMonths != null && factFindMonths >= 12;

  const hasCompliance = customer.kycStatus || customer.lastFactFindDate || customer.hasWill != null || customer.estatePlanStatus;

  return (
    <div className="pb-2">
      <div className="flex items-start gap-2.5">
        {customer.avatar && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
            style={{ backgroundColor: customer.accent }}
          >
            {customer.avatar}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#1a1a1a]">{customer.name}</h2>
          {demographics.length > 0 && (
            <p className="mt-0.5 text-[13px] text-[#6b6b70]">{demographics.join(" · ")}</p>
          )}
          {clientSinceLabel && <p className="mt-0.5 text-[12px] text-[#9a9aa0]">{clientSinceLabel}</p>}
        </div>
      </div>

      {(renewalDays != null || contactDays != null) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {renewalDays != null && renewalDays >= 0 && (
            <Pill tone={renewalDays <= 14 ? "red" : "amber"}>
              {renewalDays === 0 ? "Renews today" : `Renews in ${renewalDays}d`}
            </Pill>
          )}
          {contactDays != null && (
            <Pill tone={contactDays >= 60 ? "amber" : "neutral"}>{contactDays}d since contact</Pill>
          )}
        </div>
      )}

      <div className="mt-1">
        {financials.length > 0 && (
          <Section label="Financial profile">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {financials.map((item) => (
                <Fact key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </Section>
        )}

        {policies.length > 0 && (
          <Section label="Policies">
            {policies.map((policy, index) => {
              const type = policy.policy_type ?? policy.policyType ?? policy.type ?? "Policy";
              const sum = formatSum(policy.sum_assured ?? policy.sumAssured);
              const renewal = policy.renewal_date ?? policy.renewalDate;
              const due = daysUntil(renewal);
              return (
                <Row
                  key={policy.policy_id ?? policy.id ?? index}
                  label={sum ? `${type} · ${sum}` : type}
                  value={renewal ? formatFullDate(renewal) : "—"}
                  tone={due != null && due >= 0 && due <= 14 ? "red" : "neutral"}
                />
              );
            })}
          </Section>
        )}

        {lifeEvents.length > 0 && (
          <Section label="Life events">
            <div className="space-y-2">
              {lifeEvents.map((event, index) => (
                <div key={index}>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{event.title}</p>
                  <p className="mt-0.5 text-[12px] text-[#9a9aa0]">
                    {[
                      event.mentioned ? `Mentioned ${formatFullDate(event.mentioned)}` : null,
                      event.expected ? `expected ${formatFullDate(event.expected)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(relationshipPrimary || relationshipMeta) && (
          <Section label="Relationship">
            {relationshipPrimary && <p className="text-[13px] text-[#2a2a2e]">{relationshipPrimary}</p>}
            {relationshipMeta && <p className="mt-0.5 text-[12px] text-[#9a9aa0]">{relationshipMeta}</p>}
          </Section>
        )}

        {hasCompliance && (
          <Section label="Compliance">
            {customer.kycStatus && <Row label="KYC" value={customer.kycStatus} tone={kycTone} />}
            {customer.lastFactFindDate && (
              <Row
                label="Fact-find"
                value={`${formatMonthYear(customer.lastFactFindDate)}${factFindDue ? " · due refresh" : ""}`}
                tone={factFindDue ? "amber" : "green"}
              />
            )}
            {customer.hasWill != null ? (
              <Row
                label="Will"
                value={customer.hasWill ? "In place" : "Not in place"}
                tone={customer.hasWill ? "green" : "red"}
              />
            ) : (
              customer.estatePlanStatus && <Row label="Estate plan" value={customer.estatePlanStatus} tone="amber" />
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
