import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const importRoot = process.env.AAG_IMPORT_DIR ? path.resolve(process.env.AAG_IMPORT_DIR) : path.resolve(root, "..");
const clientsPath = path.join(importRoot, "aag_clients.json");
const memoriesPath = path.join(importRoot, "aag_memories.json");
const clientsSeedPath = path.join(root, "supabase/aag_clients.sql");
const memoriesSeedPath = path.join(root, "supabase/aag_memories.sql");
const seedPath = path.join(root, "supabase/aag_seed.sql");
const customerTasksPath = path.join(root, "supabase/2026-06-21-customer-task-variety.sql");

const clients = JSON.parse(fs.readFileSync(clientsPath, "utf8"));
const memories = JSON.parse(fs.readFileSync(memoriesPath, "utf8"));

function sqlString(value) {
  if (value == null || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlBool(value) {
  return value == null ? "null" : value ? "true" : "false";
}

function sqlInt(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : "null";
}

function sqlJson(value) {
  return `$json$${JSON.stringify(value ?? [])}$json$::jsonb`;
}

function sqlTextArray(values) {
  const clean = (values ?? []).filter(Boolean);
  if (!clean.length) return "'{}'";
  return `array[${clean.map(sqlString).join(", ")}]`;
}

function getNextRenewal(policies = []) {
  return policies
    .map((policy) => ({ ...policy, date: policy.renewal_date, type: policy.policy_type }))
    .filter((policy) => policy.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] ?? null;
}

function formatPolicySummary(policies = []) {
  if (!policies.length) return "";
  const types = [...new Set(policies.map((policy) => policy.policy_type).filter(Boolean))];
  return `${policies.length} ${policies.length === 1 ? "policy" : "policies"}${types.length ? `: ${types.join(", ")}` : ""}`;
}

const CUSTOMER_TASKS = [
  // Compliance and profile maintenance
  "Refresh KYC documents",
  "Confirm source of funds",
  "Validate identity details",
  "Update address proof",
  "Complete risk profile",
  "Review fact-find notes",
  "Verify income declaration",
  "Confirm marketing consent",
  "Update occupation details",
  "Check contact information",
  // Portfolio and planning
  "Schedule annual review",
  "Prepare portfolio summary",
  "Review investment allocation",
  "Rebalance growth portfolio",
  "Assess risk tolerance",
  "Review fund performance",
  "Discuss retirement goals",
  "Model retirement shortfall",
  "Review cash reserves",
  "Update net-worth statement",
  // Protection and renewals
  "Review medical renewal",
  "Compare life coverage",
  "Check critical illness gap",
  "Review policy exclusions",
  "Confirm premium affordability",
  "Verify beneficiary nominations",
  "Review sum assured",
  "Prepare renewal options",
  "Check claims eligibility",
  "Consolidate policy schedule",
  // Estate planning
  "Schedule will consultation",
  "Confirm intended heirs",
  "Review executor choice",
  "Discuss guardian nomination",
  "Check estate-plan progress",
  "Prepare estate checklist",
  "Review trust options",
  "Update legacy objectives",
  "Confirm asset distribution",
  "Review nomination forms",
  // Business protection
  "Plan business succession",
  "Review shareholder protection",
  "Assess key-person coverage",
  "Update business valuation",
  "Review loan protection",
  "Discuss buy-sell agreement",
  "Verify ownership structure",
  "Prepare succession briefing",
  "Review continuity risks",
  "Confirm successor readiness",
  // Family planning
  "Review education funding",
  "Update dependent details",
  "Model university costs",
  "Check child coverage",
  "Confirm guardian details",
  "Review family protection",
  "Update household budget",
  "Assess dependency needs",
  "Review spouse coverage",
  "Plan milestone funding",
  // Client communication
  "Send WhatsApp follow-up",
  "Email document checklist",
  "Call to confirm appointment",
  "Share renewal reminder",
  "Request signed forms",
  "Chase outstanding documents",
  "Send meeting summary",
  "Confirm preferred channel",
  "Schedule phone check-in",
  "Send action recap",
  // Liabilities and affordability
  "Review mortgage protection",
  "Check car-loan coverage",
  "Assess debt exposure",
  "Update liability summary",
  "Review emergency fund",
  "Model debt repayment",
  "Check affordability ratio",
  "Review cash-flow needs",
  "Confirm outstanding loans",
  "Map protection gaps",
  // Relationship management
  "Review referral details",
  "Update client profile",
  "Log latest interaction",
  "Confirm next meeting",
  "Prepare advisory brief",
  "Review client goals",
  "Update relationship notes",
  "Check service preferences",
  "Schedule progress call",
  "Close pending follow-up",
  // Specialist reviews
  "Review travel coverage",
  "Check general insurance",
  "Compare medical riders",
  "Review investment charges",
  "Assess inflation exposure",
  "Check policy maturity",
  "Update nomination records",
  "Prepare coverage summary",
  "Review tax relief options",
  "Plan next annual review",
];

function getNextAction(client) {
  const numericId = Number(String(client.client_id ?? "").match(/\d+$/)?.[0]);
  const taskIndex = Number.isInteger(numericId) && numericId > 0 ? numericId - 1 : 0;
  return CUSTOMER_TASKS[taskIndex % CUSTOMER_TASKS.length];
}

function getStatus(client) {
  if (client.kyc_status && client.kyc_status !== "Completed") return "Action needed";
  if (!client.has_will || client.estate_plan_status !== "Completed") return "Action needed";
  return "Monitoring";
}

function customerRow(client) {
  const renewal = getNextRenewal(client.policies);
  const task = getNextAction(client);
  const tags = [client.risk_tolerance, client.kyc_status, renewal?.type].filter(Boolean);

  return `  (${[
    sqlString(client.client_id),
    sqlString(client.full_name),
    sqlString(`${client.occupation || "Client"} · ${client.preferred_communication_channel || "Not recorded"}`),
    "null",
    "null",
    sqlString(getStatus(client)),
    sqlString(client.annual_income_bracket),
    sqlString(client.net_worth_bracket),
    sqlString(task),
    sqlString(task),
    getStatus(client) === "Action needed" ? "true" : "false",
    sqlTextArray(tags),
    sqlString(client.full_name),
    sqlString(client.date_of_birth),
    sqlString(client.gender),
    sqlString(client.ethnicity),
    sqlString(client.marital_status),
    sqlString(client.occupation),
    sqlInt(client.number_of_dependents),
    sqlString(client.nationality),
    sqlString(client.assigned_advisor_id),
    sqlString(client.client_since_date),
    sqlString(client.acquisition_channel),
    sqlString(client.referred_by),
    sqlString(client.annual_income_bracket),
    sqlString(client.net_worth_bracket),
    sqlString(client.risk_tolerance),
    sqlInt(client.investment_horizon_years),
    sqlString(client.liabilities_summary),
    sqlJson(client.policies),
    sqlJson(client.family_members),
    sqlBool(client.has_will),
    sqlString(client.estate_plan_status),
    sqlBool(client.business_ownership),
    sqlString(client.intended_heirs),
    sqlString(client.last_contact_date),
    sqlString(client.preferred_communication_channel),
    sqlString(client.kyc_status),
    sqlString(client.last_fact_find_date),
    sqlBool(client.consent_marketing),
    sqlString(client.created_at),
    sqlString(client.updated_at),
    sqlInt(client.policies?.length ?? 0),
    sqlString(formatPolicySummary(client.policies ?? [])),
    sqlString(renewal?.date),
    sqlString(renewal?.type),
  ].join(", ")})`;
}

function memoryRow(memory) {
  const body = String(memory.consolidated_memory ?? "").trim();
  const summary = body.split(/\n{2,}/)[0]?.trim() || body.slice(0, 240);

  return `  (${[
    sqlString(`aag-memory-${memory.client_id}`),
    sqlString(memory.client_id),
    sqlString("profile"),
    sqlString("Consolidated client memory"),
    sqlString(summary),
    sqlString(body),
    sqlString("AAG memory synthesis"),
    sqlString(`${memory.source_interaction_count ?? 0} source interactions`),
    sqlString(memory.last_synthesized_date),
  ].join(", ")})`;
}

const clientsSql = `-- Generated from aag_clients.json.
-- Rebuild with: npm run sync:aag

alter table customers add column if not exists family_members jsonb not null default '[]'::jsonb;
alter table customers add column if not exists ethnicity text;

delete from customers where id like 'CL-%';

insert into customers (
  id,
  name,
  contact,
  email,
  phone,
  status,
  tier,
  value,
  next_action,
  task,
  overdue,
  tags,
  contact_name,
  date_of_birth,
  gender,
  ethnicity,
  marital_status,
  occupation,
  dependents,
  nationality,
  assigned_advisor_id,
  client_since_date,
  acquisition_channel,
  referred_by,
  annual_income_bracket,
  net_worth_bracket,
  risk_tolerance,
  investment_horizon_years,
  liabilities_summary,
  policies,
  family_members,
  has_will,
  estate_plan_status,
  business_ownership,
  intended_heirs,
  last_contact_date,
  preferred_communication_channel,
  kyc_status,
  last_fact_find_date,
  consent_marketing,
  created_at,
  updated_at,
  policy_count,
  policy_summary,
  next_renewal,
  next_renewal_policy_type
) values
${clients.map(customerRow).join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  contact = excluded.contact,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  tier = excluded.tier,
  value = excluded.value,
  next_action = excluded.next_action,
  task = excluded.task,
  overdue = excluded.overdue,
  tags = excluded.tags,
  contact_name = excluded.contact_name,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  ethnicity = excluded.ethnicity,
  marital_status = excluded.marital_status,
  occupation = excluded.occupation,
  dependents = excluded.dependents,
  nationality = excluded.nationality,
  assigned_advisor_id = excluded.assigned_advisor_id,
  client_since_date = excluded.client_since_date,
  acquisition_channel = excluded.acquisition_channel,
  referred_by = excluded.referred_by,
  annual_income_bracket = excluded.annual_income_bracket,
  net_worth_bracket = excluded.net_worth_bracket,
  risk_tolerance = excluded.risk_tolerance,
  investment_horizon_years = excluded.investment_horizon_years,
  liabilities_summary = excluded.liabilities_summary,
  policies = excluded.policies,
  family_members = excluded.family_members,
  has_will = excluded.has_will,
  estate_plan_status = excluded.estate_plan_status,
  business_ownership = excluded.business_ownership,
  intended_heirs = excluded.intended_heirs,
  last_contact_date = excluded.last_contact_date,
  preferred_communication_channel = excluded.preferred_communication_channel,
  kyc_status = excluded.kyc_status,
  last_fact_find_date = excluded.last_fact_find_date,
  consent_marketing = excluded.consent_marketing,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  policy_count = excluded.policy_count,
  policy_summary = excluded.policy_summary,
  next_renewal = excluded.next_renewal,
  next_renewal_policy_type = excluded.next_renewal_policy_type;
`;

const customerTasksSql = `-- Generated from aag_clients.json.
-- Non-destructive task refresh. Rebuild with: npm run sync:aag

update customers as customer
set
  task = task_seed.task
from (values
${clients.map((client) => `  (${sqlString(client.client_id)}, ${sqlString(getNextAction(client))})`).join(",\n")}
) as task_seed(id, task)
where customer.id = task_seed.id;
`;

const memoriesSql = `-- Generated from aag_memories.json.
-- Rebuild with: npm run sync:aag

create table if not exists customer_memories (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  kind text not null default 'note',
  title text not null,
  summary text not null,
  body text,
  source_name text,
  source_meta text,
  created_at timestamptz default now()
);

alter table customer_memories add column if not exists body text;

alter table customer_memories enable row level security;
drop policy if exists "public read" on customer_memories;
drop policy if exists "public insert" on customer_memories;
create policy "public read" on customer_memories for select using (true);
create policy "public insert" on customer_memories for insert with check (true);

delete from customer_memories where customer_id like 'CL-%' or source_name in ('AAG dataset', 'AAG memory synthesis');

insert into customer_memories (
  id,
  customer_id,
  kind,
  title,
  summary,
  body,
  source_name,
  source_meta,
  created_at
) values
${memories.map(memoryRow).join(",\n")}
on conflict (id) do update set
  customer_id = excluded.customer_id,
  kind = excluded.kind,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  source_name = excluded.source_name,
  source_meta = excluded.source_meta,
  created_at = excluded.created_at;
`;

fs.writeFileSync(clientsSeedPath, clientsSql);
fs.writeFileSync(memoriesSeedPath, memoriesSql);
fs.writeFileSync(seedPath, `${clientsSql}\n${memoriesSql}`);
fs.writeFileSync(customerTasksPath, customerTasksSql);
console.log(`Wrote ${path.relative(root, clientsSeedPath)} from ${clients.length} clients.`);
console.log(`Wrote ${path.relative(root, memoriesSeedPath)} from ${memories.length} memories.`);
console.log(`Wrote combined ${path.relative(root, seedPath)}.`);
console.log(`Wrote non-destructive ${path.relative(root, customerTasksPath)}.`);
