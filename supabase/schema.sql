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

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  step text not null,
  at text,
  created_at timestamptz default now()
);

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
alter table agent_runs enable row level security;

create policy "public read" on users for select using (true);
create policy "public read" on badges for select using (true);
create policy "public read" on quests for select using (true);
create policy "public read" on agents for select using (true);
create policy "public read" on mcp_servers for select using (true);
create policy "public read" on agent_runs for select using (true);
