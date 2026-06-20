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
    .map((policy) => ({
      date: policy.renewal_date,
      type: policy.policy_type,
    }))
    .filter((policy) => policy.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] ?? null;
}

function formatPolicySummary(policies = []) {
  if (!policies.length) return "";
  const types = [...new Set(policies.map((policy) => policy.policy_type).filter(Boolean))];
  return `${policies.length} ${policies.length === 1 ? "policy" : "policies"}${types.length ? `: ${types.join(", ")}` : ""}`;
}

function getNextAction(client) {
  const renewal = getNextRenewal(client.policies);
  if (client.kyc_status && client.kyc_status !== "Completed") return "Complete KYC follow-up";
  if (!client.has_will || client.estate_plan_status !== "Completed") return "Discuss will planning";
  if (renewal?.type) return `Review ${renewal.type} renewal`;
  return "Schedule annual portfolio review";
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
console.log(`Wrote ${path.relative(root, clientsSeedPath)} from ${clients.length} clients.`);
console.log(`Wrote ${path.relative(root, memoriesSeedPath)} from ${memories.length} memories.`);
console.log(`Wrote combined ${path.relative(root, seedPath)}.`);
