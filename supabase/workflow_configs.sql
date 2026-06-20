-- Per-customer workflow configuration for the workspace Details panel.
-- The `config` blob holds the workflow brief, notes, communication style,
-- and source/capability toggles. Run after schema.sql so the customers
-- table exists.

create table if not exists workflow_configs (
  customer_id text primary key references customers(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table workflow_configs enable row level security;

drop policy if exists "public read" on workflow_configs;
drop policy if exists "public upsert" on workflow_configs;
drop policy if exists "public update" on workflow_configs;

create policy "public read" on workflow_configs for select using (true);
create policy "public upsert" on workflow_configs for insert with check (true);
create policy "public update" on workflow_configs for update using (true) with check (true);
