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
  created_at timestamptz default now()
);

create table if not exists customer_memories (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  kind text not null default 'note',
  title text not null,
  summary text not null,
  source_name text,
  source_meta text,
  created_at timestamptz default now()
);

insert into customers (
  id,
  name,
  contact,
  avatar,
  accent,
  status,
  tier,
  seats,
  value,
  last_touch,
  next_action,
  due,
  overdue,
  tags
) values
  ('cust1', 'Greenleaf', 'Maya Chen · VP Sales', 'GL', '#3bd4cb', 'Negotiation', 'Enterprise', 52, '$148k', '2d ago', 'Send security review', 'Today', true, array['AI', 'Migration']),
  ('cust2', 'Northwind Labs', 'Dev Okafor · Head of RevOps', 'NL', '#317cff', 'Proposal', 'Mid-market', 24, '$61k', '5d ago', 'Share ROI deck', 'Tomorrow', false, array['Expansion']),
  ('cust3', 'Atlas Freight', 'Priya Nair · COO', 'AF', '#ec5d40', 'Qualified', 'Enterprise', 80, '$210k', '1d ago', 'Book technical demo', 'Thu', false, array['Logistics', 'ICP fit']),
  ('cust4', 'Sunrise Retail', 'Tom Becker · Director', 'SR', '#4991e5', 'Won', 'Mid-market', 18, '$44k', 'Today', 'Kickoff onboarding', 'Fri', false, array['Closed']),
  ('cust5', 'Quanta Health', 'Dr. Lena Voss · CIO', 'QH', '#39bdd6', 'Churn-risk', 'Enterprise', 64, '$172k', '21d ago', 'Re-engage exec sponsor', 'Overdue', true, array['At risk', 'Renewal']),
  ('cust6', 'Beacon Studios', 'Iris Wong · Founder', 'BS', '#3bd4cb', 'Lead', 'Startup', 9, '$12k', '8d ago', 'Qualify budget', 'Next week', false, array['Inbound'])
on conflict (id) do nothing;

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
alter table customer_memories enable row level security;

create policy "public read" on users for select using (true);
create policy "public read" on badges for select using (true);
create policy "public read" on quests for select using (true);
create policy "public read" on agents for select using (true);
create policy "public read" on mcp_servers for select using (true);
create policy "public read" on connectors for select using (true);
create policy "public read" on agent_runs for select using (true);
create policy "public read" on customers for select using (true);
create policy "public read" on customer_memories for select using (true);
create policy "public insert" on customer_memories for insert with check (true);
