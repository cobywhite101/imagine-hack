-- Supabase schema mirroring src/data/mock.js.
-- Run in the Supabase SQL editor when you're ready to leave mock mode.
-- After running, set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local
-- and the app switches to live data automatically.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text,
  points int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  created_at timestamptz default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  description text,
  earned boolean default false
);

create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  points int not null default 0,
  status text not null default 'todo' -- todo | in_progress | done
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text default 'idle',
  model text,
  runs int default 0
);

create table if not exists mcp_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  connected boolean default false,
  tools int default 0
);

create table if not exists connectors (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  icon_url text,
  featured boolean default true,
  connected boolean default false,
  tools int default 0,
  category text,
  created_at timestamptz default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  step text not null,
  at text,
  created_at timestamptz default now()
);

create table if not exists customers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  contact text,
  email text,
  phone text,
  avatar text,
  accent text,
  status text not null default 'Monitoring',
  tier text,
  seats int,
  value text,
  last_touch text,
  next_action text,
  task text,
  due text,
  overdue boolean not null default false,
  tags text[] not null default '{}',
  contact_name text,
  date_of_birth date,
  gender text,
  marital_status text,
  occupation text,
  dependents int,
  nationality text,
  ethnicity text,
  assigned_advisor_id text,
  client_since_date date,
  acquisition_channel text,
  referred_by text,
  annual_income_bracket text,
  net_worth_bracket text,
  risk_tolerance text,
  investment_horizon_years int,
  liabilities_summary text,
  policies jsonb not null default '[]'::jsonb,
  family_members jsonb not null default '[]'::jsonb,
  has_will boolean,
  estate_plan_status text,
  business_ownership boolean,
  intended_heirs text,
  life_events jsonb not null default '[]'::jsonb,
  last_contact_date date,
  preferred_communication_channel text,
  rapport_notes text,
  kyc_status text,
  last_fact_find_date date,
  consent_marketing boolean,
  policy_count int,
  policy_summary text,
  next_renewal date,
  next_renewal_policy_type text,
  next_life_event text,
  next_life_event_date date,
  updated_at timestamptz,
  created_at timestamptz default now()
);

alter table customers add column if not exists phone text;
alter table customers add column if not exists contact_name text;
alter table customers add column if not exists date_of_birth date;
alter table customers add column if not exists gender text;
alter table customers add column if not exists marital_status text;
alter table customers add column if not exists occupation text;
alter table customers add column if not exists dependents int;
alter table customers add column if not exists nationality text;
alter table customers add column if not exists ethnicity text;
alter table customers add column if not exists assigned_advisor_id text;
alter table customers add column if not exists client_since_date date;
alter table customers add column if not exists acquisition_channel text;
alter table customers add column if not exists referred_by text;
alter table customers add column if not exists annual_income_bracket text;
alter table customers add column if not exists net_worth_bracket text;
alter table customers add column if not exists risk_tolerance text;
alter table customers add column if not exists investment_horizon_years int;
alter table customers add column if not exists liabilities_summary text;
alter table customers add column if not exists policies jsonb not null default '[]'::jsonb;
alter table customers add column if not exists family_members jsonb not null default '[]'::jsonb;
alter table customers add column if not exists has_will boolean;
alter table customers add column if not exists estate_plan_status text;
alter table customers add column if not exists business_ownership boolean;
alter table customers add column if not exists intended_heirs text;
alter table customers add column if not exists life_events jsonb not null default '[]'::jsonb;
alter table customers add column if not exists last_contact_date date;
alter table customers add column if not exists preferred_communication_channel text;
alter table customers add column if not exists rapport_notes text;
alter table customers add column if not exists kyc_status text;
alter table customers add column if not exists last_fact_find_date date;
alter table customers add column if not exists consent_marketing boolean;
alter table customers add column if not exists policy_count int;
alter table customers add column if not exists policy_summary text;
alter table customers add column if not exists next_renewal date;
alter table customers add column if not exists next_renewal_policy_type text;
alter table customers add column if not exists next_life_event text;
alter table customers add column if not exists next_life_event_date date;
alter table customers add column if not exists updated_at timestamptz;

create table if not exists advisor_tasks (
  id text primary key default gen_random_uuid()::text,
  customer_id text references customers(id) on delete set null,
  title text not null,
  icon text,
  priority text,
  category text,
  status text not null default 'To Do',
  notes text,
  due_date date,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists advisor_tasks_customer_id_idx
  on advisor_tasks (customer_id);
create index if not exists advisor_tasks_status_due_date_idx
  on advisor_tasks (status, due_date);

create table if not exists advisor_meetings (
  id text primary key default gen_random_uuid()::text,
  customer_id text references customers(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  notes text,
  status text not null default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists advisor_meetings_customer_id_idx
  on advisor_meetings (customer_id);
create index if not exists advisor_meetings_starts_at_idx
  on advisor_meetings (starts_at);

-- Customer seed data lives in supabase/aag_clients.sql.
-- Run supabase/aag_seed.sql after this schema to ingest the AAG dataset.

-- Atomic point award used by api.awardPoints().
create or replace function award_points(p_user_id uuid, p_points int)
returns void language sql as $$
  update users set points = points + p_points where id = p_user_id;
$$;

-- Demo is read-only public; tighten these before anything real.
alter table users enable row level security;
alter table badges enable row level security;
alter table quests enable row level security;
alter table agents enable row level security;
alter table mcp_servers enable row level security;
alter table connectors enable row level security;
alter table agent_runs enable row level security;
alter table customers enable row level security;
alter table advisor_tasks enable row level security;
alter table advisor_meetings enable row level security;

drop policy if exists "public read" on users;
drop policy if exists "public read" on badges;
drop policy if exists "public read" on quests;
drop policy if exists "public read" on agents;
drop policy if exists "public read" on mcp_servers;
drop policy if exists "public read" on connectors;
drop policy if exists "public read" on agent_runs;
drop policy if exists "public read" on customers;
drop policy if exists "public read" on advisor_tasks;
drop policy if exists "public insert" on advisor_tasks;
drop policy if exists "public update" on advisor_tasks;
drop policy if exists "public delete" on advisor_tasks;
drop policy if exists "public read" on advisor_meetings;
drop policy if exists "public insert" on advisor_meetings;
drop policy if exists "public update" on advisor_meetings;
drop policy if exists "public delete" on advisor_meetings;

create policy "public read" on users for select using (true);
create policy "public read" on badges for select using (true);
create policy "public read" on quests for select using (true);
create policy "public read" on agents for select using (true);
create policy "public read" on mcp_servers for select using (true);
create policy "public read" on connectors for select using (true);
create policy "public read" on agent_runs for select using (true);
create policy "public read" on customers for select using (true);
create policy "public read" on advisor_tasks for select using (true);
create policy "public insert" on advisor_tasks for insert with check (true);
create policy "public update" on advisor_tasks for update using (true) with check (true);
create policy "public delete" on advisor_tasks for delete using (true);
create policy "public read" on advisor_meetings for select using (true);
create policy "public insert" on advisor_meetings for insert with check (true);
create policy "public update" on advisor_meetings for update using (true) with check (true);
create policy "public delete" on advisor_meetings for delete using (true);
